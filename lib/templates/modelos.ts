import type { ThemePalette } from "@/lib/theme/spec";
import { TEMPLATE_STYLES, type TemplateStyleId } from "@/lib/templates";
import { getTemplate } from "./registry";

/**
 * Os seis modelos reduzidos ao que uma miniatura precisa.
 *
 * ── Por que existe ────────────────────────────────────────────────────────
 *
 * O painel de Modelos do editor é client component, e o editor inteiro
 * também. Importar o `registry` de lá arrastaria os seis moldes para o
 * navegador — e com eles as consultas ao banco com `"use cache"` que as seções
 * carregam, que o Next recusa em componente de cliente ("It is not allowed to
 * define inline `use cache` annotated functions in Client Components").
 *
 * Então a extração acontece no SERVIDOR, e o cliente recebe seis objetos de
 * quatro cores. A regra de §4.4.1 continua valendo: a cor vem do
 * `defaultTheme` do molde, nunca de hex escrito na tela — se o preset do
 * Toscana mudar, a miniatura muda junto.
 */
export type ModeloDeConvite = {
  id: TemplateStyleId;
  nome: string;
  paleta: ThemePalette;
};

export function modelosDeConvite(): ModeloDeConvite[] {
  return TEMPLATE_STYLES.flatMap((estilo) => {
    const molde = getTemplate(estilo.id);
    // Estilo ainda não portado não vira miniatura: melhor faltar uma opção
    // que oferecer uma que não pinta nada.
    if (!molde) return [];
    return [
      { id: estilo.id, nome: estilo.name, paleta: molde.defaultTheme.palette },
    ];
  });
}
