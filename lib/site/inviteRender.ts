import {
  CONVITE_ALTURA,
  CONVITE_LARGURA,
  type Bloco,
  type InviteDoc,
} from "@/lib/site/inviteDoc";
import { pontos } from "@/lib/site/inviteShapes";

/**
 * Desenha o convite como SVG, para o `sharp` rasterizar.
 *
 * ── Por que SVG e não `next/og` ────────────────────────────────────────────
 *
 * O `ImageResponse` compõe com flexbox e decide sozinho onde cada coisa fica —
 * exatamente o que NÃO serve aqui: o casal posicionou cada bloco à mão, e o
 * export tem que respeitar a coordenada dele. Em SVG, `x` e `y` são o que a
 * pessoa arrastou, multiplicados pela largura.
 *
 * Isso também é o que faz PNG, JPEG e PDF saírem idênticos: os três nascem
 * deste mesmo SVG.
 *
 * ── O texto quebra aqui, não no rasterizador ───────────────────────────────
 *
 * SVG não quebra linha sozinho: um `<text>` longo sai numa linha só, atravessa
 * o convite e vaza. A quebra por largura é feita abaixo, em `quebrarLinhas`,
 * medindo por caractere. É aproximado — medir de verdade exigiria carregar a
 * fonte — e por isso o editor usa a MESMA conta, para o que o casal vê ser o
 * que ele recebe.
 */

const FAMILIAS = {
  serif: "Georgia, 'Times New Roman', serif",
  sans: "'Helvetica Neue', Arial, sans-serif",
  script: "'Segoe Script', 'Brush Script MT', cursive",
} as const;

/** Largura média de um caractere, em frações do tamanho da fonte. */
const LARGURA_MEDIA = { serif: 0.5, sans: 0.52, script: 0.44 } as const;

export function quebrarLinhas(
  texto: string,
  larguraCaixaPx: number,
  tamanhoPx: number,
  fonte: keyof typeof LARGURA_MEDIA
): string[] {
  const porChar = tamanhoPx * LARGURA_MEDIA[fonte];
  const maxChars = Math.max(1, Math.floor(larguraCaixaPx / porChar));

  // Palavra sozinha maior que a caixa (uma URL colada, um nome sem espaço)
  // precisa ser PARTIDA. Sem isto ela sai numa linha só e atravessa o convite
  // pelos dois lados — não é hipótese, aconteceu no primeiro export.
  const partir = (palavra: string): string[] => {
    if (palavra.length <= maxChars) return [palavra];
    const pedacos: string[] = [];
    for (let i = 0; i < palavra.length; i += maxChars) {
      pedacos.push(palavra.slice(i, i + maxChars));
    }
    return pedacos;
  };

  const linhas: string[] = [];
  for (const paragrafo of texto.split("\n")) {
    let atual = "";
    for (const palavra of paragrafo.split(/\s+/).flatMap(partir)) {
      const tentativa = atual ? `${atual} ${palavra}` : palavra;
      if (tentativa.length <= maxChars) {
        atual = tentativa;
      } else {
        if (atual) linhas.push(atual);
        atual = palavra;
      }
    }
    linhas.push(atual);
  }
  return linhas;
}

const escapar = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function desenharBloco(
  b: Bloco,
  fotos: Map<string, string>,
  L = CONVITE_LARGURA,
  A = CONVITE_ALTURA
): string {
  const desenho = desenharConteudo(b, fotos, L, A);
  if (!b.rotacao || !desenho) return desenho;
  // Gira em torno do centro da caixa — a mesma origem do `transform-origin`
  // do CSS no editor, senão o bloco girado sairia deslocado no arquivo.
  const cx = b.x * L + (b.w * L) / 2;
  const cy = b.y * A + alturaAproximada(b, L) / 2;
  return `<g transform="rotate(${b.rotacao} ${cx} ${cy})">${desenho}</g>`;
}

/** Altura da caixa, para achar o centro de rotação. */
function alturaAproximada(b: Bloco, L: number): number {
  const w = b.w * L;
  if (b.tipo === "foto" || b.tipo === "forma") return w / (b.proporcao || 1);
  if (b.tipo === "linha") return b.espessura;
  const tamanho = b.tamanho * L;
  return quebrarLinhas(b.texto, w, tamanho, b.fonte).length * tamanho * 1.25;
}

function desenharConteudo(
  b: Bloco,
  fotos: Map<string, string>,
  L: number,
  A: number
): string {
  const x = b.x * L;
  const y = b.y * A;
  const w = b.w * L;

  if (b.tipo === "linha") {
    return `<rect x="${x}" y="${y}" width="${w}" height="${b.espessura}" fill="${b.cor}"/>`;
  }

  if (b.tipo === "forma") {
    const h = w / (b.proporcao || 1);
    // Forma sem preenchimento é "none", não transparente: no SVG, `fill` vazio
    // herda preto.
    const pintura =
      `fill="${b.preenchimento || "none"}"` +
      (b.espessura > 0 && b.contorno
        ? ` stroke="${b.contorno}" stroke-width="${b.espessura}"`
        : "") +
      (b.opacidade < 1 ? ` opacity="${b.opacidade}"` : "");

    if (b.forma === "circulo") {
      return `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 2}" ry="${h / 2}" ${pintura}/>`;
    }
    if (b.forma === "retangulo" || b.forma === "arredondado") {
      const r = b.forma === "arredondado" ? Math.min(b.raio, w / 2, h / 2) : 0;
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ry="${r}" ${pintura}/>`;
    }
    const p = pontos(b.forma);
    if (!p) return "";
    const coords = p.map(([px, py]) => `${x + px * w},${y + py * h}`).join(" ");
    return `<polygon points="${coords}" ${pintura}/>`;
  }

  if (b.tipo === "foto") {
    const href = fotos.get(b.fotoId);
    // Foto que não veio (apagada, ou upload desligado) simplesmente não sai —
    // melhor um vão que um retângulo de erro no convite do casamento.
    if (!href) return "";
    const h = w / (b.proporcao || 1);
    const id = `c${b.id}`;
    const r = Math.min(b.raio, w / 2);
    return `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ry="${r}"/></clipPath>` +
      `<image x="${x}" y="${y}" width="${w}" height="${h}" href="${href}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>`;
  }

  const tamanho = b.tamanho * L;
  const linhas = quebrarLinhas(b.texto, w, tamanho, b.fonte);
  const ancora =
    b.alinhamento === "center" ? "middle" : b.alinhamento === "right" ? "end" : "start";
  const tx = b.alinhamento === "center" ? x + w / 2 : b.alinhamento === "right" ? x + w : x;
  const alturaLinha = tamanho * 1.25;

  const tspans = linhas
    .map(
      (linha, i) =>
        `<tspan x="${tx}" y="${y + tamanho + i * alturaLinha}">${escapar(linha)}</tspan>`
    )
    .join("");

  return `<text font-family="${FAMILIAS[b.fonte]}" font-size="${tamanho}" font-weight="${b.peso}" fill="${b.cor}" text-anchor="${ancora}" letter-spacing="${b.espacamento * tamanho}">${tspans}</text>`;
}

/**
 * `fotos` mapeia id de `site_photos` → data URI. As fotos entram embutidas
 * porque o `sharp` renderiza o SVG sem rede: um href remoto sairia em branco.
 */
export function renderInviteSvg(
  doc: InviteDoc,
  fotos: Map<string, string>
): string {
  const L = doc.largura || CONVITE_LARGURA;
  const A = doc.altura || CONVITE_ALTURA;
  // As coordenadas são fração, então mudar de formato só muda o multiplicador:
  // o desenho reflui sem que nenhum bloco precise ser reposicionado.
  const corpo = doc.blocos.map((b) => desenharBloco(b, fotos, L, A)).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="${A}" viewBox="0 0 ${L} ${A}"><rect width="100%" height="100%" fill="${doc.fundo}"/>${corpo}</svg>`;
}
