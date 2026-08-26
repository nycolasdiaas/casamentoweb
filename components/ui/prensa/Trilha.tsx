/**
 * A4 · Trilha do questionário.
 *
 * Segmentos, não uma barra contínua. A barra responde "quanto falta"; os
 * segmentos respondem "quantas perguntas são" — e é a segunda pergunta que
 * decide se a pessoa começa a responder. Um questionário de sete perguntas com
 * barra de progresso parece infinito; com sete tracinhos, parece sete.
 *
 * O número ao lado ("Etapa 3 / 7") existe para quem não lê o desenho: é o
 * mesmo dado, em texto, e é o que o leitor de tela anuncia.
 */
export default function Trilha({
  total,
  atual,
  acessorio,
  className,
}: {
  total: number;
  /** 1-indexado — é como a etapa aparece escrita. */
  atual: number;
  /** "Salvar e sair", normalmente. */
  acessorio?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-4 ${className ?? ""}`}>
      <span className="meta text-(--c-ink-2) whitespace-nowrap">
        Etapa {atual} / {total}
      </span>
      <div
        className="trilha"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={atual}
        aria-label={`Etapa ${atual} de ${total}`}
      >
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className="trilha-seg"
            data-estado={
              i + 1 < atual ? "feito" : i + 1 === atual ? "agora" : "falta"
            }
          />
        ))}
      </div>
      {acessorio}
    </div>
  );
}
