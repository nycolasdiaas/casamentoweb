import { describe, it, expect } from "vitest";
import { mascaraDeWhatsapp, whatsappValido } from "./telefone";

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

describe("whatsappValido", () => {
  it("aceita celular e fixo com DDD, com ou sem máscara", () => {
    expect(whatsappValido("(81) 98765-4321")).toBe(true);
    expect(whatsappValido("81987654321")).toBe(true);
    expect(whatsappValido("(11) 3888-7777")).toBe(true);
  });

  it("aceita com o 55 do país", () => {
    expect(whatsappValido("+55 81 98765-4321")).toBe(true);
    expect(whatsappValido("551138887777")).toBe(true);
  });

  it("recusa número incompleto", () => {
    // Pego em produção em 15/09/2026 (UX-026): "(81) 9" era gravado.
    expect(whatsappValido("(81) 9")).toBe(false);
    expect(whatsappValido("11")).toBe(false);
    expect(whatsappValido("987654321")).toBe(false);
  });

  it("recusa número comprido demais ou 12 dígitos sem o 55", () => {
    expect(whatsappValido("819876543210123")).toBe(false);
    expect(whatsappValido("811987654321")).toBe(false);
  });
});

