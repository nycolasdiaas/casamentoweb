import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSessionUserId } from "@/lib/auth/userSession";
import AccountShell from "@/components/account/AccountShell";
import OrderWizard from "@/components/account/wizard/OrderWizard";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Novo pedido | ${SITE_NAME}`,
};

export default async function NewOrderPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/conta/entrar");

  return (
    <AccountShell active="inicio">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Montar meu pedido</h1>
        <p className="text-sm text-(--color-olive)/70 max-w-lg">
          Escolham o pacote, o estilo e mandem o material. Podem salvar como
          rascunho e voltar quando quiserem — nada é cobrado nesta etapa.
        </p>
      </div>

      <OrderWizard order={null} orderId={null} />
    </AccountShell>
  );
}
