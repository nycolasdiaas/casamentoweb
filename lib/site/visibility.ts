import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { sites } from "@/lib/db/schema";

// Tirar o site do ar e colocar de volta, pelo próprio casal.
//
// `lib/site/publish.ts` cuida da publicação AUTOMÁTICA (pagamento confirmado)
// e recusa republicar site arquivado de propósito: arquivar é decisão humana,
// e um webhook atrasado não pode desfazê-la. Este arquivo é a outra ponta —
// a decisão humana em si, feita pelo dono do site.
//
// Por isso a volta do arquivado mora aqui e não lá: quem desarquiva é quem
// arquivou, não um evento de pagamento.

export type VisibilityResult =
  | { ok: true; status: "published" | "archived" }
  | { ok: false; error: string };

/**
 * Tira o site do ar. O endereço passa a responder 404 para o convidado, mas
 * nada é apagado: conteúdo, fotos e confirmações continuam no banco, e
 * `publishedAt` guarda a primeira publicação.
 */
export async function archiveSite(site: {
  id: string;
  status: string;
}): Promise<VisibilityResult> {
  if (site.status === "archived") {
    return { ok: true, status: "archived" };
  }
  if (site.status !== "published") {
    return { ok: false, error: "Este site ainda não está no ar." };
  }

  await db
    .update(sites)
    .set({ status: "archived", updatedAt: new Date() })
    .where(eq(sites.id, site.id));

  return { ok: true, status: "archived" };
}

/**
 * Coloca de volta no ar. Só vale para site que JÁ foi publicado alguma vez —
 * a primeira publicação continua sendo do fluxo de pagamento, senão o casal
 * publicaria sem pagar.
 */
export async function unarchiveSite(site: {
  id: string;
  status: string;
  publishedAt: Date | null;
}): Promise<VisibilityResult> {
  if (site.status === "published") {
    return { ok: true, status: "published" };
  }
  if (site.status !== "archived") {
    return { ok: false, error: "Este site não está arquivado." };
  }
  if (!site.publishedAt) {
    return {
      ok: false,
      error:
        "Este site ainda não foi publicado. A primeira publicação acontece com a confirmação do pagamento.",
    };
  }

  await db
    .update(sites)
    .set({ status: "published", updatedAt: new Date() })
    .where(eq(sites.id, site.id));

  return { ok: true, status: "published" };
}
