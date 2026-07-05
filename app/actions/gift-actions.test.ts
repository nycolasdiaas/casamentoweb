import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const sessionState = { valid: true };
vi.mock("@/lib/auth/session", () => ({
  verifySessionCookie: vi.fn(async () => sessionState.valid),
}));

import { db } from "@/lib/db/client";
import { gifts, giftContributions } from "@/lib/db/schema";
import {
  createGiftAction,
  updateGiftAction,
  deleteGiftAction,
  registerContributionAction,
} from "./gift-actions";

function giftFormData(category: string, name: string, price: string) {
  const formData = new FormData();
  formData.set("category", category);
  formData.set("name", name);
  formData.set("price", price);
  return formData;
}

beforeEach(async () => {
  sessionState.valid = true;
  await db.delete(giftContributions);
  await db.delete(gifts);
});

afterAll(async () => {
  await db.delete(giftContributions);
  await db.delete(gifts);
});

describe("createGiftAction", () => {
  it("rejects when there is no valid admin session", async () => {
    sessionState.valid = false;
    await expect(
      createGiftAction(giftFormData("Lua de Mel", "Caipirinha", "50"))
    ).rejects.toThrow();

    expect(await db.select().from(gifts)).toHaveLength(0);
  });

  it("persists the gift parsing pt-BR prices to cents", async () => {
    const gift = await createGiftAction(
      giftFormData("Lua de Mel", "Caipirinha", "1.500,50")
    );
    expect(gift.priceCents).toBe(150050);
  });

  it("creates a free-amount gift when price is empty", async () => {
    const gift = await createGiftAction(giftFormData("Livre", "Surpresa", ""));
    expect(gift.priceCents).toBeNull();
  });

  it("rejects an invalid price", async () => {
    await expect(
      createGiftAction(giftFormData("Livre", "Surpresa", "abc"))
    ).rejects.toThrow();
  });
});

describe("updateGiftAction", () => {
  it("updates an existing gift", async () => {
    const gift = await createGiftAction(
      giftFormData("Lua de Mel", "Caipirinha", "50")
    );

    const updated = await updateGiftAction(
      gift.id,
      giftFormData("Gastronomia", "Caipirinha dupla", "70")
    );

    expect(updated).toMatchObject({
      category: "Gastronomia",
      name: "Caipirinha dupla",
      priceCents: 7000,
    });
  });

  it("rejects without a session", async () => {
    const gift = await createGiftAction(
      giftFormData("Lua de Mel", "Caipirinha", "50")
    );
    sessionState.valid = false;

    await expect(
      updateGiftAction(gift.id, giftFormData("X", "Y", "10"))
    ).rejects.toThrow();
  });
});

describe("deleteGiftAction", () => {
  it("removes the gift when session is valid", async () => {
    const gift = await createGiftAction(
      giftFormData("Lua de Mel", "Caipirinha", "50")
    );

    await deleteGiftAction(gift.id);

    expect(await db.select().from(gifts)).toHaveLength(0);
  });
});

describe("registerContributionAction", () => {
  it("registers a contribution without requiring a session", async () => {
    const gift = await createGiftAction(
      giftFormData("Lua de Mel", "Caipirinha", "50")
    );
    sessionState.valid = false;

    const contribution = await registerContributionAction({
      giftId: gift.id,
      guestName: "  Ana Silva  ",
    });

    expect(contribution.guestName).toBe("Ana Silva");
    expect(contribution.giftName).toBe("Caipirinha");
  });

  it("stores null when the guest stays anonymous", async () => {
    const gift = await createGiftAction(
      giftFormData("Lua de Mel", "Caipirinha", "50")
    );

    const contribution = await registerContributionAction({
      giftId: gift.id,
      guestName: "   ",
    });

    expect(contribution.guestName).toBeNull();
  });

  it("rejects an unknown gift id", async () => {
    await expect(
      registerContributionAction({
        giftId: "00000000-0000-0000-0000-000000000000",
        guestName: "Ana",
      })
    ).rejects.toThrow();
  });
});
