/**
 * O formato de um convite desenhado pelo casal.
 *
 * ── Coordenadas em PORCENTAGEM, não em pixels ──────────────────────────────
 *
 * Cada bloco guarda `x`, `y`, `w` como fração da tela do convite (0 a 1). O
 * editor roda numa área que muda de tamanho — notebook, monitor grande,
 * celular deitado — e o export sai em 1080×1350. Com pixels, o convite ficaria
 * certo na tela em que foi feito e torto em todas as outras; com fração, o
 * mesmo desenho vale em qualquer largura, e exportar é só multiplicar.
 *
 * `y` NÃO é limitado a 1: o convite tem altura fixa (4:5), mas deixar o bloco
 * passar um pouco da borda é uma escolha de design legítima (foto sangrando).
 * O que o editor impede é o bloco sumir de vez — ver `prenderNaTela`.
 *
 * ── Por que validar na LEITURA ─────────────────────────────────────────────
 *
 * A coluna é `jsonb`: o banco aceita qualquer coisa. Um convite gravado por
 * uma versão anterior do editor, ou por uma requisição forjada, chegaria aqui
 * com blocos sem tipo, sem posição ou com `w` negativo — e quebraria o render
 * no meio do painel do casal.
 *
 * `parseInviteDoc` descarta o bloco inválido em vez de recusar o convite
 * inteiro: perder um bloco é um convite estranho, que o casal conserta;
 * recusar o documento é o casal perder o trabalho todo.
 */

/**
 * Medida PADRÃO do convite: o retrato 4:5, que WhatsApp e Instagram não cortam.
 *
 * Continua sendo a régua das conversões px↔fração (tamanho de fonte, espessura,
 * raio) mesmo quando o casal escolhe outro formato — se ela mudasse junto, um
 * convite de 2000px de largura teria o texto "40px" com o dobro do tamanho
 * aparente, e o número na barra deixaria de querer dizer alguma coisa.
 *
 * Quem manda no ARQUIVO é `doc.largura`/`doc.altura`; isto é a unidade.
 */
export const CONVITE_LARGURA = 1080;
export const CONVITE_ALTURA = 1350;

/**
 * Teto de cada lado do convite, em px.
 *
 * Acima disso o `sharp` rasteriza um SVG grande demais: 4000×4000 já são 16
 * megapixels, e o casal fica esperando o download de um arquivo que o WhatsApp
 * vai recomprimir de todo jeito. Se um dia precisar de impressão grande, o
 * caminho é PDF vetorial, não um PNG maior.
 */
export const CONVITE_LADO_MAX = 4000;
export const CONVITE_LADO_MIN = 200;

/** Teto de convites por site. O casal pede variações; não pede acervo. */
export const MAX_CONVITES = 5;

/**
 * Campos que todo bloco tem.
 *
 * `rotacao` mora aqui, e não só no texto, porque girar é do BLOCO: uma foto
 * inclinada e uma linha diagonal são pedidos tão comuns quanto um título
 * torto. Em graus, positivo no sentido horário — a mesma convenção do CSS e
 * do SVG, para não haver conversão entre o editor e o export.
 */
export type BlocoBase = {
  id: string;
  x: number;
  y: number;
  w: number;
  rotacao: number;
};

export type BlocoTexto = BlocoBase & {
  tipo: "texto";
  texto: string;
  tamanho: number;
  cor: string;
  fonte: "serif" | "sans" | "script";
  peso: "normal" | "bold";
  alinhamento: "left" | "center" | "right";
  espacamento: number;
  /** Vira <a> no export em PDF e no compartilhamento. Vazio = texto puro. */
  link: string;
};

export type BlocoFoto = BlocoBase & {
  tipo: "foto";
  /** Proporção da caixa (largura/altura). A foto preenche cortando o excesso. */
  proporcao: number;
  /** id em `site_photos`. A foto sai por /f/<id>, nunca por URL do Storage. */
  fotoId: string;
  /** 0 = quadrado, 999 = círculo. */
  raio: number;
};

export type BlocoLinha = BlocoBase & {
  tipo: "linha";
  cor: string;
  espessura: number;
};

/**
 * As formas que o casal pode acrescentar.
 *
 * O conjunto é fechado de propósito: são as que dão para desenhar em SVG e em
 * CSS com a MESMA geometria, para o que ele vê no editor ser o que sai no
 * arquivo. Curva de Bézier livre exigiria um editor de nós — outro produto.
 */
export const FORMAS = [
  "retangulo",
  "arredondado",
  "circulo",
  "triangulo",
  "triangulo-baixo",
  "losango",
  "pentagono",
  "hexagono",
] as const;

export type FormaId = (typeof FORMAS)[number];

export type BlocoForma = BlocoBase & {
  tipo: "forma";
  forma: FormaId;
  /** largura/altura da caixa. 1 = quadrada. */
  proporcao: number;
  /** Vazio = sem preenchimento (só contorno). */
  preenchimento: string;
  contorno: string;
  /** 0 = sem contorno. Em px do convite de 1080. */
  espessura: number;
  /** 0..1. Deixa a forma virar fundo sem tapar o texto. */
  opacidade: number;
  /** Só vale em "arredondado". Em px do convite de 1080. */
  raio: number;
};

export type Bloco = BlocoTexto | BlocoFoto | BlocoLinha | BlocoForma;

export type InviteDoc = {
  versao: 1;
  fundo: string;
  /**
   * Medida do arquivo exportado, em px. Os blocos NÃO se mexem quando ela
   * muda: as coordenadas são fração, então o desenho reflui sozinho para o
   * novo formato. É o que permite experimentar retrato, quadrado e story sem
   * refazer o convite.
   */
  largura: number;
  altura: number;
  blocos: Bloco[];
};

const num = (v: unknown, padrao: number): number =>
  typeof v === "number" && Number.isFinite(v) ? v : padrao;

const txt = (v: unknown, padrao: string): string =>
  typeof v === "string" ? v : padrao;

/** Hex de 3 ou 6 dígitos. Qualquer outra coisa cai no padrão. */
const cor = (v: unknown, padrao: string): string =>
  typeof v === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v) ? v : padrao;

/**
 * Aceita só o que é seguro clicar.
 *
 * O campo é digitado à mão ("outro endereço"), e um convite publicado é
 * página aberta: `javascript:` num `<a>` seria script executando no navegador
 * do convidado. Então a lista é fechada — http, https, mailto, tel — e
 * caminho relativo do próprio site.
 *
 * Endereço sem esquema ("enlace.com.br/s/x") vira `https://`: é o que a
 * pessoa quis dizer, e sem isso o navegador trata como caminho relativo e cai
 * numa página que não existe.
 */
const ESQUEMAS_OK = /^(https?:|mailto:|tel:)/i;

const linkSeguro = (v: unknown): string => {
  if (typeof v !== "string") return "";
  const t = v.trim();
  if (!t) return "";
  if (t.startsWith("/")) return t;
  if (ESQUEMAS_OK.test(t)) return t;
  // Tem esquema, mas não é um dos aceitos (javascript:, data:, file:…).
  if (/^[a-z][a-z0-9+.-]*:/i.test(t)) return "";
  return `https://${t}`;
};

const umDe = <T extends string>(v: unknown, opcoes: readonly T[], padrao: T): T =>
  typeof v === "string" && (opcoes as readonly string[]).includes(v)
    ? (v as T)
    : padrao;

function parseBloco(bruto: unknown): Bloco | null {
  if (!bruto || typeof bruto !== "object") return null;
  const b = bruto as Record<string, unknown>;
  const id = txt(b.id, "");
  if (!id) return null;

  const base = {
    id,
    x: num(b.x, 0.1),
    y: num(b.y, 0.1),
    w: num(b.w, 0.5),
    rotacao: num(b.rotacao, 0),
  };

  if (b.tipo === "texto") {
    return {
      ...base,
      tipo: "texto",
      texto: txt(b.texto, ""),
      tamanho: num(b.tamanho, 0.04),
      cor: cor(b.cor, "#1a1d21"),
      fonte: umDe(b.fonte, ["serif", "sans", "script"] as const, "serif"),
      peso: umDe(b.peso, ["normal", "bold"] as const, "normal"),
      alinhamento: umDe(
        b.alinhamento,
        ["left", "center", "right"] as const,
        "center"
      ),
      espacamento: num(b.espacamento, 0),
      link: linkSeguro(b.link),
    };
  }

  if (b.tipo === "foto") {
    const fotoId = txt(b.fotoId, "");
    // Bloco de foto sem foto não desenha nada e não é editável: some.
    if (!fotoId) return null;
    return {
      ...base,
      tipo: "foto",
      proporcao: num(b.proporcao, 1),
      fotoId,
      raio: num(b.raio, 0),
    };
  }

  if (b.tipo === "linha") {
    return {
      ...base,
      tipo: "linha",
      cor: cor(b.cor, "#b8985f"),
      espessura: num(b.espessura, 2),
    };
  }

  if (b.tipo === "forma") {
    return {
      ...base,
      tipo: "forma",
      forma: umDe(b.forma, FORMAS, "retangulo"),
      proporcao: num(b.proporcao, 1),
      // Preenchimento vazio é válido: é a forma só de contorno. Por isso o
      // campo aceita "" e não cai no padrão como as outras cores.
      preenchimento:
        b.preenchimento === "" ? "" : cor(b.preenchimento, "#b8985f"),
      contorno: b.contorno === "" ? "" : cor(b.contorno, "#b8985f"),
      espessura: num(b.espessura, 0),
      opacidade: Math.min(Math.max(num(b.opacidade, 1), 0), 1),
      raio: num(b.raio, 24),
    };
  }

  return null;
}

/** Prende o lado entre o mínimo e o máximo, arredondando para px inteiro. */
export function ladoValido(v: unknown, padrao: number): number {
  const n = num(v, padrao);
  return Math.round(
    Math.min(Math.max(n, CONVITE_LADO_MIN), CONVITE_LADO_MAX)
  );
}

export function parseInviteDoc(bruto: unknown): InviteDoc {
  const d = (bruto ?? {}) as Record<string, unknown>;
  // A ORDEM da lista é a ordem de empilhamento: quem vem depois desenha por
  // cima. Vale no editor e no SVG do export, e é o que faz "camadas"
  // funcionar sem coluna nova — reordenar a lista É mudar a camada.
  const blocos = Array.isArray(d.blocos)
    ? d.blocos.map(parseBloco).filter((b): b is Bloco => b !== null)
    : [];
  return {
    versao: 1,
    fundo: cor(d.fundo, "#f2efe7"),
    // Convite gravado antes do formato variável não tem os campos: cai no
    // 4:5 de sempre, e o casal não vê diferença nenhuma.
    largura: ladoValido(d.largura, CONVITE_LARGURA),
    altura: ladoValido(d.altura, CONVITE_ALTURA),
    blocos,
  };
}

/**
 * Mantém o bloco alcançável.
 *
 * Sem isto, arrastar um bloco para fora da área o torna impossível de pegar de
 * volta — ele existe, conta para o export e não dá para selecionar. Deixamos
 * sangrar até 90% para fora (foto de fundo é desenho legítimo), mas nunca o
 * bloco inteiro.
 */
export function prenderNaTela<T extends { x: number; y: number; w: number }>(
  bloco: T
): T {
  const w = Math.min(Math.max(bloco.w, 0.05), 2);
  return {
    ...bloco,
    w,
    x: Math.min(Math.max(bloco.x, -w * 0.9), 1 - w * 0.1),
    y: Math.min(Math.max(bloco.y, -0.4), 0.98),
  };
}

export function novoId(): string {
  return Math.random().toString(36).slice(2, 10);
}
