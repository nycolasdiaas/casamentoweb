import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import {
  metricasDaOperacao,
  reaisCurtos,
  variacao,
  type CartaoDeMetrica,
} from "@/lib/repositories/metricasDaOperacao";

/**
 * G3 · o dashboard da operação.
 *
 * O endereço mostrava as confirmações do casamento legado — o único que
 * existia quando o painel nasceu. As regras §3 dizem que o `/admin` existe
 * para EXCEÇÃO, não para operação, e que se ele virar rotina a promessa 2.1 já
 * foi quebrada. Mas o dono precisava de algum número sobre o próprio negócio,
 * e não tinha nenhum: o painel inteiro falava de um casamento só.
 *
 * O casamento continua inteiro, em `/admin/casamento`. Nada dele mudou.
 *
 * ── O que estes números NÃO incluem ────────────────────────────────────────
 *
 * Presente. O Pix vai direto para a conta do casal e nunca passa pela Enlace
 * (regras §2.4) — somá-lo em RECEITA transformaria dinheiro de outra pessoa em
 * faturamento nosso, num número que o dono usaria para decidir.
 *
 * E convidado. Métrica de operação sai de `orders` e `sites`; `guests` e
 * `groups` não entram. Convidado é terceiro, e um número de negócio não
 * precisa dele para existir.
 */
export default async function AdminDashboardPage() {
  await requireAdmin();

  return (
    <main className="flex-1 flex flex-col gap-8 trilho py-12">
      <Suspense
        fallback={<p className="t-corpo text-(--c-ink-2)">Carregando…</p>}
      >
        <Painel />
      </Suspense>
    </main>
  );
}

async function Painel() {
  const m = await metricasDaOperacao();

  const mesPorExtenso = m.mes.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  const mesAnteriorCurto = new Date(
    m.mes.getFullYear(),
    m.mes.getMonth() - 1,
    1
  ).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");

  const maiores = [...m.ultimos14]
    .sort((a, b) => b.pedidos - a.pedidos)
    .slice(0, 2)
    .map((d) => d.dia.getTime());
  const teto = Math.max(...m.ultimos14.map((d) => d.pedidos), 1);
  const totalDoMes = m.porPacote.reduce((t, p) => t + p.pedidos, 0);

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="t-display text-[34px] leading-none text-(--c-ink) first-letter:uppercase">
          {mesPorExtenso}
        </h1>
        {/* "atualizado agora" e não um relógio: a tela é dinâmica e cada
            carregamento consulta o banco. Um horário aqui envelheceria na
            aba aberta e diria uma mentira pequena o tempo todo. */}
        <span className="meta text-(--c-ink-2)">atualizado agora</span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Cartao rotulo="Pedidos · mês" valor={String(m.pedidos.valor)} metrica={m.pedidos} sufixo={mesAnteriorCurto} />
        <Cartao
          rotulo="Receita"
          valor={reaisCurtos(m.receita.valor)}
          metrica={m.receita}
          sufixo={mesAnteriorCurto}
        />
        {/* Acumulado, não do mês: comparar "sites no ar" com o mês passado
            daria sempre positivo e não informaria nada. */}
        <Cartao rotulo="Sites no ar" valor={String(m.sitesNoAr)} acumulado />
        <Cartao
          rotulo="Conversão"
          valor={`${m.conversao.valor}%`}
          metrica={m.conversao}
          sufixo={mesAnteriorCurto}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <div className="surface-raised flex flex-col gap-4 rounded-[3px] p-5">
          <span className="meta text-(--c-ink-2)">Pedidos · 14 dias</span>
          {/* Barras, não linha: quatorze pontos com valores pequenos viram
              serrilha numa linha, e o que se quer ver é "teve dia parado?". */}
          <div className="flex h-[120px] items-end gap-1.5">
            {m.ultimos14.map((d) => (
              <div
                key={d.dia.toISOString()}
                data-barra-dia
                title={`${d.dia.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}: ${d.pedidos}`}
                className="flex-1 rounded-[1px]"
                style={{
                  // Piso de 2px: um dia com zero pedidos precisa existir na
                  // linha de base, senão o gráfico parece ter menos dias.
                  height: `${Math.max((d.pedidos / teto) * 100, 2)}%`,
                  background: maiores.includes(d.dia.getTime())
                    ? "var(--c-mark)"
                    : "#454b52",
                }}
              />
            ))}
          </div>
        </div>

        <div className="surface-raised flex flex-col gap-3 rounded-[3px] p-5">
          <span className="meta text-(--c-ink-2)">Por pacote</span>
          {m.porPacote.map((p) => {
            const pct = totalDoMes === 0 ? 0 : Math.round((p.pedidos / totalDoMes) * 100);
            return (
              <div key={p.tier} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="text-(--c-ink)">{p.nome}</span>
                  <span className="t-data text-[12.5px] text-(--c-ink-2)">
                    {pct}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-(--c-sunken)">
                  <div
                    className="h-full rounded-full bg-(--c-ink)"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function Cartao({
  rotulo,
  valor,
  metrica,
  sufixo,
  acumulado = false,
}: {
  rotulo: string;
  valor: string;
  metrica?: CartaoDeMetrica;
  sufixo?: string;
  acumulado?: boolean;
}) {
  const delta = metrica ? variacao(metrica.valor, metrica.anterior) : null;

  return (
    <div className="surface-raised flex flex-col gap-1 rounded-[3px] p-5">
      <span className="meta text-(--c-ink-2)">{rotulo}</span>
      <span className="t-display text-[42px] leading-none text-(--c-ink)">
        {valor}
      </span>
      {acumulado ? (
        <span className="text-[12.5px] text-(--c-ink-2)">acumulado</span>
      ) : delta === null ? (
        /* Sem base de comparação, um "+100%" seria matemática correta e
           informação falsa: o mês passado não teve nada com que comparar. */
        <span className="text-[12.5px] text-(--c-ink-2)">
          sem comparação
        </span>
      ) : (
        <span
          className={`text-[12.5px] ${delta >= 0 ? "text-(--c-ok)" : "text-(--c-danger)"}`}
        >
          {delta >= 0 ? "+" : "−"}
          {Math.abs(delta)}% vs. {sufixo}
        </span>
      )}
    </div>
  );
}
