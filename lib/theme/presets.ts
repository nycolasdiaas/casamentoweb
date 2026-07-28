import type { TemplateStyleId } from "@/lib/templates";
import type { ThemeSpec } from "./spec";

// Tema padrão de cada molde, ANTES das escolhas do casal.
//
// Existe preset para os 6 estilos, inclusive os que ainda não foram portados
// para o motor (Fase 2): o provisionamento precisa gravar um tema válido no
// momento do pedido, independentemente de o molde já renderizar ou não.
//
// As paletas vêm das mesmas cores que TEMPLATE_STYLES.swatches mostra na
// landing, mais o fundo "letterbox" (outer) que os swatches não carregam.
//
// Ver docs/sdd-geracao-automatica.md §4.2.

export const THEME_PRESETS: Record<TemplateStyleId, ThemeSpec> = {
  classico: {
    version: 1,
    palette: { outer: "#2f3a2a", paper: "#f2efe7", ink: "#3d4a36", accent: "#b8985f" },
    fonts: { display: "cormorant", body: "lora", script: "pinyon" },
  },
  moderno: {
    version: 1,
    palette: { outer: "#e9e8e4", paper: "#fafafa", ink: "#1c1c1c", accent: "#bd5b32" },
    fonts: { display: "jost", body: "jost", script: "poiret" },
  },
  romantico: {
    version: 1,
    palette: { outer: "#6d3f49", paper: "#fdf2f4", ink: "#7c4a55", accent: "#d9a3ae" },
    fonts: { display: "cormorant", body: "lora", script: "parisienne" },
  },
  toscana: {
    version: 1,
    palette: { outer: "#232514", paper: "#f3eddd", ink: "#33351f", accent: "#9c8654" },
    fonts: { display: "marcellus", body: "crimson", script: "allura" },
  },
  film: {
    version: 1,
    palette: { outer: "#2a231b", paper: "#f3ebda", ink: "#3c3227", accent: "#a5603a" },
    fonts: { display: "prata", body: "spectral", script: "great-vibes" },
  },
  editorial: {
    version: 1,
    palette: { outer: "#dedcd7", paper: "#f5f3ef", ink: "#141414", accent: "#7c7c78" },
    fonts: { display: "playfair", body: "montserrat", script: "italiana" },
  },
};

/**
 * Preset de um molde. Sem molde escolhido (o casal preferiu montar do zero),
 * cai no Clássico — a paleta mais neutra do catálogo, e a única portada.
 */
export function themePresetFor(templateId: string | null): ThemeSpec {
  if (templateId && templateId in THEME_PRESETS) {
    return THEME_PRESETS[templateId as TemplateStyleId];
  }
  return THEME_PRESETS.classico;
}
