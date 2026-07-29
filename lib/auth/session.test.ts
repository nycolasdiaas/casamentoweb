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
import {
  createUserSessionCookie,
  getSessionUserId,
  USER_COOKIE_NAME,
} from "./userSession";

const ADMIN_ID = "11111111-1111-1111-1111-111111111111";
const USER_ID = "22222222-2222-2222-2222-222222222222";

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

  // Os dois cookies têm o mesmo formato e o mesmo segredo. Sem separação de
  // domínio na assinatura, copiar um no lugar do outro seria escalada de
  // privilégio (casal virando admin).
  it("does not accept an admin cookie as a couple session", async () => {
    await createSessionCookie(ADMIN_ID);
    cookieStore.set(USER_COOKIE_NAME, cookieStore.get(COOKIE_NAME)!);
    expect(await getSessionUserId()).toBeNull();
  });

  it("does not accept a couple cookie as an admin session", async () => {
    await createUserSessionCookie(USER_ID);
    cookieStore.set(COOKIE_NAME, cookieStore.get(USER_COOKIE_NAME)!);
    expect(await getSessionAdminId()).toBeNull();
  });
});
