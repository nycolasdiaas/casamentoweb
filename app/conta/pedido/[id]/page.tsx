import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSessionUserId } from "@/lib/auth/userSession";
import { getOrderById } from "@/lib/repositories/orders";
import AccountShell from "@/components/account/AccountShell";
import OrderForm, { type OrderData } from "@/components/account/OrderForm";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Meu pedido | ${SITE_NAME}`,
};

export const dynamic = "force-dynamic";

export default async function EditOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/conta/entrar");

  const { id } = await params;
  const order = await getOrderById(id);
  if (!order || order.userId !== userId) redirect("/conta/pedidos");
  // Pedido já enviado não é editável — vai para o acompanhamento.
  if (order.status !== "draft") redirect(`/conta/pedidos/${order.id}`);

  return (
    <AccountShell active="inicio">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Continuar meu pedido
        </h1>
        <p className="text-sm text-(--color-olive)/70 max-w-lg">
          Terminem de montar e enviem quando estiver do jeito de vocês. Podem
          salvar como rascunho a qualquer momento.
        </p>
      </div>

      <OrderForm order={order as OrderData} orderId={order.id} />
    </AccountShell>
  );
}
