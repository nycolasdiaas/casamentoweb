import { isHexColor, isFontStyle, type FontStyleId } from "@/lib/customization";

// Tokens visuais de um site. É o contrato entre a escolha do casal e o
// template que renderiza — o molde consome tokens, nunca hex fixo.
//
// A paleta tem exatamente os 4 papéis que os 6 templates já usam hoje
// (ver TemplateChrome): fundo externo, cartão, texto e acento. Não inventei
// tokens "para o futuro": quando um template precisar variar em ornamento ou
// densidade, o campo entra junto com o uso.
//
// Ver docs/sdd-geracao-automatica.md §4.2.

export type ThemePalette = {
  /** fundo "letterbox" atrás do cartão */
  outer: string;
  /** fundo do cartão, onde o conteúdo vive */
  paper: string;
  /** cor do texto e das linhas principais */
  ink: string;
  /** dourado/terracota/rosé — detalhes e destaques */
  accent: string;
};

export type ThemeFonts = {
  /** títulos e nomes do casal */
  display: FontStyleId;
  /** corpo de texto */
  body: FontStyleId;
  /** caligráfica dos detalhes ("Save the Date", "&") */
  script: FontStyleId;
};

export type ThemeSpec = {
  version: 1;
  palette: ThemePalette;
  fonts: ThemeFonts;
};

/** Escolhas do casal no pedido. Qualquer campo pode faltar ou vir inválido. */
export type ThemeOverrides = {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  fontStyle?: string | null;
};

function isPalette(value: unknown): value is ThemePalette {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  return (["outer", "paper", "ink", "accent"] as const).every(
    (k) => typeof p[k] === "string" && isHexColor(p[k] as string)
  );
}

function isFonts(value: unknown): value is ThemeFonts {
  if (!value || typeof value !== "object") return false;
  const f = value as Record<string, unknown>;
  return (["display", "body", "script"] as const).every(
    (k) => typeof f[k] === "string" && isFontStyle(f[k] as string)
  );
}

/**
 * Valida um ThemeSpec vindo do banco (coluna jsonb, portanto sem tipo).
 * Devolve null se qualquer campo estiver ausente ou fora do catálogo — quem
 * chama cai no preset do template, nunca renderiza meio quebrado.
 *
 * Validação escrita à mão, no mesmo estilo do resto do projeto
 * (isFontStyle, isHexColor, isOrderStatus, isEventKind) — sem dependência nova.
 */
export function parseThemeSpec(value: unknown): ThemeSpec | null {
  if (!value || typeof value !== "object") return null;
  const t = value as Record<string, unknown>;
  if (t.version !== 1) return null;
  if (!isPalette(t.palette) || !isFonts(t.fonts)) return null;
  return { version: 1, palette: t.palette, fonts: t.fonts };
}

/**
 * Preset do template + escolhas do casal = tema final.
 *
 * A cor principal do casal vira o `accent` (é o detalhe que ele percebe como
 * "a cor do nosso casamento"), e a secundária, quando válida, vira o `ink`.
 * Escolha inválida ou ausente simplesmente mantém o preset — o site nunca
 * fica feio por causa de um campo mal preenchido.
 */
export function resolveTheme(
  preset: ThemeSpec,
  overrides: ThemeOverrides = {}
): ThemeSpec {
  const palette = { ...preset.palette };
  const fonts = { ...preset.fonts };

  if (overrides.primaryColor && isHexColor(overrides.primaryColor)) {
    palette.accent = overrides.primaryColor;
  }
  if (overrides.secondaryColor && isHexColor(overrides.secondaryColor)) {
    palette.ink = overrides.secondaryColor;
  }
  if (overrides.fontStyle && isFontStyle(overrides.fontStyle)) {
    fonts.display = overrides.fontStyle;
  }

  return { version: 1, palette, fonts };
}
