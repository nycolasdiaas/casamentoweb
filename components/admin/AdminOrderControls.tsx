"use client";

import { useActionState } from "react";
import { CopiarLink } from "@/components/ui/prensa";
import { useFormStatus } from "react-dom";
import {
  saveOrderAdminAction,
  enviarRecadoAction,
} from "@/app/actions/admin-order-actions";
import {
  ORDER_STATUSES,
  STATUS_META,
  type OrderStatus,
} from "@/lib/orderStatus";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn btn-ink btn-sm self-start"
    >
      {pending ? "Salvando…" : "Salvar alterações"}
    </button>
  );
}

const inputClass = "campo";
const labelClass = "flex flex-col gap-1 text-xs text-(--c-ink-2)";

export default function AdminOrderControls({
  orderId,
  status,
  previewUrl,
  siteUrl,
  priceCents,
  paymentStatus,
  defaultPriceCents,
}: {
  orderId: string;
  status: OrderStatus;
  previewUrl: string | null;
  siteUrl: string | null;
  priceCents: number | null;
  paymentStatus: string | null;
  defaultPriceCents: number;
}) {
  const priceReais =
    priceCents != null ? (priceCents / 100).toFixed(2).replace(".", ",") : "";
  const placeholderReais = (defaultPriceCents / 100)
    .toFixed(2)
    .replace(".", ",");
  const efetivo = ((priceCents ?? defaultPriceCents) / 100)
    .toFixed(2)
    .replace(".", ",");

  return (
    <>
      {/* ── A FICHA: o que o sistema já sabe ───────────────────────────────

          Estes eram CAMPOS DE TEXTO que o operador preenchia à mão. Não são
          mais, e a razão é que nunca precisaram ser:

          · o link da prévia é escrito por `provision.ts` no instante em que o
            site nasce, a partir do `preview_token`;
          · o link do site é escrito por `publishSiteForOrder` quando ele entra
            no ar, a partir do `slug`;
          · o valor efetivo é o do pacote, salvo quando há um valor combinado.

          Pedir que alguém digite o que o sistema acabou de gravar é convite a
          divergirem — e um link de prévia digitado errado manda o casal para
          uma página que não existe, num e-mail que já saiu. Agora é ficha: o
          sistema mostra, o operador copia. */}
      <dl className="flex flex-col gap-3 border-t border-(--c-rule) bg-(--c-base) p-4 text-xs">
        <Linha rotulo="Link da prévia" valor={previewUrl} />
        <Linha rotulo="Link do site no ar" valor={siteUrl} />
        <div className="flex flex-wrap items-baseline gap-x-2">
          <dt className="text-(--c-ink-2)">Valor cobrado</dt>
          <dd className="font-semibold text-(--c-ink)">R$ {efetivo}</dd>
          {priceCents == null && (
            <span className="text-(--c-ink-2)">(o do pacote)</span>
          )}
        </div>
        {paymentStatus && (
          <div className="flex flex-wrap items-baseline gap-x-2">
            <dt className="text-(--c-ink-2)">Pagamento</dt>
            <dd
              className={
                paymentStatus === "PAID"
                  ? "font-semibold text-(--c-ok)"
                  : "font-semibold text-(--c-ink)"
              }
            >
              {paymentStatus}
            </dd>
          </div>
        )}
      </dl>

      {/* ── O QUE AINDA SE DECIDE À MÃO ────────────────────────────────────

          Sobraram dois, e os dois são decisão de gente: em que etapa o pedido
          está, e um valor combinado fora da tabela. O resto o sistema resolve.

          Os campos de link não estão mais aqui — e é por isso que
          `saveOrderAdminAction` passou a usar `formData.has`: campo ausente
          significa "não mexi", nunca "apague". */}
      <form
        action={saveOrderAdminAction}
        className="flex flex-col gap-3 border-t border-(--c-rule) p-4"
      >
        <input type="hidden" name="orderId" value={orderId} />

        <label className={labelClass}>
          Etapa do pedido
          <select name="status" defaultValue={status} className={inputClass}>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].adminLabel}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          Valor combinado (R$) — vazio cobra o do pacote ({placeholderReais})
          <input
            type="text"
            inputMode="decimal"
            name="priceReais"
            defaultValue={priceReais}
            placeholder={placeholderReais}
            className={`${inputClass} max-w-40`}
          />
        </label>

        <SubmitButton />
      </form>

      <EnviarRecado orderId={orderId} />
    </>
  );
}

/** Uma linha da ficha: rótulo, valor e o botão de copiar. */
function Linha({ rotulo, valor }: { rotulo: string; valor: string | null }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <dt className="text-(--c-ink-2)">{rotulo}</dt>
      {valor ? (
        <>
          <dd className="min-w-0 break-all text-(--c-ink)">
            <a
              href={valor}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              {valor}
            </a>
          </dd>
          <CopiarLink url={valor} />
        </>
      ) : (
        /* Vazio não é erro: a prévia só existe depois que o site é
           provisionado, e o link do site só depois que ele entra no ar. Dizer
           POR QUE está vazio evita o operador procurar campo para preencher. */
        <dd className="text-(--c-ink-2)">— ainda não existe</dd>
      )}
    </div>
  );
}

/**
 * Mandar um recado para o casal — migração 0022.
 *
 * ── Por que é um formulário SEPARADO, e não mais um campo no de cima ───────
 *
 * O formulário de cima SALVA ESTADO: etapa, links, valor. Salvar duas vezes o
 * mesmo valor não faz nada, e é por isso que ele pode ser salvo à vontade.
 *
 * Mandar recado é um ENVIO: sai um e-mail para uma pessoa real e não volta.
 * Juntar os dois faria "Salvar alterações" disparar e-mail toda vez que
 * alguém corrigisse um link — e a segunda vez que isso acontecesse com um
 * cliente de verdade seria tarde demais para desfazer.
 *
 * O campo antigo "Recado para o casal" continua acima, e continua sendo outra
 * coisa: ele é um texto fixo que aparece no acompanhamento, sobrescrito a cada
 * salvamento. Este aqui é uma mensagem, com histórico e leitura. A
 * aposentadoria daquele é um passo separado.
 */
function EnviarRecado({ orderId }: { orderId: string }) {
  const [estado, action, pending] = useActionState(
    enviarRecadoAction,
    undefined,
  );

  return (
    <form
      action={action}
      className="mt-4 flex flex-col gap-3 border-t border-(--c-rule) pt-4"
    >
      <input type="hidden" name="orderId" value={orderId} />

      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-(--c-ink)">
          Mandar um recado para o casal
        </span>
        <span className="text-xs text-(--c-ink-2)">
          Aparece no sino do painel deles e dispara um e-mail avisando. O e-mail
          leva o título e um link — o texto o casal lê no painel.
        </span>
      </div>

      <label className={labelClass}>
        Título
        <input
          type="text"
          name="titulo"
          required
          maxLength={80}
          placeholder="Ex: A prévia de vocês está pronta"
          className={inputClass}
        />
      </label>

      <label className={labelClass}>
        Recado
        <textarea
          name="corpo"
          rows={3}
          required
          maxLength={2000}
          placeholder="Escreva como se estivesse falando com eles."
          className={`${inputClass} resize-y`}
        />
      </label>

      {estado?.error && (
        <p className="text-xs text-(--c-mark)">{estado.error}</p>
      )}
      {estado?.ok && (
        <p className="text-xs text-(--c-ok)">
          Recado enviado. O casal recebeu um e-mail avisando.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn btn-sm self-start"
      >
        {pending ? "Enviando…" : "Enviar recado"}
      </button>
    </form>
  );
}
