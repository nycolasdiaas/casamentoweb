"use client";

import { useEffect, useRef } from "react";

// Desenha um "QR Code" determinístico (mesma semente = mesmo desenho) num
// canvas, só para as prévias de template parecerem reais. Não é um QR
// decodificável.
export default function FakeQrCanvas({
  seed,
  ink = "#1c1c1c",
  size = 168,
}: {
  seed: string;
  ink?: string;
  size?: number;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const cells = 25;
    const cellSize = Math.floor(size / cells) || 1;
    const px = cells * cellSize;
    el.width = px;
    el.height = px;
    const ctx = el.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, px, px);

    let h = 2166136261 >>> 0;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    const rnd = () => {
      h ^= h << 13;
      h >>>= 0;
      h ^= h >> 17;
      h ^= h << 5;
      h >>>= 0;
      return h / 4294967295;
    };

    ctx.fillStyle = ink;
    for (let y = 0; y < cells; y++) {
      for (let x = 0; x < cells; x++) {
        const finder =
          (x < 8 && y < 8) ||
          (x >= cells - 8 && y < 8) ||
          (x < 8 && y >= cells - 8);
        if (!finder && rnd() < 0.44) {
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }

    const finder = (cx: number, cy: number) => {
      ctx.fillStyle = ink;
      ctx.fillRect(cx * cellSize, cy * cellSize, 7 * cellSize, 7 * cellSize);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(
        (cx + 1) * cellSize,
        (cy + 1) * cellSize,
        5 * cellSize,
        5 * cellSize
      );
      ctx.fillStyle = ink;
      ctx.fillRect(
        (cx + 2) * cellSize,
        (cy + 2) * cellSize,
        3 * cellSize,
        3 * cellSize
      );
    };
    finder(0, 0);
    finder(cells - 7, 0);
    finder(0, cells - 7);
  }, [seed, ink, size]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      style={{ width: size, height: size, imageRendering: "pixelated" }}
    />
  );
}
