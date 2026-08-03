import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { siteContent } from "@/lib/db/schema";

/**
 * Leitura e escrita do conteúdo editável do site.
 *
 * A leitura do caminho quente (o convidado) NÃO passa por aqui — está em
 * [siteView.ts](./siteView.ts), em cache com a tag `site-view:<slug>`. Aqui é
 * o lado do casal: ler para preencher o formulário e gravar o que ele muda.
 * Por isso nada nesta função é cacheado; quem edita precisa ver o próprio
 * dado, não uma versão de minutos atrás.
 */

/** Campos que o casal edita. Nenhum é obrigatório: o site degrada por seção. */
export type EditableContent = {
  coupleNames: string | null;
  partnerA: string | null;
  partnerB: string | null;
  weddingDate: Date | null;
  ceremonyVenue: string | null;
  ceremonyAddress: string | null;
  ceremonyMapUrl: string | null;
  receptionVenue: string | null;
  receptionAddress: string | null;
  story: string | null;
  dressCode: string | null;
  giftMessage: string | null;
  // Pix do casal. `pixKeyType` não vem do formulário: é derivado por
  // `parsePixKey` no momento de salvar, para a leitura não ter que refazer a
  // heurística CPF×celular (que é ambígua) a cada render.
  pixKey: string | null;
  pixKeyType: string | null;
  pixRecipient: string | null;
  pixCity: string | null;
  pixInstitution: string | null;
};

export async function getSiteContent(siteId: string) {
  const [row] = await db
    .select()
    .from(siteContent)
    .where(eq(siteContent.siteId, siteId));
  return row ?? null;
}

/**
 * Grava o conteúdo. Faz upsert porque um site provisionado sempre tem a
 * linha, mas o site legado (o casamento que nasceu antes do fluxo de pedidos)
 * pode não ter — e nesse caso perder a edição em silêncio seria pior.
 */
export async function saveSiteContent(
  siteId: string,
  input: EditableContent
): Promise<void> {
  await db
    .insert(siteContent)
    .values({ siteId, ...input, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: siteContent.siteId,
      set: { ...input, updatedAt: new Date() },
    });
}
