import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { db } from "@/lib/db/client";
import { groups, guests } from "@/lib/db/schema";
import {
  createGroup,
  getGroupBySlug,
  listGroupsWithGuests,
  deleteGroup,
} from "./groups";

beforeEach(async () => {
  await db.delete(guests);
  await db.delete(groups);
});

afterAll(async () => {
  await db.delete(guests);
  await db.delete(groups);
});

describe("createGroup", () => {
  it("creates a group with two guests as pending", async () => {
    const result = await createGroup({
      label: "Família Teste",
      guestNames: ["Ana", "Bruno"],
    });

    expect(result.slug).toMatch(/^[A-Za-z0-9_-]{8}$/);
    expect(result.guests).toHaveLength(2);
    expect(result.guests.map((g) => g.name)).toEqual(["Ana", "Bruno"]);
    expect(result.guests.every((g) => g.rsvpStatus === "pending")).toBe(true);
  });

  it("creates a group with a single guest", async () => {
    const result = await createGroup({ guestNames: ["Carla"] });
    expect(result.guests).toHaveLength(1);
  });
});

describe("getGroupBySlug", () => {
  it("returns the group with guests ordered by position", async () => {
    const created = await createGroup({ guestNames: ["Ana", "Bruno"] });

    const found = await getGroupBySlug(created.slug);

    expect(found).not.toBeNull();
    expect(found!.guests.map((g) => g.name)).toEqual(["Ana", "Bruno"]);
  });

  it("returns null for an unknown slug", async () => {
    const found = await getGroupBySlug("nonexistent");
    expect(found).toBeNull();
  });
});

describe("listGroupsWithGuests", () => {
  it("lists all groups with their guests", async () => {
    await createGroup({ guestNames: ["Ana", "Bruno"] });
    await createGroup({ guestNames: ["Carla"] });

    const list = await listGroupsWithGuests();

    expect(list).toHaveLength(2);
    const totalGuests = list.reduce((sum, g) => sum + g.guests.length, 0);
    expect(totalGuests).toBe(3);
  });
});

describe("deleteGroup", () => {
  it("removes the group and cascades to its guests", async () => {
    const created = await createGroup({ guestNames: ["Ana", "Bruno"] });

    await deleteGroup(created.id);

    const found = await getGroupBySlug(created.slug);
    expect(found).toBeNull();

    const remainingGuests = await db.select().from(guests);
    expect(remainingGuests).toHaveLength(0);
  });
});
