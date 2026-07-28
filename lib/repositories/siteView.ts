import { eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db/client";
import { sites, siteContent, siteSections } from "@/lib/db/schema";

/**
 * Tudo que a rota pública precisa para renderizar um site, numa consulta só.
 *
 * Em cache com a tag `site-view:<slug>`: é o caminho quente do convidado.
 * Publicar ou editar o site invalida a tag, e o convidado seguinte já pega a
 * versão nova.
 */
export async function getSiteViewBySlug(slug: string) {
  "use cache";
  cacheTag(`site-view:${slug}`);
  cacheLife("days");

  const site = await db.query.sites.findFirst({
    where: eq(sites.slug, slug),
  });
  if (!site) return null;

  const [content] = await db
    .select()
    .from(siteContent)
    .where(eq(siteContent.siteId, site.id));

  const secoes = await db
    .select()
    .from(siteSections)
    .where(eq(siteSections.siteId, site.id));

  return { site, content: content ?? null, sections: secoes };
}

/**
 * Mesma view, mas resolvida pelo token de prévia.
 *
 * O token é o segredo que dá acesso ao site antes de publicar — por isso a
 * busca é por ele, e não pelo slug: o slug é adivinhável, o token não.
 */
export async function getSiteViewByPreviewToken(token: string) {
  "use cache";
  cacheTag(`site-preview:${token}`);
  cacheLife("minutes");

  const site = await db.query.sites.findFirst({
    where: eq(sites.previewToken, token),
  });
  if (!site) return null;

  const [content] = await db
    .select()
    .from(siteContent)
    .where(eq(siteContent.siteId, site.id));

  const secoes = await db
    .select()
    .from(siteSections)
    .where(eq(siteSections.siteId, site.id));

  return { site, content: content ?? null, sections: secoes };
}

/** Slugs publicados, para o generateStaticParams da rota pública. */
export async function listPublishedSiteSlugs(): Promise<string[]> {
  "use cache";
  cacheTag("published-site-slugs");
  cacheLife("hours");

  const rows = await db
    .select({ slug: sites.slug })
    .from(sites)
    .where(eq(sites.status, "published"));
  return rows.map((r) => r.slug);
}
