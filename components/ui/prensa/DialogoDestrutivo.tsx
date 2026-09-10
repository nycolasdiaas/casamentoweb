"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
  /* `saindo` existe para o diálogo continuar montado durante o fade reverso.
     Sem ele, fechar é desmontar — e desmontar não anima: a caixa some no
     quadro do clique, que é o corte de cena que a transição #3 evita na
     entrada e evitaria à toa se não evitasse também na saída. */
  const [saindo, setSaindo] = useState(false);
  const manterRef = useRef<HTMLButtonElement>(null);

  /* Fechar é uma sequência, não um `setState`. Os 140ms são `--t-rapido`, o
     mesmo tempo da confirmação de toque: a saída é reconhecimento de que o
     gesto foi recebido, não uma cena.

     Sob movimento reduzido o tempo vai a zero — ali a transição é confirmação,
     e confirmação atrasada é confirmação pior. */
  const fechar = useCallback(() => {
    const menos = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ligado = document.documentElement.dataset.movimento === "ligado";
    if (menos && !ligado) {
      setAberto(false);
      return;
    }
    setSaindo(true);
    window.setTimeout(() => {
      setSaindo(false);
      setAberto(false);
    }, 140);
  }, []);

  useEffect(() => {
    if (!aberto) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
    };
    document.addEventListener("keydown", esc);
    manterRef.current?.focus();
    return () => document.removeEventListener("keydown", esc);
  }, [aberto, fechar]);

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
            onClick={fechar}
            className={`dialogo-scrim absolute inset-0 bg-[rgb(26_29_33/0.35)] cursor-default${
              saindo ? " dialogo-saindo" : ""
            }`}
          />

          <div className={`dialogo-caixa relative surface-raised rounded-[3px] p-6 w-full max-w-[420px] flex flex-col gap-3 shadow-[0_12px_40px_rgb(26_29_33/0.20)]${
              saindo ? " dialogo-saindo" : ""
            }`}>
            <p className="t-display text-[22px] leading-tight text-(--c-ink)">
              {titulo}
            </p>
            <div className="t-corpo-p text-(--c-ink-2)">{children}</div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                ref={manterRef}
                type="button"
                onClick={fechar}
                className="btn btn-texto btn-sm"
              >
                {manter}
              </button>

              {form ? (
                /* Fecha no submit, pela mesma razão que o ramo de baixo fecha
                   no clique: a ação já foi confirmada.

                   Sem isto o diálogo ficava aberto depois de confirmar. A
                   action roda e termina em `redirect`, mas quando o destino é
                   a página em que o casal já está, a navegação é suave e este
                   componente não desmonta — então o diálogo continuava por
                   cima da lista, com o pedido ainda listado. Numa auditoria de
                   uso real a leitura foi "não aconteceu nada", e o caminho
                   natural dali é clicar de novo numa ação irreversível. */
                <form action={form.action} onSubmit={() => setAberto(false)}>
                  {form.campos}
                  <button type="submit" className="btn btn-perigo btn-sm">
                    {confirmar}
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    /* Aqui NÃO se espera o fade: a ação destrutiva já foi
                       confirmada, e 140ms de espera entre o clique e o efeito
                       é latência que o gesto não pediu. */
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
