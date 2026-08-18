"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  CONVITE_LARGURA,
  type Bloco,
  type FormaId,
  FORMAS,
} from "@/lib/site/inviteDoc";
import { NOME_DA_FORMA } from "@/lib/site/inviteShapes";
import { FONTES, Numero } from "./controles";

/**
 * A barra que flutua sobre o bloco escolhido.
 *
 * Vem das telas do iCasei: fonte, tamanho, cor, link, girar, alinhar e apagar
 * ficam ONDE A PESSOA ESTÁ OLHANDO, e não num painel do outro lado da tela. A
 * distância importa mais do que parece — mexer no tamanho da fonte e conferir
 * o resultado é um vaivém constante, e cada ida ao painel lateral é um
 * movimento de olho de ponta a ponta.
 *
 * ── O painel lateral continua existindo ────────────────────────────────────
 *
 * A barra leva o que se mexe TODA HORA. O que se ajusta uma vez — proporção,
 * opacidade, cantos, contorno — fica no painel. Empurrar tudo para a barra a
 * transformaria numa segunda tela flutuante em cima do convite, tapando
 * justamente o que ela deveria deixar ver.
 *
 * ── Por que posição fixa, e não absoluta dentro da tela ────────────────────
 *
 * A tela do convite tem `overflow: hidden` (o convite recorta o que sangra) e
 * agora rola dentro da moldura por causa do zoom. Uma barra `absolute` lá
 * dentro seria cortada nas bordas e sumiria junto com a rolagem. Com `fixed` e
 * coordenadas de viewport ela fica sempre inteira e sempre visível.
 *
 * Quem mede o retângulo é o editor (ele conhece a rolagem e o zoom) e passa em
 * `alvo`; aqui a posição sai do render, não de estado — estado derivado daria
 * um render a mais a cada pixel de arrasto.
 */

type Props = {
  bloco: Bloco;
  /** Retângulo do bloco na tela, em coordenadas de viewport. */
  alvo: DOMRect | null;
  aoTrocar: (campos: Partial<Bloco>) => void;
  aoApagar: () => void;
  /** Fecha um passo do histórico: o gesto terminou. */
  marcarGesto: () => void;
  fecharGesto: () => void;
  /** Muda e fecha o passo de uma vez — para controles de um clique só. */
  trocarEregistrar: (campos: Partial<Bloco>) => void;
};

const ALTURA_BARRA = 52;
const FOLGA = 10;

export default function BarraDoBloco({
  bloco,
  alvo,
  aoTrocar,
  aoApagar,
  marcarGesto,
  fecharGesto,
  trocarEregistrar,
}: Props) {
  const barraRef = useRef<HTMLDivElement>(null);

  // A largura só se sabe DEPOIS de montar (depende de quantos controles o tipo
  // do bloco tem). É a única coisa que precisa de efeito; a posição em si é
  // calculada no render, a partir de `alvo` — guardá-la em estado seria estado
  // derivado, com um render a mais a cada pixel de arrasto.
  const [largura, setLargura] = useState(320);

  useLayoutEffect(() => {
    const l = barraRef.current?.offsetWidth;
    if (l && l !== largura) setLargura(l);
  }, [largura, bloco.tipo]);

  if (!alvo) return null;

  // Acima do bloco; se não couber (bloco no topo), vai para baixo dele.
  const acima = alvo.top - ALTURA_BARRA - FOLGA;
  const top = acima > FOLGA ? acima : alvo.bottom + FOLGA;

  // Centralizada no bloco, presa dentro da janela — uma barra pela metade fora
  // da tela é uma barra sem os últimos botões.
  const bruto = alvo.left + alvo.width / 2 - largura / 2;
  const left = Math.min(
    Math.max(bruto, FOLGA),
    Math.max(FOLGA, window.innerWidth - largura - FOLGA)
  );
  const pos = { left, top };

  const botao =
    "flex size-9 items-center justify-center border border-(--c-rule) bg-white text-[13px] transition-colors hover:bg-(--c-sunken)";
  const botaoAtivo =
    "flex size-9 items-center justify-center border border-(--c-ink) bg-(--c-ink) text-[13px] text-white";

  return (
    <div
      ref={barraRef}
      // O clique na barra não pode chegar à tela: lá `onPointerDown`
      // deseleciona, e a barra sumiria no instante em que fosse tocada.
      onPointerDown={(e) => e.stopPropagation()}
      className="surface-raised fixed z-30 flex items-center gap-1.5 rounded-[3px] border border-(--c-rule) px-2 py-1.5 shadow-lg"
      style={{ left: pos.left, top: pos.top }}
      role="toolbar"
      aria-label="Editar bloco selecionado"
    >
      {bloco.tipo === "texto" && (
        <>
          <select
            value={bloco.fonte}
            aria-label="Fonte"
            onChange={(e) =>
              trocarEregistrar({
                fonte: e.target.value as "serif" | "sans" | "script",
              })
            }
            className="min-h-9 border border-(--c-rule) bg-white px-1.5 text-[13px]"
          >
            {FONTES.map((f) => (
              <option key={f.id} value={f.id}>
                {f.rotulo}
              </option>
            ))}
          </select>

          <Numero
            rotulo="Tamanho em px"
            compacto
            valor={bloco.tamanho * CONVITE_LARGURA}
            min={8}
            max={220}
            aoMudar={(v) => aoTrocar({ tamanho: v / CONVITE_LARGURA })}
            aoComecar={marcarGesto}
            aoTerminar={fecharGesto}
          />

          <button
            type="button"
            title={bloco.peso === "bold" ? "Tirar o negrito" : "Negrito"}
            aria-pressed={bloco.peso === "bold"}
            onClick={() =>
              trocarEregistrar({
                peso: bloco.peso === "bold" ? "normal" : "bold",
              })
            }
            className={bloco.peso === "bold" ? botaoAtivo : botao}
          >
            <span className="font-bold">B</span>
          </button>

          <span className="mx-0.5 h-6 w-px bg-(--c-rule)" aria-hidden />

          {(["left", "center", "right"] as const).map((a) => (
            <button
              key={a}
              type="button"
              title={a === "center" ? "Centralizar" : `Alinhar à ${a === "left" ? "esquerda" : "direita"}`}
              aria-pressed={bloco.alinhamento === a}
              onClick={() => trocarEregistrar({ alinhamento: a })}
              className={bloco.alinhamento === a ? botaoAtivo : botao}
            >
              <span aria-hidden>
                {a === "left" ? "◧" : a === "center" ? "▣" : "◨"}
              </span>
            </button>
          ))}

          <span className="mx-0.5 h-6 w-px bg-(--c-rule)" aria-hidden />

          <label className={botao} title="Cor do texto">
            <span aria-hidden style={{ color: bloco.cor }}>
              A
            </span>
            <input
              type="color"
              value={bloco.cor}
              aria-label="Cor do texto"
              onChange={(e) => trocarEregistrar({ cor: e.target.value })}
              className="sr-only"
            />
          </label>
        </>
      )}

      {bloco.tipo === "forma" && (
        <>
          <select
            value={bloco.forma}
            aria-label="Forma"
            onChange={(e) =>
              trocarEregistrar({ forma: e.target.value as FormaId })
            }
            className="min-h-9 border border-(--c-rule) bg-white px-1.5 text-[13px]"
          >
            {FORMAS.map((f) => (
              <option key={f} value={f}>
                {NOME_DA_FORMA[f]}
              </option>
            ))}
          </select>

          <label className={botao} title="Preenchimento">
            <span
              aria-hidden
              className="size-4 border border-(--c-rule)"
              style={{ background: bloco.preenchimento || "transparent" }}
            />
            <input
              type="color"
              value={bloco.preenchimento || "#b8985f"}
              aria-label="Cor de preenchimento"
              onChange={(e) =>
                trocarEregistrar({ preenchimento: e.target.value })
              }
              className="sr-only"
            />
          </label>
        </>
      )}

      {bloco.tipo === "linha" && (
        <>
          <Numero
            rotulo="Espessura em px"
            compacto
            valor={bloco.espessura}
            min={1}
            max={60}
            aoMudar={(v) => aoTrocar({ espessura: v })}
            aoComecar={marcarGesto}
            aoTerminar={fecharGesto}
          />
          <label className={botao} title="Cor da linha">
            <span
              aria-hidden
              className="size-4 border border-(--c-rule)"
              style={{ background: bloco.cor }}
            />
            <input
              type="color"
              value={bloco.cor}
              aria-label="Cor da linha"
              onChange={(e) => trocarEregistrar({ cor: e.target.value })}
              className="sr-only"
            />
          </label>
        </>
      )}

      {/* Girar e apagar valem para QUALQUER bloco, então ficam sempre no fim —
          posição fixa é o que deixa a mão aprender onde fica. */}
      <span className="mx-0.5 h-6 w-px bg-(--c-rule)" aria-hidden />

      <Numero
        rotulo="Rotação em graus"
        compacto
        valor={bloco.rotacao}
        min={-180}
        max={180}
        aoMudar={(v) => aoTrocar({ rotacao: v })}
        aoComecar={marcarGesto}
        aoTerminar={fecharGesto}
      />

      <button
        type="button"
        title="Desentortar"
        onClick={() => trocarEregistrar({ rotacao: 0 })}
        className={botao}
      >
        <svg
          aria-hidden
          width="15"
          height="15"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        >
          <path d="M13 8a5 5 0 1 1-1.7-3.7M13 2v3h-3" />
        </svg>
      </button>

      <button
        type="button"
        title="Remover bloco"
        onClick={aoApagar}
        className="flex size-9 items-center justify-center border border-(--c-rule) bg-white text-(--c-mark) transition-colors hover:bg-(--c-mark) hover:text-white"
      >
        <svg
          aria-hidden
          width="15"
          height="15"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        >
          <path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5" />
        </svg>
      </button>
    </div>
  );
}
