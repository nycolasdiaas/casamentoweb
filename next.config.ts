import type { NextConfig } from "next";

// Cabeçalhos de segurança aplicados a todas as rotas. CSP deliberadamente
// restrito só ao que não quebra o Next (frame-ancestors, base-uri,
// form-action, object-src) — script-src/style-src ficam livres porque o Next
// injeta scripts/estilos inline sem nonce; o XSS já é mitigado pelo escape
// automático do React e ausência de dangerouslySetInnerHTML.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
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
      "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
