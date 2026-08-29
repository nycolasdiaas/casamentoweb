/**
 * Trocar o modelo do convite — spec `painel-casal/007`.
 *
 * A pergunta que esta spec tinha em aberto era o que "trocar de modelo"
 * significa. A resposta escolhida (Opção A) é: **cor e fonte, nunca o
 * desenho**. A outra leitura — clicar num modelo e receber o desenho dele,
 * como num Canva — apagaria o trabalho do casal num clique, e pressupõe seis
 * layouts de convite que não existem.
 *
 * O teste mais importante deste arquivo é o da cor escolhida à mão. É ele que
 * separa "re-tematizar" de "sobrescrever" — e sobrescrever é a ferramenta
 * discutindo com quem já tinha decidido.
 */

import { describe, it, expect } from "vitest";
import { parseInviteDoc, type InviteDoc } from "./inviteDoc";
import { retematizarConvite } from "./inviteTema";
import type { ThemePalette } from "@/lib/theme/spec";

const CLASSICO: ThemePalette = {
  outer: "#232514",
  paper: "#f2efe7",
  ink: "#3d4a36",
  accent: "#b8985f",
};

const ROMANTICO: ThemePalette = {
  outer: "#2b1f22",
  paper: "#fdf2f4",
  ink: "#7c4a55",
  accent: "#d9a3ae",
};

/** Um convite semeado: todas as cores vindas do tema. */
const doTema = (): InviteDoc =>
  parseInviteDoc({
    fundo: CLASSICO.paper,
    largura: 1080,
    altura: 1350,
    blocos: [
      {
        id: "t1",
        tipo: "texto",
        x: 0.1,
        y: 0.2,
        w: 0.8,
        rotacao: 0,
        texto: "Ana & Pedro",
        cor: CLASSICO.ink,
        link: "",
      },
      { id: "l1", tipo: "linha", x: 0.4, y: 0.4, w: 0.2, cor: CLASSICO.accent },
      {
        id: "b1",
        tipo: "botao",
        x: 0.2,
        y: 0.8,
        w: 0.6,
        destino: "rsvp",
        fundo: CLASSICO.ink,
        cor: CLASSICO.paper,
      },
      {
        id: "f1",
        tipo: "forma",
        x: 0.1,
        y: 0.5,
        w: 0.3,
        forma: "circulo",
        preenchimento: CLASSICO.accent,
        contorno: CLASSICO.accent,
      },
    ],
  });

const bloco = (d: InviteDoc, id: string) => d.blocos.find((b) => b.id === id)!;

describe("SC-004: o convite semeado troca inteiro", () => {
  it("cada papel do tema vira o papel correspondente do tema novo", () => {
    const d = retematizarConvite(doTema(), CLASSICO, ROMANTICO);

    expect(d.fundo).toBe(ROMANTICO.paper);
    expect(bloco(d, "t1")).toMatchObject({ cor: ROMANTICO.ink });
    expect(bloco(d, "l1")).toMatchObject({ cor: ROMANTICO.accent });
    expect(bloco(d, "b1")).toMatchObject({
      fundo: ROMANTICO.ink,
      cor: ROMANTICO.paper,
    });
    expect(bloco(d, "f1")).toMatchObject({
      preenchimento: ROMANTICO.accent,
      contorno: ROMANTICO.accent,
    });
  });

  it("a comparação não diferencia maiúscula de minúscula", () => {
    /* O `<input type="color">` devolve minúsculas, mas os presets e um `doc`
       gravado por versão antiga podem trazer `#B8985F`. Sem isto, a mesma cor
       em caixa diferente sobreviveria à troca por engano. */
    const d = retematizarConvite(
      parseInviteDoc({
        blocos: [{ id: "l1", tipo: "linha", cor: "#B8985F" }],
      }),
      CLASSICO,
      ROMANTICO
    );
    expect(bloco(d, "l1")).toMatchObject({ cor: ROMANTICO.accent });
  });
});

describe("SC-005: a cor escolhida à mão sobrevive", () => {
  it("um bloco em `#123456` continua `#123456`", () => {
    const antes = doTema();
    const comEscolha: InviteDoc = {
      ...antes,
      blocos: antes.blocos.map((b) =>
        b.id === "t1" && b.tipo === "texto" ? { ...b, cor: "#123456" } : b
      ),
    };

    const d = retematizarConvite(comEscolha, CLASSICO, ROMANTICO);

    expect(bloco(d, "t1")).toMatchObject({ cor: "#123456" });
    // E o resto trocou normalmente: a preservação é do bloco, não do convite.
    expect(bloco(d, "l1")).toMatchObject({ cor: ROMANTICO.accent });
  });

  it("preenchimento vazio continua vazio — é a forma só de contorno", () => {
    const d = retematizarConvite(
      parseInviteDoc({
        blocos: [
          {
            id: "f1",
            tipo: "forma",
            forma: "retangulo",
            preenchimento: "",
            contorno: CLASSICO.accent,
          },
        ],
      }),
      CLASSICO,
      ROMANTICO
    );
    expect(bloco(d, "f1")).toMatchObject({
      preenchimento: "",
      contorno: ROMANTICO.accent,
    });
  });
});

describe("SC-008: o desenho não é tocado", () => {
  it("formato, posição, tamanho, rotação e texto são idênticos", () => {
    const antes = doTema();
    const depois = retematizarConvite(antes, CLASSICO, ROMANTICO);

    expect(depois.largura).toBe(antes.largura);
    expect(depois.altura).toBe(antes.altura);

    const geometria = (d: InviteDoc) =>
      d.blocos.map((b) => ({
        id: b.id,
        tipo: b.tipo,
        x: b.x,
        y: b.y,
        w: b.w,
        rotacao: b.rotacao,
      }));
    expect(geometria(depois)).toEqual(geometria(antes));

    const t = bloco(depois, "t1");
    expect(t.tipo === "texto" && t.texto).toBe("Ana & Pedro");
  });

  it("a ordem das camadas é a mesma", () => {
    const antes = doTema();
    const depois = retematizarConvite(antes, CLASSICO, ROMANTICO);
    expect(depois.blocos.map((b) => b.id)).toEqual(
      antes.blocos.map((b) => b.id)
    );
  });

  it("foto atravessa intacta — ela não tem cor", () => {
    const d = retematizarConvite(
      parseInviteDoc({
        blocos: [
          { id: "p1", tipo: "foto", fotoId: "abc", raio: 12, proporcao: 1.5 },
        ],
      }),
      CLASSICO,
      ROMANTICO
    );
    expect(bloco(d, "p1")).toMatchObject({
      fotoId: "abc",
      raio: 12,
      proporcao: 1.5,
    });
  });
});

describe("trocar duas vezes", () => {
  it("volta ao original quando se troca de volta", () => {
    const original = doTema();
    const ida = retematizarConvite(original, CLASSICO, ROMANTICO);
    const volta = retematizarConvite(ida, ROMANTICO, CLASSICO);
    expect(volta).toEqual(original);
  });

  it("trocar para o MESMO tema não muda nada", () => {
    const original = doTema();
    expect(retematizarConvite(original, CLASSICO, CLASSICO)).toEqual(original);
  });
});
