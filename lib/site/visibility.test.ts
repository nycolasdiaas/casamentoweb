import { describe, it, expect, vi, beforeEach } from "vitest";

// As duas funções só tocam o banco no caminho feliz; as REGRAS são o que
// importa testar, e elas decidem antes de escrever. O mock deixa o teste
// rápido e independente do Postgres remoto.
const updates: { status: string }[] = [];
vi.mock("@/lib/db/client", () => ({
  db: {
    update: () => ({
      set: (valores: { status: string }) => {
        updates.push(valores);
        return { where: async () => undefined };
      },
    }),
  },
}));

import { archiveSite, unarchiveSite } from "./visibility";

beforeEach(() => {
  updates.length = 0;
});

describe("archiveSite", () => {
  it("tira do ar um site publicado", async () => {
    const r = await archiveSite({ id: "s1", status: "published" });
    expect(r).toEqual({ ok: true, status: "archived" });
    expect(updates).toHaveLength(1);
    expect(updates[0].status).toBe("archived");
  });

  it("é idempotente: arquivar de novo não escreve", async () => {
    const r = await archiveSite({ id: "s1", status: "archived" });
    expect(r).toEqual({ ok: true, status: "archived" });
    expect(updates).toHaveLength(0);
  });

  // Prévia não está no ar; "tirar do ar" ali não significa nada, e deixar
  // passar mudaria o status para um valor que o fluxo de pagamento recusa
  // republicar depois.
  it("recusa arquivar site que ainda está em prévia", async () => {
    const r = await archiveSite({ id: "s1", status: "preview" });
    expect(r.ok).toBe(false);
    expect(updates).toHaveLength(0);
  });
});

describe("unarchiveSite", () => {
  it("devolve ao ar um site que já tinha sido publicado", async () => {
    const r = await unarchiveSite({
      id: "s1",
      status: "archived",
      publishedAt: new Date("2026-07-01"),
    });
    expect(r).toEqual({ ok: true, status: "published" });
    expect(updates[0].status).toBe("published");
  });

  // A regra de negócio: a PRIMEIRA publicação é do fluxo de pagamento. Sem
  // isto o casal arquivaria e desarquivaria para publicar sem pagar.
  it("recusa publicar site que nunca foi publicado", async () => {
    const r = await unarchiveSite({
      id: "s1",
      status: "archived",
      publishedAt: null,
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toContain("pagamento");
    expect(updates).toHaveLength(0);
  });

  it("é idempotente: já publicado não escreve", async () => {
    const r = await unarchiveSite({
      id: "s1",
      status: "published",
      publishedAt: new Date(),
    });
    expect(r).toEqual({ ok: true, status: "published" });
    expect(updates).toHaveLength(0);
  });

  it("recusa desarquivar site em prévia", async () => {
    const r = await unarchiveSite({
      id: "s1",
      status: "preview",
      publishedAt: null,
    });
    expect(r.ok).toBe(false);
    expect(updates).toHaveLength(0);
  });
});
