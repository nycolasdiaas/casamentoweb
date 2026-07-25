import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

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
  headers: vi.fn(async () => ({ get: () => null })),
}));

import { redirect } from "next/navigation";
import { loginAction } from "./auth-actions";
import { COOKIE_NAME } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { admins, loginAttempts } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";

const TEST_EMAIL = "admin-test@enlace.com";
const TEST_PASSWORD = "senha-forte-de-teste-123";

beforeEach(async () => {
  cookieStore.clear();
  vi.clearAllMocks();
  await db.delete(admins);
  await db.delete(loginAttempts);
  await db.insert(admins).values({
    name: "Admin Teste",
    email: TEST_EMAIL,
    passwordHash: await hashPassword(TEST_PASSWORD),
  });
});

afterAll(async () => {
  await db.delete(admins);
  await db.delete(loginAttempts);
});

describe("loginAction", () => {
  it("sets a session cookie and redirects on correct credentials", async () => {
    const formData = new FormData();
    formData.set("email", TEST_EMAIL);
    formData.set("password", TEST_PASSWORD);

    await expect(loginAction(formData)).rejects.toThrow("NEXT_REDIRECT");

    expect(cookieStore.has(COOKIE_NAME)).toBe(true);
    expect(redirect).toHaveBeenCalledWith("/admin/pedidos");
  });

  it("does not set a cookie or redirect on wrong password", async () => {
    const formData = new FormData();
    formData.set("email", TEST_EMAIL);
    formData.set("password", "wrong-password");

    const result = await loginAction(formData);

    expect(result).toEqual({ error: "E-mail ou senha incorretos." });
    expect(cookieStore.has(COOKIE_NAME)).toBe(false);
    expect(redirect).not.toHaveBeenCalled();
  });

  it("does not set a cookie or redirect for an unknown email", async () => {
    const formData = new FormData();
    formData.set("email", "nao-existe@enlace.com");
    formData.set("password", TEST_PASSWORD);

    const result = await loginAction(formData);

    expect(result).toEqual({ error: "E-mail ou senha incorretos." });
    expect(cookieStore.has(COOKIE_NAME)).toBe(false);
    expect(redirect).not.toHaveBeenCalled();
  });
});
