import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { sites } from "@/lib/db/schema";
import { dataPorExtenso, estaExpirado } from "./expiracao";

// Tirar o site do ar e colocar de volta, pelo próprio casal.
//
// `lib/site/publish.ts` cuida da publicação AUTOMÁTICA (pagamento confirmado)
// e recusa republicar site arquivado de propósito: arquivar é decisão humana,
// e um webhook atrasado não pode desfazê-la. Este arquivo é a outra ponta —
// a decisão humana em si, feita pelo dono do site.
//
// Por isso a volta do arquivado mora aqui e não lá: quem desarquiva é quem
// arquivou, não um evento de pagamento.
//
// ── A expiração quebrou a simetria ─────────────────────────────────────────
//
// A spec `site-publico/008` trouxe o PRIMEIRO arquivamento que não é humano:
// o site de Convite e Site do Casamento sai do ar sozinho, doze meses depois
// da festa. E as duas voltas são opostas.
//
// Quem tirou o site do ar por vontade própria pode botar de volta de graça —
// ele pagou, e esconder e mostrar é dele. Quem foi arquivado pela expiração
// NÃO pode: desarquivar de graça devolveria exatamente o que a expiração
// vende, e o prazo viraria decoração.
//
// É a razão de `unarchiveSite` receber `expiresAt`.

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
  expiresAt?: Date | null;
}): Promise<VisibilityResult> {
  if (site.status === "published") {
    return { ok: true, status: "published" };
  }
  if (site.status !== "archived") {
    return { ok: false, error: "Este site não está arquivado." };
  }

  /* FR-005: o site que venceu não volta por aqui.
  
     Texto revisado pelo agente `regras-de-negocio`. Três decisões nele:
  
     "saiu do ar", nunca "expirou" — expirar é palavra de sistema, e o par que
     o produto já usa com o casal é "colocar no ar" / "sair do ar".
  
     "Nada foi apagado" no PASSADO, descrevendo o que aconteceu. "Vamos
     guardar" seria promessa futura sem prazo, e prazo de guarda é decisão do
     dono que ainda não foi tomada.
  
     E **o preço escrito**: "fale com a gente" sem valor vira "consulte
     valores", que é o que a promessa "a página é a proposta" proíbe. */
  if (estaExpirado(site.expiresAt ?? null)) {
    return {
      ok: false,
      error:
        `Este site saiu do ar em ${dataPorExtenso(site.expiresAt!)}, quando ` +
        "terminaram os doze meses do pacote. Nada foi apagado. Para colocá-lo " +
        "de volta no ar, sem prazo, o Para Sempre custa R$ 99,90 — fale com a " +
        "gente.",
    };
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
