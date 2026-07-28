import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { db } from "@/lib/db/client";
import { groups, guests, loginAttempts, sites } from "@/lib/db/schema";
import { createGroup } from "@/lib/repositories/groups";
import { createTestSite } from "@/lib/repositories/testSite";
import { submitRsvpAction } from "./rsvp-actions";

let siteId: string;

beforeEach(async () => {
  await db.delete(guests);
  await db.delete(groups);
  await db.delete(loginAttempts);
  await db.delete(sites);
  siteId = (await createTestSite()).id;
});

afterAll(async () => {
  await db.delete(guests);
  await db.delete(groups);
  await db.delete(loginAttempts);
  await db.delete(sites);
});

describe("submitRsvpAction", () => {
  it("updates the guest's rsvp status", async () => {
    const group = await createGroup({ siteId, guestNames: ["Ana"] });
    const [ana] = group.guests;

    const result = await submitRsvpAction(group.slug, ana.id, "confirmed");

    expect(result.rsvpStatus).toBe("confirmed");
  });

  it("throws for an unknown guest id", async () => {
    const group = await createGroup({ siteId, guestNames: ["Ana"] });

    await expect(
      submitRsvpAction(
        group.slug,
        "00000000-0000-0000-0000-000000000000",
        "declined"
      )
    ).rejects.toThrow();
  });

  it("throws when the guest belongs to a different group's slug", async () => {
    const groupA = await createGroup({ siteId, guestNames: ["Ana"] });
    const groupB = await createGroup({ siteId, guestNames: ["Bruno"] });

    await expect(
      submitRsvpAction(groupA.slug, groupB.guests[0].id, "confirmed")
    ).rejects.toThrow();
  });
});
