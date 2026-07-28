import Link from "next/link";
import { Inter } from "next/font/google";
import { logoutAction } from "@/app/actions/auth-actions";
import { SITE_NAME } from "@/lib/site";

const inter = Inter({ subsets: ["latin"] });

type Tab = "pedidos" | "casamento";

/**
 * Casca do painel da Enlace. A navegação aqui é SÓ do negócio da plataforma —
 * o casamento pessoal (convidados/confirmações/presentes) é outro projeto e
 * vive em /admin/casamento, sem link no meio dos pedidos.
 */
export default function AdminShell({
  active,
  title,
  subtitle,
  actions,
  children,
}: {
  active: Tab;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.className} flex-1 flex flex-col bg-(--color-paper)`}>
      <header className="border-b border-(--color-gold)/30 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
          <Link
            href="/admin/pedidos"
            className="text-sm font-semibold tracking-tight text-(--color-olive)"
          >
            {SITE_NAME}{" "}
            <span className="font-normal text-(--color-muted)">· equipe</span>
          </Link>
          <nav className="flex items-center gap-4 text-xs">
            <Link
              href="/admin/pedidos"
              className={
                active === "pedidos"
                  ? "font-semibold text-(--color-olive) underline underline-offset-4"
                  : "text-(--color-olive)/70 underline underline-offset-4 hover:text-(--color-olive)"
              }
            >
              Pedidos
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-(--color-olive)/70 underline underline-offset-4 hover:text-(--color-olive)"
              >
                Sair
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold tracking-tight text-(--color-olive)">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-(--color-olive)/70">{subtitle}</p>
            )}
          </div>
          {actions}
        </div>

        {children}
      </main>
    </div>
  );
}
