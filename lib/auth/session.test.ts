import { describe, it, expect, vi, beforeEach } from "vitest";

const cookieStore = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) =>
      cookieStore.has(name) ? { name, value: cookieStore.get(name)! } : undefined,
    set: (name: string, value: string) => {
      cookieStore.set(name, value);
    },
    delete: (name: string) => {
      cookieStore.delete(name);
    },
  })),
}));

import { createSessionCookie, getSessionAdminId, COOKIE_NAME } from "./session";

const ADMIN_ID = "11111111-1111-1111-1111-111111111111";

describe("session", () => {
  beforeEach(() => {
    cookieStore.clear();
  });

  it("returns null when no cookie is set", async () => {
    expect(await getSessionAdminId()).toBeNull();
  });

  it("returns null for a corrupted cookie value", async () => {
    cookieStore.set(COOKIE_NAME, "not-a-valid-signed-value");
    expect(await getSessionAdminId()).toBeNull();
  });

  it("round-trips: create then verify returns the admin id", async () => {
    await createSessionCookie(ADMIN_ID);
    expect(await getSessionAdminId()).toBe(ADMIN_ID);
  });

  it("rejects a tampered cookie value", async () => {
    await createSessionCookie(ADMIN_ID);
    const tampered = cookieStore.get(COOKIE_NAME)! + "x";
    cookieStore.set(COOKIE_NAME, tampered);
    expect(await getSessionAdminId()).toBeNull();
  });
});
