import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  setOrderPayment,
  markOrderPaid,
} from "@/lib/repositories/orders";
import { getChargeStatus } from "@/lib/payments/abacatepay";
import CancelOrderButton from "@/components/account/CancelOrderButton";
import OrderStatusTracker, {
  type TrackerOrder,
} from "@/components/account/OrderStatusTracker";
import LivePreview from "@/components/account/LivePreview";
import { carregarGerenciamento } from "@/lib/site/manageData";
import { canCancelOrder, type OrderStatus } from "@/lib/orderStatus";
import type { PackageTier } from "@/lib/packages";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Nosso site | ${SITE_NAME}`,
};

/**
 * Início do painel: onde o pedido está, a prévia ao vivo, e nada mais.
 *
 * A confirmação de pagamento mora AQUI e não no layout de propósito: ela
 * consulta a API do AbacatePay e tem efeito colateral. No layout, rodaria a
 * cada troca de aba — seis chamadas para navegar seis telas.
 */
export default async function GerenciarInicioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ publicacao?: string }>;
}) {
  const { id } = await params;
  const { order, site } = await carregarGerenciamento(id);

  // Confirmação sem depender de webhook: ao voltar do checkout, consultamos o
  // status real da cobrança e atualizamos o pedido.
  let status = order.status as OrderStatus;
  let paymentStatus = order.paymentStatus ?? null;
  if (order.paymentId && order.paymentStatus !== "PAID") {
    const remote = await getChargeStatus(order.paymentId);
    if (remote && remote !== order.paymentStatus) {
      if (remote === "PAID") {
        const updated = await markOrderPaid(order.id);
        status = (updated?.status ?? status) as OrderStatus;
        paymentStatus = "PAID";
      } else {
        await setOrderPayment(order.id, {
          paymentId: order.paymentId,
          paymentUrl: order.paymentUrl,
          paymentStatus: remote,
        });
        paymentStatus = remote;
      }
    }
  }

  // Rede de segurança para quem pagou e voltou por fora do checkout. Publicar
  // exige derrubar cache, e isso não pode acontecer durante o render — então
  // manda para a rota que sabe fazer isso e volta. `publicacao=erro` corta o
  // laço se ela não conseguiu. Ver AGENTS.md.
  const { publicacao } = await searchParams;
  const publicacaoFalhou = publicacao === "erro";
  if (
    paymentStatus === "PAID" &&
    site !== null &&
    site.status !== "published" &&
    site.status !== "archived" &&
    !publicacaoFalhou
  ) {
    redirect(`/api/pagamento/confirmar?pedido=${order.id}`);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight">O site de vocês</h1>
        <p className="text-sm text-(--color-olive)/70">
          Cada etapa, da produção até o site no ar.
        </p>
      </div>

      <OrderStatusTracker
        orderId={order.id}
        order={
          {
            status,
            packageTier: order.packageTier as PackageTier,
            coupleNames: order.coupleNames,
            previewUrl: order.previewUrl,
            siteUrl: order.siteUrl,
            adminMessage: order.adminMessage,
            priceCents: order.priceCents,
            paymentStatus,
          } satisfies TrackerOrder
        }
      />

      {publicacaoFalhou && (
        <p
          role="alert"
          className="rounded-xl border border-(--color-gold)/50 bg-(--color-blush) px-4 py-3 text-sm leading-relaxed text-(--color-olive)"
        >
          Recebemos o pagamento de vocês, mas não conseguimos colocar o site no
          ar automaticamente. Já estamos vendo isso — se preferir, chame a gente
          no WhatsApp que resolvemos na hora.
        </p>
      )}

      {site !== null && site.status !== "archived" && (
        <LivePreview
          src={`/preview/${site.previewToken}`}
          descricao="É o site de verdade, com o conteúdo de vocês. Depois de salvar alguma mudança, clique em atualizar."
          fullBleed={false}
        />
      )}

      {canCancelOrder(status) && (
        <div className="flex flex-col gap-1 border-t border-(--color-gold)/30 pt-5">
          <CancelOrderButton orderId={order.id} label="Cancelar este pedido" />
          <p className="text-xs text-(--color-muted)">
            Dá para cancelar enquanto o pedido ainda não entrou em produção.
          </p>
        </div>
      )}
    </div>
  );
}
