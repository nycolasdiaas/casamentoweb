// Miniatura ilustrativa de um site de casamento dentro de uma moldura de
// navegador, usada no hero da landing. Puro CSS — sem screenshot.
export default function HeroPreview() {
  return (
    <div className="w-full max-w-md rounded-xl border border-(--color-gold)/40 bg-white shadow-xl overflow-hidden">
      <div className="flex items-center gap-1.5 bg-(--color-paper) px-3 py-2 border-b border-(--color-gold)/30">
        <span className="size-2 rounded-full bg-(--color-gold)/50" />
        <span className="size-2 rounded-full bg-(--color-gold)/50" />
        <span className="size-2 rounded-full bg-(--color-gold)/50" />
        <span className="ml-2 flex-1 rounded bg-white/80 px-2 py-0.5 text-[10px] text-(--color-olive) truncate">
          anaepedro.com.br
        </span>
      </div>

      <div className="flex flex-col items-center gap-3 bg-(--color-paper) px-6 py-8 text-center">
        <p className="text-[9px] tracking-[0.3em] uppercase text-(--color-olive)">
          Save the Date
        </p>
        <p className="font-script text-4xl text-(--color-olive)">Ana & Pedro</p>
        <p className="text-[10px] tracking-[0.2em] uppercase text-(--color-olive)">
          19 de setembro de 2026
        </p>

        <div className="flex gap-2 pt-1">
          {[
            ["71", "dias"],
            ["09", "horas"],
            ["24", "min"],
          ].map(([value, label]) => (
            <span
              key={label}
              className="flex flex-col items-center border border-(--color-gold)/50 bg-white px-3 py-1.5"
            >
              <span className="text-sm font-semibold text-(--color-olive) tabular-nums">
                {value}
              </span>
              <span className="text-[8px] tracking-[0.2em] uppercase text-(--color-olive)">
                {label}
              </span>
            </span>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 w-full pt-2">
          <span className="flex items-center justify-center gap-1 bg-(--color-olive) text-white text-[10px] px-2 py-2">
            Confirmar presença
          </span>
          <span className="flex items-center justify-center gap-1 border border-(--color-gold) text-(--color-olive) text-[10px] px-2 py-2 bg-white">
            Lista de presentes
          </span>
        </div>
      </div>
    </div>
  );
}
