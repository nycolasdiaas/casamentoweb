import type { Metadata } from "next";
import PhotoManager from "@/components/account/PhotoManager";
import { carregarGerenciamento } from "@/lib/site/manageData";
import {
  listSitePhotosFresh,
  photoLimitForTier,
} from "@/lib/repositories/sitePhotos";
import { isStorageEnabled } from "@/lib/storage/supabase";
import { tierAllowsSection } from "@/lib/templates/contract";
import type { PackageTier } from "@/lib/packages";

export const metadata: Metadata = { title: "Fotos" };

export default async function FotosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { order, site } = await carregarGerenciamento(id);

  const podeSubir = site !== null && isStorageEnabled();
  const fotos = podeSubir ? await listSitePhotosFresh(site.id) : [];

  /* A aba inteira NÃO é fechada por pacote: capa, história e galeria entram
     em todos, inclusive no Convite. O que sai é o lugar do álbum da festa,
     que é do Para Sempre — ele aparecia para qualquer pacote, e o casal subia
     as fotos do casamento num lugar que o site dele não mostra. */
  const slotsPermitidos = ["cover", "story", "gallery"];
  if (tierAllowsSection(order.packageTier, "album")) {
    slotsPermitidos.push("album");
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <span className="meta text-(--c-mark)">Fotos</span>
        <h1 className="t-d2 text-(--c-ink)">As fotos de vocês</h1>
        <p className="t-corpo text-(--c-ink-2) medida">
          Subam direto daqui — a gente ajusta o tamanho e a orientação sozinho.
          Enquanto um lugar estiver vazio, o site mostra uma imagem de exemplo.
        </p>
      </header>

      {podeSubir ? (
        <PhotoManager
          siteId={site.id}
          limit={photoLimitForTier(site.tier as PackageTier)}
          slotsPermitidos={slotsPermitidos}
          photos={fotos.map((f) => ({
            id: f.id,
            slot: f.slot,
            width: f.width,
            height: f.height,
            blurDataUrl: f.blurDataUrl,
          }))}
        />
      ) : (
        // Sem SUPABASE_SERVICE_ROLE_KEY o upload fica desligado e nada avisa —
        // ver AGENTS.md. Aqui pelo menos o casal entende por que o painel sumiu.
        <p className="rounded-[3px] border border-(--c-rule) bg-white p-6 text-sm leading-relaxed text-(--c-ink-2)">
          {site === null
            ? "O site de vocês ainda está sendo montado. Assim que a prévia ficar pronta, o envio de fotos abre aqui."
            : "O envio de fotos está temporariamente indisponível. Mandem as fotos pelo WhatsApp que a gente sobe para vocês."}
        </p>
      )}
    </div>
  );
}
