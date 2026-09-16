import { and, eq, isNull, notInArray } from "drizzle-orm";
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
      /* O RÓTULO continua vindo porque o painel do casal lê esta mesma função.
         Ele NÃO pode ir para a tela do convidado: o painel promete "Só vocês
         veem este nome" (UX-008), e `lib/site/rotulo-do-grupo-e-privado.test.ts`
         tranca essa fronteira. */
      label: groups.label,
      seats: groups.seats,
      seatsConfirmed: groups.seatsConfirmed,
      attendingNames: groups.attendingNames,
      message: groups.message,
      respondedAt: groups.respondedAt,
      /* Quando o casal tirou a família da lista. A tela do convidado usa isto
         para avisar em vez de sumir: o link já está no WhatsApp dele, e 404
         seria a plataforma dizendo que o convite nunca existiu. */
      removedAt: groups.removedAt,
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

  if (!linha) return null;

  /* Os NOMES das pessoas convidadas, para a tela saudá-las pelo nome.
   *
   * Uma segunda ida ao banco, e não um `join`: o grupo tem de zero a meia
   * dúzia de convidados, e um join multiplicaria a linha do cabeçalho por
   * cada um deles — a consulta inteira passaria a devolver seis cópias dos
   * nomes do casal, do prazo e do endereço para montar uma saudação.
   *
   * Custa uma ida a mais numa rota cacheada por horas. A alternativa era a
   * saudação neutra ("Vocês vêm?"), que é o que ficou quando o rótulo privado
   * saiu daqui — correto, e mais frio do que o produto merece. */
  const convidados = await db
    .select({ name: guests.name })
    .from(guests)
    .where(eq(guests.groupId, linha.groupId))
    .orderBy(guests.position);

  return { ...linha, nomesDosConvidados: convidados.map((c) => c.name) };
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

/**
 * As famílias que o casal vê — as removidas ficam de fora.
 *
 * `removedAt` não é exclusão: a linha continua no banco com a resposta que o
 * convidado deu, e `/rsvp/<slug>` continua respondendo. Aqui ela só sai da
 * frente de quem está organizando a lista.
 */
export async function listGroupsWithGuests(siteId: string) {
  return db.query.groups.findMany({
    where: and(eq(groups.siteId, siteId), isNull(groups.removedAt)),
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

/**
 * Tira a família da lista do casal — sem apagar nada.
 *
 * Por que não `deleteGroup`: a resposta do convidado é dado de terceiro, e o
 * backup automático NÃO a guarda (`groups_backup` tem id, slug, label e
 * created_at, e nada de `seats_confirmed`, `attending_names` ou `message`).
 * Apagada, ela não volta nem pelo backup. Marcando a saída, a família some da
 * lista, a resposta fica gravada e o link continua respondendo.
 *
 * `isNull(removedAt)` no `where`: remover duas vezes não reescreve a data da
 * primeira — o quando importa para o casal entender a própria lista.
 */
export async function removerFamiliaDaLista(siteId: string, groupId: string) {
  const [linha] = await db
    .update(groups)
    .set({ removedAt: new Date() })
    .where(
      and(
        eq(groups.id, groupId),
        eq(groups.siteId, siteId),
        isNull(groups.removedAt)
      )
    )
    .returning({ id: groups.id, slug: groups.slug });

  return linha ?? null;
}

/**
 * Edita a família: rótulo, lugares e a lista de pessoas.
 *
 * Três coisas que esta função NÃO faz, e cada uma tem dono:
 *
 * 1. **Não toca no slug.** Ele é imutável — os links `/rsvp/<slug>` já estão
 *    no WhatsApp das famílias (AGENTS.md §2, regra 2).
 * 2. **Não toca em `seatsConfirmed`, `attendingNames` nem `message`.** É a
 *    resposta que o convidado deu; o casal edita a lista dele, não a resposta
 *    de terceiro. Se o casal reduzir os lugares para menos do que já foi
 *    confirmado, o painel mostra "3 de 2 vêm" — feio e verdadeiro.
 * 3. **Não apaga-e-recria os convidados.** `guests.rsvp_status` guarda as
 *    confirmações do modelo original, e recriar as linhas zeraria todas para
 *    `pending` por efeito colateral. Renomear é `update` no id existente;
 *    nome novo nasce em linha nova; nome tirado da lista perde a linha dele,
 *    e só essa.
 */
export async function atualizarFamilia({
  siteId,
  groupId,
  label,
  seats,
  pessoas,
}: {
  siteId: string;
  groupId: string;
  label?: string;
  seats: number;
  /** `id` presente = pessoa que já existe (renomeia); sem `id` = pessoa nova. */
  pessoas: { id?: string; nome: string }[];
}) {
  return db.transaction(async (tx) => {
    const [grupo] = await tx
      .update(groups)
      .set({ label: label || null, seats })
      .where(and(eq(groups.id, groupId), eq(groups.siteId, siteId)))
      .returning();

    // Família de outro casamento (ou id inventado): nada foi atualizado.
    if (!grupo) return null;

    const mantidos = pessoas
      .map((p) => p.id)
      .filter((id): id is string => Boolean(id));

    /* Quem saiu da lista sai do banco. É a única perda desta função, e ela é
       do tamanho de uma pessoa — por isso a tela avisa antes. */
    await tx
      .delete(guests)
      .where(
        mantidos.length > 0
          ? and(eq(guests.groupId, groupId), notInArray(guests.id, mantidos))
          : eq(guests.groupId, groupId)
      );

    for (const [posicao, pessoa] of pessoas.entries()) {
      if (pessoa.id) {
        await tx
          .update(guests)
          .set({ name: pessoa.nome, position: posicao })
          .where(and(eq(guests.id, pessoa.id), eq(guests.groupId, groupId)));
      } else {
        await tx
          .insert(guests)
          .values({ groupId, name: pessoa.nome, position: posicao });
      }
    }

    const lista = await tx
      .select()
      .from(guests)
      .where(eq(guests.groupId, groupId))
      .orderBy(guests.position);

    return { ...grupo, guests: lista };
  });
}
