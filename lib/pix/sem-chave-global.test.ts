import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

// Guarda contra a regressão que motivou tudo isto.
//
// Até a migração 0010, `lib/pix.ts` exportava uma chave Pix pessoal e o
// caminho molde → GiftGrid → GiftPixModal a lia direto. Todo casal com lista
// de presentes ligada mostrava ao convidado o QR de outra pessoa: ele pagava
// achando que presenteava os noivos, e o dinheiro ia para a conta errada.
//
// Não é um bug que um teste de unidade pega — o componente funcionava. O que
// estava errado era de ONDE o dado vinha. Por isso o teste é estrutural: ele
// falha se alguém recriar um módulo de Pix global, ou se um componente do site
// voltar a ler chave que não veio do tenant.

const RAIZ = join(__dirname, "..", "..");

function arquivosEm(dir: string, extensoes = [".ts", ".tsx"]): string[] {
  if (!existsSync(dir)) return [];
  const achados: string[] = [];
  for (const entrada of readdirSync(dir)) {
    const caminho = join(dir, entrada);
    if (statSync(caminho).isDirectory()) {
      achados.push(...arquivosEm(caminho, extensoes));
    } else if (extensoes.some((ext) => entrada.endsWith(ext))) {
      achados.push(caminho);
    }
  }
  return achados;
}

describe("nenhuma chave Pix global", () => {
  it("lib/pix.ts não existe mais", () => {
    // Se este arquivo voltar, o caminho antigo volta com ele.
    expect(existsSync(join(RAIZ, "lib", "pix.ts"))).toBe(false);
  });

  it("o QR estático saiu de public/", () => {
    // Um PNG em /public serve a chave de UMA pessoa para todos os sites, e
    // ainda por cima não consegue carregar o valor da cota.
    expect(existsSync(join(RAIZ, "public", "pix-qr.png"))).toBe(false);
  });

  it("nenhum componente importa um módulo de Pix global", () => {
    const suspeitos: string[] = [];
    for (const arquivo of [
      ...arquivosEm(join(RAIZ, "components")),
      ...arquivosEm(join(RAIZ, "lib", "templates")),
    ]) {
      const fonte = readFileSync(arquivo, "utf8");
      // `@/lib/pix/...` (key, brcode, resolve) é legítimo: são funções puras e
      // o resolver por tenant. `@/lib/pix` no talo é o módulo de constantes.
      if (/from\s+["']@\/lib\/pix["']/.test(fonte)) {
        suspeitos.push(arquivo.replace(RAIZ, ""));
      }
    }
    expect(suspeitos).toEqual([]);
  });

  it("nenhuma chave Pix aparece escrita no código do site", () => {
    // Formatos de chave que denunciam valor chumbado: UUID (chave aleatória)
    // e o prefixo do payload EMV. E-mail/CPF ficariam de fora, mas o caso real
    // era uma chave aleatória e um copia-e-cola inteiro.
    const UUID_SOLTO =
      /["']([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})["']/gi;
    const PAYLOAD_EMV = /["']00020126\d/;

    // Um UUID de caractere repetido ("0000...", "aaaa...") é placeholder de
    // formulário, não chave. Mesmo critério que `cpfValido` já aplica ao
    // recusar 111.111.111-11: chave real não é um caractere só.
    const ehPlaceholder = (uuid: string) =>
      /^(.)\1*$/.test(uuid.replace(/-/g, ""));

    const suspeitos: string[] = [];
    for (const arquivo of [
      ...arquivosEm(join(RAIZ, "components")),
      ...arquivosEm(join(RAIZ, "lib", "templates")),
      ...arquivosEm(join(RAIZ, "app")),
    ]) {
      // O próprio teste do BR Code guarda um payload de referência de
      // propósito — é a âncora que prova que o CRC está certo.
      if (arquivo.endsWith(".test.ts") || arquivo.endsWith(".test.tsx")) {
        continue;
      }
      const fonte = readFileSync(arquivo, "utf8");
      const uuids = [...fonte.matchAll(UUID_SOLTO)].map((m) => m[1]);
      if (uuids.some((u) => !ehPlaceholder(u)) || PAYLOAD_EMV.test(fonte)) {
        suspeitos.push(arquivo.replace(RAIZ, ""));
      }
    }
    expect(suspeitos).toEqual([]);
  });
});
