import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const sessionState = { valid: true };
vi.mock("@/lib/auth/session", () => ({
  verifySessionCookie: vi.fn(async () => sessionState.valid),
}));

import { db } from "@/lib/db/client";
import { groups, guests } from "@/lib/db/schema";
import {
  createGroupAction,
  deleteGroupAction,
} from "./admin-actions";

beforeEach(async () => {
  sessionState.valid = true;
  await db.delete(guests);
  await db.delete(groups);
});

afterAll(async () => {
  await db.delete(guests);
  await db.delete(groups);
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
