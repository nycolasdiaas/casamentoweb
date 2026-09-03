import { getGiftPhotoById } from "@/lib/repositories/gifts";
import { fetchObject } from "@/lib/storage/supabase";

/**
 * Entrega a foto de um presente a partir do bucket privado.
 *
 * Mesmo desenho de `/f/<id>` (ver aquele arquivo para o porquê de repassar
 * bytes em vez de redirecionar): o otimizador do `next/image` não segue
 * redirect em caminho local, e sem isso nenhuma foto renderizaria.
 *
 * Rota própria, e não `/f/<id>`, porque aquela resolve por `sitePhotos`
 * (slot fixo do molde) — foto de presente vive em `gift_photos`, tabela
 * separada (ver comentário em schema.ts).
 */
const CACHE_SEGUNDOS = 60 * 60;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  if (!UUID.test(id)) {
    return new Response("Not found", { status: 404 });
  }

  const foto = await getGiftPhotoById(id);
  if (!foto) {
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
        "Content-Type": foto.contentType,
        "Cache-Control": `private, max-age=${CACHE_SEGUNDOS}`,
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (error) {
    console.error("[fotos] falha ao buscar:", foto.storagePath, error);
    return new Response("Erro ao carregar a foto", { status: 502 });
  }
}
