"use client";

import { useEffect, useRef } from "react";
import { Trilha } from "@/components/ui/prensa";

/**
 * Faixa D · a casca do questionário.
 *
 * Uma pergunta por tela, com o progresso à vista. Isso não mudou — o que mudou
 * foi o desenho, e três coisas nele são decisão, não gosto:
 *
 * 1. **Barra → trilha de segmentos.** A barra respondia "quanto falta"; os
 *    segmentos respondem "quantas perguntas são", que é a pergunta que decide
 *    se a pessoa começa. Ver `Trilha`.
 * 2. **Título alinhado à esquerda, não centralizado.** A pergunta é grande e
 *    vem seguida de campos alinhados à esquerda; centralizar o título cria uma
 *    segunda aresta e o olho volta ao lugar errado a cada etapa. A regra da
 *    Fundação A2 é literal: nunca centralizar bloco de texto com mais de duas
 *    linhas.
 * 3. **"Salvar rascunho" sobe para a trilha.** Ele é uma saída, não um passo:
 *    no rodapé ficava ombro a ombro com o botão de avançar, que é exatamente
 *    a colisão documentada em `OrderWizard` (alguém errou o alvo e concluiu
 *    que a criação do pedido estava quebrada).
 *
 * A `direcao` continua animando do lado certo: avançar traz da direita, voltar
 * da esquerda.
 */
export default function WizardShell({
  passo,
  total,
  direcao,
  titulo,
  subtitulo,
  onVoltar,
  acaoDaTrilha,
  children,
  rodape,
  nota,
}: {
  passo: number;
  total: number;
  direcao: "frente" | "tras";
  titulo: string;
  subtitulo?: string;
  onVoltar?: () => void;
  /** "Salvar rascunho" — some na última etapa, onde enviar já grava tudo. */
  acaoDaTrilha?: React.ReactNode;
  children: React.ReactNode;
  /** A ação que avança (ou envia). Fica à direita do "Voltar". */
  rodape: React.ReactNode;
  /** Mensagem de estado e recados — linha de baixo, sem competir com a ação. */
  nota?: React.ReactNode;
}) {
  const topoRef = useRef<HTMLDivElement>(null);
  const jaMontou = useRef(false);

  /* Cada etapa começa do topo — mas NÃO a primeira.
     Sem a guarda, o efeito roda também na montagem: quem abre o questionário
     chega com a página já rolada, o cabeçalho fora da tela e um movimento que
     ninguém pediu. O objetivo é outro — que quem rolou até o fim da lista de
     fontes não caia no meio da etapa seguinte —, e isso só existe da segunda
     etapa em diante. */
  useEffect(() => {
    if (!jaMontou.current) {
      jaMontou.current = true;
      return;
    }
    topoRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [passo]);

  return (
    <div
      ref={topoRef}
      className="surface-raised rounded-[3px] scroll-mt-6 flex flex-col"
    >
      <div className="px-6 pt-6 lg:px-10 lg:pt-8">
        <Trilha total={total} atual={passo + 1} acessorio={acaoDaTrilha} />
      </div>

      {/* `key={passo}` remonta o bloco a cada etapa: é o que faz a animação
          rodar de novo em vez de o React reaproveitar o nó e trocar seco. */}
      <div
        key={passo}
        className={`px-6 py-10 lg:px-10 lg:py-12 flex-1 ${
          direcao === "frente" ? "motion-step-next" : "motion-step-prev"
        }`}
      >
        <div className="flex flex-col gap-3 max-w-[42ch]">
          <h2 className="t-d2 text-(--c-ink)">{titulo}</h2>
          {subtitulo && (
            <p className="t-corpo-p text-(--c-ink-2)">{subtitulo}</p>
          )}
        </div>

        <div className="mt-9">{children}</div>
      </div>

      <div className="border-t border-(--c-rule) px-6 py-4 lg:px-10 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          {onVoltar ? (
            <button
              type="button"
              onClick={onVoltar}
              className="btn btn-quiet btn-sm"
            >
              <span aria-hidden>←</span> Voltar
            </button>
          ) : (
            <span />
          )}
          {rodape}
        </div>
        {nota}
      </div>
    </div>
  );
}
