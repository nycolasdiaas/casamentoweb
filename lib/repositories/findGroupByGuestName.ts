import { db } from "@/lib/db/client";
import { groups, guests } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";

/**
 * Acha o link de RSVP de um convidado pelo NOME COMPLETO, dentro de um site.
 *
 * ── Por que nome completo e exato, e não busca ──────────────────────────────
 *
 * Uma busca por pedaço de nome devolvendo uma lista transformaria esta página
 * na lista de convidados do casamento: qualquer pessoa com o endereço do site
 * digitaria "a" e leria quem foi convidado — e quem não foi. O convite é
 * público, a lista não é.
 *
 * Com igualdade exata, quem já sabe o nome inteiro descobre apenas o link
 * daquela família — que é exatamente o que essa pessoa receberia no WhatsApp.
 * Não é uma trava criptográfica; é a diferença entre "consultar o próprio
 * convite" e "baixar a lista".
 *
 * A comparação ignora caixa e espaço sobrando, porque o convidado digita
 * "maria souza" e o casal cadastrou "Maria Souza". Acento NÃO é ignorado: o
 * Postgres precisaria de `unaccent`, que é extensão, e errar para o lado de
 * não achar é melhor que instalar extensão em banco de produção com
 * casamento no ar.
 *
 * Escopado por `siteId` — dois casamentos podem ter uma Maria Souza cada, e
 * a de um não pode achar o convite da outra.
 */
export async function findGroupByGuestName(
  siteId: string,
  nome: string
): Promise<{ slug: string } | null> {
  const alvo = nome.trim().replace(/\s+/g, " ");
  // Nome muito curto casaria com gente demais e vira sonda. Duas letras não
  // é nome completo de ninguém.
  if (alvo.length < 3) return null;

  const linha = await db
    .select({ slug: groups.slug })
    .from(guests)
    .innerJoin(groups, eq(guests.groupId, groups.id))
    .where(
      and(
        eq(groups.siteId, siteId),
        sql`lower(regexp_replace(btrim(${guests.name}), '\s+', ' ', 'g')) = lower(${alvo})`
      )
    )
    .limit(1);

  return linha[0] ?? null;
}
