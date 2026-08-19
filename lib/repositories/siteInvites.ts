import { and, asc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { siteInvites, sites } from "@/lib/db/schema";
import { generateUniqueSlug } from "@/lib/slug";
import { cacheLife, cacheTag } from "next/cache";

/** Tag do convite publicado — a mesma no leitor e em quem publica. */
export const conviteTag = (slug: string) => `convite:${slug}`;

/** Alimenta o `generateStaticParams` de `/c/[slug]`. */
export const CONVITES_PUBLICADOS = "convites-publicados";
import {
  MAX_CONVITES,
  parseInviteDoc,
  type InviteDoc,
} from "@/lib/site/inviteDoc";

export type Convite = {
  id: string;
  name: string;
  doc: InviteDoc;
  /** Endereço público `/c/<slug>`. `null` = nunca publicado. */
  slug: string | null;
  publishedAt: Date | null;
  updatedAt: Date;
};

export async function listInvites(siteId: string): Promise<Convite[]> {
  const linhas = await db
    .select()
    .from(siteInvites)
    .where(eq(siteInvites.siteId, siteId))
    .orderBy(asc(siteInvites.createdAt));

  return linhas.map((l) => ({
    id: l.id,
    name: l.name,
    doc: parseInviteDoc(l.doc),
    slug: l.slug,
    publishedAt: l.publishedAt,
    updatedAt: l.updatedAt,
  }));
}

export async function getInvite(
  siteId: string,
  inviteId: string
): Promise<Convite | null> {
  const [l] = await db
    .select()
    .from(siteInvites)
    .where(and(eq(siteInvites.siteId, siteId), eq(siteInvites.id, inviteId)));

  if (!l) return null;
  return {
    id: l.id,
    name: l.name,
    doc: parseInviteDoc(l.doc),
    slug: l.slug,
    publishedAt: l.publishedAt,
    updatedAt: l.updatedAt,
  };
}

/**
 * Cria um convite, respeitando o teto de 5 por site.
 *
 * A contagem vai DENTRO do insert, como `where not exists (…)`, e não numa
 * leitura antes: entre ler "tem 4" e gravar o quinto, um segundo clique cria
 * o sexto. Com a checagem no próprio comando, o banco decide, e o insert
 * simplesmente não acontece.
 */
export async function createInvite(
  siteId: string,
  name: string,
  doc: InviteDoc
): Promise<{ ok: true; id: string } | { ok: false; motivo: "limite" }> {
  // `insert ... select ... where` num comando só: o SELECT não devolve linha
  // quando o site já tem 5, e aí o INSERT não insere nada.
  const linhas = await db.execute<{ id: string }>(sql`
    insert into ${siteInvites} (site_id, name, doc)
    select ${siteId}::uuid, ${name}, ${JSON.stringify(doc)}::jsonb
    where (
      select count(*) from ${siteInvites}
      where ${siteInvites.siteId} = ${siteId}::uuid
    ) < ${MAX_CONVITES}
    returning id
  `);

  const criado = (linhas as unknown as { id: string }[])[0];
  return criado ? { ok: true, id: criado.id } : { ok: false, motivo: "limite" };
}

export async function saveInvite(
  siteId: string,
  inviteId: string,
  campos: { name?: string; doc?: InviteDoc }
): Promise<boolean> {
  const linhas = await db
    .update(siteInvites)
    .set({
      ...(campos.name !== undefined ? { name: campos.name } : {}),
      ...(campos.doc !== undefined ? { doc: campos.doc } : {}),
      updatedAt: new Date(),
    })
    // O `siteId` no WHERE é o que impede um id de convite alheio ser gravado
    // com o site de quem pediu.
    .where(and(eq(siteInvites.siteId, siteId), eq(siteInvites.id, inviteId)))
    .returning({ id: siteInvites.id });

  return linhas.length > 0;
}

export async function deleteInvite(
  siteId: string,
  inviteId: string
): Promise<boolean> {
  const linhas = await db
    .delete(siteInvites)
    .where(and(eq(siteInvites.siteId, siteId), eq(siteInvites.id, inviteId)))
    .returning({ id: siteInvites.id });

  return linhas.length > 0;
}

/**
 * Acha o convite pelo id, com o site e o pedido a que pertence.
 *
 * Existe porque o editor mora em `/conta/convites/<id>` — fora da árvore do
 * pedido, para ocupar a tela inteira sem o menu do gerenciamento ao lado. Sem
 * o `orderId` na URL, é daqui que sai o caminho de volta.
 *
 * O `userId` vai no WHERE, não numa checagem depois: é o que garante que um id
 * de convite alheio simplesmente não seja encontrado, em vez de ser carregado
 * e recusado adiante.
 */
export async function getInviteDoDono(
  inviteId: string,
  userId: string
): Promise<{
  convite: Convite;
  siteId: string;
  slug: string;
  orderId: string | null;
} | null> {
  const [l] = await db
    .select({
      id: siteInvites.id,
      name: siteInvites.name,
      doc: siteInvites.doc,
      slug: siteInvites.slug,
      publishedAt: siteInvites.publishedAt,
      updatedAt: siteInvites.updatedAt,
      siteId: sites.id,
      // O slug do SITE, não o do convite — os dois existem e são diferentes.
      slugDoSite: sites.slug,
      orderId: sites.orderId,
    })
    .from(siteInvites)
    .innerJoin(sites, eq(sites.id, siteInvites.siteId))
    .where(and(eq(siteInvites.id, inviteId), eq(sites.userId, userId)));

  if (!l) return null;
  return {
    convite: {
      id: l.id,
      name: l.name,
      doc: parseInviteDoc(l.doc),
      slug: l.slug,
      publishedAt: l.publishedAt,
      updatedAt: l.updatedAt,
    },
    siteId: l.siteId,
    slug: l.slugDoSite,
    orderId: l.orderId,
  };
}

/**
 * Publica o convite: garante um slug e marca a data.
 *
 * O slug é gerado UMA vez e nunca muda — depois de publicado, o endereço pode
 * estar no WhatsApp de meio mundo. Republicar (o casal edita e salva de novo)
 * mantém o mesmo link: é o mesmo convite, com o desenho novo.
 *
 * Mesma regra dos slugs de grupo (`lib/slug.ts`), inclusive o gerador: 8
 * caracteres aleatórios, não derivados dos nomes — dois convites do mesmo
 * casal colidiriam, e o endereço não deve ser adivinhável.
 */
export async function publicarConvite(
  siteId: string,
  inviteId: string
): Promise<string | null> {
  const atual = await getInvite(siteId, inviteId);
  if (!atual) return null;

  const slug =
    atual.slug ??
    (await generateUniqueSlug(async (candidato) => {
      const [existe] = await db
        .select({ id: siteInvites.id })
        .from(siteInvites)
        .where(eq(siteInvites.slug, candidato));
      return Boolean(existe);
    }));

  const linhas = await db
    .update(siteInvites)
    .set({ slug, publishedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(siteInvites.siteId, siteId), eq(siteInvites.id, inviteId)))
    .returning({ slug: siteInvites.slug });

  return linhas[0]?.slug ?? null;
}

/** Tira o convite do ar. O slug FICA, para republicar no mesmo endereço. */
export async function despublicarConvite(
  siteId: string,
  inviteId: string
): Promise<boolean> {
  const linhas = await db
    .update(siteInvites)
    .set({ publishedAt: null, updatedAt: new Date() })
    .where(and(eq(siteInvites.siteId, siteId), eq(siteInvites.id, inviteId)))
    .returning({ id: siteInvites.id });
  return linhas.length > 0;
}

/**
 * O convite público, por slug. Sem sessão: é a página que o convidado abre.
 *
 * Devolve `null` quando o convite não foi publicado ou saiu do ar — o
 * `publishedAt` no WHERE é o que impede um rascunho vazar por endereço
 * adivinhado.
 */
export async function getConvitePublicado(slug: string): Promise<{
  convite: Convite;
  siteSlug: string;
  siteId: string;
} | null> {
  // CACHEADO, como `/s/[slug]`: com Cache Components uma leitura solta trava
  // a rota inteira e o `next build` reprova com "Uncached data was accessed
  // outside of <Suspense>". Também é o certo para a carga: o convite muda
  // quando o casal publica, e aí `updateTag` derruba esta entrada.
  "use cache";
  cacheTag(conviteTag(slug));
  cacheLife("days");

  const [l] = await db
    .select({
      id: siteInvites.id,
      name: siteInvites.name,
      doc: siteInvites.doc,
      slug: siteInvites.slug,
      publishedAt: siteInvites.publishedAt,
      updatedAt: siteInvites.updatedAt,
      siteId: sites.id,
      slugDoSite: sites.slug,
      statusDoSite: sites.status,
    })
    .from(siteInvites)
    .innerJoin(sites, eq(sites.id, siteInvites.siteId))
    .where(and(eq(siteInvites.slug, slug), isNotNull(siteInvites.publishedAt)));

  // Site arquivado leva o convite junto: o casamento saiu do ar.
  if (!l || l.statusDoSite === "archived") return null;

  return {
    convite: {
      id: l.id,
      name: l.name,
      doc: parseInviteDoc(l.doc),
      slug: l.slug,
      publishedAt: l.publishedAt,
      updatedAt: l.updatedAt,
    },
    siteSlug: l.slugDoSite,
    siteId: l.siteId,
  };
}

/**
 * Slugs dos convites publicados, para o `generateStaticParams` de `/c/[slug]`.
 *
 * Mesma necessidade de `/s/[slug]`: com Cache Components a rota precisa
 * declarar ao menos um param para o `notFound()` devolver 404 de verdade.
 */
export async function listPublishedInviteSlugs(): Promise<string[]> {
  "use cache";
  cacheTag(CONVITES_PUBLICADOS);
  cacheLife("days");

  const linhas = await db
    .select({ slug: siteInvites.slug })
    .from(siteInvites)
    .where(isNotNull(siteInvites.publishedAt));

  return linhas.map((l) => l.slug).filter((s): s is string => Boolean(s));
}
