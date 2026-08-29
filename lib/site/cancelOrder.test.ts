/**
 * Cancelar pedido — spec `painel-casal/013`.
 *
 * O que mudou: cancelar chamava `deleteOrder`, um `DELETE FROM orders`, e a
 * linha sumia. Era a única exceção viva à regra 6 da §14 do SDD, e custava duas
 * coisas que ninguém escolheu — a operação não conseguia ver um cancelamento, e
 * o site que **não** pode ser apagado junto ficava órfão, acumulando invisível.
 *
 * O teste que mais importa aqui é o do site com convidados. Cada grupo carrega
 * o slug de `/rsvp/<slug>` que já circulou no WhatsApp: apagar isso é arrancar
 * do ar o link pelo qual gente real confirma presença, e nenhum cancelamento de
 * pedido vale esse preço.
 */

import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { limparSchemaDeTeste } from "@/lib/db/testCleanup";
import { groups, guests, orders, sites, users } from "@/lib/db/schema";
import { createGroup } from "@/lib/repositories/groups";
import { cancelarPedidoComSite } from "./cancelOrder";
import {
  ORDER_STATUSES,
  TRACKER_STEPS,
  canCancelOrder,
  isOrderStatus,
} from "@/lib/orderStatus";

/* `limparSchemaDeTeste` não apaga `groups` nem `guests` — e não deveria: nos
   outros testes eles não existem, e `groups.site_id` é `onDelete: restrict` de
   propósito, para ninguém arrancar do ar um `/rsvp/<slug>` sem querer.
   
   Este arquivo é o único que CRIA grupo, então é ele que limpa o que criou,
   antes de a limpeza comum tentar apagar o site que o grupo segura. */
async function limpar() {
  await db.delete(guests);
  await db.delete(groups);
  await limparSchemaDeTeste();
}

beforeEach(limpar);
afterAll(limpar);

let n = 0;

/** Um pedido com site provisionado — o estado de onde se cancela. */
async function pedidoComSite(opcoes: { publicado?: boolean } = {}) {
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
      packageTier: "para-sempre",
      status: "preview_ready",
      priceCents: 9990,
    })
    .returning();

  const [site] = await db
    .insert(sites)
    .values({
      orderId: order.id,
      userId: user.id,
      slug: `casal-${n}`,
      tier: "para-sempre",
      previewToken: `tok${n}${Date.now()}`,
      status: "preview",
      ...(opcoes.publicado ? { publishedAt: new Date() } : {}),
    })
    .returning();

  return { order, site };
}

const lerPedido = async (id: string) =>
  (await db.select().from(orders).where(eq(orders.id, id)))[0] ?? null;
const lerSite = async (id: string) =>
  (await db.select().from(sites).where(eq(sites.id, id)))[0] ?? null;

describe("SC-001 e SC-003: o estado novo", () => {
  it("são sete, com `cancelled` no fim", () => {
    /* No fim de propósito: a ordem deste array é a ordem real do fluxo, e mais
       de um lugar lê posição. */
    expect(ORDER_STATUSES).toHaveLength(7);
    expect(ORDER_STATUSES[6]).toBe("cancelled");
    expect(isOrderStatus("cancelled")).toBe(true);
  });

  it("o acompanhamento continua com cinco passos", () => {
    // Ele desenha o caminho até o site no ar; cancelado saiu do caminho.
    expect(TRACKER_STEPS).toHaveLength(5);
    expect(TRACKER_STEPS as readonly string[]).not.toContain("cancelled");
  });

  it("SC-007: cancelar duas vezes não é operação", () => {
    expect(canCancelOrder("cancelled")).toBe(false);
    expect(canCancelOrder("paid")).toBe(false);
    expect(canCancelOrder("published")).toBe(false);
    expect(canCancelOrder("preview_ready")).toBe(true);
  });
});

describe("SC-004: sem convidados, o site sai e o pedido FICA", () => {
  it("o pedido vira `cancelled` em vez de sumir", async () => {
    const { order, site } = await pedidoComSite();

    await cancelarPedidoComSite(order.id);

    const depois = await lerPedido(order.id);
    expect(depois).not.toBeNull();
    expect(depois!.status).toBe("cancelled");
    // O site sem convidados e nunca publicado sai, como já saía antes.
    expect(await lerSite(site.id)).toBeNull();
  });
});

describe("SC-005: com convidados, nada some — e nada fica órfão", () => {
  it("o site continua apontando para o pedido cancelado", async () => {
    const { order, site } = await pedidoComSite();
    /* Um grupo é o suficiente: ele carrega o slug de `/rsvp/<slug>`, e esse
       link pode já estar no WhatsApp de gente real. */
    await createGroup({ siteId: site.id, guestNames: ["Ana", "Bruno"] });

    await cancelarPedidoComSite(order.id);

    const pedidoDepois = await lerPedido(order.id);
    const siteDepois = await lerSite(site.id);

    expect(pedidoDepois!.status).toBe("cancelled");
    expect(siteDepois).not.toBeNull();
    /* O DEFEITO QUE ISTO CONSERTA: antes, `deleteOrder` apagava o pedido e o
       `set null` do FK deixava o site sem dono, acumulando invisível — o que o
       `AGENTS.md` registrava como pendência conhecida. */
    expect(siteDepois!.orderId).toBe(order.id);
  });

  it("site já publicado também sobrevive", async () => {
    // O casamento de alguém não deixa de existir porque o pedido foi
    // cancelado.
    const { order, site } = await pedidoComSite({ publicado: true });

    await cancelarPedidoComSite(order.id);

    expect((await lerPedido(order.id))!.status).toBe("cancelled");
    const siteDepois = await lerSite(site.id);
    expect(siteDepois).not.toBeNull();
    expect(siteDepois!.orderId).toBe(order.id);
  });
});

describe("SC-011: a conversão não muda de fórmula", () => {
  it("o cancelado continua no denominador", async () => {
    /* Um pedido que existiu e foi cancelado é exatamente o que a taxa quer
       medir. O que mudou é que agora ele é VISÍVEL. */
    const { metricasDaOperacao } = await import(
      "@/lib/repositories/metricasDaOperacao"
    );

    const a = await pedidoComSite();
    await pedidoComSite();
    await db
      .update(orders)
      .set({ status: "paid" })
      .where(eq(orders.id, a.order.id));

    const b = await pedidoComSite();
    await cancelarPedidoComSite(b.order.id);

    const m = await metricasDaOperacao();
    expect(m.pedidos.valor).toBe(3);
    // 1 pago de 3 criados — o cancelado conta como criado e não convertido.
    expect(m.conversao.valor).toBe(33);
  });
});
