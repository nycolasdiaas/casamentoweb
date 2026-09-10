import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
}));

/* A action lê a sessão do casal e a posse do site. Aqui interessa a REGRA —
   guarda de pacote, lugares, escopo — então a sessão é fixada e a posse é
   resolvida pelo próprio `getSiteOwnedByUser`, com um site de teste que
   pertence ao usuário criado abaixo. */
const sessao = vi.hoisted(() => ({ userId: "" }));
vi.mock("@/lib/auth/userSession", () => ({
  getSessionUserId: async () => sessao.userId,
}));

import crypto from "node:crypto";
import { db } from "@/lib/db/client";
import { groups, guests, sites, users } from "@/lib/db/schema";
import { listGroupsWithGuests } from "@/lib/repositories/groups";
import { criarFamiliaAction } from "./site-actions";

let siteId: string;
let userId: string;

async function criarSiteDoCasal(tier: "convite" | "site" | "para-sempre") {
  const [user] = await db
    .insert(users)
    .values({
      name: "Mariana & Rafael",
      email: `casal-${crypto.randomBytes(6).toString("hex")}@example.com`,
      passwordHash: "x",
    })
    .returning();

  const [site] = await db
    .insert(sites)
    .values({
      slug: `familia-${crypto.randomBytes(6).toString("hex")}`,
      tier,
      status: "preview",
      userId: user.id,
      previewToken: crypto.randomBytes(16).toString("base64url"),
    })
    .returning();

  return { userId: user.id, siteId: site.id };
}

function formulario(campos: Record<string, string | string[]>) {
  const fd = new FormData();
  for (const [chave, valor] of Object.entries(campos)) {
    for (const v of Array.isArray(valor) ? valor : [valor]) fd.append(chave, v);
  }
  return fd;
}

beforeEach(async () => {
  await db.delete(guests);
  await db.delete(groups);
  await db.delete(sites);
  await db.delete(users);
  const criado = await criarSiteDoCasal("site");
  siteId = criado.siteId;
  userId = criado.userId;
  sessao.userId = userId;
});

afterAll(async () => {
  await db.delete(guests);
  await db.delete(groups);
  await db.delete(sites);
  await db.delete(users);
});

describe("criarFamiliaAction", () => {
  it("cadastra a família com os nomes escritos e deriva os lugares da lista", async () => {
    const r = await criarFamiliaAction(
      undefined,
      formulario({
        siteId,
        label: "Família Nogueira",
        nome: ["Dona Cecília", "Seu Antônio"],
        lugares: "9",
      })
    );

    expect(r).toMatchObject({ saved: true });

    const [grupo] = await listGroupsWithGuests(siteId);
    expect(grupo.label).toBe("Família Nogueira");
    // Os nomes mandam: o "9" digitado é ignorado quando há lista.
    expect(grupo.seats).toBe(2);
    expect(grupo.guests.map((g) => g.name)).toEqual([
      "Dona Cecília",
      "Seu Antônio",
    ]);
  });

  it("aceita família sem nomes, usando o número de lugares", async () => {
    // É o caso comum: o casal sabe "Família Silva, 4 lugares" muito antes de
    // saber o nome completo de todo mundo.
    await criarFamiliaAction(
      undefined,
      formulario({ siteId, label: "Família Silva", lugares: "4" })
    );

    const [grupo] = await listGroupsWithGuests(siteId);
    expect(grupo.seats).toBe(4);
    expect(grupo.guests).toHaveLength(0);
  });

  it("nasce sem resposta — `null` não é `0`", async () => {
    // `null` é "ainda não respondeu"; `0` é "respondeu que não vai ninguém".
    // Nascer com 0 diria ao casal que a família recusou antes de ser chamada.
    await criarFamiliaAction(
      undefined,
      formulario({ siteId, label: "Família Costa", lugares: "2" })
    );

    const [grupo] = await listGroupsWithGuests(siteId);
    expect(grupo.seatsConfirmed).toBeNull();
  });

  it("gera um endereço próprio por família", async () => {
    await criarFamiliaAction(
      undefined,
      formulario({ siteId, label: "Família A", lugares: "2" })
    );
    await criarFamiliaAction(
      undefined,
      formulario({ siteId, label: "Família B", lugares: "2" })
    );

    const criados = await listGroupsWithGuests(siteId);
    const slugs = criados.map((g) => g.slug);
    expect(new Set(slugs).size).toBe(2);
    expect(slugs.every(Boolean)).toBe(true);
  });

  it("recusa quando o pacote não inclui confirmação de presença", async () => {
    const convite = await criarSiteDoCasal("convite");
    sessao.userId = convite.userId;

    const r = await criarFamiliaAction(
      undefined,
      formulario({
        siteId: convite.siteId,
        label: "Família Nogueira",
        lugares: "2",
      })
    );

    expect(r).toMatchObject({ error: expect.stringContaining("Site do Casamento") });
    expect(await listGroupsWithGuests(convite.siteId)).toHaveLength(0);
  });

  it("recusa o site de outro casal", async () => {
    const outro = await criarSiteDoCasal("para-sempre");
    // A sessão continua sendo a do primeiro casal.
    sessao.userId = userId;

    const r = await criarFamiliaAction(
      undefined,
      formulario({ siteId: outro.siteId, label: "Família Alheia", lugares: "2" })
    );

    expect(r).toMatchObject({ error: expect.any(String) });
    expect(await listGroupsWithGuests(outro.siteId)).toHaveLength(0);
  });

  it("exige ao menos o nome da família", async () => {
    const r = await criarFamiliaAction(
      undefined,
      formulario({ siteId, label: "  ", lugares: "2" })
    );

    expect(r).toMatchObject({ error: expect.any(String) });
    expect(await listGroupsWithGuests(siteId)).toHaveLength(0);
  });
});
