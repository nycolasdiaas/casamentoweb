"use client";

import { useActionState } from "react";
import { setTemplateAction } from "@/app/actions/theme-actions";
import { TEMPLATE_STYLES } from "@/lib/templates";

/**
 * Troca do molde depois do site já provisionado.
 *
 * Existe porque o molde era decisão de mão única: escolhido no pedido e nunca
 * mais. Casal que pediu "montar do zero" — ou cujo pedido saiu sem molde — via
 * a tela de estilo dizer "fale com a gente pelo WhatsApp", que é o oposto de
 * autonomia.
 *
 * As cores do casal são preservadas na troca; só as fontes são recortadas ao
 * catálogo do molde novo. Ver `setTemplateAction`.
 */
export default function TemplatePicker({
  siteId,
  atual,
}: {
  siteId: string;
  /** id do molde em uso, ou null se o site nasceu sem molde */
  atual: string | null;
}) {
  const [state, action, pending] = useActionState(
    setTemplateAction,
    undefined
  );

  return (
    <section className="surface-raised rounded-[3px] p-6 flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="meta text-(--c-ink-2)">Estilo</span>
        <p className="t-corpo-p text-(--c-ink-2)">
          {atual
            ? "Trocar o modelo mantém as cores de vocês e troca o desenho. A mudança vale na hora."
            : "O site de vocês ainda não tem um modelo. Escolham um aqui — dá para trocar quantas vezes quiserem."}
        </p>
      </div>

      <form action={action}>
        <input type="hidden" name="siteId" value={siteId} />

        <div className="grid gap-2.5 grid-cols-2">
          {TEMPLATE_STYLES.map((estilo) => {
            const ativo = atual === estilo.id;
            return (
              <button
                key={estilo.id}
                type="submit"
                name="templateId"
                value={estilo.id}
                disabled={pending || ativo}
                title={estilo.description}
                className={`relative flex flex-col items-start justify-between gap-3 rounded-[2px] p-3 text-left transition-colors disabled:cursor-default ${
                  ativo
                    ? "border-[1.5px] border-(--c-ink) bg-(--c-sunken)"
                    : "border border-(--c-rule) bg-(--c-surface) hover:border-(--c-ink)"
                }`}
              >
                <span className="t-display text-[17px] leading-none text-(--c-ink)">
                  {estilo.name}
                </span>

                <span className="flex gap-1.5">
                  {estilo.swatches.map((hex) => (
                    <span
                      key={hex}
                      style={{ backgroundColor: hex }}
                      className="size-4 rounded-full border border-black/10"
                    />
                  ))}
                </span>

                {ativo && (
                  <span className="absolute top-2 right-2 meta text-[9.5px] text-(--c-ink-2)">
                    em uso
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div aria-live="polite" className="min-h-5 pt-4">
          {pending && (
            <p className="text-sm text-(--c-ink-2)">Trocando o modelo…</p>
          )}
          {!pending && state && "saved" in state && (
            <p className="motion-rise-in text-sm text-(--c-ink)">
              {state.message}
            </p>
          )}
          {!pending && state && "error" in state && (
            <p className="motion-rise-in text-sm text-(--c-danger)">{state.error}</p>
          )}
        </div>
      </form>
    </section>
  );
}
