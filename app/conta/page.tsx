import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getSessionUserId } from "@/lib/auth/userSession";
import { getUserById } from "@/lib/repositories/users";
import { getOrderByUserId } from "@/lib/repositories/orders";
import AccountShell from "@/components/account/AccountShell";
import { STATUS_META } from "@/lib/orderStatus";
import { getPackage } from "@/lib/packages";
import { CONTACT, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Minha conta | ${SITE_NAME}`,
};

export const dynamic = "force-dynamic";

function HubCard({
  href,
  title,
  desc,
  icon,
  external,
}: {
  href: string;
  title: string;
  desc: string;
  icon: string;
  external?: boolean;
}) {
  const className =
    "flex flex-col gap-1 rounded-2xl border border-(--color-gold)/40 bg-white p-5 transition-colors hover:border-(--color-olive) hover:bg-(--color-blush)";
  const inner = (
    <>
      <span className="text-xl" aria-hidden>
        {icon}
      </span>
      <span className="text-sm font-semibold">{title}</span>
      <span className="text-xs text-(--color-olive)/60">{desc}</span>
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}

export default async function AccountHubPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/conta/entrar");

  const user = await getUserById(userId);
  if (!user) redirect("/conta/entrar");

  const order = await getOrderByUserId(userId);

  return (
    <AccountShell active="inicio">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Olá, {user.name} 💚
        </h1>
        <p className="text-sm text-(--color-olive)/70 max-w-lg">
          Bem-vindos ao painel de vocês. Aqui vocês montam o pedido, acompanham
          a produção e chegam até o site no ar.
        </p>
      </div>

      {/* Destaque conforme o estado do pedido */}
      {order && order.status !== "draft" ? (
        <section className="rounded-2xl border border-(--color-gold)/40 bg-white p-6 flex flex-col gap-3">
          <span className="text-xs uppercase tracking-[0.1em] text-(--color-gold)">
            Seu pedido
          </span>
          <p className="text-lg font-semibold">
            {STATUS_META[order.status].icon} {STATUS_META[order.status].short}
          </p>
          <p className="text-sm text-(--color-olive)/70">
            {getPackage(order.packageTier)?.name ?? order.packageTier}
            {order.coupleNames ? ` · ${order.coupleNames}` : ""}
          </p>
          <Link
            href="/conta/pedidos"
            className="self-start rounded-full bg-(--color-olive) text-white px-6 py-3 text-sm font-medium transition-transform hover:scale-105"
          >
            Acompanhar meu pedido
          </Link>
        </section>
      ) : order ? (
        <section className="rounded-2xl border border-(--color-gold)/40 bg-white p-6 flex flex-col gap-3">
          <span className="text-xs uppercase tracking-[0.1em] text-(--color-gold)">
            Rascunho em aberto
          </span>
          <p className="text-sm text-(--color-olive)/70 max-w-md">
            Vocês começaram a montar o pedido mas ainda não enviaram. Continuem
            de onde pararam.
          </p>
          <Link
            href="/conta/pedido"
            className="self-start rounded-full bg-(--color-olive) text-white px-6 py-3 text-sm font-medium transition-transform hover:scale-105"
          >
            Continuar meu pedido
          </Link>
        </section>
      ) : (
        <section className="rounded-2xl border border-(--color-olive)/30 bg-(--color-blush) p-6 flex flex-col gap-3">
          <span className="text-xs uppercase tracking-[0.1em] text-(--color-gold)">
            Comecem por aqui
          </span>
          <p className="text-lg font-semibold">
            Vamos montar o site de casamento de vocês? 💍
          </p>
          <p className="text-sm text-(--color-olive)/70 max-w-md">
            Escolham o pacote e o estilo, mandem o material e a gente cuida do
            resto. Nada é cobrado para montar o pedido.
          </p>
          <Link
            href="/conta/pedido"
            className="self-start rounded-full bg-(--color-olive) text-white px-8 py-3 text-sm font-medium transition-transform hover:scale-105"
          >
            Fazer meu pedido
          </Link>
        </section>
      )}

      {/* Atalhos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <HubCard
          href="/conta/pedidos"
          icon="📦"
          title="Meus pedidos"
          desc="Acompanhem cada etapa"
        />
        <HubCard
          href="/#estilos"
          icon="🎨"
          title="Ver modelos"
          desc="Inspiração de estilos"
        />
        <HubCard
          href={`https://wa.me/${CONTACT.whatsappNumber}`}
          icon="💬"
          title="Falar no WhatsApp"
          desc="Tirar dúvidas com a gente"
          external
        />
      </div>
    </AccountShell>
  );
}
