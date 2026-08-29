import { and, desc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db/client";
import { guestbookMessages } from "@/lib/db/schema";
import { LIMITE_NOME, LIMITE_RECADO } from "@/lib/site/muralLimites";

/**
 * Mural de recados. Escopado por `siteId` como toda consulta pública —
 * recado de um casamento aparecendo no site de outro seria o pior vazamento
 * possível deste produto (§1.2 do SDD).
 */

export function muralTag(siteId: string): string {
  return `mural:${siteId}`;
}

// Os limites moram em `lib/site/muralLimites.ts` — módulo sem servidor, para
// o formulário do convidado poder importá-los sem arrastar este arquivo
// (e o `"use cache"` dele) para o bundle do navegador.
export { LIMITE_NOME, LIMITE_RECADO } from "@/lib/site/muralLimites";

export type Recado = {
  id: string;
  guestName: string;
  message: string;
  hidden: boolean;
  createdAt: Date;
};

/**
 * O que o CONVIDADO vê: só o que não foi escondido.
 *
 * Cacheado com tag própria em vez de entrar no `site-view:<slug>`: o mural é a
 * única parte do site que muda por ação de terceiro, e sem tag separada um
 * recado novo esperaria o cache do site inteiro expirar para aparecer.
 */
export async function listarRecados(siteId: string): Promise<Recado[]> {
  "use cache";
  cacheTag(muralTag(siteId));
  cacheLife("days");

  return db
    .select({
      id: guestbookMessages.id,
      guestName: guestbookMessages.guestName,
      message: guestbookMessages.message,
      hidden: guestbookMessages.hidden,
      createdAt: guestbookMessages.createdAt,
    })
    .from(guestbookMessages)
    .where(
      and(
        eq(guestbookMessages.siteId, siteId),
        eq(guestbookMessages.hidden, false)
      )
    )
    .orderBy(desc(guestbookMessages.createdAt));
}

/**
 * O que o CASAL vê: tudo, inclusive o que já escondeu — senão esconder por
 * engano seria irreversível pela interface.
 *
 * Sem cache, como o resto do lado de quem edita.
 */
export async function listarRecadosParaOCasal(
  siteId: string
): Promise<Recado[]> {
  return db
    .select({
      id: guestbookMessages.id,
      guestName: guestbookMessages.guestName,
      message: guestbookMessages.message,
      hidden: guestbookMessages.hidden,
      createdAt: guestbookMessages.createdAt,
    })
    .from(guestbookMessages)
    .where(eq(guestbookMessages.siteId, siteId))
    .orderBy(desc(guestbookMessages.createdAt));
}

export async function contarRecados(siteId: string): Promise<number> {
  const linhas = await db
    .select({ id: guestbookMessages.id })
    .from(guestbookMessages)
    .where(eq(guestbookMessages.siteId, siteId));
  return linhas.length;
}

export async function criarRecado(
  siteId: string,
  entrada: { guestName: string; message: string }
): Promise<Recado | null> {
  const guestName = entrada.guestName.trim().slice(0, LIMITE_NOME);
  const message = entrada.message.trim().slice(0, LIMITE_RECADO);
  if (!guestName || !message) return null;

  const [criado] = await db
    .insert(guestbookMessages)
    .values({ siteId, guestName, message })
    .returning();
  return criado ?? null;
}

/** Esconde ou traz de volta. Nunca apaga — ver o comentário no schema. */
export async function esconderRecado(
  siteId: string,
  id: string,
  hidden: boolean
): Promise<boolean> {
  const linhas = await db
    .update(guestbookMessages)
    .set({ hidden })
    .where(
      and(eq(guestbookMessages.id, id), eq(guestbookMessages.siteId, siteId))
    )
    .returning({ id: guestbookMessages.id });
  return linhas.length > 0;
}
