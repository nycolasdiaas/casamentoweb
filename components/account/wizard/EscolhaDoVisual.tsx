"use client";

import { useMemo } from "react";
import { TEMPLATE_STYLES } from "@/lib/templates";
import {
  FONT_STYLES,
  FONT_CATEGORY_LABELS,
  type FontStyleId,
  type FontCategory,
} from "@/lib/customization";
import { fontesDoMolde } from "@/lib/fonts/porMolde";
import ColorRow from "@/components/account/wizard/ColorRow";
import AvisoDeContraste from "@/components/account/wizard/AvisoDeContraste";
import AmostraDeCores from "@/components/account/wizard/AmostraDeCores";
import PreviaDoVisual, {
  type ConteudoDaPrevia,
} from "@/components/account/wizard/PreviaDoVisual";
import {
  FONT_PREVIEW_CLASS,
  CATEGORY_PREVIEW_SIZE,
} from "@/components/account/wizard/fontPreview";

const FONT_CATEGORY_ORDER: FontCategory[] = [
  "serifa",
  "manuscrita",
  "sans",
  "rustica",
];

/**
 * A etapa do visual: modelo, cores e tipografia numa tela só, com o site ao
 * lado mudando junto.
 *
 * ── Por que as três juntas ─────────────────────────────────────────────────
 *
 * Eram as etapas 7, 8 e 9, e as três perguntavam a mesma coisa: com que cara o
 * site fica. Separadas, o casal decidia a cor sem ver o modelo e a fonte sem
 * ver a cor — e só descobria o conjunto na revisão, quando voltar atrás já
 * custa três cliques. Pedido do dono em 15/09/2026.
 *
 * ── Por que a lista de fontes muda com o modelo ────────────────────────────
 *
 * Porque o motor sempre fez isso, só que calado. `clampThemeFonts` derruba a
 * fonte que o molde não desenha e volta para a padrão; escolher uma Amatic SC
 * no Clássico nunca teve efeito nenhum. Ao lado de uma prévia ao vivo isso
 * pareceria defeito ("cliquei e não mudou"). Mostrar só o que o molde tem diz
 * a verdade e continua sendo curadoria — ver `lib/fonts/porMolde.ts`.
 */
export default function EscolhaDoVisual({
  modelo,
  escolherModelo,
  limparModelo,
  pacote,
  cor1,
  cor2,
  cor3,
  setCor1,
  setCor2,
  setCor3,
  fonte,
  setFonte,
  nomes,
  primeiroNome,
  conteudo,
}: {
  modelo: string;
  escolherModelo: (id: string) => void;
  limparModelo: () => void;
  pacote: string;
  cor1: string;
  cor2: string;
  cor3: string;
  setCor1: (v: string) => void;
  setCor2: (v: string) => void;
  setCor3: (v: string) => void;
  fonte: string;
  setFonte: (v: string) => void;
  nomes: string;
  primeiroNome: string | null;
  conteudo: ConteudoDaPrevia;
}) {
  const disponiveis = useMemo(() => {
    const doMolde = new Set(fontesDoMolde(modelo));
    return FONT_STYLES.filter((f) => doMolde.has(f.id as FontStyleId));
  }, [modelo]);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,25rem)_minmax(0,1fr)] lg:items-start lg:gap-10">
      {/* A PRÉVIA vem primeiro no celular e à direita no computador.

          No celular ela precisa estar ACIMA dos controles: quem mexe numa cor
          com o quadro embaixo da dobra muda a cor e não vê nada acontecer — o
          contrário do que esta tela existe para fazer. Grudada no topo, ela
          acompanha a rolagem pelos três blocos. */}
      <div className="order-1 lg:order-2 lg:sticky lg:top-6">
        <div className="sticky top-2 z-10 bg-(--c-base) pb-2 lg:static lg:bg-transparent lg:pb-0">
          <PreviaDoVisual
            modelo={modelo}
            pacote={pacote}
            cor1={cor1}
            cor2={cor2}
            cor3={cor3}
            fonte={fonte}
            conteudo={conteudo}
          />
        </div>
      </div>

      <div className="order-2 flex flex-col gap-10 lg:order-1">
        {/* 1 · MODELO */}
        <section className="flex flex-col gap-3.5">
          <Titulo numero="1" texto="O modelo" />
          <div className="grid gap-2.5 sm:grid-cols-2">
            {TEMPLATE_STYLES.map((estiloItem) => {
              const ativo = modelo === estiloItem.id;
              return (
                <button
                  key={estiloItem.id}
                  type="button"
                  onClick={() => escolherModelo(estiloItem.id)}
                  data-escolha={ativo ? "sim" : "nao"}
                  className={`flex flex-col gap-2 rounded-[3px] border-2 p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                    ativo
                      ? "border-(--c-ink) bg-(--c-sunken) shadow-sm"
                      : "border-(--c-rule) bg-white"
                  }`}
                >
                  <span className="text-sm font-semibold">
                    {estiloItem.name}
                  </span>
                  <span className="flex gap-1.5">
                    {estiloItem.swatches.map((hex) => (
                      <span
                        key={hex}
                        style={{ backgroundColor: hex }}
                        className="size-4 rounded-full border border-black/10"
                      />
                    ))}
                  </span>
                  <span className="text-xs leading-relaxed text-(--c-ink-2)">
                    {estiloItem.description}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={limparModelo}
            className={`self-start rounded-[2px] border px-4 py-2 text-[13px] transition-colors ${
              modelo === ""
                ? "border-(--c-ink) bg-(--c-sunken) font-medium"
                : "border-(--c-rule) text-(--c-ink-2) hover:border-(--c-ink) hover:text-(--c-ink)"
            }`}
          >
            Prefiro montar do zero
          </button>
        </section>

        {/* 2 · CORES
            Os RÓTULOS seguem o que `resolveTheme` faz, não o contrário: a cor 1
            vira o `accent` e a cor 2 vira o `ink`. Os rótulos antigos diziam o
            oposto, e o casal escolhia a cor do texto recebendo a dos enfeites. */}
        <section className="flex flex-col gap-5">
          <Titulo numero="2" texto="As cores" />
          <ColorRow
            label="Cor principal"
            hint="o acento — detalhes, botões, ornamentos"
            valor={cor1}
            onChange={setCor1}
          />
          <ColorRow
            label="Cor do texto"
            hint="a tinta — títulos e parágrafos"
            valor={cor2}
            onChange={setCor2}
          />
          <ColorRow
            label="Cor de fundo"
            hint="o papel do convite"
            valor={cor3}
            onChange={setCor3}
          />
          <AmostraDeCores
            acento={cor1}
            tinta={cor2}
            papel={cor3}
            nomes={nomes.trim() || null}
          />
          <AvisoDeContraste tinta={cor2} papel={cor3} />
        </section>

        {/* 3 · TIPOGRAFIA */}
        <section className="flex flex-col gap-3.5">
          <Titulo numero="3" texto="A tipografia" />
          <p className="text-xs leading-relaxed text-(--c-ink-2)">
            {/* Diz por que são poucas ANTES de o casal procurar as outras.
                Sem isto, quem viu 34 fontes na versão anterior conclui que a
                lista quebrou. */}
            {disponiveis.length} fontes escolhidas para este modelo — são as que
            ele desenha bem. Trocar de modelo troca a lista.
          </p>
          <div className="flex flex-col gap-5">
            {FONT_CATEGORY_ORDER.map((categoria) => {
              const doGrupo = disponiveis.filter(
                (f) => f.category === categoria
              );
              if (doGrupo.length === 0) return null;
              return (
                <div key={categoria} className="flex flex-col gap-2.5">
                  <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.1em] text-(--c-mark)">
                    {FONT_CATEGORY_LABELS[categoria]}
                    <span aria-hidden className="h-px flex-1 bg-(--c-rule)" />
                  </p>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {doGrupo.map((f) => {
                      const ativo = fonte === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setFonte(ativo ? "" : f.id)}
                          className={`flex items-center justify-between gap-3 rounded-[3px] border-2 bg-white px-3.5 py-3 text-left transition-all duration-150 hover:-translate-y-0.5 ${
                            ativo
                              ? "border-(--c-ink) bg-(--c-sunken)"
                              : "border-(--c-rule)"
                          }`}
                        >
                          <span className="flex min-w-0 flex-col">
                            <span className="truncate text-sm font-semibold">
                              {f.name}
                            </span>
                            <span className="truncate text-xs text-(--c-ink-2)">
                              {f.description}
                            </span>
                          </span>
                          <span
                            aria-hidden
                            className={`${FONT_PREVIEW_CLASS[f.id as FontStyleId]} ${CATEGORY_PREVIEW_SIZE[f.category]} shrink-0 leading-none text-(--c-ink)`}
                          >
                            {primeiroNome ?? "Ana"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function Titulo({ numero, texto }: { numero: string; texto: string }) {
  return (
    <h3 className="flex items-center gap-2.5 text-sm font-semibold text-(--c-ink)">
      <span
        aria-hidden
        className="flex size-6 shrink-0 items-center justify-center rounded-full bg-(--c-sunken) text-xs font-semibold text-(--c-ink-2)"
      >
        {numero}
      </span>
      {texto}
    </h3>
  );
}
