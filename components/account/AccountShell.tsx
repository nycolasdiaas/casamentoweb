import Link from "next/link";
import { Inter } from "next/font/google";
import { signoutAction } from "@/app/actions/account-actions";
import { SITE_NAME } from "@/lib/site";

const inter = Inter({ subsets: ["latin"] });

type Tab = "inicio" | "pedidos";

// Casca comum das telas logadas do casal: cabeçalho com marca, navegação
// entre as abas do hub e botão de sair.
export default function AccountShell({
  active,
  children,
}: {
  active: Tab;
  children: React.ReactNode;
}) {
  const linkClass = (tab: Tab) =>
    active === tab
      ? "text-xs text-(--color-olive) font-semibold underline underline-offset-4"
      : "text-xs text-(--color-olive)/70 underline underline-offset-4 hover:text-(--color-olive)";

  return (
    <div
      className={`${inter.className} flex-1 flex flex-col bg-(--color-paper) text-(--color-olive)`}
    >
      <header className="bg-white/90 backdrop-blur border-b border-(--color-gold)/30">
        <div className="max-w-3xl mx-auto w-full px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            {SITE_NAME}
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/conta" className={linkClass("inicio")}>
              Início
            </Link>
            <Link href="/conta/pedidos" className={linkClass("pedidos")}>
              Meus pedidos
            </Link>
            <form action={signoutAction}>
              <button
                type="submit"
                className="text-xs text-(--color-olive)/70 underline underline-offset-4 hover:text-(--color-olive)"
              >
                Sair
              </button>
            </form>
          </nav>
        </div>
      </header>

      {/* max-w-5xl e não 3xl: a prévia do site mora aqui dentro, e em 768px
          o quadro ficava estreito demais para o modo computador parecer
          computador. Os blocos de texto seguem limitados por conta própria. */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 flex flex-col gap-8">
        {children}
      </main>
    </div>
  );
}
