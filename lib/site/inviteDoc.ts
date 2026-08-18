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

export const CONVITE_LARGURA = 1080;
export const CONVITE_ALTURA = 1350;

/** Teto de convites por site. O casal pede variações; não pede acervo. */
export const MAX_CONVITES = 5;

export type BlocoTexto = {
  tipo: "texto";
  id: string;
  x: number;
  y: number;
  w: number;
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

export type BlocoFoto = {
  tipo: "foto";
  id: string;
  x: number;
  y: number;
  w: number;
  /** Proporção da caixa (largura/altura). A foto preenche cortando o excesso. */
  proporcao: number;
  /** id em `site_photos`. A foto sai por /f/<id>, nunca por URL do Storage. */
  fotoId: string;
  /** 0 = quadrado, 999 = círculo. */
  raio: number;
};

export type BlocoLinha = {
  tipo: "linha";
  id: string;
  x: number;
  y: number;
  w: number;
  cor: string;
  espessura: number;
};

export type Bloco = BlocoTexto | BlocoFoto | BlocoLinha;

export type InviteDoc = {
  versao: 1;
  fundo: string;
  blocos: Bloco[];
};

const num = (v: unknown, padrao: number): number =>
  typeof v === "number" && Number.isFinite(v) ? v : padrao;

const txt = (v: unknown, padrao: string): string =>
  typeof v === "string" ? v : padrao;

/** Hex de 3 ou 6 dígitos. Qualquer outra coisa cai no padrão. */
const cor = (v: unknown, padrao: string): string =>
  typeof v === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v) ? v : padrao;

const umDe = <T extends string>(v: unknown, opcoes: readonly T[], padrao: T): T =>
  typeof v === "string" && (opcoes as readonly string[]).includes(v)
    ? (v as T)
    : padrao;

function parseBloco(bruto: unknown): Bloco | null {
  if (!bruto || typeof bruto !== "object") return null;
  const b = bruto as Record<string, unknown>;
  const id = txt(b.id, "");
  if (!id) return null;

  const base = { id, x: num(b.x, 0.1), y: num(b.y, 0.1), w: num(b.w, 0.5) };

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
      link: txt(b.link, ""),
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

  return null;
}

export function parseInviteDoc(bruto: unknown): InviteDoc {
  const d = (bruto ?? {}) as Record<string, unknown>;
  const blocos = Array.isArray(d.blocos)
    ? d.blocos.map(parseBloco).filter((b): b is Bloco => b !== null)
    : [];
  return { versao: 1, fundo: cor(d.fundo, "#f2efe7"), blocos };
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
