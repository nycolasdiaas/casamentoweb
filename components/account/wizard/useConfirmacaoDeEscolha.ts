"use client";

import { useEffect, useRef } from "react";

/**
 * Confirmação no cartão que a pessoa acabou de escolher.
 *
 * O questionário tinha a troca de ETAPA animada, mas a RESPOSTA não: clicar
 * num pacote só trocava a borda. Num fluxo de uma pergunta por tela, o clique
 * é o momento em que a pessoa age — e era o único sem retorno.
 *
 * ── Por que NÃO é GSAP aqui, tendo GSAP no projeto ──────────────────────────
 *
 * Tentei com GSAP primeiro e a animação não acontecia. Medindo no navegador:
 *
 *   element.style.transform = "scale(0.9)"  ->  computed continua identidade
 *   element.style.scale     = "0.9"         ->  computed vira 0.9
 *
 * O Tailwind v4 usa as propriedades ISOLADAS (`scale`, `translate`, `rotate`),
 * não a `transform` composta — é assim que ele faz `hover:-translate-y-0.5`
 * conviver com outras transformações sem uma guerra de variáveis. O GSAP
 * escreve em `transform`. Neste elemento, quem manda é `scale`.
 *
 * Insistir no GSAP exigiria tirar o `transition-all` do cartão (perdendo o
 * hover que já existe) ou forçá-lo a escrever a propriedade isolada. A Web
 * Animations API faz exatamente isto, é nativa, não briga com o Tailwind e
 * cabe em cinco linhas. Ferramenta grande não é ferramenta certa.
 *
 * ── O que a animação diz ────────────────────────────────────────────────────
 *
 * O cartão CEDE ao toque e volta passando do ponto — o mesmo princípio do
 * `.btn:active` que já existe no produto. Fica sob movimento reduzido de
 * propósito: isto confirma uma ação, não decora, e a regra do projeto é que o
 * que confirma permanece.
 */
export function useConfirmacaoDeEscolha(
  escopo: React.RefObject<HTMLElement | null>,
  /** muda a cada resposta; é o que dispara a confirmação */
  resposta: string
) {
  // A primeira renderização não é uma escolha: é o estado que veio salvo.
  // Sem isto, abrir o questionário já pulsaria sozinho.
  const primeira = useRef(true);

  useEffect(() => {
    if (primeira.current) {
      primeira.current = false;
      return;
    }
    const alvo = escopo.current?.querySelector<HTMLElement>(
      '[data-escolha="sim"]'
    );
    if (!alvo) return;

    alvo.animate(
      [{ scale: "0.96" }, { scale: "1.02" }, { scale: "1" }],
      {
        duration: 340,
        easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        // `scale` volta ao valor do CSS ao terminar — nada fica preso inline,
        // e o hover do Tailwind continua funcionando depois.
        fill: "none",
      }
    );
  }, [escopo, resposta]);
}
