import { and, eq, inArray, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db/client";
import { gifts, giftContributions } from "@/lib/db/schema";

// TODA consulta aqui é escopada por siteId. Sem isso, a lista de presentes
// de um casal apareceria no site de outro — ver docs/sdd-geracao-automatica.md §1.2.

export type GiftInput = {
  category: string;
  name: string;
  priceCents: number | null;
};

export async function createGift(siteId: string, input: GiftInput) {
  const [{ maxPosition }] = await db
    .select({ maxPosition: sql<number>`coalesce(max(${gifts.position}), -1)` })
    .from(gifts)
    .where(eq(gifts.siteId, siteId));

  const [gift] = await db
    .insert(gifts)
    .values({ ...input, siteId, position: maxPosition + 1 })
    .returning();
  return gift;
}

export async function updateGift(
  siteId: string,
  giftId: string,
  input: GiftInput
) {
  const [gift] = await db
    .update(gifts)
    .set(input)
    .where(and(eq(gifts.id, giftId), eq(gifts.siteId, siteId)))
    .returning();
  return gift ?? null;
}

export async function deleteGift(siteId: string, giftId: string) {
  await db
    .delete(gifts)
    .where(and(eq(gifts.id, giftId), eq(gifts.siteId, siteId)));
}

/**
 * Lista de presentes do site, em cache.
 *
 * Muda só quando o casal mexe na lista — e aí a action chama
 * `updateTag('gifts:<siteId>')`, então o convidado nunca vê versão velha.
 */
export async function listGifts(siteId: string) {
  "use cache";
  cacheTag(`gifts:${siteId}`);
  cacheLife("days");

  return db.query.gifts.findMany({
    where: eq(gifts.siteId, siteId),
    orderBy: (gifts, { asc }) => [asc(gifts.position), asc(gifts.createdAt)],
  });
}

export async function getGiftById(siteId: string, giftId: string) {
  const gift = await db.query.gifts.findFirst({
    where: and(eq(gifts.id, giftId), eq(gifts.siteId, siteId)),
  });
  return gift ?? null;
}

export async function registerContribution({
  giftId,
  giftName,
  guestName,
}: {
  giftId: string | null;
  giftName: string;
  guestName: string | null;
}) {
  const [contribution] = await db
    .insert(giftContributions)
    .values({ giftId, giftName, guestName })
    .returning();
  return contribution;
}

/**
 * Contribuições do site. giftContributions não tem site_id próprio (o
 * presente pode ter sido apagado, deixando giftId null), então o escopo vem
 * da lista de presentes do site.
 */
export async function listContributions(siteId: string) {
  const siteGifts = await db
    .select({ id: gifts.id })
    .from(gifts)
    .where(eq(gifts.siteId, siteId));

  if (siteGifts.length === 0) return [];

  return db.query.giftContributions.findMany({
    where: inArray(
      giftContributions.giftId,
      siteGifts.map((g) => g.id)
    ),
    orderBy: (giftContributions, { desc }) => [
      desc(giftContributions.createdAt),
    ],
  });
}

/** Agrupa presentes por categoria preservando a ordem de exibição. */
export function groupGiftsByCategory<
  T extends { category: string }
>(giftList: T[]): { category: string; gifts: T[] }[] {
  const grouped: { category: string; gifts: T[] }[] = [];
  for (const gift of giftList) {
    const existing = grouped.find((g) => g.category === gift.category);
    if (existing) {
      existing.gifts.push(gift);
    } else {
      grouped.push({ category: gift.category, gifts: [gift] });
    }
  }
  return grouped;
}
