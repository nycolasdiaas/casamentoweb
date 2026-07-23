// Integração com o AbacatePay (gateway PIX brasileiro).
// Usamos a API v1 "billing/create" com produtos inline: não precisa
// pré-cadastrar produto no painel, o valor vai direto na cobrança — encaixa
// no preço por pedido. Docs: https://docs.abacatepay.com
//
// Configuração (env): ABACATEPAY_API_KEY (obrigatória para cobrar de verdade).
// Opcional: ABACATEPAY_API_URL (default https://api.abacatepay.com/v1).

const API_URL = (
  process.env.ABACATEPAY_API_URL ?? "https://api.abacatepay.com/v1"
).replace(/\/$/, "");
const API_KEY = process.env.ABACATEPAY_API_KEY;

export type AbacateCharge = {
  id: string;
  url: string;
  status: string;
};

export type CreateChargeParams = {
  amountCents: number;
  externalId: string;
  productName: string;
  description?: string;
  returnUrl: string;
  completionUrl: string;
  customer?: {
    name?: string;
    email?: string;
    cellphone?: string;
    taxId?: string;
  };
};

/** Só dá pra cobrar de verdade se a chave estiver configurada. */
export function isPaymentConfigured(): boolean {
  return Boolean(API_KEY);
}

function authHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  };
}

// O AbacatePay responde no formato { data, error, success }. error é string
// (ou objeto) quando algo falha.
function extractError(json: unknown): string | null {
  if (json && typeof json === "object" && "error" in json) {
    const err = (json as { error: unknown }).error;
    if (!err) return null;
    if (typeof err === "string") return err;
    if (typeof err === "object" && "message" in err) {
      return String((err as { message: unknown }).message);
    }
    return JSON.stringify(err);
  }
  return null;
}

/** Cria uma cobrança PIX e devolve o link de pagamento hospedado. */
export async function createCharge(
  params: CreateChargeParams
): Promise<AbacateCharge> {
  if (!API_KEY) {
    throw new Error("ABACATEPAY_API_KEY não configurada");
  }

  const body: Record<string, unknown> = {
    frequency: "ONE_TIME",
    methods: ["PIX"],
    products: [
      {
        externalId: params.externalId,
        name: params.productName,
        description: params.description ?? params.productName,
        quantity: 1,
        price: params.amountCents,
      },
    ],
    returnUrl: params.returnUrl,
    completionUrl: params.completionUrl,
  };

  // customer é opcional: se não mandar, o AbacatePay coleta na tela dele.
  if (params.customer) {
    const c = params.customer;
    const customer: Record<string, string> = {};
    if (c.name) customer.name = c.name;
    if (c.email) customer.email = c.email;
    if (c.cellphone) customer.cellphone = c.cellphone;
    if (c.taxId) customer.taxId = c.taxId;
    if (Object.keys(customer).length > 0) body.customer = customer;
  }

  const res = await fetch(`${API_URL}/billing/create`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const json = await res.json().catch(() => null);
  const error = extractError(json);
  if (!res.ok || error) {
    throw new Error(error ?? `AbacatePay respondeu ${res.status}`);
  }

  const data = (json?.data ?? json) as {
    id?: string;
    url?: string;
    status?: string;
  };
  if (!data?.id || !data?.url) {
    throw new Error("Resposta do AbacatePay sem id/url de cobrança");
  }

  return { id: data.id, url: data.url, status: data.status ?? "PENDING" };
}

/**
 * Consulta o status atual de uma cobrança (PENDING/PAID/...). Devolve null se
 * não configurado ou se não achou. Usado no retorno do pagamento como
 * confirmação, sem depender de webhook.
 */
export async function getChargeStatus(
  billingId: string
): Promise<string | null> {
  if (!API_KEY) return null;

  const res = await fetch(`${API_URL}/billing/list`, {
    method: "GET",
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) return null;

  const json = await res.json().catch(() => null);
  const list = (json?.data ?? json) as
    | { id: string; status: string }[]
    | undefined;
  if (!Array.isArray(list)) return null;

  const found = list.find((b) => b.id === billingId);
  return found?.status ?? null;
}
