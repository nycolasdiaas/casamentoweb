-- Desfaz a 0015 (mural de recados).
--
-- A tabela nasce nesta migração e nada anterior depende dela: o `site_id`
-- aponta para `sites`, não o contrário, então derrubá-la não afeta nenhum
-- site, pedido ou convidado existente.
--
-- ATENÇÃO: derrubar a tabela APAGA OS RECADOS que os convidados já
-- escreveram, e eles não estão em nenhum outro lugar — não são snapshot como
-- `guests_backup`, e o convidado não tem conta para reenviar. Antes de rodar
-- isto num banco onde algum casal já publicou o mural, tire um
-- `npm run backup:full` e confira que a tabela veio dentro dele.
--
-- O índice e a constraint caem junto com a tabela; ficam explícitos aqui só
-- para o caso de um DROP parcial ter deixado resto para trás.
DROP INDEX IF EXISTS "idx_guestbook_messages_site_id";
ALTER TABLE "guestbook_messages"
  DROP CONSTRAINT IF EXISTS "guestbook_messages_site_id_sites_id_fk";
DROP TABLE IF EXISTS "guestbook_messages";
