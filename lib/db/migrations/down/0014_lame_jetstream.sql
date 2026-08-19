-- Desfaz a 0014 (convite como página pública).
--
-- As duas colunas nasceram nesta migração e nada anterior depende delas.
-- ATENÇÃO: derrubar `slug` INVALIDA os endereços `/c/<slug>` já enviados —
-- se algum casal mandou o link do convite no WhatsApp, ele para de funcionar.
-- Rodar só antes de qualquer convite ser publicado.
ALTER TABLE "site_invites" DROP CONSTRAINT IF EXISTS "site_invites_slug_unique";
ALTER TABLE "site_invites" DROP COLUMN IF EXISTS "published_at";
ALTER TABLE "site_invites" DROP COLUMN IF EXISTS "slug";
