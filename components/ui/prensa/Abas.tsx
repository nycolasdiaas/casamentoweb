import Link from "next/link";

/**
 * A4 · Abas do painel.
 *
 * Sublinhado de 2px na ativa, sobre a superfície branca da casca. Sem pílula
 * e sem fundo próprio: uma aba com fundo compete com o card que vem logo
 * abaixo, e no painel do casal o card é o conteúdo.
 *
 * A `pendencia` é o único acento que a barra aceita — a palavra "falta" em
 * `--warn` ao lado de "Presentes". É informação de estado, não enfeite: diz
 * onde tem trabalho parado sem obrigar a abrir as sete abas.
 *
 * Rola na horizontal no celular. Sete abas não cabem em 390px, e o padrão de
 * empilhar vira um menu de sete linhas antes do conteúdo.
 */

export type Aba = {
  href: string;
  rotulo: string;
  /** Contagem discreta em mono ("12", "4"). */
  contagem?: number | string;
  /** Palavra em --warn ("falta"). */
  pendencia?: string;
};

export default function Abas({
  abas,
  ativa,
  className,
}: {
  abas: Aba[];
  /** O href da aba corrente. Comparação exata — o painel não tem sub-aba. */
  ativa: string;
  className?: string;
}) {
  return (
    <nav
      aria-label="Seções do site"
      /* Sem trilho próprio: quem posiciona é quem chama. A barra tanto pode
         sangrar de ponta a ponta quanto viver dentro do trilho de 1200 da
         casca, e um `max-w` embutido aqui tornaria o segundo caso impossível
         sem gambiarra de margem negativa. */
      className={`bg-(--c-surface) border-b border-(--c-rule) ${className ?? ""}`}
    >
      <ul className="flex overflow-x-auto no-scrollbar px-2">
          {abas.map((aba) => (
            <li key={aba.href}>
              <Link
                href={aba.href}
                aria-current={aba.href === ativa ? "page" : undefined}
                className="aba"
              >
                {aba.rotulo}
                {aba.contagem !== undefined && (
                  <span className="t-data text-[11px] text-(--c-ink-2)">
                    {aba.contagem}
                  </span>
                )}
                {aba.pendencia && (
                  <span className="meta text-[11px] text-(--c-warn)">
                    {aba.pendencia}
                  </span>
                )}
              </Link>
            </li>
          ))}
      </ul>
    </nav>
  );
}
