"use client";

/**
 * Uma amostra do convite com as três cores escolhidas.
 *
 * ── Por que existe ─────────────────────────────────────────────────────────
 *
 * A etapa do modelo tem prévia ao vivo; a das cores não tinha nenhuma. O casal
 * escolhia três cores olhando para três bolinhas e só descobria o resultado
 * depois de enviar o pedido — que é tarde para uma decisão que ele tomou às
 * cegas.
 *
 * A prévia de verdade não serve aqui: ela renderiza os moldes de demonstração,
 * que trazem as cores próprias chumbadas e não aceitam as do casal. Esta
 * amostra não tenta imitar o site — ela mostra exatamente o que as três cores
 * decidem: papel, tinta e acento, um do lado do outro, no tamanho em que serão
 * lidos.
 *
 * Campo vazio = "sem preferência", e aí vale o preset do molde. Nesse caso a
 * amostra some, em vez de mentir uma cor que não foi escolhida.
 */
export default function AmostraDeCores({
  acento,
  tinta,
  papel,
}: {
  acento: string;
  tinta: string;
  papel: string;
}) {
  if (!acento && !tinta && !papel) return null;

  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-xs text-(--c-ink-2)">
        Como fica o convite
      </figcaption>

      <div
        className="flex flex-col items-center gap-3 rounded-[3px] border border-(--c-rule) px-6 py-9 text-center"
        style={{
          background: papel || "#ffffff",
          color: tinta || "#1a1d21",
        }}
      >
        <span
          className="text-[11px] uppercase tracking-[0.3em]"
          style={{ color: acento || undefined }}
        >
          Save the date
        </span>

        <span className="text-2xl leading-tight">Ana &amp; Pedro</span>

        <span
          aria-hidden="true"
          className="h-px w-16"
          style={{ background: acento || "currentColor" }}
        />

        <span className="text-[13px] leading-relaxed opacity-90">
          É assim que o nome, o texto e os detalhes de vocês vão aparecer.
        </span>
      </div>
    </figure>
  );
}
