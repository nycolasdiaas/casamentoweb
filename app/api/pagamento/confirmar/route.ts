import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { getSessionUserId } from "@/lib/auth/userSession";
import {
  getOrderById,
  markOrderPaid,
  setOrderPayment,
} from "@/lib/repositories/orders";
import { getChargeStatus } from "@/lib/payments/abacatepay";
import { publishSiteForOrder, publishedSiteTags } from "@/lib/site/publish";
import { getBaseUrl } from "@/lib/baseUrl";

/**
 * Volta do checkout: confirma o pagamento e coloca o site no ar.
 *
 * Por que uma rota, e não a própria tela de acompanhamento: publicar exige
 * derrubar o cache do site (`site-view:<slug>` vive por dias), e nem
 * `updateTag` nem `revalidateTag` podem ser chamados durante o render de uma
 * página — só em Server Action ou Route Handler. Publicar no render deixaria
 * /s/<slug> devolvendo 404 por dias, com o pedido dizendo "no ar".
 *
 * Não confia no fato de o casal ter chegado aqui: quem diz que a cobrança
 * está paga é a API do AbacatePay, consultada agora.
 *
 * Ver docs/sdd-geracao-automatica.md §7.2.
 */
export async function GET(request: Request) {
  const orderId = new URL(request.url).searchParams.get("pedido") ?? "";

  const userId = await getSessionUserId();
  if (!userId) redirect("/conta/entrar");

  const order = orderId ? await getOrderById(orderId) : null;
  if (!order || order.userId !== userId) redirect("/conta/pedidos");

  const destino = `/conta/pedidos/${order.id}`;

  // Confirmação de verdade: pergunta ao AbacatePay em vez de acreditar na
  // volta do navegador, que qualquer um consegue forjar digitando a URL.
  let pago = order.paymentStatus === "PAID";
  if (!pago && order.paymentId) {
    const remoto = await getChargeStatus(order.paymentId);
    if (remoto === "PAID") {
      await markOrderPaid(order.id);
      pago = true;
    } else if (remoto && remoto !== order.paymentStatus) {
      await setOrderPayment(order.id, {
        paymentId: order.paymentId,
        paymentUrl: order.paymentUrl,
        paymentStatus: remoto,
      });
    }
  }

  // Ainda não pago (PIX pode demorar a compensar): volta para o
  // acompanhamento, que mostra o estado atual sem inventar nada.
  if (!pago) redirect(destino);

  let base: string | null = null;
  try {
    base = await getBaseUrl();
  } catch {
    // Sem base confiável, publica mesmo assim e mantém o siteUrl que houver:
    // o site no ar vale mais que o link bonito no acompanhamento.
    console.error("[publicar] getBaseUrl falhou — siteUrl não será atualizado");
  }

  const resultado = await publishSiteForOrder(order.id, { baseUrl: base });

  if (!resultado.ok) {
    console.error(`[publicar] pedido ${order.id}: ${resultado.reason}`);
    // O marcador evita laço: a tela só manda para cá quando NÃO veio de uma
    // tentativa que falhou.
    redirect(`${destino}?publicacao=erro`);
  }

  // `expire: 0` (e não "max") de propósito: o casal acabou de pagar e vai
  // abrir o link agora. Stale-while-revalidate serviria o 404 de antes.
  for (const tag of publishedSiteTags(resultado.slug)) {
    revalidateTag(tag, { expire: 0 });
  }
  revalidatePath(destino);
  revalidatePath("/conta/pedidos");
  revalidatePath("/admin/pedidos");

  redirect(destino);
}
