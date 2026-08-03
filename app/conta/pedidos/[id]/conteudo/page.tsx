import type { Metadata } from "next";
import ContentEditor from "@/components/account/ContentEditor";
import { carregarGerenciamento } from "@/lib/site/manageData";
import { getSiteContent } from "@/lib/repositories/siteContent";
import { toEditorValues } from "@/lib/site/contentFields";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: `Conteúdo | ${SITE_NAME}` };

export default async function ConteudoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { order, site } = await carregarGerenciamento(id);

  // Sem cache de propósito: quem acabou de salvar precisa ver o próprio texto
  // no formulário, não uma versão de minutos atrás.
  const conteudo = site ? await getSiteContent(site.id) : null;
  // Arquivado é decisão de tirar do ar; não faz sentido oferecer edição.
  const podeEditar = site !== null && site.status !== "archived";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight">
          O conteúdo do site
        </h1>
        <p className="text-sm leading-relaxed text-(--color-olive)/70">
          Nomes, data, locais, história e o Pix dos presentes.
        </p>
      </div>

      {podeEditar ? (
        <ContentEditor
          siteId={site.id}
          values={toEditorValues(conteudo)}
          previewUrl={order.previewUrl ?? order.siteUrl}
        />
      ) : (
        <p className="rounded-2xl border border-(--color-gold)/40 bg-white p-6 text-sm text-(--color-olive)/70">
          {site === null
            ? "O site de vocês ainda está sendo montado."
            : "Este site está arquivado. Fale com a gente para reabrir."}
        </p>
      )}
    </div>
  );
}
