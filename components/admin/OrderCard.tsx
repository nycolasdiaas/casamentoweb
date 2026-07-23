"use client";

import { useState } from "react";
import { STATUS_META, type OrderStatus } from "@/lib/orderStatus";
import AdminOrderControls from "./AdminOrderControls";

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
      className="font-serif text-xs tracking-[0.05em] border border-(--color-gold) text-(--color-olive) px-3 py-2 transition-colors hover:bg-(--color-blush)"
    >
      {copied ? "Copiado ✓" : label}
    </button>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const meta = STATUS_META[status];
  const tone =
    status === "draft"
      ? "bg-(--color-blush) text-(--color-olive)/70"
      : status === "published"
        ? "bg-(--color-gold) text-white"
        : "bg-(--color-olive) text-white";
  return (
    <span
      className={`text-[10px] tracking-[0.1em] uppercase px-2 py-0.5 ${tone}`}
    >
      {meta.icon} {meta.adminLabel}
    </span>
  );
}

export default function OrderCard({ order }: { order: AdminOrder }) {
  const [openJson, setOpenJson] = useState(false);
  const [openManage, setOpenManage] = useState(false);

  return (
    <li className="border border-(--color-gold)/50 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-serif text-base text-(--color-olive)">
              {order.coupleName}
            </span>
            <StatusBadge status={order.status} />
          </div>
          <span className="font-serif text-xs text-(--color-muted)">
            {order.packageName}
            {order.whatsapp ? ` · ${order.whatsapp}` : ""} · {order.updatedAt}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setOpenManage((v) => !v)}
            className="font-serif text-xs tracking-[0.05em] border border-(--color-olive) bg-(--color-olive) text-white px-3 py-2 transition-colors hover:bg-(--color-olive)/90"
          >
            {openManage ? "Fechar" : "Gerenciar"}
          </button>
          <CopyButton label="Copiar JSON" text={order.json} />
          <CopyButton label="Copiar prompt + pedido" text={order.fullPrompt} />
          <button
            type="button"
            onClick={() => setOpenJson((v) => !v)}
            className="font-serif text-xs tracking-[0.05em] text-(--color-olive) underline"
          >
            {openJson ? "ocultar" : "ver JSON"}
          </button>
        </div>
      </div>

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
        <pre className="overflow-x-auto bg-(--color-paper) border-t border-(--color-gold)/40 p-4 text-xs font-mono text-(--color-olive) whitespace-pre">
          {order.json}
        </pre>
      )}
    </li>
  );
}
