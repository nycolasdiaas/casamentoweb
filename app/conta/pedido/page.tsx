import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSessionUserId } from "@/lib/auth/userSession";
import { getUserById } from "@/lib/repositories/users";
import { getOrderByUserId } from "@/lib/repositories/orders";
import AccountShell from "@/components/account/AccountShell";
import OrderForm, { type OrderData } from "@/components/account/OrderForm";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Meu pedido | ${SITE_NAME}`,
};

export const dynamic = "force-dynamic";

export default async function OrderEditorPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/conta/entrar");

  const user = await getUserById(userId);
  if (!user) redirect("/conta/entrar");

  const order = await getOrderByUserId(userId);

  // Pedido já enviado não é editável aqui — vai para o acompanhamento.
  if (order && order.status !== "draft") redirect("/conta/pedidos");

  return (
    <AccountShell active="inicio">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Montar meu pedido</h1>
        <p className="text-sm text-(--color-olive)/70 max-w-lg">
          Escolham o pacote, o estilo e mandem o material. Podem salvar como
          rascunho e voltar quando quiserem — nada é cobrado nesta etapa.
        </p>
      </div>

      <OrderForm order={order ? (order as OrderData) : null} />
    </AccountShell>
  );
}
