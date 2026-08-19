"use client";

import { apagarConviteAction } from "@/app/actions/invite-actions";

/**
 * Apagar o convite inteiro, com confirmação.
 *
 * Diferente de apagar um bloco, isto NÃO tem desfazer: o documento sai do
 * banco e o desenho não volta. Por isso a pergunta nomeia o convite — "Apagar
 * Convite 2?" é uma pergunta que dá para responder; "tem certeza?" é uma que
 * se responde no automático.
 *
 * Client component só por causa do `confirm`. A ação continua sendo a mesma
 * server action, com a mesma verificação de dono.
 */
export default function ApagarConvite({
  siteId,
  inviteId,
  orderId,
  nome,
}: {
  siteId: string;
  inviteId: string;
  orderId: string;
  nome: string;
}) {
  return (
    <form
      action={apagarConviteAction}
      onSubmit={(e) => {
        if (
          !confirm(
            `Apagar "${nome}"? O desenho não volta — os outros convites de vocês continuam.`
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="siteId" value={siteId} />
      <input type="hidden" name="inviteId" value={inviteId} />
      <input type="hidden" name="orderId" value={orderId} />
      <button
        type="submit"
        className="min-h-11 px-1 text-[13px] text-(--c-ink-2) underline underline-offset-4 transition-colors hover:text-(--c-mark)"
      >
        Apagar convite
      </button>
    </form>
  );
}
