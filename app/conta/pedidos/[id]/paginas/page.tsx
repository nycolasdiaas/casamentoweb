import type { Metadata } from "next";
import SiteControls from "@/components/account/SiteControls";
import { carregarGerenciamento } from "@/lib/site/manageData";
import {
  listSiteSections,
  podeDesligar,
} from "@/lib/repositories/siteSections";
import { SECTION_LABELS } from "@/lib/site/sectionLabels";
import { isSectionKey, type SectionKey } from "@/lib/templates/contract";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: `Páginas | ${SITE_NAME}` };

/**
 * As páginas (seções) do site: ligar, desligar, reordenar, e tirar do ar.
 *
 * É a tela que o Anderson apontou na referência ("consegue editar as páginas
 * também"). A mecânica já existia em `SiteControls` — o que faltava era um
 * lugar onde ela fosse o assunto, em vez de estar no meio de uma página com
 * mais cinco painéis.
 */
export default async function PaginasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { site } = await carregarGerenciamento(id);

  // O provisionamento semeia conforme o pacote, então o que está no banco já é
  // o que este pacote libera — não precisa filtrar por tier aqui.
  const linhas = site
    ? (await listSiteSections(site.id)).filter((s) =>
        isSectionKey(s.sectionKey)
      )
    : [];

  // As setas só valem entre seções móveis: `cover` e `footer` são âncoras, e
  // oferecer "subir" para quem já é o primeiro móvel só gera erro na volta.
  const moveis = linhas.filter((s) => podeDesligar(s.sectionKey as SectionKey));
  const secoes = linhas.map((s) => {
    const key = s.sectionKey as SectionKey;
    const idxMovel = moveis.findIndex((m) => m.sectionKey === s.sectionKey);
    return {
      key,
      label: SECTION_LABELS[key].label,
      descricao: SECTION_LABELS[key].descricao,
      enabled: s.enabled,
      fixa: !podeDesligar(key),
      podeSubir: idxMovel > 0,
      podeDescer: idxMovel >= 0 && idxMovel < moveis.length - 1,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Páginas do site</h1>
        <p className="text-sm leading-relaxed text-(--color-olive)/70">
          Liguem, desliguem e mudem a ordem. A mudança vale na hora — vale a
          pena conferir na prévia depois.
        </p>
      </div>

      {site !== null && secoes.length > 0 ? (
        <SiteControls
          siteId={site.id}
          status={site.status}
          slug={site.slug}
          secoes={secoes}
          jaFoiPublicado={site.publishedAt !== null}
        />
      ) : (
        <p className="rounded-2xl border border-(--color-gold)/40 bg-white p-6 text-sm text-(--color-olive)/70">
          O site de vocês ainda está sendo montado. Assim que a prévia ficar
          pronta, as páginas aparecem aqui.
        </p>
      )}
    </div>
  );
}
