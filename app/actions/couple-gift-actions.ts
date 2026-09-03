"use server";

import crypto from "crypto";
import { revalidatePath, updateTag } from "next/cache";
import { getSessionUserId } from "@/lib/auth/userSession";
import { getSiteOwnedByUser } from "@/lib/repositories/sites";
import {
  createGift,
  updateGift,
  deleteGift,
  getGiftById,
  setGiftPhoto,
  deleteGiftPhoto,
  getGiftPhotoByGiftId,
} from "@/lib/repositories/gifts";
import { parsePriceToCents } from "@/lib/format";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_PHOTO_BYTES,
  createSignedUploadUrl,
  deleteObject,
  isStorageEnabled,
  verifyStoredImage,
} from "@/lib/storage/supabase";

// Lista de presentes editável PELO CASAL.
//
// As ações em `gift-actions.ts` são do admin e vivem presas ao site legado
// (`getLegacySiteId`). Reaproveitá-las daria ao casal a lista de outro
// casamento — o mesmo vazamento entre clientes que a Fase 0 corrigiu.
// Aqui o escopo vem da POSSE do site, conferida a cada chamada.

export type GiftActionResult =
  | { error: string }
  | { saved: true; message: string }
  | undefined;

type Site = NonNullable<Awaited<ReturnType<typeof getSiteOwnedByUser>>>;

async function siteDoCasal(
  formData: FormData
): Promise<{ error: string } | { site: Site }> {
  const userId = await getSessionUserId();
  if (!userId) return { error: "Entrem na conta para continuar." };

  const siteId = formData.get("siteId")?.toString() ?? "";
  if (!siteId) return { error: "Site não informado." };

  // Mesma resposta para "não existe" e "não é seu": quem sonda ids alheios
  // não aprende nada com o erro.
  const site = await getSiteOwnedByUser(siteId, userId);
  if (!site) return { error: "Site não encontrado." };
  if (site.status === "archived") {
    return { error: "Este site está arquivado. Fale com a gente para reabrir." };
  }

  return { site };
}

const LIMITE_NOME = 120;
const LIMITE_CATEGORIA = 60;
const LIMITE_DESCRICAO = 280;

function parseCota(formData: FormData):
  | { error: string }
  | {
      value: {
        category: string;
        name: string;
        description: string | null;
        priceCents: number | null;
        quantity: number | null;
      };
    } {
  const name = formData.get("name")?.toString().trim() ?? "";
  const category = formData.get("category")?.toString().trim() ?? "";
  const descriptionRaw = formData.get("description")?.toString().trim() ?? "";
  const priceRaw = formData.get("price")?.toString().trim() ?? "";

  if (!name) return { error: "Dê um nome para a cota." };
  if (name.length > LIMITE_NOME) {
    return { error: `O nome passou de ${LIMITE_NOME} caracteres.` };
  }
  if (!category) return { error: "Escolham ou escrevam uma categoria." };
  if (category.length > LIMITE_CATEGORIA) {
    return { error: `A categoria passou de ${LIMITE_CATEGORIA} caracteres.` };
  }
  if (descriptionRaw.length > LIMITE_DESCRICAO) {
    return { error: `A descrição passou de ${LIMITE_DESCRICAO} caracteres.` };
  }

  // Preço vazio é intencional e vira "você decide" no site — o convidado
  // escolhe quanto dar, e o BR Code sai sem o campo de valor.
  const priceCents = priceRaw ? parsePriceToCents(priceRaw) : null;
  if (priceRaw && priceCents === null) {
    return { error: "Escreva o preço em números, como 180 ou 180,00." };
  }
  if (priceCents !== null && priceCents <= 0) {
    return { error: "O preço precisa ser maior que zero — ou deixem em branco." };
  }

  /* QUANTIDADE VAZIA É "SEM TETO", e é o padrão.
     A prancha desenha "12 de 20 compradas" com barra, mas obrigar o casal a
     escolher um número para toda cota acrescentaria uma decisão onde ele só
     queria escrever "lua de mel" — e a regra §2.3 do produto é o contrário
     disso. Quem quiser limitar, limita; quem não quiser, a cota aceita quantas
     vierem e a barra nem aparece. */
  const quantityRaw = formData.get("quantity")?.toString().trim() ?? "";
  let quantity: number | null = null;
  if (quantityRaw) {
    const n = Number(quantityRaw);
    if (!Number.isInteger(n) || n < 1) {
      return { error: "A quantidade de cotas precisa ser um número inteiro maior que zero — ou deixem em branco." };
    }
    if (n > 999) {
      return { error: "São no máximo 999 cotas por presente." };
    }
    quantity = n;
  }

  return {
    value: {
      category,
      name,
      description: descriptionRaw || null,
      priceCents,
      quantity,
    },
  };
}

/**
 * Derruba o cache da lista e redesenha a tela do casal.
 *
 * `updateTag` na tag da lista (read-your-own-writes, o convidado nunca vê
 * versão velha) E `revalidatePath` no painel, que lê o banco direto e por
 * isso não é alcançado por tag nenhuma.
 */
function derrubarCache(siteId: string) {
  updateTag(`gifts:${siteId}`);
  updateTag(`gift-photos:${siteId}`);
  updateTag(`gift-contributions:${siteId}`);
  revalidatePath("/conta/pedidos/[id]/presentes", "page");
}

export async function criarCotaAction(
  _prev: GiftActionResult,
  formData: FormData
): Promise<GiftActionResult> {
  const dono = await siteDoCasal(formData);
  if ("error" in dono) return { error: dono.error };

  const parsed = parseCota(formData);
  if ("error" in parsed) return { error: parsed.error };

  await createGift(dono.site.id, parsed.value);
  derrubarCache(dono.site.id);
  return { saved: true, message: "Cota criada ✓" };
}

export async function editarCotaAction(
  _prev: GiftActionResult,
  formData: FormData
): Promise<GiftActionResult> {
  const dono = await siteDoCasal(formData);
  if ("error" in dono) return { error: dono.error };

  const giftId = formData.get("giftId")?.toString() ?? "";
  if (!giftId) return { error: "Cota não informada." };

  const parsed = parseCota(formData);
  if ("error" in parsed) return { error: parsed.error };

  // `updateGift` exige giftId E siteId: cota de outro casal não é encontrada.
  const cota = await updateGift(dono.site.id, giftId, parsed.value);
  if (!cota) return { error: "Essa cota não existe nesta lista." };

  derrubarCache(dono.site.id);
  return { saved: true, message: "Cota atualizada ✓" };
}

export async function apagarCotaAction(
  _prev: GiftActionResult,
  formData: FormData
): Promise<GiftActionResult> {
  const dono = await siteDoCasal(formData);
  if ("error" in dono) return { error: dono.error };

  const giftId = formData.get("giftId")?.toString() ?? "";
  if (!giftId) return { error: "Cota não informada." };

  // A foto sai do Storage antes da cota: `gift_photos.gift_id` é ON DELETE
  // CASCADE, então a LINHA some sozinha quando a cota é apagada — mas o
  // objeto no bucket não, e viraria lixo órfão que nada mais aponta.
  const foto = await getGiftPhotoByGiftId(giftId);
  if (foto) {
    await deleteObject(foto.storagePath).catch((error) => {
      console.error("[fotos] objeto órfão no bucket:", foto.storagePath, error);
    });
  }

  // Apagar a cota NÃO apaga quem já presenteou: `gift_contributions` guarda
  // `giftName` em texto justamente para a contribuição sobreviver à cota.
  await deleteGift(dono.site.id, giftId);
  derrubarCache(dono.site.id);
  return { saved: true, message: "Cota removida ✓" };
}

const EXTENSAO: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type CotaPhotoActionError = { error: string };

/** Pede uma URL assinada para subir a foto de uma cota do próprio site. */
export async function requestCotaPhotoUploadAction(input: {
  siteId: string;
  giftId: string;
  contentType: string;
  sizeBytes: number;
}): Promise<CotaPhotoActionError | { uploadUrl: string; storagePath: string }> {
  const userId = await getSessionUserId();
  if (!userId) return { error: "Entrem na conta para continuar." };

  const site = await getSiteOwnedByUser(input.siteId, userId);
  if (!site) return { error: "Site não encontrado." };

  if (!isStorageEnabled()) {
    return { error: "O envio de fotos ainda não está configurado." };
  }

  const gift = await getGiftById(site.id, input.giftId);
  if (!gift) return { error: "Cota não encontrada." };

  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(input.contentType)) {
    return { error: "Formato não aceito. Use JPG, PNG ou WebP." };
  }
  if (!Number.isFinite(input.sizeBytes) || input.sizeBytes <= 0) {
    return { error: "Mande uma foto em JPG, PNG ou WebP." };
  }
  if (input.sizeBytes > MAX_PHOTO_BYTES) {
    return { error: "A foto ficou grande demais mesmo depois de comprimida." };
  }

  const storagePath = `gifts/${gift.id}/${crypto.randomUUID()}.${EXTENSAO[input.contentType]}`;

  try {
    const uploadUrl = await createSignedUploadUrl(storagePath);
    return { uploadUrl, storagePath };
  } catch (error) {
    console.error("[fotos] falha ao assinar upload de cota:", error);
    return { error: "Não consegui preparar o envio. Tente de novo." };
  }
}

/** Confirma o upload e substitui a foto anterior da cota, se houver. */
export async function confirmCotaPhotoUploadAction(input: {
  siteId: string;
  giftId: string;
  storagePath: string;
  width: number | null;
  height: number | null;
  blurDataUrl: string | null;
}): Promise<CotaPhotoActionError | { photoId: string }> {
  const userId = await getSessionUserId();
  if (!userId) return { error: "Entrem na conta para continuar." };

  const site = await getSiteOwnedByUser(input.siteId, userId);
  if (!site) return { error: "Site não encontrado." };

  const gift = await getGiftById(site.id, input.giftId);
  if (!gift) return { error: "Cota não encontrada." };

  if (!input.storagePath.startsWith(`gifts/${gift.id}/`)) {
    return { error: "Arquivo não confere com a cota." };
  }

  const conferido = await verifyStoredImage(input.storagePath);
  if (!conferido.ok) {
    await deleteObject(input.storagePath).catch(() => {});
    return { error: "O arquivo enviado não é uma imagem válida." };
  }

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

  derrubarCache(site.id);
  return { photoId: foto.id };
}

export async function deleteCotaPhotoAction(input: {
  siteId: string;
  giftId: string;
}): Promise<CotaPhotoActionError | { deleted: true }> {
  const userId = await getSessionUserId();
  if (!userId) return { error: "Entrem na conta para continuar." };

  const site = await getSiteOwnedByUser(input.siteId, userId);
  if (!site) return { error: "Site não encontrado." };

  const gift = await getGiftById(site.id, input.giftId);
  if (!gift) return { error: "Cota não encontrada." };

  const storagePath = await deleteGiftPhoto(input.giftId);
  if (!storagePath) return { error: "Esta cota não tem foto." };

  await deleteObject(storagePath).catch((error) => {
    console.error("[fotos] objeto órfão no bucket:", storagePath, error);
  });

  derrubarCache(site.id);
  return { deleted: true };
}
