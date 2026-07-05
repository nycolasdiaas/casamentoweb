"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth-actions";

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState(
    async (_prevState: { error?: string } | undefined, formData: FormData) => {
      return loginAction(formData);
    },
    undefined
  );

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-24">
      <form action={action} className="w-full max-w-xs flex flex-col gap-4">
        <h1 className="font-serif text-lg text-(--color-olive) text-center">
          Acesso administrativo
        </h1>

        <input
          type="password"
          name="password"
          placeholder="Senha"
          required
          className="border border-(--color-gold) px-4 py-3 font-serif text-sm"
        />

        {state?.error && (
          <p className="text-sm text-red-700">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="bg-(--color-olive) text-white py-3 font-serif text-xs tracking-[0.1em] disabled:opacity-50"
        >
          {pending ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
