import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSiteViewByPreviewToken } from "@/lib/repositories/siteView";
import SiteFromView from "@/components/site/SiteFromView";

/**
 * Prévia privada do site, antes de publicar.
 *
 * Acessível só por token — o slug é adivinhável, o token não. É o link que o
 * casal recebe assim que envia o pedido e o site é provisionado.
 *
 * noindex de propósito: prévia não pode ser indexada.
 *
 * Ver docs/sdd-geracao-automatica.md §7.
 */

export const metadata: Metadata = {
  title: "Prévia do site",
  robots: { index: false, follow: false },
};

/**
 * Token de mentira, só para o Cache Components validar a rota — ele exige ao
 * menos um param declarado em rota dinâmica, e é isso que permite ler
 * `params` fora de <Suspense> e o notFound() devolver 404 de verdade.
 *
 * Aqui não dá para listar os tokens reais: eles são o segredo que protege a
 * prévia; prerenderizá-los publicaria o que deveria ficar restrito. Este
 * placeholder nunca casa com token nenhum e cai no notFound().
 *
 * Padrão documentado em generate-static-params.md ("With Cache Components").
 */
export async function generateStaticParams() {
  return [{ token: "__placeholder__" }];
}

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const view = await getSiteViewByPreviewToken(token);

  if (!view) {
    notFound();
  }

  return (
    <>
      <div
        className="w-full px-4 py-2.5 text-center text-[11px] tracking-[0.18em] uppercase"
        style={{ background: "#1c1c1c", color: "#fafafa" }}
      >
        Prévia · só quem tem este link consegue ver
      </div>
      <SiteFromView view={view} slug={view.site.slug} />
    </>
  );
}
