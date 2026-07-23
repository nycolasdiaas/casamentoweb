import { headers } from "next/headers";

/**
 * URL base absoluta do site, para montar links de retorno do pagamento.
 * Prioriza NEXT_PUBLIC_SITE_URL (defina em produção, ex:
 * https://enlace.com.br); senão, deriva dos headers da requisição.
 */
export async function getBaseUrl(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
