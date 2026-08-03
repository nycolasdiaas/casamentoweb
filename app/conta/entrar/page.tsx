"use client";

import Link from "next/link";
import { Suspense, useActionState } from "react";
import PendingVeil from "@/components/ui/PendingVeil";
import { useSearchParams } from "next/navigation";
import { Inter } from "next/font/google";
import { signinAction } from "@/app/actions/account-actions";
import { SITE_NAME } from "@/lib/site";

const inter = Inter({ subsets: ["latin"] });

function ResetSuccessBanner() {
  const params = useSearchParams();
  if (params.get("redefinida") !== "1") return null;
  return (
    <p className="rounded-xl border border-(--color-olive)/30 bg-(--color-blush) px-4 py-3 text-sm text-(--color-olive) text-center">
      Senha redefinida! Entre com a nova senha.
    </p>
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
    <main
      className={`${inter.className} flex-1 flex items-center justify-center bg-(--color-paper) px-6 py-16 text-(--color-olive)`}
    >
      <PendingVeil
        ativo={pending}
        label="Entrando na conta de vocês"
        sublabel="Conferindo os dados e abrindo o painel."
      />

      <div className="motion-rise-in w-full max-w-sm flex flex-col gap-6">
        <div className="text-center flex flex-col gap-2">
          <p className="text-xs font-medium tracking-[0.25em] uppercase text-(--color-gold)">
            {SITE_NAME}
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Entrar</h1>
        </div>

        <Suspense fallback={null}>
          <ResetSuccessBanner />
        </Suspense>

        <form action={action} className="flex flex-col gap-3">
          <input
            type="email"
            name="email"
            placeholder="E-mail"
            required
            className="rounded-xl border border-(--color-gold)/40 bg-white px-4 py-3 text-sm transition-colors focus:border-(--color-gold) focus:outline-none"
          />
          <input
            type="password"
            name="password"
            placeholder="Senha"
            required
            className="rounded-xl border border-(--color-gold)/40 bg-white px-4 py-3 text-sm transition-colors focus:border-(--color-gold) focus:outline-none"
          />

          {state?.error && (
            <p className="text-sm text-red-700">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="btn btn-primary mt-1 w-full"
          >
            {pending ? "Entrando..." : "Entrar"}
          </button>

          <Link
            href="/conta/esqueci"
            className="text-center text-xs text-(--color-olive)/70 underline underline-offset-4 hover:text-(--color-olive)"
          >
            Esqueci minha senha
          </Link>
        </form>

        <p className="text-center text-sm text-(--color-olive)/70">
          Ainda não têm conta?{" "}
          <Link href="/conta/criar" className="underline underline-offset-4">
            Criar conta
          </Link>
        </p>
        <p className="text-center">
          <Link href="/" className="text-xs text-(--color-muted) underline underline-offset-4">
            ← Voltar aos pacotes
          </Link>
        </p>
      </div>
    </main>
  );
}
