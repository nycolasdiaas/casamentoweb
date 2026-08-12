"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import NumeroQueConta from "@/components/ui/NumeroQueConta";

/**
 * Menu do painel de gerenciamento do casal.
 *
 * Client component só por causa do `usePathname` — é ele que marca o item
 * ativo. Sem isso, o casal navega e nada indica onde ele está, que é a
 * primeira coisa que um menu tem que fazer.
 */

export type ItemMenu = {
  href: string;
  rotulo: string;
  descricao: string;
  /** avisa que algo exige atenção nesta tela (ex: lista sem chave Pix) */
  alerta?: boolean;
};

/**
 * Dias que faltam, calculado NO CLIENTE.
 *
 * No servidor isto seria `Date.now()` durante o render — impuro, e com Cache
 * Components ligado a contagem congelaria dentro do cache: o casal veria
 * "faltam 102 dias" por dias a fio. Aqui recalcula a cada carregamento.
 */
function diasAte(data: string | null): number | null {
  if (!data) return null;
  // Meio-dia evita que fuso horário empurre a data um dia para trás.
  const alvo = new Date(`${data}T12:00:00`).getTime();
  if (Number.isNaN(alvo)) return null;
  return Math.ceil((alvo - Date.now()) / 86_400_000);
}

export default function ManageSidebar({
  itens,
  titulo,
  weddingDate,
  linkDoSite,
}: {
  itens: ItemMenu[];
  titulo: string;
  /** yyyy-mm-dd; a contagem é feita aqui, no cliente */
  weddingDate: string | null;
  linkDoSite: string | null;
}) {
  const caminho = usePathname();

  const dias = diasAte(weddingDate);
  const subtitulo =
    dias === null ? null : dias > 1 ? (
      <>
        Faltam <NumeroQueConta valor={dias} /> dias para o casamento
      </>
    ) : dias === 1 ? (
      "É amanhã!"
    ) : dias === 0 ? (
      "É hoje!"
    ) : null;

  return (
    <aside className="flex flex-col gap-6 lg:sticky lg:top-6 lg:h-fit lg:w-72 lg:shrink-0">
      <div className="surface-raised rounded-[3px] p-5 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="t-display text-[20px] leading-snug text-(--c-ink)">
            {titulo}
          </p>
          {subtitulo && (
            <p className="t-data text-[12.5px] text-(--c-ink-2)">{subtitulo}</p>
          )}
        </div>
        {linkDoSite && (
          <Link
            href={linkDoSite}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-quiet btn-sm w-full"
          >
            Ver nosso site
          </Link>
        )}
      </div>

      {/* Rolagem horizontal no celular: menu lateral não cabe numa tela de
          390px, e empilhar 6 itens empurraria o conteúdo para baixo da dobra.

          O emoji de ícone saiu. No lugar dele, o item ATIVO ganha um fio de
          2px na aresta — que é o que um menu precisa dizer (onde estou), sem o
          tell de interface gerada. */}
      <nav className="no-scrollbar -mx-6 flex gap-2 overflow-x-auto px-6 lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0 lg:surface-flat lg:rounded-[3px]">
        {itens.map((item) => {
          // Comparação exata na raiz e por prefixo no resto: sem isso "Início"
          // ficaria aceso em todas as telas, já que todo caminho começa com o
          // dele.
          const ativo =
            item.href === caminho ||
            (item.href !== caminho &&
              caminho.startsWith(`${item.href}/`) &&
              item.href.split("/").length > 4);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={ativo ? "page" : undefined}
              className={`flex shrink-0 flex-col gap-0.5 rounded-[3px] border px-4 py-3 transition-colors lg:shrink lg:rounded-none lg:border-x-0 lg:border-t-0 lg:border-b lg:last:border-b-0 ${
                ativo
                  ? "border-(--c-ink) bg-(--c-sunken) lg:border-(--c-rule) lg:border-l-2 lg:border-l-(--c-ink)"
                  : "border-(--c-rule) lg:border-l-2 lg:border-l-transparent hover:bg-(--c-sunken)"
              }`}
            >
              <span className="flex items-center gap-1.5 text-sm font-medium text-(--c-ink)">
                {item.rotulo}
                {item.alerta && (
                  <span
                    title="Precisa da atenção de vocês"
                    className="size-1.5 shrink-0 rounded-full bg-(--c-mark)"
                  />
                )}
              </span>
              <span className="hidden text-[13px] leading-snug text-(--c-ink-2) lg:block">
                {item.descricao}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
