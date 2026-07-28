import type { TemplateStyleId } from "@/lib/templates";
import type { TemplateModule } from "./contract";
import classico from "./classico";

// Registry dos moldes disponíveis.
//
// Imports estáticos de propósito: o bundler precisa enxergar cada molde para
// incluí-lo no build. `import(caminhoVariavel)` quebraria isso.
//
// Fase 1 entrega só o Clássico, portado ponta a ponta, para validar o
// contrato antes de portar os outros cinco (Fase 2). Um site cujo
// template_id ainda não foi portado cai no fallback de quem chama.
const TEMPLATE_REGISTRY: Partial<Record<TemplateStyleId, TemplateModule>> = {
  classico,
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
