import { eq } from "drizzle-orm";
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
