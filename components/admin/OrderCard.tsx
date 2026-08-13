"use client";

import { useState } from "react";
import { STATUS_META, type OrderStatus } from "@/lib/orderStatus";
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
      className="font-serif text-xs tracking-[0.05em] border border-(--c-rule) text-(--c-ink) px-3 py-2 transition-colors hover:bg-(--c-sunken)"
    >
      {copied ? "Copiado ✓" : label}
    </button>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const meta = STATUS_META[status];
  const tone =
    status === "draft"
      ? "bg-(--c-sunken) text-(--c-ink-2)"
      : status === "published"
        ? "bg-(--c-mark) text-white"
        : "bg-(--c-ink) text-white";
  return (
    <span
      className={`text-[10px] tracking-[0.1em] uppercase px-2 py-0.5 ${tone}`}
    >
      {meta.adminLabel}
    </span>
  );
}

export default function OrderCard({ order }: { order: AdminOrder }) {
  const [openJson, setOpenJson] = useState(false);
  const [openManage, setOpenManage] = useState(false);
  const [openHistory, setOpenHistory] = useState(false);

  return (
    <li className="border border-(--c-rule) bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-serif text-base text-(--c-ink)">
              {order.coupleName}
            </span>
            <StatusBadge status={order.status} />
          </div>
          <span className="font-serif text-xs text-(--c-ink-2)">
            {order.packageName}
            {order.whatsapp ? ` · ${order.whatsapp}` : ""} · {order.updatedAt}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setOpenManage((v) => !v)}
            className="font-serif text-xs tracking-[0.05em] border border-(--c-ink) bg-(--c-ink) text-white px-3 py-2 transition-colors hover:bg-(--c-ink)/90"
          >
            {openManage ? "Fechar" : "Gerenciar"}
          </button>
          <CopyButton label="Copiar JSON" text={order.json} />
          <CopyButton label="Copiar prompt + pedido" text={order.fullPrompt} />
          <button
            type="button"
            onClick={() => setOpenJson((v) => !v)}
            className="font-serif text-xs tracking-[0.05em] text-(--c-ink) underline"
          >
            {openJson ? "ocultar" : "ver JSON"}
          </button>
          <button
            type="button"
            onClick={() => setOpenHistory((v) => !v)}
            className="font-serif text-xs tracking-[0.05em] text-(--c-ink) underline"
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
            <p className="font-serif text-xs text-(--c-ink-2)">
              Nenhuma alteração registrada ainda.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {order.auditLog.map((entry, i) => (
                <li
                  key={i}
                  className="font-serif text-xs text-(--c-ink)/85 leading-relaxed"
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
