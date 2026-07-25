import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { orderAuditLog } from "@/lib/db/schema";

export type AuditChange = {
  field: string;
  oldValue: string | null;
  newValue: string | null;
};

/** Grava uma linha por campo alterado. Não faz nada se não houve mudança. */
export async function logOrderChanges(
  orderId: string,
  adminId: string,
  adminName: string,
  changes: AuditChange[]
) {
  if (changes.length === 0) return;

  await db.insert(orderAuditLog).values(
    changes.map((change) => ({
      orderId,
      adminId,
      adminName,
      field: change.field,
      oldValue: change.oldValue,
      newValue: change.newValue,
    }))
  );
}

/** Histórico de um pedido, do mais recente ao mais antigo. */
export async function listOrderAuditLog(orderId: string) {
  return db.query.orderAuditLog.findMany({
    where: eq(orderAuditLog.orderId, orderId),
    orderBy: [desc(orderAuditLog.createdAt)],
  });
}
