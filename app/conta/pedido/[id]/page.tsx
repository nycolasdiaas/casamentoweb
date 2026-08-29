import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSessionUserId } from "@/lib/auth/userSession";
import { getOrderById } from "@/lib/repositories/orders";
import AccountShell from "@/components/account/AccountShell";
import OrderWizard, { type OrderData } from "@/components/account/wizard/OrderWizard";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Meu pedido | ${SITE_NAME}`,
};

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
      <div className="flex flex-col gap-3">
        <span className="meta text-(--c-mark)">Rascunho</span>
        <h1 className="t-d2 text-(--c-ink)">Continuar o pedido de vocês</h1>
        <p className="t-corpo text-(--c-ink-2) medida">
          Terminem de montar e enviem quando estiver do jeito de vocês. Dá para
          salvar e sair a qualquer momento.
        </p>
      </div>

      <OrderWizard order={order as OrderData} orderId={order.id} />
    </AccountShell>
  );
}
