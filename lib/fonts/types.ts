import type { FontStyleId } from "@/lib/customization";

/** O que `next/font/google` devolve e que a gente de fato usa. */
export type LoadedFont = { variable: string; className: string };

/** Catálogo de fontes de um molde: só as que combinam com aquele desenho. */
export type FontSet = Partial<Record<FontStyleId, LoadedFont>>;

/** Nome da variável CSS de uma fonte, ex: "--f-cormorant". */
export function fontVar(id: FontStyleId): string {
  return `--f-${id}`;
}
