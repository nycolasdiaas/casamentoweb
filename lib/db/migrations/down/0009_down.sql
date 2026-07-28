-- ROLLBACK da migração 0009 (Fase 3, 2/2 — fotos do casal).
--
-- NÃO é aplicado automaticamente pelo drizzle-kit. Rodar à mão, no console
-- do Supabase ou via script, SOMENTE se a 0009 precisar ser desfeita.
--
-- Segurança: a 0009 só CRIA uma tabela nova e vazia (site_photos). Não altera
-- nenhuma tabela existente, não mexe em coluna de cliente e não toca em
-- order_photos. Desfazê-la devolve o banco exatamente ao estado da 0008.
--
-- ATENÇÃO: dropar site_photos NÃO apaga os arquivos no Supabase Storage —
-- as fotos continuam no bucket, órfãs. Se a intenção for apagar de verdade,
-- liste os storage_path ANTES de rodar isto:
--   select storage_path from site_photos order by created_at;
-- e remova os objetos pelo painel do Storage depois.

BEGIN;

-- 1. Tabela criada pela 0009 (o índice e a FK caem junto).
DROP TABLE IF EXISTS "site_photos";

-- 2. Remove a 0009 do journal do Drizzle para o estado voltar a ser o da
--    0008. Confira o hash antes de rodar:
--      select * from drizzle.__drizzle_migrations order by created_at desc;
DELETE FROM drizzle."__drizzle_migrations"
WHERE hash = (
  SELECT hash FROM drizzle."__drizzle_migrations"
  ORDER BY created_at DESC LIMIT 1
);

COMMIT;
