import { config } from "dotenv";
import crypto from "crypto";
import postgres from "postgres";

config({ path: ".env.local" });

// Backfill da Fase 0: cria o `site` do casamento que já estava no ar
// (Isabelle e Nycolas, 16/10/2026) e vincula a ele os grupos de RSVP e os
// presentes que existiam antes da plataforma multi-site.
//
// SEGURANÇA (docs/sdd-geracao-automatica.md §13.1):
//   - Só escreve em COLUNA NOVA (site_id) e em TABELAS NOVAS (sites,
//     site_content, site_sections). Nenhuma coluna original é tocada.
//   - Nenhum slug de grupo é alterado — os links /rsvp/<slug> já estão com
//     os convidados e precisam continuar valendo.
//   - Idempotente: rodar de novo não duplica nem sobrescreve nada.
//   - Tudo numa transação: ou aplica inteiro, ou não aplica nada.
//
// Rode com: npm run backfill:legacy

const SLUG = "isabelle-e-nycolas";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");

  const sql = postgres(databaseUrl, { prepare: false, max: 1 });

  const antes = await contagens(sql);
  console.log("=== ANTES ===");
  console.table(antes);

  await sql.begin(async (tx) => {
    // 1. O site (idempotente pelo slug).
    let [site] = await tx`select * from public.sites where slug = ${SLUG}`;

    if (site) {
      console.log(`site "${SLUG}" já existe (${site.id}) — reaproveitando.`);
    } else {
      const previewToken = crypto.randomBytes(24).toString("base64url");
      [site] = await tx`
        insert into public.sites
          (slug, tier, status, preview_token, template_id, theme, published_at)
        values
          (${SLUG}, 'para-sempre', 'published', ${previewToken}, null, null, now())
        returning *
      `;
      console.log(`site criado: ${site.id}`);
      // order_id e user_id ficam NULL de propósito: este casamento nasceu
      // antes do fluxo de pedidos. Vincular o dono é decisão de acesso —
      // fazer depois, conscientemente, não por inferência de script.
    }

    // 2. Conteúdo (idempotente; não sobrescreve se já existir).
    const [conteudo] = await tx`
      select site_id from public.site_content where site_id = ${site.id}
    `;
    if (conteudo) {
      console.log("site_content já existe — mantido como está.");
    } else {
      await tx`
        insert into public.site_content
          (site_id, couple_names, partner_a, partner_b, wedding_date, timezone)
        values
          (${site.id}, 'Isabelle e Nycolas', 'Isabelle', 'Nycolas',
           '2026-10-16T00:00:00-03:00', 'America/Fortaleza')
      `;
      console.log("site_content criado (CONFERIR o horário da cerimônia).");
    }

    // 3. Seções do pacote para-sempre.
    const secoes = [
      "cover", "countdown", "story", "details", "gallery",
      "rsvp", "gifts", "guestbook", "album", "footer",
    ];
    for (const [i, key] of secoes.entries()) {
      await tx`
        insert into public.site_sections (site_id, section_key, position, enabled)
        values (${site.id}, ${key}, ${i}, true)
        on conflict (site_id, section_key) do nothing
      `;
    }
    console.log(`${secoes.length} seções garantidas.`);

    // 4. Vínculo dos dados existentes. Só preenche onde está NULL —
    //    nunca reescreve um vínculo já feito.
    const grupos = await tx`
      update public.groups set site_id = ${site.id}
      where site_id is null returning id
    `;
    const presentes = await tx`
      update public.gifts set site_id = ${site.id}
      where site_id is null returning id
    `;
    console.log(`${grupos.length} grupos vinculados, ${presentes.length} presentes vinculados.`);
  });

  const depois = await contagens(sql);
  console.log("\n=== DEPOIS ===");
  console.table(depois);

  const problemas = [];
  for (const k of ["groups", "guests", "gifts", "gift_contributions", "orders", "users"]) {
    if (antes[k] !== depois[k]) {
      problemas.push(`${k}: ${antes[k]} -> ${depois[k]}`);
    }
  }

  const [{ orfaos }] = await sql`
    select (
      (select count(*) from public.groups where site_id is null) +
      (select count(*) from public.gifts  where site_id is null)
    )::int as orfaos
  `;

  console.log(
    problemas.length === 0
      ? "\nOK: nenhuma contagem original mudou."
      : `\n!!! ALERTA: ${problemas.join(", ")}`
  );
  console.log(
    orfaos === 0
      ? "OK: nenhum grupo ou presente ficou sem site."
      : `!!! ${orfaos} linhas ainda sem site_id.`
  );

  await sql.end();
}

async function contagens(conn) {
  const out = {};
  for (const t of ["groups", "guests", "gifts", "gift_contributions", "orders", "users"]) {
    const [{ n }] = await conn`select count(*)::int as n from public.${conn(t)}`;
    out[t] = n;
  }
  const [{ n: comSite }] = await conn`
    select count(*)::int as n from public.groups where site_id is not null
  `;
  out["groups (com site)"] = comSite;
  return out;
}

main().catch((err) => {
  console.error("Backfill falhou:", err.message);
  process.exit(1);
});
