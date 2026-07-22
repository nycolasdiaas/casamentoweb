"use client";

import { useState } from "react";

export type AdminOrder = {
  id: string;
  status: "draft" | "submitted";
  coupleName: string;
  packageName: string;
  whatsapp: string | null;
  updatedAt: string;
  json: string;
  fullPrompt: string;
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

export default function OrderCard({ order }: { order: AdminOrder }) {
  const [open, setOpen] = useState(false);
  const isSubmitted = order.status === "submitted";

  return (
    <li className="border border-(--color-gold)/50 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="font-serif text-base text-(--color-olive)">
              {order.coupleName}
            </span>
            <span
              className={`text-[10px] tracking-[0.1em] uppercase px-2 py-0.5 ${
                isSubmitted
                  ? "bg-(--color-olive) text-white"
                  : "bg-(--color-blush) text-(--color-olive)/70"
              }`}
            >
              {isSubmitted ? "enviado" : "rascunho"}
            </span>
          </div>
          <span className="font-serif text-xs text-(--color-muted)">
            {order.packageName}
            {order.whatsapp ? ` · ${order.whatsapp}` : ""} · {order.updatedAt}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyButton label="Copiar JSON" text={order.json} />
          <CopyButton label="Copiar prompt + pedido" text={order.fullPrompt} />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="font-serif text-xs tracking-[0.05em] text-(--color-olive) underline"
          >
            {open ? "ocultar" : "ver JSON"}
          </button>
        </div>
      </div>

      {open && (
        <pre className="overflow-x-auto bg-(--color-paper) border-t border-(--color-gold)/40 p-4 text-xs font-mono text-(--color-olive) whitespace-pre">
          {order.json}
        </pre>
      )}
    </li>
  );
}
