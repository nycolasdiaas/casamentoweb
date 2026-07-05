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

import { createSessionCookie, verifySessionCookie, COOKIE_NAME } from "./session";

describe("session", () => {
  beforeEach(() => {
    cookieStore.clear();
  });

  it("returns false when no cookie is set", async () => {
    expect(await verifySessionCookie()).toBe(false);
  });

  it("returns false for a corrupted cookie value", async () => {
    cookieStore.set(COOKIE_NAME, "not-a-valid-signed-value");
    expect(await verifySessionCookie()).toBe(false);
  });

  it("round-trips: create then verify succeeds", async () => {
    await createSessionCookie();
    expect(await verifySessionCookie()).toBe(true);
  });

  it("rejects a tampered cookie value", async () => {
    await createSessionCookie();
    const tampered = cookieStore.get(COOKIE_NAME)! + "x";
    cookieStore.set(COOKIE_NAME, tampered);
    expect(await verifySessionCookie()).toBe(false);
  });
});
