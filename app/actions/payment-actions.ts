"use server";

import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth/userSession";
import { getUserById } from "@/lib/repositories/users";
import { getOrderByUserId, setOrderPayment } from "@/lib/repositories/orders";
import { getPackage } from "@/lib/packages";
import { createCharge, isPaymentConfigured } from "@/lib/payments/abacatepay";
import { getBaseUrl } from "@/lib/baseUrl";

type PaymentResult = { error?: string } | undefined;

/**
 * Inicia o pagamento do pedido do casal via AbacatePay e redireciona para o
 * checkout hospedado. Em caso de erro, volta uma mensagem para a tela.
 * Sem parâmetros: é usada com useActionState, que ignora prevState/formData.
 */
export async function startPaymentAction(): Promise<PaymentResult> {
  const userId = await getSessionUserId();
  if (!userId) redirect("/conta/entrar");

  const order = await getOrderByUserId(userId);
  if (!order) redirect("/conta");
  if (order.paymentStatus === "PAID") redirect("/conta/pedidos");

  if (!isPaymentConfigured()) {
    return {
      error:
        "O pagamento online ainda não está ativo. Fale com a gente no WhatsApp para concluir.",
    };
  }

  const user = await getUserById(userId);
  const pkg = getPackage(order.packageTier);
  const amountCents = order.priceCents ?? pkg?.priceCents ?? 0;
  if (amountCents <= 0) {
    return {
      error:
        "O valor ainda não foi definido para este pedido. Fale com a gente no WhatsApp.",
    };
  }

  const base = await getBaseUrl();

  let charge;
  try {
    charge = await createCharge({
      amountCents,
      externalId: order.id,
      productName: `Site de casamento — ${pkg?.name ?? order.packageTier}`,
      description: order.coupleNames
        ? `Site de casamento de ${order.coupleNames}`
        : undefined,
      returnUrl: `${base}/conta/pedidos`,
      completionUrl: `${base}/conta/pedidos?pago=1`,
      customer: {
        name: order.coupleNames ?? user?.name,
        email: user?.email,
        cellphone: user?.whatsapp ?? undefined,
      },
    });
  } catch {
    return {
      error:
        "Não conseguimos iniciar o pagamento agora. Tente de novo em instantes ou fale no WhatsApp.",
    };
  }

  await setOrderPayment(order.id, {
    paymentId: charge.id,
    paymentUrl: charge.url,
    paymentStatus: charge.status,
  });

  redirect(charge.url);
}
