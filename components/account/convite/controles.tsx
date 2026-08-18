"use client";

/**
 * Peças de controle compartilhadas entre a barra flutuante e o painel lateral.
 *
 * Moraram no `EditorDeConvite` até a barra existir. Com dois consumidores,
 * ficar lá significaria a barra importar do editor e o editor renderizar a
 * barra — ciclo — ou a definição duplicada, que é como um campo passa a
 * aceitar um limite num lugar e outro no outro.
 */

export const FONTES = [
  { id: "serif", rotulo: "Serifada" },
  { id: "sans", rotulo: "Sem serifa" },
  { id: "script", rotulo: "Manuscrita" },
] as const;

/**
 * Campo numérico no lugar de barra deslizante.
 *
 * A barra não diz em que valor está nem deixa repetir o mesmo número em dois
 * blocos — e "espessura 2" é exatamente o tipo de coisa que o casal quer igual
 * nas duas linhas do convite. Com número dá para ler, digitar e copiar.
 *
 * As setas continuam existindo (é `type="number"`), então ajustar de um em um
 * segue fácil para quem prefere clicar.
 */
export function Numero({
  rotulo,
  valor,
  min,
  max,
  passo = 1,
  sufixo,
  compacto = false,
  aoMudar,
  aoComecar,
  aoTerminar,
}: {
  rotulo: string;
  valor: number;
  min: number;
  max: number;
  passo?: number;
  sufixo?: string;
  /** Na barra flutuante o rótulo vira `title` — não há espaço para texto. */
  compacto?: boolean;
  aoMudar: (v: number) => void;
  aoComecar: () => void;
  aoTerminar: () => void;
}) {
  const campo = (
    <input
      type="number"
      value={Number.isFinite(valor) ? Math.round(valor * 1000) / 1000 : min}
      min={min}
      max={max}
      step={passo}
      title={compacto ? rotulo : undefined}
      aria-label={compacto ? rotulo : undefined}
      onFocus={aoComecar}
      onBlur={aoTerminar}
      onChange={(e) => {
        const v = Number(e.target.value);
        if (!Number.isFinite(v)) return;
        aoMudar(Math.min(Math.max(v, min), max));
      }}
      className={
        compacto
          ? "min-h-9 w-16 border border-(--c-rule) bg-white px-1.5 text-right text-[13px]"
          : "min-h-11 w-[5.5rem] border border-(--c-rule) bg-white px-2 text-right text-[13px]"
      }
    />
  );

  if (compacto) return campo;

  return (
    <label className="flex items-center justify-between gap-3 text-[13px]">
      {rotulo}
      <span className="flex items-center gap-1">
        {campo}
        {sufixo && <span className="text-(--c-ink-2)">{sufixo}</span>}
      </span>
    </label>
  );
}
