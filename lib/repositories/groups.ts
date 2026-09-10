import { and, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db/client";
import { groups, guests, siteContent, sites } from "@/lib/db/schema";
import { generateUniqueSlug } from "@/lib/slug";

async function slugExists(slug: string): Promise<boolean> {
  const existing = await db.query.groups.findFirst({
    where: eq(groups.slug, slug),
  });
  return existing !== undefined;
}

export async function createGroup({
  siteId,
  label,
  guestNames,
  seats,
}: {
  siteId: string;
  label?: string;
  guestNames: string[];
  /**
   * Lugares reservados, quando o casal NÃO escreveu os nomes.
   *
   * Ignorado se `guestNames` vier preenchido: ali os lugares nascem da lista,
   * e deixá-los divergir é como um grupo passa a "ter 3 lugares" com dois
   * nomes dentro.
   *
   * Existe porque "Família Silva, 4 lugares" é o que o casal costuma saber
   * primeiro — os nomes completos de todo mundo vêm depois, se vierem. Sem
   * isto, uma família sem nomes nascia com um lugar só.
   */
  seats?: number;
}) {
  const slug = await generateUniqueSlug(slugExists);

  return db.transaction(async (tx) => {
    const [group] = await tx
      .insert(groups)
      .values({
        slug,
        label,
        siteId,
        seats: guestNames.length > 0 ? guestNames.length : Math.max(1, seats ?? 1),
      })
      .returning();

    // Sem nomes não há linha de convidado — e `insert` com lista vazia é erro.
    const insertedGuests =
      guestNames.length > 0
        ? await tx
            .insert(guests)
            .values(
              guestNames.map((name, index) => ({
                groupId: group.id,
                name,
                position: index,
              }))
            )
            .returning()
        : [];

    return { ...group, guests: insertedGuests };
  });
}

/**
 * Busca GLOBAL por slug, de propósito — não recebe siteId.
 *
 * O slug do grupo é único no banco inteiro, e os links /rsvp/<slug> já estão
 * com os convidados. Exigir o site aqui quebraria esses links. O grupo
 * devolvido carrega `siteId`, então quem chama sabe a que casamento pertence.
 *
 * Ver docs/sdd-geracao-automatica.md §5.2 e §6.2.
 */
export async function getGroupBySlug(slug: string) {
  "use cache";
  cacheTag(`group:${slug}`);
  // Mais curto que a lista de presentes de propósito: confirmação de presença
  // é o dado que mais dói ficar velho. A action chama updateTag ao confirmar,
  // então isto é só rede de segurança.
  cacheLife("hours");

  const group = await db.query.groups.findFirst({
    where: eq(groups.slug, slug),
    with: {
      guests: { orderBy: (guests, { asc }) => [asc(guests.position)] },
    },
  });

  return group ?? null;
}

/**
 * Slugs de grupo para o `generateStaticParams` da rota de RSVP.
 *
 * Com Cache Components, uma rota dinâmica precisa declarar ao menos um param
 * — é isso que autoriza a página a ler `params` fora de <Suspense>, e é o que
 * permite o `notFound()` devolver um 404 de verdade em vez de 200 com o shell
 * já enviado.
 */
export async function listGroupSlugs(): Promise<string[]> {
  "use cache";
  cacheTag("group-slugs");
  cacheLife("hours");

  const rows = await db.select({ slug: groups.slug }).from(groups);
  return rows.map((r) => r.slug);
}

/**
 * Tudo que a tela de confirmação de presença (prancha F4) precisa, numa ida.
 *
 * O grupo sozinho não basta: a tela abre com os nomes do casal e com o prazo
 * de resposta, e os dois moram em `site_content`. Buscar separado seria uma
 * segunda ida ao banco para desenhar um cabeçalho.
 *
 * A busca continua GLOBAL por slug, pela mesma razão de `getGroupBySlug`: os
 * links `/rsvp/<slug>` já estão no WhatsApp de gente real e não carregam o
 * site. Ver §5.2 e §6.2 do SDD.
 *
 * `rsvpDeadline` é `date` (sem hora) — quem compara precisa tratar como o DIA
 * inteiro, não como meia-noite. Ver `prazoVencido` em `lib/site/prazoRsvp.ts`.
 */
export async function getRsvpViewBySlug(slug: string) {
  "use cache";
  cacheTag(`group:${slug}`);
  cacheLife("hours");

  const [linha] = await db
    .select({
      groupId: groups.id,
      slug: groups.slug,
      label: groups.label,
      seats: groups.seats,
      seatsConfirmed: groups.seatsConfirmed,
      attendingNames: groups.attendingNames,
      message: groups.message,
      respondedAt: groups.respondedAt,
      siteId: groups.siteId,
      siteSlug: sites.slug,
      siteStatus: sites.status,
      coupleNames: siteContent.coupleNames,
      weddingDate: siteContent.weddingDate,
      timezone: siteContent.timezone,
      ceremonyVenue: siteContent.ceremonyVenue,
      rsvpDeadline: siteContent.rsvpDeadline,
    })
    .from(groups)
    .leftJoin(sites, eq(sites.id, groups.siteId))
    .leftJoin(siteContent, eq(siteContent.siteId, groups.siteId))
    .where(eq(groups.slug, slug))
    .limit(1);

  return linha ?? null;
}

/**
 * Grava a resposta do grupo — o formulário da prancha F4.
 *
 * `lugares` é quantos vão: `0` significa "respondemos que não vamos", e é
 * diferente de nunca ter respondido (que é `null` na coluna). Por isso o
 * parâmetro é obrigatório e não tem default.
 *
 * NÃO toca em `guests`. As duas representações convivem: `guests` é a lista
 * que o casal escreveu e continua sendo o que o painel e o `/admin` leem;
 * isto é o que o convidado respondeu. Sobrescrever uma com a outra apagaria
 * informação que ninguém pode reconstruir.
 */
export async function responderRsvpDoGrupo(
  groupId: string,
  dados: {
    lugares: number;
    nomes: string | null;
    recado: string | null;
  }
) {
  const [atualizado] = await db
    .update(groups)
    .set({
      seatsConfirmed: dados.lugares,
      attendingNames: dados.nomes,
      message: dados.recado,
      respondedAt: new Date(),
    })
    .where(eq(groups.id, groupId))
    .returning();

  return atualizado ?? null;
}

export async function listGroupsWithGuests(siteId: string) {
  return db.query.groups.findMany({
    where: eq(groups.siteId, siteId),
    with: {
      guests: { orderBy: (guests, { asc }) => [asc(guests.position)] },
    },
    orderBy: (groups, { desc }) => [desc(groups.createdAt)],
  });
}

export async function deleteGroup(siteId: string, groupId: string) {
  await db
    .delete(groups)
    .where(and(eq(groups.id, groupId), eq(groups.siteId, siteId)));
}
