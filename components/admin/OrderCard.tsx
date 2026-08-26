"use client";

import { useState } from "react";
import { type OrderStatus } from "@/lib/orderStatus";
import { EtiquetaDoPedido } from "@/components/ui/prensa";
import AdminOrderControls from "./AdminOrderControls";

export type AuditEntry = {
  adminName: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  when: string;
};

export type AdminOrder = {
  id: string;
  status: OrderStatus;
  coupleName: string;
  packageName: string;
  whatsapp: string | null;
  updatedAt: string;
  json: string;
  fullPrompt: string;
  previewUrl: string | null;
  siteUrl: string | null;
  priceCents: number | null;
  adminMessage: string | null;
  paymentStatus: string | null;
  defaultPriceCents: number;
  auditLog: AuditEntry[];
};

function CopyButton({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      el.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="btn btn-quiet btn-sm"
    >
      {copied ? "Copiado ✓" : label}
    </button>
  );
}

/**
 * A etiqueta saiu daqui e passou a ser a do sistema.
 *
 * O que havia era `bg-(--c-ink) text-white` — e no tema ESCURO do admin
 * `--c-ink` é `#f2f2ef`, quase branco. O resultado era texto branco sobre
 * fundo branco: a etiqueta de status ficava invisível em todos os pedidos que
 * não fossem rascunho ou publicado.
 *
 * É a armadilha de reaproveitar o nome do token entre os dois temas: `--c-ink`
 * significa "cor do texto", e usá-lo como FUNDO só funciona onde o texto é
 * escuro. `EtiquetaDoPedido` usa contorno e os semânticos, que viram nos dois
 * temas — e é a mesma que o casal vê, então os dois lados chamam o estado pelo
 * mesmo nome.
 */
export default function OrderCard({ order }: { order: AdminOrder }) {
  const [openJson, setOpenJson] = useState(false);
  const [openManage, setOpenManage] = useState(false);
  const [openHistory, setOpenHistory] = useState(false);

  return (
    <li className="border border-(--c-rule) bg-(--c-surface)">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="t-display text-[19px] leading-none text-(--c-ink)">
              {order.coupleName}
            </span>
            <EtiquetaDoPedido status={order.status as OrderStatus} />
          </div>
          <span className="t-corpo-p text-(--c-ink-2)">
            {order.packageName}
            {order.whatsapp ? ` · ${order.whatsapp}` : ""} · {order.updatedAt}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setOpenManage((v) => !v)}
            className="btn btn-ink btn-sm"
          >
            {openManage ? "Fechar" : "Gerenciar"}
          </button>
          <CopyButton label="Copiar JSON" text={order.json} />
          <CopyButton label="Copiar prompt + pedido" text={order.fullPrompt} />
          <button
            type="button"
            onClick={() => setOpenJson((v) => !v)}
            className="text-[12.5px] text-(--c-ink-2) underline underline-offset-4 hover:text-(--c-ink)"
          >
            {openJson ? "ocultar" : "ver JSON"}
          </button>
          <button
            type="button"
            onClick={() => setOpenHistory((v) => !v)}
            className="text-[12.5px] text-(--c-ink-2) underline underline-offset-4 hover:text-(--c-ink)"
          >
            {openHistory
              ? "ocultar histórico"
              : `histórico (${order.auditLog.length})`}
          </button>
        </div>
      </div>

      {openHistory && (
        <div className="border-t border-(--c-rule) bg-(--c-base) p-4">
          {order.auditLog.length === 0 ? (
            <p className="t-corpo-p text-(--c-ink-2)">
              Nenhuma alteração registrada ainda.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {order.auditLog.map((entry, i) => (
                <li
                  key={i}
                  className="t-corpo-p text-(--c-ink-2)"
                >
                  <span className="font-semibold">{entry.adminName}</span>{" "}
                  mudou <span className="italic">{entry.field}</span>
                  {": "}
                  <span className="text-(--c-ink-2)">
                    {entry.oldValue ?? "vazio"}
                  </span>{" "}
                  → {entry.newValue ?? "vazio"}
                  <span className="text-(--c-ink-2)"> · {entry.when}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {openManage && (
        <AdminOrderControls
          orderId={order.id}
          status={order.status}
          previewUrl={order.previewUrl}
          siteUrl={order.siteUrl}
          priceCents={order.priceCents}
          adminMessage={order.adminMessage}
          paymentStatus={order.paymentStatus}
          defaultPriceCents={order.defaultPriceCents}
        />
      )}

      {openJson && (
        <pre className="overflow-x-auto bg-(--c-base) border-t border-(--c-rule) p-4 text-xs font-mono text-(--c-ink) whitespace-pre">
          {order.json}
        </pre>
      )}
    </li>
  );
}
