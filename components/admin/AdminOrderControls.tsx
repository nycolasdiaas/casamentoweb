"use client";

import { useFormStatus } from "react-dom";
import { saveOrderAdminAction } from "@/app/actions/admin-order-actions";
import { ORDER_STATUSES, STATUS_META, type OrderStatus } from "@/lib/orderStatus";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="self-start rounded-full bg-(--color-olive) text-white text-xs font-medium px-5 py-2.5 transition-colors hover:bg-(--color-olive)/90 disabled:opacity-60"
    >
      {pending ? "Salvando..." : "Salvar alterações"}
    </button>
  );
}

const inputClass =
  "rounded-lg border border-(--color-gold)/40 bg-white px-3 py-2 text-sm text-(--color-olive) focus:border-(--color-gold) focus:outline-none";
const labelClass = "flex flex-col gap-1 text-xs text-(--color-olive)/70";

export default function AdminOrderControls({
  orderId,
  status,
  previewUrl,
  siteUrl,
  priceCents,
  adminMessage,
  paymentStatus,
  defaultPriceCents,
}: {
  orderId: string;
  status: OrderStatus;
  previewUrl: string | null;
  siteUrl: string | null;
  priceCents: number | null;
  adminMessage: string | null;
  paymentStatus: string | null;
  defaultPriceCents: number;
}) {
  const priceReais =
    priceCents != null ? (priceCents / 100).toFixed(2).replace(".", ",") : "";
  const placeholderReais = (defaultPriceCents / 100)
    .toFixed(2)
    .replace(".", ",");

  return (
    <form
      action={saveOrderAdminAction}
      className="flex flex-col gap-3 border-t border-(--color-gold)/40 bg-(--color-paper) p-4"
    >
      <input type="hidden" name="orderId" value={orderId} />

      <label className={labelClass}>
        Etapa do pedido
        <select
          name="status"
          defaultValue={status}
          className={inputClass}
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].adminLabel}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className={labelClass}>
          Link da prévia (o casal vê)
          <input
            type="url"
            name="previewUrl"
            defaultValue={previewUrl ?? ""}
            placeholder="https://..."
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Link do site no ar
          <input
            type="url"
            name="siteUrl"
            defaultValue={siteUrl ?? ""}
            placeholder="https://..."
            className={inputClass}
          />
        </label>
      </div>

      <label className={labelClass}>
        Valor a cobrar (R$) — vazio usa o do pacote ({placeholderReais})
        <input
          type="text"
          inputMode="decimal"
          name="priceReais"
          defaultValue={priceReais}
          placeholder={placeholderReais}
          className={`${inputClass} max-w-40`}
        />
      </label>

      <label className={labelClass}>
        Recado para o casal (aparece no acompanhamento)
        <textarea
          name="adminMessage"
          rows={2}
          defaultValue={adminMessage ?? ""}
          placeholder="Ex: A prévia está pronta! Deem uma olhada e qualquer ajuste é só falar."
          className={`${inputClass} resize-y`}
        />
      </label>

      {paymentStatus && (
        <p className="text-xs text-(--color-muted)">
          Pagamento:{" "}
          <span
            className={
              paymentStatus === "PAID"
                ? "font-semibold text-(--color-olive)"
                : "font-semibold"
            }
          >
            {paymentStatus}
          </span>
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
