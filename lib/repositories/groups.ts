import { eq } from "drizzle-orm";
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
  label,
  guestNames,
}: {
  label?: string;
  guestNames: string[];
}) {
  const slug = await generateUniqueSlug(slugExists);

  return db.transaction(async (tx) => {
    const [group] = await tx
      .insert(groups)
      .values({ slug, label })
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

export async function getGroupBySlug(slug: string) {
  const group = await db.query.groups.findFirst({
    where: eq(groups.slug, slug),
    with: {
      guests: { orderBy: (guests, { asc }) => [asc(guests.position)] },
    },
  });

  return group ?? null;
}

export async function listGroupsWithGuests() {
  return db.query.groups.findMany({
    with: {
      guests: { orderBy: (guests, { asc }) => [asc(guests.position)] },
    },
    orderBy: (groups, { desc }) => [desc(groups.createdAt)],
  });
}

export async function deleteGroup(groupId: string) {
  await db.delete(groups).where(eq(groups.id, groupId));
}
