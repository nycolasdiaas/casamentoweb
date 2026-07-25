"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPasswordAction } from "@/app/actions/password-reset-actions";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(
    resetPasswordAction,
    undefined
  );

  if (!token) {
    return (
      <div className="flex flex-col gap-3 text-center">
        <p className="text-sm text-red-700">
          Link inválido ou incompleto. Peça um novo.
        </p>
        <Link
          href="/conta/esqueci"
          className="text-xs text-(--color-olive) underline underline-offset-4"
        >
          Pedir novo link
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="token" value={token} />
      <input
        type="password"
        name="password"
        placeholder="Nova senha (mín. 8 caracteres)"
        autoComplete="new-password"
        required
        minLength={8}
        className="rounded-xl border border-(--color-gold)/40 bg-white px-4 py-3 text-sm focus:border-(--color-gold) focus:outline-none"
      />
      <input
        type="password"
        name="confirm"
        placeholder="Confirmar nova senha"
        autoComplete="new-password"
        required
        minLength={8}
        className="rounded-xl border border-(--color-gold)/40 bg-white px-4 py-3 text-sm focus:border-(--color-gold) focus:outline-none"
      />

      {state?.error && <p className="text-sm text-red-700">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-full bg-(--color-olive) text-white py-3.5 text-sm font-medium transition-colors hover:bg-(--color-olive)/90 disabled:opacity-50"
      >
        {pending ? "Salvando..." : "Salvar nova senha"}
      </button>
    </form>
  );
}
