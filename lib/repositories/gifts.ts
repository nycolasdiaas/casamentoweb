import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db/client";
import {
  gifts,
  giftContributions,
  giftPhotos,
  siteContent,
  sites,
} from "@/lib/db/schema";

// TODA consulta aqui é escopada por siteId. Sem isso, a lista de presentes
// de um casal apareceria no site de outro — ver docs/sdd-geracao-automatica.md §1.2.
//
// A ÚNICA exceção é `listContributionsParaAdmin`, no fim do arquivo, e o nome
// dela carrega o aviso.

export type GiftInput = {
  category: string;
  name: string;
  /**
   * Descrição opcional, com o tom de humor do casal. Sempre digitada por
   * eles — nunca gerada automaticamente (ver comentário na coluna, schema.ts).
   */
  description?: string | null;
  priceCents: number | null;
  /**
   * null ou ausente = sem teto de cotas. Ver `gifts.quantity` no schema.
   *
   * OPCIONAL de propósito: as ações do admin (`gift-actions.ts`) e os testes
   * anteriores à 0017 criam cota sem falar em quantidade, e o significado
   * deles é exatamente "sem teto". Tornar o campo obrigatório forçaria a
   * escrever `quantity: null` em cada um só para dizer o que o padrão já diz.
   */
  quantity?: number | null;
};

export async function createGift(siteId: string, input: GiftInput) {
  const [{ maxPosition }] = await db
    .select({ maxPosition: sql<number>`coalesce(max(${gifts.position}), -1)` })
    .from(gifts)
    .where(eq(gifts.siteId, siteId));

  const [gift] = await db
    .insert(gifts)
    .values({ ...input, siteId, position: maxPosition + 1 })
    .returning();
  return gift;
}

export async function updateGift(
  siteId: string,
  giftId: string,
  input: GiftInput
) {
  const [gift] = await db
    .update(gifts)
    .set(input)
    .where(and(eq(gifts.id, giftId), eq(gifts.siteId, siteId)))
    .returning();
  return gift ?? null;
}

export async function deleteGift(siteId: string, giftId: string) {
  await db
    .delete(gifts)
    .where(and(eq(gifts.id, giftId), eq(gifts.siteId, siteId)));
}

/**
 * Lista de presentes do site, em cache.
 *
 * Muda só quando o casal mexe na lista — e aí a action chama
 * `updateTag('gifts:<siteId>')`, então o convidado nunca vê versão velha.
 */
export async function listGifts(siteId: string) {
  "use cache";
  cacheTag(`gifts:${siteId}`);
  cacheLife("days");

  return db.query.gifts.findMany({
    where: eq(gifts.siteId, siteId),
    orderBy: (gifts, { asc }) => [asc(gifts.position), asc(gifts.createdAt)],
  });
}

export async function getGiftById(siteId: string, giftId: string) {
  const gift = await db.query.gifts.findFirst({
    where: and(eq(gifts.id, giftId), eq(gifts.siteId, siteId)),
  });
  return gift ?? null;
}

export async function registerContribution({
  giftId,
  giftName,
  guestName,
}: {
  giftId: string | null;
  giftName: string;
  guestName: string | null;
}) {
  const [contribution] = await db
    .insert(giftContributions)
    .values({ giftId, giftName, guestName })
    .returning();
  return contribution;
}

/**
 * Contribuições do site. giftContributions não tem site_id próprio (o
 * presente pode ter sido apagado, deixando giftId null), então o escopo vem
 * da lista de presentes do site.
 */
export async function listContributions(siteId: string) {
  const siteGifts = await db
    .select({ id: gifts.id })
    .from(gifts)
    .where(eq(gifts.siteId, siteId));

  if (siteGifts.length === 0) return [];

  return db.query.giftContributions.findMany({
    where: inArray(
      giftContributions.giftId,
      siteGifts.map((g) => g.id)
    ),
    orderBy: (giftContributions, { desc }) => [
      desc(giftContributions.createdAt),
    ],
  });
}

/** Agrupa presentes por categoria preservando a ordem de exibição. */
export function groupGiftsByCategory<
  T extends { category: string }
>(giftList: T[]): { category: string; gifts: T[] }[] {
  const grouped: { category: string; gifts: T[] }[] = [];
  for (const gift of giftList) {
    const existing = grouped.find((g) => g.category === gift.category);
    if (existing) {
      existing.gifts.push(gift);
    } else {
      grouped.push({ category: gift.category, gifts: [gift] });
    }
  }
  return grouped;
}

/**
 * Quantas contribuições cada cota já recebeu — para a barra de progresso da
 * prancha E6.
 *
 * Uma consulta agregada em vez de contar em memória: `listContributions`
 * devolve a linha inteira de cada contribuição, e a tela só precisa do número.
 * Num casamento com 300 presentes isso é a diferença entre trazer 300 linhas e
 * trazer 20.
 *
 * A contagem é por `gift_id`. Contribuição de cota apagada tem `gift_id` nulo
 * (a FK é `set null`, para o registro sobreviver à exclusão) e simplesmente
 * não entra em nenhum grupo — que é o certo: ela não pertence mais a cota
 * nenhuma.
 */
export async function contribuicoesPorCota(
  siteId: string
): Promise<Map<string, number>> {
  "use cache";
  cacheTag(`gift-contributions:${siteId}`);
  cacheLife("minutes");

  const linhas = await db
    .select({
      giftId: giftContributions.giftId,
      total: sql<number>`count(*)::int`,
    })
    .from(giftContributions)
    .innerJoin(gifts, eq(giftContributions.giftId, gifts.id))
    .where(eq(gifts.siteId, siteId))
    .groupBy(giftContributions.giftId);

  return new Map(
    linhas
      .filter((l): l is { giftId: string; total: number } => l.giftId !== null)
      .map((l) => [l.giftId, l.total])
  );
}

/**
 * Foto de cada presente do site, indexada por giftId — para o grid montar
 * `<img src="/gf/<id>">` sem uma consulta por card.
 */
export async function fotosPorPresente(
  siteId: string
): Promise<Map<string, { id: string; blurDataUrl: string | null }>> {
  "use cache";
  cacheTag(`gift-photos:${siteId}`);
  cacheLife("days");

  const linhas = await db
    .select({
      giftId: giftPhotos.giftId,
      id: giftPhotos.id,
      blurDataUrl: giftPhotos.blurDataUrl,
    })
    .from(giftPhotos)
    .innerJoin(gifts, eq(giftPhotos.giftId, gifts.id))
    .where(eq(gifts.siteId, siteId));

  return new Map(linhas.map((l) => [l.giftId, l]));
}

export async function getGiftPhotoById(photoId: string) {
  const [photo] = await db
    .select()
    .from(giftPhotos)
    .where(eq(giftPhotos.id, photoId));
  return photo ?? null;
}

export async function getGiftPhotoByGiftId(giftId: string) {
  const [photo] = await db
    .select()
    .from(giftPhotos)
    .where(eq(giftPhotos.giftId, giftId));
  return photo ?? null;
}

export type NewGiftPhoto = {
  giftId: string;
  storagePath: string;
  contentType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  blurDataUrl: string | null;
};

/**
 * Cria a foto do presente. `giftId` é único na tabela — se já existir uma,
 * a action chamadora precisa apagar a linha antiga primeiro (ver
 * `deleteGiftPhoto`) e só então chamar esta, para o objeto velho no Storage
 * não virar lixo órfão (mesma ordem — linha sai, objeto depois — de
 * `deletePhotoAction`).
 */
export async function setGiftPhoto(input: NewGiftPhoto) {
  const [photo] = await db.insert(giftPhotos).values(input).returning();
  return photo;
}

/** Apaga a linha e devolve o caminho no Storage, para o objeto sair junto. */
export async function deleteGiftPhoto(giftId: string) {
  const [deleted] = await db
    .delete(giftPhotos)
    .where(eq(giftPhotos.giftId, giftId))
    .returning({ storagePath: giftPhotos.storagePath });
  return deleted?.storagePath ?? null;
}

/**
 * As contribuições de TODOS os sites — só para o `/admin/presentes`.
 *
 * ⚠ **Esta é a única consulta de presente sem `siteId`, e ela não pode ser
 * chamada de rota pública.** O isolamento por `siteId` é o corte de segurança
 * entre clientes (SDD §5.2): uma função global solta no repositório é o
 * caminho mais curto para ele vazar — basta alguém importá-la por engano numa
 * tela do casal e a lista de presentes de um casamento aparecer no de outro.
 *
 * O nome carrega o aviso de propósito. Quem for chamar de fora de
 * `app/admin/presentes/page.tsx` está errado, e o nome diz isso antes de o
 * código rodar.
 *
 * O que ela NÃO tem, e não pode ganhar: valor recebido, estado de repasse,
 * "pendente". O Pix vai direto para a conta de cada casal e nunca passa pela
 * Enlace (§2.4); um campo desses seria a operação que as regras recusam.
 */
/**
 * Quem já presenteou, para O CASAL — nome, presente e quando.
 *
 * ── Por que faltava ────────────────────────────────────────────────────────
 *
 * O convidado é convidado a se identificar ("conte pra gente quem você é"), o
 * nome é gravado, e até hoje só o `/admin` conseguia lê-lo
 * (`listContributionsParaAdmin`). O casal via um número — "3 cotas escolhidas"
 * — e mais nada. Quem deu o quê, que é o que ele precisa para agradecer, ficava
 * do lado de dentro da plataforma.
 *
 * Mesma forma do cadastro de famílias antes de ser portado: o recurso existia,
 * só não para quem comprou.
 *
 * O que ela NÃO tem, e não pode ganhar: valor recebido ou confirmação de que o
 * Pix caiu. A Enlace nunca fica no meio (§2.4) — isto é a autodeclaração do
 * convidado, e a tela precisa dizer isso com essas letras.
 */
export async function contribuicoesDoSite(siteId: string, limite = 200) {
  "use cache";
  cacheTag(`gift-contributions:${siteId}`);
  cacheLife("minutes");

  return db
    .select({
      id: giftContributions.id,
      giftName: giftContributions.giftName,
      guestName: giftContributions.guestName,
      createdAt: giftContributions.createdAt,
    })
    .from(giftContributions)
    .innerJoin(gifts, eq(giftContributions.giftId, gifts.id))
    .where(eq(gifts.siteId, siteId))
    .orderBy(desc(giftContributions.createdAt))
    .limit(limite);
}

export async function listContributionsParaAdmin(limite = 200) {
  return db
    .select({
      id: giftContributions.id,
      giftName: giftContributions.giftName,
      guestName: giftContributions.guestName,
      createdAt: giftContributions.createdAt,
      /* `null` = cota de valor livre, em que o convidado escolheu quanto dar.
         A Enlace não observa o Pix, então esse valor não existe em lugar
         nenhum — e é por isso que a coluna mostra um traço em vez de um
         número estimado. */
      priceCents: gifts.priceCents,
      siteSlug: sites.slug,
      coupleNames: siteContent.coupleNames,
    })
    .from(giftContributions)
    .innerJoin(gifts, eq(giftContributions.giftId, gifts.id))
    .innerJoin(sites, eq(gifts.siteId, sites.id))
    .leftJoin(siteContent, eq(siteContent.siteId, sites.id))
    .orderBy(desc(giftContributions.createdAt))
    .limit(limite);
}
