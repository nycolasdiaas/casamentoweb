"use client";

import { useState } from "react";
import GiftPixModal from "@/components/gifts/GiftPixModal";
import type { PixParaConvidado } from "@/components/gifts/GiftPixModal";
import { formatPriceCents } from "@/lib/format";
import type { Gift } from "@/components/gifts/GiftGallery";

type Foto = { id: string; blurDataUrl: string | null };

/**
 * Grade de presentes do site do casal, no visual do molde.
 *
 * Client component porque abre o modal do Pix. Estilizado só com os tokens
 * (var(--accent), var(--ink)...), então serve qualquer template — o desenho
 * muda pela paleta, não por JSX duplicado.
 *
 * `pix` vem de fora e pode ser `null`. NÃO existe fallback aqui de propósito:
 * este componente já mostrou a chave de outra pessoa em todo site do produto,
 * e a lição foi que "um valor padrão" para destino de dinheiro é sempre o
 * destino errado de alguém.
 *
 * Imagem, descrição e "já presenteado" seguem o mesmo desenho de
 * `GiftGallery` (a vitrine `/presentes` do site legado) — mesma unidade
 * visual, só trocando os tokens fixos pelos do tema do molde.
 */
export default function GiftGrid({
  gifts,
  pix,
  siteId,
  fotos = {},
  presenteados = [],
}: {
  gifts: Gift[];
  pix: PixParaConvidado | null;
  siteId: string;
  fotos?: Record<string, Foto>;
  presenteados?: string[];
}) {
  const [aberto, setAberto] = useState<Gift | null>(null);

  if (gifts.length === 0) return null;

  return (
    <>
      {/* Mesma grade da vitrine `/presentes`: `auto-fill` com faixa mínima de
          240px. O `grid-cols-2` fixo que existia aqui deixava dois cartões
          gigantes por linha assim que o card ganhou imagem. */}
      <div
        className="grid gap-6"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}
      >
        {gifts.map((gift, i) => {
          const foto = fotos[gift.id];
          const recebido = presenteados.includes(gift.id);
          return (
            <button
              key={gift.id}
              type="button"
              onClick={() => setAberto(gift)}
              className="motion-rise-in flex flex-col overflow-hidden border text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              style={
                {
                  background: "color-mix(in srgb, var(--paper) 88%, white)",
                  borderColor:
                    "color-mix(in srgb, var(--accent) 50%, transparent)",
                  // Escalonado: os cartões entram um a um em vez de a grade
                  // inteira piscar de uma vez. O atraso para no 8º para a
                  // última linha de uma lista longa não ficar esperando.
                  "--motion-delay": `${Math.min(i, 7) * 60}ms`,
                } as React.CSSProperties
              }
            >
              <div
                className="relative w-full aspect-[4/3] overflow-hidden"
                style={{
                  background: "color-mix(in srgb, var(--ink) 8%, var(--paper))",
                }}
              >
                {foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/gf/${foto.id}`}
                    alt={gift.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center text-xl opacity-40"
                    style={{ color: "var(--accent)" }}
                  >
                    {gift.name.charAt(0)}
                  </div>
                )}
                {recebido && (
                  <span
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ background: "color-mix(in srgb, var(--paper) 72%, transparent)" }}
                  >
                    <span
                      className="text-[10px] tracking-[0.18em] uppercase px-2.5 py-1.5 border"
                      style={{
                        color: "var(--ink)",
                        borderColor: "var(--accent)",
                        background: "var(--paper)",
                      }}
                    >
                      Já presenteado
                    </span>
                  </span>
                )}
              </div>

              {/* `color: var(--ink)` explícito: sem ele o texto herda o que a
                  seção do molde estiver ditando, e em vários deles isso
                  significa nome e descrição praticamente invisíveis sobre o
                  fundo claro do cartão. */}
              <div
                className="flex flex-1 flex-col items-center gap-1.5 px-3.5 pt-3.5 pb-4 text-center"
                style={{ color: "var(--ink)" }}
              >
                <div className="font-[family-name:var(--font-display)] text-[15.5px] font-medium leading-tight">
                  {gift.name}
                </div>
                {gift.description && (
                  <div className="text-[12.5px] italic leading-snug opacity-85">
                    {gift.description}
                  </div>
                )}
                {/* formatPriceCents já cobre o preço nulo ("você decide"), que
                    é o mesmo texto usado em /presentes — sem duplicar a
                    regra. */}
                <div className="text-sm mt-auto pt-1.5">
                  {formatPriceCents(gift.priceCents)}
                </div>
                <span
                  className="mt-0.5 text-[10.5px] tracking-[0.2em] uppercase px-4 py-2 border transition-colors hover:opacity-80"
                  style={{
                    borderColor: "color-mix(in srgb, var(--ink) 50%, transparent)",
                    color: "var(--ink)",
                  }}
                >
                  {recebido ? "Recebido" : "Presentear"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {aberto && (
        <GiftPixModal
          gift={aberto}
          pix={pix}
          siteId={siteId}
          foto={fotos[aberto.id]}
          onClose={() => setAberto(null)}
        />
      )}
    </>
  );
}
