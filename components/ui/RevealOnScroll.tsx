"use client";

import { useEffect } from "react";

/**
 * Revela os elementos um a um conforme a pessoa desce a página.
 *
 * Usa `ScrollTrigger.batch` do GSAP, que é o idiomático para isto: ele agrupa
 * os elementos que entram na tela juntos e os revela em cascata, com um
 * gatilho por grupo em vez de um por elemento. Rolar devagar revela um de
 * cada vez; rolar rápido revela o grupo escalonado, sem engasgar.
 *
 * TRÊS DECISÕES QUE PROTEGEM O CONTEÚDO:
 *
 * 1. **`gsap.from`, nunca opacity 0 no CSS.** Com `from`, o estado natural do
 *    HTML já é o final: se o JS não carregar — rede ruim, script bloqueado —
 *    a pessoa vê a página inteira, só sem animação. Nenhuma animação pode ser
 *    capaz de deixar a tela em branco.
 * 2. **Import dinâmico dentro do efeito.** O GSAP não entra no bundle inicial
 *    nem bloqueia a hidratação; chega depois que a primeira dobra pintou.
 * 3. **`prefers-reduced-motion` verificado ANTES do import.** Quem pediu menos
 *    movimento não paga nem o download.
 */
export default function RevealOnScroll({
  raiz,
  passo = 0.09,
  percurso = 26,
}: {
  /** seletor do contêiner cujas seções serão reveladas */
  raiz: string;
  /** segundos entre um elemento e o seguinte, dentro do mesmo grupo */
  passo?: number;
  /** pixels que o elemento sobe ao entrar */
  percurso?: number;
}) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ctx: { revert: () => void } | undefined;
    let vivo = true;

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (!vivo) return;
      gsap.registerPlugin(ScrollTrigger);

      const container = document.querySelector<HTMLElement>(raiz);
      if (!container) return;

      ctx = gsap.context(() => {
        const alvos: HTMLElement[] = [];

        container.querySelectorAll<HTMLElement>("section, footer").forEach(
          (secao, i) => {
            // A primeira seção fica de fora: ela já está na tela quando a
            // página abre, e animar o que já está visível faz piscar.
            if (i === 0) return;

            // Seleção SEMÂNTICA, não por profundidade.
            //
            // Duas tentativas anteriores contaram níveis de DOM (filho direto,
            // depois neto) e as duas alcançaram pouco: 14 e depois 23
            // elementos numa página de 6.500px — quase nada acontecia. O
            // problema é que a profundidade de um bloco não diz nada sobre ele
            // ser conteúdo; depende de quantos wrappers de layout existem no
            // caminho, que varia de seção para seção.
            //
            // Aqui a pergunta é outra: o elemento CARREGA conteúdo? Título,
            // parágrafo, item de lista, imagem e cartão carregam. Wrapper de
            // grade não.
            const CONTEUDO =
              "h1, h2, h3, h4, p, li, img, figure, blockquote, " +
              'a[class*="rounded"], div[class*="rounded"], button';

            const candidatos = Array.from(
              secao.querySelectorAll<HTMLElement>(CONTEUDO)
            );

            for (const el of candidatos) {
              // Descarta quem CONTÉM outro candidato: anima o bloco mais
              // interno, senão o cartão e o título dentro dele animariam
              // juntos e o de dentro sumiria no de fora.
              if (candidatos.some((outro) => outro !== el && el.contains(outro))) {
                continue;
              }
              alvos.push(el);
            }
          }
        );

        if (alvos.length === 0) return;

        ScrollTrigger.batch(alvos, {
          // 88% = o elemento começa a aparecer logo que entra pela borda de
          // baixo, e termina antes de chegar ao centro — ninguém lê texto que
          // ainda está se mexendo.
          start: "top 88%",
          once: true,
          onEnter: (lote) =>
            gsap.from(lote, {
              opacity: 0,
              y: percurso,
              duration: 0.65,
              ease: "power3.out",
              stagger: passo,
              overwrite: true,
            }),
        });
      }, container);
    })();

    return () => {
      vivo = false;
      ctx?.revert();
    };
  }, [raiz, passo, percurso]);

  return null;
}
