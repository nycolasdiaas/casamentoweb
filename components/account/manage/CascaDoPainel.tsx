"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Abas, EtiquetaDoPedido, type Aba } from "@/components/ui/prensa";
import Avisos from "@/components/account/manage/Avisos";
import type { Aviso } from "@/lib/site/avisos";
import type { OrderStatus } from "@/lib/orderStatus";

/**
 * Faixa E · a casca do painel: barra do site + as sete abas.
 *
 * Substitui o menu lateral. As duas formas funcionavam; a razão de trocar é a
 * regra de largura da Fundação A3 — a coluna de 288px comia um quarto da tela
 * em toda aba, e as telas que mais precisam de espaço (Conteúdo com prévia ao
 * lado, a grade de Fotos, a tabela de Convites) eram justamente as que menos
 * tinham. Com as abas em cima, cada uma recebe o trilho inteiro.
 *
 * O que o menu lateral fazia e as abas continuam fazendo: dizer onde o casal
 * parou sem ele precisar abrir as sete telas. A `contagem` carrega o número
 * (fotos, convites, cotas) e a `pendencia` carrega a palavra "falta" em
 * `--warn`.
 *
 * O que se perdeu de propósito: a descrição de uma linha por item ("Nomes,
 * data, locais, história"). Numa barra ela viraria legenda e a barra viraria
 * parágrafo — e o rótulo já diz o suficiente para quem está dentro do painel.
 *
 * Client component só pelo `usePathname`, que marca a aba ativa.
 */
export default function CascaDoPainel({
  titulo,
  status,
  linkDoSite,
  abas,
  avisos,
  recentes,
  iniciais,
}: {
  titulo: string;
  status: OrderStatus;
  linkDoSite: string | null;
  abas: Aba[];
  avisos: Aviso[];
  recentes: number;
  /** Iniciais do casal — o mesmo círculo do cabeçalho da conta (prancha E1). */
  iniciais: string;
}) {
  const caminho = usePathname();

  /* A aba ativa é a mais ESPECÍFICA que casa com o caminho.
     Comparar por prefixo direto acenderia "Início" em todas as telas — o
     href dele é o prefixo de todos os outros. Pegando o mais longo que casa,
     `/pedidos/4821/fotos` acende Fotos e `/pedidos/4821` acende Início. */
  const ativa =
    abas
      .filter((a) => caminho === a.href || caminho.startsWith(`${a.href}/`))
      .sort((a, b) => b.href.length - a.href.length)[0]?.href ?? abas[0].href;

  return (
    <div className="surface-flat rounded-[3px] bg-(--c-surface) overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--c-rule) px-5 py-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <Image
            src="/logo-enlace.png"
            alt=""
            width={26}
            height={26}
            className="h-[26px] w-auto object-contain shrink-0"
          />
          <span className="t-display text-[20px] leading-none text-(--c-ink) truncate">
            {titulo}
          </span>
          <EtiquetaDoPedido status={status} />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {linkDoSite && (
            <Link
              href={linkDoSite}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13.5px] text-(--c-ink) underline underline-offset-4 px-2"
            >
              Ver o site →
            </Link>
          )}
          <Avisos avisos={avisos} recentes={recentes} />
          <span
            className="flex size-[30px] items-center justify-center rounded-full bg-(--c-olive) t-data text-[11px] text-(--c-paper-warm)"
            aria-hidden="true"
          >
            {iniciais}
          </span>
        </div>
      </div>

      <Abas abas={abas} ativa={ativa} className="border-b-0" />
    </div>
  );
}
