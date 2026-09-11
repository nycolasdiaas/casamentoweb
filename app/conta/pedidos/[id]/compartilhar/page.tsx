import type { Metadata } from "next";
import Link from "next/link";
import { carregarGerenciamento } from "@/lib/site/manageData";
import { getSiteContent } from "@/lib/repositories/siteContent";
import { listSiteSections } from "@/lib/repositories/siteSections";
import { listaDePresentesVisivel } from "@/lib/site/giftSection";
import { listSitePhotos } from "@/lib/repositories/sitePhotos";
import { metricasDoSite } from "@/lib/repositories/siteMetrics";
import { baseUrlOuNulo } from "@/lib/baseUrl";
import { enderecoDoSite, linkSemEsquema } from "@/lib/site/qrDoSite";
import { versaoDoCartao } from "@/lib/site/cartaoDeLink";
import { dataPorExtenso } from "@/lib/site/dataLegivel";
import { prazoPorExtenso } from "@/lib/site/prazoRsvp";
import Compartilhar from "@/components/account/manage/Compartilhar";

export const metadata: Metadata = { title: "Compartilhar" };

/**
 * S4 · onde o casal pega tudo que precisa para o link circular.
 *
 * ── Por que a aba só existe depois de publicar ─────────────────────────────
 *
 * Compartilhar uma prévia é compartilhar um endereço que responde "site fora
 * do ar" para quem abrir. O casal mandaria no grupo da família e receberia de
 * volta "não abre" — o pior momento possível para isso acontecer. Antes de
 * publicar, a tela explica o que vai aparecer aqui, que é a fórmula de estado
 * vazio da Voz V4 (o que falta + o que aparece + a ação).
 */
export default async function CompartilharPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { order, site } = await carregarGerenciamento(id);

  const noAr = site !== null && site.status === "published";

  if (!noAr) {
    return (
      <div className="flex flex-col gap-6">
        <Cabecalho />
        <div className="surface-flat rounded-[3px] border-dashed px-6 py-10 text-center">
          <p className="t-display text-[24px] leading-tight text-(--c-ink)">
            O link ainda não existe
          </p>
          <p className="t-corpo-p mx-auto mt-2 max-w-[46ch] text-(--c-ink-2)">
            Quando o site entrar no ar, o endereço, o cartão que aparece no
            WhatsApp, as mensagens prontas e o QR para imprimir aparecem aqui.
          </p>
          <div className="pt-5">
            <Link href={`/conta/pedidos/${order.id}`} className="btn btn-ink">
              Ver como publicar
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const [conteudo, fotos, metricas, base, secoes] = await Promise.all([
    getSiteContent(site.id),
    listSitePhotos(site.id),
    metricasDoSite(site.id),
    baseUrlOuNulo(),
    listSiteSections(site.id),
  ]);

  /* Sem endereço descoberto, a tela abre com o caminho relativo em vez de
     deixar de abrir (FR-003). Em produção sadia isso não acontece: o endereço
     vem da variável configurada ou do domínio que a própria hospedagem
     informa. */
  const url = enderecoDoSite(base ?? "", site.slug);

  /* O link só-presentes só aparece se a lista de fato aparece no site: mesma
     regra da rota `/s/<slug>/presentes`. Oferecer para copiar um endereço que
     responde "fora do ar" seria o casal descobrir pelo convidado. */
  const urlDosPresentes = listaDePresentesVisivel({ site, sections: secoes })
    ? `${url.replace(/\/+$/, "")}/presentes`
    : null;
  const versao = versaoDoCartao({
    coupleNames: conteudo?.coupleNames ?? null,
    weddingDate: conteudo?.weddingDate ?? null,
    ceremonyVenue: conteudo?.ceremonyVenue ?? null,
    fotoDeCapaId: fotos.find((f) => f.slot === "cover")?.id ?? null,
  });

  return (
    <div className="flex flex-col gap-6">
      <Cabecalho />

      <Compartilhar
        url={url}
        urlLimpa={linkSemEsquema(url)}
        urlDosPresentes={urlDosPresentes}
        slug={site.slug}
        prazo={prazoPorExtenso(conteudo?.rsvpDeadline)}
        cartao={`/s/${site.slug}/opengraph-image?v=${versao}`}
        nomesDoCasal={conteudo?.coupleNames ?? null}
        dataLegivel={dataPorExtenso(
          conteudo?.weddingDate?.toISOString().slice(0, 10) ?? null
        )}
      />

      {/* VISITAS — o card oliva do desenho.
          Fica no fim e não no topo de propósito: o assunto da tela é fazer o
          link circular, e o número é a consequência disso. Invertido, a tela
          vira painel de métrica. */}
      <section className="rounded-[3px] bg-(--c-olive) p-6 text-(--c-paper-warm)">
        <p className="meta text-white/60">Visitas no site</p>
        <p className="t-display mt-2 text-[38px] leading-none">
          {metricas.visitas30d}
        </p>
        <p className="mt-1 text-[12.5px] text-white/75">
          nos últimos 30 dias
          {metricas.confirmados > 0
            ? ` · ${metricas.confirmados} ${metricas.confirmados === 1 ? "confirmou" : "confirmaram"}`
            : ""}
        </p>
      </section>
    </div>
  );
}

function Cabecalho() {
  return (
    <header className="flex flex-col gap-3">
      <span className="meta text-(--c-mark)">Compartilhar</span>
      <h1 className="t-d2 text-(--c-ink)">O link de vocês</h1>
      <p className="t-corpo text-(--c-ink-2) medida">
        O convite viaja por link. Aqui está o endereço, o cartão que aparece na
        conversa, o texto pronto para mandar e o QR para imprimir.
      </p>
    </header>
  );
}
