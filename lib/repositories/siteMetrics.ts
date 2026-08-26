import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  groups,
  gifts,
  giftContributions,
  siteEvents,
} from "@/lib/db/schema";

/**
 * Os números do site, para a régua no topo do gerenciamento.
 *
 * O protótipo aprovado tinha QUATRO cartões, copiando o iCasei: confirmados,
 * presentes em reais, recados e visitas. Dois não sobreviveram ao confronto
 * com o banco, e é melhor três números verdadeiros que quatro bonitos:
 *
 * - **Recados NÃO EXISTEM.** O mural é a única seção do contrato sem
 *   implementação — não há tabela. Um cartão "Recados: 0" seria uma promessa
 *   de recurso que ninguém pode usar.
 * - **Presentes não têm VALOR.** `gift_contributions` guarda o nome do
 *   presente e de quem deu, nunca um centavo: o Pix vai direto para a conta
 *   do casal e nunca passa por nós — é a premissa do produto ("0% de taxa").
 *   Mostrar "R$ recebido" exigiria inventar o dado ou conciliar extrato.
 *   O que sabemos de verdade é QUANTOS presentes foram escolhidos.
 */
export type MetricasDoSite = {
  convidados: number;
  confirmados: number;
  presentesEscolhidos: number;
  presentesNaLista: number;
  visitas30d: number;
};

export async function metricasDoSite(siteId: string): Promise<MetricasDoSite> {
  // Uma ida ao banco por métrica seria quatro idas; a rede custa ~171 ms
  // medidos por ida, e esta régua abre a tela. Em paralelo, é uma espera só.
  const [convidados, confirmados, escolhidos, naLista, visitas] =
    await Promise.all([
      /* LUGARES RESERVADOS, não linhas em `guests`.
         Desde a 0016 quem responde é o GRUPO ("dos 2 lugares, 2 vão"), e é
         `groups.seats` que diz quantos lugares o casal reservou. Contar
         `guests` daria o número de nomes que o casal digitou — que é o mesmo
         valor hoje (o backfill igualou os dois), mas deixa de ser assim no
         primeiro grupo criado com mais lugares do que nomes. */
      db
        .select({ n: sql<number>`coalesce(sum(${groups.seats}), 0)::int` })
        .from(groups)
        .where(eq(groups.siteId, siteId)),

      /* `sum`, não `count`: um grupo confirmado vale quantas pessoas vão.
         `seats_confirmed` é null enquanto ninguém respondeu, e `sum` ignora
         null — grupo sem resposta não soma nem subtrai. */
      db
        .select({
          n: sql<number>`coalesce(sum(${groups.seatsConfirmed}), 0)::int`,
        })
        .from(groups)
        .where(eq(groups.siteId, siteId)),

      db
        .select({ n: sql<number>`count(*)::int` })
        .from(giftContributions)
        .innerJoin(gifts, eq(giftContributions.giftId, gifts.id))
        .where(eq(gifts.siteId, siteId)),

      db
        .select({ n: sql<number>`count(*)::int` })
        .from(gifts)
        .where(eq(gifts.siteId, siteId)),

      // 30 dias, não "sempre": um total que só cresce deixa de informar depois
      // do primeiro mês. A janela responde "o convite está circulando AGORA?".
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(siteEvents)
        .where(
          and(
            eq(siteEvents.siteId, siteId),
            sql`${siteEvents.createdAt} > now() - interval '30 days'`
          )
        ),
    ]);

  return {
    convidados: convidados[0]?.n ?? 0,
    confirmados: confirmados[0]?.n ?? 0,
    presentesEscolhidos: escolhidos[0]?.n ?? 0,
    presentesNaLista: naLista[0]?.n ?? 0,
    visitas30d: visitas[0]?.n ?? 0,
  };
}
