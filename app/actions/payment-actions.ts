"use server";

import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth/userSession";
import { getUserById } from "@/lib/repositories/users";
import { getOrderById, setOrderPayment } from "@/lib/repositories/orders";
import { getPackage } from "@/lib/packages";
import { createCharge, isPaymentConfigured } from "@/lib/payments/abacatepay";
import { getBaseUrl } from "@/lib/baseUrl";
import { isValidCPF, onlyDigits } from "@/lib/cpf";
import { whatsappValido } from "@/lib/telefone";

type PaymentResult = { error?: string } | undefined;

/**
 * Inicia o pagamento do pedido do casal via AbacatePay e redireciona para o
 * checkout hospedado. Em caso de erro, volta uma mensagem para a tela.
 * Recebe o CPF do pagador pelo formulário (exigido pelo Pix; não é gravado).
 */
export async function startPaymentAction(
  _prevState: PaymentResult,
  formData: FormData
): Promise<PaymentResult> {
  const userId = await getSessionUserId();
  if (!userId) redirect("/conta/entrar");

  const orderId = formData.get("orderId")?.toString() ?? "";
  const order = orderId ? await getOrderById(orderId) : null;
  if (!order || order.userId !== userId) redirect("/conta/pedidos");
  if (order.paymentStatus === "PAID") redirect(`/conta/pedidos/${order.id}`);

  if (!isPaymentConfigured()) {
    return {
      error:
        "O pagamento online está fora do ar neste momento. Tente de novo mais tarde.",
    };
  }

  const taxId = onlyDigits(formData.get("payerTaxId")?.toString() ?? "");
  if (!isValidCPF(taxId)) {
    return { error: "Digite um CPF válido para gerar o pagamento por Pix." };
  }

  /* O TELEFONE é obrigatório para o gateway, e o cadastro o trata como
     opcional. Medido contra a API em 15/09/2026: cobrança sem
     `customer.cellphone` devolve 422, e sem `customer` nenhum devolve 400.
     Quem criou a conta sem preencher o WhatsApp não conseguia pagar e lia
     "não conseguimos iniciar o pagamento agora" — sem nenhuma pista do que
     faltava (relatado pelo dono).

     Pedir aqui, com o número da conta já preenchido, resolve os dois casos:
     quem tem só confere, quem não tem escreve uma vez. */
  const whatsapp = formData.get("payerWhatsapp")?.toString().trim() ?? "";
  if (!whatsappValido(whatsapp)) {
    return {
      error: "Confira o WhatsApp de contato — com DDD, são 10 ou 11 números.",
    };
  }

  const user = await getUserById(userId);
  const pkg = getPackage(order.packageTier);
  const amountCents = order.priceCents ?? pkg?.priceCents ?? 0;
  if (amountCents <= 0) {
    return {
      error:
        "O valor deste pedido ainda não foi definido. Tente de novo mais tarde.",
    };
  }

  let base: string;
  try {
    base = await getBaseUrl();
  } catch {
    return {
      error:
        "Não conseguimos iniciar o pagamento agora. Tente de novo em alguns instantes.",
    };
  }

  let charge;
  try {
    charge = await createCharge({
      amountCents,
      externalId: order.id,
      productName: `Site de casamento — ${pkg?.name ?? order.packageTier}`,
      description: order.coupleNames
        ? `Site de casamento de ${order.coupleNames}`
        : undefined,
      returnUrl: `${base}/conta/pedidos/${order.id}`,
      // Ao concluir, passa pela rota que confirma com o AbacatePay e publica
      // o site — só ela pode derrubar o cache. Ela redireciona de volta para
      // o acompanhamento.
      completionUrl: `${base}/api/pagamento/confirmar?pedido=${order.id}`,
      customer: {
        name: order.coupleNames ?? user?.name,
        email: user?.email,
        cellphone: whatsapp,
        taxId,
      },
    });
  } catch (erro) {
    /* O motivo REAL vai para o log do servidor.

       Este `catch` engolia a exceção inteira: o casal via uma frase genérica,
       e quem mantém o site não tinha como saber se a chave expirou, se o
       gateway recusou o telefone ou se a API estava fora. Sem isto, todo
       diagnóstico começava do zero, com o dono clicando e ninguém vendo nada
       (relatado em 15/09/2026). O casal continua vendo a frase curta — o
       recado técnico é para o log, não para ele. */
    console.error("[pagamento] falha ao criar cobrança", {
      pedido: order.id,
      motivo: erro instanceof Error ? erro.message : String(erro),
    });
    return {
      error:
        "Não conseguimos iniciar o pagamento agora. Tente de novo em alguns instantes.",
    };
  }

  await setOrderPayment(order.id, {
    paymentId: charge.id,
    paymentUrl: charge.url,
    paymentStatus: charge.status,
  });

  redirect(charge.url);
}
