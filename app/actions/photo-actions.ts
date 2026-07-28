"use server";

import { revalidatePath } from "next/cache";
import { getSessionUserId } from "@/lib/auth/userSession";
import { getOrderById } from "@/lib/repositories/orders";
import {
  addOrderPhotos,
  countOrderPhotos,
  deleteOrderPhoto,
  getOrderPhotoById,
  type NewOrderPhoto,
} from "@/lib/repositories/orderPhotos";
import {
  buildStoragePath,
  deletePhoto,
  isAllowedPhotoType,
  isStorageConfigured,
  uploadPhoto,
  MAX_PHOTO_BYTES,
  MAX_PHOTOS_PER_ORDER,
} from "@/lib/storage";

type Result = { error?: string; info?: string } | undefined;

function mb(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

/** O pedido existe, é do casal logado e ainda aceita mudança de material? */
async function requireEditableOrder(orderId: string) {
  const userId = await getSessionUserId();
  if (!userId) return { error: "Entrem na conta primeiro." as const };

  const order = await getOrderById(orderId);
  if (!order || order.userId !== userId) {
    return { error: "Pedido não encontrado." as const };
  }
  // Depois de publicado não faz sentido mexer no material.
  if (order.status === "published") {
    return { error: "Este pedido já está finalizado." as const };
  }
  return { order };
}

export async function uploadOrderPhotosAction(
  _prev: Result,
  formData: FormData
): Promise<Result> {
  const orderId = formData.get("orderId")?.toString() ?? "";
  const guard = await requireEditableOrder(orderId);
  if ("error" in guard) return { error: guard.error };

  if (!isStorageConfigured()) {
    return {
      error:
        "O envio de fotos ainda não está ligado neste ambiente. Avise a equipe.",
    };
  }

  const files = formData
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length === 0) return { error: "Escolham pelo menos uma foto." };

  const already = await countOrderPhotos(orderId);
  const room = MAX_PHOTOS_PER_ORDER - already;
  if (room <= 0) {
    return {
      error: `Vocês já enviaram o máximo de ${MAX_PHOTOS_PER_ORDER} fotos. Apaguem alguma para subir outra.`,
    };
  }
  if (files.length > room) {
    return {
      error: `Cabem mais ${room} foto${room > 1 ? "s" : ""} neste pedido (limite de ${MAX_PHOTOS_PER_ORDER}).`,
    };
  }

  for (const file of files) {
    if (!isAllowedPhotoType(file.type)) {
      return {
        error: `"${file.name}" não é uma imagem suportada. Use JPG, PNG, WEBP ou HEIC.`,
      };
    }
    if (file.size > MAX_PHOTO_BYTES) {
      return {
        error: `"${file.name}" passa de ${mb(MAX_PHOTO_BYTES)}. Mandem uma versão menor.`,
      };
    }
  }

  const saved: NewOrderPhoto[] = [];
  const uploadedPaths: string[] = [];

  try {
    for (const [i, file] of files.entries()) {
      const path = buildStoragePath(orderId, already + i, file.type);
      await uploadPhoto(path, await file.arrayBuffer(), file.type);
      uploadedPaths.push(path);
      saved.push({
        orderId,
        storagePath: path,
        originalName: file.name.slice(0, 180),
        contentType: file.type,
        sizeBytes: file.size,
        position: already + i,
      });
    }
    await addOrderPhotos(saved);
  } catch {
    // Falhou no meio: tira do bucket o que já tinha subido para não deixar
    // arquivo órfão sem linha no banco.
    await Promise.all(uploadedPaths.map((path) => deletePhoto(path)));
    return {
      error: "Não conseguimos guardar as fotos agora. Tentem de novo.",
    };
  }

  revalidatePath(`/conta/pedido/${orderId}`);
  return {
    info: `${files.length} foto${files.length > 1 ? "s enviadas" : " enviada"} ✓`,
  };
}

export async function deleteOrderPhotoAction(
  _prev: Result,
  formData: FormData
): Promise<Result> {
  const photoId = formData.get("photoId")?.toString() ?? "";
  const photo = photoId ? await getOrderPhotoById(photoId) : null;
  if (!photo) return { error: "Foto não encontrada." };

  const guard = await requireEditableOrder(photo.orderId);
  if ("error" in guard) return { error: guard.error };

  await deleteOrderPhoto(photo.id);
  await deletePhoto(photo.storagePath);

  revalidatePath(`/conta/pedido/${photo.orderId}`);
  return { info: "Foto removida." };
}
