import { revalidatePath } from "next/cache";
import { getOrderByPaymentId, markOrderPaid } from "@/lib/repositories/orders";

export const dynamic = "force-dynamic";

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
  if (url.searchParams.get("webhookSecret") !== secret) {
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
    if (order) {
      await markOrderPaid(order.id);
      revalidatePath(`/conta/pedidos/${order.id}`);
      revalidatePath("/conta/pedidos");
      revalidatePath("/admin/pedidos");
    }
  }

  // Sempre 200 para o AbacatePay não ficar reenviando.
  return Response.json({ received: true });
}
