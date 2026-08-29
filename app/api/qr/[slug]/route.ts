import { getSiteBySlug } from "@/lib/repositories/sites";
import { getBaseUrl } from "@/lib/baseUrl";
import { enderecoDoSite, qrEmPng, qrEmSvg } from "@/lib/site/qrDoSite";

/**
 * S3 · o QR do endereço do casamento, em SVG ou PNG.
 *
 *     /api/qr/<slug>          → SVG (o padrão: vetor, para a gráfica)
 *     /api/qr/<slug>?f=png    → PNG 1024px
 *
 * ── Por que só de site PUBLICADO ───────────────────────────────────────────
 *
 * O QR é feito para ser impresso — em convite, em plaquinha de mesa, no painel
 * da festa. Gerar o de um site em prévia entregaria ao casal um código que ele
 * manda para a gráfica e que, na festa, leva a uma página que não existe.
 * Melhor 404 aqui, onde dá para consertar, que papel impresso com link morto.
 *
 * ── O que este endereço NÃO expõe ──────────────────────────────────────────
 *
 * O slug já é público (está no WhatsApp dos convidados), e o QR só codifica a
 * URL. Nada do casal passa por aqui.
 */

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);

  if (!site || site.status !== "published") {
    return new Response("Not found", { status: 404 });
  }

  const base = await getBaseUrl();
  const url = enderecoDoSite(base, slug);
  const formato = new URL(req.url).searchParams.get("f");

  /* Cache longo: o conteúdo é função pura do slug e do domínio, e nenhum dos
     dois muda (slug publicado é imutável — regra §2.5). `immutable` é honesto
     aqui, ao contrário do que vale para `/f/<id>`, onde a foto pode ser
     apagada. */
  const cabecalhos = {
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Robots-Tag": "noindex",
  };

  if (formato === "png") {
    const png = await qrEmPng(url);
    return new Response(new Uint8Array(png), {
      headers: {
        ...cabecalhos,
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="qr-${slug}.png"`,
      },
    });
  }

  return new Response(await qrEmSvg(url), {
    headers: {
      ...cabecalhos,
      "Content-Type": "image/svg+xml; charset=utf-8",
    },
  });
}
