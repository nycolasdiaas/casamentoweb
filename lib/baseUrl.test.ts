import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// O endereço público do produto, e por que isto tem teste.
//
// Em 11/09/2026 a auditoria E2E encontrou o site no ar com quatro sintomas que
// pareciam separados: o questionário não criava o site (UX-001), "Criar
// convite" devolvia erro em inglês (UX-002), o QR do casamento publicado dava
// 500 (UX-005) e o cartão do link no WhatsApp apontava para `localhost`
// (UX-021). Era tudo a mesma coisa: `NEXT_PUBLIC_SITE_URL` não estava definida
// no ambiente, e o domínio de produção — `casamentoweb-ten.vercel.app` — não
// estava na allowlist, que tinha `casamentoweb.vercel.app`, sem o `-ten`.
//
// Uma allowlist é uma lista que alguém precisa lembrar de atualizar. Este teste
// existe para que o produto pare de depender dessa memória: ele fixa a cascata
// de descoberta, e fixa também o que NÃO pode acontecer — host forjado virar
// link, e `localhost` vazar para produção.

const headersMock = vi.fn();
vi.mock("next/headers", () => ({ headers: () => headersMock() }));

function comHost(host: string | null, proto?: string) {
  headersMock.mockReturnValue({
    get: (nome: string) => {
      if (nome === "x-forwarded-host") return null;
      if (nome === "host") return host;
      if (nome === "x-forwarded-proto") return proto ?? null;
      return null;
    },
  });
}

const AMBIENTE = [
  "NEXT_PUBLIC_SITE_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
  "VERCEL_URL",
] as const;

beforeEach(() => {
  for (const chave of AMBIENTE) vi.stubEnv(chave, "");
  vi.stubEnv("NODE_ENV", "test");
  comHost("localhost:3000");
});

afterEach(() => {
  vi.unstubAllEnvs();
  headersMock.mockReset();
});

async function carregar() {
  return await import("./baseUrl");
}

describe("a cascata de descoberta do endereço", () => {
  it("(a) usa NEXT_PUBLIC_SITE_URL acima de tudo", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://enlace.com.br");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "casamentoweb-ten.vercel.app");
    vi.stubEnv("VERCEL_URL", "deploy-qualquer.vercel.app");

    const { getBaseUrl, baseUrlEstatica } = await carregar();
    expect(await getBaseUrl()).toBe("https://enlace.com.br");
    expect(baseUrlEstatica()).toBe("https://enlace.com.br");
  });

  it("(b) sem ela, usa o domínio de produção que a plataforma informa", async () => {
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "casamentoweb-ten.vercel.app");
    vi.stubEnv("VERCEL_URL", "deploy-qualquer.vercel.app");

    const { getBaseUrl, baseUrlEstatica } = await carregar();
    expect(await getBaseUrl()).toBe("https://casamentoweb-ten.vercel.app");
    expect(baseUrlEstatica()).toBe("https://casamentoweb-ten.vercel.app");
  });

  it("(c) sem o domínio de produção, usa o da publicação atual", async () => {
    vi.stubEnv("VERCEL_URL", "enlace-git-001-teste.vercel.app");

    const { getBaseUrl, baseUrlEstatica } = await carregar();
    expect(await getBaseUrl()).toBe("https://enlace-git-001-teste.vercel.app");
    expect(baseUrlEstatica()).toBe("https://enlace-git-001-teste.vercel.app");
  });

  it("(d) sem nenhuma variável, aceita o host da requisição se ele estiver na allowlist", async () => {
    comHost("casamentoweb-ten.vercel.app", "https");

    const { getBaseUrl } = await carregar();
    expect(await getBaseUrl()).toBe("https://casamentoweb-ten.vercel.app");
  });

  it("(e) recusa host fora da allowlist — host forjado não vira link", async () => {
    comHost("site-do-atacante.example", "https");

    const { getBaseUrl, baseUrlOuNulo } = await carregar();
    await expect(getBaseUrl()).rejects.toThrow();
    expect(await baseUrlOuNulo()).toBeNull();
  });

  it("(f) só devolve localhost fora de produção", async () => {
    const { baseUrlEstatica } = await carregar();
    expect(baseUrlEstatica()).toBe("http://localhost:3000");

    vi.stubEnv("NODE_ENV", "production");
    expect(baseUrlEstatica()).toBe("");
  });

  it("(g) tira a barra do fim", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://enlace.com.br/");

    const { getBaseUrl, baseUrlEstatica } = await carregar();
    expect(await getBaseUrl()).toBe("https://enlace.com.br");
    expect(baseUrlEstatica()).toBe("https://enlace.com.br");
  });

  it("aceita o endereço da plataforma já com esquema, sem duplicar", async () => {
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "https://casamentoweb-ten.vercel.app");

    const { baseUrlEstatica } = await carregar();
    expect(baseUrlEstatica()).toBe("https://casamentoweb-ten.vercel.app");
  });

  it("baseUrlOuNulo devolve o endereço quando ele existe", async () => {
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "casamentoweb-ten.vercel.app");

    const { baseUrlOuNulo } = await carregar();
    expect(await baseUrlOuNulo()).toBe("https://casamentoweb-ten.vercel.app");
  });
});
