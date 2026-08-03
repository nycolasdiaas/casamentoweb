import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { sites, sitePhotos } from "@/lib/db/schema";
import type { ThemeSpec } from "@/lib/theme/spec";

/**
 * Grava o tema (cores e fontes) escolhido pelo casal.
 *
 * A coluna é jsonb, então quem lê sempre passa por `parseThemeSpec` — e é por
 * isso que a validação acontece ANTES daqui (lib/site/themeInput.ts): gravar
 * um tema inválido faria o site cair silenciosamente no preset do molde, e o
 * casal veria a escolha dele ser ignorada sem saber por quê.
 */
export async function saveSiteTheme(
  siteId: string,
  theme: ThemeSpec
): Promise<void> {
  await db
    .update(sites)
    .set({ theme, updatedAt: new Date() })
    .where(eq(sites.id, siteId));
}

/**
 * Troca o molde do site, junto com o tema já recortado ao catálogo dele.
 *
 * Os dois campos vão na MESMA escrita de propósito: molde e tema são um par.
 * Gravar o molde novo e o tema antigo deixaria o site apontando para fontes
 * que o molde não carrega — meio segundo de inconsistência é meio segundo em
 * que um convidado pode abrir o link e ver o site sem tipografia.
 */
export async function setSiteTemplate(
  siteId: string,
  templateId: string,
  theme: ThemeSpec
): Promise<void> {
  await db
    .update(sites)
    .set({ templateId, theme, updatedAt: new Date() })
    .where(eq(sites.id, siteId));
}

/**
 * Move uma foto dentro do próprio slot (a ordem do carrossel).
 *
 * Renumera o slot inteiro de 0..n-1 em transação, mesmo motivo das seções: as
 * posições vêm de `max(position)+1` a cada upload, e apagar uma foto no meio
 * deixa buraco. Trocar só o par não moveria nada quando houvesse empate.
 *
 * Move só DENTRO do slot: a capa não vira galeria por acidente.
 */
export async function moveSitePhoto(
  siteId: string,
  photoId: string,
  direcao: "up" | "down"
): Promise<boolean> {
  const [foto] = await db
    .select({ id: sitePhotos.id, slot: sitePhotos.slot })
    .from(sitePhotos)
    .where(and(eq(sitePhotos.id, photoId), eq(sitePhotos.siteId, siteId)));
  if (!foto) return false;

  const doSlot = await db
    .select({ id: sitePhotos.id })
    .from(sitePhotos)
    .where(and(eq(sitePhotos.siteId, siteId), eq(sitePhotos.slot, foto.slot)))
    .orderBy(asc(sitePhotos.position), asc(sitePhotos.createdAt));

  const de = doSlot.findIndex((f) => f.id === photoId);
  const para = direcao === "up" ? de - 1 : de + 1;
  if (de < 0 || para < 0 || para >= doSlot.length) return false;

  const nova = [...doSlot];
  [nova[de], nova[para]] = [nova[para], nova[de]];

  await db.transaction(async (tx) => {
    for (const [i, f] of nova.entries()) {
      await tx
        .update(sitePhotos)
        .set({ position: i })
        .where(eq(sitePhotos.id, f.id));
    }
  });

  return true;
}

/** Quantas fotos existem em cada slot — para desabilitar as setas nas pontas. */
export async function contarPorSlot(
  siteId: string
): Promise<Record<string, number>> {
  const linhas = await db
    .select({ slot: sitePhotos.slot, total: sql<number>`count(*)::int` })
    .from(sitePhotos)
    .where(eq(sitePhotos.siteId, siteId))
    .groupBy(sitePhotos.slot);
  return Object.fromEntries(linhas.map((l) => [l.slot, l.total]));
}
