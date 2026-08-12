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

export default async function OrdersListPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/conta/entrar");

  const orders = await listOrdersByUserId(userId);

  return (
    <AccountShell active="pedidos">
      {/* UM filho só: o ritmo é declarado aqui, não pelo gap da casca. */}
      <div className="flex flex-col">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-3">
            <span className="meta text-(--c-ink-2)">Pedidos</span>
            <h1 className="t-display text-2xl md:text-[30px] leading-[1.15] text-(--c-ink)">
              Meus pedidos
            </h1>
            <p className="text-base leading-relaxed text-(--c-ink-2) max-w-[52ch]">
              Cada pedido de vocês e em que etapa está.
            </p>
          </div>
          <Link href="/conta/pedido/novo" className="btn btn-ink btn-sm">
            Novo pedido
          </Link>
        </header>

        <div className="mt-16">
          {orders.length === 0 ? (
            <div className="surface-raised rounded-[3px] p-6 lg:p-8 flex flex-col items-start gap-4">
              <span className="meta text-(--c-mark)">Nenhum pedido ainda</span>
              <p className="t-display text-[26px] leading-tight text-(--c-ink)">
                Vamos montar o primeiro?
              </p>
              <div className="pt-2">
                <Link href="/conta/pedido/novo" className="btn btn-ink">
                  Montar meu pedido
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Cabeçalho de coluna: é o que transforma uma pilha de cards
                  numa LISTA. Some no celular, onde cada linha vira bloco. */}
              <div className="hidden lg:grid grid-cols-12 gap-4 px-4 pb-2 border-b border-(--c-rule)">
                <span className="meta text-(--c-ink-2) col-span-4">Etapa</span>
                <span className="meta text-(--c-ink-2) col-span-3">
                  Pacote e casal
                </span>
                <span className="meta text-(--c-ink-2) col-span-2">Registro</span>
                <span className="col-span-3" />
              </div>

              <ul className="surface-flat rounded-[3px] border-t-0 lg:border-t-0">
                {orders.map((order) => {
                  const status = order.status as OrderStatus;
                  const meta = STATUS_META[status];
                  const isDraft = status === "draft";
                  return (
                    <li
                      key={order.id}
                      className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 lg:items-center px-4 py-4 border-b border-(--c-rule) last:border-b-0 transition-colors hover:bg-(--c-sunken)"
                    >
                      <div className="lg:col-span-4 min-w-0">
                        {/* Sem o emoji do STATUS_META: o rótulo carrega o
                            significado sozinho. */}
                        <span className="t-display text-[19px] leading-snug text-(--c-ink)">
                          {meta.short}
                        </span>
                      </div>

                      <div className="lg:col-span-3 min-w-0">
                        <span className="text-[13px] text-(--c-ink-2) truncate block">
                          {getPackage(order.packageTier)?.name ??
                            order.packageTier}
                          {order.coupleNames ? ` · ${order.coupleNames}` : ""}
                        </span>
                      </div>

                      <div className="hidden lg:block lg:col-span-2 min-w-0">
                        <span className="t-data text-[12.5px] text-(--c-ink-2)">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                      </div>

                      <div className="lg:col-span-3 flex items-center gap-4 lg:justify-end">
                        {canCancelOrder(status) && (
                          <CancelOrderButton orderId={order.id} />
                        )}
                        <Link
                          href={
                            isDraft
                              ? `/conta/pedido/${order.id}`
                              : `/conta/pedidos/${order.id}`
                          }
                          className="btn btn-quiet btn-sm"
                        >
                          {isDraft ? "Continuar" : "Acompanhar"}
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </div>
    </AccountShell>
  );
}
