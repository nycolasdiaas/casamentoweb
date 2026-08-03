"use client";

import { useState } from "react";
import GiftPixModal from "@/components/gifts/GiftPixModal";
import type { PixParaConvidado } from "@/components/gifts/GiftPixModal";
import { formatPriceCents } from "@/lib/format";

export type Gift = {
  id: string;
  category: string;
  name: string;
  priceCents: number | null;
};

type Category = {
  category: string;
  gifts: Gift[];
};

/**
 * Lista de presentes em página inteira (o `/presentes` do casal legado).
 *
 * Recebe `pix` e `siteId` pela mesma razão que o `GiftGrid`: o modal não tem
 * mais chave de fallback. Ver o comentário lá.
 */
export default function GiftGallery({
  categories,
  pix,
  siteId,
}: {
  categories: Category[];
  pix: PixParaConvidado | null;
  siteId: string;
}) {
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);

  return (
    <div className="flex flex-col gap-10">
      {categories.map(({ category, gifts }) => (
        <section key={category} className="flex flex-col gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <h2 className="font-script text-xl text-(--color-olive)">
              {category}
            </h2>
            <div className="flex-1 min-w-8 border-t border-(--color-gold)" />
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {gifts.map((gift) => (
              <li key={gift.id} className="flex">
                <button
                  type="button"
                  onClick={() => setSelectedGift(gift)}
                  className="flex-1 flex flex-col justify-between gap-4 border border-(--color-gold) bg-(--color-blush) p-4 text-left transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-(--color-olive)"
                >
                  <span className="font-serif text-sm text-(--color-olive) leading-snug">
                    {gift.name}
                  </span>
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="font-serif text-lg text-(--color-olive)">
                      {formatPriceCents(gift.priceCents)}
                    </span>
                    <span className="font-serif text-xs tracking-[0.1em] text-(--color-gold) uppercase">
                      Presentear
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {selectedGift && (
        <GiftPixModal
          gift={selectedGift}
          pix={pix}
          siteId={siteId}
          onClose={() => setSelectedGift(null)}
        />
      )}
    </div>
  );
}
