import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getSessionUserId } from "@/lib/auth/userSession";
import { getUserById } from "@/lib/repositories/users";
import { listOrdersByUserId } from "@/lib/repositories/orders";
import AccountShell from "@/components/account/AccountShell";
import EmailVerificationBanner from "@/components/account/EmailVerificationBanner";
import { STATUS_META } from "@/lib/orderStatus";
import { getPackage } from "@/lib/packages";
import { isEmailConfigured } from "@/lib/email";
import { CONTACT, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Minha conta | ${SITE_NAME}`,
};

export const dynamic = "force-dynamic";

// As 3 etapas do serviço, na ordem. Estavam só implícitas na tela — o casal
// não sabia se precisava chamar no WhatsApp para fechar (não precisa).
const HOW_IT_WORKS = [
  {
    n: "1",
    title: "Vocês montam o pedido",
    desc: "Escolhem o pacote e o estilo, sobem as fotos e contam a história de vocês. Leva uns 10 minutos e não custa nada.",
  },
  {
    n: "2",
    title: "A gente monta o site",
    desc: "Nossa equipe desenha tudo à mão a partir do que vocês pediram e avisa por e-mail quando a prévia estiver pronta.",
  },
  {
    n: "3",
    title: "Vocês aprovam e pagam",
    desc: "Só depois de ver a prévia pronta. O pagamento é aqui pelo painel — e aí o site vai pro ar.",
  },
];

export default async function AccountHubPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/conta/entrar");

  const user = await getUserById(userId);
  if (!user) redirect("/conta/entrar");

  const orders = await listOrdersByUserId(userId);
  const latest = orders[0] ?? null;
  const needsEmailConfirmation = !user.emailVerifiedAt && isEmailConfigured();

  return (
    <AccountShell active="inicio">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Olá, {user.name} 💚
        </h1>
        <p className="text-sm text-(--color-olive)/70 max-w-lg">
          Tudo do site de vocês acontece por aqui: montar o pedido, acompanhar
          a produção, aprovar a prévia e pagar. Não precisa fazer nada por
          fora.
        </p>
      </div>

      {needsEmailConfirmation && <EmailVerificationBanner email={user.email} />}

      {/* Destaque conforme o pedido mais recente */}
      {!latest ? (
        <section className="rounded-2xl border border-(--color-olive)/30 bg-(--color-blush) p-6 sm:p-8 flex flex-col gap-4">
          <span className="text-xs uppercase tracking-[0.1em] text-(--color-gold)">
            Comecem por aqui
          </span>
          <p className="text-xl font-semibold">
            Vamos montar o site de casamento de vocês? 💍
          </p>
          <p className="text-sm text-(--color-olive)/75 max-w-md leading-relaxed">
            Escolham o pacote e o estilo, mandem o material e a gente cuida do
            resto. Nada é cobrado para montar o pedido.
          </p>
          <Link
            href="/conta/pedido/novo"
            className="btn btn-primary self-start mt-1"
          >
            Fazer meu pedido
          </Link>
        </section>
      ) : (
        <section className="rounded-2xl border border-(--color-gold)/40 bg-white p-6 sm:p-8 flex flex-col gap-4">
          <span className="text-xs uppercase tracking-[0.1em] text-(--color-gold)">
            {orders.length > 1 ? "Pedido mais recente" : "Seu pedido"}
          </span>
          <p className="text-xl font-semibold">
            {STATUS_META[latest.status].icon} {STATUS_META[latest.status].short}
          </p>
          <p className="text-sm text-(--color-olive)/75 max-w-md leading-relaxed">
            {STATUS_META[latest.status].description}
          </p>
          <p className="text-xs text-(--color-olive)/60">
            {getPackage(latest.packageTier)?.name ?? latest.packageTier}
            {latest.coupleNames ? ` · ${latest.coupleNames}` : ""}
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href={
                latest.status === "draft"
                  ? `/conta/pedido/${latest.id}`
                  : `/conta/pedidos/${latest.id}`
              }
              className="btn btn-primary"
            >
              {latest.status === "draft"
                ? "Continuar meu pedido"
                : "Acompanhar meu pedido"}
            </Link>
            <Link href="/conta/pedido/novo" className="btn btn-secondary">
              Fazer novo pedido
            </Link>
          </div>
        </section>
      )}

      {/* Como funciona — deixa claro que o fluxo inteiro é por aqui */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-(--color-gold)">
          Como funciona
        </h2>
        <ol className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {HOW_IT_WORKS.map((step) => (
            <li
              key={step.n}
              className="flex flex-col gap-2 rounded-2xl border border-(--color-gold)/40 bg-white p-5"
            >
              <span className="flex size-7 items-center justify-center rounded-full bg-[#2f3a29] text-xs font-bold text-white">
                {step.n}
              </span>
              <span className="text-sm font-semibold">{step.title}</span>
              <span className="text-xs text-(--color-olive)/70 leading-relaxed">
                {step.desc}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* Atalhos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href="/conta/pedidos"
          className="flex flex-col gap-1 rounded-2xl border border-(--color-gold)/40 bg-white p-5 transition-colors hover:border-(--color-olive) hover:bg-(--color-blush)"
        >
          <span className="text-xl" aria-hidden>
            📦
          </span>
          <span className="text-sm font-semibold">Meus pedidos</span>
          <span className="text-xs text-(--color-olive)/60">
            {orders.length > 0
              ? `${orders.length} pedido${orders.length > 1 ? "s" : ""} · acompanhar cada etapa`
              : "Acompanhem cada etapa"}
          </span>
        </Link>
        <Link
          href="/#estilos"
          className="flex flex-col gap-1 rounded-2xl border border-(--color-gold)/40 bg-white p-5 transition-colors hover:border-(--color-olive) hover:bg-(--color-blush)"
        >
          <span className="text-xl" aria-hidden>
            🎨
          </span>
          <span className="text-sm font-semibold">Ver modelos</span>
          <span className="text-xs text-(--color-olive)/60">
            Inspiração de estilos
          </span>
        </Link>
      </div>

      {/* WhatsApp: canal de dúvida, não etapa do processo. */}
      <p className="text-xs text-(--color-olive)/60 leading-relaxed border-t border-(--color-gold)/30 pt-5">
        Ficou alguma dúvida? Falem com a gente no{" "}
        <a
          href={`https://wa.me/${CONTACT.whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-(--color-olive) underline underline-offset-2"
        >
          WhatsApp {CONTACT.whatsappLabel}
        </a>
        . É só para tirar dúvidas — pedido, prévia e pagamento acontecem todos
        aqui no painel.
      </p>
    </AccountShell>
  );
}
