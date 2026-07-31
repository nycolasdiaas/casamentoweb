"use client";

import { useState } from "react";

type Dispositivo = "desktop" | "celular";

// 390px é o iPhone moderno; é a largura em que o convidado abre o link do
// WhatsApp, e por isso é onde o site precisa estar certo.
const LARGURA_CELULAR = 390;

/**
 * A prévia do site dentro do painel, com troca entre computador e celular.
 *
 * Não é um "motor de preview": é um <iframe> da rota `/preview/<token>`, que
 * já renderiza o site de verdade, com os dados de verdade. O que o casal vê
 * aqui é literalmente o que o convidado vai ver — não uma simulação que pode
 * divergir.
 *
 * Por isso o botão de recarregar existe: salvar o conteúdo ou o estilo derruba
 * o cache pelo `updateTag`, mas o iframe já montado não sabe disso sozinho.
 */
export default function LivePreview({
  previewToken,
  className = "",
}: {
  previewToken: string;
  className?: string;
}) {
  const [dispositivo, setDispositivo] = useState<Dispositivo>("desktop");
  // Muda a `key` para forçar o iframe a remontar — recarregar de fora só
  // funcionaria com mesma origem e ainda assim é mais frágil que remontar.
  const [recarga, setRecarga] = useState(0);

  const src = `/preview/${previewToken}`;
  const noCelular = dispositivo === "celular";

  return (
    <section
      className={`flex flex-col gap-3 rounded-2xl border border-(--color-gold)/40 bg-white p-6 ${className}`}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-lg font-semibold">Como está ficando</h2>
          <p className="text-sm text-(--color-olive)/70 leading-relaxed">
            É o site de verdade, com o conteúdo de vocês. Depois de salvar
            alguma mudança, clique em atualizar.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Alternador — os dois ícones do canto */}
          <div
            role="group"
            aria-label="Ver em"
            className="flex items-center gap-1 rounded-full border border-(--color-gold)/50 p-1"
          >
            {(
              [
                { id: "desktop", icone: "🖥️", rotulo: "Computador" },
                { id: "celular", icone: "📱", rotulo: "Celular" },
              ] as const
            ).map(({ id, icone, rotulo }) => {
              const ativo = dispositivo === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDispositivo(id)}
                  aria-pressed={ativo}
                  title={rotulo}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    ativo
                      ? "bg-[#2f3a29] text-white"
                      : "text-(--color-olive) hover:bg-(--color-blush)"
                  }`}
                >
                  <span aria-hidden>{icone}</span>
                  <span className="hidden sm:inline">{rotulo}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setRecarga((n) => n + 1)}
            className="btn btn-secondary btn-sm"
          >
            Atualizar
          </button>
        </div>
      </div>

      {/* O palco. Fundo escuro para o site "flutuar", como nas prévias. */}
      <div className="flex justify-center rounded-xl bg-[#1c1c1c] p-3 sm:p-5">
        <div
          className="overflow-hidden rounded-lg bg-white shadow-2xl transition-[width] duration-300"
          style={{
            width: noCelular ? LARGURA_CELULAR : "100%",
            maxWidth: "100%",
          }}
        >
          <iframe
            key={`${dispositivo}-${recarga}`}
            src={src}
            title="Prévia do site de vocês"
            loading="lazy"
            className="block w-full border-0"
            style={{ height: noCelular ? 720 : 620 }}
          />
        </div>
      </div>

      <p className="text-xs text-(--color-muted) leading-relaxed">
        {noCelular
          ? "É assim que o convidado vê ao abrir o link no WhatsApp — a maioria abre pelo celular."
          : "Vista de computador. Vale conferir no celular também: é por lá que a maioria dos convidados abre."}{" "}
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-(--color-olive) underline underline-offset-2"
        >
          Abrir em outra aba
        </a>
      </p>
    </section>
  );
}
