"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

/**
 * O rascunho guardado no navegador, lido como fonte externa.
 *
 * ── Por que não `useState` + efeito ────────────────────────────────────────
 *
 * Ler `localStorage` num efeito e jogar no estado é o padrão que
 * `react-hooks/set-state-in-effect` reprova, e a razão é boa: são dois renders
 * para uma informação que já existia, e o primeiro deles mostra a tela sem o
 * aviso que ela deveria estar mostrando.
 *
 * A alternativa óbvia — inicializador preguiçoso do `useState` — quebra a
 * hidratação: o servidor não tem `localStorage`, então ele renderiza "sem
 * rascunho" e o cliente renderiza "com rascunho", e as duas árvores não batem.
 *
 * `useSyncExternalStore` foi feito exatamente para isto, e o terceiro
 * argumento (o retrato do servidor) é a peça que resolve a hidratação.
 *
 * ── O retrato precisa ser estável ──────────────────────────────────────────
 *
 * Devolver o objeto já convertido faria o React ver um valor novo em todo
 * render e entrar em laço. Por isso o retrato é a STRING crua — primitiva,
 * comparável — e a conversão acontece num `useMemo` do lado de fora.
 *
 * ── De brinde, a outra aba ─────────────────────────────────────────────────
 *
 * Assinar o evento `storage` faz o aviso aparecer quando a outra aba grava.
 * Não era pedido, mas cai de graça e é o comportamento certo.
 */

const ouvintes = new Set<() => void>();

/** O `storage` do navegador só avisa OUTRAS abas. Esta precisa avisar a si. */
function avisar() {
  for (const o of ouvintes) o();
}

function assinar(mudou: () => void) {
  ouvintes.add(mudou);
  window.addEventListener("storage", mudou);
  return () => {
    ouvintes.delete(mudou);
    window.removeEventListener("storage", mudou);
  };
}

/**
 * Grava. Em `try/catch` porque modo privado e cota cheia lançam — e um editor
 * que quebra por causa do rascunho é pior que um editor sem rascunho.
 */
export function guardarRascunho(chave: string, valor: unknown): void {
  try {
    localStorage.setItem(chave, JSON.stringify({ doc: valor, em: Date.now() }));
    avisar();
  } catch {
    // Sem armazenamento: o servidor continua sendo salvo normalmente.
  }
}

export function apagarRascunho(chave: string): void {
  try {
    localStorage.removeItem(chave);
    avisar();
  } catch {
    // Já não havia o que apagar.
  }
}

const noServidor = () => null;

/**
 * O rascunho da chave, se houver — e só quando for MAIS NOVO que a versão do
 * servidor. Rascunho mais velho não serve para nada: o servidor já tem tudo
 * que ele tinha, e mais.
 */
export function useRascunhoLocal<T>(
  chave: string,
  maisNovoQue: number,
  converter: (bruto: unknown) => T
): { rascunho: T | null; descartar: () => void } {
  const ler = useCallback(() => {
    try {
      return localStorage.getItem(chave);
    } catch {
      return null;
    }
  }, [chave]);

  const bruto = useSyncExternalStore(assinar, ler, noServidor);

  const rascunho = useMemo(() => {
    if (!bruto) return null;
    try {
      const guardado = JSON.parse(bruto) as { doc: unknown; em: number };
      if (!(guardado.em > maisNovoQue)) return null;
      return converter(guardado.doc);
    } catch {
      // Rascunho ilegível: seguir com o do servidor é o certo.
      return null;
    }
    // `converter` é estável em quem chama; nas dependências ele recriaria a
    // conversão a cada render sem mudar o resultado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bruto, maisNovoQue]);

  const descartar = useCallback(() => apagarRascunho(chave), [chave]);

  return { rascunho, descartar };
}
