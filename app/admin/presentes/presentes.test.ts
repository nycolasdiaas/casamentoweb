/**
 * G5 · os presentes de todos os casais — spec `painel-admin/003`.
 *
 * Dois riscos, e nenhum é visual.
 *
 * O primeiro é de vazamento: esta é a ÚNICA consulta de presente sem
 * `siteId`, e o isolamento por site é o corte de segurança entre clientes.
 * Basta alguém importá-la por engano numa tela do casal para a lista de
 * presentes de um casamento aparecer no de outro.
 *
 * O segundo é de mentira: o artboard pede um cartão "A repassar" e uma coluna
 * de estado. O Pix vai direto para a conta do casal e nunca passa pela Enlace,
 * e a contribuição é auto-declarada pelo convidado. Não há o que repassar nem
 * o que confirmar — e escrever isso na tela daria ao operador uma certeza que
 * ninguém tem.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

const RAIZ = process.cwd();
const PAGINA = readFileSync(
  resolve(RAIZ, "app/admin/presentes/page.tsx"),
  "utf-8"
);
const CODIGO = PAGINA.replace(/\/\*[\s\S]*?\*\//g, "").replace(
  /^\s*\/\/.*$/gm,
  ""
);

/** Todo arquivo `.ts`/`.tsx` de `app/` e `lib/`. */
function fontes(dir: string, achados: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) fontes(caminho, achados);
    else if (/\.tsx?$/.test(nome)) achados.push(caminho);
  }
  return achados;
}

describe("SC-002: a consulta global não pode escapar do admin", () => {
  it("só `app/admin/presentes/page.tsx` a importa", () => {
    const arquivos = [
      ...fontes(resolve(RAIZ, "app")),
      ...fontes(resolve(RAIZ, "lib")),
      ...fontes(resolve(RAIZ, "components")),
    ];

    const importam = arquivos.filter((f) => {
      const t = readFileSync(f, "utf-8");
      // Onde ela é DEFINIDA não conta, nem este próprio teste.
      if (f.endsWith("gifts.ts") || f.endsWith("presentes.test.ts")) return false;
      return t.includes("listContributionsParaAdmin");
    });

    expect(importam.map((f) => f.replace(RAIZ, "").replace(/\\/g, "/"))).toEqual(
      ["/app/admin/presentes/page.tsx"]
    );
  });

  it("o nome carrega o aviso, para errar ser difícil", () => {
    const repo = readFileSync(resolve(RAIZ, "lib/repositories/gifts.ts"), "utf-8");
    expect(repo).toContain("listContributionsParaAdmin");
    expect(repo).toContain("chamada de rota pública");
    expect(repo).toContain("corte de segurança");
  });
});

describe("SC-006: nada de repasse, pendente ou processando", () => {
  it("as palavras do modelo recusado não aparecem", () => {
    /* `Pendente R$ 3.200` / `Repassado R$ 44.800` só fazem sentido se a Enlace
       receber o dinheiro do presente e repassar depois — que é exatamente o
       que as regras §2.4 proíbem e §7 lista como descartado. */
    expect(CODIGO).not.toMatch(/repass|pendente|processando|estorn/i);
  });

  it("não há gesto de marcar contribuição como paga", () => {
    // Criar o gesto seria criar a operação que as regras recusam.
    expect(CODIGO).not.toMatch(/marcarComoPag|confirmarContribuic/i);
  });
});

describe("SC-010: quatro colunas, e nenhuma delas é STATUS", () => {
  it("Data, Casal, Cota e Valor", () => {
    expect(CODIGO).toContain('["Data", "Casal", "Cota", "Valor"]');
    // A quinta do artboard descreve estados que não existem: a contribuição é
    // auto-declarada num único gesto.
    expect(CODIGO).not.toContain('"Status"');
  });
});

describe("SC-003 e SC-004: valor livre não vira número inventado", () => {
  it("cota sem preço mostra um traço", () => {
    expect(CODIGO).toContain('l.priceCents === null ? "—"');
  });

  it("o total só sai quando TODA cota do mês tem preço", () => {
    expect(CODIGO).toContain("doMes.every((l) => l.priceCents !== null)");
    expect(CODIGO).toContain('"algumas cotas são de valor livre"');
  });
});

describe("SC-005: a frase que impede ler o número como caixa", () => {
  it("está na tela", () => {
    expect(PAGINA).toContain(
      "O Pix vai direto para a conta de cada casal — a Enlace nunca fica no"
    );
  });
});

describe("SC-007 e SC-012: o que a tela não pode perder", () => {
  it("as cotas do casamento legado continuam editáveis", () => {
    // É o único site cujas cotas o admin edita à mão. Sem esta seção, o
    // casamento de 16/10/2026 fica sem ninguém que ajuste a lista dele.
    expect(CODIGO).toContain("GiftAdmin");
    expect(CODIGO).toContain("getLegacySiteId");
  });

  it("tudo que lê banco fica dentro de um limite de Suspense", () => {
    // Leitura não cacheada fora do limite reprova o build da rota inteira, e o
    // `next dev` não avisa.
    expect(CODIGO).toContain("<Suspense");
    expect(CODIGO).toContain("<Contribuicoes />");
    expect(CODIGO).toContain("<CotasDoLegado />");
  });
});
