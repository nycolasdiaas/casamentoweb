/**
 * A aba Convites está ligada?
 *
 * ── Por que um interruptor, e não uma remoção ──────────────────────────────
 *
 * O dono desligou a área em 16/09/2026 para retomá-la depois ("vamos
 * desenvolver ela no futuro"). Apagar as ~2.700 linhas do editor visual, as
 * ações, o repositório e as specs seria jogar fora trabalho que vai voltar — e
 * ressuscitar isso de um `git revert` seis meses e cinquenta commits depois é
 * o tipo de dívida que a branch `feedback-001` já ensinou a não criar.
 *
 * Com um `false` aqui, religar é trocar uma palavra.
 *
 * ── O que o interruptor NÃO desliga ────────────────────────────────────────
 *
 * **`/c/<slug>` continua no ar.** Convite publicado é endereço que já foi para
 * o WhatsApp de gente real — no banco de produção há convite `PUBLICADO` agora
 * mesmo. Derrubar a página pública transformaria um link que circula num 404,
 * e o convidado não tem como saber que o casal mudou de ideia sobre uma aba do
 * painel. O que sai é a porta de CRIAR e EDITAR, não a de ler.
 *
 * Pela mesma razão os convites existentes continuam no banco, contados e
 * intactos: religar a aba tem que devolver o casal exatamente onde ele parou.
 *
 * ── Onde ele é consultado ──────────────────────────────────────────────────
 *
 * Em toda porta que leva à área — a aba do painel, as duas rotas, o cartão da
 * primeira vez, o aviso do sino, o botão "Enviar convites" da publicação e o
 * atalho de baixar o convite. Uma porta esquecida vira um link que rebate, que
 * é pior que a aba aberta.
 */
export const CONVITES_LIGADOS = false;
