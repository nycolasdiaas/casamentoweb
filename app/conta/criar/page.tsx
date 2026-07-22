"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Inter } from "next/font/google";
import { signupAction } from "@/app/actions/account-actions";
import { SITE_NAME } from "@/lib/site";

const inter = Inter({ subsets: ["latin"] });

export default function SignupPage() {
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string } | undefined, formData: FormData) => {
      return signupAction(formData);
    },
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
          <h1 className="text-2xl font-bold tracking-tight">
            Criar a conta de vocês
          </h1>
          <p className="text-sm text-(--color-olive)/70">
            Escolham o pacote e o estilo, mandem o material — e a gente monta
            tudo.
          </p>
        </div>

        <form action={action} className="flex flex-col gap-3">
          <input
            type="text"
            name="name"
            placeholder="Nomes de vocês (ex: Ana & Pedro)"
            required
            className="rounded-xl border border-(--color-gold)/40 bg-white px-4 py-3 text-sm focus:border-(--color-gold) focus:outline-none"
          />
          <input
            type="email"
            name="email"
            placeholder="E-mail"
            required
            className="rounded-xl border border-(--color-gold)/40 bg-white px-4 py-3 text-sm focus:border-(--color-gold) focus:outline-none"
          />
          <input
            type="tel"
            name="whatsapp"
            placeholder="WhatsApp (com DDD)"
            className="rounded-xl border border-(--color-gold)/40 bg-white px-4 py-3 text-sm focus:border-(--color-gold) focus:outline-none"
          />
          <input
            type="password"
            name="password"
            placeholder="Senha (mín. 6 caracteres)"
            required
            minLength={6}
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
            {pending ? "Criando..." : "Criar conta"}
          </button>
        </form>

        <p className="text-center text-sm text-(--color-olive)/70">
          Já têm conta?{" "}
          <Link href="/conta/entrar" className="underline underline-offset-4">
            Entrar
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
