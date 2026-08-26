import Link from "next/link";
import type { Metadata } from "next";
import ResetPasswordForm from "@/components/account/ResetPasswordForm";
import CascaDeConta from "@/components/account/CascaDeConta";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Criar senha nova | ${SITE_NAME}`,
};

/**
 * C4 · GET /conta/redefinir?token=…
 *
 * Continua servidor: o token vem de `searchParams` e só o formulário é
 * cliente. Sem foto, pela mesma razão do /conta/esqueci — é tela de
 * meio-de-caminho, aberta a partir do e-mail.
 */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <CascaDeConta
      semFoto
      titulo="Criar senha nova"
      chamada="Escolha uma senha que vocês lembrem."
      rodape={
        <p className="t-corpo-p text-(--c-ink-2)">
          <Link
            href="/conta/entrar"
            className="text-(--c-ink) underline underline-offset-4"
          >
            ← Voltar para entrar
          </Link>
        </p>
      }
    >
      <ResetPasswordForm token={token ?? ""} />
    </CascaDeConta>
  );
}
