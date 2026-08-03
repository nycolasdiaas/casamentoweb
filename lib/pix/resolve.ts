import { eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db/client";
import { siteContent } from "@/lib/db/schema";
import type { PixKeyType } from "@/lib/pix/key";

// O Pix de UM casal, resolvido a partir do tenant.
//
// Este módulo existe por causa de um defeito específico: até a migração 0010,
// `lib/pix.ts` tinha uma chave pessoal chumbada e todo molde a lia direto. Um
// casal qualquer com lista de presentes ligada mostrava ao convidado o QR de
// OUTRA pessoa — o convidado presenteava e o dinheiro ia para a conta errada.
//
// A regra que substitui aquilo: **sem Pix próprio, sem forma de pagamento.**
// `null` é resposta legítima e o site sabe lidar com ela. Nenhum caminho aqui
// devolve chave de fallback, de exemplo ou de outro site — não existe valor
// padrão seguro para "para onde vai o dinheiro".

export type SitePix = {
  chave: string;
  tipo: PixKeyType | null;
  recebedor: string;
  cidade: string;
  /** só para o convidado reconhecer o destino; não entra no BR Code */
  instituicao: string | null;
};

/**
 * Pix do site, ou `null` quando o casal ainda não configurou.
 *
 * Tag PRÓPRIA (`site-pix:<siteId>`) em vez das tags por slug que o resto do
 * conteúdo usa: aqui só existe o `siteId` — a seção de presentes recebe o
 * tenant, não o slug — e inventar uma consulta a mais só para descobrir o slug
 * e reusar a tag seria pagar ida ao banco por nada.
 *
 * `saveSiteContentAction` derruba esta tag ao salvar, então trocar a chave
 * aparece na hora e não daqui a dias. Isso importa mais aqui que no resto do
 * conteúdo: chave Pix desatualizada manda dinheiro para o lugar errado.
 */
export function sitePixTag(siteId: string): string {
  return `site-pix:${siteId}`;
}

export async function getSitePix(siteId: string): Promise<SitePix | null> {
  "use cache";
  cacheTag(sitePixTag(siteId));
  cacheLife("days");

  const [row] = await db
    .select({
      chave: siteContent.pixKey,
      tipo: siteContent.pixKeyType,
      recebedor: siteContent.pixRecipient,
      cidade: siteContent.pixCity,
      instituicao: siteContent.pixInstitution,
      coupleNames: siteContent.coupleNames,
    })
    .from(siteContent)
    .where(eq(siteContent.siteId, siteId));

  if (!row?.chave) return null;

  return {
    chave: row.chave,
    tipo: (row.tipo as PixKeyType | null) ?? null,
    // Recebedor e cidade têm padrão porque o BR Code os exige (campos 59 e 60)
    // e recusar o Pix inteiro por falta deles seria pior: a chave, que é o que
    // determina PARA ONDE vai o dinheiro, está certa. O nome do casal é o
    // substituto honesto — é quem o convidado espera ver na confirmação.
    recebedor: row.recebedor?.trim() || row.coupleNames?.trim() || "Recebedor",
    cidade: row.cidade?.trim() || "Brasil",
    instituicao: row.instituicao?.trim() || null,
  };
}
