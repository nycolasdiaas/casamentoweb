import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth/userSession";
import { getOrderById } from "@/lib/repositories/orders";
import { getSiteByOrderId } from "@/lib/repositories/sites";

/**
 * Carrega o pedido e o site de UMA tela do painel de gerenciamento.
 *
 * O painel virou várias rotas (início, páginas, conteúdo, visual, fotos,
 * presentes) e todas precisam do mesmo começo: sessão válida, pedido existente,
 * pedido do casal logado. Repetir isso em seis arquivos é como se esquece a
 * verificação de dono em um deles — e aí um casal abre o site de outro pelo
 * id na URL.
 *
 * Aqui, quem não é dono nunca chega ao corpo da página.
 */
export async function carregarGerenciamento(orderId: string) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/conta/entrar");

  const order = await getOrderById(orderId);
  // Mesma resposta para "não existe" e "não é seu": quem sonda ids alheios não
  // aprende nada com o redirecionamento.
  if (!order || order.userId !== userId) redirect("/conta/pedidos");

  // Rascunho ainda está no questionário, não no gerenciamento.
  if (order.status === "draft") redirect(`/conta/pedido/${order.id}`);

  const site = await getSiteByOrderId(order.id);
  return { userId, order, site };
}
