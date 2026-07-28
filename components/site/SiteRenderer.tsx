import { themeToCssVars, themeFontClassNames } from "@/lib/theme/css";
import { sectionsForTier, type SectionKey } from "@/lib/templates/contract";
import type { TemplateModule } from "@/lib/templates/contract";
import type { SiteContentView } from "@/lib/templates/contract";
import type { ThemeSpec } from "@/lib/theme/spec";
import type { PackageTier } from "@/lib/packages";
import TrackView from "@/components/TrackView";

/**
 * Renderiza o site de um casal: molde + tokens + conteúdo.
 *
 * É o coração da plataforma. Não sabe de banco nem de pedido — recebe tudo
 * resolvido e monta as seções na ordem do molde, filtradas pelo pacote.
 *
 * O wrapper carrega as classes `variable` só das fontes que o tema usa, e as
 * custom properties do tema. Daí para dentro, as seções falam só var(--ink),
 * var(--accent), var(--font-display).
 *
 * Ver docs/sdd-geracao-automatica.md §4.
 */
export default function SiteRenderer({
  template,
  theme,
  content,
  tier,
  slug,
  siteId,
  enabledSections,
}: {
  template: TemplateModule;
  theme: ThemeSpec;
  content: SiteContentView;
  tier: PackageTier;
  slug: string;
  siteId: string;
  /** seções desligadas pelo casal; ausente = tudo que o pacote permite */
  enabledSections?: SectionKey[];
}) {
  const permitidas = sectionsForTier(tier);
  const chaves = template.order.filter(
    (key) =>
      permitidas.includes(key) &&
      (enabledSections ? enabledSections.includes(key) : true) &&
      template.sections[key]
  );

  const props = { content, theme, tier, slug, siteId };

  return (
    <div
      className={`${themeFontClassNames(theme, template.fonts)} min-h-screen w-full flex justify-center`}
      style={{ ...themeToCssVars(theme), background: "var(--outer)" }}
    >
      <div
        className="w-full max-w-[480px] flex flex-col shadow-2xl font-[family-name:var(--font-body)]"
        style={{ background: "var(--paper)", color: "var(--ink)" }}
      >
        <TrackView siteSlug={slug} />
        {chaves.map((key) => {
          const Section = template.sections[key]!;
          return <Section key={key} {...props} />;
        })}
      </div>
    </div>
  );
}
