"use client";

import { useSyncExternalStore } from "react";

/**
 * O relógio, para quem mostra tempo relativo na tela.
 *
 * `Date.now()` no render é impuro e o lint reprova com razão; guardar em
 * estado e atualizar num efeito é o mesmo defeito com um render a mais. O
 * caminho certo é este: o tempo é uma fonte EXTERNA, e `useSyncExternalStore`
 * existe para ler fonte externa sem quebrar hidratação.
 *
 * O passo é de 30s. Um "salvo há N min" não fica mais verdadeiro atualizando
 * a cada segundo, e um `setInterval` de 1s numa tela que fica aberta a tarde
 * inteira acorda o navegador 3.600 vezes por hora para não mudar nada.
 */
const PASSO = 30_000;

function assinar(mudou: () => void) {
  const t = window.setInterval(mudou, PASSO);
  return () => window.clearInterval(t);
}

/* O retrato precisa ser ESTÁVEL entre chamadas dentro do mesmo intervalo:
   devolver `Date.now()` direto faria o React ver um valor novo em todo render
   e entrar em laço. Arredondar para o passo resolve. */
const agoraArredondado = () => Math.floor(Date.now() / PASSO) * PASSO;

/** No servidor não há relógio que valha: quem chama trata o `null`. */
const noServidor = () => 0;

export function useAgora(): number {
  return useSyncExternalStore(assinar, agoraArredondado, noServidor);
}
