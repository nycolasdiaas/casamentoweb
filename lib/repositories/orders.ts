import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { orders } from "@/lib/db/schema";
import type { PackageTier } from "@/lib/packages";
import type { OrderStatus } from "@/lib/orderStatus";

export type OrderInput = {
  packageTier: PackageTier;
  templateStyle?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  fontStyle?: string;
  styleNotes?: string;
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

/** Acha o pedido dono de uma cobrança AbacatePay (usado no webhook). */
export async function getOrderByPaymentId(paymentId: string) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.paymentId, paymentId),
  });
  return order ?? null;
}

/** Pedido específico (com o casal), para admin e fluxo de pagamento. */
export async function getOrderById(orderId: string) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: { user: true },
  });
  return order ?? null;
}

/** Para o admin acompanhar os pedidos que chegam. */
export async function listOrdersWithUsers() {
  return db.query.orders.findMany({
    with: { user: true },
    orderBy: [desc(orders.updatedAt)],
  });
}

/** Admin move o pedido pela esteira de produção. */
export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const [updated] = await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, orderId))
    .returning();
  return updated ?? null;
}

export type AdminOrderFields = {
  previewUrl?: string | null;
  siteUrl?: string | null;
  priceCents?: number | null;
  adminMessage?: string | null;
};

/** Admin preenche prévia, link final, preço e recado pro casal. */
export async function updateOrderAdminFields(
  orderId: string,
  fields: AdminOrderFields
) {
  const [updated] = await db
    .update(orders)
    .set({ ...fields, updatedAt: new Date() })
    .where(eq(orders.id, orderId))
    .returning();
  return updated ?? null;
}

/** Guarda os dados da cobrança AbacatePay no pedido. */
export async function setOrderPayment(
  orderId: string,
  payment: {
    paymentId?: string | null;
    paymentUrl?: string | null;
    paymentStatus?: string | null;
  }
) {
  const [updated] = await db
    .update(orders)
    .set({ ...payment, updatedAt: new Date() })
    .where(eq(orders.id, orderId))
    .returning();
  return updated ?? null;
}

/**
 * Confirma o pagamento: marca paymentStatus=PAID e, se o pedido estava na
 * prévia, avança para "paid". Não rebaixa status já publicado.
 */
export async function markOrderPaid(orderId: string) {
  const existing = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });
  if (!existing) return null;

  const nextStatus =
    existing.status === "preview_ready" || existing.status === "submitted"
      ? "paid"
      : existing.status;

  const [updated] = await db
    .update(orders)
    .set({ paymentStatus: "PAID", status: nextStatus, updatedAt: new Date() })
    .where(eq(orders.id, orderId))
    .returning();
  return updated ?? null;
}
