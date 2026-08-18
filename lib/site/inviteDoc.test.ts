import { describe, it, expect } from "vitest";
import { parseInviteDoc, prenderNaTela } from "./inviteDoc";
import { quebrarLinhas } from "./inviteRender";

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
