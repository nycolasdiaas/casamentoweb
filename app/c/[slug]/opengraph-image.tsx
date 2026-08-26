import { getConvitePublicado } from "@/lib/repositories/siteInvites";
import { getSiteViewBySlug } from "@/lib/repositories/siteView";
import { dataDoCartao } from "@/lib/site/cartaoDeLink";
import { fontesDoCartao } from "@/lib/site/ogFontes";
import {
  CartaoTipografico,
  TAMANHO_OG,
  responderComImagem,
} from "@/lib/site/ogImagem";

/**
 * S1 · o cartão de link do CONVITE.
 *
 * ── Por que sempre tipográfico, e nunca com foto ───────────────────────────
 *
 * A prancha desenha o cartão do convite em papel, sem imagem — e é coerente
 * com o que o convite é: uma peça de papelaria. O convite que o casal desenhou
 * pode ter foto, forma, cor de fundo própria; rasterizar o `InviteDoc` aqui
 * exigiria um segundo renderizador (o Satori não é o navegador que desenha
 * `BlocoVisual`), e o resultado divergiria do convite de verdade — que é
 * exatamente o defeito que "um render, dois modos" existe para evitar.
 *
 * O cartão diz de quem é o casamento e quando. Quem clica vê o convite inteiro.
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
  const achado = await getConvitePublicado(slug);

  if (!achado) {
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

  /* Os nomes vêm do CONTEÚDO do site, não do primeiro texto do convite.
     O `generateMetadata` da página usa o primeiro bloco de texto porque ali é
     um fallback barato; aqui vale a pena a ida ao banco: o primeiro bloco pode
     ser "Você está convidado", e um cartão anunciando "Você está convidado"
     como se fosse o nome do casal não diz de quem é o casamento. */
  const conteudo = (await getSiteViewBySlug(achado.siteSlug))?.content ?? null;
  const nomes = conteudo?.coupleNames?.trim() || "Nosso casamento";

  return await responderComImagem(
    <CartaoTipografico
      sobrancelha="Você está convidado"
      nomes={nomes}
      data={dataDoCartao(
        conteudo?.weddingDate ?? null,
        conteudo?.timezone ?? "America/Fortaleza"
      )}
      cidade={conteudo?.ceremonyVenue ?? null}
    />,
    fontes
  );
}
