/**
 * O encaixe do editor — spec `painel-casal/004`.
 *
 * O defeito que estes testes prendem é o silencioso: encaixe que gruda no alvo
 * errado, ou que fica frouxo com zoom baixo e inalcançável com zoom alto, ou
 * que desenha a guia sem corrigir a posição. Nenhum deles dá erro; todos saem
 * no convite que o casal manda para a família.
 */

import { describe, it, expect } from "vitest";
import {
  encaixarAoMover,
  encaixarLargura,
  toleranciaEmFracao,
  TOLERANCIA_MOUSE,
  TOLERANCIA_TOQUE,
  type Caixa,
} from "./inviteSnap";

/** Uma tela de 1000×1250 — o 4:5 do convite em números redondos. */
const TELA = { largura: 1000, altura: 1250 };
const tol = (zoom = 1, toque = false) =>
  toleranciaEmFracao(TELA, zoom, toque);

/** Bloco de 20% de largura, centrado em `cx`. */
const bloco = (cx: number, cy: number): Caixa => ({
  x: cx - 0.1,
  y: cy - 0.05,
  w: 0.2,
  h: 0.1,
});

const perto = (a: number, b: number) => Math.abs(a - b) < 1e-9;

describe("SC-001: o centro do convite", () => {
  it("a 5px do centro, o bloco gruda no centro exato", () => {
    // 5px de 1000 = 0.005 em fração; a tolerância de 6px é 0.006.
    const alvo = bloco(0.5 + 0.005, 0.3);
    const r = encaixarAoMover(alvo, [], tol());

    expect(r.x).toBeDefined();
    expect(perto(r.x! + alvo.w / 2, 0.5)).toBe(true);
    expect(r.guias).toContainEqual({ eixo: "x", pos: 0.5 });
  });

  it("a 8px do centro, não gruda — e não desenha guia", () => {
    // Guia que aparece sem grudar promete um alinhamento que o arquivo
    // exportado não vai ter.
    const r = encaixarAoMover(bloco(0.5 + 0.008, 0.3), [], tol());
    expect(r.x).toBeUndefined();
    expect(r.guias).toHaveLength(0);
  });

  it("o centro vertical também", () => {
    const alvo = bloco(0.2, 0.5 + 0.003);
    const r = encaixarAoMover(alvo, [], tol());
    expect(perto(r.y! + alvo.h / 2, 0.5)).toBe(true);
    expect(r.guias).toContainEqual({ eixo: "y", pos: 0.5 });
  });
});

describe("SC-002: a tolerância acompanha o zoom", () => {
  it("com zoom 200%, 5px de TELA continuam grudando", () => {
    /* Em fração fixa, o encaixe ficaria frouxo com zoom baixo e inalcançável
       com zoom alto. O que a mão sente é sempre a mesma distância aparente. */
    const desvioEmFracao = 5 / (1000 * 2); // 5px de tela, com zoom 2
    const alvo = bloco(0.5 + desvioEmFracao, 0.3);
    const r = encaixarAoMover(alvo, [], tol(2));
    expect(perto(r.x! + alvo.w / 2, 0.5)).toBe(true);
  });

  it("com zoom 200%, o que estava perto em fração deixa de grudar", () => {
    // 5px de fração a 100% (0.005) são 10px de tela a 200% — fora da mira.
    const r = encaixarAoMover(bloco(0.5 + 0.005, 0.3), [], tol(2));
    expect(r.x).toBeUndefined();
  });

  it("a tolerância vertical é menor porque o convite é mais alto", () => {
    const t = tol();
    expect(t.x).toBeCloseTo(6 / 1000, 10);
    expect(t.y).toBeCloseTo(6 / 1250, 10);
    expect(t.y).toBeLessThan(t.x);
  });
});

describe("SC-003: alinhar com outro bloco", () => {
  it("a borda esquerda gruda na borda esquerda do vizinho", () => {
    const vizinho: Caixa = { x: 0.3, y: 0.7, w: 0.2, h: 0.1 };
    const alvo: Caixa = { x: 0.3 + 0.004, y: 0.2, w: 0.15, h: 0.1 };

    const r = encaixarAoMover(alvo, [vizinho], tol());
    expect(perto(r.x!, 0.3)).toBe(true);
    expect(r.guias).toContainEqual({ eixo: "x", pos: 0.3 });
  });

  it("centro com centro também alinha", () => {
    const vizinho: Caixa = { x: 0.3, y: 0.7, w: 0.2, h: 0.1 }; // centro 0.4
    const alvo: Caixa = { x: 0.4 - 0.075 + 0.003, y: 0.2, w: 0.15, h: 0.1 };
    const r = encaixarAoMover(alvo, [vizinho], tol());
    expect(perto(r.x! + 0.075, 0.4)).toBe(true);
  });

  it("o bloco arrastado não se alinha consigo mesmo", () => {
    // Quem chama passa só os OUTROS; se o próprio entrasse na lista, todo
    // quadro teria encaixe de desvio zero e nada se moveria.
    const alvo = bloco(0.22, 0.33);
    expect(encaixarAoMover(alvo, [], tol()).guias).toHaveLength(0);
  });
});

describe("SC-004: quem ganha quando dois alvos cabem", () => {
  it("o centro do convite vence a borda do vizinho", () => {
    /* Quando as duas coisas estão ao alcance, o que o casal quis foi
       centralizar. Alinhar com o vizinho é o que sobra. */
    const vizinho: Caixa = { x: 0.398, y: 0.7, w: 0.2, h: 0.1 };
    const alvo: Caixa = { x: 0.4 + 0.001, y: 0.2, w: 0.2, h: 0.1 };

    const r = encaixarAoMover(alvo, [vizinho], tol());
    expect(perto(r.x! + 0.1, 0.5)).toBe(true);
    expect(r.guias).toContainEqual({ eixo: "x", pos: 0.5 });
    expect(r.guias.filter((g) => g.eixo === "x")).toHaveLength(1);
  });

  it("a borda do convite vence a do vizinho", () => {
    const vizinho: Caixa = { x: 0.002, y: 0.7, w: 0.2, h: 0.1 };
    const alvo: Caixa = { x: 0.003, y: 0.2, w: 0.2, h: 0.1 };
    const r = encaixarAoMover(alvo, [vizinho], tol());
    expect(perto(r.x!, 0)).toBe(true);
  });

  it("empate de prioridade é decidido pela menor distância", () => {
    // Dois vizinhos, o mesmo peso: vence o mais perto — e não a ordem da
    // lista, que é a ordem das camadas e não quer dizer nada aqui.
    const longe: Caixa = { x: 0.305, y: 0.7, w: 0.2, h: 0.1 };
    const pertinho: Caixa = { x: 0.301, y: 0.8, w: 0.2, h: 0.1 };
    const alvo: Caixa = { x: 0.3, y: 0.2, w: 0.15, h: 0.1 };

    const r = encaixarAoMover(alvo, [longe, pertinho], tol());
    expect(perto(r.x!, 0.301)).toBe(true);
  });

  it("no máximo um encaixe por eixo", () => {
    const vizinhos: Caixa[] = [
      { x: 0.5, y: 0.5, w: 0.2, h: 0.1 },
      { x: 0.502, y: 0.502, w: 0.2, h: 0.1 },
    ];
    const alvo: Caixa = { x: 0.501, y: 0.501, w: 0.2, h: 0.1 };
    const r = encaixarAoMover(alvo, vizinhos, tol());
    expect(r.guias.filter((g) => g.eixo === "x")).toHaveLength(1);
    expect(r.guias.filter((g) => g.eixo === "y")).toHaveLength(1);
  });
});

describe("SC-009: encaixe ao redimensionar", () => {
  it("a aresta direita gruda na borda direita do convite", () => {
    const alvo: Caixa = { x: 0.4, y: 0.2, w: 0.596, h: 0.1 };
    const r = encaixarLargura(alvo, [], tol().x);
    expect(perto(alvo.x + r.w!, 1)).toBe(true);
    expect(r.guias).toContainEqual({ eixo: "x", pos: 1 });
  });

  it("só a aresta que a mão puxa procura alvo", () => {
    /* Grudar a aresta oposta faria o bloco pular de lugar enquanto muda de
       tamanho — o `x` fica onde está, e o que muda é a largura. */
    const alvo: Caixa = { x: 0.5 + 0.001, y: 0.2, w: 0.2, h: 0.1 };
    const r = encaixarLargura(alvo, [], tol().x);
    // A esquerda está a 1px do centro, mas não é ela que está sendo puxada.
    expect(r.w).toBeUndefined();
  });

  it("a aresta direita alinha com a de um vizinho", () => {
    const vizinho: Caixa = { x: 0.2, y: 0.7, w: 0.4, h: 0.1 }; // direita 0.6
    const alvo: Caixa = { x: 0.1, y: 0.2, w: 0.503, h: 0.1 };
    const r = encaixarLargura(alvo, [vizinho], tol().x);
    expect(perto(alvo.x + r.w!, 0.6)).toBe(true);
  });
});

describe("SC-013: o dedo precisa de mais folga que o mouse", () => {
  it("a 9px de tela o toque gruda, e o mouse não", () => {
    // O dedo cobre o alvo; 6px vira uma mira que ninguém acerta.
    const desvio = 9 / 1000;
    const alvo = bloco(0.5 + desvio, 0.3);

    expect(encaixarAoMover(alvo, [], tol(1, true)).x).toBeDefined();
    expect(encaixarAoMover(alvo, [], tol(1, false)).x).toBeUndefined();
  });

  it("os dois números são os do handoff", () => {
    expect(TOLERANCIA_MOUSE).toBe(6);
    expect(TOLERANCIA_TOQUE).toBe(10);
  });
});

describe("o encaixe é correção, não sugestão", () => {
  it("quando não há alvo, nada muda e nada é desenhado", () => {
    const r = encaixarAoMover(bloco(0.22, 0.33), [], tol());
    expect(r).toEqual({ guias: [] });
  });

  it("a guia sai NA POSIÇÃO DO ALVO, não na do bloco", () => {
    // Desenhar onde o bloco está deixaria a linha 5px fora do alinhamento que
    // ela acabou de produzir.
    const alvo = bloco(0.5 + 0.005, 0.3);
    const r = encaixarAoMover(alvo, [], tol());
    expect(r.guias[0].pos).toBe(0.5);
  });
});
