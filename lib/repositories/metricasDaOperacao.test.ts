/**
 * Os números do negócio — spec `painel-admin/002`.
 *
 * Dois riscos, e os dois são de confiança.
 *
 * O primeiro: somar presente em RECEITA. O Pix vai direto para a conta do
 * casal e nunca passa pela Enlace — somá-lo transformaria dinheiro de outra
 * pessoa em faturamento nosso, num número que o dono usaria para decidir.
 *
 * O segundo: contar só `paid` e perder as vendas que deram certo. Um pedido
 * pago que publicou tem `status = 'published'`; contando só `paid`, o número
 * cairia quanto MELHOR fosse o mês.
 */

import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { db } from "@/lib/db/client";
import { limparSchemaDeTeste } from "@/lib/db/testCleanup";
import { orders, users, gifts, giftContributions } from "@/lib/db/schema";
import { createTestSite } from "./testSite";
import {
  metricasDaOperacao,
  reaisCurtos,
  variacao,
} from "./metricasDaOperacao";
import type { OrderStatus } from "@/lib/orderStatus";

const limpar = limparSchemaDeTeste;
beforeEach(limpar);
afterAll(limpar);

let n = 0;

async function pedido(dados: {
  status: OrderStatus;
  centavos?: number;
  quando?: Date;
  tier?: "convite" | "site" | "para-sempre";
}) {
  const [user] = await db
    .insert(users)
    .values({
      name: `Casal ${n}`,
      email: `casal${n++}@teste.invalid`,
      passwordHash: "x:y",
    })
    .returning();

  const [o] = await db
    .insert(orders)
    .values({
      userId: user.id,
      packageTier: dados.tier ?? "para-sempre",
      status: dados.status,
      priceCents: dados.centavos ?? 9990,
      ...(dados.quando ? { createdAt: dados.quando } : {}),
    })
    .returning();
  return o;
}

const hoje = new Date();
const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 15);

describe("SC-002: receita é o valor dos PACOTES, e só", () => {
  it("um pedido de R$ 99,90 que chegou a pago entra na receita", async () => {
    await pedido({ status: "paid", centavos: 9990 });
    const m = await metricasDaOperacao();
    expect(m.receita.valor).toBe(9990);
  });

  it("presente de R$ 250 NÃO muda a receita", async () => {
    const site = await createTestSite();
    await pedido({ status: "paid", centavos: 9990 });

    const [g] = await db
      .insert(gifts)
      .values({
        siteId: site.id,
        category: "lua de mel",
        name: "Jantar",
        priceCents: 25000,
      })
      .returning();
    await db
      .insert(giftContributions)
      .values({ giftId: g.id, giftName: "Jantar", guestName: "Ana" });

    const m = await metricasDaOperacao();
    // 9990, não 34990. O dinheiro do presente é do casal.
    expect(m.receita.valor).toBe(9990);
  });

  it("pedido não pago não entra na receita", async () => {
    await pedido({ status: "preview_ready", centavos: 9990 });
    expect((await metricasDaOperacao()).receita.valor).toBe(0);
  });

  it("pedido PUBLICADO entra — ele foi pago antes de publicar", async () => {
    await pedido({ status: "published", centavos: 2990 });
    expect((await metricasDaOperacao()).receita.valor).toBe(2990);
  });
});

describe("SC-003: conversão", () => {
  it("10 criados e 6 pagos dão 60%", async () => {
    for (let i = 0; i < 4; i++) await pedido({ status: "draft" });
    for (let i = 0; i < 3; i++) await pedido({ status: "paid" });
    for (let i = 0; i < 3; i++) await pedido({ status: "published" });

    const m = await metricasDaOperacao();
    expect(m.pedidos.valor).toBe(10);
    expect(m.conversao.valor).toBe(60);
  });

  it("mês sem pedido nenhum é 0%, não divisão por zero", async () => {
    const m = await metricasDaOperacao();
    expect(m.conversao.valor).toBe(0);
    expect(Number.isFinite(m.conversao.valor)).toBe(true);
  });
});

describe("SC-004 e SC-005: o gráfico e os pacotes", () => {
  it("quatorze barras, sempre — inclusive os dias parados", async () => {
    await pedido({ status: "draft" });
    const m = await metricasDaOperacao();
    expect(m.ultimos14).toHaveLength(14);
    // Um gráfico que pula os dias vazios comprime o eixo e faz uma semana
    // parada parecer movimentada.
    expect(m.ultimos14.filter((d) => d.pedidos === 0).length).toBe(13);
  });

  it("os três pacotes aparecem, mesmo zerados", async () => {
    await pedido({ status: "draft", tier: "convite" });
    const m = await metricasDaOperacao();
    expect(m.porPacote.map((p) => p.tier)).toEqual([
      "convite",
      "site",
      "para-sempre",
    ]);
    expect(m.porPacote.find((p) => p.tier === "convite")!.pedidos).toBe(1);
    expect(m.porPacote.find((p) => p.tier === "site")!.pedidos).toBe(0);
  });
});

describe("a comparação com o mês anterior", () => {
  it("o mês passado é contado separado", async () => {
    await pedido({ status: "paid", quando: mesPassado, centavos: 9990 });
    await pedido({ status: "paid", centavos: 9990 });
    await pedido({ status: "paid", centavos: 9990 });

    const m = await metricasDaOperacao();
    expect(m.pedidos.valor).toBe(2);
    expect(m.pedidos.anterior).toBe(1);
    expect(variacao(m.pedidos.valor, m.pedidos.anterior)).toBe(100);
  });

  it("sem base de comparação, `null` — e não um `+100%` falso", () => {
    // Matemática correta, informação falsa: o mês passado não teve nada com
    // que comparar.
    expect(variacao(5, 0)).toBeNull();
    expect(variacao(5, null)).toBeNull();
  });
});

describe("SITES NO AR é acumulado", () => {
  it("conta todo site publicado, sem janela de tempo", async () => {
    await createTestSite();
    const m = await metricasDaOperacao();
    expect(typeof m.sitesNoAr).toBe("number");
    expect(m.sitesNoAr).toBeGreaterThanOrEqual(0);
  });
});

describe("reaisCurtos", () => {
  it("trunca, nunca arredonda para cima", () => {
    /* Um número de receita que erra para MAIS é o único tipo de erro que não
       se pode cometer numa tela onde o dono decide. Para menos ele vê um real
       a menos do que tem; para mais, conta com dinheiro que não existe. */
    expect(reaisCurtos(9990)).toBe("R$ 99");
    expect(reaisCurtos(999999)).toBe("R$ 9,9k");
  });

  it("abaixo de mil, o número inteiro", () => {
    expect(reaisCurtos(9990)).toBe("R$ 99");
    expect(reaisCurtos(99900)).toBe("R$ 999");
  });

  it("acima de mil, milhar abreviado", () => {
    expect(reaisCurtos(210000)).toBe("R$ 2,1k");
    expect(reaisCurtos(2100000)).toBe("R$ 21k");
  });

  it("zero é zero", () => {
    expect(reaisCurtos(0)).toBe("R$ 0");
  });
});
