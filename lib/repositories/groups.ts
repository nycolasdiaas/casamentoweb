import { and, eq } from "drizzle-orm";
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
  const group = await db.query.groups.findFirst({
    where: eq(groups.slug, slug),
    with: {
      guests: { orderBy: (guests, { asc }) => [asc(guests.position)] },
    },
  });

  return group ?? null;
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
