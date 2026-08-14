import { and, asc, eq, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db/client";
import { sitePhotos } from "@/lib/db/schema";
import type { PackageTier } from "@/lib/packages";

// TODA consulta aqui é escopada por siteId — mesma regra dos presentes:
// foto de um casal não pode vazar para o site de outro.
// Ver docs/sdd-geracao-automatica.md §1.2.

/**
 * Onde a foto entra no molde. Vocabulário compartilhado com as seções, mas
 * guardado como texto: molde novo pode inventar slot sem migração.
 *
 * `album` são as fotos DA FESTA, que só existem depois do casamento. Ele
 * ficou de fora enquanto a seção era só um estado de espera; agora que o casal
 * classifica cada foto por momento (entrada dos noivos, votos, saída...), o
 * álbum precisa receber upload como qualquer outro slot.
 */
export const PHOTO_SLOTS = ["cover", "story", "gallery", "album"] as const;
export type PhotoSlot = (typeof PHOTO_SLOTS)[number];

export function isPhotoSlot(value: string): value is PhotoSlot {
  return (PHOTO_SLOTS as readonly string[]).includes(value);
}

/** Quantas fotos cada slot comporta no desenho das seções. */
export const SLOT_CAPACITY: Record<PhotoSlot, number> = {
  cover: 1, // a foto principal do casal
  story: 1, // a foto que acompanha a história
  gallery: 12, // a grade de momentos
  // O álbum é o acervo da festa, não uma vitrine: cabe muito mais foto, e é
  // ele que justifica o pacote Para Sempre. O teto por PACOTE abaixo continua
  // valendo e é o que de fato limita.
  album: 120,
};

export const SLOT_LABEL: Record<PhotoSlot, string> = {
  cover: "Foto principal",
  story: "A nossa história",
  gallery: "Galeria",
  album: "Álbum da festa",
};

/**
 * Teto de fotos por pacote. Não é limitação técnica — é o que separa os
 * planos, junto com as seções que cada um libera.
 */
const TIER_PHOTO_LIMIT: Record<PackageTier, number> = {
  convite: 5,
  site: 15,
  "para-sempre": 40,
};

export function photoLimitForTier(tier: PackageTier): number {
  return TIER_PHOTO_LIMIT[tier];
}

export type SitePhotoRow = typeof sitePhotos.$inferSelect;

/**
 * Fotos do site, em cache.
 *
 * Mesmo desenho da lista de presentes: o caminho quente é o convidado
 * abrindo o site, e a foto só muda quando o casal mexe — e aí a action
 * chama `updateTag('site-photos:<siteId>')`.
 */
export async function listSitePhotos(siteId: string): Promise<SitePhotoRow[]> {
  "use cache";
  cacheTag(`site-photos:${siteId}`);
  cacheLife("days");

  return db
    .select()
    .from(sitePhotos)
    .where(eq(sitePhotos.siteId, siteId))
    .orderBy(asc(sitePhotos.slot), asc(sitePhotos.position), asc(sitePhotos.createdAt));
}

/**
 * Mesma lista, sem cache — para as telas do casal, que precisam ver a
 * própria mudança na hora (e onde não há volume que justifique cache).
 */
export async function listSitePhotosFresh(siteId: string): Promise<SitePhotoRow[]> {
  return db
    .select()
    .from(sitePhotos)
    .where(eq(sitePhotos.siteId, siteId))
    .orderBy(asc(sitePhotos.slot), asc(sitePhotos.position), asc(sitePhotos.createdAt));
}

/** Pega a foto de um slot pela posição. Índice fora da lista devolve undefined. */
export function photoAt(
  photos: SitePhotoRow[],
  slot: PhotoSlot,
  index = 0
): SitePhotoRow | undefined {
  return photos.filter((p) => p.slot === slot)[index];
}

export async function countSitePhotos(siteId: string): Promise<number> {
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(sitePhotos)
    .where(eq(sitePhotos.siteId, siteId));
  return total;
}

export async function countSlotPhotos(
  siteId: string,
  slot: PhotoSlot
): Promise<number> {
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(sitePhotos)
    .where(and(eq(sitePhotos.siteId, siteId), eq(sitePhotos.slot, slot)));
  return total;
}

export type NewSitePhoto = {
  slot: PhotoSlot;
  storagePath: string;
  contentType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  blurDataUrl: string | null;
  alt: string | null;
  originalName: string | null;
};

export async function createSitePhoto(siteId: string, input: NewSitePhoto) {
  const [{ maxPosition }] = await db
    .select({
      maxPosition: sql<number>`coalesce(max(${sitePhotos.position}), -1)`,
    })
    .from(sitePhotos)
    .where(and(eq(sitePhotos.siteId, siteId), eq(sitePhotos.slot, input.slot)));

  const [photo] = await db
    .insert(sitePhotos)
    .values({ ...input, siteId, position: maxPosition + 1 })
    .returning();
  return photo;
}

export async function getSitePhotoById(photoId: string) {
  const [photo] = await db
    .select()
    .from(sitePhotos)
    .where(eq(sitePhotos.id, photoId));
  return photo ?? null;
}

/** Apaga a linha e devolve o caminho no Storage, para o objeto sair junto. */
/**
 * Classifica uma foto no álbum. `null` tira a categoria.
 *
 * O `siteId` entra no WHERE junto com o id da foto — não é redundância: sem
 * ele, quem soubesse o id de uma foto de outro casal poderia reclassificá-la.
 * É a mesma trava do `deleteSitePhoto` logo abaixo, e a regra vale para toda
 * consulta pública deste projeto (§1.2 do SDD).
 */
export async function setSitePhotoCategory(
  siteId: string,
  photoId: string,
  category: string | null
): Promise<boolean> {
  const [alterada] = await db
    .update(sitePhotos)
    .set({ category })
    .where(and(eq(sitePhotos.id, photoId), eq(sitePhotos.siteId, siteId)))
    .returning({ id: sitePhotos.id });
  return Boolean(alterada);
}

export async function deleteSitePhoto(
  siteId: string,
  photoId: string
): Promise<string | null> {
  const [apagada] = await db
    .delete(sitePhotos)
    .where(and(eq(sitePhotos.id, photoId), eq(sitePhotos.siteId, siteId)))
    .returning({ storagePath: sitePhotos.storagePath });
  return apagada?.storagePath ?? null;
}
