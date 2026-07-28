import type { ComponentType } from "react";
import type { PackageTier } from "@/lib/packages";
import type { TemplateStyleId, TemplateStyle } from "@/lib/templates";
import type { ThemeSpec } from "@/lib/theme/spec";

// Contrato entre o molde (template) e os dados do casal.
//
// Um template não sabe de banco, de pedido nem de pacote: recebe conteúdo já
// resolvido e tokens, e devolve JSX. É isso que faz corrigir um molde
// corrigir todos os sites que o usam.
//
// Ver docs/sdd-geracao-automatica.md §4.4.

export const SECTION_KEYS = [
  "cover", // capa / save the date
  "countdown", // contagem regressiva
  "story", // história do casal
  "details", // cerimônia, festa, endereço
  "gallery", // fotos
  "rsvp", // confirmação de presença
  "gifts", // lista de presentes com Pix
  "guestbook", // mural de recados
  "album", // álbum pós-festa
  "footer",
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

export function isSectionKey(value: string): value is SectionKey {
  return (SECTION_KEYS as readonly string[]).includes(value);
}

/** Conteúdo do casal já normalizado, pronto para renderizar. */
export type SiteContentView = {
  coupleNames: string;
  partnerA: string | null;
  partnerB: string | null;
  initials: [string, string] | null;
  weddingDate: Date | null;
  weddingDateLabel: string | null;
  weddingTimeLabel: string | null;
  weekdayLabel: string | null;
  ceremonyVenue: string | null;
  ceremonyAddress: string | null;
  ceremonyMapUrl: string | null;
  receptionVenue: string | null;
  receptionAddress: string | null;
  story: string | null;
  dressCode: string | null;
  giftMessage: string | null;
};

/** Tudo que uma seção recebe. */
export type SectionProps = {
  content: SiteContentView;
  theme: ThemeSpec;
  tier: PackageTier;
  /** slug do site, para links internos e para o beacon de métricas */
  slug: string;
};

export type TemplateModule = {
  id: TemplateStyleId;
  meta: TemplateStyle;
  /** tema padrão do molde, antes das escolhas do casal */
  defaultTheme: ThemeSpec;
  /** ordem canônica das seções neste molde */
  order: SectionKey[];
  sections: Partial<Record<SectionKey, ComponentType<SectionProps>>>;
};

/**
 * Quais seções cada pacote libera. Espelha a tabela de §4.5 do SDD e o
 * `tierIncludes` que a landing já usa.
 */
const TIER_SECTIONS: Record<PackageTier, SectionKey[]> = {
  convite: ["cover", "countdown", "story", "details", "gallery", "footer"],
  site: ["cover", "countdown", "story", "details", "gallery", "rsvp", "footer"],
  "para-sempre": [...SECTION_KEYS],
};

export function sectionsForTier(tier: PackageTier): SectionKey[] {
  return TIER_SECTIONS[tier];
}

export function tierAllowsSection(tier: PackageTier, key: SectionKey): boolean {
  return TIER_SECTIONS[tier].includes(key);
}
