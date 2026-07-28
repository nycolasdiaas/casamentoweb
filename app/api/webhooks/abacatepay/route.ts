import crypto from "crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { getOrderByPaymentId, markOrderPaid } from "@/lib/repositories/orders";
import { getChargeStatus } from "@/lib/payments/abacatepay";
import { publishSiteForOrder, publishedSiteTags } from "@/lib/site/publish";
import { getBaseUrl } from "@/lib/baseUrl";

// Webhook do AbacatePay para confirmação de pagamento em tempo real.
// Configure a URL no painel do AbacatePay como:
//   https://SEU-DOMINIO/api/webhooks/abacatepay?webhookSecret=SEU_SEGREDO
// e defina ABACATEPAY_WEBHOOK_SECRET com o mesmo valor.
//
// Observação: mesmo sem webhook, o pagamento é confirmado quando o casal
// volta para /conta/pedidos (consulta o status na hora). O webhook só deixa
// isso instantâneo.

// Procura o id da cobrança em vários formatos possíveis de payload.
function extractBillingId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const data = (payload as { data?: unknown }).data;
  const candidates: unknown[] = [
    (data as { billing?: { id?: unknown } })?.billing?.id,
    (data as { id?: unknown })?.id,
    (data as { payment?: { id?: unknown } })?.payment?.id,
    (data as { billingId?: unknown })?.billingId,
  ];
  const found = candidates.find((c) => typeof c === "string" && c.length > 0);
  return (found as string) ?? null;
}

export async function POST(request: Request) {
  const secret = process.env.ABACATEPAY_WEBHOOK_SECRET;
  // Sem segredo configurado, não processamos webhooks anônimos.
  if (!secret) {
    return new Response("webhook not configured", { status: 503 });
  }

  const url = new URL(request.url);
  const provided = url.searchParams.get("webhookSecret") ?? "";
  const providedBuffer = Buffer.from(provided);
  const secretBuffer = Buffer.from(secret);
  const isValid =
    providedBuffer.length === secretBuffer.length &&
    crypto.timingSafeEqual(providedBuffer, secretBuffer);
  if (!isValid) {
    return new Response("unauthorized", { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return new Response("invalid payload", { status: 400 });
  }

  const event = (payload as { event?: string })?.event ?? "";
  const isPaid = /paid|completed/i.test(event);
  const billingId = extractBillingId(payload);

  if (isPaid && billingId) {
    const order = await getOrderByPaymentId(billingId);
    // Não confia só na string do evento: reconfirma com a API do AbacatePay
    // que a cobrança está mesmo PAID antes de liberar o pedido. Assim, um
    // webhook forjado (mesmo com o segredo) não marca pago sem pagamento real.
    if (order) {
      const remote = await getChargeStatus(billingId);
      if (remote === "PAID") {
        await markOrderPaid(order.id);

        // Publica na hora. Idempotente: reenvio do webhook não republica nem
        // mexe na data da primeira publicação.
        let base: string | null = null;
        try {
          base = await getBaseUrl();
        } catch {
          console.error("[webhook] getBaseUrl falhou — siteUrl fica como está");
        }

        const publicado = await publishSiteForOrder(order.id, { baseUrl: base });
        if (publicado.ok) {
          for (const tag of publishedSiteTags(publicado.slug)) {
            revalidateTag(tag, { expire: 0 });
          }
        } else {
          console.error(`[webhook] não publicou ${order.id}: ${publicado.reason}`);
        }

        revalidatePath(`/conta/pedidos/${order.id}`);
        revalidatePath("/conta/pedidos");
        revalidatePath("/admin/pedidos");
      }
    }
  }

  // Sempre 200 para o AbacatePay não ficar reenviando.
  return Response.json({ received: true });
}
