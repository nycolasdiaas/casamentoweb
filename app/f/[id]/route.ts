import { getSitePhotoById } from "@/lib/repositories/sitePhotos";
import { getSiteById } from "@/lib/repositories/sites";
import { fetchObject } from "@/lib/storage/supabase";

/**
 * Entrega uma foto do casal a partir do bucket privado.
 *
 * O bucket não é público: a foto do casamento tem convidado dentro, e
 * convidado é terceiro (LGPD) — o mesmo princípio que já vale para as
 * métricas. Então ninguém fala com o Storage direto; fala com esta rota.
 *
 * Por que a rota repassa os bytes em vez de redirecionar para uma URL
 * assinada (medido, não suposto): o otimizador do `next/image` segue
 * redirects ao buscar imagens REMOTAS, mas `/f/<id>` é caminho local — a
 * busca é interna, não segue o 307, e devolve
 * `"url" parameter is valid but internal response is invalid`. Ou seja: com
 * redirect, nenhuma foto renderiza.
 *
 * O custo é uma passagem de bytes pelo servidor, e ela é pequena: quem busca
 * aqui é o otimizador, uma vez por foto e tamanho — não o convidado, que
 * recebe a versão já otimizada e cacheada.
 *
 * Efeito colateral bom: `images.remotePatterns` continua vazio, porque a URL
 * é da nossa própria origem. O domínio do Storage nunca vira superfície
 * aberta na configuração.
 */

/**
 * O conteúdo de `/f/<id>` nunca muda — trocar a foto gera um id novo. Mas o
 * cache é `private` e de uma hora, e não `immutable`: apagar a foto precisa
 * fazer efeito em tempo razoável, e é justamente isso que o bucket privado
 * compra sobre o "caminho secreto".
 */
const CACHE_SEGUNDOS = 60 * 60;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  // uuid inválido nem chega ao banco (o Postgres erraria o cast).
  if (!UUID.test(id)) {
    return new Response("Not found", { status: 404 });
  }

  const foto = await getSitePhotoById(id);
  if (!foto) {
    // Foto apagada pelo casal deixa de existir aqui na mesma hora.
    return new Response("Not found", { status: 404 });
  }

  const site = await getSiteById(foto.siteId);
  if (!site || site.status === "archived") {
    return new Response("Not found", { status: 404 });
  }

  try {
    const objeto = await fetchObject(foto.storagePath);
    if (!objeto.ok || !objeto.body) {
      console.error(
        `[fotos] objeto sumiu do bucket: ${foto.storagePath} (${objeto.status})`
      );
      return new Response("Not found", { status: 404 });
    }

    return new Response(objeto.body, {
      headers: {
        // O tipo vem do que conferimos nos bytes na hora do upload, não do
        // que o Storage devolve.
        "Content-Type": foto.contentType,
        "Cache-Control": `private, max-age=${CACHE_SEGUNDOS}`,
        // A foto do casamento não é conteúdo de busca.
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (error) {
    console.error("[fotos] falha ao buscar:", foto.storagePath, error);
    return new Response("Erro ao carregar a foto", { status: 502 });
  }
}
