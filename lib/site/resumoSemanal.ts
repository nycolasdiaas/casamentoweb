import { and, eq, gte, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  gifts,
  giftContributions,
  groups,
  guestbookMessages,
  orders,
  siteContent,
  sites,
  users,
} from "@/lib/db/schema";

/**
 * O resumo da semana — J2 do protótipo.
 *
 * ── A regra que decide se ele existe ───────────────────────────────────────
 *
 * *"Resumo semanal só é enviado se houve movimento. Semana parada não gera
 * e-mail."* É a regra J3 do próprio desenho, e é o que separa um resumo de um
 * lembrete de que o produto existe. Um e-mail semanal que chega dizendo "nada
 * aconteceu" ensina o casal a não abrir o próximo.
 *
 * ── O número que a Enlace NÃO tem ──────────────────────────────────────────
 *
 * O artboard desenha `PRESENTES R$ 750`. Esse número não existe: o Pix vai
 * direto para a conta do casal e `gift_contributions` guarda o nome do
 * presente e de quem deu, **nunca um centavo** (regras §2.4).
 *
 * Aqui vale a mesma saída que a aba Presentes já usa: contar **cotas
 * escolhidas**, e só mostrar reais quando **toda** cota escolhida na semana
 * tinha preço fixo. Somar só as de preço fixo e apresentar como total daria um
 * número menor que o real — pior que não mostrar nenhum.
 */

export type ResumoDaSemana = {
  siteId: string;
  orderId: string | null;
  /** Do dono do site — é para ele que o resumo vai, e é ele que descadastra. */
  userId: string;
  email: string;
  nomes: string;
  slug: string;
  /** Início da janela de sete dias. */
  desde: Date;
  confirmacoes: number;
  presentes: number;
  /** Em centavos, ou `null` quando alguma cota da semana era de valor livre. */
  presentesEmReais: number | null;
  recados: number;
  /** Lugares que seguem sem resposta — o "o que merece atenção". */
  semResposta: number;
  /** Dias até o casamento, ou `null` se não há data. */
  diasParaOCasamento: number | null;
};

const SEMANA_MS = 7 * 86_400_000;

/**
 * Houve movimento?
 *
 * Fora da função principal porque é a regra J3, e ela merece um nome. Quem
 * ler `if (temMovimento(r))` entende o que está sendo perguntado; quem ler a
 * soma de três campos, não.
 */
export function temMovimento(r: ResumoDaSemana): boolean {
  return r.confirmacoes > 0 || r.presentes > 0 || r.recados > 0;
}

/**
 * Monta o resumo de todos os sites **publicados**, para a semana que passou.
 *
 * Só publicados: um site em prévia não tem convidado nenhum para confirmar
 * presença, e mandar "como foi a semana de vocês" para quem ainda não
 * publicou é falar de um movimento que não podia existir.
 */
export async function resumosDaSemana(
  agora = new Date()
): Promise<ResumoDaSemana[]> {
  const desde = new Date(agora.getTime() - SEMANA_MS);

  const linhas = await db
    .select({
      siteId: sites.id,
      orderId: sites.orderId,
      slug: sites.slug,
      userId: users.id,
      email: users.email,
      nomeDaConta: users.name,
      coupleNames: siteContent.coupleNames,
      weddingDate: siteContent.weddingDate,
    })
    .from(sites)
    .innerJoin(users, eq(sites.userId, users.id))
    .leftJoin(siteContent, eq(siteContent.siteId, sites.id))
    /* Só publicados, e só quem não pediu para parar.
    
       Um site em prévia não tem convidado nenhum para confirmar presença, e
       mandar "como foi a semana de vocês" para quem ainda não publicou é falar
       de um movimento que não podia existir.
       
       O `opt out` é filtrado AQUI e não na hora de enviar: assim o casal que
       parou de receber nem entra na contagem que a rota devolve, e o número
       de "enviados" continua querendo dizer o que diz. */
    .where(
      and(eq(sites.status, "published"), isNull(users.weeklyDigestOptOut))
    );

  if (linhas.length === 0) return [];

  const ids = linhas.map((l) => l.siteId);

  /* Quatro agregados, um por assunto, todos agrupados NO BANCO.

     Trazer as linhas e contar em memória funcionaria com os sites de hoje e
     deixaria de funcionar antes de alguém perceber: um casamento com 300
     presentes viraria 300 linhas na rede para devolver um número. */
  const [confirmacoes, presentes, recados, pendentes] = await Promise.all([
    /* Confirmação da SEMANA, pela janela de `responded_at`.
    
       É a coluna certa e não um `updated_at` genérico: ela guarda **quando o
       convidado respondeu**, e é escrita só por `responderRsvpDoGrupo`. Um
       `updated_at` contaria como "confirmação da semana" o grupo que o casal
       renomeou ontem. */
    db
      .select({
        siteId: groups.siteId,
        n: sql<number>`coalesce(sum(${groups.seatsConfirmed}), 0)::int`,
      })
      .from(groups)
      .where(
        and(
          inArray(groups.siteId, ids),
          gte(groups.respondedAt, desde),
          sql`${groups.seatsConfirmed} is not null`
        )
      )
      .groupBy(groups.siteId),

    db
      .select({
        siteId: gifts.siteId,
        n: sql<number>`count(*)::int`,
        /* `count(*) filter (where price_cents is null)` conta as cotas de
           valor LIVRE. Se houver uma que seja, o total em reais não sai. */
        livres: sql<number>`count(*) filter (where ${gifts.priceCents} is null)::int`,
        soma: sql<number>`coalesce(sum(${gifts.priceCents}), 0)::int`,
      })
      .from(giftContributions)
      .innerJoin(gifts, eq(giftContributions.giftId, gifts.id))
      .where(
        and(inArray(gifts.siteId, ids), gte(giftContributions.createdAt, desde))
      )
      .groupBy(gifts.siteId),

    db
      .select({
        siteId: guestbookMessages.siteId,
        n: sql<number>`count(*)::int`,
      })
      .from(guestbookMessages)
      .where(
        and(
          inArray(guestbookMessages.siteId, ids),
          gte(guestbookMessages.createdAt, desde)
        )
      )
      .groupBy(guestbookMessages.siteId),

    /* Lugares sem resposta — acumulado, não da semana. É o "o que merece
       atenção", e o que importa nele é quantos faltam AGORA. */
    db
      .select({
        siteId: groups.siteId,
        n: sql<number>`coalesce(sum(${groups.seats}) filter (where ${groups.seatsConfirmed} is null), 0)::int`,
      })
      .from(groups)
      .where(inArray(groups.siteId, ids))
      .groupBy(groups.siteId),
  ]);

  /* `siteId` é nullable no schema — a coluna nasceu num backfill e só vira
     `NOT NULL` numa migração posterior. As linhas sem site não têm como entrar
     em nenhum resumo, e o `filter` as tira antes de virarem chave `null`. */
  const mapa = <T extends { siteId: string | null }>(l: T[]) =>
    new Map(
      l.filter((x): x is T & { siteId: string } => x.siteId !== null)
        .map((x) => [x.siteId, x] as const)
    );
  const porConf = mapa(confirmacoes);
  const porPres = mapa(presentes);
  const porRec = mapa(recados);
  const porPend = mapa(pendentes);

  return linhas.map((l) => {
    const p = porPres.get(l.siteId);
    const dias = l.weddingDate
      ? Math.ceil((l.weddingDate.getTime() - agora.getTime()) / 86_400_000)
      : null;

    return {
      siteId: l.siteId,
      orderId: l.orderId,
      userId: l.userId,
      email: l.email,
      nomes: l.coupleNames?.trim() || l.nomeDaConta,
      slug: l.slug,
      desde,
      confirmacoes: porConf.get(l.siteId)?.n ?? 0,
      presentes: p?.n ?? 0,
      /* Uma cota de valor livre na semana e o total em reais desaparece. Não é
         cautela: é que o número não existe. */
      presentesEmReais: p && p.n > 0 && p.livres === 0 ? p.soma : null,
      recados: porRec.get(l.siteId)?.n ?? 0,
      semResposta: porPend.get(l.siteId)?.n ?? 0,
      // Casamento que já passou não tem contagem regressiva.
      diasParaOCasamento: dias !== null && dias >= 0 ? dias : null,
    };
  });
}

/** Os pedidos de cada site, para o link do painel no e-mail. */
export async function orderIdsDosSites(
  ids: string[]
): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const linhas = await db
    .select({ siteId: sites.id, orderId: orders.id })
    .from(sites)
    .innerJoin(orders, eq(sites.orderId, orders.id))
    .where(inArray(sites.id, ids));
  return new Map(linhas.map((l) => [l.siteId, l.orderId]));
}
