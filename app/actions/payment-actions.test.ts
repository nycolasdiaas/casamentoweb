import { describe, it, expect, beforeEach, vi } from "vitest";

/* A action redireciona no caminho feliz. `redirect` lança no Next, e é isso
   que os testes esperam — o mock imita o comportamento, não a implementação. */
vi.mock("next/navigation", () => ({
  redirect: (destino: string) => {
    throw new Error(`NEXT_REDIRECT:${destino}`);
  },
}));

const sessao = vi.hoisted(() => ({ userId: "casal-1" }));
vi.mock("@/lib/auth/userSession", () => ({
  getSessionUserId: async () => sessao.userId,
}));

const pedido = vi.hoisted(() => ({
  atual: {
    id: "pedido-1",
    userId: "casal-1",
    packageTier: "para-sempre",
    priceCents: 9990,
    coupleNames: "Mariana & Rafael",
    paymentStatus: null as string | null,
  },
}));
const gravado = vi.hoisted(() => ({ chamadas: [] as unknown[] }));
vi.mock("@/lib/repositories/orders", () => ({
  getOrderById: async () => pedido.atual,
  setOrderPayment: async (...args: unknown[]) => {
    gravado.chamadas.push(args);
  },
}));

const conta = vi.hoisted(() => ({
  atual: { name: "Mariana", email: "casal@example.com", whatsapp: null as string | null },
}));
vi.mock("@/lib/repositories/users", () => ({
  getUserById: async () => conta.atual,
}));

const cobranca = vi.hoisted(() => ({
  chamadas: [] as { customer?: { cellphone?: string; taxId?: string } }[],
  erro: null as Error | null,
}));
vi.mock("@/lib/payments/abacatepay", () => ({
  isPaymentConfigured: () => true,
  createCharge: async (params: { customer?: { cellphone?: string } }) => {
    cobranca.chamadas.push(params);
    if (cobranca.erro) throw cobranca.erro;
    return { id: "cob-1", url: "https://pagamento.example/cob-1", status: "PENDING" };
  },
}));

vi.mock("@/lib/baseUrl", () => ({
  getBaseUrl: async () => "https://casamentoweb-ten.vercel.app",
}));

import { startPaymentAction } from "./payment-actions";

/** CPF válido de teste — passa no dígito verificador, não é de ninguém. */
const CPF = "111.444.777-35";

function formulario(campos: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(campos)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  sessao.userId = "casal-1";
  pedido.atual.paymentStatus = null;
  conta.atual.whatsapp = null;
  cobranca.chamadas = [];
  cobranca.erro = null;
  gravado.chamadas = [];
});

describe("startPaymentAction", () => {
  it("recusa sem WhatsApp em vez de deixar o gateway falhar", async () => {
    /* O provedor exige `customer.cellphone`: sem ele, a cobrança volta 422 e o
       casal lia "não conseguimos iniciar o pagamento agora", sem pista do que
       faltava. Medido contra a API em 15/09/2026. */
    const r = await startPaymentAction(
      undefined,
      formulario({ orderId: "pedido-1", payerTaxId: CPF, payerWhatsapp: "" })
    );

    expect(r).toMatchObject({ error: expect.stringContaining("WhatsApp") });
    expect(cobranca.chamadas).toHaveLength(0);
  });

  it("recusa número incompleto", async () => {
    const r = await startPaymentAction(
      undefined,
      formulario({ orderId: "pedido-1", payerTaxId: CPF, payerWhatsapp: "(81) 9" })
    );

    expect(r).toMatchObject({ error: expect.stringContaining("WhatsApp") });
    expect(cobranca.chamadas).toHaveLength(0);
  });

  it("cria a cobrança com o telefone que o casal escreveu", async () => {
    await expect(
      startPaymentAction(
        undefined,
        formulario({
          orderId: "pedido-1",
          payerTaxId: CPF,
          payerWhatsapp: "(81) 98765-4321",
        })
      )
    ).rejects.toThrow("NEXT_REDIRECT:https://pagamento.example/cob-1");

    expect(cobranca.chamadas).toHaveLength(1);
    expect(cobranca.chamadas[0].customer?.cellphone).toBe("(81) 98765-4321");
    expect(cobranca.chamadas[0].customer?.taxId).toBe("11144477735");
    expect(gravado.chamadas).toHaveLength(1);
  });

  it("recusa CPF inválido antes de falar com o gateway", async () => {
    const r = await startPaymentAction(
      undefined,
      formulario({
        orderId: "pedido-1",
        payerTaxId: "111.111.111-11",
        payerWhatsapp: "(81) 98765-4321",
      })
    );

    expect(r).toMatchObject({ error: expect.stringContaining("CPF") });
    expect(cobranca.chamadas).toHaveLength(0);
  });

  it("quando o gateway falha, a mensagem não manda ninguém para o WhatsApp", async () => {
    // O canal de socorro do produto não é o suporte por mensagem: a tela diz o
    // que fazer (tentar de novo), e o motivo real vai para o log do servidor.
    cobranca.erro = new Error("gateway fora do ar");
    const erroNoLog = vi.spyOn(console, "error").mockImplementation(() => {});

    const r = await startPaymentAction(
      undefined,
      formulario({
        orderId: "pedido-1",
        payerTaxId: CPF,
        payerWhatsapp: "(81) 98765-4321",
      })
    );

    expect(r?.error).toBeTruthy();
    expect(r?.error).not.toMatch(/whats/i);
    expect(erroNoLog).toHaveBeenCalled();
    erroNoLog.mockRestore();
  });
});
