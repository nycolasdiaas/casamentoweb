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

  const encontrado = await db.query.sites.findFirst({
    where: eq(sites.slug, slug),
  });
  if (!encontrado) return null;

  /* O HASH DA SENHA NÃO SAI DAQUI.
     Esta view desce inteira para `SiteFromView`, que é renderizado na página
     pública — e tudo que um server component passa a um filho vai junto no
     payload do RSC. Um `accessPasswordHash` ali seria o hash da senha do
     casal viajando no HTML da página que a senha existe para proteger.
     Quem precisa dele é `getSiteAccess`, que roda no servidor e não devolve
     nada para a árvore. */
  const { accessPasswordHash: _naoVaza, ...site } = encontrado;

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

  const encontrado = await db.query.sites.findFirst({
    where: eq(sites.previewToken, token),
  });
  if (!encontrado) return null;

  // Mesmo motivo de `getSiteViewBySlug`: a prévia também desce para a árvore.
  const { accessPasswordHash: _naoVaza, ...site } = encontrado;

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
