import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { sites, orders } from "@/lib/db/schema";

// Publicação: o site sai da prévia e vai ao ar.
//
// Era o último passo manual do funil. O pagamento era confirmado, o pedido
// virava "paid" — e nada movia o site de `preview` para `published`, então
// /s/<slug> continuava devolvendo 404 até alguém mexer à mão.
//
// Esta função só escreve no banco. A invalidação de cache fica com quem
// chama, porque depende do contexto: `updateTag` só existe em Server Action,
// `revalidateTag` em Route Handler — e nenhum dos dois pode ser chamado
// durante o render de uma página. Daí `publishedSiteTags` abaixo.
//
// Ver docs/sdd-geracao-automatica.md §7.2.

export type PublishResult =
  | { ok: true; slug: string; siteUrl: string; alreadyPublished: boolean }
  | { ok: false; reason: string };

/**
 * Tags que precisam cair quando um site é publicado.
 *
 * `published-site-slugs` é a menos óbvia e a mais fácil de esquecer: é ela
 * que alimenta o generateStaticParams de /s/[slug]. Sem invalidar, o site
 * novo fica de fora da lista de rotas conhecidas.
 */
export function publishedSiteTags(slug: string): string[] {
  return [`site:${slug}`, `site-view:${slug}`, "published-site-slugs"];
}

export async function publishSiteForOrder(
  orderId: string,
  options: {
    /** Base absoluta para montar o link do site. Sem ela, siteUrl fica como está. */
    baseUrl?: string | null;
    /**
     * Exigir pagamento confirmado. `true` no caminho do pagamento; `false`
     * quando um admin publica de propósito (cortesia, acerto por fora).
     */
    requirePaid?: boolean;
  } = {}
): Promise<PublishResult> {
  const { baseUrl = null, requirePaid = true } = options;

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) return { ok: false, reason: "Pedido não encontrado." };

  if (requirePaid && order.paymentStatus !== "PAID") {
    return { ok: false, reason: "Pagamento não confirmado." };
  }

  const [site] = await db.select().from(sites).where(eq(sites.orderId, orderId));
  if (!site) {
    return { ok: false, reason: "Este pedido não tem site provisionado." };
  }
  // Arquivar é decisão manual de tirar do ar. Publicar por cima desfaria essa
  // decisão sem ninguém pedir.
  if (site.status === "archived") {
    return { ok: false, reason: "Site arquivado — publique pelo painel." };
  }

  const alreadyPublished = site.status === "published";
  // Um siteUrl já preenchido NUNCA é sobrescrito: pode ser o domínio próprio
  // do casal (promessa do pacote "para sempre"), posto à mão pelo admin.
  // Publicar só preenche o que está vazio.
  const siteUrl =
    order.siteUrl ?? (baseUrl ? `${baseUrl}/s/${site.slug}` : null);
  const agora = new Date();

  // Idempotente: chamar de novo (webhook reenviado, casal recarregando a
  // tela) não muda nada e não mexe na data da primeira publicação.
  await db.transaction(async (tx) => {
    if (!alreadyPublished) {
      await tx
        .update(sites)
        .set({
          status: "published",
          // publishedAt guarda a PRIMEIRA vez que foi ao ar.
          ...(site.publishedAt ? {} : { publishedAt: agora }),
          updatedAt: agora,
        })
        .where(eq(sites.id, site.id));
    }

    if (order.status !== "published" || order.siteUrl !== siteUrl) {
      await tx
        .update(orders)
        .set({
          status: "published",
          // Sem isto o casal vê "site no ar" sem link para abrir: a tela de
          // acompanhamento só mostra o botão quando siteUrl existe.
          siteUrl: siteUrl ?? null,
          updatedAt: agora,
        })
        .where(eq(orders.id, orderId));
    }
  });

  return {
    ok: true,
    slug: site.slug,
    siteUrl: siteUrl ?? `/s/${site.slug}`,
    alreadyPublished,
  };
}
