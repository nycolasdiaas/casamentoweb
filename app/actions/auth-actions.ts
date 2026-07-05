"use server";

import crypto from "crypto";
import { redirect } from "next/navigation";
import { createSessionCookie, clearSessionCookie } from "@/lib/auth/session";

function passwordMatches(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    throw new Error("ADMIN_PASSWORD is not set");
  }

  const inputBuffer = Buffer.from(input);
  const expectedBuffer = Buffer.from(expected);
  if (inputBuffer.length !== expectedBuffer.length) return false;

  return crypto.timingSafeEqual(inputBuffer, expectedBuffer);
}

export async function loginAction(formData: FormData) {
  const password = formData.get("password")?.toString() ?? "";

  if (!passwordMatches(password)) {
    return { error: "Senha incorreta." };
  }

  await createSessionCookie();
  redirect("/admin");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/admin/login");
}
