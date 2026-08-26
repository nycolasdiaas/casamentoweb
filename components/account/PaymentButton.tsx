"use client";

import { useActionState } from "react";
import { startPaymentAction } from "@/app/actions/payment-actions";
import { Botao, Campo, Icone } from "@/components/ui/prensa";

/**
 * E10 · o botão que leva ao pagamento.
 *
 * ── O que este componente NÃO faz, e por quê ───────────────────────────────
 *
 * Ele não desenha checkout. O QR do Pix, o copia-e-cola e a espera da
 * confirmação são do **AbacatePay** — `startPaymentAction` cria a cobrança e
 * manda o casal para a tela hospedada do provedor. A prancha E10.2 desenha um
 * checkout dentro do produto; refazê-lo aqui seria manter duas telas de
 * pagamento em paralelo, com dois lugares para o BR Code divergir. Decisão do
 * dono, registrada na auditoria (E10-01).
 *
 * ── O que mudou no texto ───────────────────────────────────────────────────
 *
 * "Efetuar pagamento" era vocabulário de cartório — exatamente o exemplo que o
 * princípio V1.1 da Voz usa ("Confirme sua presença", não "Efetue a
 * confirmação de comparecimento"). E ele não dizia o que acontece depois. O
 * rótulo da prancha é **"Pagar e publicar"**, que é a ação inteira: o site
 * entra no ar quando o pagamento cai.
 *
 * O rótulo também não some ao carregar. Trocar o texto do botão por
 * "Abrindo…" faz quem clicou achar que apertou o botão errado — por isso a
 * rodinha entra AO LADO do rótulo, que é o que `Botao` já faz.
 */
export default function PaymentButton({
  orderId,
  amountLabel,
}: {
  orderId: string;
  amountLabel: string;
}) {
  const [state, action, pending] = useActionState(startPaymentAction, undefined);

  return (
    <form action={action} className="flex w-full flex-col gap-4">
      <input type="hidden" name="orderId" value={orderId} />

      <Campo
        rotulo="CPF de quem paga"
        name="payerTaxId"
        inputMode="numeric"
        required
        maxLength={14}
        placeholder="000.000.000-00"
        ajuda="O Pix exige o CPF do pagador. A gente não guarda esse número."
        erro={state?.error}
      />

      <Botao type="submit" tamanho="g" carregando={pending} larguraCheia>
        Pagar e publicar · {amountLabel}
      </Botao>

      <p className="flex items-center justify-center gap-2 text-[12px] text-(--c-ink-2)">
        <Icone nome="escudo" tamanho={16} />
        Pix · pagamento seguro
      </p>
    </form>
  );
}
