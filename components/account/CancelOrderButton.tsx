"use client";

import { cancelOrderAction } from "@/app/actions/account-actions";

export default function CancelOrderButton({
  orderId,
  label = "Cancelar pedido",
}: {
  orderId: string;
  label?: string;
}) {
  return (
    <form
      action={cancelOrderAction}
      onSubmit={(e) => {
        if (
          !confirm(
            "Tem certeza que quer cancelar este pedido? Essa ação não pode ser desfeita."
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="orderId" value={orderId} />
      <button
        type="submit"
        className="whitespace-nowrap text-[13px] text-(--c-ink-2) underline underline-offset-2 transition-colors hover:text-(--c-mark) cursor-pointer"
      >
        {label}
      </button>
    </form>
  );
}
