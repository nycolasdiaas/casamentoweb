"use client";

import { useActionState } from "react";
import { startPaymentAction } from "@/app/actions/payment-actions";
import { CONTACT } from "@/lib/site";

export default function PaymentButton({ amountLabel }: { amountLabel: string }) {
  const [state, action, pending] = useActionState(startPaymentAction, undefined);

  return (
    <form action={action} className="flex flex-col items-center gap-2 w-full">
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-(--color-olive) text-white text-sm font-medium px-8 py-3.5 transition-transform hover:scale-105 disabled:opacity-60 disabled:hover:scale-100"
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
