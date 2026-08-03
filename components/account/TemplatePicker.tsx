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
    <section className="flex flex-col gap-5 rounded-2xl border border-(--color-gold)/40 bg-white p-6">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-lg font-semibold">O modelo do site</h2>
        <p className="text-sm leading-relaxed text-(--color-olive)/70">
          {atual
            ? "Trocar o modelo mantém as cores de vocês e troca o desenho. A mudança vale na hora."
            : "O site de vocês ainda não tem um modelo. Escolham um aqui — dá para trocar quantas vezes quiserem."}
        </p>
      </div>

      <form action={action}>
        <input type="hidden" name="siteId" value={siteId} />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATE_STYLES.map((estilo) => {
            const ativo = atual === estilo.id;
            return (
              <button
                key={estilo.id}
                type="submit"
                name="templateId"
                value={estilo.id}
                disabled={pending || ativo}
                className={`flex flex-col gap-2.5 rounded-2xl border-2 p-4 text-left transition-all duration-200 disabled:cursor-default ${
                  ativo
                    ? "border-(--color-olive) bg-(--color-blush) shadow-sm"
                    : "border-(--color-gold)/40 bg-white hover:-translate-y-0.5 hover:border-(--color-gold) hover:shadow-md disabled:hover:translate-y-0"
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{estilo.name}</span>
                  {ativo && (
                    <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-(--color-olive)/60">
                      em uso
                    </span>
                  )}
                </span>

                <span className="flex gap-1.5">
                  {estilo.swatches.map((hex) => (
                    <span
                      key={hex}
                      style={{ backgroundColor: hex }}
                      className="size-5 rounded-full border border-black/10"
                    />
                  ))}
                </span>

                <span className="text-xs leading-relaxed text-(--color-olive)/60">
                  {estilo.description}
                </span>
              </button>
            );
          })}
        </div>

        <div aria-live="polite" className="min-h-5 pt-4">
          {pending && (
            <p className="text-sm text-(--color-olive)/70">Trocando o modelo…</p>
          )}
          {!pending && state && "saved" in state && (
            <p className="motion-rise-in text-sm text-(--color-olive)">
              {state.message}
            </p>
          )}
          {!pending && state && "error" in state && (
            <p className="motion-rise-in text-sm text-red-700">{state.error}</p>
          )}
        </div>
      </form>
    </section>
  );
}
