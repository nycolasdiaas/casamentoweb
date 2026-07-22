import { describe, it, expect, vi } from "vitest";

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
}));

import { redirect } from "next/navigation";
import { loginAction } from "./auth-actions";
import { COOKIE_NAME } from "@/lib/auth/session";

describe("loginAction", () => {
  it("sets a session cookie and redirects on correct password", async () => {
    const formData = new FormData();
    formData.set("password", process.env.ADMIN_PASSWORD!);

    await expect(loginAction(formData)).rejects.toThrow("NEXT_REDIRECT");

    expect(cookieStore.has(COOKIE_NAME)).toBe(true);
    expect(redirect).toHaveBeenCalledWith("/admin/pedidos");
  });

  it("does not set a cookie or redirect on wrong password", async () => {
    cookieStore.clear();
    vi.clearAllMocks();
    const formData = new FormData();
    formData.set("password", "wrong-password");

    const result = await loginAction(formData);

    expect(result).toEqual({ error: "Senha incorreta." });
    expect(cookieStore.has(COOKIE_NAME)).toBe(false);
    expect(redirect).not.toHaveBeenCalled();
  });
});
