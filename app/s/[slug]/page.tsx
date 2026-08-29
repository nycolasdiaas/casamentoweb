import { Suspense } from "react";
import { notFound } from "next/navigation";
import BecoComSaida from "@/components/site/BecoComSaida";
import type { Metadata } from "next";
import {
  getSiteViewBySlug,
  listPublishedSiteSlugs,
} from "@/lib/repositories/siteView";
import SiteFromView from "@/components/site/SiteFromView";
import SenhaDoSite from "@/components/site/SenhaDoSite";
import { getSiteAccess } from "@/lib/repositories/sites";
import { temCracha } from "@/lib/site/acessoDoSite";
import { listSitePhotos } from "@/lib/repositories/sitePhotos";
import { dataPorExtenso } from "@/lib/site/dataLegivel";
import { versaoDoCartao, DESCRICAO_DO_SITE } from "@/lib/site/cartaoDeLink";

/**
 * Site público de um casal, renderizado a partir do banco.
 *
 * Fica sob /s/<slug> nesta fase, e não na raiz, de propósito: colocar sites
 * de casal na raiz colide com as rotas existentes (/admin, /conta, /pacotes,
 * /presentes, /rsvp). O prefixo mantém a fase sem risco para o que já está
 * no ar; a Fase 2 troca isso por subdomínio, lendo a MESMA coluna slug.
 *
 * Só serve site PUBLICADO. Enquanto está em prévia, o acesso é por
 * /preview/<token>, que o casal recebe ao enviar o pedido.
 *
 * Ver docs/sdd-geracao-automatica.md §6.
 */

export async function generateStaticParams() {
  const slugs = await listPublishedSiteSlugs();
  // Cache Components exige ao menos um param declarado.
  if (slugs.length === 0) return [{ slug: "__sem-sites__" }];
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const view = await getSiteViewBySlug(slug);
  const nomes = view?.content?.coupleNames;

  /* O `status` entra na guarda junto com os nomes.
     Enquanto o site não publicado caía em `notFound()`, esta função nunca
     chegava a pintar título de página visível. Agora ele renderiza uma tela
     de "fora do ar por enquanto" com HTTP 200 — e sem esta linha o
     `<title>` dela anunciaria "Marina & Rafael | Save the Date" e a
     descrição convidaria para um casamento que o casal ainda não tornou
     público. Publicar pela aba do navegador continua sendo publicar. */
  if (!view || !nomes || view.site.status !== "published") {
    return { title: "Casamento", robots: { index: false, follow: false } };
  }

  /* S1 · O CARTÃO DE LINK.
     O `og:image` NÃO aponta para `opengraph-image` direto: ele leva o `?v=`
     do conteúdo. O WhatsApp guarda o cartão por dias e não revalida — trocar a
     foto de capa sem trocar o ENDEREÇO deixa os convidados vendo a capa
     antiga. É a regra explícita da prancha, e nenhum cabeçalho de cache
     resolve, porque quem guarda é o app do outro lado.

     As URLs são RELATIVAS: `metadataBase` (no layout raiz) as resolve. Ler o
     host aqui com `getBaseUrl` tornaria a rota dinâmica e o build reprova —
     "generateMetadata that depends on Request data when the rest of the route
     does not". O cartão é o mesmo para todo mundo; não é dado de requisição. */
  const fotos = await listSitePhotos(view.site.id);
  const versao = versaoDoCartao({
    coupleNames: nomes,
    weddingDate: view.content?.weddingDate ?? null,
    ceremonyVenue: view.content?.ceremonyVenue ?? null,
    fotoDeCapaId: fotos.find((f) => f.slot === "cover")?.id ?? null,
  });

  const dataLegivel = dataPorExtenso(
    view.content?.weddingDate?.toISOString().slice(0, 10) ?? null
  );
  const titulo = dataLegivel ? `${nomes} · ${dataLegivel}` : nomes;

  return {
    title: `${nomes} | Save the Date`,
    description: `Você está convidado para o casamento de ${nomes}.`,
    // O site é público, mas não é conteúdo para busca — é um convite.
    robots: { index: false, follow: false },
    openGraph: {
      type: "website",
      title: titulo,
      description: DESCRICAO_DO_SITE,
      url: `/s/${slug}`,
      images: [
        {
          url: `/s/${slug}/opengraph-image?v=${versao}`,
          width: 1200,
          height: 630,
          alt: `Casamento de ${nomes}`,
        },
      ],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function SitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const view = await getSiteViewBySlug(slug);

  // Endereço que nunca existiu: 404 de verdade (H1).
  if (!view) notFound();

  /* H4 · o site existe, mas não está no ar.
     Antes isto também caía no 404, e o 404 mente: o convidado guardava o link
     achando que tinha errado o endereço, e não voltava. São dois estados
     diferentes e a diferença importa para quem está do outro lado — aqui o
     link está CERTO e vai funcionar, só não agora.

     Nada do casal aparece nesta tela (nem os nomes): o site não está público,
     e vazar conteúdo pelo estado de erro seria publicar pela porta dos
     fundos. */
  if (view.site.status !== "published") {
    return (
      <BecoComSaida
        codigo="Site fora do ar por enquanto"
        titulo="Os noivos estão dando os retoques finais"
        saidaPrincipal={{ rotulo: "Ir para a Enlace", href: "/" }}
        rodape="Guardem o link: ele continua o mesmo quando o site voltar."
      >
        <p>
          Este endereço está reservado e o site volta em breve. Não é engano de
          vocês — o link está certo.
        </p>
      </BecoComSaida>
    );
  }

  /* H4 · o site está no ar, mas protegido por senha.
     A checagem vem DEPOIS do estado publicado e ANTES de qualquer render do
     conteúdo: um site arquivado não deve pedir senha (ele não está no ar para
     ninguém), e um site protegido não pode montar a árvore do casal antes de
     conferir o crachá.

     ── Por que o `accessMode` vem do CACHE e o crachá não ──────────────────
     O modo de acesso não é segredo — ele diz apenas se existe tranca, e vive na
     view cacheada (invalidada por `site-view:<slug>`, que `derrubarCache`
     derruba a cada mudança de visibilidade). Ler daqui deixa o site PÚBLICO
     exatamente como era antes: prerenderável, sem `<Suspense>`, sem custo por
     pedido. Só quem ligou a tranca paga o render dinâmico.

     O crachá é outra história: ele depende de `cookies()` e do hash da senha,
     que são dados de pedido e não podem sair da consulta cacheada. Daí o
     limite abaixo. */
  if (view.site.accessMode === "password") {
    return (
      <Suspense fallback={null}>
        <PortaoDeAcesso
          slug={slug}
          view={view}
          nomesDoCasal={view.content?.coupleNames ?? null}
        />
      </Suspense>
    );
  }

  return <SiteFromView view={view} slug={slug} />;
}

/**
 * Confere o crachá de quem já digitou a senha.
 *
 * Isolado num componente porque lê `cookies()` e o hash da senha — dados de
 * pedido, que com Cache Components exigem um limite de `<Suspense>`.
 *
 * `fallback={null}` de propósito: um esqueleto aqui piscaria a silhueta de um
 * site que talvez a pessoa nem tenha permissão de ver. Nada por alguns
 * milissegundos é mais honesto que a sombra do conteúdo protegido.
 */
async function PortaoDeAcesso({
  slug,
  view,
  nomesDoCasal,
}: {
  slug: string;
  view: NonNullable<Awaited<ReturnType<typeof getSiteViewBySlug>>>;
  nomesDoCasal: string | null;
}) {
  const acesso = await getSiteAccess(slug);
  const entrou = await temCracha(
    acesso?.id ?? view.site.id,
    acesso?.accessPasswordHash ?? null
  );

  if (!entrou) {
    return <SenhaDoSite slug={slug} nomesDoCasal={nomesDoCasal} />;
  }

  return <SiteFromView view={view} slug={slug} />;
}
