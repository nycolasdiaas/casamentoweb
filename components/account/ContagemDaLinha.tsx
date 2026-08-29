/**
 * Quantos dias faltam, na linha da lista de pedidos.
 *
 * Componente PURO: recebe o número já calculado. A conta acontece no servidor,
 * em `diasAte` (`lib/site/dataLegivel.ts`) — ler o relógio dentro de um
 * componente é impuro, o lint reprova, e num render cacheado o número
 * congelaria.
 *
 * Sem data marcada, ou casamento já passado, a coluna fica em silêncio: um
 * traço grande chamaria atenção para uma ausência que não é problema.
 */
export default function ContagemDaLinha({ dias }: { dias: number | null }) {
  if (dias === null) return null;

  return (
    <span className="inline-flex flex-col items-end leading-none">
      <span className="t-display text-[22px] text-(--c-ink)">{dias}</span>
      <span className="meta text-[10px] text-(--c-ink-2) mt-1">
        {dias === 1 ? "dia" : "dias"}
      </span>
    </span>
  );
}
