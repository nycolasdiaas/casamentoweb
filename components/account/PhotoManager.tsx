"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  requestPhotoUploadAction,
  confirmPhotoUploadAction,
  deletePhotoAction,
} from "@/app/actions/photo-actions";

// Painel de fotos do casal.
//
// O arquivo NÃO passa pelo servidor Next: comprimimos aqui, pedimos uma URL
// assinada e enviamos direto ao Storage. Foto de celular tem 4-8 MB; subir
// isso cru gastaria banda dos dois lados e estouraria o limite de corpo das
// server actions.
//
// Ver docs/sdd-geracao-automatica.md §8.

export type ManagedPhoto = {
  id: string;
  slot: string;
  width: number | null;
  height: number | null;
  blurDataUrl: string | null;
};

type SlotSpec = {
  key: string;
  label: string;
  hint: string;
  capacity: number;
  aspect: string;
};

const SLOTS: SlotSpec[] = [
  {
    key: "cover",
    label: "Foto principal",
    hint: "A que abre o site, logo abaixo dos nomes de vocês.",
    capacity: 1,
    aspect: "aspect-[3/4]",
  },
  {
    key: "story",
    label: "A nossa história",
    hint: "Acompanha o texto da história — o pedido, por exemplo.",
    capacity: 1,
    aspect: "aspect-[4/3]",
  },
  {
    key: "gallery",
    label: "Galeria",
    hint: "Os momentos de vocês. Aparecem em grade, na ordem em que subirem.",
    capacity: 12,
    aspect: "aspect-square",
  },
];

/** Alvo de tamanho depois de comprimir. Acima disto a página fica lenta no 4G. */
const ALVO_BYTES = 500 * 1024;
/** Maior lado da imagem enviada. O site tem 480px de largura; 1600 cobre retina e zoom. */
const MAIOR_LADO = 1600;

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Falha ao gerar a imagem"))),
      "image/jpeg",
      quality
    );
  });
}

type Preparada = {
  blob: Blob;
  width: number;
  height: number;
  blurDataUrl: string;
};

/**
 * Redimensiona e comprime no navegador, e já gera a miniatura do blur.
 *
 * `imageOrientation: "from-image"` não é detalhe: sem isso, foto tirada
 * na vertical pelo celular chega deitada — o canvas ignora o EXIF.
 */
async function prepararFoto(file: File): Promise<Preparada> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });

  try {
    const escala = Math.min(1, MAIOR_LADO / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * escala));
    const height = Math.max(1, Math.round(bitmap.height * escala));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Seu navegador não conseguiu preparar a imagem.");
    ctx.drawImage(bitmap, 0, 0, width, height);

    // Vai baixando a qualidade só até caber. Começa alto: foto de casamento
    // com rosto pequeno sofre mais com compressão do que uma paisagem.
    let blob = await toBlob(canvas, 0.85);
    for (const q of [0.75, 0.65, 0.55, 0.45]) {
      if (blob.size <= ALVO_BYTES) break;
      blob = await toBlob(canvas, q);
    }

    // Miniatura de 16px de largura: é o borrão que segura o lugar da foto
    // enquanto ela carrega, embutido no HTML como base64.
    const mini = document.createElement("canvas");
    mini.width = 16;
    mini.height = Math.max(1, Math.round((16 * height) / width));
    mini.getContext("2d")?.drawImage(bitmap, 0, 0, mini.width, mini.height);
    const blurDataUrl = mini.toDataURL("image/jpeg", 0.4);

    return { blob, width, height, blurDataUrl };
  } finally {
    bitmap.close();
  }
}

export default function PhotoManager({
  siteId,
  photos: iniciais,
  limit,
}: {
  siteId: string;
  photos: ManagedPhoto[];
  limit: number;
}) {
  const [photos, setPhotos] = useState<ManagedPhoto[]>(iniciais);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState<string | null>(null);
  const [apagando, setApagando] = useState<string | null>(null);

  const total = photos.length;

  async function enviar(slot: string, files: FileList) {
    setErro(null);

    const spec = SLOTS.find((s) => s.key === slot)!;
    const jaNoSlot = photos.filter((p) => p.slot === slot).length;
    const cabem = Math.min(spec.capacity - jaNoSlot, limit - photos.length);

    if (cabem <= 0) {
      setErro(
        photos.length >= limit
          ? `Seu pacote permite ${limit} fotos. Apague uma para subir outra.`
          : "Este lugar já está completo."
      );
      return;
    }

    const escolhidas = Array.from(files).slice(0, cabem);
    if (escolhidas.length < files.length) {
      setErro(`Enviando as ${escolhidas.length} primeiras — o resto não cabe.`);
    }

    setEnviando(slot);
    try {
      for (const file of escolhidas) {
        const preparada = await prepararFoto(file);

        const pedido = await requestPhotoUploadAction({
          siteId,
          slot,
          contentType: "image/jpeg",
          sizeBytes: preparada.blob.size,
        });
        if ("error" in pedido) {
          setErro(pedido.error);
          break;
        }

        const upload = await fetch(pedido.uploadUrl, {
          method: "PUT",
          headers: { "content-type": "image/jpeg" },
          body: preparada.blob,
        });
        if (!upload.ok) {
          setErro("O envio falhou no meio do caminho. Tente de novo.");
          break;
        }

        const confirmada = await confirmPhotoUploadAction({
          siteId,
          slot,
          storagePath: pedido.storagePath,
          width: preparada.width,
          height: preparada.height,
          blurDataUrl: preparada.blurDataUrl,
          originalName: file.name,
        });
        if ("error" in confirmada) {
          setErro(confirmada.error);
          break;
        }

        setPhotos((atuais) => [
          ...atuais,
          {
            id: confirmada.photoId,
            slot,
            width: preparada.width,
            height: preparada.height,
            blurDataUrl: preparada.blurDataUrl,
          },
        ]);
      }
    } catch (e) {
      console.error("[fotos]", e);
      setErro(
        e instanceof Error && e.message
          ? e.message
          : "Não consegui enviar essa foto. Tente outra."
      );
    } finally {
      setEnviando(null);
    }
  }

  async function apagar(photoId: string) {
    setErro(null);
    setApagando(photoId);
    try {
      const res = await deletePhotoAction({ siteId, photoId });
      if ("error" in res) {
        setErro(res.error);
        return;
      }
      setPhotos((atuais) => atuais.filter((p) => p.id !== photoId));
    } finally {
      setApagando(null);
    }
  }

  return (
    <section className="flex flex-col gap-5 border-t border-(--color-gold)/30 pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight">Fotos do site</h2>
        <span className="text-xs text-(--color-muted)">
          {total} de {limit} fotos
        </span>
      </div>

      <p className="max-w-lg text-sm text-(--color-olive)/70">
        As fotos entram no site na hora. Enquanto vocês não subirem as de
        vocês, o site mostra imagens de exemplo — elas somem assim que a
        primeira foto sobe.
      </p>

      {erro && (
        <p
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {erro}
        </p>
      )}

      {SLOTS.map((spec) => {
        const doSlot = photos.filter((p) => p.slot === spec.key);
        const cheio = doSlot.length >= spec.capacity;
        const semCota = total >= limit;

        return (
          <div key={spec.key} className="flex flex-col gap-2.5">
            <div>
              <h3 className="text-sm font-semibold">{spec.label}</h3>
              <p className="text-xs text-(--color-muted)">{spec.hint}</p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {doSlot.map((foto) => (
                <figure
                  key={foto.id}
                  className={`group relative overflow-hidden rounded-xl border border-(--color-gold)/40 bg-black/5 ${spec.aspect}`}
                >
                  <Image
                    src={`/f/${foto.id}`}
                    alt=""
                    fill
                    sizes="160px"
                    className="object-cover"
                    {...(foto.blurDataUrl
                      ? { placeholder: "blur" as const, blurDataURL: foto.blurDataUrl }
                      : {})}
                  />
                  <button
                    type="button"
                    onClick={() => apagar(foto.id)}
                    disabled={apagando === foto.id}
                    aria-label="Apagar esta foto"
                    className="absolute right-1.5 top-1.5 rounded-full bg-black/60 px-2 py-1 text-xs text-white transition-opacity hover:bg-black/80 disabled:opacity-50"
                  >
                    {apagando === foto.id ? "…" : "✕"}
                  </button>
                </figure>
              ))}

              {!cheio && !semCota && (
                <AddTile
                  aspect={spec.aspect}
                  busy={enviando === spec.key}
                  multiple={spec.capacity > 1}
                  onFiles={(files) => enviar(spec.key, files)}
                />
              )}
            </div>
          </div>
        );
      })}

      <p className="text-xs text-(--color-muted)">
        JPG, PNG ou WebP. As fotos são reduzidas no seu aparelho antes de
        subir, então não precisa se preocupar com o tamanho do arquivo.
      </p>
    </section>
  );
}

function AddTile({
  aspect,
  busy,
  multiple,
  onFiles,
}: {
  aspect: string;
  busy: boolean;
  multiple: boolean;
  onFiles: (files: FileList) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [arrastando, setArrastando] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setArrastando(true);
      }}
      onDragLeave={() => setArrastando(false)}
      onDrop={(e) => {
        e.preventDefault();
        setArrastando(false);
        if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
      }}
      className={aspect}
    >
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className={`flex h-full w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed text-center transition-colors ${
          arrastando
            ? "border-(--color-olive) bg-(--color-blush)"
            : "border-(--color-gold)/60 hover:bg-(--color-blush)/50"
        } disabled:opacity-60`}
      >
        <span className="text-xl leading-none" aria-hidden>
          {busy ? "⏳" : "+"}
        </span>
        <span className="px-1 text-[11px] leading-tight text-(--color-olive)/70">
          {busy ? "enviando…" : multiple ? "adicionar fotos" : "escolher foto"}
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={multiple}
        hidden
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
