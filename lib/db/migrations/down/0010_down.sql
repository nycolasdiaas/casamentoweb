-- ROLLBACK da migração 0010 (Pix por casal).
--
-- NÃO é aplicado automaticamente pelo drizzle-kit. Rodar à mão, no console do
-- Supabase ou via script, SOMENTE se a 0010 precisar ser desfeita.
--
-- Segurança: a 0010 só ADICIONA cinco colunas nullable a site_content. Não
-- cria tabela, não altera coluna existente, não apaga nada. Desfazê-la devolve
-- o banco exatamente ao estado da 0009.
--
-- ATENÇÃO — o que se perde ao desfazer: o Pix que os casais já tiverem
-- cadastrado pelo painel. Nenhum outro dado. Antes de rodar isto, salve o que
-- existe (é pouco e cabe numa tela):
--
--   select site_id, pix_key, pix_key_type, pix_recipient, pix_city,
--          pix_institution
--     from site_content
--    where pix_key is not null;
--
-- Rodar este down deixa TODA lista de presentes sem forma de pagamento (o
-- resolver devolve null sem as colunas). O site não quebra — a seção de
-- presentes passa a mostrar a lista sem chave, que é o comportamento seguro
-- por desenho. Mas ninguém consegue presentear até o Pix voltar.

BEGIN;

-- 1. Colunas adicionadas pela 0010.
ALTER TABLE "site_content" DROP COLUMN IF EXISTS "pix_key";
ALTER TABLE "site_content" DROP COLUMN IF EXISTS "pix_key_type";
ALTER TABLE "site_content" DROP COLUMN IF EXISTS "pix_recipient";
ALTER TABLE "site_content" DROP COLUMN IF EXISTS "pix_city";
ALTER TABLE "site_content" DROP COLUMN IF EXISTS "pix_institution";

-- 2. Remove a 0010 do journal do Drizzle para o estado voltar a ser o da
--    0009. Confira o hash antes de rodar:
--      select * from drizzle.__drizzle_migrations order by created_at desc;
DELETE FROM drizzle."__drizzle_migrations"
WHERE hash = (
  SELECT hash FROM drizzle."__drizzle_migrations"
  ORDER BY created_at DESC LIMIT 1
);

COMMIT;
