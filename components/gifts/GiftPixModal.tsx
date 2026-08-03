"use client";

import { useEffect, useMemo, useState } from "react";
import type { Gift } from "@/components/gifts/GiftGallery";
import { registerContributionAction } from "@/app/actions/gift-actions";
import { formatPriceCents } from "@/lib/format";
import { buildBrCode } from "@/lib/pix/brcode";

/**
 * O que o convidado vê ao presentear.
 *
 * Este componente NÃO importa nada de um módulo de Pix global — e é o ponto
 * inteiro da correção. Antes ele lia constantes de `lib/pix.ts`, então todo
 * casal com lista de presentes mostrava a chave da mesma pessoa: o convidado
 * pagava achando que presenteava os noivos e o dinheiro ia para outra conta.
 *
 * Agora o Pix desce por prop, resolvido a partir do site. `pix` pode ser
 * `null`, e esse caso é tratado de propósito: sem chave própria, o convidado
 * não vê chave nenhuma. Não presentear é melhor que presentear errado.
 */
export type PixParaConvidado = {
  chave: string;
  recebedor: string;
  cidade: string;
  instituicao: string | null;
};

export default function GiftPixModal({
  gift,
  pix,
  siteId,
  onClose,
}: {
  gift: Gift;
  pix: PixParaConvidado | null;
  siteId: string;
  onClose: () => void;
}) {
  const [guestName, setGuestName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // O BR Code é calculado aqui, e não no servidor, porque depende do valor
  // DESTA cota: gerar os N payloads no HTML mandaria ~150 bytes por presente
  // para todo convidado, sendo que ele abre um. `buildBrCode` é função pura,
  // sem dependência de servidor — cabe no cliente sem custo relevante.
  const brCode = useMemo(
    () =>
      pix &&
      buildBrCode({
        chave: pix.chave,
        recebedor: pix.recebedor,
        cidade: pix.cidade,
        valorCentavos: gift.priceCents,
        txid: gift.id.replace(/-/g, "").slice(0, 25),
      }),
    [pix, gift.priceCents, gift.id]
  );

  const qrUrl = `/api/pix/qr?site=${encodeURIComponent(
    siteId
  )}&gift=${encodeURIComponent(gift.id)}`;

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 motion-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Presentear: ${gift.name}`}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md max-h-[90dvh] overflow-y-auto bg-(--color-paper) border border-(--color-gold) p-6 flex flex-col gap-5 motion-rise-in"
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
            className="font-serif text-xl text-(--color-muted) leading-none transition-opacity hover:opacity-60"
          >
            ×
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center motion-fade-in">
            <p className="font-script text-2xl text-(--color-olive)">
              Muito obrigado!
            </p>
            <p className="font-serif text-sm text-(--color-olive) max-w-xs">
              {guestName.trim()
                ? `${guestName.trim()}, seu carinho já está guardado com a gente.`
                : "Seu carinho já está guardado com a gente, misterioso(a)."}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 bg-(--color-olive) text-white px-6 py-2 font-serif text-xs tracking-[0.1em] transition-opacity hover:opacity-85"
            >
              Fechar
            </button>
          </div>
        ) : pix && brCode ? (
          <>
            <div className="flex flex-col items-center gap-2">
              <div className="border border-(--color-gold) bg-white p-2">
                {/* <img> cru, não next/image: o QR é SVG gerado sob medida
                    para esta cota. O otimizador não otimiza SVG e ainda
                    esconderia o tamanho real atrás de um proxy. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrUrl}
                  alt={`QR Code Pix de ${formatPriceCents(gift.priceCents)}`}
                  width={208}
                  height={208}
                  className="size-52 motion-fade-in"
                />
              </div>
              <p className="font-serif text-xs text-(--color-muted) text-center">
                {pix.recebedor}
                {pix.instituicao ? ` · ${pix.instituicao}` : ""}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {/* O copia e cola vem primeiro: no celular — que é de onde o
                  convidado abre o convite — ele resolve num toque, enquanto
                  o QR exige um segundo aparelho. */}
              <CopyField label="Pix copia e cola" value={brCode} />
              <CopyField label="Chave Pix" value={pix.chave} />
            </div>

            <div className="border-t border-(--color-gold) pt-4 flex flex-col gap-3">
              <p className="font-serif text-xs text-(--color-olive) leading-relaxed">
                Fez o Pix? Conte pra gente quem você é — ou fique no mistério,
                prometemos investigar com carinho.
              </p>
              <input
                type="text"
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
                placeholder="Seu nome (opcional)"
                maxLength={120}
                className="border border-(--color-gold) bg-white px-3 py-2 text-sm font-serif transition-colors focus:border-(--color-olive) focus:outline-none"
              />
              <button
                type="button"
                onClick={handleConfirm}
                disabled={submitting}
                className="bg-(--color-olive) text-white py-2 font-serif text-xs tracking-[0.1em] transition-opacity hover:opacity-85 disabled:opacity-60"
              >
                {submitting ? "Enviando..." : "Já fiz o Pix 💚"}
              </button>
            </div>
          </>
        ) : (
          // Casal sem Pix configurado. Mostrar a lista sem forma de pagamento
          // é melhor que sumir com ela (o convidado ao menos sabe o que dar) e
          // MUITO melhor que mostrar a chave de outra pessoa.
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="font-serif text-sm text-(--color-olive) max-w-xs leading-relaxed">
              Os noivos ainda não cadastraram a chave Pix deles. Fale com eles
              para combinar como presentear.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-1 border border-(--color-olive) px-6 py-2 font-serif text-xs tracking-[0.1em] text-(--color-olive) transition-colors hover:bg-(--color-olive) hover:text-white"
            >
              Fechar
            </button>
          </div>
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
        className={`shrink-0 font-serif text-xs px-3 py-1 border transition-all active:scale-95 ${
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
