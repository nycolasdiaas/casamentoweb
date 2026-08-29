/**
 * Recado do time para o casal — migração `0022`.
 *
 * O que existia era `orders.admin_message`: um campo só, sobrescrito a cada
 * envio. Estes casos cobrem justamente o que aquele campo não conseguia
 * responder — quantos recados houve, qual ainda não foi lido, e o que
 * acontece quando o casal abre o sino duas vezes.
 */

import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { db } from "@/lib/db/client";
import { limparSchemaDeTeste } from "@/lib/db/testCleanup";
import { orders, users } from "@/lib/db/schema";
import {
  criarRecado,
  listarRecados,
  recadosNaoLidos,
  marcarRecadosComoLidos,
  marcarEmailEnviado,
} from "./adminNotices";

beforeEach(limparSchemaDeTeste);
afterAll(limparSchemaDeTeste);

let n = 0;

async function pedido() {
  const [user] = await db
    .insert(users)
    .values({
      name: `Casal ${n}`,
      email: `casal-recado${n++}@teste.invalid`,
      passwordHash: "x:y",
    })
    .returning();

  const [order] = await db
    .insert(orders)
    .values({
      userId: user.id,
      packageTier: "site",
      status: "preview_ready",
      priceCents: 2990,
    })
    .returning();

  return order;
}

function recado(orderId: string, titulo: string) {
  return criarRecado({
    orderId,
    adminId: null,
    adminName: "Anderson",
    title: titulo,
    body: "Texto do recado.",
  });
}

describe("o recado nasce não lido", () => {
  it("entra na lista e no não-lidos", async () => {
    const order = await pedido();
    await recado(order.id, "A prévia está pronta");

    expect(await listarRecados(order.id)).toHaveLength(1);
    expect(await recadosNaoLidos(order.id)).toHaveLength(1);
  });

  it("guarda quem mandou, para o casal saber de quem veio", async () => {
    const order = await pedido();
    const criado = await recado(order.id, "Oi");

    expect(criado.adminName).toBe("Anderson");
    expect(criado.readAt).toBeNull();
    // O e-mail é responsabilidade de quem chama; nascer sem ele é o correto.
    expect(criado.emailSentAt).toBeNull();
  });
});

describe("o histórico é o que o campo antigo não tinha", () => {
  it("o segundo recado não apaga o primeiro", async () => {
    const order = await pedido();
    await recado(order.id, "Primeiro");
    await recado(order.id, "Segundo");

    const todos = await listarRecados(order.id);
    expect(todos).toHaveLength(2);
    expect(todos.map((r) => r.title).sort()).toEqual(["Primeiro", "Segundo"]);
  });

  it("um casal nunca vê o recado do outro", async () => {
    const a = await pedido();
    const b = await pedido();
    await recado(a.id, "Só do A");

    expect(await listarRecados(b.id)).toHaveLength(0);
    expect(await recadosNaoLidos(b.id)).toHaveLength(0);
  });
});

describe("marcar como lido", () => {
  it("tira do não-lidos e mantém na lista", async () => {
    const order = await pedido();
    await recado(order.id, "Leia isto");

    expect(await marcarRecadosComoLidos(order.id)).toBe(1);
    expect(await recadosNaoLidos(order.id)).toHaveLength(0);
    // Lido não é apagado: o histórico continua.
    expect(await listarRecados(order.id)).toHaveLength(1);
  });

  it("abrir o sino de novo NÃO reescreve a hora da primeira leitura", async () => {
    const order = await pedido();
    await recado(order.id, "Leia isto");

    await marcarRecadosComoLidos(order.id);
    const [primeiro] = await listarRecados(order.id);

    /* A segunda passada não pode marcar nada — o `isNull` no WHERE existe
       para isto. Sem ele, "lido em" viraria "lido pela última vez que o casal
       passou por aqui", e a informação de QUANDO ele soube se perderia. */
    expect(await marcarRecadosComoLidos(order.id)).toBe(0);

    const [depois] = await listarRecados(order.id);
    expect(depois.readAt?.getTime()).toBe(primeiro.readAt?.getTime());
  });
});

describe("o e-mail é registro, não condição", () => {
  it("o recado vale antes de o e-mail sair", async () => {
    const order = await pedido();
    const criado = await recado(order.id, "Sem e-mail ainda");

    // Já está no sino do casal mesmo com `email_sent_at` nulo.
    expect(await recadosNaoLidos(order.id)).toHaveLength(1);

    await marcarEmailEnviado(criado.id);
    const [depois] = await listarRecados(order.id);
    expect(depois.emailSentAt).not.toBeNull();
  });
});
