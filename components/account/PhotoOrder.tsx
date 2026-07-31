"use client";

import { useActionState } from "react";
import { movePhotoAction } from "@/app/actions/theme-actions";

export type FotoOrdenavel = {
  id: string;
  slot: string;
  slotLabel: string;
  url: string | null;
  primeira: boolean;
  ultima: boolean;
};

function Setas({
  siteId,
  photoId,
  primeira,
  ultima,
}: {
  siteId: string;
  photoId: string;
  primeira: boolean;
  ultima: boolean;
}) {
  // Um estado por direção: assim só a seta clicada mostra "enviando".
  const [, subir, subindo] = useActionState(movePhotoAction, undefined);
  const [, descer, descendo] = useActionState(movePhotoAction, undefined);

  const classe =
    "flex size-6 items-center justify-center rounded-full bg-black/60 text-[11px] text-white transition-colors hover:bg-black/80 disabled:opacity-25";

  return (
    <div className="absolute inset-x-1 bottom-1 flex justify-between">
      <form action={subir}>
        <input type="hidden" name="siteId" value={siteId} />
        <input type="hidden" name="photoId" value={photoId} />
        <input type="hidden" name="direcao" value="up" />
        <button
          type="submit"
          disabled={primeira || subindo}
          aria-label="Mover para antes"
          title="Mover para antes"
          className={classe}
        >
          ←
        </button>
      </form>
      <form action={descer}>
        <input type="hidden" name="siteId" value={siteId} />
        <input type="hidden" name="photoId" value={photoId} />
        <input type="hidden" name="direcao" value="down" />
        <button
          type="submit"
          disabled={ultima || descendo}
          aria-label="Mover para depois"
          title="Mover para depois"
          className={classe}
        >
          →
        </button>
      </form>
    </div>
  );
}

/**
 * Ordem das fotos, agrupada por slot. Mover é só dentro do próprio slot: a
 * capa não vira galeria por acidente, e cada slot tem capacidade própria.
 */
export default function PhotoOrder({
  siteId,
  fotos,
}: {
  siteId: string;
  fotos: FotoOrdenavel[];
}) {
  if (fotos.length === 0) {
    return (
      <p className="text-xs text-(--color-muted)">
        Assim que vocês subirem as fotos, a ordem aparece aqui.
      </p>
    );
  }

  // Agrupa preservando a ordem em que os slots aparecem.
  const porSlot = fotos.reduce<Record<string, FotoOrdenavel[]>>((acc, f) => {
    (acc[f.slot] ??= []).push(f);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(porSlot).map(([slot, doSlot]) => (
        <div key={slot} className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-(--color-olive)/80">
            {doSlot[0].slotLabel}
            {doSlot.length > 1 && (
              <span className="font-normal text-(--color-muted)">
                {" "}
                · {doSlot.length} fotos, a primeira abre
              </span>
            )}
          </p>
          <ul className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {doSlot.map((foto, i) => (
              <li key={foto.id} className="relative">
                <div className="relative aspect-square overflow-hidden rounded-lg border border-(--color-gold)/30 bg-(--color-paper)">
                  {foto.url ? (
                    // URL assinada e temporária; next/image não ajuda aqui.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={foto.url}
                      alt={`${doSlot[0].slotLabel}, posição ${i + 1}`}
                      loading="lazy"
                      className="absolute inset-0 size-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-xl">
                      🖼️
                    </span>
                  )}
                  <span className="absolute left-1 top-1 rounded-full bg-black/60 px-1.5 text-[10px] font-semibold text-white">
                    {i + 1}
                  </span>
                  {doSlot.length > 1 && (
                    <Setas
                      siteId={siteId}
                      photoId={foto.id}
                      primeira={foto.primeira}
                      ultima={foto.ultima}
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
