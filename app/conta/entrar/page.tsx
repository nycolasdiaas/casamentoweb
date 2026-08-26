"use client";

import Link from "next/link";
import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import PendingVeil from "@/components/ui/PendingVeil";
import CascaDeConta from "@/components/account/CascaDeConta";
import { Botao, Campo } from "@/components/ui/prensa";
import { signinAction } from "@/app/actions/account-actions";

/**
 * C1 · GET /conta/entrar → POST signinAction
 *
 * Só a camada visual mudou: a action, o `useActionState` e o `PendingVeil`
 * são os mesmos.
 */
function AvisoDeSenhaRedefinida() {
  const params = useSearchParams();
  if (params.get("redefinida") !== "1") return null;
  return (
    <div className="aviso text-(--c-ok)" role="status">
      <span className="etiqueta-ponto" aria-hidden="true" />
      <p className="aviso-texto flex-1">
        Senha redefinida. Entre com a senha nova.
      </p>
    </div>
  );
}

export default function SigninPage() {
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string } | undefined, formData: FormData) => {
      return signinAction(formData);
    },
    undefined
  );

  return (
    <CascaDeConta
      titulo="Bom ver vocês de novo"
      chamada="Entre para continuar o site de vocês."
      foto={{
        src: "/enlace/casal.png",
        lado: "esquerda",
        legenda: "O site continua exatamente onde vocês pararam.",
      }}
      rodape={
        <p className="t-corpo-p text-(--c-ink-2) text-center">
          Ainda não têm conta?{" "}
          <Link
            href="/conta/criar"
            className="text-(--c-ink) underline underline-offset-4"
          >
            Criar conta
          </Link>
        </p>
      }
    >
      <PendingVeil
        ativo={pending}
        label="Entrando na conta de vocês"
        sublabel="Conferindo os dados e abrindo o painel."
      />

      <Suspense fallback={null}>
        <AvisoDeSenhaRedefinida />
      </Suspense>

      <form action={action} className="flex flex-col gap-5">
        <Campo
          rotulo="E-mail"
          type="email"
          name="email"
          autoComplete="email"
          required
        />
        <Campo
          rotulo="Senha"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          erro={state?.error}
          acessorio={
            <Link
              href="/conta/esqueci"
              className="text-[12.5px] text-(--c-ink-2) underline underline-offset-4 hover:text-(--c-ink)"
            >
              Esqueci a senha
            </Link>
          }
        />

        <Botao type="submit" carregando={pending} larguraCheia className="mt-1">
          Entrar
        </Botao>
      </form>
    </CascaDeConta>
  );
}
