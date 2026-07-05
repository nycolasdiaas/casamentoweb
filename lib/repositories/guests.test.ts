import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { groups, guests } from "@/lib/db/schema";
import { createGroup } from "./groups";
import { updateGuestRsvp } from "./guests";

beforeEach(async () => {
  await db.delete(guests);
  await db.delete(groups);
});

afterAll(async () => {
  await db.delete(guests);
  await db.delete(groups);
});

describe("updateGuestRsvp", () => {
  it("sets the status and respondedAt for the given guest", async () => {
    const group = await createGroup({ guestNames: ["Ana", "Bruno"] });
    const [ana] = group.guests;

    const updated = await updateGuestRsvp(ana.id, "confirmed");

    expect(updated.rsvpStatus).toBe("confirmed");
    expect(updated.respondedAt).not.toBeNull();
  });

  it("does not affect other guests in the same group", async () => {
    const group = await createGroup({ guestNames: ["Ana", "Bruno"] });
    const [ana, bruno] = group.guests;

    await updateGuestRsvp(ana.id, "confirmed");

    const [brunoAfter] = await db
      .select()
      .from(guests)
      .where(eq(guests.id, bruno.id));

    expect(brunoAfter.rsvpStatus).toBe("pending");
    expect(brunoAfter.respondedAt).toBeNull();
  });

  it("throws for a non-existent guest id", async () => {
    await expect(
      updateGuestRsvp("00000000-0000-0000-0000-000000000000", "confirmed")
    ).rejects.toThrow();
  });
});
