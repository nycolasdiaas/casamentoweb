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
        className="text-xs text-red-700 underline underline-offset-2 hover:text-red-800"
      >
        {label}
      </button>
    </form>
  );
}
