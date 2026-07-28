import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { groups, guests, sites } from "@/lib/db/schema";
import { createGroup } from "./groups";
import { createTestSite } from "./testSite";
import { updateGuestRsvp } from "./guests";

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

describe("updateGuestRsvp", () => {
  it("sets the status and respondedAt for the given guest", async () => {
    const group = await createGroup({ siteId, guestNames: ["Ana", "Bruno"] });
    const [ana] = group.guests;

    const updated = await updateGuestRsvp(group.id, ana.id, "confirmed");

    expect(updated.rsvpStatus).toBe("confirmed");
    expect(updated.respondedAt).not.toBeNull();
  });

  it("does not affect other guests in the same group", async () => {
    const group = await createGroup({ siteId, guestNames: ["Ana", "Bruno"] });
    const [ana, bruno] = group.guests;

    await updateGuestRsvp(group.id, ana.id, "confirmed");

    const [brunoAfter] = await db
      .select()
      .from(guests)
      .where(eq(guests.id, bruno.id));

    expect(brunoAfter.rsvpStatus).toBe("pending");
    expect(brunoAfter.respondedAt).toBeNull();
  });

  it("throws for a non-existent guest id", async () => {
    const group = await createGroup({ siteId, guestNames: ["Ana"] });
    await expect(
      updateGuestRsvp(
        group.id,
        "00000000-0000-0000-0000-000000000000",
        "confirmed"
      )
    ).rejects.toThrow();
  });

  it("throws when the guest belongs to a different group", async () => {
    const groupA = await createGroup({ siteId, guestNames: ["Ana"] });
    const groupB = await createGroup({ siteId, guestNames: ["Bruno"] });

    await expect(
      updateGuestRsvp(groupA.id, groupB.guests[0].id, "confirmed")
    ).rejects.toThrow();
  });
});
