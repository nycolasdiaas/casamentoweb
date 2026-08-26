/**
 * A4 · Estado vazio.
 *
 * A fórmula, da Voz e Microcopy V4 e da faixa I (Primeira vez):
 *
 *     o que falta  +  o que vai aparecer aqui  +  uma ação  [+ a restrição]
 *
 * "Nenhuma foto ainda", não "Sua galeria está vazia no momento": vazio como
 * acusação é o que faz a tela parecer cobrança. E a linha de baixo descreve o
 * que a pessoa VAI ver quando preencher — é ela que transforma um retângulo
 * pontilhado em convite.
 *
 * A `restricao` no rodapé (formato, limite, pacote necessário) existe porque é
 * exatamente ali que a dúvida aparece — depois de decidir enviar, antes de
 * escolher o arquivo.
 */
export default function EstadoVazio({
  titulo,
  children,
  acao,
  restricao,
  className,
}: {
  titulo: string;
  children: React.ReactNode;
  acao?: React.ReactNode;
  restricao?: string;
  className?: string;
}) {
  return (
    <div
      className={`surface-flat rounded-[3px] border-dashed px-6 py-10 flex flex-col items-center text-center gap-2 ${className ?? ""}`}
    >
      <p className="t-display text-[24px] leading-tight text-(--c-ink)">
        {titulo}
      </p>
      <p className="t-corpo-p text-(--c-ink-2) max-w-[46ch]">{children}</p>
      {acao && <div className="pt-3">{acao}</div>}
      {restricao && (
        <p className="meta text-[11px] text-(--c-ink-2) pt-2">{restricao}</p>
      )}
    </div>
  );
}
