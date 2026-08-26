/**
 * O sinal `?publicado=1` — transição #6, a metade do servidor.
 *
 * A guarda está do lado do cliente também (`CascaDoPainel.test.tsx`), mas ela
 * checa `status === "published"`, que continua verdadeiro para sempre. Quem
 * sabe se ESTA chamada foi a que publicou é só esta rota, lendo o
 * `alreadyPublished` que `publishSiteForOrder` devolve. Sem este teste, trocar
 * a condição por `if (resultado.ok)` passaria despercebido e o casal
 * receberia a comemoração a cada volta do checkout.
 *
 * Tudo aqui é dublê: a rota conversa com sessão, AbacatePay e banco de
 * produção. O que se testa é o galho, não a integração — a integração de
 * `publishSiteForOrder` já está em `lib/site/publish.test.ts`.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const dubles = vi.hoisted(() => ({
  publicar: vi.fn(),
  pedido: {
    id: "4821",
    userId: "u1",
    paymentStatus: "PAID",
    paymentId: "ch_1",
    paymentUrl: null,
  },
}));

/** `redirect` interrompe a execução lançando — o dublê imita isso. */
class Desvio extends Error {
  constructor(readonly para: string) {
    super(`redirect:${para}`);
  }
}

vi.mock("next/navigation", () => ({
  redirect: (para: string) => {
    throw new Desvio(para);
  },
}));
vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock("@/lib/auth/userSession", () => ({
  getSessionUserId: async () => "u1",
}));
vi.mock("@/lib/repositories/orders", () => ({
  getOrderById: async () => dubles.pedido,
  markOrderPaid: vi.fn(),
  setOrderPayment: vi.fn(),
}));
vi.mock("@/lib/payments/abacatepay", () => ({
  getChargeStatus: async () => "PAID",
}));
vi.mock("@/lib/site/publish", () => ({
  publishSiteForOrder: dubles.publicar,
  publishedSiteTags: () => ["site-view:ana-e-pedro"],
}));
vi.mock("@/lib/baseUrl", () => ({
  getBaseUrl: async () => "https://enlace.test",
}));

import { GET } from "./route";

const chamar = async () => {
  try {
    await GET(
      new Request("https://enlace.test/api/pagamento/confirmar?pedido=4821")
    );
  } catch (e) {
    if (e instanceof Desvio) return e.para;
    throw e;
  }
  throw new Error("a rota não redirecionou");
};

beforeEach(() => vi.clearAllMocks());

describe("/api/pagamento/confirmar — o sinal da comemoração", () => {
  it("SC-002: a chamada que publica devolve ?publicado=1", async () => {
    dubles.publicar.mockResolvedValue({
      ok: true,
      alreadyPublished: false,
      slug: "ana-e-pedro",
    });
    expect(await chamar()).toBe("/conta/pedidos/4821?publicado=1");
  });

  it("SC-003: a segunda chamada, idempotente, volta sem o parâmetro", async () => {
    dubles.publicar.mockResolvedValue({
      ok: true,
      alreadyPublished: true,
      slug: "ana-e-pedro",
    });
    expect(await chamar()).toBe("/conta/pedidos/4821");
  });

  it("publicação que falha não comemora — vai para ?publicacao=erro", async () => {
    dubles.publicar.mockResolvedValue({ ok: false, reason: "sem conteúdo" });
    expect(await chamar()).toBe("/conta/pedidos/4821?publicacao=erro");
  });
});
