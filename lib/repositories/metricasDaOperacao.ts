import { and, gte, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { orders, sites } from "@/lib/db/schema";
import { PACKAGES, type PackageTier } from "@/lib/packages";

/**
 * Os números do NEGÓCIO, para o dashboard do admin.
 *
 * ── O que entra, e o que nunca pode entrar ─────────────────────────────────
 *
 * **Receita é o valor dos PACOTES, e só.** O Pix do presente vai direto para
 * a conta do casal e nunca passa pela Enlace (regras §2.4) — somá-lo aqui
 * transformaria dinheiro de outra pessoa em faturamento nosso, num número que
 * o dono usaria para decidir. É o mesmo erro que a chave Pix chumbada já
 * cometeu uma vez, em outra forma.
 *
 * **Nenhuma consulta lê dado de convidado.** Métrica de operação sai de
 * `orders` e `sites`. `guests` e `groups` não entram: convidado é terceiro
 * (LGPD), e um número de negócio não precisa dele para existir.
 *
 * ── Por que "chegou a pago", e não "está pago" ─────────────────────────────
 *
 * Um pedido que foi pago e depois publicou tem `status = 'published'`, não
 * `'paid'`. Contar só `paid` deixaria de fora justamente as vendas que deram
 * certo — o número cairia quanto melhor fosse o mês.
 */

/* Os dois estados que significam "o casal pagou" — `paid` e `published` —
   estão escritos direto no SQL abaixo, e não numa constante: o `filter` do
   Postgres precisa deles como literais, e uma constante que o SQL não usa
   seria uma segunda lista para alguém atualizar sozinha. */

export type CartaoDeMetrica = {
  valor: number;
  /** O mesmo número no mês anterior. `null` quando não faz sentido comparar. */
  anterior: number | null;
};

export type MetricasDaOperacao = {
  mes: Date;
  pedidos: CartaoDeMetrica;
  /** Em centavos. */
  receita: CartaoDeMetrica;
  /** Acumulado, não do mês — por isso sem comparação. */
  sitesNoAr: number;
  /** 0 a 100. */
  conversao: CartaoDeMetrica;
  /** Últimos 14 dias, do mais antigo ao mais recente. */
  ultimos14: { dia: Date; pedidos: number }[];
  porPacote: { tier: PackageTier; nome: string; pedidos: number }[];
};

/**
 * Chave YYYY-MM-DD no fuso de São Paulo.
 *
 * Tem que ser o MESMO fuso do `AT TIME ZONE` da consulta — o defeito que isto
 * conserta era exatamente os dois lados usando fusos diferentes. Mesma função
 * que `lib/site/avisos.ts` usa para agrupar por dia, pela mesma razão.
 */
function diaDeSaoPaulo(data: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(data);
}

const primeiroDoMes = (base: Date, deslocamento = 0) =>
  new Date(base.getFullYear(), base.getMonth() + deslocamento, 1);

/** Pedidos criados e pagos numa janela, em uma ida ao banco. */
async function janela(de: Date, ate: Date) {
  const [linha] = await db
    .select({
      criados: sql<number>`count(*)::int`,
      pagos: sql<number>`count(*) filter (where ${orders.status} in ('paid','published'))::int`,
      receita: sql<number>`coalesce(sum(${orders.priceCents}) filter (where ${orders.status} in ('paid','published')), 0)::int`,
    })
    .from(orders)
    .where(and(gte(orders.createdAt, de), lt(orders.createdAt, ate)));

  return {
    criados: linha?.criados ?? 0,
    pagos: linha?.pagos ?? 0,
    receita: linha?.receita ?? 0,
  };
}

export async function metricasDaOperacao(
  agora = new Date()
): Promise<MetricasDaOperacao> {
  const inicioDoMes = primeiroDoMes(agora);
  const inicioDoAnterior = primeiroDoMes(agora, -1);
  const fimDoMes = primeiroDoMes(agora, 1);

  /* Catorze dias inteiros, contando hoje. `setHours(0,0,0,0)` porque o dia da
     barra é o dia do calendário, não as últimas 24 horas. */
  const inicioDosDias = new Date(agora);
  inicioDosDias.setHours(0, 0, 0, 0);
  inicioDosDias.setDate(inicioDosDias.getDate() - 13);

  const [esteMes, mesPassado, publicados, porDia, porPacote] =
    await Promise.all([
      janela(inicioDoMes, fimDoMes),
      janela(inicioDoAnterior, inicioDoMes),

      db
        .select({ n: sql<number>`count(*)::int` })
        .from(sites)
        .where(sql`${sites.status} = 'published'`),

      /* Agrupado no BANCO, não em memória: com mil pedidos, trazer todas as
         linhas para contar catorze números seria mil linhas na rede para
         devolver catorze. */
      /* O DIA é o dia de SÃO PAULO, nos dois lados da conta.

         Antes o Postgres agrupava por `date_trunc('day', created_at)` — no
         fuso da sessão, que é UTC — e o JS montava as chaves dos catorze
         baldes com `getFullYear/getMonth/getDate`, que é hora local. Das 21h
         em diante os dois discordam: em Fortaleza ainda é hoje, em UTC já é
         amanhã. A chave gerada não casava com nenhum balde, e o pedido do fim
         da noite SUMIA do gráfico — justo no horário em que casal navega.

         Ninguém vê esse defeito acontecer: a barra de hoje simplesmente fica
         mais baixa do que foi. Foi um teste noturno que o pegou. */
      db
        .select({
          dia: sql<string>`(${orders.createdAt} AT TIME ZONE 'America/Sao_Paulo')::date::text`,
          n: sql<number>`count(*)::int`,
        })
        .from(orders)
        .where(gte(orders.createdAt, inicioDosDias))
        .groupBy(sql`(${orders.createdAt} AT TIME ZONE 'America/Sao_Paulo')::date`),

      db
        .select({ tier: orders.packageTier, n: sql<number>`count(*)::int` })
        .from(orders)
        .where(and(gte(orders.createdAt, inicioDoMes), lt(orders.createdAt, fimDoMes)))
        .groupBy(orders.packageTier),
    ]);

  /* Dia sem pedido precisa aparecer como zero: um gráfico que pula os dias
     vazios comprime o eixo e faz uma semana parada parecer movimentada. */
  const contagemPorDia = new Map(porDia.map((d) => [d.dia, d.n]));
  const ultimos14 = Array.from({ length: 14 }, (_, i) => {
    const dia = new Date(inicioDosDias);
    dia.setDate(dia.getDate() + i);
    const chave = diaDeSaoPaulo(dia);
    return { dia, pedidos: contagemPorDia.get(chave) ?? 0 };
  });

  const taxa = (j: { criados: number; pagos: number }) =>
    j.criados === 0 ? 0 : Math.round((j.pagos / j.criados) * 100);

  return {
    mes: inicioDoMes,
    pedidos: { valor: esteMes.criados, anterior: mesPassado.criados },
    receita: { valor: esteMes.receita, anterior: mesPassado.receita },
    sitesNoAr: publicados[0]?.n ?? 0,
    conversao: { valor: taxa(esteMes), anterior: taxa(mesPassado) },
    ultimos14,
    /* Os três pacotes sempre aparecem, mesmo zerados: a ausência de uma barra
       é informação ("ninguém comprou o Convite este mês"), e uma lista que
       muda de tamanho a cada mês não dá para comparar de relance. */
    porPacote: PACKAGES.map((p) => ({
      tier: p.tier,
      nome: p.name,
      pedidos: porPacote.find((x) => x.tier === p.tier)?.n ?? 0,
    })),
  };
}

/**
 * `R$ 21k` — milhar abreviado, para o número caber em 42px.
 *
 * Trunca, nunca arredonda para cima. `Math.round` transformaria R$ 99,90 em
 * "R$ 100" — e um número de receita que erra para MAIS é o único tipo de erro
 * que não se pode cometer numa tela onde o dono decide. Para menos, ele vê um
 * real a menos do que tem; para mais, ele conta com dinheiro que não existe.
 */
export function reaisCurtos(centavos: number): string {
  const reais = Math.floor(centavos / 100);
  if (reais < 1000) return `R$ ${reais}`;
  const milhares = reais / 1000;
  // Uma casa só abaixo de 10 mil: "R$ 1,2k" informa, "R$ 12,4k" vira ruído.
  return `R$ ${milhares < 10 ? (Math.floor(milhares * 10) / 10).toFixed(1).replace(".", ",") : Math.floor(milhares)}k`;
}

/** `+18%` / `−12%` / `null` quando não há base de comparação. */
export function variacao(valor: number, anterior: number | null): number | null {
  if (anterior === null || anterior === 0) return null;
  return Math.round(((valor - anterior) / anterior) * 100);
}
