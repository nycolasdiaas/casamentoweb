import { config } from "dotenv";
import postgres from "postgres";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

config({ path: ".env.local" });

// Backup lógico completo do schema public: todas as tabelas, todas as linhas,
// mais os metadados necessários para reconstruir (colunas, tipos, enums,
// constraints, índices). Diferente do backup-guests.mjs, que só cobre
// convidados, este é o dump exigido antes de qualquer migração de schema.
//
// Não substitui o pg_dump para restauração automática — é um dump de DADOS
// legível e restaurável, pensado para um banco onde as migrações vivem no git.
//
// Rode com: npm run backup:full

const BACKUP_DIR = path.resolve(process.cwd(), "backups");

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const sql = postgres(databaseUrl, { prepare: false });

  // Descobre as tabelas em vez de listar à mão — assim nada fica de fora
  // quando o schema crescer.
  const tableRows = await sql`
    select table_name
    from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE'
    order by table_name
  `;
  const tableNames = tableRows.map((r) => r.table_name);

  const columns = await sql`
    select table_name, column_name, data_type, is_nullable, column_default
    from information_schema.columns
    where table_schema = 'public'
    order by table_name, ordinal_position
  `;

  const constraints = await sql`
    select conrelid::regclass::text as table_name,
           conname as name,
           pg_get_constraintdef(oid) as definition
    from pg_constraint
    where connamespace = 'public'::regnamespace
    order by conrelid::regclass::text, conname
  `;

  const indexes = await sql`
    select tablename as table_name, indexname as name, indexdef as definition
    from pg_indexes
    where schemaname = 'public'
    order by tablename, indexname
  `;

  const enums = await sql`
    select t.typname as name,
           array_agg(e.enumlabel order by e.enumsortorder) as values
    from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
    group by t.typname
    order by t.typname
  `;

  const data = {};
  const counts = {};
  for (const name of tableNames) {
    const rows = await sql`select * from public.${sql(name)}`;
    data[name] = rows;
    counts[name] = rows.length;
  }

  await sql.end();

  await mkdir(BACKUP_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filePath = path.join(BACKUP_DIR, `full-backup-${timestamp}.json`);

  await writeFile(
    filePath,
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        schema: "public",
        counts,
        structure: { columns, constraints, indexes, enums },
        data,
      },
      null,
      2
    )
  );

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log(`Backup completo salvo em ${filePath}`);
  console.log(`${tableNames.length} tabelas, ${total} linhas no total:\n`);
  for (const name of tableNames) {
    console.log(`  ${name.padEnd(24)} ${counts[name]}`);
  }
}

main().catch((err) => {
  console.error("Backup failed:", err.message);
  process.exit(1);
});
