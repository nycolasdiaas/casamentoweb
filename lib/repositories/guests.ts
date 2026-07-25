import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { guests, rsvpStatusEnum } from "@/lib/db/schema";

type RsvpStatus = (typeof rsvpStatusEnum.enumValues)[number];

/**
 * groupId é exigido (não só guestId) para impedir que alguém responda pelo
 * convite de outra família — ex: um guestId visto/adivinhado em outro
 * link não bate com o groupId da página atual e a atualização é recusada.
 */
export async function updateGuestRsvp(
  groupId: string,
  guestId: string,
  status: RsvpStatus
) {
  const [updated] = await db
    .update(guests)
    .set({ rsvpStatus: status, respondedAt: new Date() })
    .where(and(eq(guests.id, guestId), eq(guests.groupId, groupId)))
    .returning();

  if (!updated) {
    throw new Error(`Guest not found in group: ${guestId}`);
  }

  return updated;
}
