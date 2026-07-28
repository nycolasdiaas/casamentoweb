import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { siteEvents, sites } from "@/lib/db/schema";
import type { EventKind } from "@/lib/metrics";

export type RecordEventInput = {
  siteId: string;
  kind: EventKind;
  path?: string | null;
  section?: string | null;
  referrerHost?: string | null;
  device?: string | null;
  country?: string | null;
  region?: string | null;
  visitorHash?: string | null;
};

export async function recordEvent(input: RecordEventInput) {
  await db.insert(siteEvents).values({
    siteId: input.siteId,
    kind: input.kind,
    path: input.path ?? null,
    section: input.section ?? null,
    referrerHost: input.referrerHost ?? null,
    device: input.device ?? null,
    country: input.country ?? null,
    region: input.region ?? null,
    visitorHash: input.visitorHash ?? null,
  });
}

/**
 * Atualiza `sites.last_seen_at` no máximo uma vez por dia por site.
 *
 * A condição de 24h está no próprio UPDATE: sem ela, cada visita viraria uma
 * escrita, e o objetivo da arquitetura é justamente que a visita não toque o
 * banco no caminho de render.
 */
export async function touchLastSeen(siteId: string) {
  await db
    .update(sites)
    .set({ lastSeenAt: new Date() })
    .where(
      and(
        eq(sites.id, siteId),
        sql`(${sites.lastSeenAt} is null or ${sites.lastSeenAt} < now() - interval '24 hours')`
      )
    );
}

/**
 * Quantos eventos este visitante gerou neste site na última janela.
 *
 * Serve de rate limit para o beacon público. É de propósito uma LEITURA:
 * o checkRateLimit genérico (lib/rateLimit.ts) grava uma linha por chamada,
 * o que aqui dobraria as escritas e encheria a tabela de brute-force de
 * login com tráfego de métrica. Aproveita o índice (site_id, created_at).
 */
export async function recentEventCount(
  siteId: string,
  hash: string,
  seconds: number
): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(siteEvents)
    .where(
      and(
        eq(siteEvents.siteId, siteId),
        eq(siteEvents.visitorHash, hash),
        gt(siteEvents.createdAt, sql`now() - make_interval(secs => ${seconds})`)
      )
    );
  return row?.n ?? 0;
}

/** Agregado por dia de um site, para o painel do casal e nossas decisões. */
export async function dailyStats(siteId: string, days = 90) {
  return db
    .select({
      day: sql<string>`date_trunc('day', ${siteEvents.createdAt})::date`,
      kind: siteEvents.kind,
      total: sql<number>`count(*)::int`,
      visitors: sql<number>`count(distinct ${siteEvents.visitorHash})::int`,
    })
    .from(siteEvents)
    .where(
      and(
        eq(siteEvents.siteId, siteId),
        gt(siteEvents.createdAt, sql`now() - make_interval(days => ${days})`)
      )
    )
    .groupBy(sql`1`, siteEvents.kind)
    .orderBy(sql`1 desc`);
}
