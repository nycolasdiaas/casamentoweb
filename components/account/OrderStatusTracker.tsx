import {
  TRACKER_STEPS,
  STATUS_META,
  trackerStepIndex,
  type OrderStatus,
} from "@/lib/orderStatus";
import { getPackage, type PackageTier } from "@/lib/packages";
import { CONTACT } from "@/lib/site";
import PaymentButton from "./PaymentButton";

export type TrackerOrder = {
  status: OrderStatus;
  packageTier: PackageTier;
  coupleNames: string | null;
  previewUrl: string | null;
  siteUrl: string | null;
  adminMessage: string | null;
  priceCents: number | null;
  paymentStatus: string | null;
};

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function OrderStatusTracker({
  order,
  orderId,
}: {
  order: TrackerOrder;
  orderId: string;
}) {
  const pkg = getPackage(order.packageTier);
  const amountCents = order.priceCents ?? pkg?.priceCents ?? 0;
  const amountLabel = formatBRL(amountCents);
  const currentIndex = trackerStepIndex(order.status);
  const isPaid = order.paymentStatus === "PAID";

  return (
    <div className="flex flex-col gap-6">
      {/* Resumo do pedido */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-(--color-gold)/40 bg-white px-5 py-4">
        <div className="flex flex-col">
          <span className="text-base font-semibold">
            {order.coupleNames ?? "Nosso site"}
          </span>
          <span className="text-xs text-(--color-olive)/60">
            Pacote {pkg?.name ?? order.packageTier}
          </span>
        </div>
        <span className="text-lg font-bold">{amountLabel}</span>
      </div>

      {/* Linha do tempo */}
      <ol className="flex flex-col">
        {TRACKER_STEPS.map((step, i) => {
          const meta = STATUS_META[step];
          const state =
            i < currentIndex ? "done" : i === currentIndex ? "active" : "pending";
          const isLast = i === TRACKER_STEPS.length - 1;

          return (
            <li key={step} className="flex gap-4">
              {/* Marcador + conector */}
              <div className="flex flex-col items-center">
                <span
                  aria-hidden
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-sm ${
                    state === "done"
                      ? "border-(--color-olive) bg-(--color-olive) text-white"
                      : state === "active"
                        ? "border-(--color-olive) bg-white ring-4 ring-(--color-olive)/15"
                        : "border-(--color-gold)/40 bg-white text-(--color-muted)"
                  }`}
                >
                  {state === "done" ? "✓" : meta.icon}
                </span>
                {!isLast && (
                  <span
                    aria-hidden
                    className={`w-0.5 flex-1 my-1 ${
                      state === "done"
                        ? "bg-(--color-olive)"
                        : "bg-(--color-gold)/30"
                    }`}
                  />
                )}
              </div>

              {/* Conteúdo do passo */}
              <div className={`flex-1 pb-8 ${isLast ? "pb-0" : ""}`}>
                <p
                  className={`text-sm font-semibold ${
                    state === "pending"
                      ? "text-(--color-muted)"
                      : "text-(--color-olive)"
                  }`}
                >
                  {state === "active" ? meta.title : meta.short}
                </p>

                {state === "active" && (
                  <div className="mt-2 flex flex-col gap-4">
                    <p className="text-sm text-(--color-olive)/75 leading-relaxed max-w-md">
                      {meta.description}
                    </p>

                    {order.adminMessage && (
                      <div className="rounded-xl border border-(--color-olive)/25 bg-(--color-blush) px-4 py-3 text-sm text-(--color-olive) leading-relaxed">
                        <span className="font-semibold">Recado da equipe: </span>
                        {order.adminMessage}
                      </div>
                    )}

                    {/* Prévia + pagamento */}
                    {step === "preview_ready" && (
                      <div className="flex flex-col items-start gap-4">
                        {order.previewUrl && (
                          <a
                            href={order.previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full border border-(--color-olive)/40 px-6 py-3 text-sm font-medium transition-colors hover:bg-(--color-blush)"
                          >
                            👀 Ver a prévia do site
                          </a>
                        )}
                        {isPaid ? (
                          <p className="text-sm text-(--color-olive)">
                            Pagamento confirmado ✓ — publicando o site.
                          </p>
                        ) : (
                          <div className="w-full max-w-xs">
                            <PaymentButton
                              orderId={orderId}
                              amountLabel={amountLabel}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Site no ar */}
                    {step === "published" && order.siteUrl && (
                      <a
                        href={order.siteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="self-start rounded-full bg-(--color-olive) text-white px-8 py-3 text-sm font-medium transition-transform hover:scale-105"
                      >
                        🎉 Ver nosso site no ar
                      </a>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {/* Ajuda */}
      <p className="text-xs text-(--color-muted) border-t border-(--color-gold)/30 pt-4">
        Qualquer dúvida, é só chamar a gente no{" "}
        <a
          href={`https://wa.me/${CONTACT.whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-(--color-olive) underline underline-offset-2"
        >
          WhatsApp
        </a>
        .
      </p>
    </div>
  );
}
