import { describe, it, expect } from "vitest";
import { buildBrCode, crc16, normalizarTexto } from "./brcode";

/**
 * Corta o payload em campos TLV para conferir campo a campo, em vez de comparar
 * strings gigantes — quando um teste falha, o diff diz QUAL campo saiu errado.
 */
function lerTlv(payload: string): Record<string, string> {
  const campos: Record<string, string> = {};
  let i = 0;
  while (i < payload.length) {
    const id = payload.slice(i, i + 2);
    const tamanho = Number(payload.slice(i + 2, i + 4));
    campos[id] = payload.slice(i + 4, i + 4 + tamanho);
    i += 4 + tamanho;
  }
  return campos;
}

const CASAL = {
  chave: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  recebedor: "Ana Paula Souza",
  cidade: "Fortaleza",
};

describe("crc16", () => {
  // Vetor de verificação oficial do CRC-16/CCITT-FALSE. Se este caso quebrar,
  // o algoritmo está errado e TODO código gerado é recusado no app do banco.
  it("bate com o check value do padrão", () => {
    expect(crc16("123456789")).toBe("29B1");
  });

  // Âncora de realidade: este é o BR Code que estava chumbado em lib/pix.ts e
  // rodou em produção — um pagamento de verdade passou por ele. Reproduzir o
  // CRC dele prova que a implementação serve para um payload Pix inteiro, e
  // não só para o vetor sintético acima.
  it("reproduz o CRC de um BR Code que funcionou em produção", () => {
    const producao =
      "00020126580014br.gov.bcb.pix013656b27f87-db13-4c38-9b1e-e419b12472875204000053039865802BR5924FRANCISCO NYCOLAS SALES 6009Sao Paulo62230519daqr7744428554160556304A33A";
    expect(crc16(producao.slice(0, -4))).toBe("A33A");
  });

  it("sempre devolve 4 dígitos hexadecimais maiúsculos", () => {
    for (const entrada of ["", "a", "payload qualquer", "0".repeat(500)]) {
      expect(crc16(entrada)).toMatch(/^[0-9A-F]{4}$/);
    }
  });
});

describe("normalizarTexto", () => {
  it("tira acento sem comer a letra", () => {
    // O erro clássico: filtrar não-ASCII sem NFD antes transforma JOÃO em JOO.
    expect(normalizarTexto("João Conceição", 25)).toBe("JOAO CONCEICAO");
  });

  it("corta na última palavra inteira que cabe", () => {
    // 25 é o máximo do campo 59, 15 o do campo 60. O app do banco mostra este
    // nome na confirmação: "...SALES D" pareceria defeito.
    expect(normalizarTexto("Francisco Nycolas Sales Dias", 25)).toBe(
      "FRANCISCO NYCOLAS SALES"
    );
    expect(normalizarTexto("Maria Silva Antunes Rocha", 15)).toBe("MARIA SILVA");
  });

  it("corta no seco quando nem a primeira palavra cabe", () => {
    // Estética perde para o limite: campo acima do máximo é QR recusado.
    expect(normalizarTexto("Wolfeschlegelsteinhausenberger", 15)).toBe(
      "WOLFESCHLEGELST"
    );
  });

  it("descarta pontuação, que o padrão não aceita", () => {
    expect(normalizarTexto("Ana & Pedro (noivos)", 25)).toBe("ANA PEDRO NOIVOS");
  });
});

describe("buildBrCode", () => {
  it("monta os campos obrigatórios na ordem do padrão", () => {
    const campos = lerTlv(buildBrCode(CASAL));

    expect(campos["00"]).toBe("01"); // versão
    expect(campos["52"]).toBe("0000"); // MCC não informado
    expect(campos["53"]).toBe("986"); // BRL
    expect(campos["58"]).toBe("BR");
    expect(campos["59"]).toBe("ANA PAULA SOUZA");
    expect(campos["60"]).toBe("FORTALEZA");

    const conta = lerTlv(campos["26"]);
    expect(conta["00"]).toBe("br.gov.bcb.pix");
    expect(conta["01"]).toBe(CASAL.chave);
  });

  it("embute o valor da cota — a razão de existir deste módulo", () => {
    // A string estática que estava chumbada em lib/pix.ts não tinha campo 54,
    // então o convidado digitava o preço à mão (e errava).
    const campos = lerTlv(buildBrCode({ ...CASAL, valorCentavos: 18000 }));
    expect(campos["54"]).toBe("180.00");
  });

  it("formata centavos quebrados com duas casas e ponto", () => {
    // Vírgula aqui é recusa no app do banco.
    const campos = lerTlv(buildBrCode({ ...CASAL, valorCentavos: 9990 }));
    expect(campos["54"]).toBe("99.90");
  });

  it("omite o valor quando a cota é 'você decide'", () => {
    // formatPriceCents já trata preço nulo como "você decide"; aqui o efeito
    // é o app abrir com o campo de valor livre, e não com R$ 0,00.
    for (const valor of [null, undefined, 0]) {
      const campos = lerTlv(buildBrCode({ ...CASAL, valorCentavos: valor }));
      expect(campos["54"]).toBeUndefined();
    }
  });

  it("fecha com um CRC que confere sobre o próprio payload", () => {
    const codigo = buildBrCode({ ...CASAL, valorCentavos: 5000 });
    const corpo = codigo.slice(0, -4);
    expect(corpo.endsWith("6304")).toBe(true);
    expect(codigo.slice(-4)).toBe(crc16(corpo));
  });

  it("usa *** quando não há identificador de cota", () => {
    const campos = lerTlv(buildBrCode(CASAL));
    expect(lerTlv(campos["62"])["05"]).toBe("***");
  });

  it("limpa o txid e cai em *** se não sobrar nada", () => {
    const comId = lerTlv(buildBrCode({ ...CASAL, txid: "cota-42" }));
    expect(lerTlv(comId["62"])["05"]).toBe("cota42");

    const soSimbolo = lerTlv(buildBrCode({ ...CASAL, txid: "---" }));
    expect(lerTlv(soSimbolo["62"])["05"]).toBe("***");
  });

  it("não deixa nome vazio virar campo de tamanho zero", () => {
    // Campo 59 com 0 caractere é payload inválido; o padrão exige nome.
    const campos = lerTlv(buildBrCode({ ...CASAL, recebedor: "!!!", cidade: "" }));
    expect(campos["59"]).toBe("RECEBEDOR");
    expect(campos["60"]).toBe("BRASIL");
  });

  it("cada campo declara o tamanho real do próprio valor", () => {
    // Tamanho mentido é o defeito que passa em leitura visual e quebra no app.
    const codigo = buildBrCode({
      ...CASAL,
      recebedor: "José Antônio",
      valorCentavos: 12345,
      txid: "presente1",
    });
    let i = 0;
    while (i < codigo.length) {
      const tamanho = Number(codigo.slice(i + 2, i + 4));
      expect(Number.isNaN(tamanho)).toBe(false);
      expect(codigo.slice(i + 4, i + 4 + tamanho)).toHaveLength(tamanho);
      i += 4 + tamanho;
    }
    expect(i).toBe(codigo.length); // consumiu tudo, sem sobra nem falta
  });
});
