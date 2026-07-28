"use client";

import { useEffect, useState } from "react";

/**
 * Contagem regressiva até o casamento.
 *
 * Client component de propósito: `Date.now()` é não-determinístico e, com
 * Cache Components, calcular isso no servidor exigiria sair do prerender —
 * jogaria fora o shell estático da página inteira por causa de um relógio.
 * Renderiza travessões no HTML estático e liga ao montar.
 *
 * Ver docs/sdd-geracao-automatica.md §3.2 e a doc do Next em
 * getting-started/caching ("Working with non-deterministic operations").
 */
export default function Countdown({ targetDate }: { targetDate: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const target = new Date(targetDate).getTime();
  const diff = now == null ? null : Math.max(0, target - now);
  const pad = (v: number) => String(v).padStart(2, "0");

  const parts =
    diff == null
      ? [
          ["dias", "–"],
          ["horas", "–"],
          ["min", "–"],
          ["seg", "–"],
        ]
      : [
          ["dias", String(Math.floor(diff / 86_400_000))],
          ["horas", pad(Math.floor(diff / 3_600_000) % 24)],
          ["min", pad(Math.floor(diff / 60_000) % 60)],
          ["seg", pad(Math.floor(diff / 1_000) % 60)],
        ];

  return (
    <div className="flex items-center justify-center">
      {parts.map(([label, value], i) => (
        <div key={label} className="contents">
          {i > 0 && <div className="w-px h-[38px] bg-(--accent)/50" />}
          <div className="flex-1 text-center">
            <div className="font-[family-name:var(--font-display)] text-4xl font-medium leading-none tabular-nums">
              {value}
            </div>
            <div className="mt-1.5 text-[10px] tracking-[0.28em] uppercase opacity-65">
              {label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
