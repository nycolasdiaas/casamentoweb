import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getSessionUserId } from "@/lib/auth/userSession";
import {
  getOrderById,
  setOrderPayment,
  markOrderPaid,
} from "@/lib/repositories/orders";
import { getChargeStatus } from "@/lib/payments/abacatepay";
import AccountShell from "@/components/account/AccountShell";
import CancelOrderButton from "@/components/account/CancelOrderButton";
import OrderStatusTracker, {
  type TrackerOrder,
} from "@/components/account/OrderStatusTracker";
import { canCancelOrder, type OrderStatus } from "@/lib/orderStatus";
import type { PackageTier } from "@/lib/packages";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Acompanhar pedido | ${SITE_NAME}`,
};

export default async function OrderTrackerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/conta/entrar");

  const { id } = await params;
  const order = await getOrderById(id);
  if (!order || order.userId !== userId) redirect("/conta/pedidos");
  if (order.status === "draft") redirect(`/conta/pedido/${order.id}`);

  // Confirmação de pagamento sem depender de webhook: ao voltar do checkout,
  // consultamos o status real da cobrança e atualizamos o pedido.
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

  return (
    <AccountShell active="pedidos">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Acompanhar pedido
          </h1>
          <p className="text-sm text-(--color-olive)/70 max-w-md">
            Cada etapa do site de vocês, da produção até o site no ar.
          </p>
        </div>
        <Link
          href="/conta/pedidos"
          className="text-xs text-(--color-olive)/70 underline underline-offset-4 hover:text-(--color-olive)"
        >
          ← Todos os pedidos
        </Link>
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

      {canCancelOrder(status) && (
        <div className="flex flex-col gap-1 border-t border-(--color-gold)/30 pt-4">
          <CancelOrderButton orderId={order.id} label="Cancelar este pedido" />
          <p className="text-xs text-(--color-muted)">
            Dá para cancelar enquanto o pedido ainda não entrou em produção.
          </p>
        </div>
      )}
    </AccountShell>
  );
}
