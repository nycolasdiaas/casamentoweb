import Link from "next/link";
import { listOrdersWithUsers } from "@/lib/repositories/orders";
import { getPackage } from "@/lib/packages";
import {
  orderToJson,
  buildFullPrompt,
  SITE_BUILD_PROMPT,
  type OrderForPrompt,
} from "@/lib/buildPrompt";
import OrderCard, { type AdminOrder } from "@/components/admin/OrderCard";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function AdminOrdersPage() {
  const orders = await listOrdersWithUsers();

  const cards: AdminOrder[] = orders.map((order) => {
    const forPrompt = order as unknown as OrderForPrompt;
    return {
      id: order.id,
      status: order.status,
      coupleName: order.coupleNames ?? order.user.name,
      packageName: getPackage(order.packageTier)?.name ?? order.packageTier,
      whatsapp: order.user.whatsapp,
      updatedAt: dateFmt.format(new Date(order.updatedAt)),
      json: JSON.stringify(orderToJson(forPrompt), null, 2),
      fullPrompt: buildFullPrompt(forPrompt),
    };
  });

  const submitted = cards.filter((c) => c.status === "submitted");
  const drafts = cards.filter((c) => c.status === "draft");

  return (
    <main className="flex-1 flex flex-col gap-8 px-6 py-12 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-xl text-(--color-olive)">
          Pedidos de sites
        </h1>
        <nav className="flex gap-4">
          <Link
            href="/admin"
            className="font-serif text-xs text-(--color-olive) underline"
          >
            Convidados
          </Link>
          <Link
            href="/admin/dashboard"
            className="font-serif text-xs text-(--color-olive) underline"
          >
            Confirmações
          </Link>
        </nav>
      </div>

      <details className="border border-(--color-gold)/50 bg-white p-4">
        <summary className="font-serif text-sm text-(--color-olive) cursor-pointer">
          Como gerar o site a partir de um pedido
        </summary>
        <div className="mt-3 flex flex-col gap-2 text-sm text-(--color-olive)/80 font-serif leading-relaxed">
          <p>
            Cada pedido enviado vira um JSON estruturado. Clique em{" "}
            <strong>&ldquo;Copiar prompt + pedido&rdquo;</strong> e cole num
            gerador de código (Claude, etc.): ele já traz o prompt-base de
            produção somado aos dados do casal, pronto para gerar o site.
          </p>
          <p className="text-xs text-(--color-muted)">
            O prompt-base pode ser editado em{" "}
            <span className="font-mono">lib/buildPrompt.ts</span> (e há uma
            cópia em <span className="font-mono">docs/prompt-gerar-site.md</span>
            ).
          </p>
          <pre className="mt-1 overflow-x-auto bg-(--color-paper) border border-(--color-gold)/40 p-3 text-[11px] font-mono whitespace-pre-wrap">
            {SITE_BUILD_PROMPT.trim()}
          </pre>
        </div>
      </details>

      {cards.length === 0 ? (
        <p className="font-serif text-sm text-(--color-muted) text-center py-8">
          Nenhum pedido ainda. Quando um casal enviar, aparece aqui.
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-3">
            <h2 className="font-serif text-sm tracking-[0.1em] uppercase text-(--color-gold)">
              Enviados ({submitted.length})
            </h2>
            {submitted.length === 0 ? (
              <p className="font-serif text-xs text-(--color-muted)">
                Nenhum pedido enviado ainda.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {submitted.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </ul>
            )}
          </section>

          {drafts.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="font-serif text-sm tracking-[0.1em] uppercase text-(--color-muted)">
                Rascunhos ({drafts.length})
              </h2>
              <ul className="flex flex-col gap-3">
                {drafts.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
