"use client";

import { useState } from "react";
import { formatPriceCents } from "@/lib/format";

type DemoGift = { id: string; name: string; priceCents: number };

const DEMO_GIFTS: DemoGift[] = [
  { id: "1", name: "Jantar romântico na lua de mel", priceCents: 25000 },
  { id: "2", name: "Cota da passagem para a lua de mel", priceCents: 50000 },
  { id: "3", name: "Air fryer dos sonhos", priceCents: 40000 },
  { id: "4", name: "Adote um boleto do casal", priceCents: 10000 },
  { id: "5", name: "Jogo de panelas que nunca vai viajar", priceCents: 30000 },
  { id: "6", name: "Presente surpresa (valor livre)", priceCents: 15000 },
];

const DEMO_COPIA_E_COLA =
  "00020126580014br.gov.bcb.pix0136exemplo-demonstracao-nao-pagavel5204000053039865802BR5910ANA E PEDRO6009Fortaleza6304DEMO";

// Vitrine de presentes de demonstração: mesmo fluxo do real (QR + copia e
// cola), mas com dados fictícios e sem registro de contribuição.
export default function DemoGifts() {
  const [selected, setSelected] = useState<DemoGift | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {DEMO_GIFTS.map((gift) => (
          <li key={gift.id} className="flex">
            <button
              type="button"
              onClick={() => setSelected(gift)}
              className="flex-1 flex flex-col justify-between gap-4 border border-(--color-gold) bg-(--color-blush) p-4 text-left transition-colors hover:bg-white"
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
      <p className="font-serif text-[11px] text-(--color-muted) text-center">
        Nomes, preços e quantidade de presentes são definidos pelo casal.
      </p>

      {selected && (
        <DemoPixModal gift={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function DemoPixModal({
  gift,
  onClose,
}: {
  gift: DemoGift;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(DEMO_COPIA_E_COLA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Presentear: ${gift.name}`}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md max-h-[90dvh] overflow-y-auto bg-(--color-paper) border border-(--color-gold) p-6 flex flex-col gap-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-base text-(--color-olive) leading-snug">
              {gift.name}
            </h2>
            <p className="font-serif text-2xl text-(--color-olive)">
              {formatPriceCents(gift.priceCents)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="font-serif text-xl text-(--color-muted) leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="relative border border-(--color-gold) bg-white p-2">
            <FakeQrCode />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="bg-(--color-olive) text-white font-serif text-[10px] tracking-[0.2em] uppercase px-3 py-1 rotate-[-8deg]">
                Exemplo
              </span>
            </span>
          </div>
          <p className="font-serif text-xs text-(--color-muted) text-center">
            No site real, este é o QR Code Pix do casal — sem nenhuma taxa.
          </p>
        </div>

        <div className="flex items-center gap-2 border border-(--color-gold) bg-white px-3 py-2">
          <div className="flex-1 min-w-0 flex flex-col">
            <span className="font-serif text-[10px] tracking-[0.1em] uppercase text-(--color-muted)">
              Pix copia e cola (exemplo)
            </span>
            <span className="font-mono text-xs text-(--color-olive) truncate">
              {DEMO_COPIA_E_COLA}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className={`shrink-0 font-serif text-xs px-3 py-1 border transition-colors ${
              copied
                ? "bg-(--color-olive) border-(--color-olive) text-white"
                : "border-(--color-gold) text-(--color-olive)"
            }`}
          >
            {copied ? "Copiado!" : "Copiar"}
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="bg-(--color-olive) text-white py-2 font-serif text-xs tracking-[0.1em]"
        >
          Entendi, é só um exemplo 💚
        </button>
      </div>
    </div>
  );
}

// Desenho estático que imita um QR Code para a demo.
function FakeQrCode() {
  const cells: boolean[] = [];
  let seed = 42;
  for (let i = 0; i < 441; i++) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    cells.push(seed % 3 !== 0);
  }

  return (
    <svg width={208} height={208} viewBox="0 0 21 21" aria-hidden>
      <rect width={21} height={21} fill="white" />
      {cells.map((filled, i) =>
        filled ? (
          <rect
            key={i}
            x={i % 21}
            y={Math.floor(i / 21)}
            width={1}
            height={1}
            fill="#3d4a36"
          />
        ) : null
      )}
      {[
        [0, 0],
        [14, 0],
        [0, 14],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width={7} height={7} fill="#3d4a36" />
          <rect x={x + 1} y={y + 1} width={5} height={5} fill="white" />
          <rect x={x + 2} y={y + 2} width={3} height={3} fill="#3d4a36" />
        </g>
      ))}
    </svg>
  );
}
