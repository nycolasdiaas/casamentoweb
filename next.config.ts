import type { NextConfig } from "next";

// Cabeçalhos de segurança aplicados a todas as rotas. CSP deliberadamente
// restrito só ao que não quebra o Next (frame-ancestors, base-uri,
// form-action, object-src) — script-src/style-src ficam livres porque o Next
// injeta scripts/estilos inline sem nonce; o XSS já é mitigado pelo escape
// automático do React e ausência de dangerouslySetInnerHTML.
const securityHeaders = [
  // SAMEORIGIN, não DENY: o painel do casal embute a prévia do próprio site
  // num <iframe> para ele ver como fica enquanto edita. Continua barrando
  // enquadramento por terceiros, que é o que o clickjacking precisa.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value:
      // 'self' e não '*': só o nosso próprio painel pode enquadrar a prévia.
      // Este é o header que vale nos navegadores modernos — o X-Frame-Options
      // acima é o fallback para os antigos, e os dois precisam concordar.
      "frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'",
  },
];

const nextConfig: NextConfig = {
  // Habilita `use cache` + PPR (padrão no App Router quando ligado). É o que
  // permite servir o site de cada casal do cache e invalidar por tag quando o
  // casal edita — sem gerar código nem fazer deploy por casamento.
  // Ver docs/sdd-geracao-automatica.md §3.2.
  cacheComponents: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
