import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { db } from "@/lib/db/client";
import { gifts, giftContributions } from "@/lib/db/schema";
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

beforeEach(async () => {
  await db.delete(giftContributions);
  await db.delete(gifts);
});

afterAll(async () => {
  await db.delete(giftContributions);
  await db.delete(gifts);
});

describe("createGift", () => {
  it("creates gifts with sequential positions", async () => {
    const first = await createGift({
      category: "Lua de Mel",
      name: "Caipirinha à beira-mar",
      priceCents: 5000,
    });
    const second = await createGift({
      category: "Lua de Mel",
      name: "Jantar romântico",
      priceCents: 20000,
    });

    expect(second.position).toBe(first.position + 1);
  });

  it("accepts a null price (guest chooses the amount)", async () => {
    const gift = await createGift({
      category: "Livre",
      name: "Presente livre",
      priceCents: null,
    });
    expect(gift.priceCents).toBeNull();
  });
});

describe("updateGift", () => {
  it("updates name, category and price", async () => {
    const gift = await createGift({
      category: "Lua de Mel",
      name: "Caipirinha",
      priceCents: 5000,
    });

    const updated = await updateGift(gift.id, {
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
      "00000000-0000-0000-0000-000000000000",
      { category: "X", name: "Y", priceCents: null }
    );
    expect(updated).toBeNull();
  });
});

describe("deleteGift", () => {
  it("removes the gift but keeps contributions with the name snapshot", async () => {
    const gift = await createGift({
      category: "Lua de Mel",
      name: "Caipirinha",
      priceCents: 5000,
    });
    await registerContribution({
      giftId: gift.id,
      giftName: gift.name,
      guestName: "Ana",
    });

    await deleteGift(gift.id);

    expect(await getGiftById(gift.id)).toBeNull();
    const contributions = await listContributions();
    expect(contributions).toHaveLength(1);
    expect(contributions[0].giftId).toBeNull();
    expect(contributions[0].giftName).toBe("Caipirinha");
  });
});

describe("listGifts", () => {
  it("returns gifts ordered by position", async () => {
    await createGift({ category: "B", name: "Segundo", priceCents: 100 });
    await createGift({ category: "A", name: "Terceiro", priceCents: 100 });

    const list = await listGifts();
    expect(list.map((g) => g.name)).toEqual(["Segundo", "Terceiro"]);
  });
});

describe("registerContribution", () => {
  it("stores an anonymous contribution when guestName is null", async () => {
    const gift = await createGift({
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
