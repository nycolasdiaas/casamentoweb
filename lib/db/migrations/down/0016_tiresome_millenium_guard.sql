-- Desfaz a 0016 (resposta por grupo em /rsvp + site com senha).
--
-- ── O que a 0016 fez ───────────────────────────────────────────────────────
--
-- Sete colunas novas e um tipo novo. NADA foi apagado, renomeado ou alterado:
-- `guests.rsvp_status`, `guests.responded_at` e todo o resto do modelo antigo
-- continuam exatamente como estavam, com as 23 confirmações reais intactas.
-- É por isso que este rollback é seguro de rodar mesmo com o casamento no ar.
--
-- ── O que este rollback APAGA ──────────────────────────────────────────────
--
-- 1. `groups.seats_confirmed`, `attending_names`, `message`, `responded_at` —
--    as respostas dadas pelo NOVO formulário de /rsvp. Um convidado que
--    respondeu depois da 0016 some daqui; o que ele respondeu não está em
--    nenhum outro lugar (a coluna é a única fonte).
--
--    ANTES DE RODAR: `npm run backup:full` e confira que `groups` veio com as
--    quatro colunas dentro do JSON. Sem isso, a informação não volta.
--
--    Se houver resposta nova a preservar, rode o SELECT abaixo e guarde o
--    resultado antes do DROP:
--
--      SELECT slug, label, seats, seats_confirmed, attending_names,
--             message, responded_at
--      FROM groups
--      WHERE seats_confirmed IS NOT NULL
--      ORDER BY responded_at DESC;
--
-- 2. `sites.access_password_hash` — a senha que algum casal tenha definido.
--    Depois do rollback o site volta a ser público (o comportamento anterior à
--    0016), e é bom AVISAR esse casal: o site dele deixou de ser protegido.
--
--    Para saber quem é, antes do DROP:
--
--      SELECT slug FROM sites WHERE access_mode = 'password';
--
-- 3. `groups.seats` — recuperável sozinho, é a contagem de `guests` do grupo.
--
-- ── Ordem ──────────────────────────────────────────────────────────────────
--
-- As colunas caem antes do tipo: o Postgres recusa DROP TYPE enquanto uma
-- coluna ainda o usa.

ALTER TABLE "groups" DROP COLUMN IF EXISTS "responded_at";
ALTER TABLE "groups" DROP COLUMN IF EXISTS "message";
ALTER TABLE "groups" DROP COLUMN IF EXISTS "attending_names";
ALTER TABLE "groups" DROP COLUMN IF EXISTS "seats_confirmed";
ALTER TABLE "groups" DROP COLUMN IF EXISTS "seats";

ALTER TABLE "sites" DROP COLUMN IF EXISTS "access_password_hash";
ALTER TABLE "sites" DROP COLUMN IF EXISTS "access_mode";

DROP TYPE IF EXISTS "public"."site_access_mode";
