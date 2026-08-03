-- ROLLBACK da migração 0011 (terceira cor no pedido).
--
-- NÃO é aplicado automaticamente pelo drizzle-kit. Rodar à mão, SOMENTE se a
-- 0011 precisar ser desfeita.
--
-- Segurança: a 0011 só ADICIONA uma coluna nullable a `orders`. Não cria
-- tabela, não altera coluna existente, não apaga nada. Desfazê-la devolve o
-- banco exatamente ao estado da 0010.
--
-- O que se perde: a terceira cor que os casais tiverem escolhido no pedido.
-- Salve antes, se houver:
--   select id, tertiary_color from orders where tertiary_color is not null;

BEGIN;

ALTER TABLE "orders" DROP COLUMN IF EXISTS "tertiary_color";

-- Remove a 0011 do journal do Drizzle. Confira o hash antes:
--   select * from drizzle.__drizzle_migrations order by created_at desc;
DELETE FROM drizzle."__drizzle_migrations"
WHERE hash = (
  SELECT hash FROM drizzle."__drizzle_migrations"
  ORDER BY created_at DESC LIMIT 1
);

COMMIT;
