"use client";

import { useActionState } from "react";
import { resendVerificationAction } from "@/app/actions/email-verification-actions";

/**
 * Aviso fixo no topo do painel enquanto o e-mail do casal não foi confirmado.
 * Não bloqueia a navegação — só o envio do pedido depende da confirmação.
 */
export default function EmailVerificationBanner({ email }: { email: string }) {
  const [state, action, pending] = useActionState(
    async () => resendVerificationAction(),
    undefined
  );

  return (
    <section className="rounded-2xl border border-[#b8985f] bg-[#fdf8ec] p-5 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <span aria-hidden className="text-lg leading-none">
          ✉️
        </span>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold">Confirmem o e-mail de vocês</p>
          <p className="text-sm text-(--color-olive)/75 leading-relaxed">
            Mandamos um link para <strong>{email}</strong>. É por esse e-mail
            que a gente avisa quando a prévia ficar pronta — e ele precisa
            estar confirmado para enviar o pedido. (Vale olhar o spam.)
          </p>
        </div>
      </div>

      <form action={action} className="flex flex-col gap-2">
        <button
          type="submit"
          disabled={pending}
          className="btn btn-secondary btn-sm self-start"
        >
          {pending ? "Enviando..." : "Reenviar e-mail"}
        </button>
        {state?.info && (
          <p className="text-xs text-(--color-olive)/75">{state.info}</p>
        )}
        {state?.error && <p className="text-xs text-red-700">{state.error}</p>}
      </form>
    </section>
  );
}
