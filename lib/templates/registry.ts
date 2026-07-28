import type { TemplateStyleId } from "@/lib/templates";
import type { TemplateModule } from "./contract";
import classico from "./classico";
import editorial from "./editorial";
import toscana from "./toscana";
import romantico from "./romantico";
import moderno from "./moderno";
import film from "./film";

// Registry dos moldes disponíveis.
//
// Imports estáticos de propósito: o bundler precisa enxergar cada molde para
// incluí-lo no build. `import(caminhoVariavel)` quebraria isso.
//
// Cada molde traz as PRÓPRIAS fontes, então este import estático não arrasta
// o CSS de todos para toda página: o Next separa por rota, e a página do
// casal só carrega o molde que renderiza. Ver §4.3 do SDD.
//
// Os 6 estilos vendidos na landing estão aqui. O tipo segue `Partial` de
// propósito: se um estilo novo entrar em TEMPLATE_STYLES antes de ser
// portado, o site cai no fallback de quem chama (SiteFromView mostra
// "estamos preparando") em vez de quebrar.
const TEMPLATE_REGISTRY: Partial<Record<TemplateStyleId, TemplateModule>> = {
  classico,
  editorial,
  toscana,
  romantico,
  moderno,
  film,
};

export function getTemplate(id: string | null): TemplateModule | null {
  if (!id) return null;
  return TEMPLATE_REGISTRY[id as TemplateStyleId] ?? null;
}

export function isTemplatePorted(id: string | null): boolean {
  return getTemplate(id) !== null;
}

/** Moldes já disponíveis para renderizar de verdade. */
export function portedTemplateIds(): TemplateStyleId[] {
  return Object.keys(TEMPLATE_REGISTRY) as TemplateStyleId[];
}
