import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getSessionUserId } from "@/lib/auth/userSession";
import { listOrdersByUserId } from "@/lib/repositories/orders";
import AccountShell from "@/components/account/AccountShell";
import CancelOrderButton from "@/components/account/CancelOrderButton";
import {
  STATUS_META,
  canCancelOrder,
  type OrderStatus,
} from "@/lib/orderStatus";
import { getPackage } from "@/lib/packages";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Meus pedidos | ${SITE_NAME}`,
};

export const dynamic = "force-dynamic";

export default async function OrdersListPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/conta/entrar");

  const orders = await listOrdersByUserId(userId);

  return (
    <AccountShell active="pedidos">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Meus pedidos</h1>
          <p className="text-sm text-(--color-olive)/70 max-w-md">
            Cada pedido de vocês e em que etapa está.
          </p>
        </div>
        <Link
          href="/conta/pedido/novo"
          className="rounded-full bg-(--color-olive) text-white px-5 py-2.5 text-sm font-medium transition-transform hover:scale-105"
        >
          + Novo pedido
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-2xl border border-(--color-gold)/40 bg-white p-8">
          <p className="text-sm text-(--color-olive)/75 max-w-md leading-relaxed">
            Vocês ainda não têm nenhum pedido. Vamos montar o primeiro?
          </p>
          <Link
            href="/conta/pedido/novo"
            className="rounded-full bg-(--color-olive) text-white px-8 py-3 text-sm font-medium transition-transform hover:scale-105"
          >
            Montar meu pedido
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((order) => {
            const status = order.status as OrderStatus;
            const meta = STATUS_META[status];
            const isDraft = status === "draft";
            return (
              <li
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-(--color-gold)/40 bg-white p-5"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-semibold">
                    {meta.icon} {meta.short}
                  </span>
                  <span className="text-xs text-(--color-olive)/60 truncate">
                    {getPackage(order.packageTier)?.name ?? order.packageTier}
                    {order.coupleNames ? ` · ${order.coupleNames}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  {canCancelOrder(status) && (
                    <CancelOrderButton orderId={order.id} />
                  )}
                  {isDraft ? (
                    <Link
                      href={`/conta/pedido/${order.id}`}
                      className="rounded-full border border-(--color-olive)/30 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-(--color-blush)"
                    >
                      Continuar
                    </Link>
                  ) : (
                    <Link
                      href={`/conta/pedidos/${order.id}`}
                      className="rounded-full bg-(--color-olive) text-white px-5 py-2.5 text-sm font-medium transition-transform hover:scale-105"
                    >
                      Acompanhar
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AccountShell>
  );
}
