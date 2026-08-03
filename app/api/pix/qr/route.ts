import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { getSitePix } from "@/lib/pix/resolve";
import { buildBrCode } from "@/lib/pix/brcode";
import { getGiftById } from "@/lib/repositories/gifts";

// QR do Pix, gerado a partir do MESMO payload do "copia e cola".
//
// Por que uma rota e não uma imagem que o casal sobe: o BR Code carrega o
// VALOR da cota (campo 54). Uma imagem estática serviria para uma cota só, ou
// para nenhuma — e foi exatamente esse o limite da solução anterior, em que o
// QR era um PNG em /public com a chave de uma pessoa específica.
//
// Por que uma rota e não SVG embutido no HTML: a lista tem dezenas de
// presentes e o convidado abre um. Embutir N QRs mandaria ~2 KB de marcação
// por presente para todo mundo, inclusive quem só passou o olho.

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get("site");
  const giftId = searchParams.get("gift");

  if (!siteId) {
    return new NextResponse("site ausente", { status: 400 });
  }

  const pix = await getSitePix(siteId);
  // Sem Pix configurado não existe QR "genérico" para devolver. 404 é a
  // resposta honesta: a alternativa seria inventar um destino.
  if (!pix) {
    return new NextResponse("site sem Pix configurado", { status: 404 });
  }

  // O presente é OPCIONAL: sem ele o QR sai sem valor, e o convidado escolhe
  // quanto dar. Com ele, o app do banco já abre com o preço preenchido.
  //
  // A busca é escopada por siteId (getGiftById exige os dois), então não dá
  // para casar o Pix de um casal com o valor da cota de outro.
  const gift = giftId ? await getGiftById(siteId, giftId) : null;
  if (giftId && !gift) {
    return new NextResponse("presente não encontrado", { status: 404 });
  }

  const payload = buildBrCode({
    chave: pix.chave,
    recebedor: pix.recebedor,
    cidade: pix.cidade,
    valorCentavos: gift?.priceCents ?? null,
    txid: gift?.id.replace(/-/g, "").slice(0, 25) ?? null,
  });

  const svg = await QRCode.toString(payload, {
    type: "svg",
    // "M" recupera ~15% de dano. O QR é lido de uma tela, não de um papel
    // amassado; nível maior só engordaria a imagem e apertaria os módulos.
    errorCorrectionLevel: "M",
    margin: 1,
    // Sem cor fixa: `currentColor` deixa o QR herdar a tinta do molde. Um QR
    // preto chapado num site sépia é o detalhe que denuncia peça genérica.
    color: { dark: "#000000ff", light: "#00000000" },
  });

  return new NextResponse(svg, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      // Cacheável, mas por pouco tempo e revalidando: se o casal trocar a
      // chave, o QR velho não pode sobreviver o dia inteiro no CDN mandando
      // dinheiro para a conta antiga.
      "cache-control": "public, max-age=60, stale-while-revalidate=300",
      // Defesa em profundidade: SVG servido como documento poderia executar
      // script. Aqui ele só é consumido por <img>, que já não executa nada.
      "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'",
      "x-content-type-options": "nosniff",
    },
  });
}
