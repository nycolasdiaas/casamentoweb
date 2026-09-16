"use client";

import { useEffect } from "react";

/**
 * Troca as cores e a tipografia do quadro sem recarregar a página.
 *
 * ── Por que não recarregar ─────────────────────────────────────────────────
 *
 * O casal mexe num seletor de cor e o valor muda a cada pixel arrastado.
 * Recarregar o iframe a cada mudança daria uma piscada branca por segundo, a
 * rolagem voltaria ao topo e a fonte seria rebaixada de novo — o casal veria
 * um site quebrando, não o site dele mudando de cor.
 *
 * O tema já é CSS: `themeToCssVars` põe `--ink`, `--paper` e `--accent` no
 * wrapper, e as seções nunca falam em hex. Trocar as três variáveis é
 * literalmente a mesma coisa que renderizar de novo, sem o custo.
 *
 * O MODELO continua recarregando, e tem que continuar: ele muda o HTML das
 * seções, não só a cor delas.
 *
 * ── Por que a origem é conferida ───────────────────────────────────────────
 *
 * `postMessage` chega de qualquer janela que tenha referência a esta. A prévia
 * roda dentro de um iframe do próprio painel, mesma origem; qualquer mensagem
 * de fora disso é descartada. Não há segredo aqui para vazar — o pior que um
 * remetente estranho faria é repintar a tela do casal —, mas aceitar comando
 * de qualquer origem é o tipo de porta que depois alguém usa para algo pior.
 */

export type TemaAoVivoMsg = {
  tipo: "enlace:tema";
  ink?: string;
  paper?: string;
  accent?: string;
  /** Id da fonte de título, como em `FONT_STYLES` — vira `var(--f-<id>)`. */
  display?: string;
};

export default function TemaAoVivo() {
  useEffect(() => {
    function aoReceber(evento: MessageEvent) {
      if (evento.origin !== window.location.origin) return;

      const dado = evento.data as TemaAoVivoMsg | undefined;
      if (!dado || dado.tipo !== "enlace:tema") return;

      /* A raiz é o wrapper do `SiteRenderer`, que leva as variáveis do tema
         no `style` inline. Escrever em `:root` não adiantaria: o inline do
         wrapper ganha, e as seções leem o dele. */
      const raiz = document.querySelector<HTMLElement>("[data-tema-raiz]");
      if (!raiz) return;

      // Só cor hexadecimal entra. A variável vai para dentro de `color-mix` em
      // dezenas de lugares, e um valor inválido apaga a seção inteira.
      const cor = (v: string | undefined) =>
        v && /^#[0-9a-fA-F]{6}$/.test(v) ? v : null;

      const ink = cor(dado.ink);
      const paper = cor(dado.paper);
      const accent = cor(dado.accent);

      if (ink) raiz.style.setProperty("--ink", ink);
      if (paper) raiz.style.setProperty("--paper", paper);
      if (accent) raiz.style.setProperty("--accent", accent);

      /* A fonte só troca se o molde a carregar — a classe `variable` dela
         precisa estar na árvore, senão `var(--f-<id>)` não resolve e o título
         cai numa fonte de sistema. A rota da prévia põe as classes de TODAS as
         fontes do molde justamente para que esta linha funcione. */
      if (dado.display && /^[a-z0-9-]+$/.test(dado.display)) {
        raiz.style.setProperty("--font-display", `var(--f-${dado.display})`);
      }
    }

    window.addEventListener("message", aoReceber);
    return () => window.removeEventListener("message", aoReceber);
  }, []);

  return null;
}
