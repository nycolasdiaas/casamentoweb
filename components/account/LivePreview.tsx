"use client";

import { useEffect, useRef, useState } from "react";

type Dispositivo = "desktop" | "celular";

// Larguras VIRTUAIS: o iframe é montado nelas e depois escalado para caber no
// espaço disponível. Sem isso o site dentro do quadro reagiria à largura do
// quadro, não à do dispositivo — e o "modo computador" renderizava como tela
// estreita, que foi exatamente o que apareceu na primeira versão.
const LARGURA: Record<Dispositivo, number> = {
  desktop: 1280,
  celular: 390,
};

const ALTURA: Record<Dispositivo, number> = {
  desktop: 800,
  celular: 780,
};

/**
 * A prévia do site dentro do painel, com troca entre computador e celular.
 *
 * Não é um motor de preview: é um <iframe> de uma rota que já renderiza o
 * site de verdade. O que o casal vê aqui é o que o convidado vai ver.
 *
 * `src` muda conforme o momento:
 *   - montando o pedido → a prévia do MOLDE escolhido (ainda não há site)
 *   - pedido enviado    → `/preview/<token>`, já com o conteúdo do casal
 */
export default function LivePreview({
  src,
  titulo = "Como está ficando",
  descricao,
  fullBleed = true,
}: {
  src: string;
  titulo?: string;
  descricao?: string;
  /** Escapa da coluna estreita do painel e ocupa a largura da janela. */
  fullBleed?: boolean;
}) {
  const [dispositivo, setDispositivo] = useState<Dispositivo>("desktop");
  const [recarga, setRecarga] = useState(0);
  const [escala, setEscala] = useState(1);
  const palcoRef = useRef<HTMLDivElement>(null);

  const larguraVirtual = LARGURA[dispositivo];
  const alturaVirtual = ALTURA[dispositivo];

  // Escala para o viewport virtual caber na largura disponível. Nunca amplia
  // (min com 1): esticar 390px de celular até 1200 mostraria um site borrado
  // que ninguém vai ver assim.
  useEffect(() => {
    const palco = palcoRef.current;
    if (!palco) return;

    const medir = () => {
      const disponivel = palco.clientWidth;
      if (disponivel > 0) setEscala(Math.min(1, disponivel / larguraVirtual));
    };

    medir();
    const observer = new ResizeObserver(medir);
    observer.observe(palco);
    return () => observer.disconnect();
  }, [larguraVirtual]);

  const noCelular = dispositivo === "celular";

  return (
    <section
      className={`flex flex-col gap-3 ${
        fullBleed
          ? // Truque do full-bleed: sai da coluna do painel e volta a ocupar a
            // largura da janela, sem precisar reestruturar o AccountShell.
            "relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 border-y border-(--c-rule) bg-white px-4 py-6 sm:px-8"
          : "surface-raised rounded-[3px] p-6"
      }`}
    >
      <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">{titulo}</h2>
          {descricao && (
            <p className="text-sm text-(--c-ink-2) leading-relaxed">
              {descricao}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div
            role="group"
            aria-label="Ver em"
            className="flex items-center gap-1 rounded-[3px] border border-(--c-rule) p-1"
          >
            {(
              [
                { id: "desktop", rotulo: "Computador" },
                { id: "celular", rotulo: "Celular" },
              ] as const
            ).map(({ id, rotulo }) => {
              const ativo = dispositivo === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDispositivo(id)}
                  aria-pressed={ativo}
                  title={rotulo}
                  className={`flex items-center gap-1.5 rounded-[2px] px-3 py-1.5 text-xs font-medium transition-colors ${
                    ativo
                      ? "bg-[#1a1d21] text-white"
                      : "text-(--c-ink) hover:bg-(--c-sunken)"
                  }`}
                >
                  <span className="hidden sm:inline">{rotulo}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setRecarga((n) => n + 1)}
            className="btn btn-quiet btn-sm"
          >
            Atualizar
          </button>
        </div>
      </div>

      {/* Palco. A altura acompanha a escala para não sobrar faixa preta. */}
      <div
        ref={palcoRef}
        className="mx-auto w-full max-w-[1400px] overflow-hidden rounded-xl bg-[#1c1c1c] p-3 sm:p-5"
      >
        <div
          className="mx-auto overflow-hidden rounded-lg bg-white shadow-2xl"
          style={{
            width: larguraVirtual * escala,
            height: alturaVirtual * escala,
          }}
        >
          <iframe
            key={`${dispositivo}-${recarga}`}
            src={src}
            title="Prévia do site de vocês"
            className="block border-0"
            style={{
              width: larguraVirtual,
              height: alturaVirtual,
              transform: `scale(${escala})`,
              transformOrigin: "top left",
            }}
          />
        </div>
      </div>

      <p className="mx-auto w-full max-w-[1400px] text-xs text-(--c-ink-2) leading-relaxed">
        {noCelular
          ? `Simulando ${larguraVirtual}px — é assim que o convidado vê ao abrir o link no WhatsApp.`
          : `Simulando ${larguraVirtual}px de tela cheia.`}{" "}
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-(--c-ink) underline underline-offset-2"
        >
          Abrir em outra aba
        </a>
      </p>
    </section>
  );
}
