import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { sites } from "@/lib/db/schema";

/**
 * Slug do casamento que já estava no ar antes da plataforma multi-site.
 *
 * TEMPORÁRIO: as rotas de página única (/presentes, /rsvp/[slug], /admin)
 * ainda atendem um casamento só, então resolvem o tenant por esta constante.
 * A Fase 1 (renderer por slug) remove todos os usos daqui — quando o site
 * vier da URL, esta constante deixa de existir.
 *
 * Ver docs/sdd-geracao-automatica.md §6.2.
 */
export const LEGACY_SITE_SLUG = "isabelle-e-nycolas";

export async function getSiteBySlug(slug: string) {
  const site = await db.query.sites.findFirst({ where: eq(sites.slug, slug) });
  return site ?? null;
}

export async function getSiteById(siteId: string) {
  const site = await db.query.sites.findFirst({ where: eq(sites.id, siteId) });
  return site ?? null;
}

/**
 * Resolve o site do casamento legado. Lança se não existir — é erro de
 * configuração (o backfill da Fase 0 cria este registro), não um caso
 * que a interface deva tratar.
 */
export async function getLegacySiteId(): Promise<string> {
  const site = await getSiteBySlug(LEGACY_SITE_SLUG);
  if (!site) {
    throw new Error(
      `Site "${LEGACY_SITE_SLUG}" não encontrado. Rode: npm run backfill:legacy`
    );
  }
  return site.id;
}
