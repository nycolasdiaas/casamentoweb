import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { db } from "@/lib/db/client";
import { groups, guests } from "@/lib/db/schema";
import { createGroup } from "@/lib/repositories/groups";
import { submitRsvpAction } from "./rsvp-actions";

beforeEach(async () => {
  await db.delete(guests);
  await db.delete(groups);
});

afterAll(async () => {
  await db.delete(guests);
  await db.delete(groups);
});

describe("submitRsvpAction", () => {
  it("updates the guest's rsvp status", async () => {
    const group = await createGroup({ guestNames: ["Ana"] });
    const [ana] = group.guests;

    const result = await submitRsvpAction(ana.id, "confirmed");

    expect(result.rsvpStatus).toBe("confirmed");
  });

  it("throws for an unknown guest id", async () => {
    await expect(
      submitRsvpAction("00000000-0000-0000-0000-000000000000", "declined")
    ).rejects.toThrow();
  });
});
