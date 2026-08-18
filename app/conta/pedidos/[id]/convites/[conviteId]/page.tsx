import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { carregarGerenciamento } from "@/lib/site/manageData";
import { getInvite } from "@/lib/repositories/siteInvites";
import { listSitePhotosFresh } from "@/lib/repositories/sitePhotos";
import { apagarConviteAction } from "@/app/actions/invite-actions";
import EditorDeConvite from "@/components/account/convite/EditorDeConvite";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: `Editar convite | ${SITE_NAME}` };

export default async function EditarConvitePage({
  params,
}: {
  params: Promise<{ id: string; conviteId: string }>;
}) {
  const { id, conviteId } = await params;
  const { site } = await carregarGerenciamento(id);
  if (!site) notFound();

  // O `site.id` no lookup é o que impede abrir convite de outro casal com um
  // id na barra de endereço — `carregarGerenciamento` já provou a posse do
  // pedido, e daqui em diante tudo é escopado por site.
  const [convite, fotos] = await Promise.all([
    getInvite(site.id, conviteId),
    listSitePhotosFresh(site.id),
  ]);
  if (!convite) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <Link
            href={`/conta/pedidos/${id}/convites`}
            className="text-[13px] text-(--c-ink-2) underline underline-offset-4 transition-colors hover:text-(--c-ink)"
          >
            ← Todos os convites
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{convite.name}</h1>
        </div>

        <form action={apagarConviteAction}>
          <input type="hidden" name="siteId" value={site.id} />
          <input type="hidden" name="inviteId" value={convite.id} />
          <input type="hidden" name="orderId" value={id} />
          <button
            type="submit"
            className="min-h-11 px-1 text-[13px] text-(--c-ink-2) underline underline-offset-4 transition-colors hover:text-(--c-mark)"
          >
            Apagar convite
          </button>
        </form>
      </div>

      <EditorDeConvite
        siteId={site.id}
        orderId={id}
        inviteId={convite.id}
        nomeInicial={convite.name}
        docInicial={convite.doc}
        fotos={fotos.map((f) => ({ id: f.id, alt: f.alt }))}
      />
    </div>
  );
}
