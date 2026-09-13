import { describe, it, expect } from "vitest";
import { saudacaoDeConvidados, pluralDoConvite } from "./saudacao";

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
