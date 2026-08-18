import Link from "next/link";
import type { Tarefa } from "@/lib/site/oQueFalta";

/**
 * "O que falta" — o guia do que ainda dá para melhorar no site.
 *
 * Substitui o onboarding de 5 passos do iCasei, que é igual para todo mundo.
 * Cada linha aqui é sobre ESTE site, e a que não está feita traz o botão que
 * leva onde se resolve. Sem isso a lista informa e não ajuda — o casal
 * descobre o que falta e ainda precisa caçar a tela.
 *
 * Some por inteiro quando tudo está feito: uma lista de itens riscados é
 * ruído, e o casal que terminou não precisa de lembrete do que já fez.
 */
export default function OQueFalta({
  tarefas,
  feitas,
  total,
}: {
  tarefas: Tarefa[];
  feitas: number;
  total: number;
}) {
  if (feitas === total) return null;

  const pct = total > 0 ? Math.round((feitas / total) * 100) : 0;

  return (
    <section className="surface-raised rounded-[3px] p-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-base font-semibold text-(--c-ink)">O que falta</h2>
        <span className="meta text-(--c-ink-2)">
          {feitas} de {total}
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={feitas}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label="Progresso do site"
        className="surface-sunken mt-3 mb-5 h-[3px] overflow-hidden rounded-[2px]"
      >
        <div className="h-full bg-(--c-ink)" style={{ width: `${pct}%` }} />
      </div>

      <ul className="flex flex-col">
        {tarefas.map((t) => (
          <li
            key={t.id}
            className="flex items-center gap-3 border-b border-(--c-rule) py-3.5 last:border-b-0"
          >
            <span aria-hidden className="flex shrink-0">
              {t.feita ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-(--c-ink)">
                  <path d="M3 8.5L6.5 12L13 4" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-(--c-rule)">
                  <circle cx="8" cy="8" r="5.5" />
                </svg>
              )}
            </span>

            <span
              className={`flex-1 text-[14.5px] ${
                t.feita ? "text-(--c-ink-2) line-through" : "text-(--c-ink)"
              }`}
            >
              {t.texto}
            </span>

            {!t.feita && t.href && (
              <Link
                href={t.href}
                className="inline-flex min-h-11 items-center text-[13px] text-(--c-mark) underline underline-offset-[3px]"
              >
                {t.acao}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
