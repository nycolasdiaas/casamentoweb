import { getSiteViewBySlug } from "@/lib/repositories/siteView";
import { listSitePhotos } from "@/lib/repositories/sitePhotos";
import { baseUrlEstatica } from "@/lib/baseUrl";
import { dataDoCartao } from "@/lib/site/cartaoDeLink";
import { fontesDoCartao } from "@/lib/site/ogFontes";
import {
  CartaoComFoto,
  CartaoTipografico,
  TAMANHO_OG,
  responderComImagem,
} from "@/lib/site/ogImagem";

/**
 * S1 · o cartão que aparece quando o link do casamento cai no WhatsApp.
 *
 * ── Por que esta rota existe ───────────────────────────────────────────────
 *
 * A prancha `Compartilhamento` é direta: *"O que decide se a pessoa abre não é
 * o site — é o cartão que aparece na conversa."* Sem ela, o link do casamento
 * chega como texto cru no grupo da família.
 *
 * ── Site não publicado NÃO tem cartão ──────────────────────────────────────
 *
 * A imagem some junto com as metatags (ver `generateMetadata`). Gerar o cartão
 * de um site em prévia publicaria os nomes e a foto do casal pela porta dos
 * fundos: bastaria alguém colar o endereço numa conversa para o casamento
 * inteiro aparecer antes de o casal ter decidido publicar.
 */

/**
 * Sem nenhuma fonte carregada o Satori lança em vez de desenhar. 404 aqui
 * significa "não há cartão", e o WhatsApp mostra o link sem cartão — que é o
 * comportamento de antes desta funcionalidade existir. Um 500 faria o link
 * parecer quebrado na conversa, que é pior que não ter cartão.
 */
function semCartao(): Response {
  return new Response("Sem fontes para desenhar o cartão", { status: 404 });
}

export const size = TAMANHO_OG;
/* JPEG, não PNG: ver `responderComImagem`. PNG de foto passa de 1,7 MB e
   cliente de mensagem desiste da prévia. */
export const contentType = "image/jpeg";
export const alt = "Convite de casamento";

export default async function Imagem({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const fontes = await fontesDoCartao();
  if (fontes.length === 0) return semCartao();

  const { slug } = await params;
  const view = await getSiteViewBySlug(slug);

  // Sem site publicado não há cartão. A rota devolve o cartão tipográfico
  // neutro em vez de erro: um 500 no gerador de imagem faz o WhatsApp mostrar
  // o link quebrado, o que é pior que um cartão discreto.
  if (!view || view.site.status !== "published") {
    return await responderComImagem(
      <CartaoTipografico
        sobrancelha="Enlace"
        nomes="Sites de casamento"
        data={null}
        cidade={null}
      />,
      fontes
    );
  }

  const nomes = view.content?.coupleNames?.trim() || "Nosso casamento";
  const data = dataDoCartao(
    view.content?.weddingDate ?? null,
    view.content?.timezone ?? "America/Fortaleza"
  );
  const cidade = view.content?.ceremonyVenue ?? null;

  /* A FOTO DE CAPA, se houver.
     `/f/<id>` é a rota que já entrega foto do bucket privado — o Satori busca
     por HTTP, então precisa do endereço absoluto. Se não houver capa, cai no
     cartão tipográfico, que é o que a prancha manda: "nunca um cartão vazio". */
  const fotos = await listSitePhotos(view.site.id);
  const capa = fotos.find((f) => f.slot === "cover");

  if (!capa) {
    return await responderComImagem(
      <CartaoTipografico
        sobrancelha="Vamos nos casar"
        nomes={nomes}
        data={data}
        cidade={cidade}
      />,
      fontes
    );
  }

  const base = baseUrlEstatica();

  /* A FOTO PASSA PELO OTIMIZADOR, e não vai crua.
     `/f/<id>` devolve o arquivo do jeito que o casal subiu — 2 a 5 MB de
     celular moderno. O Satori embute o que recebe e o `ImageResponse` só sabe
     sair em PNG, que é sem perda: a primeira prova gerou um cartão de 2,1 MB
     para um limite de projeto de 300 KB, e o WhatsApp descarta prévia grande
     em vez de mostrar.

     `w=1200` é a largura final do cartão — mais resolução que isso não chega
     à tela de ninguém, e é o detalhe fino que, num PNG, pesa.

     `q=75` não é escolha de gosto, são duas restrições do Next 16 que só
     aparecem em tempo de execução:

     1. **`q` é obrigatório** ("q parameter (quality) is required"), e
     2. **só valores de `images.qualities` passam** — 75 é o padrão, e
        `q=60` volta 400.

     E ele resolve o terceiro problema de graça: com `q=75` o otimizador
     devolve **JPEG**. Sem o `q`, a negociação de formato entrega WebP, e o
     Satori não decodifica WebP — o cartão saía com a tinta sólida no lugar da
     foto, sem erro visível além de uma linha no log. */
  const foto = `${base}/_next/image?url=${encodeURIComponent(`/f/${capa.id}`)}&w=1200&q=75`;

  return await responderComImagem(
    <CartaoComFoto nomes={nomes} data={data} cidade={cidade} fotoUrl={foto} />,
    fontes
  );
}
