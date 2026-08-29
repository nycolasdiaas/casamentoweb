"use client";

import Link from "next/link";
import { useActionState } from "react";
import CascaDeConta from "@/components/account/CascaDeConta";
import { Botao, Campo, Icone } from "@/components/ui/prensa";
import { requestPasswordResetAction } from "@/app/actions/password-reset-actions";

/**
 * C3 · GET /conta/esqueci → POST requestPasswordResetAction
 *
 * O sucesso é ESTADO DA MESMA ROTA, não outra página: quem acabou de pedir o
 * link precisa ver, no mesmo lugar, para qual e-mail ele foi. Trocar de tela
 * leva embora justamente o dado que a pessoa quer conferir.
 *
 * O texto de sucesso continua vindo do servidor (`state.info`) — é ele que
 * responde "se existe uma conta com esse e-mail", sem confirmar se existe.
 */
export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(
    requestPasswordResetAction,
    undefined
  );

  return (
    <CascaDeConta
      semFoto
      titulo="Esqueceram a senha?"
      chamada="Escreva o e-mail da conta e a gente manda um link para criar uma senha nova."
      rodape={
        <p className="t-corpo-p text-(--c-ink-2)">
          <Link
            href="/conta/entrar"
            className="inline-flex items-center gap-1.5 text-(--c-ink)"
          >
            <Icone nome="setaEsquerda" tamanho={16} />
            <span className="underline underline-offset-4">
              Voltar para entrar
            </span>
          </Link>
        </p>
      }
    >
      {state?.info ? (
        <div className="surface-raised rounded-[3px] p-6 flex gap-4 items-start">
          <span
            className="mt-1 w-2 h-2 rounded-full bg-(--c-ok) shrink-0"
            aria-hidden="true"
          />
          <div className="flex flex-col gap-1.5">
            <p className="t-display text-[20px] leading-tight text-(--c-ink)">
              Link enviado
            </p>
            <p className="t-corpo-p text-(--c-ink-2)">{state.info}</p>
          </div>
        </div>
      ) : (
        <form action={action} className="flex flex-col gap-5">
          <Campo
            rotulo="E-mail"
            type="email"
            name="email"
            autoComplete="email"
            required
            erro={state?.error}
          />
          <Botao type="submit" carregando={pending} className="self-start">
            Enviar link
          </Botao>
        </form>
      )}
    </CascaDeConta>
  );
}
