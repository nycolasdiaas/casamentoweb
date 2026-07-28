import { getTemplate } from "@/lib/templates/registry";
import { parseThemeSpec, clampThemeFonts } from "@/lib/theme/spec";
import { themePresetFor } from "@/lib/theme/presets";
import { buildContentView } from "@/lib/site/content";
import { getTemplateStyle } from "@/lib/templates";
import { themeToCssVars } from "@/lib/theme/css";
import type { SectionKey } from "@/lib/templates/contract";
import SiteRenderer from "./SiteRenderer";
import type { sites, siteContent, siteSections } from "@/lib/db/schema";

type SiteRow = typeof sites.$inferSelect;
type ContentRow = typeof siteContent.$inferSelect;
type SectionRow = typeof siteSections.$inferSelect;

export type SiteView = {
  site: SiteRow;
  content: ContentRow | null;
  sections: SectionRow[];
};

/**
 * Renderiza um site a partir da view do banco.
 *
 * Compartilhado entre a rota pública (/s/<slug>) e a prévia
 * (/preview/<token>) — as duas montam o mesmo site, mudando só como o
 * tenant é resolvido e quem tem permissão de ver.
 */
export default function SiteFromView({
  view,
  slug,
}: {
  view: SiteView;
  slug: string;
}) {
  const template = getTemplate(view.site.templateId);

  // Molde escolhido ainda não portado para o motor (Fase 2). Não é erro nem
  // 404: o site existe, o pedido está de pé. Mostra um estado honesto em vez
  // de fingir outro estilo ou dar página não encontrada.
  if (!template) {
    return <EmPreparacao view={view} />;
  }

  const theme = clampThemeFonts(
    parseThemeSpec(view.site.theme) ?? template.defaultTheme,
    new Set(Object.keys(template.fonts)),
    template.defaultTheme.fonts
  );

  const content = buildContentView(
    view.content ?? {
      coupleNames: null,
      partnerA: null,
      partnerB: null,
      weddingDate: null,
      timezone: "America/Fortaleza",
      ceremonyVenue: null,
      ceremonyAddress: null,
      ceremonyMapUrl: null,
      receptionVenue: null,
      receptionAddress: null,
      story: null,
      dressCode: null,
      giftMessage: null,
    }
  );

  const desligadas = view.sections.filter((s) => !s.enabled).map((s) => s.sectionKey);
  const habilitadas = view.sections.length
    ? (template.order.filter((k) => !desligadas.includes(k)) as SectionKey[])
    : undefined;

  return (
    <SiteRenderer
      template={template}
      theme={theme}
      content={content}
      tier={view.site.tier}
      slug={slug}
      siteId={view.site.id}
      enabledSections={habilitadas}
    />
  );
}

function EmPreparacao({ view }: { view: SiteView }) {
  const estilo = getTemplateStyle(view.site.templateId ?? "");
  const tema = themePresetFor(view.site.templateId);
  const nomes = view.content?.coupleNames ?? "O casamento de vocês";

  return (
    <div
      className="min-h-screen w-full flex justify-center"
      style={{ ...themeToCssVars(tema), background: "var(--outer)" }}
    >
      <div
        className="w-full max-w-[480px] flex flex-col items-center justify-center gap-5 px-8 py-20 text-center shadow-2xl"
        style={{ background: "var(--paper)", color: "var(--ink)" }}
      >
        <div
          className="w-16 h-px"
          style={{ background: "var(--accent)" }}
          aria-hidden
        />
        <h1 className="text-3xl leading-tight">{nomes}</h1>
        <p className="text-sm leading-relaxed opacity-80">
          O site de vocês está sendo preparado
          {estilo ? ` no estilo ${estilo.name}` : ""}. Assim que estiver
          pronto, ele aparece aqui neste mesmo endereço.
        </p>
        <div
          className="w-10 h-px"
          style={{ background: "var(--accent)" }}
          aria-hidden
        />
      </div>
    </div>
  );
}
