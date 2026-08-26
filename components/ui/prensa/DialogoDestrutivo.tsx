"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A4 · Diálogo destrutivo.
 *
 * A fórmula é da Voz e Microcopy V4: **pergunta + consequência +
 * reversibilidade**. E três regras de desenho que o `window.confirm` nativo
 * não tem como cumprir:
 *
 * 1. **O botão repete o verbo perigoso**, nunca "OK". Num diálogo sobre
 *    cancelar um pedido, um botão escrito "Cancelar" é ambíguo: tanto pode
 *    significar "cancele o pedido" quanto "desista disto".
 * 2. **A saída segura vem primeiro na leitura** e recebe o foco ao abrir —
 *    quem apertar Enter por reflexo mantém, não apaga.
 * 3. **Perigo é contorno, nunca preenchido.** Botão vermelho sólido chama o
 *    clique, e este é o que não se quer clicado por engano.
 *
 * Substitui o `confirm` nativo, que além de não ter desenho nenhum chega com
 * a cara do sistema operacional no meio de uma interface que cuidou de fio de
 * 1px e raio de 2px o produto inteiro.
 */
export default function DialogoDestrutivo({
  gatilho,
  titulo,
  children,
  confirmar,
  manter = "Manter",
  onConfirmar,
  form,
}: {
  /** O que abre o diálogo — normalmente um link discreto. */
  gatilho: React.ReactNode;
  titulo: string;
  /** A consequência e o que sobrevive a ela. */
  children: React.ReactNode;
  /** Rótulo do botão perigoso. Repete o verbo. */
  confirmar: string;
  manter?: string;
  onConfirmar?: () => void;
  /** Campos escondidos + action, quando a confirmação é um submit. */
  form?: { action: (formData: FormData) => void; campos: React.ReactNode };
}) {
  const [aberto, setAberto] = useState(false);
  const manterRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    document.addEventListener("keydown", esc);
    manterRef.current?.focus();
    return () => document.removeEventListener("keydown", esc);
  }, [aberto]);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="whitespace-nowrap text-[13px] text-(--c-ink-2) underline underline-offset-2 transition-colors hover:text-(--c-danger) cursor-pointer"
      >
        {gatilho}
      </button>

      {aberto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={titulo}
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
        >
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => setAberto(false)}
            className="absolute inset-0 bg-[rgb(26_29_33/0.35)] cursor-default"
          />

          <div className="motion-rise-in relative surface-raised rounded-[3px] p-6 w-full max-w-[420px] flex flex-col gap-3 shadow-[0_12px_40px_rgb(26_29_33/0.20)]">
            <p className="t-display text-[22px] leading-tight text-(--c-ink)">
              {titulo}
            </p>
            <div className="t-corpo-p text-(--c-ink-2)">{children}</div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                ref={manterRef}
                type="button"
                onClick={() => setAberto(false)}
                className="btn btn-texto btn-sm"
              >
                {manter}
              </button>

              {form ? (
                <form action={form.action}>
                  {form.campos}
                  <button type="submit" className="btn btn-perigo btn-sm">
                    {confirmar}
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAberto(false);
                    onConfirmar?.();
                  }}
                  className="btn btn-perigo btn-sm"
                >
                  {confirmar}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
