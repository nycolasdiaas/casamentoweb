import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { gifts, giftContributions } from "@/lib/db/schema";

export type GiftInput = {
  category: string;
  name: string;
  priceCents: number | null;
};

export async function createGift(input: GiftInput) {
  const [{ maxPosition }] = await db
    .select({ maxPosition: sql<number>`coalesce(max(${gifts.position}), -1)` })
    .from(gifts);

  const [gift] = await db
    .insert(gifts)
    .values({ ...input, position: maxPosition + 1 })
    .returning();
  return gift;
}

export async function updateGift(giftId: string, input: GiftInput) {
  const [gift] = await db
    .update(gifts)
    .set(input)
    .where(eq(gifts.id, giftId))
    .returning();
  return gift ?? null;
}

export async function deleteGift(giftId: string) {
  await db.delete(gifts).where(eq(gifts.id, giftId));
}

export async function listGifts() {
  return db.query.gifts.findMany({
    orderBy: (gifts, { asc }) => [asc(gifts.position), asc(gifts.createdAt)],
  });
}

export async function getGiftById(giftId: string) {
  const gift = await db.query.gifts.findFirst({ where: eq(gifts.id, giftId) });
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

export async function listContributions() {
  return db.query.giftContributions.findMany({
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
