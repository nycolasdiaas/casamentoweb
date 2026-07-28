import type { TemplateStyleId } from "@/lib/templates";
import type { TemplateModule } from "./contract";
import classico from "./classico";
import editorial from "./editorial";

// Registry dos moldes disponíveis.
//
// Imports estáticos de propósito: o bundler precisa enxergar cada molde para
// incluí-lo no build. `import(caminhoVariavel)` quebraria isso.
//
// Cada molde traz as PRÓPRIAS fontes, então este import estático não arrasta
// o CSS de todos para toda página: o Next separa por rota, e a página do
// casal só carrega o molde que renderiza. Ver §4.3 do SDD.
//
// Um site cujo template_id ainda não foi portado cai no fallback de quem
// chama (SiteFromView mostra "estamos preparando", não 404).
const TEMPLATE_REGISTRY: Partial<Record<TemplateStyleId, TemplateModule>> = {
  classico,
  editorial,
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
