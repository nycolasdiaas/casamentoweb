"use client";

import { useEffect, useState } from "react";

function diffParts(target: number) {
  const total = Math.max(0, target - Date.now());
  return {
    days: Math.floor(total / 86_400_000),
    hours: Math.floor(total / 3_600_000) % 24,
    minutes: Math.floor(total / 60_000) % 60,
    seconds: Math.floor(total / 1_000) % 60,
  };
}

export default function DemoCountdown({ targetDate }: { targetDate: string }) {
  const target = new Date(targetDate).getTime();
  // Começa vazio para o HTML do servidor bater com o primeiro render do cliente.
  const [parts, setParts] = useState<ReturnType<typeof diffParts> | null>(null);

  useEffect(() => {
    const tick = () => setParts(diffParts(target));
    const frame = requestAnimationFrame(tick);
    const id = setInterval(tick, 1000);
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(id);
    };
  }, [target]);

  const items = [
    ["dias", parts?.days],
    ["horas", parts?.hours],
    ["min", parts?.minutes],
    ["seg", parts?.seconds],
  ] as const;

  return (
    <div className="flex justify-center gap-4 sm:gap-8">
      {items.map(([label, value]) => (
        <div key={label} className="flex flex-col items-center gap-1">
          <span className="font-serif text-3xl sm:text-4xl text-(--color-olive) tabular-nums min-w-[2ch] text-center">
            {value ?? "–"}
          </span>
          <span className="font-serif text-[10px] tracking-[0.2em] uppercase text-(--color-muted)">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
