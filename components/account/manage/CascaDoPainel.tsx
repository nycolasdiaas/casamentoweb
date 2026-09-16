"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Abas, EtiquetaDoPedido, Icone, type Aba } from "@/components/ui/prensa";
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
  orderId,
  iniciais,
}: {
  titulo: string;
  status: OrderStatus;
  linkDoSite: string | null;
  abas: Aba[];
  avisos: Aviso[];
  recentes: number;
  /** Repassado ao sino, que marca os recados do time como lidos ao abrir. */
  orderId: string;
  /** Iniciais do casal — o mesmo círculo do cabeçalho da conta (prancha E1). */
  iniciais: string;
}) {
  const caminho = usePathname();

  /* Transição #6 — a batida do selo "No ar".

     O sinal vem de `?publicado=1`, posto por `/api/pagamento/confirmar` só
     quando AQUELA chamada foi a que publicou. Lido aqui e não na página
     porque o selo mora na casca, que é um layout — e layout não recebe
     `searchParams` no App Router.

     A dupla guarda importa: `status === "published"` junto com o parâmetro.
     Digitar `?publicado=1` na barra de endereços com o pedido ainda em prévia
     não pode animar nada — o selo diria "no ar" sobre um site que não está.

     `useSearchParams` e não `window.location` num efeito: ler no render evita
     o `setState` em efeito que o lint reprova com razão (é um render a mais
     para uma informação que já existia). O limite de Suspense que ele exige
     já está em `app/conta/layout.tsx`, envolvendo esta árvore inteira. */
  const busca = useSearchParams();
  const bateuOSelo =
    status === "published" && busca.get("publicado") === "1";

  /* O parâmetro sai do endereço depois de a animação começar. Sem isso,
     recarregar repetiria a comemoração, e um link do painel copiado com
     `?publicado=1` comemoraria de novo na próxima pessoa que abrisse.
     Comemoração que se repete vira tique nervoso.

     `replaceState` e não `router.replace`: trocar a URL pelo roteador
     remontaria a árvore e mataria a animação no meio. Aqui só o endereço
     muda; o React não fica sabendo, que é exatamente o que se quer. */
  useEffect(() => {
    if (!bateuOSelo) return;
    const params = new URLSearchParams(window.location.search);
    params.delete("publicado");
    const resto = params.toString();
    window.history.replaceState(
      null,
      "",
      window.location.pathname + (resto ? `?${resto}` : "")
    );
  }, [bateuOSelo]);

  /* A aba ativa é a mais ESPECÍFICA que casa com o caminho.
     Comparar por prefixo direto acenderia "Início" em todas as telas — o
     href dele é o prefixo de todos os outros. Pegando o mais longo que casa,
     `/pedidos/4821/fotos` acende Fotos e `/pedidos/4821` acende Início. */
  const ativa =
    abas
      .filter((a) => caminho === a.href || caminho.startsWith(`${a.href}/`))
      .sort((a, b) => b.href.length - a.href.length)[0]?.href ?? abas[0].href;

  return (
    /* SEM `overflow-hidden` aqui: o sino mora nesta casca e abre um painel
       `absolute` logo abaixo do botão. Com o recorte na casca, o painel era
       cortado na borda e o casal via só a primeira linha (UX-029). O recorte
       existia para arredondar a base, e é isso que a faixa de abas faz agora,
       por conta própria. */
    <div className="surface-flat rounded-[3px] bg-(--c-surface)">
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
          <EtiquetaDoPedido
            status={status}
            className={bateuOSelo ? "selo-noar" : undefined}
          />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {linkDoSite && (
            <Link
              href={linkDoSite}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2 text-[13.5px] text-(--c-ink)"
            >
              <span className="underline underline-offset-4">Ver o site</span>
              <Icone nome="setaDireita" tamanho={16} />
            </Link>
          )}
          <Avisos avisos={avisos} recentes={recentes} orderId={orderId} />
          <span
            className="flex size-[30px] items-center justify-center rounded-full bg-(--c-olive) t-data text-[11px] text-(--c-paper-warm)"
            aria-hidden="true"
          >
            {iniciais}
          </span>
        </div>
      </div>

      <Abas
        abas={abas}
        ativa={ativa}
        className="border-b-0 overflow-hidden rounded-b-[3px]"
      />
    </div>
  );
}
