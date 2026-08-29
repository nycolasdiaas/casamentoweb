import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

export async function createUser({
  name,
  email,
  passwordHash,
  whatsapp,
}: {
  name: string;
  email: string;
  passwordHash: string;
  whatsapp?: string;
}) {
  const [user] = await db
    .insert(users)
    .values({ name, email, passwordHash, whatsapp })
    .returning();
  return user;
}

export async function getUserByEmail(email: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  return user ?? null;
}

export async function getUserById(id: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, id) });
  return user ?? null;
}

export async function updateUserPassword(id: string, passwordHash: string) {
  await db.update(users).set({ passwordHash }).where(eq(users.id, id));
}

/**
 * Para de mandar o resumo semanal para este casal.
 *
 * Idempotente de propósito: clicar duas vezes no link do e-mail não pode dar
 * erro, e a data que importa é a do PRIMEIRO pedido — é ela que responde
 * "desde quando?" quando alguém reclama de ter recebido.
 */
export async function pararResumoSemanal(userId: string): Promise<void> {
  await db
    .update(users)
    .set({ weeklyDigestOptOut: new Date() })
    .where(and(eq(users.id, userId), isNull(users.weeklyDigestOptOut)));
}
