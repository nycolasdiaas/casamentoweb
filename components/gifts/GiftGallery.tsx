"use client";

import { useState } from "react";
import GiftPixModal from "@/components/gifts/GiftPixModal";
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

export default function GiftGallery({ categories }: { categories: Category[] }) {
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);

  return (
    <div className="flex flex-col gap-10">
      {categories.map(({ category, gifts }) => (
        <section key={category} className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <h2 className="font-script text-xl text-(--color-olive) shrink-0">
              {category}
            </h2>
            <div className="flex-1 border-t border-(--color-gold)" />
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
          onClose={() => setSelectedGift(null)}
        />
      )}
    </div>
  );
}
