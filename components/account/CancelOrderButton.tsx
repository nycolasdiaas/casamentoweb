"use client";

import { DialogoDestrutivo } from "@/components/ui/prensa";
import { cancelOrderAction } from "@/app/actions/account-actions";

/**
 * Cancelar o pedido.
 *
 * Era um `window.confirm` escrito *"Tem certeza que quer cancelar este
 * pedido?"* — e **"Tem certeza?" é palavra banida** (Voz e Microcopy V5). Ela
 * não informa nada: a pessoa já sabe que clicou. O diálogo do sistema diz o
 * que acontece e o que sobrevive.
 */
export default function CancelOrderButton({
  orderId,
  label = "Cancelar pedido",
}: {
  orderId: string;
  label?: string;
}) {
  return (
    <DialogoDestrutivo
      gatilho={label}
      titulo="Cancelar este pedido?"
      confirmar="Cancelar pedido"
      manter="Manter o pedido"
      form={{
        action: cancelOrderAction,
        campos: <input type="hidden" name="orderId" value={orderId} />,
      }}
    >
      O pedido sai da lista de vocês e não volta. Se o site já esteve no ar, ele
      continua no ar — cancelar o pedido não apaga o site.
    </DialogoDestrutivo>
  );
}
