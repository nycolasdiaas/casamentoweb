"use client";

import { useSearchParams } from "next/navigation";

/**
 * Leva o `?pacote=` da vitrine adiante, escondido dentro do formulário de
 * cadastro.
 *
 * ── Por que um componente só para isto ─────────────────────────────────────
 *
 * `useSearchParams` torna dinâmica a árvore inteira que o contém, e com
 * `cacheComponents` ligado o `next build` reprova a rota quando isso acontece
 * fora de um `<Suspense>` (AGENTS.md §4 — o `next dev` deixa passar; o build,
 * não). Isolado aqui, só este input fica dinâmico e o resto da tela de
 * cadastro continua estático.
 */
export default function CampoPacoteEscolhido() {
  const pacote = useSearchParams().get("pacote") ?? "";
  return <input type="hidden" name="pacote" value={pacote} />;
}
