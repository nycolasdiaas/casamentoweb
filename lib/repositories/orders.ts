import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { orders } from "@/lib/db/schema";
import type { PackageTier } from "@/lib/packages";

export type OrderInput = {
  packageTier: PackageTier;
  templateStyle: string;
  coupleNames?: string;
  weddingDate?: string;
  photosLink?: string;
  notes?: string;
};

/** Pedido mais recente do casal (um pedido por casal no fluxo atual). */
export async function getOrderByUserId(userId: string) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.userId, userId),
    orderBy: [desc(orders.createdAt)],
  });
  return order ?? null;
}

/** Cria o pedido do casal ou atualiza o existente (rascunho ou não). */
export async function upsertOrder(userId: string, input: OrderInput) {
  const existing = await getOrderByUserId(userId);

  if (existing) {
    const [updated] = await db
      .update(orders)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(orders.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(orders)
    .values({ userId, ...input })
    .returning();
  return created;
}

export async function submitOrder(userId: string) {
  const existing = await getOrderByUserId(userId);
  if (!existing) return null;

  const [updated] = await db
    .update(orders)
    .set({ status: "submitted", updatedAt: new Date() })
    .where(eq(orders.id, existing.id))
    .returning();
  return updated;
}

/** Para o admin acompanhar os pedidos que chegam. */
export async function listOrdersWithUsers() {
  return db.query.orders.findMany({
    with: { user: true },
    orderBy: [desc(orders.updatedAt)],
  });
}
