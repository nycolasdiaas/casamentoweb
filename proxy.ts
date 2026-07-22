import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME } from "@/lib/auth/session";
import { USER_COOKIE_NAME } from "@/lib/auth/userSession";

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

async function verifySignedCookie(
  value: string | undefined,
  extractExpiresAt: (payload: string) => number
): Promise<boolean> {
  if (!value) return false;

  const dotIndex = value.lastIndexOf(".");
  if (dotIndex < 0) return false;
  const payload = value.slice(0, dotIndex);
  const signature = value.slice(dotIndex + 1);

  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return false;

  const expectedSignature = await hmacHex(secret, payload);
  if (signature !== expectedSignature) return false;

  const expiresAt = extractExpiresAt(payload);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;

  return true;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();

    const isValid = await verifySignedCookie(
      request.cookies.get(COOKIE_NAME)?.value,
      (payload) => Number(payload)
    );
    if (!isValid) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/conta")) {
    if (pathname === "/conta/entrar" || pathname === "/conta/criar") {
      return NextResponse.next();
    }

    // payload da sessão de usuário: "userId:expiresAt"
    const isValid = await verifySignedCookie(
      request.cookies.get(USER_COOKIE_NAME)?.value,
      (payload) => Number(payload.split(":")[1])
    );
    if (!isValid) {
      return NextResponse.redirect(new URL("/conta/entrar", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/conta/:path*"],
};
