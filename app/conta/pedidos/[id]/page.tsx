import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getSessionUserId } from "@/lib/auth/userSession";
import {
  getOrderById,
  setOrderPayment,
  markOrderPaid,
} from "@/lib/repositories/orders";
import { getChargeStatus } from "@/lib/payments/abacatepay";
import AccountShell from "@/components/account/AccountShell";
import CancelOrderButton from "@/components/account/CancelOrderButton";
import OrderStatusTracker, {
  type TrackerOrder,
} from "@/components/account/OrderStatusTracker";
import PhotoManager from "@/components/account/PhotoManager";
import { getSiteByOrderId } from "@/lib/repositories/sites";
import {
  listSitePhotosFresh,
  photoLimitForTier,
} from "@/lib/repositories/sitePhotos";
import { isStorageEnabled } from "@/lib/storage/supabase";
import { canCancelOrder, type OrderStatus } from "@/lib/orderStatus";
import type { PackageTier } from "@/lib/packages";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Acompanhar pedido | ${SITE_NAME}`,
};

export default async function OrderTrackerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ publicacao?: string }>;
}) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/conta/entrar");

  const { id } = await params;
  const order = await getOrderById(id);
  if (!order || order.userId !== userId) redirect("/conta/pedidos");
  if (order.status === "draft") redirect(`/conta/pedido/${order.id}`);

  // Confirmação de pagamento sem depender de webhook: ao voltar do checkout,
  // consultamos o status real da cobrança e atualizamos o pedido.
  let status = order.status as OrderStatus;
  let paymentStatus = order.paymentStatus ?? null;
  if (order.paymentId && order.paymentStatus !== "PAID") {
    const remote = await getChargeStatus(order.paymentId);
    if (remote && remote !== order.paymentStatus) {
      if (remote === "PAID") {
        const updated = await markOrderPaid(order.id);
        status = (updated?.status ?? status) as OrderStatus;
        paymentStatus = "PAID";
      } else {
        await setOrderPayment(order.id, {
          paymentId: order.paymentId,
          paymentUrl: order.paymentUrl,
          paymentStatus: remote,
        });
        paymentStatus = remote;
      }
    }
  }

  // O site já existe desde o envio do pedido (provisionamento automático), e é
  // nele que as fotos penduram — por isso o painel de fotos vive aqui, e não
  // no briefing: o casal vê a prévia e preenche os lugares que estão vazios.
  const site = await getSiteByOrderId(order.id);

  // Rede de segurança para quem pagou e voltou por fora do checkout (fechou a
  // aba, abriu o link do e-mail dias depois, webhook desligado). Publicar
  // exige derrubar cache, e isso não pode acontecer durante o render — então
  // manda para a rota que sabe fazer isso e volta para cá.
  //
  // O marcador `publicacao=erro` corta o laço: se a rota não conseguiu
  // publicar, a tela não a chama de novo.
  const { publicacao } = await searchParams;
  const publicacaoFalhou = publicacao === "erro";
  if (
    paymentStatus === "PAID" &&
    site !== null &&
    site.status !== "published" &&
    site.status !== "archived" &&
    !publicacaoFalhou
  ) {
    redirect(`/api/pagamento/confirmar?pedido=${order.id}`);
  }

  const podeSubirFotos = site !== null && isStorageEnabled();
  const fotos = podeSubirFotos ? await listSitePhotosFresh(site.id) : [];

  return (
    <AccountShell active="pedidos">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Acompanhar pedido
          </h1>
          <p className="text-sm text-(--color-olive)/70 max-w-md">
            Cada etapa do site de vocês, da produção até o site no ar.
          </p>
        </div>
        <Link
          href="/conta/pedidos"
          className="text-xs text-(--color-olive)/70 underline underline-offset-4 hover:text-(--color-olive)"
        >
          ← Todos os pedidos
        </Link>
      </div>

      <OrderStatusTracker
        orderId={order.id}
        order={
          {
            status,
            packageTier: order.packageTier as PackageTier,
            coupleNames: order.coupleNames,
            previewUrl: order.previewUrl,
            siteUrl: order.siteUrl,
            adminMessage: order.adminMessage,
            priceCents: order.priceCents,
            paymentStatus,
          } satisfies TrackerOrder
        }
      />

      {publicacaoFalhou && (
        <p
          role="alert"
          className="rounded-xl border border-(--color-gold)/50 bg-(--color-blush) px-4 py-3 text-sm text-(--color-olive) leading-relaxed"
        >
          Recebemos o pagamento de vocês, mas não conseguimos colocar o site no
          ar automaticamente. Já estamos vendo isso — se preferir, chame a gente
          no WhatsApp que resolvemos na hora.
        </p>
      )}

      {podeSubirFotos && (
        <PhotoManager
          siteId={site.id}
          limit={photoLimitForTier(site.tier as PackageTier)}
          photos={fotos.map((f) => ({
            id: f.id,
            slot: f.slot,
            width: f.width,
            height: f.height,
            blurDataUrl: f.blurDataUrl,
          }))}
        />
      )}

      {canCancelOrder(status) && (
        <div className="flex flex-col gap-1 border-t border-(--color-gold)/30 pt-4">
          <CancelOrderButton orderId={order.id} label="Cancelar este pedido" />
          <p className="text-xs text-(--color-muted)">
            Dá para cancelar enquanto o pedido ainda não entrou em produção.
          </p>
        </div>
      )}
    </AccountShell>
  );
}
