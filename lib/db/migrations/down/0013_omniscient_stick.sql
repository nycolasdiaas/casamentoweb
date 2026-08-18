-- Desfaz a 0013 (convites do casal).
--
-- A tabela nasceu nesta migração e nada mais depende dela: derrubá-la não
-- alcança nenhum dado anterior. O índice e a FK vão junto com o DROP.
--
-- ATENÇÃO: isto APAGA os convites que o casal desenhou. Não há como
-- reconstruí-los a partir do site — o convite guarda o próprio texto de
-- propósito (ver a nota em `siteInvites`). Rodar só com backup na mão.
DROP TABLE IF EXISTS "site_invites";
