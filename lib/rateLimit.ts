import { headers } from "next/headers";
import { and, eq, gt, lt } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { loginAttempts } from "@/lib/db/schema";

const WINDOW_MS = 10 * 60 * 1000; // 10 minutos
const DEFAULT_MAX = 5; // padrão apertado, pensado para brute-force de login

/**
 * Endereço do requisitante. Funções serverless não têm req.socket — em
 * produção (Vercel) o x-forwarded-for é confiável; em dev local não existe,
 * daí o fallback fixo (rate-limita "todo mundo local" junto, sem problema).
 */
export async function getClientIp(): Promise<string> {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    return h.get("x-real-ip") ?? "local";
  } catch {
    // Fora de um request scope (ex: testes) — não deve derrubar a action.
    return "local";
  }
}

/**
 * Rate limit simples baseado no banco (funções serverless não compartilham
 * memória entre instâncias, então um contador em memória não funcionaria).
 * Cada chamada registra uma tentativa; acima de MAX_ATTEMPTS na janela,
 * bloqueia. Usar ANTES de checar a senha, em toda rota de login/cadastro
 * exposta sem autenticação.
 */
export async function checkRateLimit(
  key: string,
  max: number = DEFAULT_MAX
): Promise<{ allowed: boolean }> {
  const since = new Date(Date.now() - WINDOW_MS);
  const recent = await db.query.loginAttempts.findMany({
    where: and(eq(loginAttempts.key, key), gt(loginAttempts.createdAt, since)),
  });

  if (recent.length >= max) {
    return { allowed: false };
  }

  await db.insert(loginAttempts).values({ key });

  // Expurgo oportunista: remove registros fora da janela para a tabela não
  // crescer sem limite (roda de vez em quando, não a cada request).
  if (Math.random() < 0.02) {
    await db.delete(loginAttempts).where(lt(loginAttempts.createdAt, since));
  }

  return { allowed: true };
}

export const RATE_LIMIT_MESSAGE =
  "Muitas tentativas. Aguarde alguns minutos e tente de novo.";
