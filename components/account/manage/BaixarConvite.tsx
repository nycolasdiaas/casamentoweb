import Link from "next/link";

/**
 * O atalho para os convites, ao lado das áreas editáveis.
 *
 * Fica aqui, e não só no menu, porque o convite usa exatamente o que o casal
 * acabou de editar na coluna: nomes, data, local. Ver o atalho logo depois de
 * corrigir a data é o que faz lembrar que o convite existe — um item de menu
 * escondido não faz isso.
 *
 * O desenho e o download moram em /convites; aqui é só a porta. Duplicar o
 * botão de baixar levaria a duas versões do convite (a automática e a
 * desenhada) e o casal mandaria a errada para a família.
 */
export default function BaixarConvite({
  orderId,
  quantidade,
}: {
  orderId: string;
  quantidade: number;
}) {
  return (
    <div className="surface-raised flex flex-col gap-3 rounded-[3px] p-4">
      <span className="meta text-(--c-ink-2)">Convites</span>
      <p className="text-[13px] leading-relaxed text-(--c-ink-2)">
        {quantidade > 0
          ? `Vocês têm ${quantidade} ${quantidade === 1 ? "convite" : "convites"}. Editem e baixem em PNG, JPEG ou PDF.`
          : "Desenhem o convite de vocês e baixem em PNG, JPEG ou PDF para mandar no grupo da família."}
      </p>
      <Link
        href={`/conta/pedidos/${orderId}/convites`}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[3px] border border-(--c-ink) px-4 text-[13px] text-(--c-ink) transition-colors hover:bg-(--c-ink) hover:text-(--c-surface)"
      >
        <svg
          aria-hidden
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M2.5 2.5h11v11h-11zM2.5 6h11M6 6v7.5" />
        </svg>
        {quantidade > 0 ? "Ver os convites" : "Criar convite"}
      </Link>
    </div>
  );
}
