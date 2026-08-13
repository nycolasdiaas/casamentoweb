import Link from "next/link";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { listOrdersWithUsers } from "@/lib/repositories/orders";
import { listOrderAuditLog } from "@/lib/repositories/orderAudit";
import { getPackage } from "@/lib/packages";
import {
  orderToJson,
  buildFullPrompt,
  SITE_BUILD_PROMPT,
  type OrderForPrompt,
} from "@/lib/buildPrompt";
import OrderCard, { type AdminOrder } from "@/components/admin/OrderCard";

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function AdminOrdersPage() {
  await requireAdmin();
  const orders = await listOrdersWithUsers();

  const cards: AdminOrder[] = await Promise.all(
    orders.map(async (order) => {
      const forPrompt = order as unknown as OrderForPrompt;
      const pkg = getPackage(order.packageTier);
      const auditLog = await listOrderAuditLog(order.id);
      return {
        id: order.id,
        status: order.status,
        coupleName: order.coupleNames ?? order.user.name,
        packageName: pkg?.name ?? order.packageTier,
        whatsapp: order.user.whatsapp,
        updatedAt: dateFmt.format(new Date(order.updatedAt)),
        json: JSON.stringify(orderToJson(forPrompt), null, 2),
        fullPrompt: buildFullPrompt(forPrompt),
        previewUrl: order.previewUrl,
        siteUrl: order.siteUrl,
        priceCents: order.priceCents,
        adminMessage: order.adminMessage,
        paymentStatus: order.paymentStatus,
        defaultPriceCents: pkg?.priceCents ?? 0,
        auditLog: auditLog.map((entry) => ({
          adminName: entry.adminName,
          field: entry.field,
          oldValue: entry.oldValue,
          newValue: entry.newValue,
          when: dateFmt.format(new Date(entry.createdAt)),
        })),
      };
    })
  );

  const inProgress = cards.filter(
    (c) =>
      c.status === "submitted" ||
      c.status === "in_production" ||
      c.status === "preview_ready" ||
      c.status === "paid"
  );
  const published = cards.filter((c) => c.status === "published");
  const drafts = cards.filter((c) => c.status === "draft");

  return (
    <main className="flex-1 flex flex-col gap-8 px-6 py-12 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-xl text-(--c-ink)">
          Pedidos de sites
        </h1>
        <nav className="flex gap-4">
          <Link
            href="/admin"
            className="font-serif text-xs text-(--c-ink) underline"
          >
            Convidados
          </Link>
          <Link
            href="/admin/dashboard"
            className="font-serif text-xs text-(--c-ink) underline"
          >
            Confirmações
          </Link>
        </nav>
      </div>

      <details className="border border-(--c-rule) bg-white p-4">
        <summary className="font-serif text-sm text-(--c-ink) cursor-pointer">
          Como gerar o site a partir de um pedido
        </summary>
        <div className="mt-3 flex flex-col gap-2 text-sm text-(--c-ink-2) font-serif leading-relaxed">
          <p>
            Cada pedido enviado vira um JSON estruturado. Clique em{" "}
            <strong>&ldquo;Copiar prompt + pedido&rdquo;</strong> e cole num
            gerador de código (Claude, etc.): ele já traz o prompt-base de
            produção somado aos dados do casal, pronto para gerar o site.
          </p>
          <p className="text-xs text-(--c-ink-2)">
            O prompt-base pode ser editado em{" "}
            <span className="font-mono">lib/buildPrompt.ts</span> (e há uma
            cópia em <span className="font-mono">docs/prompt-gerar-site.md</span>
            ).
          </p>
          <pre className="mt-1 overflow-x-auto bg-(--c-base) border border-(--c-rule) p-3 text-[11px] font-mono whitespace-pre-wrap">
            {SITE_BUILD_PROMPT.trim()}
          </pre>
        </div>
      </details>

      {cards.length === 0 ? (
        <p className="font-serif text-sm text-(--c-ink-2) text-center py-8">
          Nenhum pedido ainda. Quando um casal enviar, aparece aqui.
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-3">
            <h2 className="font-serif text-sm tracking-[0.1em] uppercase text-(--c-ink-2)">
              Em andamento ({inProgress.length})
            </h2>
            {inProgress.length === 0 ? (
              <p className="font-serif text-xs text-(--c-ink-2)">
                Nenhum pedido em produção agora.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {inProgress.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </ul>
            )}
          </section>

          {published.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="font-serif text-sm tracking-[0.1em] uppercase text-(--c-ink-2)">
                No ar ({published.length})
              </h2>
              <ul className="flex flex-col gap-3">
                {published.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </ul>
            </section>
          )}

          {drafts.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="font-serif text-sm tracking-[0.1em] uppercase text-(--c-ink-2)">
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
