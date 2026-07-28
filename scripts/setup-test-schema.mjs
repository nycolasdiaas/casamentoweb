import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

// Sincroniza o schema `test` (usado pelos testes automatizados, ver
// vitest.config.ts) com as tabelas que os testes precisam.
//
// O schema `test` é mantido à parte do `public` de propósito: os testes
// apagam tabelas inteiras entre casos, e isso NUNCA pode encostar em dados
// de cliente. As migrações do drizzle-kit rodam só no `public`, então este
// script é o que mantém o `test` em dia.
//
// Idempotente: pode rodar quantas vezes quiser.
// Rode com: npm run test:setup

const DDL = [
  `create schema if not exists test`,

  // users e orders são pré-requisito do teste de provisionamento
  // (pedido -> site). Espelham lib/db/schema.ts.
  `create table if not exists test.users (
     id uuid primary key default gen_random_uuid(),
     name text not null,
     email text not null unique,
     password_hash text not null,
     whatsapp text,
     created_at timestamptz not null default now()
   )`,

  `create table if not exists test.orders (
     id uuid primary key default gen_random_uuid(),
     user_id uuid not null references test.users(id) on delete cascade,
     package_tier public.package_tier not null,
     template_style text,
     primary_color text, secondary_color text, font_style text,
     style_notes text, couple_names text, wedding_date text,
     photos_link text, notes text,
     status public.order_status not null default 'draft',
     preview_url text, site_url text, price_cents integer, admin_message text,
     payment_id text, payment_url text, payment_status text,
     created_at timestamptz not null default now(),
     updated_at timestamptz not null default now()
   )`,

  `create table if not exists test.sites (
     id uuid primary key default gen_random_uuid(),
     order_id uuid unique references test.orders(id) on delete set null,
     user_id uuid references test.users(id) on delete set null,
     slug text not null unique,
     template_id text,
     theme jsonb,
     tier public.package_tier not null,
     status public.site_status not null default 'provisioning',
     preview_token text not null unique,
     published_at timestamptz,
     last_seen_at timestamptz,
     created_at timestamptz not null default now(),
     updated_at timestamptz not null default now()
   )`,

  `create table if not exists test.site_content (
     site_id uuid primary key references test.sites(id) on delete cascade,
     couple_names text, partner_a text, partner_b text,
     wedding_date timestamptz,
     timezone text not null default 'America/Fortaleza',
     ceremony_venue text, ceremony_address text, ceremony_map_url text,
     reception_venue text, reception_address text,
     story text, dress_code text, gift_message text,
     rsvp_deadline date,
     updated_at timestamptz not null default now()
   )`,

  `create table if not exists test.site_sections (
     site_id uuid not null references test.sites(id) on delete cascade,
     section_key text not null,
     position smallint not null default 0,
     enabled boolean not null default true,
     config jsonb,
     primary key (site_id, section_key)
   )`,

  `create table if not exists test.site_photos (
     id uuid primary key default gen_random_uuid(),
     site_id uuid not null references test.sites(id) on delete cascade,
     slot text not null,
     storage_path text not null unique,
     content_type text not null,
     size_bytes integer not null,
     width integer, height integer,
     blur_data_url text, alt text, original_name text,
     position smallint not null default 0,
     created_at timestamptz not null default now()
   )`,

  `create index if not exists idx_test_site_photos_site_slot
     on test.site_photos (site_id, slot, position)`,

  `create table if not exists test.site_events (
     id bigserial primary key,
     site_id uuid not null references test.sites(id) on delete cascade,
     kind text not null, path text, section text,
     referrer_host text, device text, country text, region text,
     visitor_hash text, is_returning boolean,
     created_at timestamptz not null default now()
   )`,

  `create table if not exists test.site_daily_stats (
     site_id uuid not null references test.sites(id) on delete cascade,
     day date not null,
     views integer not null default 0,
     unique_visitors integer not null default 0,
     rsvp_opens integer not null default 0,
     rsvp_submits integer not null default 0,
     gift_opens integer not null default 0,
     pix_copies integer not null default 0,
     gift_confirms integer not null default 0,
     primary key (site_id, day)
   )`,

  `alter table test.groups add column if not exists site_id uuid
     references test.sites(id) on delete restrict`,
  `alter table test.gifts add column if not exists site_id uuid
     references test.sites(id) on delete restrict`,

  `create index if not exists idx_test_groups_site_id on test.groups (site_id)`,
  `create index if not exists idx_test_gifts_site_id on test.gifts (site_id)`,
];

async function main() {
  const url = process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL_TEST (ou DATABASE_URL) is not set");

  const sql = postgres(url, { prepare: false, max: 1 });

  for (const stmt of DDL) {
    await sql.unsafe(stmt);
  }

  const tabelas = await sql`
    select table_name from information_schema.tables
    where table_schema = 'test' order by table_name
  `;
  const cols = await sql`
    select table_name from information_schema.columns
    where table_schema='test' and column_name='site_id' order by table_name
  `;

  console.log("schema test sincronizado.");
  console.log("tabelas:", tabelas.map((r) => r.table_name).join(", "));
  console.log("com site_id:", cols.map((r) => r.table_name).join(", "));

  await sql.end();
}

main().catch((err) => {
  console.error("Falhou:", err.message);
  process.exit(1);
});
