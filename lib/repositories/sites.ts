import { eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
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

/**
 * Resolve o site pelo slug, em cache.
 *
 * É a consulta mais quente da plataforma: todo acesso de convidado começa
 * por ela. Muda só quando o casal publica ou edita, então fica em cache
 * longo e é invalidada por tag (`site:<slug>`) na hora da mudança.
 */
export async function getSiteBySlug(slug: string) {
  "use cache";
  cacheTag(`site:${slug}`);
  cacheLife("days");

  const site = await db.query.sites.findFirst({ where: eq(sites.slug, slug) });
  return site ?? null;
}

export async function getSiteById(siteId: string) {
  const site = await db.query.sites.findFirst({ where: eq(sites.id, siteId) });
  return site ?? null;
}

/** O site do pedido, se existir. Um pedido tem no máximo um (order_id unique). */
export async function getSiteByOrderId(orderId: string) {
  const site = await db.query.sites.findFirst({
    where: eq(sites.orderId, orderId),
  });
  return site ?? null;
}

/**
 * O site, se ele pertence a este casal.
 *
 * Sem cache de propósito: é a checagem de dono que protege as ações de
 * escrita (subir e apagar foto). Servir isso de cache seria confiar num
 * estado que pode ter mudado.
 */
export async function getSiteOwnedByUser(siteId: string, userId: string) {
  const site = await db.query.sites.findFirst({ where: eq(sites.id, siteId) });
  if (!site || site.userId !== userId) return null;
  return site;
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

/**
 * O modo de acesso e o hash da senha — a consulta que NÃO desce para a árvore.
 *
 * Vive separada de `getSiteViewBySlug` de propósito: aquela view é passada
 * inteira para os componentes do site público, e tudo que um server component
 * entrega a um filho viaja no payload. O hash da senha precisa ficar aqui,
 * onde só o servidor lê.
 *
 * Sem cache, pela mesma razão de `getSiteOwnedByUser`: é decisão de acesso.
 * Servir de cache seria conceder entrada com base num estado que o casal pode
 * ter mudado há um segundo — e a mudança que mais importa é justamente a de
 * quem acabou de descobrir que a senha vazou.
 */
export async function getSiteAccess(slug: string) {
  const [linha] = await db
    .select({
      id: sites.id,
      accessMode: sites.accessMode,
      accessPasswordHash: sites.accessPasswordHash,
    })
    .from(sites)
    .where(eq(sites.slug, slug))
    .limit(1);

  return linha ?? null;
}

/**
 * Liga ou desliga a senha do site.
 *
 * `senhaHash` só é gravado quando vem — trocar para `password` sem senha nova
 * mantém a que já existia, que é o que permite ao casal desligar e religar a
 * proteção sem redigitar.
 *
 * Voltar para `public` **apaga o hash**. Guardar a senha de um site que deixou
 * de ser protegido é guardar segredo que ninguém mais usa, e um dia alguém
 * religa a proteção sem saber que a senha antiga voltou junto.
 */
export async function setSiteAccess(
  siteId: string,
  modo: "public" | "password",
  senhaHash?: string
) {
  const [atualizado] = await db
    .update(sites)
    .set({
      accessMode: modo,
      ...(modo === "public"
        ? { accessPasswordHash: null }
        : senhaHash
          ? { accessPasswordHash: senhaHash }
          : {}),
      updatedAt: new Date(),
    })
    .where(eq(sites.id, siteId))
    .returning({ id: sites.id, accessMode: sites.accessMode });

  return atualizado ?? null;
}
