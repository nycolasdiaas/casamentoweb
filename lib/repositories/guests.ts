import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { guests, rsvpStatusEnum } from "@/lib/db/schema";

type RsvpStatus = (typeof rsvpStatusEnum.enumValues)[number];

export async function updateGuestRsvp(guestId: string, status: RsvpStatus) {
  const [updated] = await db
    .update(guests)
    .set({ rsvpStatus: status, respondedAt: new Date() })
    .where(eq(guests.id, guestId))
    .returning();

  if (!updated) {
    throw new Error(`Guest not found: ${guestId}`);
  }

  return updated;
}
