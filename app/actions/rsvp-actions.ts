"use server";

import { revalidatePath, updateTag } from "next/cache";
import { getGroupBySlug } from "@/lib/repositories/groups";
import { updateGuestRsvp } from "@/lib/repositories/guests";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import type { rsvpStatusEnum } from "@/lib/db/schema";

type RsvpStatus = (typeof rsvpStatusEnum.enumValues)[number];

/**
 * slug vem pré-preso via .bind() na página (server component), então o
 * cliente só controla guestId/status — e o guestId é validado contra o
 * grupo do slug antes de qualquer atualização.
 */
export async function submitRsvpAction(
  slug: string,
  guestId: string,
  status: RsvpStatus
) {
  const ip = await getClientIp();
  const { allowed } = await checkRateLimit(`rsvp:${ip}`, 20);
  if (!allowed) throw new Error("Muitas tentativas. Aguarde alguns minutos.");

  const group = await getGroupBySlug(slug);
  if (!group) throw new Error("Convite não encontrado");

  const updated = await updateGuestRsvp(group.id, guestId, status);
  // updateTag (não revalidateTag): o convidado tem que ver a própria
  // confirmação imediatamente, não uma versão stale.
  updateTag(`group:${slug}`);
  revalidatePath("/rsvp", "layout");
  return updated;
}
