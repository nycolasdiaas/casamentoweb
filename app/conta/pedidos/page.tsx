import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getSessionUserId } from "@/lib/auth/userSession";
import { getUserById } from "@/lib/repositories/users";
import {
  getOrderByUserId,
  setOrderPayment,
  markOrderPaid,
} from "@/lib/repositories/orders";
import { getChargeStatus } from "@/lib/payments/abacatepay";
import { signoutAction } from "@/app/actions/account-actions";
import OrderStatusTracker, {
  type TrackerOrder,
} from "@/components/account/OrderStatusTracker";
import type { OrderStatus } from "@/lib/orderStatus";
import type { PackageTier } from "@/lib/packages";
import { SITE_NAME } from "@/lib/site";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: `Meus pedidos | ${SITE_NAME}`,
};

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/conta/entrar");

  const user = await getUserById(userId);
  if (!user) redirect("/conta/entrar");

  const order = await getOrderByUserId(userId);

  // Confirmação de pagamento sem depender de webhook: ao voltar do checkout,
  // consultamos o status real da cobrança e atualizamos o pedido.
  let status = (order?.status ?? "draft") as OrderStatus;
  let paymentStatus = order?.paymentStatus ?? null;
  if (order?.paymentId && order.paymentStatus !== "PAID") {
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
    <div
      className={`${inter.className} flex-1 flex flex-col bg-(--color-paper) text-(--color-olive)`}
    >
      <header className="bg-white/90 backdrop-blur border-b border-(--color-gold)/30">
        <div className="max-w-3xl mx-auto w-full px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            {SITE_NAME}
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/conta"
              className="text-xs text-(--color-olive)/70 underline underline-offset-4 hover:text-(--color-olive)"
            >
              Meu pedido
            </Link>
            <form action={signoutAction}>
              <button
                type="submit"
                className="text-xs text-(--color-olive)/70 underline underline-offset-4 hover:text-(--color-olive)"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Meus pedidos</h1>
          <p className="text-sm text-(--color-olive)/70 max-w-lg">
            Acompanhem aqui cada etapa do site de vocês, da produção até o site
            no ar.
          </p>
        </div>

        {!order || order.status === "draft" ? (
          <div className="flex flex-col items-start gap-4 rounded-2xl border border-(--color-gold)/40 bg-white p-8">
            <p className="text-sm text-(--color-olive)/75 max-w-md leading-relaxed">
              {order
                ? "Vocês têm um rascunho em aberto. Terminem de montar e enviem o pedido para começarmos a produção."
                : "Vocês ainda não enviaram um pedido. Vamos montar o site de vocês?"}
            </p>
            <Link
              href="/conta"
              className="rounded-full bg-(--color-olive) text-white px-8 py-3 text-sm font-medium transition-transform hover:scale-105"
            >
              {order ? "Continuar meu pedido" : "Montar meu pedido"}
            </Link>
          </div>
        ) : (
          <OrderStatusTracker
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
        )}
      </main>
    </div>
  );
}
