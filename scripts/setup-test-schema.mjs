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
     weekly_digest_opt_out timestamptz,
     created_at timestamptz not null default now()
   )`,

  `create table if not exists test.orders (
     id uuid primary key default gen_random_uuid(),
     user_id uuid not null references test.users(id) on delete cascade,
     package_tier public.package_tier not null,
     template_style text,
     primary_color text, secondary_color text, tertiary_color text, font_style text,
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
     expires_at timestamptz,
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
     pix_key text, pix_key_type text,
     pix_recipient text, pix_city text, pix_institution text,
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
     category text,
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

  `create table if not exists test.site_invites (
     id uuid primary key default gen_random_uuid(),
     site_id uuid not null references test.sites(id) on delete cascade,
     name text not null,
     doc jsonb not null,
     created_at timestamptz not null default now(),
     updated_at timestamptz not null default now()
   )`,

  `create index if not exists idx_test_site_invites_site
     on test.site_invites (site_id)`,

  // 0015 — mural de recados. O schema `test` é mantido à mão e NÃO recebe
  // migração: sem esta entrada, todo teste que tocar em `guestbook_messages`
  // morre com `relation does not exist`. Foi o que derrubou a 0010 e a 0011.
  `create table if not exists test.guestbook_messages (
     id uuid primary key default gen_random_uuid(),
     site_id uuid not null references test.sites(id) on delete cascade,
     guest_name text not null,
     message text not null,
     hidden boolean not null default false,
     created_at timestamptz not null default now()
   )`,

  `create index if not exists idx_test_guestbook_messages_site
     on test.guestbook_messages (site_id)`,

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

  /* Recado do time para o casal (migração 0022).

     `admins` não existe no schema `test`, então `admin_id` fica SEM chave
     estrangeira aqui — é uma coluna uuid solta. O teste do repositório grava
     e lê recado; ele não tem nada a dizer sobre integridade referencial com
     uma tabela que este schema não espelha, e criar `test.admins` só para
     isso arrastaria a tabela de senhas para o schema que os testes limpam
     entre casos. */
  `create table if not exists test.admin_notices (
     id uuid primary key default gen_random_uuid(),
     order_id uuid not null references test.orders(id) on delete cascade,
     admin_id uuid,
     admin_name text not null,
     title text not null,
     body text not null,
     read_at timestamptz,
     email_sent_at timestamptz,
     created_at timestamptz not null default now()
   )`,

  `create index if not exists idx_test_admin_notices_order
     on test.admin_notices (order_id)`,

  `alter table test.groups add column if not exists site_id uuid
     references test.sites(id) on delete restrict`,
  `alter table test.gifts add column if not exists site_id uuid
     references test.sites(id) on delete restrict`,

  // Terceira cor no pedido (migração 0011).
  `alter table test.orders add column if not exists tertiary_color text`,

  // Pix por casal (migração 0010). O `create table if not exists` acima não
  // alcança um schema `test` que já existe, então as colunas precisam vir
  // também por alter — é o mesmo motivo do site_id logo acima.
  // A coluna nasce numa tabela que JA existe no schema test, e o
  // `create table if not exists` acima nao a acrescenta. Sem este alter, 14
  // casos de sitePhotos quebram com "column category does not exist" — foi o
  // que aconteceu na 0010 e na 0011, e aconteceu de novo aqui.
  `alter table test.site_photos add column if not exists category text`,
  `alter table test.site_invites add column if not exists slug text`,
  `alter table test.site_invites add column if not exists published_at timestamptz`,
  /* O `create table if not exists` acima não alcança um schema `test` que já
     existe — e ele existe em toda máquina que já rodou a suíte uma vez. */
  `alter table test.sites add column if not exists expires_at timestamptz`,
  `alter table test.orders add column if not exists paid_at timestamptz`,
  // Conteúdo do site enquanto o pedido é rascunho — migração 0024.
  `alter table test.orders add column if not exists draft_content jsonb`,
  // Hora da festa, sem fuso — migração 0025.
  `alter table test.site_content add column if not exists reception_time time`,
  `alter table test.site_content add column if not exists pix_key text`,
  `alter table test.site_content add column if not exists pix_key_type text`,
  `alter table test.site_content add column if not exists pix_recipient text`,
  `alter table test.site_content add column if not exists pix_city text`,
  `alter table test.site_content add column if not exists pix_institution text`,

  // Descadastro do resumo semanal (migração 0019). `null` = recebe.
  `alter table test.users add column if not exists weekly_digest_opt_out timestamptz`,

  // Resposta por GRUPO e site com senha (migração 0016). Mesmo motivo dos
  // alters acima: as tabelas já existem no schema `test` e o
  // `create table if not exists` não as alcança.
  `alter table test.groups add column if not exists seats smallint not null default 0`,
  `alter table test.groups add column if not exists seats_confirmed smallint`,
  `alter table test.groups add column if not exists attending_names text`,
  `alter table test.groups add column if not exists message text`,
  `alter table test.groups add column if not exists responded_at timestamptz`,

  // Família removida da lista sem apagar a resposta (migração 0026).
  `alter table test.groups add column if not exists removed_at timestamptz`,

  // Recado privado, que não vai para o mural (migração 0027).
  `alter table test.guestbook_messages add column if not exists privado boolean not null default false`,
  `alter table test.sites add column if not exists access_mode public.site_access_mode not null default 'public'`,
  `alter table test.sites add column if not exists access_password_hash text`,

  // Teto de cotas por presente (migração 0017).
  `alter table test.gifts add column if not exists quantity smallint`,

  // Descrição do presente (migração 0023).
  `alter table test.gifts add column if not exists description text`,

  // Foto por presente (migração 0023). Tabela nova — o `create table` normal
  // basta aqui, sem o problema do `if not exists` contra schema já criado.
  `create table if not exists test.gift_photos (
     id uuid primary key default gen_random_uuid(),
     gift_id uuid not null unique references test.gifts(id) on delete cascade,
     storage_path text not null unique,
     content_type text not null,
     size_bytes integer not null,
     width integer,
     height integer,
     blur_data_url text,
     created_at timestamptz not null default now()
   )`,

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
