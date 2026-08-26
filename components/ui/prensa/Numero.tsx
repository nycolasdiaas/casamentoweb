/**
 * A4 · O número que importa.
 *
 * Regra da prancha A2, e é a que mais muda a cara de um painel: número que
 * importa é DISPLAY GRANDE, não corpo em negrito. "138" em Instrument Serif a
 * 44px é um dado; "138" em sans 16px bold é uma linha de tabela.
 *
 * O rótulo vem em Meta acima, e a nota (a variação, o total, o "de R$ 3.000")
 * embaixo — nessa ordem, porque o olho cai primeiro no maior e depois procura
 * o que ele significa.
 */
export default function Numero({
  rotulo,
  valor,
  nota,
  tom = "neutro",
  className,
}: {
  rotulo: string;
  valor: React.ReactNode;
  nota?: React.ReactNode;
  /** Só a NOTA muda de cor — o número continua tinta. */
  tom?: "neutro" | "ok" | "warn" | "danger";
  className?: string;
}) {
  const corDaNota = {
    neutro: "text-(--c-ink-2)",
    ok: "text-(--c-ok)",
    warn: "text-(--c-warn)",
    danger: "text-(--c-danger)",
  }[tom];

  return (
    <div
      className={`surface-raised rounded-[3px] p-5 flex flex-col gap-1.5 ${className ?? ""}`}
    >
      <span className="meta text-(--c-ink-2)">{rotulo}</span>
      <span className="t-display text-[44px] leading-none text-(--c-ink)">
        {valor}
      </span>
      {nota && <span className={`text-[12.5px] ${corDaNota}`}>{nota}</span>}
    </div>
  );
}
