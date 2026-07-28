import { asc, eq, count } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { orderPhotos } from "@/lib/db/schema";

export type NewOrderPhoto = {
  orderId: string;
  storagePath: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  position: number;
};

export async function listOrderPhotos(orderId: string) {
  return db.query.orderPhotos.findMany({
    where: eq(orderPhotos.orderId, orderId),
    orderBy: [asc(orderPhotos.position), asc(orderPhotos.createdAt)],
  });
}

export async function countOrderPhotos(orderId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(orderPhotos)
    .where(eq(orderPhotos.orderId, orderId));
  return row?.value ?? 0;
}

export async function addOrderPhotos(rows: NewOrderPhoto[]) {
  if (rows.length === 0) return [];
  return db.insert(orderPhotos).values(rows).returning();
}

/** Busca a foto para conferir o dono antes de apagar. */
export async function getOrderPhotoById(id: string) {
  const row = await db.query.orderPhotos.findFirst({
    where: eq(orderPhotos.id, id),
  });
  return row ?? null;
}

export async function deleteOrderPhoto(id: string) {
  await db.delete(orderPhotos).where(eq(orderPhotos.id, id));
}
