"use client";

import { COLOR_PRESETS } from "@/lib/customization";

/**
 * Uma linha de cores. Controlada de fora, porque escolher um modelo pronto
 * precisa PREENCHER as três de uma vez — com estado local, o casal escolhia
 * "Clássico" e as bolinhas embaixo continuavam vazias, como se a escolha não
 * tivesse valido.
 */
export default function ColorRow({
  label,
  hint,
  valor,
  onChange,
}: {
  label: string;
  hint: string;
  valor: string;
  onChange: (hex: string) => void;
}) {
  const ehPreset = COLOR_PRESETS.some((p) => p.hex === valor);

  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-sm font-medium">
        {label}{" "}
        <span className="text-xs font-normal text-(--color-muted)">{hint}</span>
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {COLOR_PRESETS.map((preset) => {
          const ativo = valor === preset.hex;
          return (
            <button
              key={preset.hex}
              type="button"
              title={preset.name}
              aria-label={`${label}: ${preset.name}`}
              aria-pressed={ativo}
              onClick={() => onChange(ativo ? "" : preset.hex)}
              style={{ backgroundColor: preset.hex }}
              className={`size-9 rounded-full border-2 transition-transform duration-150 hover:scale-110 active:scale-95 ${
                ativo
                  ? "scale-110 border-(--color-olive) ring-2 ring-(--color-olive)/30"
                  : "border-black/10"
              }`}
            />
          );
        })}

        {/* Cor livre. O `conic-gradient` só aparece quando nada foi escolhido:
            com cor escolhida, o próprio valor vira o preenchimento. */}
        <label
          className={`relative size-9 cursor-pointer overflow-hidden rounded-full border-2 transition-transform duration-150 hover:scale-110 ${
            valor && !ehPreset
              ? "scale-110 border-(--color-olive) ring-2 ring-(--color-olive)/30"
              : "border-black/10"
          }`}
          style={{
            background:
              valor && !ehPreset
                ? valor
                : "conic-gradient(from 0deg, #f87171, #fbbf24, #34d399, #60a5fa, #a78bfa, #f87171)",
          }}
        >
          <input
            type="color"
            value={valor && !ehPreset ? valor : "#b8985f"}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>

        <span className="text-xs text-(--color-muted)">
          {valor
            ? (COLOR_PRESETS.find((p) => p.hex === valor)?.name ?? valor)
            : "sem preferência — a gente sugere"}
        </span>
      </div>
    </div>
  );
}
