"use client";

import {
  CONVITE_LADO_MAX,
  CONVITE_LADO_MIN,
  ladoValido,
} from "@/lib/site/inviteDoc";
import { Numero } from "./controles";

/**
 * O formato do convite: quatro prontos e um personalizado.
 *
 * ── Por que trocar de formato NÃO reposiciona nada ─────────────────────────
 *
 * As coordenadas dos blocos são fração da tela (ver `inviteDoc`), então o
 * desenho reflui sozinho: o que estava a 10% da largura continua a 10%. É por
 * isso que dá para experimentar retrato, quadrado e story sem refazer o
 * convite — e por isso a troca é reversível, o que a torna segura de oferecer
 * a qualquer momento em vez de só na criação.
 *
 * O que muda mesmo é o ENQUADRAMENTO: um convite desenhado em 4:5 fica com
 * folga em cima e embaixo quando vira paisagem. Isso o casal vê na hora, na
 * tela, e ajusta arrastando — que é o comportamento honesto.
 *
 * ── Por que px, e não uma razão ────────────────────────────────────────────
 *
 * No personalizado a pessoa digita 1080 × 1350, não "4:5". É o número que ela
 * conhece de qualquer lugar que peça imagem, e é literalmente o tamanho do
 * arquivo que vai baixar.
 */

const PRONTOS = [
  { rotulo: "Retrato 4:5", largura: 1080, altura: 1350 },
  { rotulo: "Quadrado", largura: 1080, altura: 1080 },
  { rotulo: "Story 9:16", largura: 1080, altura: 1920 },
  { rotulo: "Paisagem", largura: 1414, altura: 1000 },
] as const;

export default function FormatoDoConvite({
  largura,
  altura,
  aoTrocar,
  marcarGesto,
  fecharGesto,
}: {
  largura: number;
  altura: number;
  aoTrocar: (largura: number, altura: number) => void;
  marcarGesto: () => void;
  fecharGesto: () => void;
}) {
  const pronto = PRONTOS.find(
    (p) => p.largura === largura && p.altura === altura
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="meta shrink-0 text-(--c-ink-2)">Formato</span>

      {PRONTOS.map((p) => {
        const ativo = pronto?.rotulo === p.rotulo;
        return (
          <button
            key={p.rotulo}
            type="button"
            onClick={() => aoTrocar(p.largura, p.altura)}
            className={`min-h-9 rounded-[2px] border px-2.5 text-[12px] transition-colors ${
              ativo
                ? "border-(--c-ink) bg-(--c-ink) text-white"
                : "border-(--c-rule) bg-white text-(--c-ink) hover:bg-(--c-sunken)"
            }`}
          >
            {p.rotulo}
          </button>
        );
      })}

      {/* Personalizado não é um botão que "liga" um modo: é o estado em que a
          medida não bate com nenhum pronto. Clicar só desencosta um pouco da
          medida atual, para os campos deixarem de espelhar um pronto. */}
      <button
        type="button"
        onClick={() => aoTrocar(largura, altura + 1)}
        className={`min-h-9 rounded-[2px] border px-2.5 text-[12px] transition-colors ${
          pronto
            ? "border-(--c-rule) bg-white text-(--c-ink) hover:bg-(--c-sunken)"
            : "border-(--c-ink) bg-(--c-ink) text-white"
        }`}
      >
        Personalizado
      </button>

      <span className="flex items-center gap-1.5">
        <Numero
          rotulo="Largura do convite em px"
          compacto
          valor={largura}
          min={CONVITE_LADO_MIN}
          max={CONVITE_LADO_MAX}
          aoMudar={(v) => aoTrocar(ladoValido(v, largura), altura)}
          aoComecar={marcarGesto}
          aoTerminar={fecharGesto}
        />
        <span aria-hidden className="text-[12px] text-(--c-ink-2)">×</span>
        <Numero
          rotulo="Altura do convite em px"
          compacto
          valor={altura}
          min={CONVITE_LADO_MIN}
          max={CONVITE_LADO_MAX}
          aoMudar={(v) => aoTrocar(largura, ladoValido(v, altura))}
          aoComecar={marcarGesto}
          aoTerminar={fecharGesto}
        />
        <span className="meta text-[9.5px] text-(--c-ink-2)">px</span>
      </span>
    </div>
  );
}
