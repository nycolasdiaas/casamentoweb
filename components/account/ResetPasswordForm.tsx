"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Botao, Campo } from "@/components/ui/prensa";
import { resetPasswordAction } from "@/app/actions/password-reset-actions";

/**
 * C4 · o formulário de /conta/redefinir → POST resetPasswordAction.
 *
 * O token continua vindo em campo escondido e o `minLength={8}` continua
 * casando com o que o servidor exige. O que mudou:
 *
 * - O link quebrado deixou de ser uma linha vermelha solta e virou beco COM
 *   SAÍDA — a regra da faixa H, que vale aqui do mesmo jeito: quem chegou por
 *   um link velho não fez nada de errado e precisa do próximo passo na tela.
 * - "Link inválido" saiu. A Voz proíbe "inválido"; o texto agora diz o que
 *   houve (o link expirou ou veio cortado) e o que fazer.
 */
export default function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(
    resetPasswordAction,
    undefined
  );

  if (!token) {
    return (
      <div className="surface-raised rounded-[3px] p-6 flex flex-col gap-3 items-start">
        <span className="meta text-(--c-warn)">Link vencido</span>
        <p className="t-corpo text-(--c-ink)">
          Este link já foi usado ou veio cortado no e-mail. Pedir um novo leva
          um minuto.
        </p>
        <Link href="/conta/esqueci" className="btn btn-ink btn-sm mt-1">
          Pedir link novo
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="token" value={token} />
      <Campo
        rotulo="Nova senha"
        type="password"
        name="password"
        autoComplete="new-password"
        required
        minLength={8}
        ajuda="Mínimo de 8 caracteres."
      />
      <Campo
        rotulo="Repita a senha"
        type="password"
        name="confirm"
        autoComplete="new-password"
        required
        minLength={8}
        erro={state?.error}
      />
      <Botao type="submit" carregando={pending} className="self-start">
        Salvar e entrar
      </Botao>
    </form>
  );
}
