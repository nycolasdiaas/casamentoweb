"use client";

import { useEffect, useRef } from "react";

/**
 * A casca do questionário: barra de progresso, voltar, e a etapa em si.
 *
 * O formulário de pedido era uma página só com pacote, modelo, duas cores, 34
 * fontes, observações e material — tudo aberto ao mesmo tempo. Quem abria via
 * uma parede e fechava. Aqui é uma pergunta por tela, com o progresso à vista,
 * que é o padrão do iCasei e a razão de ele parecer leve com MAIS perguntas.
 *
 * A etapa recebe `direcao` para animar do lado certo: avançar traz da direita,
 * voltar traz da esquerda. Sem isso a troca lê como recarregar a página.
 */
export default function WizardShell({
  passo,
  total,
  direcao,
  titulo,
  subtitulo,
  onVoltar,
  children,
  rodape,
}: {
  passo: number;
  total: number;
  direcao: "frente" | "tras";
  titulo: string;
  subtitulo?: string;
  onVoltar?: () => void;
  children: React.ReactNode;
  rodape: React.ReactNode;
}) {
  const topoRef = useRef<HTMLDivElement>(null);

  // Cada etapa começa do topo. Sem isto, quem rolou até o fim da lista de
  // fontes cai no meio da etapa seguinte sem entender o que aconteceu.
  useEffect(() => {
    topoRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [passo]);

  const progresso = Math.round(((passo + 1) / total) * 100);

  return (
    <div ref={topoRef} className="flex flex-col gap-7 scroll-mt-6">
      {/* Progresso. Número E barra: a barra dá a sensação, o "3 de 7" dá a
          certeza — sozinha, a barra deixa a pessoa sem saber quanto falta. */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          {onVoltar ? (
            <button
              type="button"
              onClick={onVoltar}
              // -mx-2 px-2 py-3: a área de toque cresce para ~44px sem
              // deslocar o texto da margem. No celular, 20px de altura é um
              // alvo que se erra — e este é o botão de desfazer do fluxo.
              className="-mx-2 flex min-h-11 items-center gap-1.5 px-2 py-3 text-sm text-(--color-olive)/70 transition-colors hover:text-(--color-olive)"
            >
              <span aria-hidden>←</span> Voltar
            </button>
          ) : (
            <span />
          )}
          <span className="text-xs font-medium tracking-[0.14em] uppercase text-(--color-muted)">
            {passo + 1} de {total}
          </span>
        </div>

        <div
          role="progressbar"
          aria-valuenow={progresso}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso do pedido"
          className="h-1 w-full overflow-hidden rounded-full bg-(--color-olive)/10"
        >
          <div
            className="h-full rounded-full bg-[#2f3a29]"
            style={{
              width: `${progresso}%`,
              transition: "width var(--t-lento) var(--e-saida)",
            }}
          />
        </div>
      </div>

      {/* `key={passo}` remonta o bloco a cada etapa: é o que faz a animação
          rodar de novo em vez de o React reaproveitar o nó e trocar seco. */}
      <div
        key={passo}
        className={
          direcao === "frente" ? "motion-step-next" : "motion-step-prev"
        }
      >
        <div className="flex flex-col gap-2 text-center">
          <h2 className="text-2xl font-semibold text-(--color-olive)">
            {titulo}
          </h2>
          {subtitulo && (
            <p className="mx-auto max-w-md text-sm leading-relaxed text-(--color-olive)/70">
              {subtitulo}
            </p>
          )}
        </div>

        <div className="mt-7">{children}</div>
      </div>

      <div className="flex flex-col gap-3 border-t border-(--color-gold)/30 pt-5">
        {rodape}
      </div>
    </div>
  );
}
