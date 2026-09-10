"use server";

import crypto from "crypto";
import { revalidatePath, updateTag } from "next/cache";
import { getSessionAdminId } from "@/lib/auth/session";
import {
  createGift,
  updateGift,
  deleteGift,
  getGiftById,
  registerContribution,
  setGiftPhoto,
  deleteGiftPhoto,
  getGiftPhotoByGiftId,
} from "@/lib/repositories/gifts";
import { getLegacySiteId } from "@/lib/repositories/sites";
import { parsePriceToCents } from "@/lib/format";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_PHOTO_BYTES,
  createSignedUploadUrl,
  deleteObject,
  isStorageEnabled,
  verifyStoredImage,
} from "@/lib/storage/supabase";

async function requireAdminSession() {
  const adminId = await getSessionAdminId();
  if (!adminId) {
    throw new Error("Unauthorized");
  }
}

function parseGiftFormData(formData: FormData) {
  const category = formData.get("category")?.toString().trim();
  const name = formData.get("name")?.toString().trim();
  const descriptionRaw = formData.get("description")?.toString().trim() ?? "";
  const priceRaw = formData.get("price")?.toString().trim() ?? "";

  if (!category) throw new Error("Category is required");
  if (!name) throw new Error("Name is required");

  const priceCents = priceRaw ? parsePriceToCents(priceRaw) : null;
  if (priceRaw && priceCents === null) {
    throw new Error("Invalid price");
  }

  return {
    category,
    name,
    description: descriptionRaw || null,
    priceCents,
  };
}

export async function createGiftAction(formData: FormData) {
  await requireAdminSession();
  const siteId = await getLegacySiteId();
  const gift = await createGift(siteId, parseGiftFormData(formData));
  // updateTag (nao revalidateTag): o admin precisa ver a propria mudanca
  // imediatamente, nao uma versao stale.
  updateTag(`gifts:${siteId}`);
  revalidatePath("/presentes");
  revalidatePath("/admin/presentes");
  return gift;
}

export async function updateGiftAction(giftId: string, formData: FormData) {
  await requireAdminSession();
  const siteId = await getLegacySiteId();
  const gift = await updateGift(siteId, giftId, parseGiftFormData(formData));
  updateTag(`gifts:${siteId}`);
  revalidatePath("/presentes");
  revalidatePath("/admin/presentes");
  return gift;
}

export async function deleteGiftAction(giftId: string) {
  await requireAdminSession();
  const siteId = await getLegacySiteId();

  // A foto sai do Storage antes do presente: `gift_photos.gift_id` é ON
  // DELETE CASCADE, a linha some sozinha — mas o objeto no bucket não.
  const foto = await getGiftPhotoByGiftId(giftId);
  if (foto) {
    await deleteObject(foto.storagePath).catch((error) => {
      console.error("[fotos] objeto órfão no bucket:", foto.storagePath, error);
    });
  }

  await deleteGift(siteId, giftId);
  updateTag(`gifts:${siteId}`);
  updateTag(`gift-photos:${siteId}`);
  revalidatePath("/presentes");
  revalidatePath("/admin/presentes");
}

const EXTENSAO: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type GiftPhotoActionError = { error: string };

/** Pede uma URL assinada para subir a foto de um presente específico. */
export async function requestGiftPhotoUploadAction(input: {
  giftId: string;
  contentType: string;
  sizeBytes: number;
}): Promise<GiftPhotoActionError | { uploadUrl: string; storagePath: string }> {
  await requireAdminSession();

  if (!isStorageEnabled()) {
    return { error: "O envio de fotos ainda não está configurado." };
  }

  const siteId = await getLegacySiteId();
  const gift = await getGiftById(siteId, input.giftId);
  if (!gift) return { error: "Presente não encontrado." };

  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(input.contentType)) {
    return { error: "Formato não aceito. Use JPG, PNG ou WebP." };
  }
  if (!Number.isFinite(input.sizeBytes) || input.sizeBytes <= 0) {
    return { error: "Mande uma foto em JPG, PNG ou WebP." };
  }
  if (input.sizeBytes > MAX_PHOTO_BYTES) {
    return { error: "A foto ficou grande demais mesmo depois de comprimida." };
  }

  // Prefixo "gifts/" para não colidir com os caminhos de site_photos, que
  // começam por siteId — mesmo bucket (site-photos), pastas diferentes.
  const storagePath = `gifts/${gift.id}/${crypto.randomUUID()}.${EXTENSAO[input.contentType]}`;

  try {
    const uploadUrl = await createSignedUploadUrl(storagePath);
    return { uploadUrl, storagePath };
  } catch (error) {
    console.error("[fotos] falha ao assinar upload de presente:", error);
    return { error: "Não consegui preparar o envio. Tente de novo." };
  }
}

/** Confirma o upload e substitui a foto anterior do presente, se houver. */
export async function confirmGiftPhotoUploadAction(input: {
  giftId: string;
  storagePath: string;
  width: number | null;
  height: number | null;
  blurDataUrl: string | null;
}): Promise<GiftPhotoActionError | { photoId: string }> {
  await requireAdminSession();

  const siteId = await getLegacySiteId();
  const gift = await getGiftById(siteId, input.giftId);
  if (!gift) return { error: "Presente não encontrado." };

  if (!input.storagePath.startsWith(`gifts/${gift.id}/`)) {
    return { error: "Arquivo não confere com o presente." };
  }

  const conferido = await verifyStoredImage(input.storagePath);
  if (!conferido.ok) {
    await deleteObject(input.storagePath).catch(() => {});
    return { error: "O arquivo enviado não é uma imagem válida." };
  }

  // Linha antiga sai (e o objeto dela, do bucket) antes da nova entrar — um
  // presente tem no máximo uma foto, e a troca não deve deixar lixo órfão.
  const antiga = await getGiftPhotoByGiftId(gift.id);
  if (antiga) {
    await deleteGiftPhoto(gift.id);
    await deleteObject(antiga.storagePath).catch((error) => {
      console.error("[fotos] objeto órfão no bucket:", antiga.storagePath, error);
    });
  }

  const foto = await setGiftPhoto({
    giftId: gift.id,
    storagePath: input.storagePath,
    contentType: conferido.detectedType!,
    sizeBytes: conferido.sizeBytes ?? 0,
    width: input.width,
    height: input.height,
    blurDataUrl: input.blurDataUrl?.slice(0, 4000) ?? null,
  });

  updateTag(`gift-photos:${siteId}`);
  revalidatePath("/presentes");
  revalidatePath("/admin/presentes");
  return { photoId: foto.id };
}

export async function deleteGiftPhotoAction(
  giftId: string
): Promise<GiftPhotoActionError | { deleted: true }> {
  await requireAdminSession();

  const siteId = await getLegacySiteId();
  const gift = await getGiftById(siteId, giftId);
  if (!gift) return { error: "Presente não encontrado." };

  const storagePath = await deleteGiftPhoto(giftId);
  if (!storagePath) return { error: "Este presente não tem foto." };

  await deleteObject(storagePath).catch((error) => {
    console.error("[fotos] objeto órfão no bucket:", storagePath, error);
  });

  updateTag(`gift-photos:${siteId}`);
  revalidatePath("/presentes");
  revalidatePath("/admin/presentes");
  return { deleted: true };
}

/**
 * Ação PÚBLICA: o convidado avisa que enviou o Pix (identificar-se é opcional).
 *
 * ── Por que ela recebe `siteId` ────────────────────────────────────────────
 *
 * Ela mora neste arquivo, que é do ADMIN e do casamento LEGADO — e por isso
 * resolvia o site com `getLegacySiteId()`, como as vizinhas. Só que as
 * vizinhas são do admin cuidando de UM casamento, e esta roda no site de
 * QUALQUER casal.
 *
 * O efeito era mudo e caro: no site de um casal de verdade, `getGiftById` era
 * chamado com o id do site legado, não achava o presente, e a action lançava
 * "Gift not found". O convidado que acabou de mandar R$ 180 por Pix clicava em
 * "Já fiz o Pix" e não acontecia nada — nenhuma confirmação, nenhum erro. O
 * casal nunca ficava sabendo quem deu o presente, e a cota continuava
 * aparecendo como disponível para o próximo convidado.
 *
 * Resquício de antes da multi-tenancy, o mesmo do `createGroupAction`. O
 * `siteId` já viajava do `GiftGrid` até o modal; faltava chegar aqui.
 */
export async function registerContributionAction({
  giftId,
  guestName,
  siteId,
}: {
  giftId: string;
  guestName: string;
  siteId: string;
}) {
  const ip = await getClientIp();
  const { allowed } = await checkRateLimit(`contrib:${ip}`, 20);
  if (!allowed) {
    throw new Error("Muitas tentativas. Aguarde alguns minutos.");
  }

  const gift = await getGiftById(siteId, giftId);
  if (!gift) {
    // Presente de outro site, ou id que não existe. A mensagem é a mesma nos
    // dois casos: quem sonda id alheio não aprende nada com a resposta.
    throw new Error("Presente não encontrado.");
  }

  const trimmedName = guestName.trim().slice(0, 120);

  const contribution = await registerContribution({
    giftId: gift.id,
    giftName: gift.name,
    guestName: trimmedName || null,
  });
  // "já presenteado" no grid vem desta tag — sem invalidar, o convidado
  // seguinte veria o card do jeito que estava antes desta contribuição.
  updateTag(`gift-contributions:${siteId}`);
  revalidatePath("/presentes");
  revalidatePath("/admin/presentes");
  return contribution;
}
