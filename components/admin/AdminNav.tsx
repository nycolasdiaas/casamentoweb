"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth-actions";
import { SITE_NAME } from "@/lib/site";

/**
 * Faixa G · a barra de navegação da operação.
 *
 * Ela não existia. Cada tela do `/admin` abria com um `<h1>` e três links
 * sublinhados soltos ao lado — e como os links eram diferentes em cada página
 * (cada uma listava as OUTRAS três), não havia como saber onde se estava sem
 * ler o título. A prancha G resolve com uma barra só, igual nas quatro, com o
 * item atual sublinhado em `--mark`.
 *
 * Mora no layout, e não em cada página, pela mesma razão das abas do painel do
 * casal: assim ela não remonta ao navegar, e a operação lê como um painel em
 * vez de quatro páginas soltas.
 *
 * A inicial no círculo é da conta logada. Não é enfeite: quem opera costuma ter
 * o painel do casal aberto na aba do lado, e o círculo é a diferença imediata
 * entre "estou no meu admin" e "estou vendo o painel de um cliente".
 *
 * Cliente só pelo `usePathname`, que marca o item ativo — mesma razão do
 * `CascaDoPainel` no painel do casal.
 */

const ITENS = [
  { href: "/admin/dashboard", rotulo: "Dashboard" },
  { href: "/admin/pedidos", rotulo: "Pedidos" },
  { href: "/admin/presentes", rotulo: "Presentes" },
  { href: "/admin/casamento", rotulo: "Casamento" },
];

export default function AdminNav({ iniciais }: { iniciais: string }) {
  const caminho = usePathname();

  /* O item ativo é o mais ESPECÍFICO que casa com o caminho: `/admin` é
     prefixo de todos os outros e acenderia em todas as telas. */
  const atual =
    ITENS.map((i) => i.href)
      .filter((href) => caminho === href || caminho.startsWith(`${href}/`))
      .sort((a, b) => b.length - a.length)[0] ?? "";
  return (
    <header className="border-b border-(--c-rule) bg-(--c-surface)">
      <div className="trilho py-3.5 flex items-center justify-between gap-6">
        <div className="flex items-center gap-7 min-w-0">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5 shrink-0">
            <Image
              src="/logo-enlace.png"
              alt=""
              width={24}
              height={24}
              className="h-6 w-auto object-contain"
            />
            <span className="t-display text-[19px] leading-none text-(--c-ink)">
              {SITE_NAME}
            </span>
            <span className="meta text-[11px] text-(--c-ink-2)">admin</span>
          </Link>

          <nav className="flex items-center gap-5 overflow-x-auto no-scrollbar">
            {ITENS.map((item) => {
              const ativo = item.href === atual;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={ativo ? "page" : undefined}
                  className={`whitespace-nowrap text-[14px] pb-1 border-b-2 transition-colors ${
                    ativo
                      ? "border-(--c-mark) text-(--c-ink)"
                      : "border-transparent text-(--c-ink-2) hover:text-(--c-ink)"
                  }`}
                >
                  {item.rotulo}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-[13px] text-(--c-ink-2) transition-colors hover:text-(--c-ink) cursor-pointer"
            >
              Sair
            </button>
          </form>
          <span
            className="flex size-8 items-center justify-center rounded-full bg-(--c-rule) t-data text-[12px] text-(--c-ink)"
            aria-hidden="true"
          >
            {iniciais}
          </span>
        </div>
      </div>
    </header>
  );
}
