import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { db } from "@/lib/db/client";
import { groups, guests, sites } from "@/lib/db/schema";
import { createTestSite } from "./testSite";
import {
  createGroup,
  getGroupBySlug,
  listGroupsWithGuests,
  deleteGroup,
} from "./groups";

let siteId: string;

beforeEach(async () => {
  await db.delete(guests);
  await db.delete(groups);
  await db.delete(sites);
  siteId = (await createTestSite()).id;
});

afterAll(async () => {
  await db.delete(guests);
  await db.delete(groups);
  await db.delete(sites);
});

describe("createGroup", () => {
  it("creates a group with two guests as pending", async () => {
    const result = await createGroup({
      siteId,
      label: "Família Teste",
      guestNames: ["Ana", "Bruno"],
    });

    expect(result.slug).toMatch(/^[A-Za-z0-9_-]{8}$/);
    expect(result.siteId).toBe(siteId);
    expect(result.guests).toHaveLength(2);
    expect(result.guests.map((g) => g.name)).toEqual(["Ana", "Bruno"]);
    expect(result.guests.every((g) => g.rsvpStatus === "pending")).toBe(true);
  });

  it("creates a group with a single guest", async () => {
    const result = await createGroup({ siteId, guestNames: ["Carla"] });
    expect(result.guests).toHaveLength(1);
  });
});

describe("getGroupBySlug", () => {
  it("returns the group with guests ordered by position", async () => {
    const created = await createGroup({ siteId, guestNames: ["Ana", "Bruno"] });

    const found = await getGroupBySlug(created.slug);

    expect(found).not.toBeNull();
    expect(found!.guests.map((g) => g.name)).toEqual(["Ana", "Bruno"]);
  });

  it("returns null for an unknown slug", async () => {
    const found = await getGroupBySlug("nonexistent");
    expect(found).toBeNull();
  });

  // A busca por slug é global de propósito: os links /rsvp/<slug> já estão
  // com os convidados e não podem depender de saber o site. O tenant vem
  // no resultado. Ver docs/sdd-geracao-automatica.md §6.2.
  it("finds a group from any site and reports which site it belongs to", async () => {
    const outroSite = await createTestSite();
    const created = await createGroup({
      siteId: outroSite.id,
      guestNames: ["Convidada de outro casamento"],
    });

    const found = await getGroupBySlug(created.slug);

    expect(found).not.toBeNull();
    expect(found!.siteId).toBe(outroSite.id);
  });
});

describe("listGroupsWithGuests", () => {
  it("lists all groups with their guests", async () => {
    await createGroup({ siteId, guestNames: ["Ana", "Bruno"] });
    await createGroup({ siteId, guestNames: ["Carla"] });

    const list = await listGroupsWithGuests(siteId);

    expect(list).toHaveLength(2);
    const totalGuests = list.reduce((sum, g) => sum + g.guests.length, 0);
    expect(totalGuests).toBe(3);
  });

  // O teste que impede a regressão mais cara do projeto.
  it("NEVER returns groups from another site", async () => {
    const outroSite = await createTestSite();
    await createGroup({ siteId, guestNames: ["Convidado nosso"] });
    await createGroup({
      siteId: outroSite.id,
      guestNames: ["Convidado do outro casal"],
    });

    const list = await listGroupsWithGuests(siteId);

    expect(list).toHaveLength(1);
    expect(list[0].guests[0].name).toBe("Convidado nosso");
    expect(list.every((g) => g.siteId === siteId)).toBe(true);
  });
});

describe("deleteGroup", () => {
  it("removes the group and cascades to its guests", async () => {
    const created = await createGroup({ siteId, guestNames: ["Ana", "Bruno"] });

    await deleteGroup(siteId, created.id);

    const found = await getGroupBySlug(created.slug);
    expect(found).toBeNull();

    const remainingGuests = await db.select().from(guests);
    expect(remainingGuests).toHaveLength(0);
  });

  it("refuses to delete a group that belongs to another site", async () => {
    const outroSite = await createTestSite();
    const alheio = await createGroup({
      siteId: outroSite.id,
      guestNames: ["Não é seu"],
    });

    await deleteGroup(siteId, alheio.id);

    // Continua lá: o escopo protegeu o dado do outro casal.
    const found = await getGroupBySlug(alheio.slug);
    expect(found).not.toBeNull();
  });
});
