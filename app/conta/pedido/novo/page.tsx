import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSessionUserId } from "@/lib/auth/userSession";
import AccountShell from "@/components/account/AccountShell";
import OrderWizard from "@/components/account/wizard/OrderWizard";
import { SITE_NAME } from "@/lib/site";
import { situacaoDePedidos, LIMITE_DE_PEDIDOS } from "@/lib/orderLimits";
import Link from "next/link";

export const metadata: Metadata = {
  title: `Novo pedido | ${SITE_NAME}`,
};

export default async function NewOrderPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/conta/entrar");

  // Recusa ANTES de desenhar o questionário. Deixar a pessoa responder sete
  // etapas para só então dizer que não dá é a pior forma possível de aplicar
  // um limite.
  const { total, podeCriar } = await situacaoDePedidos(userId);
  if (!podeCriar) {
    return (
      <AccountShell active="pedidos">
        <div className="flex flex-col">
          <header className="flex flex-col gap-3">
            <span className="meta text-(--c-mark)">Limite atingido</span>
            <h1 className="t-display text-2xl md:text-[30px] leading-[1.15] text-(--c-ink)">
              Vocês já têm {total} pedidos
            </h1>
            <p className="text-base leading-relaxed text-(--c-ink-2) max-w-[52ch]">
              Cada conta pode manter até {LIMITE_DE_PEDIDOS} pedidos ao mesmo
              tempo. Para começar outro, cancele um que não vá usar — nenhum
              site que já esteve no ar é apagado nisso.
            </p>
          </header>
          <div className="mt-16 flex flex-wrap gap-3">
            <Link href="/conta/pedidos" className="btn btn-ink">
              Ver meus pedidos
            </Link>
          </div>
        </div>
      </AccountShell>
    );
  }

  return (
    <AccountShell active="inicio">
      <div className="flex flex-col gap-3">
        <span className="meta text-(--c-mark)">Novo site</span>
        <h1 className="t-d2 text-(--c-ink)">Vamos criar o site de vocês</h1>
        <p className="t-corpo text-(--c-ink-2) medida">
          A gente pergunta o essencial — nomes, data, local, a história — e
          monta tudo. Dá para salvar e voltar quando quiserem, e nada é cobrado
          antes de vocês verem a prévia pronta.
        </p>
      </div>

      <OrderWizard order={null} orderId={null} />
    </AccountShell>
  );
}
