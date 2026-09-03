"use client";

import { useMemo, useState } from "react";
import GiftPixModal from "@/components/gifts/GiftPixModal";
import type { PixParaConvidado } from "@/components/gifts/GiftPixModal";
import { formatPriceCents } from "@/lib/format";

export type Gift = {
  id: string;
  category: string;
  name: string;
  description?: string | null;
  priceCents: number | null;
};

type Foto = { id: string; blurDataUrl: string | null };

type Faixa = "Todos" | "Até R$ 100" | "R$ 100 a R$ 250" | "Acima de R$ 250";

const FAIXAS: Faixa[] = ["Todos", "Até R$ 100", "R$ 100 a R$ 250", "Acima de R$ 250"];

function dentroDaFaixa(faixa: Faixa, priceCents: number | null): boolean {
  if (faixa === "Todos") return true;
  // Presente de valor livre (priceCents null) não cabe em nenhuma faixa de
  // preço fixo — só aparece quando "Todos" está selecionado.
  if (priceCents === null) return false;
  const reais = priceCents / 100;
  if (faixa === "Até R$ 100") return reais <= 100;
  if (faixa === "R$ 100 a R$ 250") return reais > 100 && reais <= 250;
  return reais > 250;
}

/**
 * Lista de presentes em página inteira (o `/presentes` do casal legado).
 *
 * Grid único (sem categoria — decisão registrada no handoff de design desta
 * tela), com filtro por faixa de preço e imagem por presente quando o casal
 * cadastrou uma. "Já presenteado" é derivado de `presenteados` (ids com pelo
 * menos uma linha em gift_contributions) — automático, o casal não marca
 * nada à mão (ver regras-de-negocio: reintroduzir esse trabalho manual foi
 * barrado).
 */
export default function GiftGallery({
  gifts,
  pix,
  siteId,
  fotos,
  presenteados,
}: {
  gifts: Gift[];
  pix: PixParaConvidado | null;
  siteId: string;
  fotos: Record<string, Foto>;
  presenteados: string[];
}) {
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [faixa, setFaixa] = useState<Faixa>("Todos");
  const jaPresenteado = useMemo(() => new Set(presenteados), [presenteados]);

  const filtrados = gifts.filter((g) => dentroDaFaixa(faixa, g.priceCents));

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-center justify-center gap-x-3.5 gap-y-2.5">
        <span className="font-serif text-[13px] tracking-[0.16em] uppercase text-(--color-muted)">
          Filtrar
        </span>
        {FAIXAS.map((label) => {
          const ativo = label === faixa;
          return (
            <button
              key={label}
              type="button"
              onClick={() => setFaixa(label)}
              className={`px-[15px] py-2 text-sm tracking-[0.04em] border transition-colors ${
                ativo
                  ? "border-(--color-gold) bg-(--color-blush) text-(--color-olive)"
                  : "border-(--color-gold)/45 text-[#7d8577] hover:border-(--color-gold)/70"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-5">
        <span className="flex-1 h-px bg-(--color-gold) opacity-60" />
        <span className="font-serif text-[13px] tracking-[0.16em] uppercase text-(--color-muted) whitespace-nowrap">
          {filtrados.length} {filtrados.length === 1 ? "presente" : "presentes"}
        </span>
        <span className="flex-1 h-px bg-(--color-gold) opacity-60" />
      </div>

      {filtrados.length === 0 ? (
        <p className="font-serif text-sm text-(--color-muted) text-center py-6">
          Nenhum presente nessa faixa de preço.
        </p>
      ) : (
        <ul
          className="grid gap-6"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}
        >
          {filtrados.map((gift) => {
            const foto = fotos[gift.id];
            const recebido = jaPresenteado.has(gift.id);
            return (
              <li key={gift.id} className="flex">
                <button
                  type="button"
                  onClick={() => setSelectedGift(gift)}
                  className="flex-1 flex flex-col text-left overflow-hidden border border-(--color-gold)/55 bg-(--color-blush) transition-all duration-[180ms] hover:border-(--color-gold) hover:shadow-[0_10px_24px_rgba(61,74,54,0.10)] hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-(--color-olive)"
                >
                  <div className="relative w-full aspect-[4/3] bg-[#e4e2d8] overflow-hidden">
                    {foto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/gf/${foto.id}`}
                        alt={gift.name}
                        loading="lazy"
                        className="w-full h-full object-cover [filter:saturate(.94)]"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="font-script text-2xl text-(--color-gold)/60">
                          {gift.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    {recebido && (
                      <span className="absolute inset-0 flex items-center justify-center bg-(--color-paper)/72">
                        <span className="text-xs tracking-[0.18em] uppercase text-(--color-olive) border border-(--color-gold) bg-(--color-paper) px-3 py-[7px]">
                          Já presenteado
                        </span>
                      </span>
                    )}
                  </div>

                  <div className="p-4 pt-4 pb-[18px] flex flex-col gap-2 flex-1">
                    <span className="font-serif text-lg text-(--color-olive) leading-[1.3] text-pretty">
                      {gift.name}
                    </span>
                    {gift.description && (
                      <span className="font-serif text-[15px] italic text-[#7d8577] leading-relaxed text-pretty">
                        {gift.description}
                      </span>
                    )}
                    <span className="mt-auto pt-3.5 border-t border-(--color-gold)/35 flex items-baseline justify-between gap-2.5">
                      <span className="font-serif text-lg text-(--color-olive)">
                        {formatPriceCents(gift.priceCents)}
                      </span>
                      <span className="font-serif text-xs tracking-[0.18em] text-(--color-gold) uppercase">
                        {recebido ? "Recebido" : "Presentear"}
                      </span>
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {selectedGift && (
        <GiftPixModal
          gift={selectedGift}
          pix={pix}
          siteId={siteId}
          foto={fotos[selectedGift.id]}
          onClose={() => setSelectedGift(null)}
        />
      )}
    </div>
  );
}
