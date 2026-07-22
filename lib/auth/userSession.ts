import { cookies } from "next/headers";
import crypto from "crypto";

// Sessão dos casais clientes (cookie separado do admin_session).
// Payload: "userId:expiresAt", assinado com HMAC — mesmo esquema do admin.
export const USER_COOKIE_NAME = "user_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 dias

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is not set");
  }
  return secret;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export async function createUserSessionCookie(userId: string) {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${userId}:${expiresAt}`;
  const value = `${payload}.${sign(payload)}`;

  const cookieStore = await cookies();
  cookieStore.set(USER_COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
}

/** Retorna o id do usuário logado, ou null se sem sessão válida. */
export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(USER_COOKIE_NAME);
  if (!cookie?.value) return null;

  const dotIndex = cookie.value.lastIndexOf(".");
  if (dotIndex < 0) return null;
  const payload = cookie.value.slice(0, dotIndex);
  const signature = cookie.value.slice(dotIndex + 1);

  const expectedSignature = sign(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  const [userId, expiresAtRaw] = payload.split(":");
  const expiresAt = Number(expiresAtRaw);
  if (!userId || !Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    return null;
  }

  return userId;
}

export async function clearUserSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(USER_COOKIE_NAME);
}
