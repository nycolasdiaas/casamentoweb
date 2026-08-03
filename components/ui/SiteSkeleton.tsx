"use client";

import { m } from "motion/react";

/**
 * O esqueleto do site sendo montado.
 *
 * Não é um spinner com outra roupa: é a SILHUETA do que está chegando — capa,
 * nomes, data, contagem, seções. Com o mesmo tempo real de espera, o esqueleto
 * é lido como mais rápido que um indicador giratório, porque a atenção vai
 * para o conteúdo que vem em vez de ir para a espera. E aqui a promessa é
 * honesta: o provisionamento está mesmo criando o site nesse instante.
 *
 * Animado com `motion` (motion.dev) pelo componente `m` — a variante leve, que
 * só funciona sob um `LazyMotion`. Ver MotionProvider: ~4,6 KB em vez de 34.
 *
 * Por que motion e não CSS aqui: o brilho que atravessa cada bloco precisa
 * ENTRAR EM CASCATA, um bloco depois do outro, e continuar em laço. Em CSS
 * isso vira uma variável de atraso por bloco, escrita à mão; aqui é uma
 * propriedade (`delayChildren`) que o pai distribui sozinho.
 *
 * As cores saem de `currentColor`, então o esqueleto herda a paleta de onde
 * estiver: no painel sai oliva; recebendo a tinta do molde escolhido, sai na
 * cor do site do casal — a espera já parece o produto.
 */

const CASCATA = {
  animate: { transition: { staggerChildren: 0.07 } },
};

/** Um bloco do esqueleto: entra subindo e depois respira em laço. */
const BLOCO = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: [0, 1, 0.55, 1],
    y: 0,
    transition: {
      y: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
      opacity: {
        duration: 1.9,
        times: [0, 0.22, 0.6, 1],
        repeat: Infinity,
        repeatDelay: 0.15,
      },
    },
  },
};

function Barra({ className }: { className: string }) {
  return (
    <m.div
      variants={BLOCO}
      className={`rounded-md bg-current/12 ${className}`}
    />
  );
}

export default function SiteSkeleton({
  accent,
  className = "",
}: {
  /** tinta do molde escolhido; sem ela o esqueleto sai na cor do painel */
  accent?: string | null;
  className?: string;
}) {
  return (
    <m.div
      aria-hidden
      initial="initial"
      animate="animate"
      variants={CASCATA}
      style={accent ? { color: accent } : undefined}
      className={`flex w-full flex-col overflow-hidden rounded-xl border border-current/15 bg-white ${className}`}
    >
      {/* Capa: a faixa alta que todo molde abre. O monograma no meio é o que
          faz a silhueta ser reconhecível como convite, e não como "post". */}
      <div className="relative flex h-44 items-center justify-center border-b border-current/10">
        <Barra className="absolute inset-0 rounded-none" />
        <m.div
          variants={BLOCO}
          className="relative size-14 rounded-full bg-current/20"
        />
      </div>

      <div className="flex flex-col items-center gap-3 px-6 py-7">
        {/* Nomes do casal — a linha mais larga, como no site real. */}
        <Barra className="h-5 w-2/3" />
        <Barra className="h-3 w-1/3" />

        {/* Contagem regressiva: quatro caixas. É o bloco que mais identifica
            um site de casamento à primeira vista. */}
        <div className="mt-3 flex w-full justify-center gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Barra key={i} className="h-12 w-14" />
          ))}
        </div>
      </div>

      {/* História (texto corrido) e galeria (grade). */}
      <div className="flex flex-col gap-2.5 border-t border-current/10 px-6 py-6">
        <Barra className="h-3 w-1/4 self-center" />
        {["w-full", "w-full", "w-4/5"].map((largura, i) => (
          <Barra key={`${largura}-${i}`} className={`h-2.5 ${largura}`} />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-current/10 px-6 py-6">
        {[0, 1, 2].map((i) => (
          <Barra key={i} className="aspect-square w-full" />
        ))}
      </div>
    </m.div>
  );
}
