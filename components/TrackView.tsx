"use client";

import { useEffect, useRef } from "react";

/**
 * Dispara um evento de métrica quando a página monta.
 *
 * Cliente, não servidor: com `use cache` a página do casal é servida do
 * cache e nem chega a tocar o banco no render. Ver §6.1 do SDD.
 *
 * `keepalive` faz a requisição sobreviver à navegação — sem isso, o
 * convidado que abre e sai rápido não seria contado.
 */
export default function TrackView({
  siteSlug,
  kind = "view",
  section,
}: {
  siteSlug: string;
  kind?: string;
  section?: string;
}) {
  const enviado = useRef(false);

  useEffect(() => {
    // StrictMode monta duas vezes em dev; o guard evita contar em dobro.
    if (enviado.current) return;
    enviado.current = true;

    // Falha em silêncio: métrica nunca pode atrapalhar o site do casamento.
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteSlug,
        kind,
        section,
        path: window.location.pathname,
      }),
      keepalive: true,
    }).catch(() => {});
  }, [siteSlug, kind, section]);

  return null;
}
