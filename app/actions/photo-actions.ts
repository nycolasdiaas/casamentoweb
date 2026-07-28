"use server";

import crypto from "crypto";
import { revalidatePath, updateTag } from "next/cache";
import { getSessionUserId } from "@/lib/auth/userSession";
import { getSiteOwnedByUser } from "@/lib/repositories/sites";
import {
  createSitePhoto,
  countSitePhotos,
  countSlotPhotos,
  deleteSitePhoto,
  isPhotoSlot,
  photoLimitForTier,
  SLOT_CAPACITY,
  type PhotoSlot,
} from "@/lib/repositories/sitePhotos";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_PHOTO_BYTES,
  createSignedUploadUrl,
  deleteObject,
  isStorageEnabled,
  verifyStoredImage,
} from "@/lib/storage/supabase";
import type { PackageTier } from "@/lib/packages";

// Fotos do casal: pedir upload, confirmar, apagar.
//
// O arquivo vai do browser DIRETO para o Storage, por URL assinada — não
// passa pelo servidor. Estas ações são o portão: decidem se pode subir,
// conferem o que subiu e mandam apagar.
//
// Ver docs/sdd-geracao-automatica.md §8.

export type PhotoActionError = { error: string };

const EXTENSAO: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type OwnedSite = NonNullable<Awaited<ReturnType<typeof getSiteOwnedByUser>>>;

/** Sessão + posse do site. Toda ação aqui começa por isto. */
async function requireOwnedSite(
  siteId: string
): Promise<PhotoActionError | { site: OwnedSite }> {
  const userId = await getSessionUserId();
  if (!userId) return { error: "Faça login para continuar." };

  const site = await getSiteOwnedByUser(siteId, userId);
  // Mesma mensagem para "não existe" e "não é seu": quem sonda ids alheios
  // não aprende nada com a resposta.
  if (!site) return { error: "Site não encontrado." };

  return { site };
}

export async function requestPhotoUploadAction(input: {
  siteId: string;
  slot: string;
  contentType: string;
  sizeBytes: number;
}): Promise<PhotoActionError | { uploadUrl: string; storagePath: string }> {
  if (!isStorageEnabled()) {
    return { error: "O envio de fotos ainda não está configurado." };
  }

  const dono = await requireOwnedSite(input.siteId);
  if ("error" in dono) return dono;
  const { site } = dono;

  if (!isPhotoSlot(input.slot)) return { error: "Lugar de foto inválido." };
  const slot: PhotoSlot = input.slot;

  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(input.contentType)) {
    return { error: "Formato não aceito. Use JPG, PNG ou WebP." };
  }

  if (!Number.isFinite(input.sizeBytes) || input.sizeBytes <= 0) {
    return { error: "Arquivo inválido." };
  }
  if (input.sizeBytes > MAX_PHOTO_BYTES) {
    return { error: "A foto ficou grande demais mesmo depois de comprimida." };
  }

  const limite = photoLimitForTier(site.tier as PackageTier);
  const total = await countSitePhotos(site.id);
  if (total >= limite) {
    return {
      error: `Seu pacote permite ${limite} fotos. Apague uma para subir outra.`,
    };
  }

  const noSlot = await countSlotPhotos(site.id, slot);
  if (noSlot >= SLOT_CAPACITY[slot]) {
    return {
      error:
        SLOT_CAPACITY[slot] === 1
          ? "Este lugar já tem foto. Apague a atual para trocar."
          : `Este lugar comporta ${SLOT_CAPACITY[slot]} fotos.`,
    };
  }

  // O caminho começa pelo siteId: é o que deixa a confirmação provar que o
  // objeto pertence a este site, e não a outro casal.
  const storagePath = `${site.id}/${crypto.randomUUID()}.${EXTENSAO[input.contentType]}`;

  try {
    const uploadUrl = await createSignedUploadUrl(storagePath);
    return { uploadUrl, storagePath };
  } catch (error) {
    console.error("[fotos] falha ao assinar upload:", error);
    return { error: "Não consegui preparar o envio. Tente de novo." };
  }
}

export async function confirmPhotoUploadAction(input: {
  siteId: string;
  slot: string;
  storagePath: string;
  width: number | null;
  height: number | null;
  blurDataUrl: string | null;
  originalName: string | null;
}): Promise<PhotoActionError | { photoId: string }> {
  const dono = await requireOwnedSite(input.siteId);
  if ("error" in dono) return dono;
  const { site } = dono;

  if (!isPhotoSlot(input.slot)) return { error: "Lugar de foto inválido." };
  const slot: PhotoSlot = input.slot;

  // O caminho tem que estar dentro da pasta deste site. Sem isto, um casal
  // poderia confirmar um objeto de outro e passar a exibi-lo como seu.
  if (!input.storagePath.startsWith(`${site.id}/`)) {
    return { error: "Arquivo não confere com o site." };
  }

  // Confere o que REALMENTE subiu: o content-type é palavra de quem envia, e
  // quem envia estava com uma URL assinada na mão.
  const conferido = await verifyStoredImage(input.storagePath);
  if (!conferido.ok) {
    await deleteObject(input.storagePath).catch(() => {});
    return { error: "O arquivo enviado não é uma imagem válida." };
  }

  // Limites de novo: entre pedir e confirmar, outra aba pode ter subido.
  const limite = photoLimitForTier(site.tier as PackageTier);
  if ((await countSitePhotos(site.id)) >= limite) {
    await deleteObject(input.storagePath).catch(() => {});
    return { error: `Seu pacote permite ${limite} fotos.` };
  }
  if ((await countSlotPhotos(site.id, slot)) >= SLOT_CAPACITY[slot]) {
    await deleteObject(input.storagePath).catch(() => {});
    return { error: "Este lugar já está completo." };
  }

  const foto = await createSitePhoto(site.id, {
    slot,
    storagePath: input.storagePath,
    contentType: conferido.detectedType!,
    sizeBytes: conferido.sizeBytes ?? 0,
    width: input.width,
    height: input.height,
    // Cabe no campo e não vale a pena guardar uma miniatura enorme.
    blurDataUrl: input.blurDataUrl?.slice(0, 4000) ?? null,
    alt: null,
    originalName: input.originalName?.slice(0, 200) ?? null,
  });

  invalidarSite(site.id, site.slug);
  return { photoId: foto.id };
}

export async function deletePhotoAction(input: {
  siteId: string;
  photoId: string;
}): Promise<PhotoActionError | { deleted: true }> {
  const dono = await requireOwnedSite(input.siteId);
  if ("error" in dono) return dono;
  const { site } = dono;

  // A linha sai primeiro: é ela que faz a rota /f/<id> devolver 404. Se o
  // objeto sobrar no bucket, é lixo invisível — o contrário (objeto apagado
  // com linha viva) deixaria foto quebrada no site do casal.
  const storagePath = await deleteSitePhoto(site.id, input.photoId);
  if (!storagePath) return { error: "Foto não encontrada." };

  await deleteObject(storagePath).catch((error) => {
    console.error("[fotos] objeto órfão no bucket:", storagePath, error);
  });

  invalidarSite(site.id, site.slug);
  return { deleted: true };
}

/**
 * updateTag (não revalidateTag): o casal precisa ver a própria troca de foto
 * na hora, não a versão em cache — read-your-own-writes.
 */
function invalidarSite(siteId: string, slug: string) {
  updateTag(`site-photos:${siteId}`);
  updateTag(`site-view:${slug}`);
  revalidatePath(`/s/${slug}`);
}
