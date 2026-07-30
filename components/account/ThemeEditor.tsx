"use client";

import { useActionState, useState } from "react";
import { saveThemeAction } from "@/app/actions/theme-actions";
import { avisosDeContraste } from "@/lib/site/themeInput";
import { WHATSAPP_LINK } from "@/lib/site";

export type FonteOpcao = {
  id: string;
  nome: string;
  descricao: string;
  /** ex: "--f-cormorant" — resolvida pelas classes em `fontClassNames` */
  cssVar: string;
};

export type ThemeEditorValues = {
  outer: string;
  paper: string;
  ink: string;
  accent: string;
  display: string;
  body: string;
  script: string;
};

type PapelFonte = "display" | "body" | "script";

const CORES: { campo: "paper" | "ink" | "accent" | "outer"; label: string; hint: string }[] = [
  { campo: "paper", label: "Fundo do site", hint: "onde o conteúdo vive" },
  { campo: "ink", label: "Cor do texto", hint: "títulos e parágrafos" },
  { campo: "accent", label: "Cor de destaque", hint: "detalhes e ornamentos" },
  { campo: "outer", label: "Moldura", hint: "a faixa atrás do cartão" },
];

const PAPEIS: { campo: PapelFonte; label: string; hint: string }[] = [
  { campo: "display", label: "Títulos", hint: "os nomes de vocês na capa" },
  { campo: "body", label: "Texto", hint: "a história e as informações" },
  {
    campo: "script",
    label: "Caligrafia",
    hint: "o “&”, o “Save the Date” e os detalhes",
  },
];

/**
 * Escolha de fonte para um papel: todas as opções visíveis de uma vez, cada
 * uma escrita NA PRÓPRIA FONTE.
 *
 * Não é `<select>` de propósito: numa lista suspensa o casal escolhe um nome
 * ("Cormorant Garamond") sem ver o desenho, e o nome não diz nada para quem
 * não é da área. São radios de verdade, então o form envia o valor sem
 * campo escondido e o teclado navega com as setas.
 */
function EscolhaDeFonte({
  papel,
  opcoes,
  selecionada,
  onSelect,
}: {
  papel: PapelFonte;
  opcoes: FonteOpcao[];
  selecionada: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {opcoes.map((fonte) => {
        const ativa = fonte.id === selecionada;
        return (
          <label
            key={fonte.id}
            className={`flex cursor-pointer flex-col gap-1 rounded-xl border px-3 py-2.5 transition-colors ${
              ativa
                ? "border-[#2f3a29] bg-(--color-blush) ring-1 ring-[#2f3a29]"
                : "border-(--color-gold)/40 bg-white hover:border-(--color-gold)"
            }`}
          >
            <input
              type="radio"
              name={papel}
              value={fonte.id}
              checked={ativa}
              onChange={() => onSelect(fonte.id)}
              className="sr-only"
            />
            {/* A amostra: o nome da fonte escrito nela mesma. */}
            <span
              className="truncate text-xl leading-tight text-(--color-olive)"
              style={{ fontFamily: `var(${fonte.cssVar})` }}
            >
              {fonte.nome}
            </span>
            <span className="truncate text-[10px] text-(--color-muted)">
              {fonte.descricao}
            </span>
          </label>
        );
      })}
    </div>
  );
}

/**
 * Cores, fontes e ordem das fotos — o que o casal ajusta depois da prévia.
 *
 * As fontes são as do MOLDE (§4.3 do SDD): cada molde declara só as que
 * combinam com o desenho dele. `fontClassNames` traz as classes `variable` de
 * TODAS elas, para cada amostra poder ser desenhada na própria fonte — sem
 * isso, `var(--f-x)` não resolveria e tudo sairia na fonte padrão.
 */
export default function ThemeEditor({
  siteId,
  values,
  fontesDoModelo,
  fontClassNames,
  nomeDoModelo,
  fotoSlot,
}: {
  siteId: string;
  values: ThemeEditorValues;
  fontesDoModelo: FonteOpcao[];
  fontClassNames: string;
  nomeDoModelo: string;
  fotoSlot: React.ReactNode;
}) {
  const [state, action, pending] = useActionState(saveThemeAction, undefined);

  // Cores e fontes controladas para a amostra reagir enquanto o casal mexe,
  // antes de salvar.
  const [cores, setCores] = useState({
    outer: values.outer,
    paper: values.paper,
    ink: values.ink,
    accent: values.accent,
  });
  const [fontes, setFontes] = useState<Record<PapelFonte, string>>({
    display: values.display,
    body: values.body,
    script: values.script,
  });

  const avisos = avisosDeContraste(cores);
  const varDe = (papel: PapelFonte) =>
    `var(${fontesDoModelo.find((f) => f.id === fontes[papel])?.cssVar ?? "--f-none"})`;

  return (
    <section
      className={`${fontClassNames} flex flex-col gap-6 rounded-2xl border border-(--color-gold)/40 bg-white p-6`}
    >
      <div className="flex flex-col gap-1.5">
        <h2 className="text-lg font-semibold">O estilo do site</h2>
        <p className="text-sm text-(--color-olive)/70 leading-relaxed">
          Ajustem as cores e as fontes quando quiserem. A amostra abaixo muda
          na hora, e o site também depois de salvar.
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
                  value={cores[campo]}
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
                  {cores[campo]}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Amostra: cores E fontes juntas, como o convidado vai ver. */}
        <div
          className="flex items-center justify-center rounded-xl p-6"
          style={{ background: cores.outer }}
        >
          <div
            className="w-full max-w-72 rounded-lg px-5 py-7 text-center"
            style={{ background: cores.paper, color: cores.ink }}
          >
            <span
              className="text-sm"
              style={{ fontFamily: varDe("script"), color: cores.accent }}
            >
              Save the Date
            </span>
            <p
              className="mt-2 text-3xl leading-tight"
              style={{ fontFamily: varDe("display") }}
            >
              Ana{" "}
              <span style={{ fontFamily: varDe("script"), color: cores.accent }}>
                &amp;
              </span>{" "}
              Pedro
            </p>
            <p
              className="mt-3 text-xs opacity-80"
              style={{ fontFamily: varDe("body") }}
            >
              16 de outubro de 2026 · Fortaleza
            </p>
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

        {/* Fontes */}
        <div className="flex flex-col gap-5 border-t border-(--color-gold)/30 pt-5">
          <div className="flex flex-col gap-0.5">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-(--color-gold)">
              Fontes
            </p>
            <p className="text-xs text-(--color-muted) leading-relaxed">
              Estas são as que combinam com o modelo{" "}
              <strong>{nomeDoModelo}</strong>. A lista é curta de propósito —
              fonte fora do desenho estraga o conjunto.
            </p>
          </div>

          {PAPEIS.map(({ campo, label, hint }) => (
            <fieldset key={campo} className="flex flex-col gap-2">
              <legend className="flex flex-col gap-0.5 pb-1.5">
                <span className="text-sm font-medium">{label}</span>
                <span className="text-xs text-(--color-muted)">{hint}</span>
              </legend>
              <EscolhaDeFonte
                papel={campo}
                opcoes={fontesDoModelo}
                selecionada={fontes[campo]}
                onSelect={(id) => setFontes((f) => ({ ...f, [campo]: id }))}
              />
            </fieldset>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-t border-(--color-gold)/30 pt-5">
          <button
            type="submit"
            disabled={pending}
            className="btn btn-primary self-start"
          >
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

      {/* Ordem das fotos — form próprio, fora do de cores e fontes. */}
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
