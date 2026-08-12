"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

/**
 * O esqueleto do site SENDO CONSTRUÍDO.
 *
 * Não é um spinner com outra roupa, e agora também não é um bloco que aparece:
 * é a silhueta do que está chegando — capa, monograma, nomes, contagem,
 * história, galeria — montada NA ORDEM em que um site de casamento se lê.
 * Com o mesmo tempo real de espera, ver as peças nascendo é lido como mais
 * rápido que ver um indicador girando, porque a atenção vai para o conteúdo
 * que vem em vez de ir para a espera. E aqui a promessa é honesta: o
 * provisionamento está mesmo criando o site nesse instante.
 *
 * ── Por que GSAP e não CSS ──────────────────────────────────────────────────
 *
 * A construção é uma SEQUÊNCIA com sobreposição: a capa ainda está descendo
 * quando o monograma estoura, e as linhas começam antes de a capa terminar.
 * Em CSS isso vira uma variável de atraso por bloco, calculada à mão, que
 * quebra a cada bloco novo. Numa timeline é a posição relativa ("-=0.15") e o
 * `stagger` fazendo o trabalho.
 *
 * `useGSAP` roda tudo dentro de um `gsap.context()` e REVERTE na desmontagem.
 * Este componente vive numa tela que some assim que o site fica pronto — sem
 * a limpeza, a timeline continuaria viva depois de o nó sair do DOM.
 *
 * ── As duas regras que continuam valendo ────────────────────────────────────
 *
 * 1. `gsap.from`, nunca opacity 0 no CSS. O estado natural do HTML já é o
 *    final: se o JS não carregar, o esqueleto aparece inteiro, só sem
 *    construção. Nenhuma animação pode ser capaz de deixar a tela em branco.
 * 2. As cores saem de `currentColor`, então o esqueleto herda a paleta de onde
 *    estiver — recebendo a tinta do molde escolhido, a espera já parece o
 *    produto que o casal comprou.
 */

function Barra({ className }: { className: string }) {
  return <div className={`sk-peca rounded-md bg-current/12 ${className}`} />;
}

export default function SiteSkeleton({
  accent,
  className = "",
}: {
  /** tinta do molde escolhido; sem ela o esqueleto sai na cor do painel */
  accent?: string | null;
  className?: string;
}) {
  const raiz = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Movimento reduzido do sistema, a menos que a pessoa tenha ligado o
      // movimento neste site (ver InterruptorDeMovimento). Sem construção, o
      // esqueleto fica parado e legível — que é o comportamento correto.
      const querMenos =
        window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
        document.documentElement.dataset.movimento !== "ligado";
      if (querMenos) return;

      const tl = gsap.timeline({
        repeat: -1,
        // A pausa entre uma construção e a próxima. Sem ela, o laço reinicia
        // no mesmo quadro em que termina e parece engasgo, não repetição.
        repeatDelay: 0.5,
        defaults: { ease: "power3.out" },
      });

      tl
        // A capa desce como uma persiana: a faixa alta que todo molde abre.
        .from(".sk-capa", {
          scaleY: 0,
          transformOrigin: "top center",
          duration: 0.55,
        })
        // O monograma estoura com peso. `back.out` passa do ponto e volta —
        // é o que separa "surgiu" de "foi colocado ali".
        .from(
          ".sk-mono",
          { scale: 0, opacity: 0, duration: 0.5, ease: "back.out(2.2)" },
          "-=0.2"
        )
        // Os nomes e a data são DESENHADOS da esquerda, como texto sendo
        // composto — não aparecem prontos.
        .from(
          ".sk-linha",
          {
            scaleX: 0,
            transformOrigin: "left center",
            duration: 0.45,
            stagger: 0.08,
          },
          "-=0.25"
        )
        // A contagem regressiva: quatro caixas caindo no lugar.
        .from(
          ".sk-caixa",
          {
            y: 14,
            opacity: 0,
            scale: 0.85,
            duration: 0.4,
            stagger: 0.06,
            ease: "back.out(1.7)",
          },
          "-=0.15"
        )
        // A história, linha a linha.
        .from(
          ".sk-texto",
          {
            scaleX: 0,
            transformOrigin: "left center",
            duration: 0.35,
            stagger: 0.05,
          },
          "-=0.1"
        )
        // E as fotos por último, que é a ordem em que o casal as envia.
        .from(
          ".sk-foto",
          { opacity: 0, scale: 0.9, duration: 0.4, stagger: 0.07 },
          "-=0.1"
        );
    },
    { scope: raiz }
  );

  return (
    <div
      ref={raiz}
      aria-hidden
      style={accent ? { color: accent } : undefined}
      className={`flex w-full flex-col overflow-hidden rounded-xl border border-current/15 bg-white ${className}`}
    >
      {/* Capa: a faixa alta que todo molde abre. O monograma no meio é o que
          faz a silhueta ser reconhecível como convite, e não como "post". */}
      <div className="relative flex h-44 items-center justify-center border-b border-current/10">
        <div className="sk-capa absolute inset-0 bg-current/12" />
        <div className="sk-mono relative size-14 rounded-full bg-current/20" />
      </div>

      <div className="flex flex-col items-center gap-3 px-6 py-7">
        {/* Nomes do casal — a linha mais larga, como no site real. */}
        <Barra className="sk-linha h-5 w-2/3" />
        <Barra className="sk-linha h-3 w-1/3" />

        {/* Contagem regressiva: quatro caixas. É o bloco que mais identifica
            um site de casamento à primeira vista. */}
        <div className="mt-3 flex w-full justify-center gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Barra key={i} className="sk-caixa h-12 w-14" />
          ))}
        </div>
      </div>

      {/* História (texto corrido) e galeria (grade). */}
      <div className="flex flex-col gap-2.5 border-t border-current/10 px-6 py-6">
        <Barra className="sk-texto h-3 w-1/4 self-center" />
        {["w-full", "w-full", "w-4/5"].map((largura, i) => (
          <Barra key={`${largura}-${i}`} className={`sk-texto h-2.5 ${largura}`} />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-current/10 px-6 py-6">
        {[0, 1, 2].map((i) => (
          <Barra key={i} className="sk-foto aspect-square w-full" />
        ))}
      </div>
    </div>
  );
}
