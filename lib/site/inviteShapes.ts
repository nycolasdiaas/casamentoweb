import type { FormaId } from "@/lib/site/inviteDoc";

/**
 * A geometria das formas, escrita UMA vez.
 *
 * O convite é desenhado em dois lugares: HTML no editor e na miniatura, SVG no
 * export. Se cada um tivesse sua própria noção de "hexágono", o casal
 * posicionaria uma coisa e receberia outra — e a diferença só apareceria
 * depois de baixar.
 *
 * Então tudo sai daqui, em coordenadas 0..1 sobre a caixa do bloco:
 *
 * - `pontos()` devolve os vértices, que viram `polygon()` no CSS e `points`
 *   no SVG — a mesma lista, os mesmos números.
 * - Retângulo, arredondado e círculo NÃO são polígonos: `border-radius` no
 *   CSS e `rect`/`ellipse` no SVG dão canto e curva de verdade, coisa que um
 *   polígono aproximado não dá.
 */

/** Formas desenhadas por vértices. As outras têm primitiva própria. */
const POLIGONOS: Partial<Record<FormaId, [number, number][]>> = {
  triangulo: [
    [0.5, 0],
    [1, 1],
    [0, 1],
  ],
  "triangulo-baixo": [
    [0, 0],
    [1, 0],
    [0.5, 1],
  ],
  losango: [
    [0.5, 0],
    [1, 0.5],
    [0.5, 1],
    [0, 0.5],
  ],
  pentagono: [
    [0.5, 0],
    [1, 0.38],
    [0.81, 1],
    [0.19, 1],
    [0, 0.38],
  ],
  hexagono: [
    [0.5, 0],
    [1, 0.25],
    [1, 0.75],
    [0.5, 1],
    [0, 0.75],
    [0, 0.25],
  ],
};

export function pontos(forma: FormaId): [number, number][] | null {
  return POLIGONOS[forma] ?? null;
}

/** `clip-path` do CSS, ou null quando a forma não é polígono. */
export function clipPathDe(forma: FormaId): string | null {
  const p = pontos(forma);
  if (!p) return null;
  return `polygon(${p.map(([x, y]) => `${x * 100}% ${y * 100}%`).join(", ")})`;
}

/** Nome legível, para o rótulo do botão e o `aria-label`. */
export const NOME_DA_FORMA: Record<FormaId, string> = {
  retangulo: "Retângulo",
  arredondado: "Retângulo arredondado",
  circulo: "Círculo",
  triangulo: "Triângulo",
  "triangulo-baixo": "Triângulo invertido",
  losango: "Losango",
  pentagono: "Pentágono",
  hexagono: "Hexágono",
};
