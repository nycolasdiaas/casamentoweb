"use client";

import { useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Transição de entrada de cada tela do painel.
 *
 * ── O bug que esta versão conserta ──────────────────────────────────────────
 *
 * A versão anterior usava `<m.div initial={...}>` do Motion e escolhia o
 * estado inicial com `useReducedMotion()`. Isso quebrava a hidratação: o
 * SERVIDOR renderizava `opacity:0; filter:blur(4px); transform:...` e o
 * CLIENTE renderizava só `opacity:0`, porque `useReducedMotion` só existe no
 * navegador. Quando o React acusa divergência ele NÃO corrige o nó — o HTML do
 * servidor fica como veio, com o desfoque inline, e a animação nunca roda.
 * Resultado: a tela ficava embaçada e não saía mais.
 *
 * ── A regra que esta versão respeita ────────────────────────────────────────
 *
 * **O servidor nunca renderiza conteúdo escondido.** O HTML sai visível; o
 * estado inicial da animação é aplicado no cliente, num `useLayoutEffect`
 * (antes da pintura, então não pisca). Se o JS não carregar — rede ruim,
 * script bloqueado — o casal vê a tela inteira, só sem transição.
 *
 * É a mesma escolha do `gsap.from` na coreografia do site do convidado, e pelo
 * mesmo motivo: animação é enfeite, conteúdo é o produto. Nenhuma animação
 * pode ser capaz de deixar a tela em branco.
 */

const PERCURSO = 22;
const DURACAO = 520;

export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Perguntado aqui, e não no render: é informação do navegador, e lê-la
    // durante o render é o que quebrava a hidratação.
    const menos = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // A Web Animations API é nativa — sem dependência, sem risco de o
    // conteúdo ficar presente num estado intermediário. `fill` não é usado de
    // propósito: quando a animação acaba, o elemento volta ao estilo do CSS,
    // que é o estado visível.
    const quadros = menos
      ? [{ opacity: 0 }, { opacity: 1 }]
      : [
          {
            opacity: 0,
            transform: `translateY(${PERCURSO}px) scale(0.985)`,
            filter: "blur(4px)",
          },
          { opacity: 1, transform: "none", filter: "blur(0px)" },
        ];

    const anim = el.animate(quadros, {
      duration: menos ? 160 : DURACAO,
      // Desaceleração forte: começa depressa e assenta devagar, como algo com
      // peso. Mesma curva do resto do produto.
      easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    });

    return () => anim.cancel();
  }, [pathname]);

  return <div ref={ref}>{children}</div>;
}
