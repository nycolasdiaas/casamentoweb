"use client";

import { useActionState } from "react";
import { startPaymentAction } from "@/app/actions/payment-actions";

export default function PaymentButton({
  orderId,
  amountLabel,
}: {
  orderId: string;
  amountLabel: string;
}) {
  const [state, action, pending] = useActionState(startPaymentAction, undefined);

  return (
    <form action={action} className="flex flex-col items-center gap-3 w-full">
      <input type="hidden" name="orderId" value={orderId} />
      <label className="flex flex-col gap-1 w-full text-left">
        <span className="text-xs text-(--c-ink-2)">
          CPF do pagador{" "}
          <span className="text-(--c-ink-2)">(exigido pelo PIX)</span>
        </span>
        <input
          name="payerTaxId"
          inputMode="numeric"
          required
          maxLength={14}
          placeholder="000.000.000-00"
          className="rounded-[3px] border border-(--c-rule) bg-white px-3 py-2 text-sm text-(--c-ink) focus:border-(--c-rule) focus:outline-none"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="btn btn-ink w-full"
      >
        {pending ? "Abrindo pagamento..." : `Efetuar pagamento · ${amountLabel}`}
      </button>
      <p className="text-[11px] text-(--c-ink-2)">
        Pagamento por PIX · ambiente seguro
      </p>
      {state?.error && (
        <p className="text-xs text-(--c-mark) text-center max-w-xs">
          {state.error}
        </p>
      )}
    </form>
  );
}
