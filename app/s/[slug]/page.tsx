import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getSiteViewBySlug,
  listPublishedSiteSlugs,
} from "@/lib/repositories/siteView";
import SiteFromView from "@/components/site/SiteFromView";

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

  if (!view || !nomes) return { title: "Casamento" };

  return {
    title: `${nomes} | Save the Date`,
    description: `Você está convidado para o casamento de ${nomes}.`,
    // O site é público, mas não é conteúdo para busca — é um convite.
    robots: { index: false, follow: false },
  };
}

export default async function SitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const view = await getSiteViewBySlug(slug);

  if (!view || view.site.status !== "published") {
    notFound();
  }

  return <SiteFromView view={view} slug={slug} />;
}
