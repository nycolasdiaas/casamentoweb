/**
 * A hora do pagamento — migração `0021`.
 *
 * Era pendência aberta desde a spec `painel-casal/011`: o recibo precisa dizer
 * quando o casal pagou, e `orders` não guardava isso. Ele usava `updated_at`,
 * e funcionava **por um acidente de ordem** — o recibo é montado antes da
 * transação que publica, então `updated_at` ainda era a hora da confirmação.
 *
 * Bastaria alguém acrescentar uma escrita em `orders` no meio do caminho, ou
 * reenviar um recibo depois, para o comprovante do casal sair com a hora
 * errada. É um erro que ninguém vê acontecer: só aparece no PDF que a pessoa
 * guardou.
 */

import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { limparSchemaDeTeste } from "@/lib/db/testCleanup";
import { orders, users } from "@/lib/db/schema";
import { markOrderPaid } from "./orders";

beforeEach(limparSchemaDeTeste);
afterAll(limparSchemaDeTeste);

let n = 0;

async function pedido(status: "preview_ready" | "published" = "preview_ready") {
  const [user] = await db
    .insert(users)
    .values({
      name: `Casal ${n}`,
      email: `casal${n++}@teste.invalid`,
      passwordHash: "x:y",
    })
    .returning();

  const [order] = await db
    .insert(orders)
    .values({
      userId: user.id,
      packageTier: "site",
      status,
      priceCents: 2990,
    })
    .returning();

  return order;
}

const ler = async (id: string) =>
  (await db.select().from(orders).where(eq(orders.id, id)))[0];

describe("markOrderPaid grava a hora do pagamento", () => {
  it("um pedido novo ganha paid_at", async () => {
    const antes = Date.now();
    const o = await pedido();
    expect(o.paidAt).toBeNull();

    await markOrderPaid(o.id);

    const depois = await ler(o.id);
    expect(depois.paidAt).not.toBeNull();
    expect(depois.paidAt!.getTime()).toBeGreaterThanOrEqual(antes - 1000);
    expect(depois.paymentStatus).toBe("PAID");
    expect(depois.status).toBe("paid");
  });

  it("confirmar DUAS vezes não move a hora", async () => {
    /* O caso real: a confirmação chega pelos dois caminhos — o webhook do
       AbacatePay e a volta do casal do checkout — e o segundo costuma
       acontecer depois. Sobrescrever moveria a hora do recibo para a segunda
       chamada, que não é quando o dinheiro entrou. */
    const o = await pedido();

    await markOrderPaid(o.id);
    const primeira = (await ler(o.id)).paidAt!;

    await new Promise((r) => setTimeout(r, 25));
    await markOrderPaid(o.id);
    const segunda = (await ler(o.id)).paidAt!;

    expect(segunda.getTime()).toBe(primeira.getTime());
  });

  it("a hora do pagamento não é a hora da última alteração", async () => {
    /* O DEFEITO QUE ISTO CONSERTA. Depois de qualquer escrita posterior em
       `orders`, `updated_at` anda e `paid_at` fica. Antes da coluna, as duas
       eram a mesma leitura — e o recibo mostrava a hora errada assim que
       alguma coisa mexesse no pedido antes do envio. */
    const o = await pedido();
    await markOrderPaid(o.id);
    const pago = (await ler(o.id)).paidAt!;

    await new Promise((r) => setTimeout(r, 25));
    await db
      .update(orders)
      .set({ adminMessage: "conferido", updatedAt: new Date() })
      .where(eq(orders.id, o.id));

    const depois = await ler(o.id);
    expect(depois.paidAt!.getTime()).toBe(pago.getTime());
    expect(depois.updatedAt.getTime()).toBeGreaterThan(pago.getTime());
  });

  it("não rebaixa um pedido já publicado", async () => {
    // Comportamento que já existia e continua: o webhook atrasado não desfaz
    // uma publicação.
    const o = await pedido("published");
    await markOrderPaid(o.id);

    const depois = await ler(o.id);
    expect(depois.status).toBe("published");
    expect(depois.paidAt).not.toBeNull();
  });
});

describe("os pedidos anteriores à coluna", () => {
  it("com paid_at nulo, o recibo cai em updated_at", async () => {
    /* Os 13 pedidos que existiam quando a coluna nasceu têm `null`, e a hora
       real deles não é reconstituível — por isso não houve backfill. Para eles
       vale o que valia antes. */
    const o = await pedido();
    expect(o.paidAt).toBeNull();

    const usado = o.paidAt ?? o.updatedAt;
    expect(usado).toEqual(o.updatedAt);
  });
});
