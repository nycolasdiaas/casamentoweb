"use server";

import { revalidatePath } from "next/cache";
import { updateGuestRsvp } from "@/lib/repositories/guests";
import type { rsvpStatusEnum } from "@/lib/db/schema";

type RsvpStatus = (typeof rsvpStatusEnum.enumValues)[number];

export async function submitRsvpAction(guestId: string, status: RsvpStatus) {
  const updated = await updateGuestRsvp(guestId, status);
  revalidatePath("/rsvp", "layout");
  return updated;
}
