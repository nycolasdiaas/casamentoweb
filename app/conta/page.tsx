import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getSessionUserId } from "@/lib/auth/userSession";
import { getUserById } from "@/lib/repositories/users";
import { getOrderByUserId } from "@/lib/repositories/orders";
import { signoutAction } from "@/app/actions/account-actions";
import OrderForm, { type OrderData } from "@/components/account/OrderForm";
import { SITE_NAME } from "@/lib/site";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: `Minha conta | ${SITE_NAME}`,
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/conta/entrar");

  const user = await getUserById(userId);
  if (!user) redirect("/conta/entrar");

  const order = await getOrderByUserId(userId);

  return (
    <div
      className={`${inter.className} flex-1 flex flex-col bg-(--color-paper) text-(--color-olive)`}
    >
      <header className="bg-white/90 backdrop-blur border-b border-(--color-gold)/30">
        <div className="max-w-3xl mx-auto w-full px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            {SITE_NAME}
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
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Olá, {user.name} 💚
          </h1>
          <p className="text-sm text-(--color-olive)/70 max-w-lg">
            Montem o pedido de vocês aqui: escolham o pacote, o estilo e
            mandem o material. Podem salvar como rascunho e voltar quando
            quiserem — nada é cobrado nesta etapa.
          </p>
        </div>

        <OrderForm
          userName={user.name}
          order={order ? (order as OrderData) : null}
        />
      </main>
    </div>
  );
}
