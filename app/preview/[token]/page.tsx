import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSiteViewByPreviewToken } from "@/lib/repositories/siteView";
import SiteFromView from "@/components/site/SiteFromView";
import Link from "next/link";
import { uiPrensa } from "@/lib/fonts/ui";

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
      {/* F5 · a faixa da prévia.
          Ela é da PLATAFORMA, não do casal — é o único pedaço de Enlace que
          aparece por cima do site, e por isso fala a língua da Prensa (mono,
          caixa alta, tinta) em vez do tema do molde. O alvo de registro à
          esquerda é a mesma marca que carimba a prévia no painel.

          Diz duas coisas, e a segunda é a que faltava: além de "só quem tem o
          link vê", ela avisa que o site AINDA NÃO ESTÁ NO AR. Sem isso o casal
          abre a prévia, vê tudo pronto e conclui que já publicou. */}
      <div className={`${uiPrensa} w-full bg-(--c-ink) text-white`}>
        <div className="trilho py-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <span className="flex items-center gap-2.5">
            <span
              className="size-3 rounded-full border-[1.5px] border-(--c-mark) flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <span className="size-[3px] rounded-full bg-(--c-mark)" />
            </span>
            <span className="meta text-[11px] text-white/85">
              Prévia · só quem tem este link vê · o site ainda não está no ar
            </span>
          </span>
          <Link
            href="/conta/pedidos"
            className="text-[12.5px] text-white underline underline-offset-4 shrink-0"
          >
            Abrir o painel →
          </Link>
        </div>
      </div>
      <SiteFromView view={view} slug={view.site.slug} previa />
    </>
  );
}
