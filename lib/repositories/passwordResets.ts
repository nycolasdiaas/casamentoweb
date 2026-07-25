import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { passwordResetTokens } from "@/lib/db/schema";

export async function createResetToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date
) {
  const [row] = await db
    .insert(passwordResetTokens)
    .values({ userId, tokenHash, expiresAt })
    .returning();
  return row;
}

/** Remove tokens anteriores do casal (só um link válido por vez). */
export async function deleteUserResetTokens(userId: string) {
  await db
    .delete(passwordResetTokens)
    .where(eq(passwordResetTokens.userId, userId));
}

/** Token não usado e não expirado, ou null. */
export async function findValidResetToken(tokenHash: string) {
  const row = await db.query.passwordResetTokens.findFirst({
    where: and(
      eq(passwordResetTokens.tokenHash, tokenHash),
      isNull(passwordResetTokens.usedAt),
      gt(passwordResetTokens.expiresAt, new Date())
    ),
  });
  return row ?? null;
}

export async function markResetTokenUsed(id: string) {
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, id));
}
