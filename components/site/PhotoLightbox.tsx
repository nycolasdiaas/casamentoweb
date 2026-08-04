"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Amplia as fotos do site do convidado.
 *
 * Mora no `SiteRenderer` e escuta o clique por DELEGAÇÃO, em vez de cada
 * molde envolver as fotos num botão. Dois motivos:
 *
 * 1. Alcança os 6 moldes de uma vez, e um molde novo herda sem saber que
 *    existe — mesma razão da coreografia de rolagem.
 * 2. As seções continuam server components puros. Envolver cada `SitePhoto`
 *    num handler obrigaria a transformar as galerias em client components,
 *    e o site do convidado paga bundle por isso.
 *
 * Se o JS não carregar, nada acontece: as fotos continuam lá, só não ampliam.
 * Nenhuma foto some por causa disto.
 */
export default function PhotoLightbox() {
  const [fotos, setFotos] = useState<HTMLImageElement[]>([]);
  const [aberta, setAberta] = useState<number | null>(null);

  // Coleta as fotos de galeria no clique, não na montagem: elas chegam por
  // streaming (PPR), e uma lista tirada cedo demais ficaria incompleta.
  const listar = useCallback(() => {
    const canvas = document.querySelector(".site-canvas");
    if (!canvas) return [];
    return Array.from(canvas.querySelectorAll<HTMLImageElement>("img")).filter(
      (img) => img.naturalWidth > 200 && img.clientWidth > 60
    );
  }, []);

  useEffect(() => {
    function aoClicar(ev: MouseEvent) {
      const alvo = ev.target;
      if (!(alvo instanceof HTMLImageElement)) return;
      if (!alvo.closest(".site-canvas")) return;

      // Foto dentro de link é navegação; ampliar roubaria o clique.
      if (alvo.closest("a")) return;

      const lista = listar();
      const i = lista.indexOf(alvo);
      if (i < 0) return;

      ev.preventDefault();
      setFotos(lista);
      setAberta(i);
    }

    document.addEventListener("click", aoClicar);
    return () => document.removeEventListener("click", aoClicar);
  }, [listar]);

  // Teclado: setas navegam, Esc fecha. É o que se espera de uma ampliação no
  // computador, e sem isso a única saída é o mouse.
  useEffect(() => {
    if (aberta === null) return;

    function aoTeclar(ev: KeyboardEvent) {
      if (ev.key === "Escape") setAberta(null);
      if (ev.key === "ArrowRight") {
        setAberta((i) => (i === null ? i : (i + 1) % fotos.length));
      }
      if (ev.key === "ArrowLeft") {
        setAberta((i) =>
          i === null ? i : (i - 1 + fotos.length) % fotos.length
        );
      }
    }

    // Trava a rolagem de trás: sem isso, rolar dentro da ampliação move a
    // página atrás dela e a pessoa volta perdida.
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", aoTeclar);

    return () => {
      document.body.style.overflow = antes;
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberta, fotos.length]);

  if (aberta === null || !fotos[aberta]) return null;

  const foto = fotos[aberta];
  const ir = (passo: number) =>
    setAberta((i) => (i === null ? i : (i + passo + fotos.length) % fotos.length));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Foto ampliada"
      onClick={() => setAberta(null)}
      className="motion-fade-in fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4"
    >
      <button
        type="button"
        onClick={() => setAberta(null)}
        aria-label="Fechar"
        className="absolute right-4 top-4 z-10 flex size-11 items-center justify-center rounded-full bg-white/10 text-2xl leading-none text-white transition-colors hover:bg-white/20"
      >
        ×
      </button>

      {fotos.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Foto anterior"
            onClick={(e) => {
              e.stopPropagation();
              ir(-1);
            }}
            className="absolute left-3 z-10 flex size-12 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition-colors hover:bg-white/20"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Próxima foto"
            onClick={(e) => {
              e.stopPropagation();
              ir(1);
            }}
            className="absolute right-3 z-10 flex size-12 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition-colors hover:bg-white/20"
          >
            ›
          </button>
        </>
      )}

      {/* `stopPropagation` no wrapper: clicar NA foto não fecha, clicar fora
          fecha. É o gesto que todo mundo já espera. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={foto.currentSrc || foto.src}
        alt={foto.alt || "Foto do casal"}
        onClick={(e) => e.stopPropagation()}
        className="motion-rise-in max-h-[88vh] max-w-[92vw] object-contain shadow-2xl"
      />

      {fotos.length > 1 && (
        <p className="absolute bottom-5 text-xs tracking-[0.2em] text-white/70">
          {aberta + 1} / {fotos.length}
        </p>
      )}
    </div>
  );
}
