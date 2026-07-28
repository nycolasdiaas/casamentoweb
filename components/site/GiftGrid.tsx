"use client";

import { useState } from "react";
import GiftPixModal from "@/components/gifts/GiftPixModal";
import { formatPriceCents } from "@/lib/format";
import type { Gift } from "@/components/gifts/GiftGallery";

/**
 * Grade de presentes do site do casal, no visual do molde.
 *
 * Client component porque abre o modal do Pix. Estilizado só com os tokens
 * (var(--accent), var(--ink)...), então serve qualquer template — o desenho
 * muda pela paleta, não por JSX duplicado.
 */
export default function GiftGrid({ gifts }: { gifts: Gift[] }) {
  const [aberto, setAberto] = useState<Gift | null>(null);

  if (gifts.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3.5">
        {gifts.map((gift) => (
          <div
            key={gift.id}
            className="border px-3.5 pt-5 pb-4 flex flex-col items-center gap-2 text-center transition-all hover:-translate-y-0.5 hover:shadow-lg"
            style={{
              background: "color-mix(in srgb, var(--paper) 88%, white)",
              borderColor: "color-mix(in srgb, var(--accent) 50%, transparent)",
            }}
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
        <GiftPixModal gift={aberto} onClose={() => setAberto(null)} />
      )}
    </>
  );
}
