"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
  icone: string;
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
    dias === null
      ? null
      : dias > 1
        ? `Faltam ${dias} dias para o casamento 💚`
        : dias === 1
          ? "É amanhã! 💚"
          : dias === 0
            ? "É hoje! 💚"
            : null;

  return (
    <aside className="flex flex-col gap-5 lg:sticky lg:top-6 lg:h-fit lg:w-72 lg:shrink-0">
      <div className="flex flex-col gap-3 rounded-2xl border border-(--color-gold)/40 bg-white p-5">
        <div className="flex flex-col gap-0.5">
          <p className="text-base font-semibold leading-snug">{titulo}</p>
          {subtitulo && (
            <p className="text-xs text-(--color-olive)/60">{subtitulo}</p>
          )}
        </div>
        {linkDoSite && (
          <Link
            href={linkDoSite}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm w-full"
          >
            Ver nosso site
          </Link>
        )}
      </div>

      {/* Rolagem horizontal no celular: menu lateral não cabe numa tela de
          390px, e empilhar 7 itens empurraria o conteúdo para baixo da dobra. */}
      <nav className="no-scrollbar -mx-6 flex gap-2 overflow-x-auto px-6 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
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
              className={`flex shrink-0 items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-150 lg:shrink hover:-translate-y-0.5 ${
                ativo
                  ? "border-(--color-olive) bg-(--color-blush) shadow-sm"
                  : "border-(--color-gold)/30 bg-white hover:border-(--color-gold)/60"
              }`}
            >
              <span aria-hidden className="text-lg leading-none">
                {item.icone}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  {item.rotulo}
                  {item.alerta && (
                    <span
                      title="Precisa da atenção de vocês"
                      className="size-1.5 shrink-0 rounded-full bg-amber-500"
                    />
                  )}
                </span>
                <span className="hidden text-xs text-(--color-olive)/55 lg:block">
                  {item.descricao}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
