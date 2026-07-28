"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { saveOrderAdminAction } from "@/app/actions/admin-order-actions";
import { ORDER_STATUSES, STATUS_META, type OrderStatus } from "@/lib/orderStatus";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary w-full">
      {pending ? "Salvando..." : "Salvar"}
    </button>
  );
}

const inputClass =
  "rounded-lg border border-(--color-gold)/40 bg-white px-3 py-2 text-sm text-(--color-olive) focus:border-(--color-gold) focus:outline-none";
const labelClass = "flex flex-col gap-1 text-xs text-(--color-olive)/70";

/**
 * Painel de controle de um pedido.
 *
 * A regra é: no caminho normal a equipe só troca a ETAPA e salva. Link de
 * prévia, link do site, valor e recado são derivados (do pedido, do pacote e
 * da própria etapa) e ficam recolhidos em "ajustes". Antes os quatro eram
 * campos vazios que na prática viravam preenchimento obrigatório — era o que
 * não fazia sentido na tela antiga.
 */
export default function AdminOrderControls({
  orderId,
  status,
  previewUrl,
  siteUrl,
  priceCents,
  adminMessage,
  paymentStatus,
  defaultPriceCents,
  suggestedPreviewUrl,
  suggestedSiteUrl,
}: {
  orderId: string;
  status: OrderStatus;
  previewUrl: string | null;
  siteUrl: string | null;
  priceCents: number | null;
  adminMessage: string | null;
  paymentStatus: string | null;
  defaultPriceCents: number;
  suggestedPreviewUrl: string;
  suggestedSiteUrl: string;
}) {
  // Campo já nasce com a sugestão quando ainda está vazio: salvar sem tocar
  // em nada grava o link certo.
  const [preview, setPreview] = useState(previewUrl ?? suggestedPreviewUrl);
  const [site, setSite] = useState(siteUrl ?? suggestedSiteUrl);
  const [showTweaks, setShowTweaks] = useState(false);

  const priceReais =
    priceCents != null ? (priceCents / 100).toFixed(2).replace(".", ",") : "";
  const placeholderReais = (defaultPriceCents / 100)
    .toFixed(2)
    .replace(".", ",");

  return (
    <form
      action={saveOrderAdminAction}
      className="flex flex-col gap-4 rounded-xl border border-(--color-gold)/40 bg-white p-5"
    >
      <input type="hidden" name="orderId" value={orderId} />

      <label className={labelClass}>
        Etapa do pedido
        <select
          name="status"
          defaultValue={status}
          className={`${inputClass} font-medium`}
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].adminLabel}
            </option>
          ))}
        </select>
      </label>

      <p className="rounded-lg bg-(--color-paper) px-3 py-2 text-xs leading-relaxed text-(--color-olive)/75">
        Ao salvar, o casal já passa a ver a mensagem desta etapa. Valor (
        {placeholderReais}) e links vão preenchidos automaticamente.
      </p>

      <SubmitButton />

      <button
        type="button"
        onClick={() => setShowTweaks((v) => !v)}
        className="self-start text-xs text-(--color-olive)/70 underline underline-offset-4 hover:text-(--color-olive)"
      >
        {showTweaks ? "Ocultar ajustes" : "Ajustar links, valor ou recado"}
      </button>

      {showTweaks && (
        <div className="flex flex-col gap-3 border-t border-(--color-gold)/30 pt-4">
          <label className={labelClass}>
            Link da prévia (o casal vê)
            <input
              type="url"
              name="previewUrl"
              value={preview}
              onChange={(event) => setPreview(event.target.value)}
              placeholder={suggestedPreviewUrl}
              className={inputClass}
            />
            {preview !== suggestedPreviewUrl && (
              <button
                type="button"
                onClick={() => setPreview(suggestedPreviewUrl)}
                className="self-start underline underline-offset-2"
              >
                usar o link sugerido
              </button>
            )}
          </label>

          <label className={labelClass}>
            Link do site no ar
            <input
              type="url"
              name="siteUrl"
              value={site}
              onChange={(event) => setSite(event.target.value)}
              placeholder={suggestedSiteUrl}
              className={inputClass}
            />
            {site !== suggestedSiteUrl && (
              <button
                type="button"
                onClick={() => setSite(suggestedSiteUrl)}
                className="self-start underline underline-offset-2"
              >
                usar o link sugerido
              </button>
            )}
          </label>

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
            Recado extra (opcional) — entra junto com a mensagem da etapa
            <textarea
              name="adminMessage"
              rows={3}
              defaultValue={adminMessage ?? ""}
              placeholder="Só se quiser dizer algo além do texto padrão da etapa."
              className={`${inputClass} resize-y`}
            />
          </label>
        </div>
      )}

      {/* Com "ajustes" fechado os campos não existem no DOM; sem estes
          espelhos o form mandaria vazio e apagaria links/valor/recado. */}
      {!showTweaks && (
        <>
          <input type="hidden" name="previewUrl" value={preview} />
          <input type="hidden" name="siteUrl" value={site} />
          <input type="hidden" name="priceReais" value={priceReais} />
          <input type="hidden" name="adminMessage" value={adminMessage ?? ""} />
        </>
      )}

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
    </form>
  );
}
