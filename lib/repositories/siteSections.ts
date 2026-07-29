import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { siteSections } from "@/lib/db/schema";
import { isSectionKey, type SectionKey } from "@/lib/templates/contract";

/**
 * Quais seções o site mostra. O provisionamento semeia a lista conforme o
 * pacote (`lib/site/provision.ts`); aqui o casal liga e desliga.
 *
 * Sem cache: é o lado de quem edita. A leitura do convidado passa por
 * `getSiteViewBySlug`, que já traz as seções na mesma consulta.
 */

/** Estruturais: sem elas o site não é um site. Não entram no seletor. */
export const SECOES_FIXAS: SectionKey[] = ["cover", "footer"];

export function podeDesligar(key: SectionKey): boolean {
  return !SECOES_FIXAS.includes(key);
}

export async function listSiteSections(siteId: string) {
  return db
    .select()
    .from(siteSections)
    .where(eq(siteSections.siteId, siteId))
    .orderBy(asc(siteSections.position));
}

/**
 * Liga ou desliga uma seção. Só atualiza linha existente: criar seção que o
 * provisionamento não semeou entregaria ao casal uma seção fora do pacote.
 */
export async function setSectionEnabled(
  siteId: string,
  sectionKey: string,
  enabled: boolean
): Promise<boolean> {
  if (!isSectionKey(sectionKey)) return false;
  if (!podeDesligar(sectionKey)) return false;

  const linhas = await db
    .update(siteSections)
    .set({ enabled })
    .where(
      and(
        eq(siteSections.siteId, siteId),
        eq(siteSections.sectionKey, sectionKey)
      )
    )
    .returning({ sectionKey: siteSections.sectionKey });

  return linhas.length > 0;
}
