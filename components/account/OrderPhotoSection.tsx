import PhotoUploader, { type OrderPhotoView } from "./PhotoUploader";
import { listOrderPhotos } from "@/lib/repositories/orderPhotos";
import {
  isStorageConfigured,
  signedPhotoUrl,
  MAX_PHOTO_BYTES,
  MAX_PHOTOS_PER_ORDER,
} from "@/lib/storage";

/**
 * Server component: busca as fotos do pedido e assina as URLs de leitura
 * (o bucket é privado, então nada é acessível por URL fixa) antes de entregar
 * para o uploader, que é client.
 */
export default async function OrderPhotoSection({
  orderId,
}: {
  orderId: string | null;
}) {
  const enabled = isStorageConfigured();

  let photos: OrderPhotoView[] = [];
  if (orderId && enabled) {
    const rows = await listOrderPhotos(orderId);
    photos = await Promise.all(
      rows.map(async (row) => ({
        id: row.id,
        originalName: row.originalName,
        sizeBytes: row.sizeBytes,
        url: await signedPhotoUrl(row.storagePath),
      }))
    );
  }

  return (
    <PhotoUploader
      orderId={orderId}
      photos={photos}
      maxPhotos={MAX_PHOTOS_PER_ORDER}
      maxBytes={MAX_PHOTO_BYTES}
      enabled={enabled}
    />
  );
}
