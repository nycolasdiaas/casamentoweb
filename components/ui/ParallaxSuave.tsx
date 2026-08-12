"use client";

import { useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Parallax de rolagem — deliberadamente pequeno.
 *
 * O elemento se desloca alguns pixels a menos que a página enquanto ela rola,
 * o que dá profundidade sem que ninguém consiga apontar o que mudou. É esse o
 * ponto: parallax que se NOTA vira enjoo e briga com a leitura.
 *
 * `scrub: true` amarra o progresso à barra de rolagem em vez de disparar uma
 * animação com duração própria. Sem isso o elemento continuaria se movendo
 * depois que a pessoa parou de rolar — que é exatamente o que faz parallax
 * mal feito parecer travado.
 *
 * Movimento reduzido desliga por inteiro, e aqui sem meio-termo: deslocamento
 * atrelado à rolagem é o gatilho clássico de desconforto vestibular. Respeita
 * também o interruptor do site (ver InterruptorDeMovimento).
 */
export default function ParallaxSuave({
  children,
  /** pixels de defasagem no percurso inteiro. Acima de ~60 deixa de ser sutil. */
  percurso = 40,
  className = "",
}: {
  children: ReactNode;
  percurso?: number;
  className?: string;
}) {
  const raiz = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const querMenos =
        window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
        document.documentElement.dataset.movimento !== "ligado";
      if (querMenos) return;

      // Só no desktop. Em tela de celular a área visível é curta, o percurso
      // vira uma fração dela, e o efeito só custa bateria.
      if (window.innerWidth < 1024) return;

      gsap.to(raiz.current, {
        y: percurso,
        ease: "none",
        scrollTrigger: {
          trigger: raiz.current,
          // Do momento em que entra pela borda de baixo até sair por cima:
          // o percurso inteiro é percorrido enquanto o elemento está visível.
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    },
    { scope: raiz }
  );

  return (
    <div ref={raiz} className={className}>
      {children}
    </div>
  );
}
