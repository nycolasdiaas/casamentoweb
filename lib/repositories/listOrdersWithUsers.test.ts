/**
 * A busca e o filtro de `/admin/pedidos` — spec `painel-admin/001`.
 *
 * `/admin` é a tela de exceção: quem entra ali está procurando UM pedido para
 * socorrer um casal que está esperando do outro lado. Busca que erra por causa
 * de um til, ou que devolve o pedido errado, custa esse atendimento.
 *
 * Roda contra o banco de teste porque o que se afere é SQL: o achatamento de
 * acento é `translate` no Postgres, e um teste em memória não provaria nada
 * sobre ele.
 */

import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { db } from "@/lib/db/client";
import { limparSchemaDeTeste } from "@/lib/db/testCleanup";
import { orders, users } from "@/lib/db/schema";
import { listOrdersWithUsers } from "./orders";
import type { OrderStatus } from "@/lib/orderStatus";

const limpar = limparSchemaDeTeste;
beforeEach(limpar);
afterAll(limpar);

let n = 0;

async function pedido(dados: {
  casal: string;
  email: string;
  status: OrderStatus;
}) {
  const [user] = await db
    .insert(users)
    .values({
      name: dados.casal,
      email: dados.email,
      passwordHash: "x:y",
    })
    .returning();

  const [order] = await db
    .insert(orders)
    .values({
      userId: user.id,
      packageTier: "para-sempre",
      coupleNames: dados.casal,
      status: dados.status,
      priceCents: 9990,
      updatedAt: new Date(Date.now() + n++ * 1000),
    })
    .returning();

  return order;
}

const nomes = (lista: { coupleNames: string | null }[]) =>
  lista.map((o) => o.coupleNames).sort();

describe("o filtro por estado", () => {
  beforeEach(async () => {
    await pedido({ casal: "Ana e Pedro", email: "ana@t.invalid", status: "published" });
    await pedido({ casal: "Bia e Caio", email: "bia@t.invalid", status: "preview_ready" });
    await pedido({ casal: "Dora e Eli", email: "dora@t.invalid", status: "paid" });
    await pedido({ casal: "Fê e Gui", email: "fe@t.invalid", status: "draft" });
  });

  it("sem filtro, vêm todos — inclusive rascunho", async () => {
    expect(await listOrdersWithUsers()).toHaveLength(4);
  });

  it("SC-002: `no-ar` traz só o publicado", async () => {
    const r = await listOrdersWithUsers({ estados: ["published"] });
    expect(nomes(r)).toEqual(["Ana e Pedro"]);
  });

  it("SC-003: `previa` junta `preview_ready` e `paid`, e nenhum publicado", async () => {
    // Do ponto de vista de quem opera, os dois são "prévia pronta, ainda não
    // no ar" — separá-los criaria uma pílula para um estado que dura minutos.
    const r = await listOrdersWithUsers({ estados: ["preview_ready", "paid"] });
    expect(nomes(r)).toEqual(["Bia e Caio", "Dora e Eli"]);
    expect(r.every((o) => o.status !== "published")).toBe(true);
  });

  it("do mais recente ao mais antigo", async () => {
    const r = await listOrdersWithUsers();
    expect(r[0].coupleNames).toBe("Fê e Gui");
  });
});

describe("a busca", () => {
  beforeEach(async () => {
    await pedido({ casal: "Aná e Pedro", email: "contato@noivos.invalid", status: "published" });
    await pedido({ casal: "Bia e Caio", email: "ANA.SILVA@t.invalid", status: "paid" });
    await pedido({ casal: "Zé e Rui", email: "ze@t.invalid", status: "draft" });
  });

  it("SC-004: acha pelo nome do casal, sem diferenciar acento", async () => {
    // O operador digita "ana"; o casal está cadastrado como "Aná". Busca que
    // erra por causa de um til é busca que não serve.
    const r = await listOrdersWithUsers({ busca: "ana" });
    expect(nomes(r)).toContain("Aná e Pedro");
  });

  it("SC-004: acha pelo e-mail, sem diferenciar maiúscula", async () => {
    const r = await listOrdersWithUsers({ busca: "ana.silva" });
    expect(nomes(r)).toEqual(["Bia e Caio"]);
  });

  it("SC-004: o contrário também — acento na busca, nome sem acento", async () => {
    const r = await listOrdersWithUsers({ busca: "zé" });
    expect(nomes(r)).toEqual(["Zé e Rui"]);
    expect(nomes(await listOrdersWithUsers({ busca: "ze" }))).toEqual([
      "Zé e Rui",
    ]);
  });

  it("SC-005: `#4821` e `4821` acham o mesmo pedido", async () => {
    const alvo = await pedido({
      casal: "Hugo e Ivo",
      email: "hugo@t.invalid",
      status: "published",
    });
    const inicio = alvo.id.slice(0, 8);

    const comCerquilha = await listOrdersWithUsers({ busca: `#${inicio}` });
    const sem = await listOrdersWithUsers({ busca: inicio });

    expect(nomes(comCerquilha)).toEqual(["Hugo e Ivo"]);
    expect(nomes(sem)).toEqual(["Hugo e Ivo"]);
  });

  it("SC-006: quatro caracteres do id já bastam", async () => {
    const alvo = await pedido({
      casal: "Joana e Kiko",
      email: "joana@t.invalid",
      status: "published",
    });
    const r = await listOrdersWithUsers({ busca: alvo.id.slice(0, 4) });
    expect(nomes(r)).toContain("Joana e Kiko");
  });

  it("busca e filtro se somam, não se substituem", async () => {
    const r = await listOrdersWithUsers({
      estados: ["paid"],
      busca: "ana",
    });
    // "Aná e Pedro" casa com o texto mas está publicado; "Bia e Caio" casa
    // pelo e-mail e está pago.
    expect(nomes(r)).toEqual(["Bia e Caio"]);
  });

  it("busca sem resultado devolve lista vazia, não erro", async () => {
    expect(await listOrdersWithUsers({ busca: "xyzabc" })).toEqual([]);
  });

  it("espaço em branco não vira filtro", async () => {
    expect(await listOrdersWithUsers({ busca: "   " })).toHaveLength(3);
  });
});
