import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getSiteViewBySlug,
  listPublishedSiteSlugs,
} from "@/lib/repositories/siteView";
import { getTemplate } from "@/lib/templates/registry";
// resolveTheme não entra aqui: o tema gravado em sites.theme JÁ é o
// resolvido (preset do molde + escolhas do casal). A resolução acontece no
// provisionamento do pedido (Fase 3), uma vez, não a cada render.
import { parseThemeSpec, clampThemeFonts } from "@/lib/theme/spec";
import { buildContentView } from "@/lib/site/content";
import { isSectionKey, type SectionKey } from "@/lib/templates/contract";
import SiteRenderer from "@/components/site/SiteRenderer";

/**
 * Site público de um casal, renderizado a partir do banco.
 *
 * Fica sob /s/<slug> nesta fase, e não na raiz, de propósito: colocar sites
 * de casal na raiz colide com as rotas existentes (/admin, /conta, /pacotes,
 * /presentes, /rsvp) e exigiria a lista de reservados valendo de verdade
 * (lib/siteSlug.ts). O prefixo mantém a Fase 1 sem risco para o que já está
 * no ar; a Fase 2 troca isso por subdomínio, lendo a MESMA coluna slug.
 *
 * Ver docs/sdd-geracao-automatica.md §6.
 */

export async function generateStaticParams() {
  const slugs = await listPublishedSiteSlugs();
  // Cache Components exige ao menos um param declarado.
  if (slugs.length === 0) return [{ slug: "__sem-sites__" }];
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const view = await getSiteViewBySlug(slug);
  const nomes = view?.content?.coupleNames;

  if (!view || !nomes) return { title: "Casamento" };

  return {
    title: `${nomes} | Save the Date`,
    description: `Você está convidado para o casamento de ${nomes}.`,
    // O site é público, mas não é conteúdo para busca — é um convite.
    robots: { index: false, follow: false },
  };
}

export default async function SitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const view = await getSiteViewBySlug(slug);

  if (!view || view.site.status !== "published") {
    notFound();
  }

  const template = getTemplate(view.site.templateId);
  if (!template || !view.content) {
    // Site publicado cujo molde ainda não foi portado (Fase 2) ou sem
    // conteúdo preenchido. Não é 404 — o site existe; só ainda não tem o que
    // mostrar por aqui.
    notFound();
  }

  // Tema do banco, mas grampeado ao que ESTE molde oferece: uma fonte fora
  // do catálogo do template renderizaria sem @font-face e cairia na fonte do
  // sistema. Acontece se o casal trocar de template depois de escolher a
  // fonte. Ver §4.3 do SDD.
  const theme = clampThemeFonts(
    parseThemeSpec(view.site.theme) ?? template.defaultTheme,
    new Set(Object.keys(template.fonts)),
    template.defaultTheme.fonts
  );
  const content = buildContentView({
    ...view.content,
    weddingDate: view.content.weddingDate,
  });

  const desligadas = view.sections
    .filter((s) => !s.enabled)
    .map((s) => s.sectionKey);
  const habilitadas = view.sections.length
    ? (template.order.filter(
        (k) => !desligadas.includes(k) && isSectionKey(k)
      ) as SectionKey[])
    : undefined;

  return (
    <SiteRenderer
      template={template}
      theme={theme}
      content={content}
      tier={view.site.tier}
      slug={slug}
      enabledSections={habilitadas}
    />
  );
}
