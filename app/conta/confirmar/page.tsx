import Link from "next/link";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { confirmEmailToken } from "@/app/actions/email-verification-actions";
import { SITE_NAME } from "@/lib/site";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: `Confirmar e-mail | ${SITE_NAME}`,
};

export const dynamic = "force-dynamic";

export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = await confirmEmailToken(token ?? "");
  const ok = result === "ok";

  return (
    <main
      className={`${inter.className} flex-1 flex items-center justify-center bg-(--color-paper) px-6 py-16 text-(--color-olive)`}
    >
      <div className="w-full max-w-sm flex flex-col gap-6 text-center">
        <p className="text-xs font-medium tracking-[0.25em] uppercase text-(--color-gold)">
          {SITE_NAME}
        </p>

        <span className="text-4xl" aria-hidden>
          {ok ? "💚" : "⚠️"}
        </span>

        <h1 className="text-2xl font-bold tracking-tight">
          {ok ? "E-mail confirmado!" : "Link inválido ou expirado"}
        </h1>

        <p className="text-sm text-(--color-olive)/75 leading-relaxed">
          {ok
            ? "Prontinho. Agora vocês já podem enviar o pedido — e a gente avisa por e-mail quando a prévia do site estiver pronta."
            : "Esse link já foi usado ou passou das 24 horas. Entrem na conta e peçam um novo pelo aviso no topo do painel."}
        </p>

        <Link href="/conta" className="btn btn-primary">
          Ir para o painel
        </Link>
      </div>
    </main>
  );
}
