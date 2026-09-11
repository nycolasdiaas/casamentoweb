import { describe, it, expect } from "vitest";
import { linhaDeLugar } from "./lugar";

/**
 * A linha de lugar da CAPA — a primeira coisa que o convidado lê no site.
 *
 * Em 11/09/2026 a auditoria abriu um site com "Praça da Sé, 100 — Sé, São
 * Paulo/SP" no endereço da cerimônia, e a capa anunciava, em caixa alta e
 * entreletra larga:
 *
 *     100 — SÉ, SÃO PAULO/SP
 *
 * A regra pegava os dois últimos trechos separados por vírgula, o que funciona
 * para "Rua X, Bairro, Cidade — UF" e falha justamente no formato brasileiro
 * mais comum, em que o número vem logo depois da primeira vírgula (UX-014).
 */

describe("linhaDeLugar", () => {
  it("descarta o número quando ele é o penúltimo trecho", () => {
    expect(linhaDeLugar("Praça da Sé, 100 — Sé, São Paulo/SP")).toBe(
      "São Paulo/SP"
    );
  });

  it("continua devolvendo bairro e cidade quando não há número no meio", () => {
    expect(linhaDeLugar("Rua das Flores, Jardim Paulista, São Paulo — SP")).toBe(
      "Jardim Paulista, São Paulo — SP"
    );
  });

  it("devolve o texto inteiro quando não há vírgula nenhuma", () => {
    expect(linhaDeLugar("Fazenda Santa Rita")).toBe("Fazenda Santa Rita");
  });

  it("corta o que for comprido demais para a capa", () => {
    const gigante = "Rua Muito Comprida, Bairro Com Nome Interminável Mesmo Assim";
    const saida = linhaDeLugar(gigante);
    expect(saida && saida.length).toBeLessThanOrEqual(42);
  });

  it("sem endereço, não inventa linha", () => {
    expect(linhaDeLugar(null)).toBeNull();
    expect(linhaDeLugar("")).toBeNull();
    expect(linhaDeLugar("   ")).toBeNull();
  });

  it("aguenta o endereço com número e complemento", () => {
    expect(linhaDeLugar("Av. Beira Rio, 45, Madalena, Recife/PE")).toBe(
      "Madalena, Recife/PE"
    );
  });
});
