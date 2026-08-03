"use client";

import { useState } from "react";
import GiftPixModal from "@/components/gifts/GiftPixModal";
import type { PixParaConvidado } from "@/components/gifts/GiftPixModal";
import { formatPriceCents } from "@/lib/format";
import type { Gift } from "@/components/gifts/GiftGallery";

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
 */
export default function GiftGrid({
  gifts,
  pix,
  siteId,
}: {
  gifts: Gift[];
  pix: PixParaConvidado | null;
  siteId: string;
}) {
  const [aberto, setAberto] = useState<Gift | null>(null);

  if (gifts.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3.5">
        {gifts.map((gift, i) => (
          <div
            key={gift.id}
            className="motion-rise-in border px-3.5 pt-5 pb-4 flex flex-col items-center gap-2 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            style={
              {
                background: "color-mix(in srgb, var(--paper) 88%, white)",
                borderColor:
                  "color-mix(in srgb, var(--accent) 50%, transparent)",
                // Escalonado: os cartões entram um a um em vez de a grade
                // inteira piscar de uma vez. O atraso para no 8º para a última
                // linha de uma lista longa não ficar esperando meio segundo.
                "--motion-delay": `${Math.min(i, 7) * 60}ms`,
              } as React.CSSProperties
            }
          >
            <div className="font-[family-name:var(--font-display)] text-[18.5px] font-medium leading-tight min-h-[46px] flex items-center">
              {gift.name}
            </div>
            {/* formatPriceCents já cobre o preço nulo ("você decide"), que é
                o mesmo texto usado em /presentes — sem duplicar a regra. */}
            <div className="text-sm opacity-75">
              {formatPriceCents(gift.priceCents)}
            </div>
            <button
              type="button"
              onClick={() => setAberto(gift)}
              className="mt-0.5 text-[10.5px] tracking-[0.2em] uppercase px-4 py-2 border transition-colors hover:opacity-80 focus-visible:outline focus-visible:outline-2"
              style={{
                borderColor: "color-mix(in srgb, var(--ink) 50%, transparent)",
                color: "var(--ink)",
              }}
            >
              Presentear
            </button>
          </div>
        ))}
      </div>

      {aberto && (
        <GiftPixModal
          gift={aberto}
          pix={pix}
          siteId={siteId}
          onClose={() => setAberto(null)}
        />
      )}
    </>
  );
}
