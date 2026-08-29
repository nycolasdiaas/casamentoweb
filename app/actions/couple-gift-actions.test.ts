import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";

/**
 * E6 · as cotas de presente, editadas PELO CASAL.
 *
 * ── O que estes testes protegem ────────────────────────────────────────────
 *
 * As três actions existiam há tempos e nunca tinham sido chamadas por tela
 * nenhuma — o casal era mandado ao WhatsApp. Ao ligá-las à interface, elas
 * passaram a receber entrada de gente de verdade, e o que precisa de rede é a
 * **posse**: `gift-actions.ts` (do admin) trabalha preso ao site legado, e
 * reaproveitar aquele caminho daria a um casal a lista de outro. Aqui o escopo
 * vem do dono do site, conferido a cada chamada.
 *
 * O segundo grupo cobre a coluna nova da 0017 (`quantity`), incluindo o que
 * ela significa quando está vazia: sem teto, que é como toda cota anterior à
 * migração se comporta.
 */

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
}));

/* A sessão do CASAL, não a do admin. `sessaoDe` troca quem está logado entre
   os casos — é assim que dá para provar que o casal B não alcança a lista do
   casal A. */
const sessao = { userId: null as string | null };
vi.mock("@/lib/auth/userSession", () => ({
  getSessionUserId: vi.fn(async () => sessao.userId),
}));

import { db } from "@/lib/db/client";
import { gifts, sites, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createTestSite } from "@/lib/repositories/testSite";
import { listGifts } from "@/lib/repositories/gifts";
import {
  criarCotaAction,
  editarCotaAction,
  apagarCotaAction,
} from "./couple-gift-actions";

let siteId: string;
let donoId: string;

async function criarUsuario(email: string): Promise<string> {
  const [u] = await db
    .insert(users)
    .values({ name: "Casal", email, passwordHash: "x:y" })
    .returning();
  return u.id;
}

beforeEach(async () => {
  await db.delete(gifts);
  await db.delete(sites);
  await db.delete(users);

  donoId = await criarUsuario(`dono-${Date.now()}@teste.com`);
  const site = await createTestSite();
  await db.update(sites).set({ userId: donoId }).where(eq(sites.id, site.id));
  siteId = site.id;
  sessao.userId = donoId;
});

afterAll(async () => {
  await db.delete(gifts);
  await db.delete(sites);
  await db.delete(users);
});

function cota(campos: Record<string, string>): FormData {
  const fd = new FormData();
  fd.append("siteId", siteId);
  for (const [k, v] of Object.entries(campos)) fd.append(k, v);
  return fd;
}

describe("criarCotaAction", () => {
  it("cria a cota com nome, categoria, preço e quantidade", async () => {
    const r = await criarCotaAction(
      undefined,
      cota({ name: "Lua de mel", category: "Viagem", price: "250", quantity: "20" })
    );

    expect(r).toMatchObject({ saved: true });
    const [salva] = await listGifts(siteId);
    expect(salva.name).toBe("Lua de mel");
    expect(salva.priceCents).toBe(25000);
    expect(salva.quantity).toBe(20);
  });

  it("quantidade em branco significa SEM TETO, não zero", async () => {
    await criarCotaAction(
      undefined,
      cota({ name: "Jantar", category: "Festa", price: "150" })
    );

    const [salva] = await listGifts(siteId);
    expect(salva.quantity).toBeNull();
  });

  it("preço em branco significa 'o convidado decide'", async () => {
    await criarCotaAction(
      undefined,
      cota({ name: "Presente livre", category: "Outros" })
    );

    const [salva] = await listGifts(siteId);
    expect(salva.priceCents).toBeNull();
  });

  it("recusa cota sem nome", async () => {
    const r = await criarCotaAction(undefined, cota({ category: "Viagem" }));
    expect(r).toHaveProperty("error");
    expect(await listGifts(siteId)).toHaveLength(0);
  });

  it("recusa quantidade fracionada ou zero", async () => {
    for (const q of ["0", "2,5", "-3"]) {
      const r = await criarCotaAction(
        undefined,
        cota({ name: "X", category: "Y", quantity: q })
      );
      expect(r).toHaveProperty("error");
    }
    expect(await listGifts(siteId)).toHaveLength(0);
  });

  it("recusa quem não está logado", async () => {
    sessao.userId = null;
    const r = await criarCotaAction(
      undefined,
      cota({ name: "Lua de mel", category: "Viagem" })
    );
    expect(r).toHaveProperty("error");
  });
});

describe("posse do site", () => {
  it("outro casal não cria cota na lista alheia", async () => {
    sessao.userId = await criarUsuario(`outro-${Date.now()}@teste.com`);

    const r = await criarCotaAction(
      undefined,
      cota({ name: "Invasão", category: "X" })
    );

    expect(r).toHaveProperty("error");
    expect(await listGifts(siteId)).toHaveLength(0);
  });

  it("outro casal não edita nem apaga cota alheia", async () => {
    await criarCotaAction(
      undefined,
      cota({ name: "Lua de mel", category: "Viagem", price: "250" })
    );
    const [minha] = await listGifts(siteId);

    sessao.userId = await criarUsuario(`outro2-${Date.now()}@teste.com`);

    const edicao = await editarCotaAction(
      undefined,
      cota({ giftId: minha.id, name: "Roubada", category: "X" })
    );
    const exclusao = await apagarCotaAction(
      undefined,
      cota({ giftId: minha.id })
    );

    expect(edicao).toHaveProperty("error");
    expect(exclusao).toHaveProperty("error");

    const [aindaMinha] = await listGifts(siteId);
    expect(aindaMinha.name).toBe("Lua de mel");
  });
});

describe("editarCotaAction e apagarCotaAction", () => {
  it("edita preço e quantidade", async () => {
    await criarCotaAction(
      undefined,
      cota({ name: "Lua de mel", category: "Viagem", price: "250", quantity: "20" })
    );
    const [antes] = await listGifts(siteId);

    await editarCotaAction(
      undefined,
      cota({
        giftId: antes.id,
        name: "Lua de mel",
        category: "Viagem",
        price: "300",
        quantity: "10",
      })
    );

    const [depois] = await listGifts(siteId);
    expect(depois.priceCents).toBe(30000);
    expect(depois.quantity).toBe(10);
  });

  it("apagar tira a cota da lista", async () => {
    await criarCotaAction(undefined, cota({ name: "Jantar", category: "Festa" }));
    const [criada] = await listGifts(siteId);

    await apagarCotaAction(undefined, cota({ giftId: criada.id }));

    expect(await listGifts(siteId)).toHaveLength(0);
  });
});
