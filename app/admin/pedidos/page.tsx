import { requireAdmin } from "@/lib/auth/requireAdmin";
import { listOrdersWithUsers } from "@/lib/repositories/orders";
import { countOrderPhotos } from "@/lib/repositories/orderPhotos";
import { getPackage } from "@/lib/packages";
import AdminShell from "@/components/admin/AdminShell";
import OrdersTable, { type OrderRow } from "@/components/admin/OrdersTable";
import type { OrderStatus } from "@/lib/orderStatus";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function brl(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function daysSince(date: Date): number {
  return Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000))
  );
}

export default async function AdminOrdersPage() {
  await requireAdmin();
  const orders = await listOrdersWithUsers();

  const rows: OrderRow[] = await Promise.all(
    orders.map(async (order) => {
      const pkg = getPackage(order.packageTier);
      const priceCents = order.priceCents ?? pkg?.priceCents ?? 0;
      const updatedAt = new Date(order.updatedAt);

      return {
        id: order.id,
        status: order.status as OrderStatus,
        coupleName: order.coupleNames ?? order.user.name,
        email: order.user.email,
        whatsapp: order.user.whatsapp,
        packageName: pkg?.name ?? order.packageTier,
        priceLabel: brl(priceCents),
        priceIsCustom: order.priceCents != null,
        previewUrl: order.previewUrl,
        siteUrl: order.siteUrl,
        paymentStatus: order.paymentStatus,
        photoCount: await countOrderPhotos(order.id),
        updatedAt: dateFmt.format(updatedAt),
        waitingDays: daysSince(updatedAt),
      };
    })
  );

  return (
    <AdminShell
      active="pedidos"
      title="Pedidos de sites"
      subtitle="Cada linha é um site em produção. Abra o pedido para mover a etapa — links, valor e recado já vêm preenchidos."
    >
      <OrdersTable rows={rows} />
    </AdminShell>
  );
}
