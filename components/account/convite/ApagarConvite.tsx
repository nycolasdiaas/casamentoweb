"use client";

import { DialogoDestrutivo } from "@/components/ui/prensa";
import { apagarConviteAction } from "@/app/actions/invite-actions";

/**
 * Apagar o convite inteiro, com confirmação.
 *
 * Diferente de apagar um bloco, isto NÃO tem desfazer: o documento sai do
 * banco e o desenho não volta. Por isso a pergunta nomeia o convite — "Apagar
 * Convite 2?" é uma pergunta que dá para responder; "tem certeza?" é uma que
 * se responde no automático.
 *
 * O `confirm` nativo saiu: a copy já estava certa, mas a moldura era a do
 * sistema operacional no meio de uma interface que cuidou de fio e raio o
 * produto inteiro. `DialogoDestrutivo` traz o desenho da prancha A4 e o botão
 * que repete o verbo perigoso. A action continua a mesma, com a mesma
 * verificação de dono.
 */
export default function ApagarConvite({
  siteId,
  inviteId,
  orderId,
  nome,
}: {
  siteId: string;
  inviteId: string;
  orderId: string;
  nome: string;
}) {
  return (
    <DialogoDestrutivo
      gatilho="Apagar convite"
      titulo={`Apagar "${nome}"?`}
      confirmar="Apagar convite"
      manter="Manter"
      form={{
        action: apagarConviteAction,
        campos: (
          <>
            <input type="hidden" name="siteId" value={siteId} />
            <input type="hidden" name="inviteId" value={inviteId} />
            <input type="hidden" name="orderId" value={orderId} />
          </>
        ),
      }}
    >
      O desenho não volta. Os outros convites de vocês continuam como estão.
    </DialogoDestrutivo>
  );
}
