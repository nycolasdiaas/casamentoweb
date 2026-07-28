import crypto from "crypto";

// Coleta de métricas de acesso. Ver docs/sdd-geracao-automatica.md §6.1.
//
// PRIVACIDADE (LGPD): o convidado é terceiro — não tem conta e não aceitou
// termo nenhum. Por isso o IP NUNCA é gravado. O que vai para o banco é um
// hash não reversível de (IP + user-agent + sal do dia). O sal gira a cada
// 24h, então o mesmo visitante recebe hashes diferentes em dias diferentes:
// dá para contar visitantes únicos do dia, não para rastrear alguém ao longo
// do tempo.

export const EVENT_KINDS = [
  "view",
  "rsvp_open",
  "rsvp_submit",
  "gift_open",
  "pix_copy",
  "gift_confirm",
] as const;

export type EventKind = (typeof EVENT_KINDS)[number];

export function isEventKind(value: string): value is EventKind {
  return (EVENT_KINDS as readonly string[]).includes(value);
}

/**
 * Hash anônimo do visitante, válido só para o dia corrente.
 *
 * Usa ADMIN_SESSION_SECRET como chave do HMAC — sem ela o hash seria
 * reversível por força bruta (o espaço de IPs é pequeno).
 */
export function visitorHash(ip: string, userAgent: string): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return null;

  const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD, gira o sal
  return crypto
    .createHmac("sha256", secret)
    .update(`${day}:${ip}:${userAgent}`)
    .digest("hex")
    .slice(0, 32);
}

/** Só o host do referrer — nunca a URL completa, que pode ter dado pessoal. */
export function referrerHost(referrer: string | null): string | null {
  if (!referrer) return null;
  try {
    return new URL(referrer).hostname.replace(/^www\./, "").slice(0, 100);
  } catch {
    return null;
  }
}

/** Classificação grosseira de aparelho, suficiente para o que queremos saber. */
export function deviceFromUserAgent(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|playbook|silk/.test(ua)) return "tablet";
  if (/mobi|android|iphone|ipod|windows phone/.test(ua)) return "mobile";
  return "desktop";
}
