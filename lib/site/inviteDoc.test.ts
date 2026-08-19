import { describe, it, expect } from "vitest";
import {
  CONVITE_ALTURA,
  CONVITE_LARGURA,
  ladoValido,
  parseInviteDoc,
  prenderNaTela,
} from "./inviteDoc";
import { quebrarLinhas } from "./inviteRender";
import { clipPathDe, pontos } from "./inviteShapes";

/**
 * O documento do convite vem do NAVEGADOR e mora numa coluna `jsonb`, que não
 * garante forma nenhuma. Estes testes cobrem o que acontece quando chega algo
 * que o editor não produziria.
 */
describe("parseInviteDoc", () => {
  it("descarta o bloco inválido em vez de recusar o convite inteiro", () => {
    const doc = parseInviteDoc({
      versao: 1,
      fundo: "#ffffff",
      blocos: [
        { tipo: "texto", id: "a", texto: "Oi" },
        { tipo: "invenção", id: "b" },
        null,
        "texto solto",
        { tipo: "texto" }, // sem id
      ],
    });
    expect(doc.blocos).toHaveLength(1);
    expect(doc.blocos[0].id).toBe("a");
  });

  it("recusa cor que não é hex e cai no padrão", () => {
    // `url(...)` num campo de cor viraria CSS arbitrário no SVG do export.
    const doc = parseInviteDoc({
      fundo: "url(javascript:alert(1))",
      blocos: [{ tipo: "texto", id: "a", texto: "x", cor: "red; x:y" }],
    });
    expect(doc.fundo).toBe("#f2efe7");
    expect((doc.blocos[0] as { cor: string }).cor).toBe("#1a1d21");
  });

  it("bloco de foto sem foto some", () => {
    const doc = parseInviteDoc({
      blocos: [{ tipo: "foto", id: "a", fotoId: "" }],
    });
    expect(doc.blocos).toHaveLength(0);
  });

  it("aceita documento vazio ou lixo sem estourar", () => {
    expect(parseInviteDoc(null).blocos).toEqual([]);
    expect(parseInviteDoc("nada").blocos).toEqual([]);
    expect(parseInviteDoc({ blocos: "nem lista" }).blocos).toEqual([]);
  });
});

describe("formas", () => {
  it("aceita as oito e cai no retângulo quando a forma não existe", () => {
    const doc = parseInviteDoc({
      blocos: [
        { tipo: "forma", id: "a", forma: "hexagono" },
        { tipo: "forma", id: "b", forma: "octógono-imaginário" },
      ],
    });
    expect((doc.blocos[0] as { forma: string }).forma).toBe("hexagono");
    expect((doc.blocos[1] as { forma: string }).forma).toBe("retangulo");
  });

  it("preenchimento vazio é válido — é a forma só de contorno", () => {
    const doc = parseInviteDoc({
      blocos: [{ tipo: "forma", id: "a", preenchimento: "", espessura: 4 }],
    });
    expect((doc.blocos[0] as { preenchimento: string }).preenchimento).toBe("");
  });

  it("prende a opacidade entre 0 e 1", () => {
    const doc = parseInviteDoc({
      blocos: [
        { tipo: "forma", id: "a", opacidade: 9 },
        { tipo: "forma", id: "b", opacidade: -3 },
      ],
    });
    expect((doc.blocos[0] as { opacidade: number }).opacidade).toBe(1);
    expect((doc.blocos[1] as { opacidade: number }).opacidade).toBe(0);
  });

  it("a geometria do polígono é a MESMA no CSS e no SVG", () => {
    // O editor desenha com clip-path e o export com <polygon>. Se os vértices
    // divergissem, o casal receberia um convite diferente do que desenhou.
    const p = pontos("losango")!;
    expect(clipPathDe("losango")).toBe(
      `polygon(${p.map(([x, y]) => `${x * 100}% ${y * 100}%`).join(", ")})`
    );
    // Retângulo e círculo não são polígonos: têm primitiva própria dos dois
    // lados (border-radius / <rect>, <ellipse>).
    expect(clipPathDe("circulo")).toBeNull();
    expect(clipPathDe("retangulo")).toBeNull();
  });
});

describe("rotação", () => {
  it("todo bloco nasce com rotação, e lixo vira zero", () => {
    const doc = parseInviteDoc({
      blocos: [
        { tipo: "texto", id: "a", texto: "x", rotacao: 45 },
        { tipo: "linha", id: "b", rotacao: "muito" },
      ],
    });
    expect(doc.blocos[0].rotacao).toBe(45);
    expect(doc.blocos[1].rotacao).toBe(0);
  });
});

describe("links", () => {
  it("recusa esquema perigoso — o convite publicado é página aberta", () => {
    // Um `javascript:` num <a> seria script rodando no navegador do
    // convidado, e o campo é digitado à mão.
    const doc = parseInviteDoc({
      blocos: [
        { tipo: "texto", id: "a", texto: "x", link: "javascript:alert(1)" },
        { tipo: "texto", id: "b", texto: "x", link: "data:text/html,<script>" },
      ],
    });
    expect((doc.blocos[0] as { link: string }).link).toBe("");
    expect((doc.blocos[1] as { link: string }).link).toBe("");
  });

  it("completa o esquema de quem digitou só o domínio", () => {
    const doc = parseInviteDoc({
      blocos: [{ tipo: "texto", id: "a", texto: "x", link: "enlace.com.br/s/ana" }],
    });
    expect((doc.blocos[0] as { link: string }).link).toBe(
      "https://enlace.com.br/s/ana"
    );
  });

  it("mantém http — em desenvolvimento o servidor não fala https", () => {
    // Bug real: o convite semeado montava `https://${endereco}` e o link para
    // o site local dava ERR_SSL_PROTOCOL_ERROR.
    const doc = parseInviteDoc({
      blocos: [
        { tipo: "texto", id: "a", texto: "x", link: "http://localhost:3000/s/ana" },
        { tipo: "texto", id: "b", texto: "x", link: "/s/ana#presentes" },
        { tipo: "texto", id: "c", texto: "x", link: "mailto:ana@exemplo.com" },
      ],
    });
    expect((doc.blocos[0] as { link: string }).link).toBe("http://localhost:3000/s/ana");
    expect((doc.blocos[1] as { link: string }).link).toBe("/s/ana#presentes");
    expect((doc.blocos[2] as { link: string }).link).toBe("mailto:ana@exemplo.com");
  });
});

describe("formato do convite", () => {
  it("convite antigo, sem medida gravada, continua 4:5", () => {
    // Os convites criados antes do formato variável não têm os campos. Cair
    // no padrão é o que impede um convite existente virar 0×0.
    const doc = parseInviteDoc({ blocos: [] });
    expect(doc.largura).toBe(CONVITE_LARGURA);
    expect(doc.altura).toBe(CONVITE_ALTURA);
  });

  it("prende a medida entre o mínimo e o máximo", () => {
    // Acima do teto o sharp rasteriza um SVG grande demais e o casal fica
    // esperando; abaixo do piso não dá para ler nada.
    expect(ladoValido(99999, 1080)).toBe(4000);
    expect(ladoValido(10, 1080)).toBe(200);
    expect(ladoValido("nada", 1080)).toBe(1080);
    expect(ladoValido(1080.7, 1080)).toBe(1081);
  });

  it("aceita uma resolução própria", () => {
    const doc = parseInviteDoc({ largura: 1600, altura: 900, blocos: [] });
    expect([doc.largura, doc.altura]).toEqual([1600, 900]);
  });
});

describe("camadas", () => {
  it("a ordem da lista é a ordem de empilhamento", () => {
    // É o que faz camadas funcionarem sem coluna nova: reordenar o array É
    // mudar quem fica na frente, no editor e no arquivo exportado.
    const doc = parseInviteDoc({
      blocos: [
        { tipo: "texto", id: "fundo", texto: "atrás" },
        { tipo: "texto", id: "frente", texto: "na frente" },
      ],
    });
    expect(doc.blocos.map((b) => b.id)).toEqual(["fundo", "frente"]);
  });
});

describe("prenderNaTela", () => {
  it("deixa o bloco sangrar, mas nunca sumir de vez", () => {
    const fora = prenderNaTela({ x: -5, y: -9, w: 0.5 });
    expect(fora.x).toBeGreaterThan(-0.5);
    expect(fora.y).toBeGreaterThanOrEqual(-0.4);

    const longe = prenderNaTela({ x: 9, y: 9, w: 0.5 });
    expect(longe.x).toBeLessThan(1);
    expect(longe.y).toBeLessThanOrEqual(0.98);
  });

  it("mantém a largura utilizável", () => {
    expect(prenderNaTela({ x: 0, y: 0, w: 0 }).w).toBeGreaterThan(0);
    expect(prenderNaTela({ x: 0, y: 0, w: 99 }).w).toBeLessThanOrEqual(2);
  });
});

describe("quebrarLinhas", () => {
  it("parte a palavra que não cabe — senão ela atravessa o convite", () => {
    // Caso real: o nome do casal era uma URL, e saiu numa linha só,
    // ultrapassando os dois lados da imagem exportada.
    const linhas = quebrarLinhas(
      "https://github.com/acme/repositorio/pull/19",
      600,
      90,
      "serif"
    );
    expect(linhas.length).toBeGreaterThan(1);
    for (const l of linhas) expect(l.length).toBeLessThanOrEqual(14);
  });

  it("respeita a quebra que o casal escreveu", () => {
    expect(quebrarLinhas("Ana\ne Pedro", 900, 40, "serif")).toEqual([
      "Ana",
      "e Pedro",
    ]);
  });
});
