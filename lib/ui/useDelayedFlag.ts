"use client";

import { useEffect, useState } from "react";

/**
 * Verdadeiro enquanto a ação roda E por pelo menos `minimoMs` depois de
 * começar.
 *
 * A versão anterior fazia o contrário — atrasava o *aparecer* em 180 ms e não
 * segurava nada — com o argumento de que segurar acrescenta espera real. O
 * argumento estava certo e a conclusão errada: como o servidor responde rápido,
 * na prática a tela **nunca aparecia**. O Anderson descreveu exatamente isso:
 * "quando eu crio o pedido não acontece nada, quando eu logo na conta não
 * acontece nada".
 *
 * Uma tela de espera que ninguém vê não é otimização, é ausência. O piso de
 * ~700 ms custa meio segundo e devolve a coisa mais importante que uma
 * interface faz: confirmar que o clique foi recebido.
 */
export function useDelayedFlag(ativo: boolean, minimoMs = 700): boolean {
  const [segurando, setSegurando] = useState(false);
  const [anterior, setAnterior] = useState(ativo);

  // Ajuste de estado DURANTE o render, não dentro de um efeito. É o padrão
  // que a documentação do React recomenda para "mudou a prop, corrija o
  // estado": o React descarta o render em curso e refaz antes de pintar, sem
  // o quadro intermediário nem a renderização em cascata que
  // `setState` num efeito provoca.
  if (ativo !== anterior) {
    setAnterior(ativo);
    if (ativo) setSegurando(true);
  }

  useEffect(() => {
    if (!segurando) return;
    const timer = setTimeout(() => setSegurando(false), minimoMs);
    return () => clearTimeout(timer);
  }, [segurando, minimoMs]);

  return ativo || segurando;
}
