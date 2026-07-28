import type { CSSProperties } from "react";
import { fontVar, type FontSet } from "@/lib/fonts/types";
import type { ThemeSpec } from "./spec";

/**
 * Converte o tema em custom properties para o wrapper do site.
 *
 * É a ponte entre "dados no banco" e "CSS": as seções do template usam
 * var(--ink), var(--accent), var(--font-display) e não sabem de onde vieram.
 * É isso que permite um mesmo molde servir N casais.
 *
 * Os papéis de fonte apontam para a variável da fonte escolhida
 * (--font-display: var(--f-cormorant)), o que deixa a mesma fonte ser usada
 * em mais de um papel sem colisão.
 */
export function themeToCssVars(theme: ThemeSpec): CSSProperties {
  return {
    "--outer": theme.palette.outer,
    "--paper": theme.palette.paper,
    "--ink": theme.palette.ink,
    "--accent": theme.palette.accent,
    "--font-display": `var(${fontVar(theme.fonts.display)})`,
    "--font-body": `var(${fontVar(theme.fonts.body)})`,
    "--font-script": `var(${fontVar(theme.fonts.script)})`,
  } as CSSProperties;
}

/** Fontes que o tema realmente usa — só essas vão para o HTML. */
export function themeFontIds(theme: ThemeSpec) {
  return [theme.fonts.display, theme.fonts.body, theme.fonts.script];
}

/**
 * Classes `variable` das fontes que o tema usa, buscadas no catálogo DO
 * MOLDE. Duplicatas somem (é comum display e script serem a mesma fonte).
 */
export function themeFontClassNames(theme: ThemeSpec, fonts: FontSet): string {
  return Array.from(new Set(themeFontIds(theme)))
    .map((id) => fonts[id]?.variable)
    .filter(Boolean)
    .join(" ");
}
