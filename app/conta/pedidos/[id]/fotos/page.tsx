import type { Metadata } from "next";
import PhotoManager from "@/components/account/PhotoManager";
import { carregarGerenciamento } from "@/lib/site/manageData";
import {
  listSitePhotosFresh,
  photoLimitForTier,
} from "@/lib/repositories/sitePhotos";
import { isStorageEnabled } from "@/lib/storage/supabase";
import type { PackageTier } from "@/lib/packages";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: `Fotos | ${SITE_NAME}` };

export default async function FotosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { site } = await carregarGerenciamento(id);

  const podeSubir = site !== null && isStorageEnabled();
  const fotos = podeSubir ? await listSitePhotosFresh(site.id) : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight">As fotos de vocês</h1>
        <p className="text-sm leading-relaxed text-(--color-olive)/70">
          Subam direto daqui — a gente ajusta o tamanho e a orientação sozinho.
          Enquanto um lugar estiver vazio, o site mostra uma imagem de exemplo.
        </p>
      </div>

      {podeSubir ? (
        <PhotoManager
          siteId={site.id}
          limit={photoLimitForTier(site.tier as PackageTier)}
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
        <p className="rounded-2xl border border-(--color-gold)/40 bg-white p-6 text-sm leading-relaxed text-(--color-olive)/70">
          {site === null
            ? "O site de vocês ainda está sendo montado. Assim que a prévia ficar pronta, o envio de fotos abre aqui."
            : "O envio de fotos está temporariamente indisponível. Mandem as fotos pelo WhatsApp que a gente sobe para vocês."}
        </p>
      )}
    </div>
  );
}
