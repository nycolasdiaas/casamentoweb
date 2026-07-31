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

/**
 * Move uma seção uma posição para cima ou para baixo.
 *
 * Reescreve a coluna `position` da lista inteira em vez de trocar só o par:
 * as posições semeadas podem ter buracos ou empates, e nesse caso uma troca
 * simples não move nada. Renumerar de 0..n-1 deixa a ordem sempre coerente.
 *
 * `cover` e `footer` são âncoras — a capa abre o site e o rodapé fecha —
 * então nem se movem nem servem de destino.
 */
export async function moveSection(
  siteId: string,
  sectionKey: string,
  direcao: "up" | "down"
): Promise<boolean> {
  if (!isSectionKey(sectionKey) || !podeDesligar(sectionKey)) return false;

  const atuais = await listSiteSections(siteId);
  const moveis = atuais.filter(
    (s) => isSectionKey(s.sectionKey) && podeDesligar(s.sectionKey as SectionKey)
  );

  const de = moveis.findIndex((s) => s.sectionKey === sectionKey);
  if (de < 0) return false;
  const para = direcao === "up" ? de - 1 : de + 1;
  if (para < 0 || para >= moveis.length) return false; // já está na ponta

  const reordenado = [...moveis];
  [reordenado[de], reordenado[para]] = [reordenado[para], reordenado[de]];

  // Mantém as âncoras onde estão e renumera o resto na ordem nova.
  const posicoesMoveis = moveis
    .map((s) => atuais.findIndex((a) => a.sectionKey === s.sectionKey))
    .sort((a, b) => a - b);

  const final = [...atuais];
  reordenado.forEach((secao, i) => {
    final[posicoesMoveis[i]] = secao;
  });

  await db.transaction(async (tx) => {
    for (const [i, secao] of final.entries()) {
      await tx
        .update(siteSections)
        .set({ position: i })
        .where(
          and(
            eq(siteSections.siteId, siteId),
            eq(siteSections.sectionKey, secao.sectionKey)
          )
        );
    }
  });

  return true;
}
