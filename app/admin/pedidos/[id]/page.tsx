import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getOrderById } from "@/lib/repositories/orders";
import { listOrderAuditLog } from "@/lib/repositories/orderAudit";
import { listOrderPhotos } from "@/lib/repositories/orderPhotos";
import { signedPhotoUrl } from "@/lib/storage";
import { getPackage } from "@/lib/packages";
import { getTemplateStyle } from "@/lib/templates";
import { FONT_STYLES } from "@/lib/customization";
import { suggestedPreviewUrl, suggestedSiteUrl } from "@/lib/orderLinks";
import { buildFullPrompt, orderToJson, type OrderForPrompt } from "@/lib/buildPrompt";
import { STATUS_META, type OrderStatus } from "@/lib/orderStatus";
import AdminShell from "@/components/admin/AdminShell";
import AdminOrderControls from "@/components/admin/AdminOrderControls";
import BriefingActions from "@/components/admin/BriefingActions";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function brl(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-[0.08em] text-(--color-muted)">
        {label}
      </span>
      <span className="text-sm text-(--color-olive)">{children}</span>
    </div>
  );
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const order = await getOrderById(id);
  if (!order) notFound();

  const [auditLog, photoRows] = await Promise.all([
    listOrderAuditLog(order.id),
    listOrderPhotos(order.id),
  ]);
  const photos = await Promise.all(
    photoRows.map(async (row) => ({
      id: row.id,
      name: row.originalName,
      url: await signedPhotoUrl(row.storagePath),
    }))
  );

  const pkg = getPackage(order.packageTier);
  const status = order.status as OrderStatus;
  const forPrompt = {
    ...(order as unknown as OrderForPrompt),
    photoCount: photoRows.length,
  };
  const template = order.templateStyle
    ? getTemplateStyle(order.templateStyle)
    : null;
  const font = FONT_STYLES.find((f) => f.id === order.fontStyle);

  const coupleName = order.coupleNames ?? order.user.name;

  return (
    <AdminShell
      active="pedidos"
      title={coupleName}
      subtitle={`${pkg?.name ?? order.packageTier} · ${brl(
        order.priceCents ?? pkg?.priceCents ?? 0
      )} · atualizado em ${dateFmt.format(new Date(order.updatedAt))}`}
      actions={
        <Link href="/admin/pedidos" className="btn btn-secondary btn-sm">
          ← Todos os pedidos
        </Link>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* Coluna esquerda: o que o casal mandou */}
        <div className="flex flex-col gap-6">
          <section className="rounded-xl border border-(--color-gold)/40 bg-white p-5 flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-(--color-olive)">
              O que o casal pediu
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="Nome no site">{coupleName}</Field>
              <Field label="Data">{order.weddingDate ?? "—"}</Field>
              <Field label="Pacote">{pkg?.name ?? order.packageTier}</Field>
              <Field label="Modelo base">
                {template?.name ?? "do zero"}
              </Field>
              <Field label="Tipografia">{font?.name ?? "livre"}</Field>
              <Field label="Cores">
                <span className="flex items-center gap-1.5">
                  {order.primaryColor ? (
                    <span
                      className="inline-block size-4 rounded-full border border-black/10"
                      style={{ backgroundColor: order.primaryColor }}
                      title={order.primaryColor}
                    />
                  ) : null}
                  {order.secondaryColor ? (
                    <span
                      className="inline-block size-4 rounded-full border border-black/10"
                      style={{ backgroundColor: order.secondaryColor }}
                      title={order.secondaryColor}
                    />
                  ) : null}
                  {!order.primaryColor && !order.secondaryColor && "a escolher"}
                </span>
              </Field>
            </div>

            <Field label="Contato">
              {order.user.email}
              {order.user.whatsapp ? ` · ${order.user.whatsapp}` : ""}
            </Field>

            {order.styleNotes && (
              <Field label="Observações de estilo">
                <span className="whitespace-pre-wrap leading-relaxed">
                  {order.styleNotes}
                </span>
              </Field>
            )}
            {order.notes && (
              <Field label="História e detalhes">
                <span className="whitespace-pre-wrap leading-relaxed">
                  {order.notes}
                </span>
              </Field>
            )}
            {order.photosLink && (
              <Field label="Pasta externa (fallback)">
                <a
                  href={order.photosLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 break-all"
                >
                  {order.photosLink}
                </a>
              </Field>
            )}
          </section>

          {/* Fotos enviadas na plataforma */}
          <section className="rounded-xl border border-(--color-gold)/40 bg-white p-5 flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-(--color-olive)">
              Fotos enviadas ({photos.length})
            </h2>
            {photos.length === 0 ? (
              <p className="text-xs text-(--color-muted)">
                O casal ainda não subiu fotos.
              </p>
            ) : (
              <ul className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {photos.map((photo) => (
                  <li key={photo.id}>
                    {photo.url ? (
                      <a href={photo.url} target="_blank" rel="noopener noreferrer">
                        {/* URL assinada e temporária — ver PhotoUploader. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.url}
                          alt={photo.name}
                          loading="lazy"
                          className="aspect-square w-full rounded-lg border border-(--color-gold)/30 object-cover"
                        />
                      </a>
                    ) : (
                      <span className="flex aspect-square items-center justify-center rounded-lg border border-(--color-gold)/30 text-xl">
                        🖼️
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Geração do site */}
          <BriefingActions
            coupleName={coupleName}
            briefing={buildFullPrompt(forPrompt)}
            json={JSON.stringify(orderToJson(forPrompt), null, 2)}
          />

          {/* Histórico */}
          <section className="rounded-xl border border-(--color-gold)/40 bg-white p-5 flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-(--color-olive)">
              Histórico ({auditLog.length})
            </h2>
            {auditLog.length === 0 ? (
              <p className="text-xs text-(--color-muted)">
                Nenhuma alteração registrada ainda.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {auditLog.map((entry) => (
                  <li
                    key={entry.id}
                    className="text-xs leading-relaxed text-(--color-olive)/85"
                  >
                    <span className="font-semibold">{entry.adminName}</span>{" "}
                    mudou <span className="italic">{entry.field}</span>:{" "}
                    <span className="text-(--color-muted)">
                      {entry.oldValue ?? "vazio"}
                    </span>{" "}
                    → {entry.newValue ?? "vazio"}
                    <span className="text-(--color-muted)">
                      {" "}
                      · {dateFmt.format(new Date(entry.createdAt))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Coluna direita: a única coisa que a equipe precisa mexer */}
        <div className="lg:sticky lg:top-6 flex flex-col gap-3">
          <div className="rounded-xl border border-(--color-gold)/40 bg-white p-5">
            <h2 className="text-sm font-semibold text-(--color-olive)">
              Mover o pedido
            </h2>
            <p className="mt-1 text-xs text-(--color-muted)">
              {STATUS_META[status].adminLabel} — o casal está vendo:{" "}
              {STATUS_META[status].description}
            </p>
          </div>

          <AdminOrderControls
            orderId={order.id}
            status={status}
            previewUrl={order.previewUrl}
            siteUrl={order.siteUrl}
            priceCents={order.priceCents}
            adminMessage={order.adminMessage}
            paymentStatus={order.paymentStatus}
            defaultPriceCents={pkg?.priceCents ?? 0}
            suggestedPreviewUrl={suggestedPreviewUrl(order)}
            suggestedSiteUrl={suggestedSiteUrl(order)}
          />
        </div>
      </div>
    </AdminShell>
  );
}
