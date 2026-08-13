import { listOrdersByUserId } from "@/lib/repositories/orders";

/**
 * Quantos pedidos uma conta pode ter.
 *
 * O teto existe para conter abuso e engano — não para punir quem já passou
 * dele. Contas anteriores ao limite (a de teste tem 7) continuam funcionando
 * por inteiro: só não conseguem criar MAIS. A regra barra o próximo, nunca
 * apaga nem esconde o que existe.
 */
export const LIMITE_DE_PEDIDOS = 5;

export const MENSAGEM_LIMITE = `Vocês já têm ${LIMITE_DE_PEDIDOS} pedidos. Para começar outro, cancele um que não vá usar — ou fale com a gente no WhatsApp.`;

/**
 * Diz se a conta ainda pode criar pedido, e quantos tem.
 *
 * Fica junto porque toda tela que esconde o botão precisa das DUAS coisas: a
 * decisão e o número para explicar a decisão. Botão que some sem dizer por quê
 * é pior que botão desabilitado.
 */
export async function situacaoDePedidos(userId: string) {
  const pedidos = await listOrdersByUserId(userId);
  return {
    total: pedidos.length,
    podeCriar: pedidos.length < LIMITE_DE_PEDIDOS,
  };
}
