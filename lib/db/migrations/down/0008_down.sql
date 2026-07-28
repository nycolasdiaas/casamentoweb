-- ROLLBACK da migração 0008 (Fase 0 — fundação multi-tenant + métricas).
--
-- NÃO é aplicado automaticamente pelo drizzle-kit. Rodar à mão, no console
-- do Supabase ou via script, SOMENTE se a 0008 precisar ser desfeita.
--
-- Segurança: este rollback NÃO apaga nenhum dado que existia antes da 0008.
--   - Remove apenas objetos criados pela 0008 (tabelas novas, vazias).
--   - As colunas site_id são dropadas — elas não existiam antes, então
--     nenhum dado original se perde. Se o backfill já tiver rodado, o
--     vínculo site<->grupo/presente se perde, mas grupos, convidados e
--     presentes permanecem intactos.
--   - NÃO toca em groups_backup, guests_backup, email_verification_tokens
--     nem order_photos: essas tabelas JÁ EXISTIAM antes da 0008 (a migração
--     só passou a rastreá-las). Dropá-las apagaria os snapshots de
--     convidados de 30 dias — exatamente o que não pode acontecer.
--
-- Ordem: dependências primeiro.

BEGIN;

-- 1. Desfaz o vínculo de tenant nas tabelas existentes.
ALTER TABLE "gifts"  DROP CONSTRAINT IF EXISTS "gifts_site_id_sites_id_fk";
ALTER TABLE "groups" DROP CONSTRAINT IF EXISTS "groups_site_id_sites_id_fk";
DROP INDEX IF EXISTS "idx_gifts_site_id";
DROP INDEX IF EXISTS "idx_groups_site_id";
ALTER TABLE "gifts"  DROP COLUMN IF EXISTS "site_id";
ALTER TABLE "groups" DROP COLUMN IF EXISTS "site_id";

-- 2. Tabelas criadas pela 0008 (todas dependem de sites).
DROP TABLE IF EXISTS "site_daily_stats";
DROP TABLE IF EXISTS "site_events";
DROP TABLE IF EXISTS "site_sections";
DROP TABLE IF EXISTS "site_content";
DROP TABLE IF EXISTS "sites";

-- 3. Enum criado pela 0008.
DROP TYPE IF EXISTS "public"."site_status";

-- 4. Remove a 0008 do journal do Drizzle para o estado voltar a ser o da
--    0007. Confira o hash antes de rodar:
--      select * from drizzle.__drizzle_migrations order by created_at desc;
DELETE FROM drizzle."__drizzle_migrations"
WHERE hash = (
  SELECT hash FROM drizzle."__drizzle_migrations"
  ORDER BY created_at DESC LIMIT 1
);

COMMIT;

-- INTENCIONALMENTE NÃO REMOVIDO (existia antes da 0008):
--   groups_backup, guests_backup, email_verification_tokens, order_photos
