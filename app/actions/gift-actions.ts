"use server";

import { revalidatePath } from "next/cache";
import { getSessionAdminId } from "@/lib/auth/session";
import {
  createGift,
  updateGift,
  deleteGift,
  getGiftById,
  registerContribution,
} from "@/lib/repositories/gifts";
import { getLegacySiteId } from "@/lib/repositories/sites";
import { parsePriceToCents } from "@/lib/format";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

async function requireAdminSession() {
  const adminId = await getSessionAdminId();
  if (!adminId) {
    throw new Error("Unauthorized");
  }
}

function parseGiftFormData(formData: FormData) {
  const category = formData.get("category")?.toString().trim();
  const name = formData.get("name")?.toString().trim();
  const priceRaw = formData.get("price")?.toString().trim() ?? "";

  if (!category) throw new Error("Category is required");
  if (!name) throw new Error("Name is required");

  const priceCents = priceRaw ? parsePriceToCents(priceRaw) : null;
  if (priceRaw && priceCents === null) {
    throw new Error("Invalid price");
  }

  return { category, name, priceCents };
}

export async function createGiftAction(formData: FormData) {
  await requireAdminSession();
  const siteId = await getLegacySiteId();
  const gift = await createGift(siteId, parseGiftFormData(formData));
  revalidatePath("/presentes");
  revalidatePath("/admin/presentes");
  return gift;
}

export async function updateGiftAction(giftId: string, formData: FormData) {
  await requireAdminSession();
  const siteId = await getLegacySiteId();
  const gift = await updateGift(siteId, giftId, parseGiftFormData(formData));
  revalidatePath("/presentes");
  revalidatePath("/admin/presentes");
  return gift;
}

export async function deleteGiftAction(giftId: string) {
  await requireAdminSession();
  const siteId = await getLegacySiteId();
  await deleteGift(siteId, giftId);
  revalidatePath("/presentes");
  revalidatePath("/admin/presentes");
}

/** Ação pública: convidado registra que enviou um Pix (identificação opcional). */
export async function registerContributionAction({
  giftId,
  guestName,
}: {
  giftId: string;
  guestName: string;
}) {
  const ip = await getClientIp();
  const { allowed } = await checkRateLimit(`contrib:${ip}`, 20);
  if (!allowed) {
    throw new Error("Muitas tentativas. Aguarde alguns minutos.");
  }

  const siteId = await getLegacySiteId();
  const gift = await getGiftById(siteId, giftId);
  if (!gift) {
    throw new Error("Gift not found");
  }

  const trimmedName = guestName.trim().slice(0, 120);

  const contribution = await registerContribution({
    giftId: gift.id,
    giftName: gift.name,
    guestName: trimmedName || null,
  });
  revalidatePath("/admin/presentes");
  return contribution;
}
