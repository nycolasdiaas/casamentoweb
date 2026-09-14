import { describe, it, expect } from "vitest";
import {
  saudacaoDeConvidados,
  pluralDoConvite,
  perguntaDosLugares,
} from "./saudacao";

describe("saudacaoDeConvidados", () => {
  it("chama uma pessoa pelo primeiro nome", () => {
    expect(saudacaoDeConvidados(["Antônia Souza"])).toBe("Antônia");
  });

  it("junta duas pessoas com 'e'", () => {
    expect(saudacaoDeConvidados(["Antônia Souza", "José Souza"])).toBe(
      "Antônia e José"
    );
  });

  it("usa vírgula até a última, que leva o 'e'", () => {
    expect(
      saudacaoDeConvidados(["Antônia Souza", "José Souza", "Maria Souza"])
    ).toBe("Antônia, José e Maria");
  });

  it("de quatro em diante, volta a ser neutra", () => {
    expect(
      saudacaoDeConvidados(["Ana", "Bruno", "Carla", "Davi"])
    ).toBeNull();
  });

  it("sem nomes cadastrados, não inventa saudação", () => {
    expect(saudacaoDeConvidados([])).toBeNull();
    expect(saudacaoDeConvidados(null)).toBeNull();
    expect(saudacaoDeConvidados(["  "])).toBeNull();
  });

  it("tratamento não é nome: mantém os dois juntos", () => {
    // Pego na verificação em produção: "Dona Ivete" virava "Dona, você vem?".
    expect(saudacaoDeConvidados(["Dona Ivete"])).toBe("Dona Ivete");
    expect(saudacaoDeConvidados(["Tia Antônia Souza"])).toBe("Tia Antônia");
    expect(saudacaoDeConvidados(["Sr. João Pedro"])).toBe("Sr. João");
    expect(saudacaoDeConvidados(["Vó Maria", "Seu Zé"])).toBe(
      "Vó Maria e Seu Zé"
    );
  });

  it("tratamento sozinho continua sendo o que a pessoa escreveu", () => {
    expect(saudacaoDeConvidados(["Dona"])).toBe("Dona");
  });

  it("aguenta nome com espaço sobrando", () => {
    expect(saudacaoDeConvidados(["  Antônia   Souza  "])).toBe("Antônia");
  });
});

describe("pluralDoConvite", () => {
  it("um lugar é uma pessoa: você vem", () => {
    expect(pluralDoConvite(1)).toEqual({ pronome: "você", verbo: "vem" });
  });

  it("dois ou mais: vocês vêm", () => {
    expect(pluralDoConvite(2)).toEqual({ pronome: "vocês", verbo: "vêm" });
    expect(pluralDoConvite(7)).toEqual({ pronome: "vocês", verbo: "vêm" });
  });

  it("zero lugares não vira plural por acidente", () => {
    expect(pluralDoConvite(0).pronome).toBe("você");
  });
});

describe("perguntaDosLugares", () => {
  it("um lugar não vira 'Quantos dos 1 lugar vão?'", () => {
    // Pego no reteste em produção de 14/09/2026 (UX-022).
    expect(perguntaDosLugares(1)).toBe("Quantas pessoas vão?");
    expect(perguntaDosLugares(1)).not.toMatch(/dos 1/);
  });

  it("dois ou mais continuam contando os lugares", () => {
    expect(perguntaDosLugares(2)).toBe("Quantos dos 2 lugares vão?");
    expect(perguntaDosLugares(7)).toBe("Quantos dos 7 lugares vão?");
  });
});
