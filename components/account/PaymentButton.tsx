"use client";

import { useActionState } from "react";
import { startPaymentAction } from "@/app/actions/payment-actions";
import { CONTACT } from "@/lib/site";

export default function PaymentButton({ amountLabel }: { amountLabel: string }) {
  const [state, action, pending] = useActionState(startPaymentAction, undefined);

  return (
    <form action={action} className="flex flex-col items-center gap-3 w-full">
      <label className="flex flex-col gap-1 w-full text-left">
        <span className="text-xs text-(--color-olive)/70">
          CPF do pagador{" "}
          <span className="text-(--color-muted)">(exigido pelo PIX)</span>
        </span>
        <input
          name="payerTaxId"
          inputMode="numeric"
          required
          maxLength={14}
          placeholder="000.000.000-00"
          className="rounded-lg border border-(--color-gold)/40 bg-white px-3 py-2 text-sm text-(--color-olive) focus:border-(--color-gold) focus:outline-none"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-(--color-olive) text-white text-sm font-medium px-8 py-3.5 transition-transform hover:scale-105 disabled:opacity-60 disabled:hover:scale-100"
      >
        {pending ? "Abrindo pagamento..." : `Efetuar pagamento · ${amountLabel}`}
      </button>
      <p className="text-[11px] text-(--color-muted)">
        Pagamento por PIX · ambiente seguro
      </p>
      {state?.error && (
        <p className="text-xs text-red-700 text-center max-w-xs">
          {state.error}{" "}
          <a
            href={`https://wa.me/${CONTACT.whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            Falar no WhatsApp
          </a>
        </p>
      )}
    </form>
  );
}
