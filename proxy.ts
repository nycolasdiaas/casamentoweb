import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME } from "@/lib/auth/session";

async function hmacHex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  if (!cookie) return false;

  const [payload, signature] = cookie.split(".");
  if (!payload || !signature) return false;

  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return false;

  const expectedSignature = await hmacHex(secret, payload);
  if (signature !== expectedSignature) return false;

  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;

  return true;
}

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") {
    return NextResponse.next();
  }

  const isValid = await hasValidSession(request);
  if (!isValid) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*",
};
