"use client";

import { useEffect, useRef } from "react";

/**
 * A confirmação de uma ação que terminou em OUTRA tela.
 *
 * ── O problema ─────────────────────────────────────────────────────────────
 *
 * "Sair da conta" e "Cancelar pedido" funcionavam e levavam para o lugar
 * certo — e não diziam uma palavra sobre o que tinha acabado de acontecer
 * (UX-020). A pessoa clica em cancelar, a tela troca, e ela fica conferindo a
 * lista para ter certeza de que foi.
 *
 * ── Por que pelo HASH, e não por `searchParams` ────────────────────────────
 *
 * `cacheComponents` está ligado, e `searchParams` numa rota cacheada é
 * armadilha conhecida deste projeto (AGENTS.md §4): ou a rota inteira vira
 * dinâmica, ou o build reprova por leitura fora de `<Suspense>`. Só para
 * dizer "pedido cancelado" seria caro.
 *
 * O fragmento (`/conta/pedidos#cancelado`) **nunca chega ao servidor** — é o
 * navegador que o guarda. A página continua cacheada exatamente como era, e
 * quem lê o recado é este componente, no cliente.
 *
 * ── Por que sem `useState` ─────────────────────────────────────────────────
 *
 * O recado é anotação de uma coisa só, que acontece uma vez, na montagem, e
 * nunca muda depois. Passá-lo por estado significaria `setState` dentro de um
 * efeito — um render em cascata para escrever uma frase — e ainda arriscaria
 * divergência de hidratação, já que `window.location` não existe no servidor.
 * O parágrafo nasce vazio e escondido, e o efeito o preenche.
 *
 * O fragmento some do endereço assim que é lido: recarregar não repete a
 * confirmação de algo que aconteceu uma vez.
 */
export default function AvisoPorHash({
  recados,
  className,
}: {
  /** Mapa de fragmento → recado. Ex.: `{ cancelado: "Pedido cancelado." }` */
  recados: Record<string, string>;
  /** Espaçamento de quem chama. Escondido, o elemento não ocupa nada. */
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const chave = window.location.hash.replace(/^#/, "");
    const recado = chave ? recados[chave] : undefined;
    const el = ref.current;
    if (!recado || !el) return;

    el.textContent = recado;
    el.hidden = false;
    // Tira o fragmento sem recarregar e sem empilhar histórico.
    window.history.replaceState(null, "", window.location.pathname);

    /* E some sozinho. Sem isto, o recado ficava plantado na tela até a pessoa
       trocar de página: quem saiu da conta continuava lendo "Vocês saíram da
       conta" enquanto navegava pela vitrine, como se fosse um aviso que não
       acabou (relatado pelo dono em 15/09/2026, UX-031).

       Sete segundos: tempo de ler uma frase curta sem correr, e curto o
       bastante para não virar mobília. O leitor de tela já anunciou no
       instante em que o texto entrou — o `role="status"` não depende do
       parágrafo continuar visível. */
    const somem = window.setTimeout(() => {
      el.hidden = true;
    }, 7000);
    return () => window.clearTimeout(somem);
  }, [recados]);

  return (
    <p
      ref={ref}
      hidden
      role="status"
      className={`surface-sunken rounded-[3px] px-4 py-3 text-[14.5px] leading-relaxed text-(--c-ink) ${className ?? ""}`}
    />
  );
}
