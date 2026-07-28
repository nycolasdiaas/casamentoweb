import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { emailVerificationTokens, users } from "@/lib/db/schema";

export async function createVerificationToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date
) {
  const [row] = await db
    .insert(emailVerificationTokens)
    .values({ userId, tokenHash, expiresAt })
    .returning();
  return row;
}

/** Só um link de confirmação válido por vez. */
export async function deleteUserVerificationTokens(userId: string) {
  await db
    .delete(emailVerificationTokens)
    .where(eq(emailVerificationTokens.userId, userId));
}

export async function findValidVerificationToken(tokenHash: string) {
  const row = await db.query.emailVerificationTokens.findFirst({
    where: and(
      eq(emailVerificationTokens.tokenHash, tokenHash),
      isNull(emailVerificationTokens.usedAt),
      gt(emailVerificationTokens.expiresAt, new Date())
    ),
  });
  return row ?? null;
}

export async function markVerificationTokenUsed(id: string) {
  await db
    .update(emailVerificationTokens)
    .set({ usedAt: new Date() })
    .where(eq(emailVerificationTokens.id, id));
}

export async function markEmailVerified(userId: string) {
  await db
    .update(users)
    .set({ emailVerifiedAt: new Date() })
    .where(eq(users.id, userId));
}
