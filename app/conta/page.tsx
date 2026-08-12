import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getSessionUserId } from "@/lib/auth/userSession";
import { getUserById } from "@/lib/repositories/users";
import { listOrdersByUserId } from "@/lib/repositories/orders";
import AccountShell from "@/components/account/AccountShell";
import { STATUS_META } from "@/lib/orderStatus";
import { getPackage } from "@/lib/packages";
import { CONTACT, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Minha conta | ${SITE_NAME}`,
};

/**
 * Atalho como LINHA de uma lista com fio, não como card.
 *
 * Antes eram três `rounded-2xl border bg-white p-5` — o mesmo card do destaque
 * e o mesmo card do pedido. Quando toda superfície tem o mesmo peso, nenhuma é
 * principal, e é isso que fazia a tela parecer "vazia e sem vida" mesmo cheia
 * de blocos. Aqui o atalho é secundário e se parece com secundário.
 *
 * O emoji de ícone saiu: é um dos tells mais fortes de interface gerada, e sem
 * ele o rótulo passa a carregar o significado sozinho.
 */
function Atalho({
  href,
  title,
  desc,
  external,
}: {
  href: string;
  title: string;
  desc: string;
  external?: boolean;
}) {
  const className =
    "flex flex-col gap-0.5 px-4 py-3.5 border-b border-(--c-rule) last:border-b-0 transition-colors hover:bg-(--c-sunken)";
  const inner = (
    <>
      <span className="text-sm font-medium text-(--c-ink)">{title}</span>
      <span className="text-[13px] leading-snug text-(--c-ink-2)">{desc}</span>
    </>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
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

  const orders = await listOrdersByUserId(userId);
  const latest = orders[0] ?? null;

  return (
    <AccountShell active="inicio">
      {/* UM filho só. O ritmo é declarado aqui dentro, com espaço que varia
          conforme a relação entre os blocos: 8–16 dentro de um componente,
          24–32 entre irmãos, 64–96 entre seções. Era gap-8 para os três casos,
          e um espaço só para todas as relações é o que faz a tela parecer
          lista de cards em vez de página desenhada. */}
      <div className="flex flex-col">
        <header className="flex flex-col gap-3">
          <span className="meta text-(--c-ink-2)">Painel do casal</span>
          <h1 className="t-display text-2xl md:text-[30px] leading-[1.15] text-(--c-ink)">
            Olá, {user.name}
          </h1>
          <p className="text-base leading-relaxed text-(--c-ink-2) max-w-[52ch]">
            Bem-vindos ao painel de vocês. Aqui vocês montam pedidos, acompanham
            a produção e chegam até o site no ar.
          </p>
        </header>

        {/* Grade de 12 colunas: o principal em 1–8, o metadado em 9–12. É o que
            mata "centralizada demais" — antes era pilha vertical com mx-auto em
            tudo. Abaixo de lg vira uma coluna só, que é o desenho de origem do
            celular e não pode piorar. */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <section className="lg:col-span-8">
            {!latest ? (
              <div className="surface-raised rounded-[3px] p-6 lg:p-8 flex flex-col gap-4">
                {/* A ÚNICA aparição do vermelhão de registro nesta tela. A
                    contenção do resto é o que o faz funcionar. */}
                <span className="meta text-(--c-mark)">Comecem por aqui</span>
                <p className="t-display text-[26px] leading-tight text-(--c-ink)">
                  Vamos montar o site de casamento de vocês?
                </p>
                <p className="text-base leading-relaxed text-(--c-ink-2) max-w-[46ch]">
                  Escolham o pacote e o estilo, mandem o material e a gente cuida
                  do resto. Nada é cobrado para montar o pedido.
                </p>
                <div className="pt-2">
                  <Link href="/conta/pedido/novo" className="btn btn-ink">
                    Fazer meu pedido
                  </Link>
                </div>
              </div>
            ) : (
              <div className="surface-raised rounded-[3px] p-6 lg:p-8 flex flex-col gap-4">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="meta text-(--c-mark)">
                    {orders.length > 1 ? "Pedido mais recente" : "Seu pedido"}
                  </span>
                  {/* Dado real, em mono: a marca de registro da gráfica
                      aplicada à interface. */}
                  <span className="t-data text-[12.5px] text-(--c-ink-2)">
                    #{latest.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>

                <p className="t-display text-[26px] leading-tight text-(--c-ink)">
                  {STATUS_META[latest.status].short}
                </p>

                <p className="text-[15px] text-(--c-ink-2)">
                  {getPackage(latest.packageTier)?.name ?? latest.packageTier}
                  {latest.coupleNames ? ` · ${latest.coupleNames}` : ""}
                </p>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Link
                    href={
                      latest.status === "draft"
                        ? `/conta/pedido/${latest.id}`
                        : `/conta/pedidos/${latest.id}`
                    }
                    className="btn btn-ink"
                  >
                    {latest.status === "draft"
                      ? "Continuar meu pedido"
                      : "Acompanhar meu pedido"}
                  </Link>
                  <Link href="/conta/pedido/novo" className="btn btn-quiet">
                    Fazer novo pedido
                  </Link>
                </div>
              </div>
            )}
          </section>

          <aside className="lg:col-span-4 flex flex-col gap-3">
            <span className="meta text-(--c-ink-2)">Atalhos</span>
            <nav className="surface-flat rounded-[3px] overflow-hidden">
              <Atalho
                href="/conta/pedidos"
                title="Meus pedidos"
                desc={
                  orders.length > 0
                    ? `${orders.length} pedido${orders.length > 1 ? "s" : ""} · acompanhar`
                    : "Acompanhem cada etapa"
                }
              />
              <Atalho
                href="/#estilos"
                title="Ver modelos"
                desc="Inspiração de estilos"
              />
              <Atalho
                href={`https://wa.me/${CONTACT.whatsappNumber}`}
                title="Falar no WhatsApp"
                desc="Tirar dúvidas com a gente"
                external
              />
            </nav>
          </aside>
        </div>
      </div>
    </AccountShell>
  );
}
