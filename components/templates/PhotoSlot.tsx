"use client";

import { useId } from "react";

// Fotos de casamento de exemplo (Unsplash, uso livre) que preenchem as
// prévias de template. Ficam em public/demo/. Nos sites reais, cada foto é
// trocada pela do casal.
const DEMO_PHOTOS = Array.from({ length: 13 }, (_, i) => `/demo/w${i + 1}.jpg`);

function hashToIndex(key: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h % DEMO_PHOTOS.length;
}

// Ocupa o lugar de uma foto real do casal nas prévias, exibindo uma foto de
// exemplo. Cada slot recebe um id estável (useId) — assim slots diferentes
// mostram fotos diferentes e o mesmo slot mantém a sua entre re-renders.
export default function PhotoSlot({
  label,
  className = "",
  seed,
}: {
  label: string;
  className?: string;
  seed?: string | number;
}) {
  const id = useId();
  const photo = DEMO_PHOTOS[hashToIndex(`${seed ?? ""}:${id}`)];

  return (
    <div className={`relative overflow-hidden bg-black/5 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo}
        alt={`Foto: ${label}`}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  );
}
