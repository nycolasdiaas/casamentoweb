import QRCode from "qrcode";

/**
 * O QR do endereço do casamento — prancha `Compartilhamento` S3.
 *
 * ── A especificação, e por que cada número está lá ─────────────────────────
 *
 * | Item | Valor | Por quê |
 * |---|---|---|
 * | Correção de erro | **H (30%)** | É o que permite o logo no centro sem quebrar a leitura |
 * | Margem | **4 módulos** | Sem a área de silêncio o leitor não acha o código |
 * | Cores | `#1a1d21` sobre `#fff` | A prancha proíbe QR em cor da marca |
 * | Logo | máx. **20%** da área | Acima disso a correção H não dá conta |
 *
 * E as duas regras que não são números: **nunca sobre foto nem em papel
 * escuro**, e **sempre com o endereço em texto embaixo** — porque quem não
 * consegue escanear não avisa, apenas desiste.
 *
 * ── Por que SVG é o formato de origem ──────────────────────────────────────
 *
 * O casal vai levar isto para uma gráfica. SVG é vetor: imprime em 25mm numa
 * plaquinha de mesa e em 2m num painel, sem serrilhado. O PNG existe para quem
 * precisa colar num editor que não abre vetor.
 */

const OPCOES = {
  errorCorrectionLevel: "H" as const,
  margin: 4,
  color: { dark: "#1a1d21", light: "#ffffff" },
};

/** O endereço público do casamento, sem esquema — ver `LINK_SEM_ESQUEMA`. */
export function enderecoDoSite(base: string, slug: string): string {
  return `${base.replace(/\/+$/, "")}/s/${slug}`;
}

export async function qrEmSvg(url: string): Promise<string> {
  return QRCode.toString(url, { ...OPCOES, type: "svg", width: 512 });
}

export async function qrEmPng(url: string): Promise<Buffer> {
  /* 1024px não é capricho: a prancha pede **300dpi**, e 25mm a 300dpi são
     ~295px. Com 1024 sobra folga para imprimir a plaquinha inteira (105mm) sem
     interpolar. */
  return QRCode.toBuffer(url, { ...OPCOES, width: 1024, type: "png" });
}

/**
 * O endereço como o casal deve COMPARTILHAR — sem `https://` e sem `www`.
 *
 * Regra de S2: *"WhatsApp encurta visualmente e o link fica mais confiável."*
 * Um `https://` no meio da conversa parece link de propaganda; o endereço nu
 * parece endereço.
 */
export function linkSemEsquema(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/^www\./, "");
}
