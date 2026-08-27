import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { orders, sites, users } from "@/lib/db/schema";
import { getSiteContent } from "@/lib/repositories/siteContent";
import { listSitePhotosFresh } from "@/lib/repositories/sitePhotos";
import { getPackage } from "@/lib/packages";
import { formatPriceCents } from "@/lib/format";
import {
  isEmailConfigured,
  sendReciboEmail,
  sendSiteNoArEmail,
} from "@/lib/email";

/**
 * Os dois avisos que fecham o funil do lado do casal.
 *
 * ── O buraco que isto tapa ─────────────────────────────────────────────────
 *
 * `publishSiteForOrder` põe o site no ar por três caminhos (SDD §7.2) e
 * nenhum deles avisava ninguém. O casal pagava, o site entrava no ar, e ele só
 * descobria se voltasse ao painel por conta própria. Com o webhook do
 * AbacatePay desligado (`ABACATEPAY_WEBHOOK_SECRET` vazio), esse silêncio era
 * o caminho provável, não a exceção.
 *
 * ── Por que mora fora de `publish.ts` ──────────────────────────────────────
 *
 * `publish.ts` escreve no banco e mais nada — é o que faz `publish.test.ts`
 * poder rodar sem requisição HTTP em volta. Aqui é o trabalho lento (SMTP,
 * fotos, conteúdo), chamado de dentro de um `after()`. Separado, dá para
 * testar o disparo sem simular uma requisição do Next.
 *
 * ── O que NUNCA pode acontecer ─────────────────────────────────────────────
 *
 * Falha de e-mail derrubar publicação. O site no ar é o produto; o aviso é
 * cortesia. Por isso tudo aqui é `try/catch` e o retorno é um relatório, não
 * uma exceção.
 */
export type AvisoDePublicacao = {
  recibo: "enviado" | "sem-pagamento" | "sem-transporte" | "falhou";
  noAr: "enviado" | "sem-transporte" | "falhou";
};

/** Identificador curto e legível do pedido, para o casal citar num e-mail. */
export function numeroDoPedido(id: string): string {
  return id.replace(/-/g, "").slice(0, 6).toUpperCase();
}

export async function avisarPublicacao(
  orderId: string
): Promise<AvisoDePublicacao> {
  /* Sem transporte configurado, nada é tentado — o provisionamento inteiro já
     funciona assim (`account-actions.ts`), e é o que mantém o produto de pé
     numa instalação sem SMTP. */
  if (!isEmailConfigured()) {
    return { recibo: "sem-transporte", noAr: "sem-transporte" };
  }

  const relatorio: AvisoDePublicacao = { recibo: "falhou", noAr: "falhou" };

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) return relatorio;

  const [[site], [dono]] = await Promise.all([
    db.select().from(sites).where(eq(sites.orderId, orderId)),
    db.select().from(users).where(eq(users.id, order.userId)),
  ]);
  if (!site || !dono) return relatorio;

  const [conteudo, fotos] = await Promise.all([
    getSiteContent(site.id),
    listSitePhotosFresh(site.id),
  ]);

  const base = (order.siteUrl ?? "").replace(/\/s\/[^/]+\/?$/, "");
  const siteUrl = order.siteUrl ?? `/s/${site.slug}`;
  const painelUrl = base
    ? `${base}/conta/pedidos/${order.id}`
    : `/conta/pedidos/${order.id}`;

  /* ── 03 · o recibo ──────────────────────────────────────────────────────
     Só com pagamento confirmado. O admin publica por cortesia com
     `requirePaid: false`, e um "Pagamento confirmado" nessa situação seria
     mentira com carimbo. */
  if (order.paymentStatus !== "PAID") {
    relatorio.recibo = "sem-pagamento";
  } else {
    try {
      const pacote = getPackage(order.packageTier);
      await sendReciboEmail(dono.email, {
        numero: numeroDoPedido(order.id),
        pacote: pacote?.name ?? order.packageTier,
        total: formatPriceCents(order.priceCents ?? pacote?.priceCents ?? null),
        /* O momento do pagamento é o melhor valor que o banco tem: `orders`
           não guarda `paid_at`, e `updatedAt` foi escrito por `markOrderPaid`
           na confirmação. Ler ANTES da transação de publicar é o que mantém
           esse valor — depois dela, `updatedAt` já é a hora de publicar.
           Coluna própria seria migração aditiva; está anotada como pendência
           no INDEX das specs, não inventada aqui. */
        pagoEm: order.updatedAt,
        // O fuso é do CONTEÚDO, não do site: é onde o casal escolheu a
        // cidade do casamento.
        timezone: conteudo?.timezone ?? "America/Fortaleza",
        painelUrl,
      });
      relatorio.recibo = "enviado";
    } catch (error) {
      console.error(`[email] recibo do pedido ${orderId}:`, error);
    }
  }

  /* ── 04 · o site está no ar ─────────────────────────────────────────── */
  try {
    const capa = fotos.find((f) => f.slot === "cover");
    await sendSiteNoArEmail(dono.email, {
      nomes: conteudo?.coupleNames?.trim() || dono.name,
      siteUrl,
      /* Sem capa, `null` — o e-mail cai no cartão tipográfico em vez de um
         retângulo quebrado. `/f/<id>` é rota pública de propósito (o bucket é
         que é privado), então o cliente de e-mail consegue buscar. */
      capaUrl: capa && base ? `${base}/f/${capa.id}` : null,
    });
    relatorio.noAr = "enviado";
  } catch (error) {
    console.error(`[email] site no ar do pedido ${orderId}:`, error);
  }

  return relatorio;
}
