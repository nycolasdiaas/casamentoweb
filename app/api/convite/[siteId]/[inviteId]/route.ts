import sharp from "sharp";
import { getSessionUserId } from "@/lib/auth/userSession";
import { getSiteOwnedByUser } from "@/lib/repositories/sites";
import { getInvite } from "@/lib/repositories/siteInvites";
import { getSitePhotoById } from "@/lib/repositories/sitePhotos";
import { fetchObject, isStorageEnabled } from "@/lib/storage/supabase";
import { areasComLink, renderInviteSvg } from "@/lib/site/inviteRender";
import { CONVITE_ALTURA, CONVITE_LARGURA } from "@/lib/site/inviteDoc";

/**
 * Exporta um convite desenhado pelo casal em PNG, JPEG ou PDF.
 *
 * Os três saem do MESMO SVG (ver `inviteRender`), então o que o casal escolhe
 * é o recipiente, não o desenho: o PDF não é uma segunda versão do convite que
 * pode divergir da imagem.
 *
 * PDF sem biblioteca nova: o `sharp` não gera PDF, mas o formato é simples o
 * bastante para embutir um JPEG numa página de tamanho fixo. Trazer um
 * `pdf-lib` (~300 KB) para escrever sete objetos não se paga.
 */

type Formato = "png" | "jpeg" | "pdf";

function normalizarFormato(v: string | null): Formato {
  if (v === "jpeg" || v === "jpg") return "jpeg";
  if (v === "pdf") return "pdf";
  return "png";
}

type AreaDeLink = { link: string; x: number; y: number; w: number; h: number };

/** Escapa um endereço para caber dentro de uma string literal do PDF. */
function escaparPdf(texto: string): string {
  return texto.replace(/([\\()])/g, "\\$1");
}

/**
 * Monta um PDF de uma página com o JPEG ocupando a folha inteira, e uma
 * ANOTAÇÃO por link.
 *
 * ── Por que anotação, e não algo dentro da imagem ──────────────────────────
 *
 * Num PDF o link não mora no desenho: é um objeto `/Annot /Link` com um
 * retângulo em coordenadas da página. A primeira versão exportava só o JPEG —
 * o texto "Lista de presentes" aparecia e clicar nele não fazia nada, porque
 * não havia nada para clicar.
 *
 * ── O eixo Y é invertido ───────────────────────────────────────────────────
 *
 * No convite o Y cresce para BAIXO (como na tela); no PDF, para CIMA, a partir
 * do pé da página. Daí o `altura - y - h`: sem isso o link fica espelhado na
 * vertical e responde no lugar errado da folha.
 */
function pdfComJpeg(
  jpeg: Buffer,
  largura: number,
  altura: number,
  links: AreaDeLink[] = []
): Buffer {
  // Os objetos 1..5 são fixos (catálogo, páginas, página, imagem, conteúdo);
  // cada link vira o objeto 6, 7, … e entra no /Annots da página.
  const primeiroLink = 6;
  const refsAnnots = links.map((_, i) => `${primeiroLink + i} 0 R`).join(" ");

  const objetos: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${largura} ${altura}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R${
      links.length ? ` /Annots [${refsAnnots}]` : ""
    } >>`,
  ];
  const conteudo = `q ${largura} 0 0 ${altura} 0 0 cm /Im0 Do Q`;

  const partes: Buffer[] = [];
  const posicoes: number[] = [];
  let deslocamento = 0;
  const push = (b: Buffer) => {
    partes.push(b);
    deslocamento += b.length;
  };

  const NL = "\n";

  push(Buffer.from(`%PDF-1.4${NL}`));

  objetos.forEach((corpo, i) => {
    posicoes.push(deslocamento);
    push(Buffer.from(`${i + 1} 0 obj${NL}${corpo}${NL}endobj${NL}`));
  });

  // 4: a imagem
  posicoes.push(deslocamento);
  push(
    Buffer.from(
      `4 0 obj${NL}<< /Type /XObject /Subtype /Image /Width ${largura} /Height ${altura} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>${NL}stream${NL}`
    )
  );
  push(jpeg);
  push(Buffer.from(`${NL}endstream${NL}endobj${NL}`));

  // 5: o content stream que desenha a imagem
  posicoes.push(deslocamento);
  push(
    Buffer.from(
      `5 0 obj${NL}<< /Length ${conteudo.length} >>${NL}stream${NL}${conteudo}${NL}endstream${NL}endobj${NL}`
    )
  );

  // 6..N: um link por área. `/Border [0 0 0]` tira a moldura que alguns
  // leitores desenham — um retângulo azul em volta do texto estragaria o
  // convite.
  links.forEach((l, i) => {
    const y1 = (altura - l.y - l.h).toFixed(2);
    const y2 = (altura - l.y).toFixed(2);
    const x1 = l.x.toFixed(2);
    const x2 = (l.x + l.w).toFixed(2);
    posicoes.push(deslocamento);
    push(
      Buffer.from(
        `${primeiroLink + i} 0 obj${NL}<< /Type /Annot /Subtype /Link /Rect [${x1} ${y1} ${x2} ${y2}] /Border [0 0 0] /A << /Type /Action /S /URI /URI (${escaparPdf(l.link)}) >> >>${NL}endobj${NL}`
      )
    );
  });

  const inicioXref = deslocamento;
  const total = posicoes.length + 1;
  let xref = `xref${NL}0 ${total}${NL}0000000000 65535 f ${NL}`;
  for (const p of posicoes) {
    xref += `${String(p).padStart(10, "0")} 00000 n ${NL}`;
  }
  xref += `trailer${NL}<< /Size ${total} /Root 1 0 R >>${NL}startxref${NL}${inicioXref}${NL}%%EOF${NL}`;
  push(Buffer.from(xref));

  return Buffer.concat(partes);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ siteId: string; inviteId: string }> }
) {
  const { siteId, inviteId } = await params;
  const formato = normalizarFormato(
    new URL(request.url).searchParams.get("formato")
  );

  const userId = await getSessionUserId();
  if (!userId) return new Response("Não autorizado", { status: 401 });

  const site = await getSiteOwnedByUser(siteId, userId);
  if (!site) return new Response("Não encontrado", { status: 404 });

  const convite = await getInvite(siteId, inviteId);
  if (!convite) return new Response("Não encontrado", { status: 404 });

  // As fotos entram embutidas: o sharp renderiza o SVG sem acesso à rede.
  const fotos = new Map<string, string>();
  if (isStorageEnabled()) {
    const ids = [
      ...new Set(
        convite.doc.blocos
          .filter((b) => b.tipo === "foto")
          .map((b) => (b as { fotoId: string }).fotoId)
      ),
    ];
    await Promise.all(
      ids.map(async (id) => {
        const foto = await getSitePhotoById(id);
        // A foto tem que ser DESTE site: um id de foto de outro casal não
        // entra no convite só por estar escrito no documento.
        if (!foto || foto.siteId !== siteId) return;
        const r = await fetchObject(foto.storagePath);
        if (!r.ok) return;
        const bytes = Buffer.from(await r.arrayBuffer());
        fotos.set(
          id,
          `data:${foto.contentType};base64,${bytes.toString("base64")}`
        );
      })
    );
  }

  // A medida sai do DOCUMENTO: o casal pode ter escolhido quadrado, story ou
  // uma resolução própria.
  const L = convite.doc.largura || CONVITE_LARGURA;
  const A = convite.doc.altura || CONVITE_ALTURA;

  const svg = renderInviteSvg(convite.doc, fotos);
  // `resize` para a medida exata: o sharp rasteriza SVG pela densidade, e sem
  // isto a saída vinha em 2160×2700 (o dobro) — medido. O convite tem tamanho
  // definido, e quem baixa espera 1080×1350.
  const base = sharp(Buffer.from(svg)).resize(L, A);

  const nome = `convite-${site.slug}`;
  const cabecalhos = (tipo: string, ext: string) => ({
    "Content-Type": tipo,
    "Content-Disposition": `attachment; filename="${nome}.${ext}"`,
    "Cache-Control": "private, no-store",
  });

  if (formato === "png") {
    const png = await base.png().toBuffer();
    return new Response(new Uint8Array(png), {
      headers: cabecalhos("image/png", "png"),
    });
  }

  // JPEG não tem transparência: o fundo do convite entra por baixo, senão o
  // que era transparente vira preto.
  const jpeg = await base
    .flatten({ background: convite.doc.fundo })
    .jpeg({ quality: 92 })
    .toBuffer();

  if (formato === "jpeg") {
    return new Response(new Uint8Array(jpeg), {
      headers: cabecalhos("image/jpeg", "jpg"),
    });
  }

  // As áreas clicáveis saem do MESMO documento que gerou a imagem, então o
  // retângulo do link bate com onde o texto foi desenhado.
  const pdf = pdfComJpeg(jpeg, L, A, areasComLink(convite.doc));
  return new Response(new Uint8Array(pdf), {
    headers: cabecalhos("application/pdf", "pdf"),
  });
}
