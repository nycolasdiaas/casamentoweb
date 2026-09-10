import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { siteContent, sites } from "@/lib/db/schema";
import { partesNoFuso } from "@/lib/site/contentFields";

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

/**
 * A data do casamento de vários pedidos de uma vez, já no fuso de cada site.
 *
 * ── Por que existe ─────────────────────────────────────────────────────────
 *
 * A data mora em dois lugares: `orders.wedding_date` guarda o que o casal
 * respondeu no questionário, e `site_content.wedding_date` é o que ele edita
 * no painel — e é o que o site do convidado mostra. Quem lê só a primeira vê
 * a resposta velha para sempre.
 *
 * Era o que acontecia na lista "Meus pedidos": o casal mudava a data pela aba
 * Conteúdo e a coluna "Faltam" continuava vazia, como se o casamento não
 * tivesse data. Ao lado, a tela do pedido mostrava a data certa.
 *
 * Devolve um mapa `orderId → "yyyy-mm-dd"`. Pedido sem site, ou site sem data,
 * simplesmente não aparece no mapa — quem chama cai no valor do pedido.
 */
export async function datasEfetivasPorPedido(
  orderIds: string[]
): Promise<Map<string, string>> {
  const mapa = new Map<string, string>();
  if (orderIds.length === 0) return mapa;

  const linhas = await db
    .select({
      orderId: sites.orderId,
      weddingDate: siteContent.weddingDate,
      timezone: siteContent.timezone,
    })
    .from(siteContent)
    .innerJoin(sites, eq(sites.id, siteContent.siteId))
    .where(inArray(sites.orderId, orderIds));

  for (const linha of linhas) {
    if (!linha.orderId || !linha.weddingDate) continue;
    mapa.set(
      linha.orderId,
      partesNoFuso(linha.weddingDate, linha.timezone || "America/Fortaleza").dia
    );
  }

  return mapa;
}
