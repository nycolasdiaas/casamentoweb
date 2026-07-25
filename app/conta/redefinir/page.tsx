import Link from "next/link";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ResetPasswordForm from "@/components/account/ResetPasswordForm";
import { SITE_NAME } from "@/lib/site";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: `Redefinir senha | ${SITE_NAME}`,
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main
      className={`${inter.className} flex-1 flex items-center justify-center bg-(--color-paper) px-6 py-16 text-(--color-olive)`}
    >
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="text-center flex flex-col gap-2">
          <p className="text-xs font-medium tracking-[0.25em] uppercase text-(--color-gold)">
            {SITE_NAME}
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Nova senha</h1>
          <p className="text-sm text-(--color-olive)/70">
            Escolha uma nova senha para a conta de vocês.
          </p>
        </div>

        <ResetPasswordForm token={token ?? ""} />

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
