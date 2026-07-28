import { config } from "dotenv";
import postgres from "postgres";
import { readFileSync, readdirSync } from "node:fs";

config({ path: ".env.local" });

// Ensaia uma migração contra o banco REAL sem deixar rastro.
//
// DDL no Postgres é transacional: aplicamos a migração inteira numa
// transação, verificamos o resultado e damos ROLLBACK. Valida contra o
// schema de produção de verdade — com as tabelas, os enums e os dados que
// existem lá — sem precisar de Docker nem de uma cópia do banco.
//
// É o ritual descrito no AGENTS.md, agora executável:
//   npm run db:rehearse                  (ensaia a última migração)
//   npm run db:rehearse 0009_third_iceman.sql
//
// NUNCA aplica nada. Para aplicar de verdade: npm run db:migrate.

const MIGRATIONS_DIR = "lib/db/migrations";

/** Invariantes que precisam sobreviver a qualquer migração deste banco. */
async function contarInvariantes(sql) {
  const uma = async (query) => (await query)[0].n;
  return {
    grupos: await uma(sql`select count(*)::int as n from groups`),
    convidados: await uma(sql`select count(*)::int as n from guests`),
    confirmados: await uma(
      sql`select count(*)::int as n from guests where rsvp_status = 'confirmed'`
    ),
    groupsBackup: await uma(sql`select count(*)::int as n from groups_backup`),
    guestsBackup: await uma(sql`select count(*)::int as n from guests_backup`),
    orderPhotos: await uma(sql`select count(*)::int as n from order_photos`),
    sites: await uma(sql`select count(*)::int as n from sites`),
  };
}

async function listarTabelas(sql) {
  const rows = await sql`
    select table_name from information_schema.tables
    where table_schema = 'public' order by table_name
  `;
  return rows.map((r) => r.table_name);
}

async function main() {
  const url = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não definida");

  const arquivo =
    process.argv[2] ??
    readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort()
      .pop();

  if (!arquivo) throw new Error("Nenhuma migração encontrada");

  const sqlText = readFileSync(`${MIGRATIONS_DIR}/${arquivo}`, "utf8");
  const statements = sqlText
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);

  console.log(`Ensaiando ${arquivo} (${statements.length} statements)\n`);

  const sql = postgres(url, { prepare: false, max: 1 });

  const antes = await contarInvariantes(sql);
  const tabelasAntes = await listarTabelas(sql);
  console.log("antes: ", antes);

  const ROLLBACK = "__ROLLBACK_PROPOSITAL__";
  let falha = null;

  try {
    await sql.begin(async (tx) => {
      for (const stmt of statements) {
        await tx.unsafe(stmt);
      }

      const tabelasDepois = await listarTabelas(tx);
      const novas = tabelasDepois.filter((t) => !tabelasAntes.includes(t));
      const sumidas = tabelasAntes.filter((t) => !tabelasDepois.includes(t));

      console.log(`\ntabelas novas:   ${novas.join(", ") || "(nenhuma)"}`);
      console.log(`tabelas SUMIDAS: ${sumidas.join(", ") || "(nenhuma)"}`);

      for (const t of novas) {
        const cols = await tx`
          select column_name, data_type, is_nullable
          from information_schema.columns
          where table_schema = 'public' and table_name = ${t}
          order by ordinal_position
        `;
        console.log(`\n  ${t} (${cols.length} colunas)`);
        for (const c of cols) {
          const nn = c.is_nullable === "NO" ? " not null" : "";
          console.log(`    ${c.column_name.padEnd(18)} ${c.data_type}${nn}`);
        }
      }

      // Uma migração que derruba tabela neste banco é sempre erro — foi
      // exatamente isso que o `drizzle-kit push` tentou fazer um dia.
      if (sumidas.length > 0) {
        throw new Error(`A migração DERRUBA tabelas: ${sumidas.join(", ")}`);
      }

      const dentro = await contarInvariantes(tx);
      const mexeu = Object.keys(antes).filter((k) => antes[k] !== dentro[k]);
      console.log(
        `\ncontagens alteradas pela migração: ${mexeu.join(", ") || "(nenhuma)"}`
      );
      if (mexeu.length > 0) {
        throw new Error(`A migração altera dados existentes: ${mexeu.join(", ")}`);
      }

      throw new Error(ROLLBACK);
    });
  } catch (e) {
    if (e.message !== ROLLBACK) falha = e;
  }

  const depois = await contarInvariantes(sql);
  const tabelasFinais = await listarTabelas(sql);
  const voltou =
    JSON.stringify(antes) === JSON.stringify(depois) &&
    JSON.stringify(tabelasAntes) === JSON.stringify(tabelasFinais);

  console.log("\ndepois:", depois);
  console.log(`banco voltou ao estado original: ${voltou}`);

  await sql.end();

  if (falha) {
    console.error(`\nENSAIO REPROVADO: ${falha.message}`);
    process.exit(1);
  }
  if (!voltou) {
    console.error("\nENSAIO REPROVADO: o rollback não devolveu o estado original");
    process.exit(1);
  }
  console.log(`\nEnsaio aprovado. Para aplicar: npm run db:migrate`);
}

main().catch((err) => {
  console.error("Falhou:", err.message);
  process.exit(1);
});
