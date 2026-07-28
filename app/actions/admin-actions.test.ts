import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
}));

const sessionState = { valid: true };
vi.mock("@/lib/auth/session", () => ({
  getSessionAdminId: vi.fn(async () =>
    sessionState.valid ? "11111111-1111-1111-1111-111111111111" : null
  ),
}));

import { db } from "@/lib/db/client";
import { groups, guests, sites } from "@/lib/db/schema";
import { createTestSite } from "@/lib/repositories/testSite";
import { LEGACY_SITE_SLUG } from "@/lib/repositories/sites";
import {
  createGroupAction,
  deleteGroupAction,
} from "./admin-actions";

beforeEach(async () => {
  sessionState.valid = true;
  await db.delete(guests);
  await db.delete(groups);
  await db.delete(sites);
  // As actions ainda resolvem o tenant pelo slug legado (Fase 0).
  await createTestSite(LEGACY_SITE_SLUG);
});

afterAll(async () => {
  await db.delete(guests);
  await db.delete(groups);
  await db.delete(sites);
});

describe("createGroupAction", () => {
  it("rejects when there is no valid admin session", async () => {
    sessionState.valid = false;
    const formData = new FormData();
    formData.set("name", "Ana");

    await expect(createGroupAction(formData)).rejects.toThrow();

    const allGroups = await db.select().from(groups);
    expect(allGroups).toHaveLength(0);
  });

  it("persists a group with the submitted guest names", async () => {
    const formData = new FormData();
    formData.set("label", "Família Teste");
    formData.append("name", "Ana");
    formData.append("name", "Bruno");

    await createGroupAction(formData);

    const allGroups = await db.select().from(groups);
    expect(allGroups).toHaveLength(1);

    const allGuests = await db.select().from(guests);
    expect(allGuests.map((g) => g.name).sort()).toEqual(["Ana", "Bruno"]);
  });
});

describe("deleteGroupAction", () => {
  it("rejects when there is no valid admin session", async () => {
    const formData = new FormData();
    formData.append("name", "Ana");
    await createGroupAction(formData);
    const [group] = await db.select().from(groups);

    sessionState.valid = false;
    await expect(deleteGroupAction(group.id)).rejects.toThrow();

    const stillThere = await db.select().from(groups);
    expect(stillThere).toHaveLength(1);
  });

  it("removes the group when session is valid", async () => {
    const formData = new FormData();
    formData.append("name", "Ana");
    await createGroupAction(formData);
    const [group] = await db.select().from(groups);

    await deleteGroupAction(group.id);

    const remaining = await db.select().from(groups);
    expect(remaining).toHaveLength(0);
  });
});
