import { cookies } from "next/headers";
import crypto from "crypto";

// Sessão de admin da plataforma (uma conta por pessoa — ver tabela `admins`).
// Payload: "adminId:expiresAt", assinado com HMAC.
export const COOKIE_NAME = "admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

// Separação de domínio da assinatura. O cookie de admin e o do casal têm o
// mesmo formato ("id:expiresAt") e usam o mesmo segredo — sem este prefixo
// no que é assinado, um admin_session válido colado em user_session passaria
// na verificação (e vice-versa), virando escalada de privilégio.
export const ADMIN_SESSION_DOMAIN = "enlace.admin.v1";

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is not set");
  }
  return secret;
}

function sign(payload: string): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update(`${ADMIN_SESSION_DOMAIN}|${payload}`)
    .digest("hex");
}

export async function createSessionCookie(adminId: string) {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${adminId}:${expiresAt}`;
  const signature = sign(payload);
  const value = `${payload}.${signature}`;

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
}

/** Retorna o id do admin logado, ou null se sem sessão válida. */
export async function getSessionAdminId(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
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

  const [adminId, expiresAtRaw] = payload.split(":");
  const expiresAt = Number(expiresAtRaw);
  if (!adminId || !Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    return null;
  }

  return adminId;
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
