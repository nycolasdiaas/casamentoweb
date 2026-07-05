"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Gift } from "@/components/gifts/GiftGallery";
import { registerContributionAction } from "@/app/actions/gift-actions";
import { formatPriceCents } from "@/lib/format";
import {
  PIX_KEY,
  PIX_COPIA_E_COLA,
  PIX_RECIPIENT,
  PIX_INSTITUTION,
  PIX_QR_IMAGE,
} from "@/lib/pix";

export default function GiftPixModal({
  gift,
  onClose,
}: {
  gift: Gift;
  onClose: () => void;
}) {
  const [guestName, setGuestName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function handleConfirm() {
    setSubmitting(true);
    try {
      await registerContributionAction({ giftId: gift.id, guestName });
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Presentear: ${gift.name}`}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md max-h-[90dvh] overflow-y-auto bg-(--color-paper) border border-(--color-gold) p-6 flex flex-col gap-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-base text-(--color-olive) leading-snug">
              {gift.name}
            </h2>
            <p className="font-serif text-2xl text-(--color-olive)">
              {formatPriceCents(gift.priceCents)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="font-serif text-xl text-(--color-muted) leading-none"
          >
            ×
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="font-script text-2xl text-(--color-olive)">
              Muito obrigado!
            </p>
            <p className="font-serif text-sm text-(--color-olive) max-w-xs">
              {guestName.trim()
                ? `${guestName.trim()}, seu carinho já está guardado no coração (e no Mercado Pago).`
                : "Seu carinho já está guardado no coração (e no Mercado Pago), misterioso(a)."}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 bg-(--color-olive) text-white px-6 py-2 font-serif text-xs tracking-[0.1em]"
            >
              Fechar
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center gap-2">
              <div className="border border-(--color-gold) bg-white p-2">
                <Image
                  src={PIX_QR_IMAGE}
                  alt="QR Code Pix"
                  width={208}
                  height={208}
                  unoptimized
                />
              </div>
              <p className="font-serif text-xs text-(--color-muted) text-center">
                {PIX_RECIPIENT} · {PIX_INSTITUTION}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <CopyField label="Pix copia e cola" value={PIX_COPIA_E_COLA} />
              <CopyField label="Chave Pix" value={PIX_KEY} />
            </div>

            <div className="border-t border-(--color-gold) pt-4 flex flex-col gap-3">
              <p className="font-serif text-xs text-(--color-olive) leading-relaxed">
                Fez o Pix? Conte pra gente quem você é — ou fique no
                mistério, prometemos investigar com carinho.
              </p>
              <input
                type="text"
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
                placeholder="Seu nome (opcional)"
                maxLength={120}
                className="border border-(--color-gold) bg-white px-3 py-2 text-sm font-serif"
              />
              <button
                type="button"
                onClick={handleConfirm}
                disabled={submitting}
                className="bg-(--color-olive) text-white py-2 font-serif text-xs tracking-[0.1em] disabled:opacity-60"
              >
                {submitting ? "Enviando..." : "Já fiz o Pix 💚"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2 border border-(--color-gold) bg-white px-3 py-2">
      <div className="flex-1 min-w-0 flex flex-col">
        <span className="font-serif text-[10px] tracking-[0.1em] uppercase text-(--color-muted)">
          {label}
        </span>
        <span className="font-mono text-xs text-(--color-olive) truncate">
          {value}
        </span>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className={`shrink-0 font-serif text-xs px-3 py-1 border transition-colors ${
          copied
            ? "bg-(--color-olive) border-(--color-olive) text-white"
            : "border-(--color-gold) text-(--color-olive)"
        }`}
      >
        {copied ? "Copiado!" : "Copiar"}
      </button>
    </div>
  );
}
