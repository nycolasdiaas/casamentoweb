import { headers } from "next/headers";

// Hosts confiáveis para o fallback (quando NEXT_PUBLIC_SITE_URL não está
// definida). Em produção, DEFINA NEXT_PUBLIC_SITE_URL — o fallback abaixo é
// só rede de segurança e recusa Host forjado (evita apontar o retorno do
// pagamento para o domínio de um atacante).
const ALLOWED_HOSTS = new Set([
  "localhost:3000",
  "casamentoweb.vercel.app",
  "enlace.com.br",
  "www.enlace.com.br",
]);

/**
 * URL base absoluta do site, para montar links de retorno do pagamento.
 * Prioriza NEXT_PUBLIC_SITE_URL; senão, deriva do Host da requisição SÓ se
 * ele estiver na allowlist (mitiga host header injection).
 */
export async function getBaseUrl(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";

  if (!ALLOWED_HOSTS.has(host)) {
    // Host não confiável: não devolve URL derivada de header forjado.
    throw new Error(
      "Host não confiável e NEXT_PUBLIC_SITE_URL não definida — configure NEXT_PUBLIC_SITE_URL em produção."
    );
  }

  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
