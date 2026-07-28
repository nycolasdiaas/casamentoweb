import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { db } from "@/lib/db/client";
import { gifts, giftContributions, sites } from "@/lib/db/schema";
import { createTestSite } from "./testSite";
import {
  createGift,
  updateGift,
  deleteGift,
  listGifts,
  getGiftById,
  registerContribution,
  listContributions,
  groupGiftsByCategory,
} from "./gifts";

let siteId: string;

beforeEach(async () => {
  await db.delete(giftContributions);
  await db.delete(gifts);
  await db.delete(sites);
  siteId = (await createTestSite()).id;
});

afterAll(async () => {
  await db.delete(giftContributions);
  await db.delete(gifts);
  await db.delete(sites);
});

describe("createGift", () => {
  it("creates gifts with sequential positions", async () => {
    const first = await createGift(siteId, {
      category: "Lua de Mel",
      name: "Caipirinha à beira-mar",
      priceCents: 5000,
    });
    const second = await createGift(siteId, {
      category: "Lua de Mel",
      name: "Jantar romântico",
      priceCents: 20000,
    });

    expect(second.position).toBe(first.position + 1);
  });

  it("accepts a null price (guest chooses the amount)", async () => {
    const gift = await createGift(siteId, {
      category: "Livre",
      name: "Presente livre",
      priceCents: null,
    });
    expect(gift.priceCents).toBeNull();
  });

  // A posição é por site: o primeiro presente de um casal começa em 0
  // mesmo que outro casal já tenha uma lista cheia.
  it("numbers positions per site, not globally", async () => {
    const outroSite = await createTestSite();
    await createGift(outroSite.id, {
      category: "X",
      name: "Do outro casal",
      priceCents: 100,
    });

    const nosso = await createGift(siteId, {
      category: "Y",
      name: "Nosso primeiro",
      priceCents: 100,
    });

    expect(nosso.position).toBe(0);
  });
});

describe("updateGift", () => {
  it("updates name, category and price", async () => {
    const gift = await createGift(siteId, {
      category: "Lua de Mel",
      name: "Caipirinha",
      priceCents: 5000,
    });

    const updated = await updateGift(siteId, gift.id, {
      category: "Gastronomia",
      name: "Caipirinha dupla",
      priceCents: 7000,
    });

    expect(updated).toMatchObject({
      category: "Gastronomia",
      name: "Caipirinha dupla",
      priceCents: 7000,
    });
  });

  it("returns null for an unknown id", async () => {
    const updated = await updateGift(
      siteId,
      "00000000-0000-0000-0000-000000000000",
      { category: "X", name: "Y", priceCents: null }
    );
    expect(updated).toBeNull();
  });

  it("refuses to update a gift from another site", async () => {
    const outroSite = await createTestSite();
    const alheio = await createGift(outroSite.id, {
      category: "Lua de Mel",
      name: "Não é seu",
      priceCents: 5000,
    });

    const updated = await updateGift(siteId, alheio.id, {
      category: "Invadido",
      name: "Invadido",
      priceCents: 1,
    });

    expect(updated).toBeNull();
    const intacto = await getGiftById(outroSite.id, alheio.id);
    expect(intacto!.name).toBe("Não é seu");
  });
});

describe("deleteGift", () => {
  it("removes the gift but keeps contributions with the name snapshot", async () => {
    const gift = await createGift(siteId, {
      category: "Lua de Mel",
      name: "Caipirinha",
      priceCents: 5000,
    });
    await registerContribution({
      giftId: gift.id,
      giftName: gift.name,
      guestName: "Ana",
    });

    await deleteGift(siteId, gift.id);

    expect(await getGiftById(siteId, gift.id)).toBeNull();
    // A contribuição sobrevive, mas perde o vínculo com o presente — por
    // isso ela sai do escopo do site, que é derivado da lista de presentes.
    const orfas = await db.select().from(giftContributions);
    expect(orfas).toHaveLength(1);
    expect(orfas[0].giftId).toBeNull();
    expect(orfas[0].giftName).toBe("Caipirinha");
  });

  it("refuses to delete a gift from another site", async () => {
    const outroSite = await createTestSite();
    const alheio = await createGift(outroSite.id, {
      category: "X",
      name: "Não é seu",
      priceCents: 100,
    });

    await deleteGift(siteId, alheio.id);

    expect(await getGiftById(outroSite.id, alheio.id)).not.toBeNull();
  });
});

describe("listGifts", () => {
  it("returns gifts ordered by position", async () => {
    await createGift(siteId, { category: "B", name: "Segundo", priceCents: 100 });
    await createGift(siteId, { category: "A", name: "Terceiro", priceCents: 100 });

    const list = await listGifts(siteId);
    expect(list.map((g) => g.name)).toEqual(["Segundo", "Terceiro"]);
  });

  // O teste que impede a regressão mais cara do projeto: antes da Fase 0,
  // listGifts() devolvia os presentes do banco inteiro.
  it("NEVER returns gifts from another site", async () => {
    const outroSite = await createTestSite();
    await createGift(siteId, { category: "A", name: "Nosso", priceCents: 100 });
    await createGift(outroSite.id, {
      category: "A",
      name: "Do outro casal",
      priceCents: 100,
    });

    const list = await listGifts(siteId);

    expect(list).toHaveLength(1);
    expect(list[0].name).toBe("Nosso");
  });
});

describe("getGiftById", () => {
  it("does not return a gift from another site", async () => {
    const outroSite = await createTestSite();
    const alheio = await createGift(outroSite.id, {
      category: "A",
      name: "Do outro casal",
      priceCents: 100,
    });

    expect(await getGiftById(siteId, alheio.id)).toBeNull();
  });
});

describe("listContributions", () => {
  it("returns only contributions for gifts of the given site", async () => {
    const outroSite = await createTestSite();
    const nosso = await createGift(siteId, {
      category: "A",
      name: "Nosso",
      priceCents: 100,
    });
    const alheio = await createGift(outroSite.id, {
      category: "A",
      name: "Do outro casal",
      priceCents: 100,
    });

    await registerContribution({
      giftId: nosso.id,
      giftName: nosso.name,
      guestName: "Ana",
    });
    await registerContribution({
      giftId: alheio.id,
      giftName: alheio.name,
      guestName: "Convidado alheio",
    });

    const list = await listContributions(siteId);

    expect(list).toHaveLength(1);
    expect(list[0].guestName).toBe("Ana");
  });

  it("returns an empty list when the site has no gifts", async () => {
    expect(await listContributions(siteId)).toEqual([]);
  });
});

describe("registerContribution", () => {
  it("stores an anonymous contribution when guestName is null", async () => {
    const gift = await createGift(siteId, {
      category: "Lua de Mel",
      name: "Caipirinha",
      priceCents: 5000,
    });

    const contribution = await registerContribution({
      giftId: gift.id,
      giftName: gift.name,
      guestName: null,
    });

    expect(contribution.guestName).toBeNull();
    expect(contribution.giftId).toBe(gift.id);
  });
});

describe("groupGiftsByCategory", () => {
  it("groups preserving first-appearance order", () => {
    const grouped = groupGiftsByCategory([
      { category: "Lua de Mel", name: "a" },
      { category: "Zoeira", name: "b" },
      { category: "Lua de Mel", name: "c" },
    ]);

    expect(grouped.map((g) => g.category)).toEqual(["Lua de Mel", "Zoeira"]);
    expect(grouped[0].gifts).toHaveLength(2);
  });
});
