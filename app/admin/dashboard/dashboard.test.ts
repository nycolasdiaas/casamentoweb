/**
 * G3 · o dashboard da operação — spec `painel-admin/002`.
 *
 * Os números estão provados contra o banco em
 * `lib/repositories/metricasDaOperacao.test.ts`. Aqui é o que a mudança de
 * endereço não pode quebrar — e o casamento de 16/10/2026, com 23 confirmações
 * reais, é a coisa mais frágil que este repositório tem.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const raiz = (p: string) => resolve(process.cwd(), p);
const ler = (p: string) => readFileSync(raiz(p), "utf-8");

const DASHBOARD = ler("app/admin/dashboard/page.tsx");
/* Sexta vez que este padrão aparece nas specs: SC-008 é um `grep` por
   "guests", e o arquivo CITA a palavra para dizer que não a usa. */
const CODIGO = DASHBOARD.replace(/\/\*[\s\S]*?\*\//g, "").replace(
  /^\s*\/\/.*$/gm,
  ""
);

describe("SC-006, FR-007 e FR-008: o casamento legado não se perde", () => {
  it("as duas telas existem no endereço novo", () => {
    expect(existsSync(raiz("app/admin/casamento/page.tsx"))).toBe(true);
    expect(
      existsSync(raiz("app/admin/casamento/confirmacoes/page.tsx"))
    ).toBe(true);
  });

  it("com os MESMOS componentes e a MESMA consulta", () => {
    /* Só o caminho mudou. Reescrever a tela do casamento que está a menos de
       dois meses do dia seria trocar risco por nada. */
    const casamento = ler("app/admin/casamento/page.tsx");
    expect(casamento).toContain("GroupForm");
    expect(casamento).toContain("GroupList");
    expect(casamento).toContain("listGroupsWithGuests");
    expect(casamento).toContain("getLegacySiteId");

    const conf = ler("app/admin/casamento/confirmacoes/page.tsx");
    expect(conf).toContain("RsvpDashboard");
    expect(conf).toContain("listGroupsWithGuests");
  });

  it("a barra do admin leva ao endereço novo", () => {
    const nav = ler("components/admin/AdminNav.tsx");
    expect(nav).toContain('{ href: "/admin/casamento", rotulo: "Casamento" }');
    expect(nav).not.toContain('rotulo: "Convidados"');
  });
});

describe("SC-007: `/admin` é porta, não tela", () => {
  it("redireciona para o dashboard, temporariamente", () => {
    /* 307 e não 308: quando G2 existir, `/admin` pode voltar a ter conteúdo —
       e um 308 já teria ensinado o navegador a nunca mais pedir. */
    const porta = ler("app/admin/page.tsx");
    expect(porta).toContain('redirect("/admin/dashboard")');
    expect(porta).not.toContain("permanentRedirect");
    expect(porta).not.toContain("GroupList");
  });
});

describe("SC-008 e FR-010: nenhum dado de convidado", () => {
  it("o dashboard não importa nada de `guests` ou `groups`", () => {
    // Convidado é terceiro (LGPD), e um número de negócio não precisa dele
    // para existir.
    expect(CODIGO).not.toContain("listGroupsWithGuests");
    expect(CODIGO).not.toContain("db/schema");
    expect(CODIGO).toContain("metricasDaOperacao");
  });

  it("a consulta lê só `orders` e `sites`", () => {
    const metricas = ler("lib/repositories/metricasDaOperacao.ts");
    const codigo = metricas
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    expect(codigo).toContain("orders, sites");
    expect(codigo).not.toMatch(/\bguests\b/);
    expect(codigo).not.toMatch(/\bgroups\b/);
    // E nunca presentes: o Pix vai direto para o casal.
    expect(codigo).not.toMatch(/giftContributions|\bgifts\b/);
  });
});

describe("SC-001, SC-004, SC-005 e FR-011: a tela", () => {
  it("os quatro cartões, com os rótulos do artboard", () => {
    for (const r of [
      'rotulo="Pedidos · mês"',
      'rotulo="Receita"',
      'rotulo="Sites no ar"',
      'rotulo="Conversão"',
    ]) {
      expect(CODIGO).toContain(r);
    }
  });

  it("SITES NO AR é acumulado, e diz isso no lugar da comparação", () => {
    // Comparar "sites no ar" com o mês passado daria sempre positivo e não
    // informaria nada.
    expect(CODIGO).toContain("acumulado");
    expect(DASHBOARD).toContain('<Cartao rotulo="Sites no ar"');
  });

  it("quatorze barras e três pacotes vêm da consulta, não da tela", () => {
    expect(CODIGO).toContain("m.ultimos14.map");
    expect(CODIGO).toContain("m.porPacote.map");
  });

  it("as duas maiores barras são destacadas", () => {
    expect(CODIGO).toContain("var(--c-mark)");
    expect(CODIGO).toContain('"#454b52"');
    expect(CODIGO).toContain(".slice(0, 2)");
  });

  it("FR-011: a leitura de banco fica dentro do `<Suspense>`", () => {
    expect(CODIGO).toContain("<Suspense");
    expect(CODIGO).toContain("<Painel />");
  });
});
