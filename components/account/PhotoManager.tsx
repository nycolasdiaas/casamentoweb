"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  requestPhotoUploadAction,
  confirmPhotoUploadAction,
  deletePhotoAction,
  setPhotoCategoryAction,
} from "@/app/actions/photo-actions";
import { CATEGORIAS_ALBUM } from "@/lib/site/albumCategories";
import { prepararFoto } from "@/lib/site/prepararFoto";
import { useBrinde } from "@/components/ui/prensa";

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
  category?: string | null;
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
  {
    key: "album",
    label: "Álbum da festa",
    hint:
      "As fotos do dia. Depois de subir, marque o momento de cada uma — é o que faz o álbum contar a história em vez de virar uma pilha.",
    capacity: 120,
    aspect: "aspect-square",
  },
];

export default function PhotoManager({
  siteId,
  photos: iniciais,
  limit,
  slotsPermitidos,
}: {
  siteId: string;
  photos: ManagedPhoto[];
  limit: number;
  /** Chaves de `SLOTS` que o pacote do casal inclui. */
  slotsPermitidos: string[];
}) {
  const [photos, setPhotos] = useState<ManagedPhoto[]>(iniciais);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState<string | null>(null);
  const brinde = useBrinde();
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
    let entraram = 0;
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

        entraram += 1;
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
      /* O brinde só aparece quando ALGUMA foto entrou. É a única confirmação
         que este fluxo tem: a grade muda, mas ninguém garante que o casal
         estava olhando para ela — a barra de envio some e pronto.

         O texto é a fórmula de Voz V4, resultado no passado com ponto final:
         "Suas fotos estão no site.", nunca "Upload realizado com sucesso!".
         No singular ele diz a mesma coisa sem mentir o número. */
      if (entraram > 0) {
        brinde(
          entraram === 1
            ? "Sua foto está no site."
            : "Suas fotos estão no site."
        );
      }
    }
  }
  /**
   * Classifica a foto no álbum.
   *
   * Otimista: a lista muda na hora e só volta atrás se o servidor recusar.
   * Categorizar dezenas de fotos é trabalho repetitivo — esperar uma ida ao
   * banco a cada select transformaria a tarefa num castigo.
   */
  async function categorizar(photoId: string, category: string | null) {
    const antes = photos;
    setPhotos((atuais) =>
      atuais.map((p) => (p.id === photoId ? { ...p, category } : p))
    );
    const res = await setPhotoCategoryAction({ siteId, photoId, category });
    if ("error" in res) {
      setErro(res.error);
      setPhotos(antes);
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
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-(--c-rule) pb-3">
        <span className="meta text-(--c-ink-2)">
          As fotos entram no site na hora
        </span>
        <span className="t-data text-[12.5px] text-(--c-ink-2)">
          {total} de {limit}
        </span>
      </div>

      {erro && (
        <p
          role="alert"
          className="aviso text-(--c-danger)"
        >
          {erro}
        </p>
      )}

      {/* Só os lugares que o pacote inclui.
          Capa, história e galeria estão em todos os pacotes; o álbum é do
          Para Sempre. Antes o álbum aparecia para todo mundo, e o casal do
          Site do Casamento subia as fotos da festa num lugar que o site dele
          nunca renderiza. Filtrar aqui, e não esconder a aba inteira, é o que
          preserva as fotos que ele de fato comprou. */}
      {SLOTS.filter((spec) => slotsPermitidos.includes(spec.key)).map((spec) => {
        const doSlot = photos.filter((p) => p.slot === spec.key);
        const cheio = doSlot.length >= spec.capacity;
        const semCota = total >= limit;

        return (
          <div key={spec.key} className="flex flex-col gap-2.5">
            <div>
              <h3 className="text-sm font-semibold">{spec.label}</h3>
              <p className="text-xs text-(--c-ink-2)">{spec.hint}</p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {doSlot.map((foto) => (
                <figure
                  key={foto.id}
                  className={`group relative overflow-hidden rounded-[3px] border border-(--c-rule) bg-black/5 ${spec.aspect}`}
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

                  {/* O seletor só aparece no ÁLBUM. Capa e galeria têm papel
                      estrutural fixo no molde; categorizar ali não teria onde
                      ser desenhado, e um controle que não faz nada é pior que
                      controle nenhum. */}
                  {spec.key === "album" && (
                    <select
                      value={foto.category ?? ""}
                      onChange={(e) =>
                        categorizar(foto.id, e.target.value || null)
                      }
                      aria-label="Momento do casamento"
                      className="absolute inset-x-1 bottom-1 rounded-md bg-black/70 px-1.5 py-1 text-[10px] text-white outline-none"
                    >
                      <option value="">Sem categoria</option>
                      {CATEGORIAS_ALBUM.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.rotulo}
                        </option>
                      ))}
                    </select>
                  )}
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

      <p className="text-xs text-(--c-ink-2)">
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
        className={`flex h-full w-full flex-col items-center justify-center gap-1 rounded-[3px] border border-dashed text-center transition-colors ${
          arrastando
            ? "border-(--c-ink) bg-(--c-sunken)"
            : "border-(--c-mark)/60 hover:bg-(--c-sunken)/50"
        } disabled:opacity-60`}
      >
        <span className="text-xl leading-none" aria-hidden>
          {busy ? "⏳" : "+"}
        </span>
        <span className="px-1 text-[11px] leading-tight text-(--c-ink-2)">
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
