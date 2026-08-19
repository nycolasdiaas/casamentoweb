import {
  TRACKER_STEPS,
  STATUS_META,
  trackerStepIndex,
  type OrderStatus,
} from "@/lib/orderStatus";
import { getPackage, type PackageTier } from "@/lib/packages";
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
    <div className="flex flex-col gap-8">
      {/* Resumo do pedido */}
      <div className="surface-raised rounded-[3px] px-5 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="t-display text-[20px] leading-snug text-(--c-ink)">
            {order.coupleNames ?? "Nosso site"}
          </span>
          <span className="meta text-(--c-ink-2)">
            Pacote {pkg?.name ?? order.packageTier}
          </span>
        </div>
        {/* Valor em mono: alinha coluna e lê como documento, não como preço de
            loja. */}
        <span className="t-data text-[22px] text-(--c-ink)">{amountLabel}</span>
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
              {/* Marcador + conector. Quadrado, não círculo, e com o NÚMERO da
                  etapa em mono no lugar do emoji: é a numeração de uma prova de
                  gráfica. O ✓ do passo cumprido é glifo tipográfico, não emoji
                  — carrega informação e sobrevive à decisão de tirar os emoji. */}
              <div className="flex flex-col items-center">
                <span
                  aria-hidden
                  className={`t-data flex size-8 shrink-0 items-center justify-center rounded-[2px] border text-[13px] ${
                    state === "done"
                      ? "border-(--c-ink) bg-(--c-ink) text-white"
                      : state === "active"
                        ? "border-(--c-ink) border-2 bg-(--c-surface) text-(--c-ink)"
                        : "border-(--c-rule) bg-(--c-surface) text-(--c-ink-2)"
                  }`}
                >
                  {state === "done" ? "✓" : i + 1}
                </span>
                {!isLast && (
                  <span
                    aria-hidden
                    className={`w-px flex-1 my-1 ${
                      state === "done" ? "bg-(--c-ink)" : "bg-(--c-rule)"
                    }`}
                  />
                )}
              </div>

              {/* Conteúdo do passo */}
              <div className={`flex-1 pb-8 ${isLast ? "pb-0" : ""}`}>
                {state === "active" ? (
                  <p className="t-display text-[22px] leading-snug text-(--c-ink)">
                    {meta.title}
                  </p>
                ) : (
                  <p
                    className={`text-sm font-medium pt-1.5 ${
                      state === "pending"
                        ? "text-(--c-ink-2)"
                        : "text-(--c-ink)"
                    }`}
                  >
                    {meta.short}
                  </p>
                )}

                {state === "active" && (
                  <div className="mt-3 flex flex-col gap-4">
                    <p className="text-[15px] text-(--c-ink-2) leading-relaxed max-w-[52ch]">
                      {meta.description}
                    </p>

                    {order.adminMessage && (
                      <div className="surface-sunken rounded-[3px] px-4 py-3 text-[15px] text-(--c-ink) leading-relaxed max-w-[52ch]">
                        <span className="meta text-(--c-ink-2) block mb-1">
                          Recado da equipe
                        </span>
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
                            className="btn btn-quiet"
                          >
                            Ver a prévia do site
                          </a>
                        )}
                        {isPaid ? (
                          <p className="text-[15px] text-(--c-ink)">
                            Pagamento confirmado — publicando o site.
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
                        className="btn btn-ink self-start"
                      >
                        Ver nosso site no ar
                      </a>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

    </div>
  );
}
