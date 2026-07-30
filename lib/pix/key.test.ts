import { describe, it, expect } from "vitest";
import { parsePixKey } from "./key";

// Chave errada não dá erro na tela: o convidado paga e o dinheiro vai para
// outro lugar, ou para lugar nenhum. Daí a validação por tipo.

function ok(bruta: string) {
  const r = parsePixKey(bruta);
  if (!r.ok) throw new Error(`esperava aceitar "${bruta}": ${r.error}`);
  return r;
}

describe("parsePixKey", () => {
  it("aceita CPF válido e guarda só os dígitos", () => {
    // 529.982.247-25 é um CPF com dígitos verificadores corretos.
    expect(ok("529.982.247-25")).toMatchObject({
      type: "cpf",
      normalizada: "52998224725",
    });
  });

  it("recusa CPF com dígito verificador errado", () => {
    // Precisa falhar nos DOIS testes de 11 dígitos: DDD 10 não existe (o
    // menor é 11), então não é celular, e os verificadores não fecham.
    const r = parsePixKey("101.234.567-89");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toContain("11 dígitos");
  });

  it("recusa CPF de dígitos repetidos", () => {
    expect(parsePixKey("111.111.111-11").ok).toBe(false);
  });

  it("aceita CNPJ válido", () => {
    expect(ok("11.222.333/0001-81")).toMatchObject({
      type: "cnpj",
      normalizada: "11222333000181",
    });
  });

  it("recusa CNPJ inválido", () => {
    expect(parsePixKey("11.222.333/0001-99").ok).toBe(false);
  });

  it("aceita e-mail e normaliza para minúsculas", () => {
    expect(ok("Casal@Enlace.COM.br")).toMatchObject({
      type: "email",
      normalizada: "casal@enlace.com.br",
    });
  });

  it("recusa e-mail acima do limite do Pix", () => {
    expect(parsePixKey("a".repeat(70) + "@enlace.com.br").ok).toBe(false);
  });

  // O celular precisa sair com +55: banco recusa o formato local.
  it("aceita celular com DDD e devolve com +55", () => {
    expect(ok("(21) 98260-5543")).toMatchObject({
      type: "telefone",
      normalizada: "+5521982605543",
    });
  });

  it("aceita celular já com o 55 na frente", () => {
    expect(ok("5521982605543").normalizada).toBe("+5521982605543");
  });

  it("recusa fixo (sem o 9)", () => {
    // 8 dígitos após o DDD, sem o 9 — não é chave Pix de celular.
    const r = parsePixKey("(21) 3260-5543");
    expect(r.ok).toBe(false);
  });

  it("aceita chave aleatória (UUID) e normaliza para minúsculas", () => {
    expect(ok("56B27F87-DB13-4C38-9B1E-E419B1247287")).toMatchObject({
      type: "aleatoria",
      normalizada: "56b27f87-db13-4c38-9b1e-e419b1247287",
    });
  });

  it("recusa vazio e só espaço", () => {
    for (const v of ["", "   "]) {
      const r = parsePixKey(v);
      expect(r.ok).toBe(false);
      if (r.ok) return;
      expect(r.error).toContain("Informem");
    }
  });

  it("recusa lixo", () => {
    for (const v of ["minha chave", "1234", "http://enlace.com.br"]) {
      expect(parsePixKey(v).ok, v).toBe(false);
    }
  });

  // Ambiguidade real: 11 dígitos podem ser CPF ou celular sem o 9. A mensagem
  // precisa dizer as duas coisas, senão o casal fica sem saber o que corrigir.
  it("resolve a ambiguidade de 11 dígitos pelo dígito verificador", () => {
    // CPF válido cujo 3º dígito é 9 — passaria pelo teste de celular se o
    // CPF não fosse checado primeiro.
    expect(ok("529.982.247-25").type).toBe("cpf");
    // Não é CPF válido, mas é celular plausível: vira telefone.
    expect(ok("21982605543").type).toBe("telefone");
  });
});
