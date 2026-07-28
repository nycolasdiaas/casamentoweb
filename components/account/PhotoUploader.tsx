"use client";

import { useActionState, useRef } from "react";
import {
  uploadOrderPhotosAction,
  deleteOrderPhotoAction,
} from "@/app/actions/photo-actions";

export type OrderPhotoView = {
  id: string;
  originalName: string;
  sizeBytes: number;
  url: string | null;
};

function sizeLabel(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function PhotoTile({ photo }: { photo: OrderPhotoView }) {
  const [state, action, pending] = useActionState(
    deleteOrderPhotoAction,
    undefined
  );

  return (
    <li className="relative flex flex-col gap-1">
      <div className="relative aspect-square overflow-hidden rounded-xl border border-(--color-gold)/40 bg-white">
        {photo.url ? (
          // next/image não ajuda aqui: a URL é assinada, expira em 1h e o
          // host do Storage é variável por ambiente. <img> direto é o certo.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo.url}
            alt={photo.originalName}
            loading="lazy"
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-2xl">
            🖼️
          </span>
        )}
        <form action={action} className="absolute top-1.5 right-1.5">
          <input type="hidden" name="photoId" value={photo.id} />
          <button
            type="submit"
            disabled={pending}
            aria-label={`Remover ${photo.originalName}`}
            title="Remover"
            className="flex size-7 items-center justify-center rounded-full bg-black/60 text-xs text-white transition-colors hover:bg-black/80 disabled:opacity-50"
          >
            {pending ? "…" : "✕"}
          </button>
        </form>
      </div>
      <span className="truncate text-[11px] text-(--color-muted)">
        {photo.originalName} · {sizeLabel(photo.sizeBytes)}
      </span>
      {state?.error && (
        <span className="text-[11px] text-red-700">{state.error}</span>
      )}
    </li>
  );
}

/**
 * Envio de fotos direto na plataforma. Substitui o campo "link do Drive":
 * as fotos ficam guardadas com o pedido, não numa pasta de terceiro que pode
 * sumir ou perder permissão no meio da produção.
 */
export default function PhotoUploader({
  orderId,
  photos,
  maxPhotos,
  maxBytes,
  enabled,
}: {
  orderId: string | null;
  photos: OrderPhotoView[];
  maxPhotos: number;
  maxBytes: number;
  enabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, action, pending] = useActionState(
    uploadOrderPhotosAction,
    undefined
  );

  // Sem pedido salvo ainda não existe onde pendurar as fotos.
  if (!orderId) {
    return (
      <div className="rounded-xl border border-dashed border-(--color-gold)/60 bg-white/60 p-5 text-center">
        <p className="text-sm text-(--color-olive)/75">
          Salvem o rascunho primeiro (botão no fim da página) e o espaço para
          subir as fotos aparece aqui.
        </p>
      </div>
    );
  }

  // Storage não configurado (falta SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).
  // Em vez de um aviso vago, aponta o caminho alternativo que existe de fato.
  if (!enabled) {
    return (
      <div className="rounded-xl border border-dashed border-(--color-gold)/60 bg-white/60 p-5 flex flex-col gap-1.5">
        <p className="text-sm font-medium">
          O envio direto de fotos está temporariamente indisponível.
        </p>
        <p className="text-sm text-(--color-olive)/75 leading-relaxed">
          Enquanto isso, coloquem as fotos numa pasta compartilhada (Google
          Drive, Dropbox, iCloud) e colem o link em{" "}
          <strong>&ldquo;Tenho muitas fotos e já estão numa pasta
          compartilhada&rdquo;</strong>, logo abaixo. A gente combina o resto
          com vocês.
        </p>
      </div>
    );
  }

  const remaining = maxPhotos - photos.length;

  return (
    <div className="flex flex-col gap-3">
      {photos.length > 0 && (
        <ul className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {photos.map((photo) => (
            <PhotoTile key={photo.id} photo={photo} />
          ))}
        </ul>
      )}

      <form action={action} className="flex flex-col gap-2">
        <input type="hidden" name="orderId" value={orderId} />
        <label className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-(--color-gold)/60 bg-white p-6 cursor-pointer text-center transition-colors hover:border-(--color-olive) hover:bg-(--color-blush)">
          <span className="text-2xl" aria-hidden>
            📷
          </span>
          <span className="text-sm font-medium">
            {remaining > 0
              ? "Escolher fotos do celular ou computador"
              : "Limite de fotos atingido"}
          </span>
          <span className="text-xs text-(--color-muted)">
            JPG, PNG, WEBP ou HEIC · até {Math.round(maxBytes / (1024 * 1024))}{" "}
            MB cada · faltam {Math.max(0, remaining)} de {maxPhotos}
          </span>
          <input
            ref={inputRef}
            type="file"
            name="photos"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            multiple
            disabled={remaining <= 0}
            className="sr-only"
            onChange={(event) => {
              // Envia assim que escolhem — sem um segundo clique de "enviar".
              if (event.target.files?.length) {
                event.target.form?.requestSubmit();
              }
            }}
          />
        </label>

        {pending && (
          <p className="text-xs text-(--color-olive)/70">Enviando fotos...</p>
        )}
        {state?.info && !pending && (
          <p className="text-xs text-(--color-olive)">{state.info}</p>
        )}
        {state?.error && !pending && (
          <p className="text-xs text-red-700">{state.error}</p>
        )}
      </form>
    </div>
  );
}
