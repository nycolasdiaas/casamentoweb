import type { Metadata } from "next";
import ContentEditor from "@/components/account/ContentEditor";
import LivePreview from "@/components/account/LivePreview";
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
  const previewSrc = order.previewUrl ?? order.siteUrl ?? null;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <span className="meta text-(--c-mark)">Conteúdo</span>
        <h1 className="t-d2 text-(--c-ink)">O conteúdo do site</h1>
        <p className="t-corpo text-(--c-ink-2) medida">
          Nomes, data, locais, história e o Pix dos presentes.
        </p>
      </header>

      {podeEditar ? (
        /* E3 é DUAS COLUNAS: o formulário de um lado, a prévia do outro.
           Editar sem ver o resultado obriga o casal a abrir o site em outra
           aba a cada campo — e é justamente essa ida e volta que a prancha
           elimina. No celular a prévia desce para o fim, porque ali as duas
           colunas não cabem e o campo é que precisa da tela. */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="surface-raised rounded-[3px] p-6 lg:p-8">
            <ContentEditor
              siteId={site.id}
              values={toEditorValues(conteudo)}
              previewUrl={order.previewUrl ?? order.siteUrl}
            />
          </div>

          {previewSrc && (
            /* `sticky`: o formulário é longo e a prévia tem de continuar
               visível enquanto o casal desce por ele. */
            <aside className="hidden lg:block lg:sticky lg:top-6">
              <LivePreview src={previewSrc} fullBleed={false} />
            </aside>
          )}
        </div>
      ) : (
        <p className="rounded-[3px] border border-(--c-rule) bg-white p-6 text-sm text-(--c-ink-2)">
          {site === null
            ? "O site de vocês ainda está sendo montado."
            : "Este site está arquivado. Fale com a gente para reabrir."}
        </p>
      )}
    </div>
  );
}
