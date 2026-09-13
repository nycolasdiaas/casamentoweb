import { describe, it, expect } from "vitest";
import { mascaraDeWhatsapp } from "./telefone";

describe("mascaraDeWhatsapp", () => {
  it("formata celular com nove dígitos", () => {
    expect(mascaraDeWhatsapp("11999998888")).toBe("(11) 99999-8888");
  });

  it("formata fixo com oito dígitos", () => {
    expect(mascaraDeWhatsapp("1138887777")).toBe("(11) 3888-7777");
  });

  it("acompanha quem ainda está digitando", () => {
    expect(mascaraDeWhatsapp("1")).toBe("(1");
    expect(mascaraDeWhatsapp("11")).toBe("(11");
    expect(mascaraDeWhatsapp("119")).toBe("(11) 9");
    expect(mascaraDeWhatsapp("11999")).toBe("(11) 999");
    expect(mascaraDeWhatsapp("119999")).toBe("(11) 9999");
    expect(mascaraDeWhatsapp("1199999")).toBe("(11) 9999-9");
  });

  it("ignora o que não é dígito, venha colado de onde vier", () => {
    expect(mascaraDeWhatsapp("+55 (11) 99999-8888")).toBe("(55) 11999-9988");
    expect(mascaraDeWhatsapp("11 99999 8888")).toBe("(11) 99999-8888");
  });

  it("para em onze dígitos", () => {
    expect(mascaraDeWhatsapp("11999998888777")).toBe("(11) 99999-8888");
  });

  it("campo vazio continua vazio — é opcional", () => {
    expect(mascaraDeWhatsapp("")).toBe("");
    expect(mascaraDeWhatsapp("abc")).toBe("");
  });
});
