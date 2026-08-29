/**
 * O encaixe do editor de convite — spec `painel-casal/004`.
 *
 * ── Por que isto é um módulo, e não um trecho do editor ────────────────────
 *
 * `EditorDeConvite.tsx` tem 1.400 linhas e nenhuma delas é testável sem um
 * navegador: tudo ali é `PointerEvent`. O encaixe é a parte que erra em
 * silêncio — gruda no alvo errado, gruda com folga diferente conforme o zoom,
 * ou não gruda e só desenha a guia. Separado, é aritmética, e aritmética se
 * confere.
 *
 * ── O que é "grudar" ───────────────────────────────────────────────────────
 *
 * Corrigir a posição para o alvo, não sinalizar que está perto. Guia que
 * aparece sem grudar é pior que guia nenhuma: ela promete um alinhamento que
 * o arquivo exportado não vai ter.
 *
 * ── Tudo em fração, tolerância também ──────────────────────────────────────
 *
 * O documento inteiro vive em fração (0–1) para o desenho valer em qualquer
 * largura de tela. A tolerância, porém, nasce em PIXELS DE TELA — 6px é a
 * distância que o dedo e o olho reconhecem, e ela não muda quando o casal dá
 * zoom. Quem converte é o editor, que sabe o tamanho da tela e o zoom; aqui
 * ela já chega em fração, e separada por eixo porque o convite não é quadrado.
 */

/** Uma caixa no espaço do convite, em fração. */
export type Caixa = { x: number; y: number; w: number; h: number };

export type Guia = {
  eixo: "x" | "y";
  /** Onde desenhar a linha, em fração do lado correspondente. */
  pos: number;
};

export type Encaixe = {
  /** Novo `x`, se houve encaixe horizontal. */
  x?: number;
  /** Novo `y`, se houve encaixe vertical. */
  y?: number;
  guias: Guia[];
};

/**
 * A prioridade decide quem ganha quando dois alvos cabem na tolerância.
 *
 * O centro do convite vence a borda de um bloco vizinho de propósito: quando
 * as duas coisas estão ao alcance, o que o casal quis foi centralizar. Alinhar
 * com o vizinho é o que sobra quando não dá para centralizar.
 */
type Alvo = { pos: number; prioridade: 1 | 2 | 3 };

/** Os três pontos de uma caixa num eixo: começo, meio, fim. */
const pontosDe = (inicio: number, tamanho: number): number[] => [
  inicio,
  inicio + tamanho / 2,
  inicio + tamanho,
];

function alvosDoEixo(outros: Caixa[], eixo: "x" | "y"): Alvo[] {
  const alvos: Alvo[] = [
    { pos: 0.5, prioridade: 1 }, // o centro do convite
    { pos: 0, prioridade: 2 }, // as bordas
    { pos: 1, prioridade: 2 },
  ];

  for (const o of outros) {
    const inicio = eixo === "x" ? o.x : o.y;
    const tamanho = eixo === "x" ? o.w : o.h;
    for (const p of pontosDe(inicio, tamanho)) {
      alvos.push({ pos: p, prioridade: 3 });
    }
  }

  return alvos;
}

/**
 * O melhor encaixe de um eixo, ou `null`.
 *
 * `moveis` são os pontos do bloco arrastado que podem grudar. No arrasto são
 * os três (borda, centro, borda); no redimensionamento é só a aresta que a
 * mão está puxando — grudar a aresta oposta faria o bloco pular de lugar
 * enquanto muda de tamanho.
 */
function melhorDoEixo(
  moveis: number[],
  alvos: Alvo[],
  tolerancia: number
): { desvio: number; guia: number } | null {
  let escolhido: { desvio: number; guia: number; prioridade: number } | null =
    null;

  for (const alvo of alvos) {
    for (const movel of moveis) {
      const distancia = alvo.pos - movel;
      if (Math.abs(distancia) > tolerancia) continue;

      /* Prioridade primeiro, distância como desempate. Sem a distância, dois
         blocos vizinhos alinhados fariam o encaixe escolher pela ordem da
         lista — e a ordem da lista é a ordem das camadas, que não quer dizer
         nada para quem está arrastando. */
      const melhor =
        !escolhido ||
        alvo.prioridade < escolhido.prioridade ||
        (alvo.prioridade === escolhido.prioridade &&
          Math.abs(distancia) < Math.abs(escolhido.desvio));

      if (melhor) {
        escolhido = {
          desvio: distancia,
          guia: alvo.pos,
          prioridade: alvo.prioridade,
        };
      }
    }
  }

  return escolhido ? { desvio: escolhido.desvio, guia: escolhido.guia } : null;
}

/**
 * Encaixe durante o ARRASTO: a caixa inteira se move, os três pontos de cada
 * eixo podem grudar.
 */
export function encaixarAoMover(
  alvo: Caixa,
  outros: Caixa[],
  tolerancia: { x: number; y: number }
): Encaixe {
  const guias: Guia[] = [];
  const resultado: Encaixe = { guias };

  const h = melhorDoEixo(
    pontosDe(alvo.x, alvo.w),
    alvosDoEixo(outros, "x"),
    tolerancia.x
  );
  if (h) {
    resultado.x = alvo.x + h.desvio;
    guias.push({ eixo: "x", pos: h.guia });
  }

  const v = melhorDoEixo(
    pontosDe(alvo.y, alvo.h),
    alvosDoEixo(outros, "y"),
    tolerancia.y
  );
  if (v) {
    resultado.y = alvo.y + v.desvio;
    guias.push({ eixo: "y", pos: v.guia });
  }

  return resultado;
}

/**
 * Encaixe durante o REDIMENSIONAMENTO da aresta direita.
 *
 * Só a aresta que a mão puxa procura alvo, e o que muda é a LARGURA — o `x`
 * fica onde está. Devolve a largura nova, não a posição.
 */
export function encaixarLargura(
  alvo: Caixa,
  outros: Caixa[],
  tolerancia: number
): { w?: number; guias: Guia[] } {
  const direita = alvo.x + alvo.w;
  const h = melhorDoEixo([direita], alvosDoEixo(outros, "x"), tolerancia);
  if (!h) return { guias: [] };
  return {
    w: alvo.w + h.desvio,
    guias: [{ eixo: "x", pos: h.guia }],
  };
}

/**
 * A tolerância em fração, a partir dos 6px de tela.
 *
 * Em fração fixa o encaixe ficaria frouxo com zoom baixo (6px de tela viram
 * meio convite) e inalcançável com zoom alto. Aqui ela é sempre a mesma
 * distância aparente, que é o que a mão sente.
 *
 * No toque sobe para 10px: o dedo cobre o alvo, e 6px vira uma mira que
 * ninguém acerta.
 */
export const TOLERANCIA_MOUSE = 6;
export const TOLERANCIA_TOQUE = 10;

export function toleranciaEmFracao(
  telaPx: { largura: number; altura: number },
  zoom: number,
  toque: boolean
): { x: number; y: number } {
  const px = toque ? TOLERANCIA_TOQUE : TOLERANCIA_MOUSE;
  /* `telaPx` já vem de `getBoundingClientRect`, que mede COM o zoom aplicado
     — dividir de novo contaria o zoom duas vezes. O parâmetro fica para o
     caso de a medida chegar sem zoom, e o editor passa 1. */
  return {
    x: px / Math.max(telaPx.largura * zoom, 1),
    y: px / Math.max(telaPx.altura * zoom, 1),
  };
}
