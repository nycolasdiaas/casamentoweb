"use client";

import { useActionState, useState } from "react";
import { saveThemeAction } from "@/app/actions/theme-actions";
import { avisosDeContraste } from "@/lib/site/themeInput";
import { WHATSAPP_LINK } from "@/lib/site";

export type FonteOpcao = { id: string; nome: string; descricao: string };

export type ThemeEditorValues = {
  outer: string;
  paper: string;
  ink: string;
  accent: string;
  display: string;
  body: string;
  script: string;
};

const CORES: {
  campo: keyof ThemeEditorValues;
  label: string;
  hint: string;
}[] = [
  { campo: "paper", label: "Fundo do site", hint: "onde o conteúdo vive" },
  { campo: "ink", label: "Cor do texto", hint: "títulos e parágrafos" },
  {
    campo: "accent",
    label: "Cor de destaque",
    hint: "detalhes, botões e ornamentos",
  },
  {
    campo: "outer",
    label: "Moldura",
    hint: "a faixa atrás do cartão, no computador",
  },
];

const FONTES: {
  campo: keyof ThemeEditorValues;
  label: string;
  hint: string;
}[] = [
  { campo: "display", label: "Títulos", hint: "os nomes de vocês na capa" },
  { campo: "body", label: "Texto", hint: "a história e as informações" },
  {
    campo: "script",
    label: "Caligrafia",
    hint: "o “&”, o “Save the Date” e os detalhes",
  },
];

/**
 * Cores, fontes e ordem das fotos — o que o casal ajusta depois de ver a
 * prévia.
 *
 * As fontes vêm recortadas ao catálogo DO MOLDE (§4.3 do SDD): cada molde
 * declara só as que combinam com o desenho dele. Não oferecer uma Amatic SC no
 * Clássico é curadoria, não limitação — e evita o casal escolher algo que o
 * `clampThemeFonts` ia descartar na renderização.
 */
export default function ThemeEditor({
  siteId,
  values,
  fontesDoModelo,
  nomeDoModelo,
  fotoSlot,
}: {
  siteId: string;
  values: ThemeEditorValues;
  fontesDoModelo: FonteOpcao[];
  nomeDoModelo: string;
  fotoSlot: React.ReactNode;
}) {
  const [state, action, pending] = useActionState(saveThemeAction, undefined);

  // Espelha as cores no estado só para o preview e os avisos de contraste
  // reagirem enquanto o casal mexe, antes de salvar.
  const [cores, setCores] = useState({
    outer: values.outer,
    paper: values.paper,
    ink: values.ink,
    accent: values.accent,
  });
  const avisos = avisosDeContraste(cores);

  return (
    <section className="flex flex-col gap-6 rounded-2xl border border-(--color-gold)/40 bg-white p-6">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-lg font-semibold">O estilo do site</h2>
        <p className="text-sm text-(--color-olive)/70 leading-relaxed">
          Ajustem as cores e as fontes quando quiserem. A mudança aparece no
          site na hora.
        </p>
      </div>

      <form action={action} className="flex flex-col gap-6">
        <input type="hidden" name="siteId" value={siteId} />

        {/* Cores */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-(--color-gold)">
            Cores
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CORES.map(({ campo, label, hint }) => (
              <label
                key={campo}
                className="flex items-center gap-3 rounded-xl border border-(--color-gold)/40 px-4 py-3"
              >
                <input
                  type="color"
                  name={campo}
                  value={cores[campo as keyof typeof cores]}
                  onChange={(e) =>
                    setCores((c) => ({ ...c, [campo]: e.target.value }))
                  }
                  className="size-9 shrink-0 cursor-pointer rounded-lg border border-black/10 bg-transparent p-0"
                  aria-label={label}
                />
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-xs text-(--color-muted)">{hint}</span>
                </span>
                <span className="ml-auto shrink-0 font-mono text-[11px] text-(--color-muted)">
                  {cores[campo as keyof typeof cores]}
                </span>
              </label>
            ))}
          </div>

          {/* Amostra: mostra as 4 cores juntas antes de salvar. */}
          <div
            className="flex items-center justify-center rounded-xl p-5"
            style={{ background: cores.outer }}
          >
            <div
              className="w-full max-w-64 rounded-lg px-4 py-5 text-center"
              style={{ background: cores.paper, color: cores.ink }}
            >
              <span
                className="text-[10px] uppercase tracking-[0.25em]"
                style={{ color: cores.accent }}
              >
                Save the date
              </span>
              <p className="mt-1.5 text-lg font-semibold">Ana &amp; Pedro</p>
              <p className="mt-1 text-xs opacity-75">16 de outubro de 2026</p>
            </div>
          </div>

          {avisos.length > 0 && (
            <div
              role="status"
              className="flex flex-col gap-1 rounded-xl border border-[#b8985f] bg-[#fdf8ec] px-4 py-3"
            >
              {avisos.map((aviso) => (
                <p key={aviso} className="text-xs leading-relaxed">
                  ⚠️ {aviso}
                </p>
              ))}
              <p className="text-xs text-(--color-muted)">
                Podem salvar assim mesmo — é só um alerta de leitura no celular.
              </p>
            </div>
          )}
        </div>

        {/* Fontes */}
        <div className="flex flex-col gap-3 border-t border-(--color-gold)/30 pt-5">
          <div className="flex flex-col gap-0.5">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-(--color-gold)">
              Fontes
            </p>
            <p className="text-xs text-(--color-muted) leading-relaxed">
              Estas são as fontes que combinam com o modelo{" "}
              <strong>{nomeDoModelo}</strong>. A lista é curta de propósito —
              fonte fora do desenho estraga o conjunto.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {FONTES.map(({ campo, label, hint }) => (
              <label key={campo} className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">{label}</span>
                <select
                  name={campo}
                  defaultValue={values[campo]}
                  className="rounded-xl border border-(--color-gold)/40 bg-white px-3 py-2.5 text-sm focus:border-(--color-gold) focus:outline-none"
                >
                  {fontesDoModelo.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-(--color-muted)">{hint}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-(--color-gold)/30 pt-5">
          <button type="submit" disabled={pending} className="btn btn-primary self-start">
            {pending ? "Salvando..." : "Salvar o estilo"}
          </button>
          <div aria-live="polite" className="min-h-5">
            {state && "saved" in state && (
              <p className="text-sm text-(--color-olive)">{state.message}</p>
            )}
            {state && "error" in state && (
              <p className="text-sm text-red-700">{state.error}</p>
            )}
          </div>
        </div>
      </form>

      {/* Ordem das fotos — form próprio, fora do de cores. */}
      <div className="flex flex-col gap-3 border-t border-(--color-gold)/30 pt-5">
        <div className="flex flex-col gap-0.5">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-(--color-gold)">
            Ordem das fotos
          </p>
          <p className="text-xs text-(--color-muted) leading-relaxed">
            A primeira da galeria é a que abre o carrossel. Use as setas para
            trocar.
          </p>
        </div>
        {fotoSlot}
      </div>

      {/* O escape: o editor cobre o comum, a gente cobre o resto. */}
      <div className="flex flex-col gap-2 rounded-xl border border-(--color-olive)/25 bg-(--color-blush) px-5 py-4">
        <p className="text-sm font-medium">Querem algo que não está aqui?</p>
        <p className="text-sm text-(--color-olive)/75 leading-relaxed">
          Uma fonte específica, um ornamento, uma seção do jeito de vocês, uma
          ideia que viram por aí — é só falar. A gente faz à mão, sem custo
          extra.
        </p>
        <a
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary btn-sm self-start"
        >
          Falar com a gente no WhatsApp
        </a>
      </div>
    </section>
  );
}
