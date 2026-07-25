"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Inter } from "next/font/google";
import { requestPasswordResetAction } from "@/app/actions/password-reset-actions";
import { SITE_NAME } from "@/lib/site";

const inter = Inter({ subsets: ["latin"] });

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(
    requestPasswordResetAction,
    undefined
  );

  return (
    <main
      className={`${inter.className} flex-1 flex items-center justify-center bg-(--color-paper) px-6 py-16 text-(--color-olive)`}
    >
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="text-center flex flex-col gap-2">
          <p className="text-xs font-medium tracking-[0.25em] uppercase text-(--color-gold)">
            {SITE_NAME}
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Esqueci a senha</h1>
          <p className="text-sm text-(--color-olive)/70">
            Digite o e-mail da conta e enviamos um link para criar uma nova
            senha.
          </p>
        </div>

        {state?.info ? (
          <p className="rounded-xl border border-(--color-olive)/30 bg-(--color-blush) px-4 py-3 text-sm text-(--color-olive) leading-relaxed text-center">
            {state.info}
          </p>
        ) : (
          <form action={action} className="flex flex-col gap-3">
            <input
              type="email"
              name="email"
              placeholder="E-mail"
              autoComplete="email"
              required
              className="rounded-xl border border-(--color-gold)/40 bg-white px-4 py-3 text-sm focus:border-(--color-gold) focus:outline-none"
            />

            {state?.error && (
              <p className="text-sm text-red-700">{state.error}</p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="mt-1 rounded-full bg-(--color-olive) text-white py-3.5 text-sm font-medium transition-colors hover:bg-(--color-olive)/90 disabled:opacity-50"
            >
              {pending ? "Enviando..." : "Enviar link"}
            </button>
          </form>
        )}

        <p className="text-center">
          <Link
            href="/conta/entrar"
            className="text-xs text-(--color-muted) underline underline-offset-4"
          >
            ← Voltar para entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
