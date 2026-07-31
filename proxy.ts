import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, ADMIN_SESSION_DOMAIN } from "@/lib/auth/session";
import { USER_COOKIE_NAME, USER_SESSION_DOMAIN } from "@/lib/auth/userSession";

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

// Edge runtime não tem crypto.timingSafeEqual do Node — comparação manual
// em tempo constante (percorre tudo sempre, não sai cedo na 1ª diferença).
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// `domain` precisa bater com o prefixo usado ao assinar em
// lib/auth/session.ts e lib/auth/userSession.ts — é o que impede um cookie
// de admin de ser aceito como cookie de casal.
async function verifySignedCookie(
  value: string | undefined,
  domain: string,
  extractExpiresAt: (payload: string) => number
): Promise<boolean> {
  if (!value) return false;

  const dotIndex = value.lastIndexOf(".");
  if (dotIndex < 0) return false;
  const payload = value.slice(0, dotIndex);
  const signature = value.slice(dotIndex + 1);

  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return false;

  const expectedSignature = await hmacHex(secret, `${domain}|${payload}`);
  if (!timingSafeEqualHex(signature, expectedSignature)) return false;

  const expiresAt = extractExpiresAt(payload);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;

  return true;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();

    // payload da sessão de admin: "adminId:expiresAt"
    const isValid = await verifySignedCookie(
      request.cookies.get(COOKIE_NAME)?.value,
      ADMIN_SESSION_DOMAIN,
      (payload) => Number(payload.split(":")[1])
    );
    if (!isValid) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/conta")) {
    // Telas alcançadas por link de e-mail ou por quem ainda não entrou.
    // "/conta/confirmar" PRECISA estar aqui: o link de confirmação costuma
    // ser aberto no navegador do celular, sem sessão — barrar aqui faria o
    // token nunca ser consumido.
    const publicContaPaths = [
      "/conta/entrar",
      "/conta/criar",
      "/conta/esqueci",
      "/conta/redefinir",
      "/conta/confirmar",
    ];
    if (publicContaPaths.includes(pathname)) {
      return NextResponse.next();
    }

    // payload da sessão de usuário: "userId:expiresAt"
    const isValid = await verifySignedCookie(
      request.cookies.get(USER_COOKIE_NAME)?.value,
      USER_SESSION_DOMAIN,
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
