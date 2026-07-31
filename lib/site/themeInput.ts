import { isHexColor, isFontStyle, type FontStyleId } from "@/lib/customization";
import type { ThemeSpec } from "@/lib/theme/spec";

// Validação do editor de tema do casal (cores e fontes).
//
// A regra que não pode cair: **fonte só do catálogo do molde**. O
// `clampThemeFonts` já recorta na hora de renderizar, mas gravar uma fonte
// fora do catálogo deixaria o formulário mostrando uma escolha que o site
// ignora — o casal mexeria e nada mudaria. Barrar aqui é o que mantém o que
// está salvo igual ao que aparece.
//
// Ver §4.2 e §4.3 do SDD.

export const PAPEIS_COR = ["outer", "paper", "ink", "accent"] as const;
export const PAPEIS_FONTE = ["display", "body", "script"] as const;

export type ThemeInputResult =
  | { ok: true; value: ThemeSpec }
  | { ok: false; error: string };

const ROTULO_COR: Record<(typeof PAPEIS_COR)[number], string> = {
  outer: "fundo de fora",
  paper: "fundo do cartão",
  ink: "cor do texto",
  accent: "cor de destaque",
};

const ROTULO_FONTE: Record<(typeof PAPEIS_FONTE)[number], string> = {
  display: "títulos",
  body: "texto",
  script: "caligrafia",
};

/**
 * Contraste relativo (WCAG) entre duas cores hex. Usado só para AVISAR, não
 * para barrar: o casal é dono do gosto, mas texto que não se lê no celular do
 * convidado é defeito, não estilo.
 */
export function contraste(hexA: string, hexB: string): number {
  const lum = (hex: string) => {
    const n = hex.replace("#", "");
    const full =
      n.length === 3
        ? n
            .split("")
            .map((c) => c + c)
            .join("")
        : n;
    const canal = [0, 2, 4].map((i) => {
      const v = parseInt(full.slice(i, i + 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * canal[0] + 0.7152 * canal[1] + 0.0722 * canal[2];
  };
  const a = lum(hexA);
  const b = lum(hexB);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function parseThemeForm(
  formData: FormData,
  fontesDisponiveis: ReadonlySet<string>
): ThemeInputResult {
  const palette = {} as Record<(typeof PAPEIS_COR)[number], string>;
  for (const papel of PAPEIS_COR) {
    const bruto = formData.get(papel)?.toString().trim() ?? "";
    if (!isHexColor(bruto)) {
      return { ok: false, error: `Cor inválida em "${ROTULO_COR[papel]}".` };
    }
    palette[papel] = bruto;
  }

  const fonts = {} as Record<(typeof PAPEIS_FONTE)[number], FontStyleId>;
  for (const papel of PAPEIS_FONTE) {
    const bruto = formData.get(papel)?.toString().trim() ?? "";
    if (!isFontStyle(bruto)) {
      return { ok: false, error: `Fonte inválida em "${ROTULO_FONTE[papel]}".` };
    }
    if (!fontesDisponiveis.has(bruto)) {
      return {
        ok: false,
        error: `Essa fonte não faz parte deste modelo. Escolham uma da lista de "${ROTULO_FONTE[papel]}".`,
      };
    }
    fonts[papel] = bruto;
  }

  return { ok: true, value: { version: 1, palette, fonts } };
}

/** Avisos de legibilidade, para mostrar ao lado do formulário. */
export function avisosDeContraste(palette: {
  outer: string;
  paper: string;
  ink: string;
  accent: string;
}): string[] {
  const avisos: string[] = [];
  if (contraste(palette.ink, palette.paper) < 4.5) {
    avisos.push(
      "O texto está com pouco contraste sobre o fundo do cartão — no celular, sob sol, pode ficar ilegível."
    );
  }
  if (contraste(palette.accent, palette.paper) < 3) {
    avisos.push(
      "A cor de destaque quase desaparece sobre o fundo do cartão."
    );
  }
  return avisos;
}
