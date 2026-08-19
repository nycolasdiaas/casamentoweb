"use client";

import { NOME_DA_FORMA } from "@/lib/site/inviteShapes";
import type { Bloco } from "@/lib/site/inviteDoc";

/**
 * As camadas do convite.
 *
 * ── A lista é o documento AO CONTRÁRIO ─────────────────────────────────────
 *
 * No documento, quem vem depois desenha por cima — é assim no editor e no SVG
 * do export. Numa lista de camadas a convenção é o oposto: o primeiro item é
 * o que está na FRENTE, como em qualquer editor de imagem.
 *
 * Então a lista renderiza invertida, e os índices que ela manda para fora são
 * do documento, não da tela. Fazer a inversão aqui, num lugar só, é o que
 * evita o erro clássico de "subir" mandar o bloco para trás.
 *
 * ── Por que camadas não precisaram de campo novo ───────────────────────────
 *
 * A ordem do array JÁ era a ordem de empilhamento. Reordenar a lista É mudar a
 * camada: nada no banco mudou, e convites gravados antes continuam válidos.
 *
 * ── Arrastar e as setas ────────────────────────────────────────────────────
 *
 * As setas trocam com o vizinho — um passo previsível, que funciona no toque
 * e com teclado. O arrasto é para quem quer atravessar a pilha de uma vez;
 * usa HTML5 drag-and-drop porque aqui a lista é vertical, curta e com alvos
 * grandes, que é justamente o caso em que ele basta (na tela do convite o
 * arrasto é `pointer*`, porque lá não há alvo nenhum, só um plano).
 */

type Props = {
  blocos: Bloco[];
  selecionado: string | null;
  aoEscolher: (id: string) => void;
  /** Move o bloco do índice `de` para `para`, ambos no DOCUMENTO. */
  aoMover: (de: number, para: number) => void;
};

function rotulo(b: Bloco): string {
  if (b.tipo === "texto") return b.texto.trim() || "Texto vazio";
  if (b.tipo === "foto") return "Foto";
  if (b.tipo === "linha") return "Divisor";
  return NOME_DA_FORMA[b.forma];
}

function icone(b: Bloco): string {
  if (b.tipo === "texto") return "Aa";
  if (b.tipo === "foto") return "▣";
  if (b.tipo === "linha") return "―";
  return "◆";
}

export default function Camadas({
  blocos,
  selecionado,
  aoEscolher,
  aoMover,
}: Props) {
  if (blocos.length === 0) return null;

  // Índices do documento, do topo da pilha para o fundo.
  const daFrenteParaTras = blocos.map((_, i) => blocos.length - 1 - i);

  return (
    <div className="surface-raised flex flex-col rounded-[3px]">
      <div className="flex items-center justify-between border-b border-(--c-rule) px-4 py-3">
        <span className="meta text-(--c-ink-2)">Camadas</span>
        <span className="meta text-[9.5px] text-(--c-ink-2)">frente ↑</span>
      </div>

      <ul className="max-h-72 overflow-y-auto">
        {daFrenteParaTras.map((iDoc, iTela) => {
          const b = blocos[iDoc];
          const ativo = b.id === selecionado;
          const noTopo = iTela === 0;
          const noFundo = iTela === daFrenteParaTras.length - 1;

          return (
            <li
              key={b.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", String(iDoc));
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const de = Number(e.dataTransfer.getData("text/plain"));
                if (Number.isFinite(de) && de !== iDoc) aoMover(de, iDoc);
              }}
              className={`flex items-center gap-1.5 border-b border-(--c-rule) pr-2 last:border-b-0 ${
                ativo ? "bg-(--c-sunken)" : "hover:bg-white"
              }`}
            >
              <span
                aria-hidden
                className="cursor-grab pl-3 text-(--c-rule)"
                title="Arraste para reordenar"
              >
                <svg width="9" height="13" viewBox="0 0 9 13" fill="none" stroke="currentColor" strokeWidth="1.3">
                  <path d="M2 3h.01M7 3h.01M2 6.5h.01M7 6.5h.01M2 10h.01M7 10h.01" />
                </svg>
              </span>

              <button
                type="button"
                onClick={() => aoEscolher(b.id)}
                className={`flex min-h-11 flex-1 items-center gap-2 py-2 text-left text-[13px] ${
                  ativo ? "text-(--c-ink)" : "text-(--c-ink-2)"
                }`}
              >
                <span aria-hidden className="w-5 shrink-0 text-center text-[11px] uppercase">
                  {icone(b)}
                </span>
                <span className="truncate">{rotulo(b)}</span>
              </button>

              {/* Trocar com o vizinho DA TELA: um passo para cima é um passo
                  para a frente. As setas desabilitam nas pontas em vez de
                  sumir, para a linha não mudar de tamanho ao rolar a lista. */}
              <span className="flex shrink-0 gap-1">
                <button
                  type="button"
                  disabled={noTopo}
                  aria-label={`Trazer ${rotulo(b)} para a frente`}
                  onClick={() => aoMover(iDoc, iDoc + 1)}
                  className="flex size-7 items-center justify-center border border-(--c-rule) bg-white text-(--c-ink-2) transition-colors hover:text-(--c-ink) disabled:opacity-30 disabled:hover:text-(--c-ink-2)"
                >
                  <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M5 8.5V2M2 5l3-3 3 3" />
                  </svg>
                </button>
                <button
                  type="button"
                  disabled={noFundo}
                  aria-label={`Mandar ${rotulo(b)} para trás`}
                  onClick={() => aoMover(iDoc, iDoc - 1)}
                  className="flex size-7 items-center justify-center border border-(--c-rule) bg-white text-(--c-ink-2) transition-colors hover:text-(--c-ink) disabled:opacity-30 disabled:hover:text-(--c-ink-2)"
                >
                  <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M5 1.5V8M2 5l3 3 3-3" />
                  </svg>
                </button>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
