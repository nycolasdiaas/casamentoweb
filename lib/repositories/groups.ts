import { and, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db/client";
import { groups, guests } from "@/lib/db/schema";
import { generateUniqueSlug } from "@/lib/slug";

async function slugExists(slug: string): Promise<boolean> {
  const existing = await db.query.groups.findFirst({
    where: eq(groups.slug, slug),
  });
  return existing !== undefined;
}

export async function createGroup({
  siteId,
  label,
  guestNames,
}: {
  siteId: string;
  label?: string;
  guestNames: string[];
}) {
  const slug = await generateUniqueSlug(slugExists);

  return db.transaction(async (tx) => {
    const [group] = await tx
      .insert(groups)
      .values({ slug, label, siteId })
      .returning();

    const insertedGuests = await tx
      .insert(guests)
      .values(
        guestNames.map((name, index) => ({
          groupId: group.id,
          name,
          position: index,
        }))
      )
      .returning();

    return { ...group, guests: insertedGuests };
  });
}

/**
 * Busca GLOBAL por slug, de propósito — não recebe siteId.
 *
 * O slug do grupo é único no banco inteiro, e os links /rsvp/<slug> já estão
 * com os convidados. Exigir o site aqui quebraria esses links. O grupo
 * devolvido carrega `siteId`, então quem chama sabe a que casamento pertence.
 *
 * Ver docs/sdd-geracao-automatica.md §5.2 e §6.2.
 */
export async function getGroupBySlug(slug: string) {
  "use cache";
  cacheTag(`group:${slug}`);
  // Mais curto que a lista de presentes de propósito: confirmação de presença
  // é o dado que mais dói ficar velho. A action chama updateTag ao confirmar,
  // então isto é só rede de segurança.
  cacheLife("hours");

  const group = await db.query.groups.findFirst({
    where: eq(groups.slug, slug),
    with: {
      guests: { orderBy: (guests, { asc }) => [asc(guests.position)] },
    },
  });

  return group ?? null;
}

/**
 * Slugs de grupo para o `generateStaticParams` da rota de RSVP.
 *
 * Com Cache Components, uma rota dinâmica precisa declarar ao menos um param
 * — é isso que autoriza a página a ler `params` fora de <Suspense>, e é o que
 * permite o `notFound()` devolver um 404 de verdade em vez de 200 com o shell
 * já enviado.
 */
export async function listGroupSlugs(): Promise<string[]> {
  "use cache";
  cacheTag("group-slugs");
  cacheLife("hours");

  const rows = await db.select({ slug: groups.slug }).from(groups);
  return rows.map((r) => r.slug);
}

export async function listGroupsWithGuests(siteId: string) {
  return db.query.groups.findMany({
    where: eq(groups.siteId, siteId),
    with: {
      guests: { orderBy: (guests, { asc }) => [asc(guests.position)] },
    },
    orderBy: (groups, { desc }) => [desc(groups.createdAt)],
  });
}

export async function deleteGroup(siteId: string, groupId: string) {
  await db
    .delete(groups)
    .where(and(eq(groups.id, groupId), eq(groups.siteId, siteId)));
}
