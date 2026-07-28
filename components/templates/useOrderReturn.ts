"use client";

import { useSearchParams } from "next/navigation";

// UUID simples — só para não repassar lixo da URL adiante. A dona de verdade
// da checagem é a server action, que confere se o pedido é do casal logado.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Id do pedido que trouxe o casal até a prévia (`?pedido=`), ou null quando a
 * prévia foi aberta pela vitrine pública. É o que faz a mesma tela servir
 * como catálogo aberto e como seletor de modelo dentro do pedido.
 */
export function useOrderReturn(): string | null {
  const value = useSearchParams().get("pedido");
  return value && UUID.test(value) ? value : null;
}
