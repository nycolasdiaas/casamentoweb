"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  saveOrderAction,
  submitOrderAction,
} from "@/app/actions/account-actions";
import { PACKAGES, type PackageTier } from "@/lib/packages";
import { TEMPLATE_STYLES } from "@/lib/templates";
import { CONTACT } from "@/lib/site";

export type OrderData = {
  packageTier: PackageTier;
  templateStyle: string;
  coupleNames: string | null;
  weddingDate: string | null;
  photosLink: string | null;
  notes: string | null;
  status: "draft" | "submitted";
};

type ActionResult =
  | { error?: string; saved?: boolean; submitted?: boolean }
  | undefined;

export default function OrderForm({
  userName,
  order,
}: {
  userName: string;
  order: OrderData | null;
}) {
  const [state, action, pending] = useActionState(
    async (_prev: ActionResult, formData: FormData): Promise<ActionResult> => {
      const intent = formData.get("intent")?.toString();
      return intent === "submit"
        ? submitOrderAction(formData)
        : saveOrderAction(formData);
    },
    undefined
  );

  const isSubmitted = state?.submitted || order?.status === "submitted";

  if (isSubmitted && order) {
    const pkg = PACKAGES.find((p) => p.tier === order.packageTier);
    const style = TEMPLATE_STYLES.find((s) => s.id === order.templateStyle);
    const message = encodeURIComponent(
      `Oi! Acabamos de enviar nosso pedido pela plataforma 💚\n` +
        `Casal: ${order.coupleNames ?? userName}\n` +
        `Pacote: ${pkg?.name ?? order.packageTier} · Template: ${style?.name ?? order.templateStyle}` +
        (order.weddingDate ? `\nData: ${order.weddingDate}` : "")
    );

    return (
      <div className="flex flex-col items-center gap-5 rounded-2xl border border-(--color-gold)/40 bg-white p-8 text-center">
        <p className="text-2xl" aria-hidden>
          💚
        </p>
        <h2 className="text-xl font-bold tracking-tight">
          Pedido enviado!
        </h2>
        <p className="text-sm text-(--color-olive)/75 max-w-sm leading-relaxed">
          Recebemos tudo. Último passo: chamem a gente no WhatsApp pra
          confirmar e combinar a entrega — é por lá que vocês recebem a
          prévia.
        </p>
        <a
          href={`https://wa.me/${CONTACT.whatsappNumber}?text=${message}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-[#25D366] text-white text-sm font-medium px-8 py-3.5 transition-transform hover:scale-105"
        >
          Confirmar no WhatsApp
        </a>
        <div className="text-xs text-(--color-muted) border-t border-(--color-gold)/30 pt-4 w-full max-w-sm flex flex-col gap-1">
          <p>
            {pkg?.name} · {pkg?.price} · template {style?.name}
          </p>
          {order.photosLink && <p>Fotos: link recebido ✓</p>}
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-8">
      {/* Pacote */}
      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-semibold mb-1">1. Pacote</legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PACKAGES.map((pkg) => (
            <label
              key={pkg.tier}
              className="flex flex-col gap-1 rounded-xl border border-(--color-gold)/40 bg-white p-4 cursor-pointer transition-colors has-checked:border-(--color-olive) has-checked:bg-(--color-blush)"
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="packageTier"
                  value={pkg.tier}
                  defaultChecked={
                    order ? order.packageTier === pkg.tier : pkg.highlight
                  }
                  className="accent-(--color-olive)"
                />
                <span className="text-sm font-semibold">{pkg.name}</span>
              </span>
              <span className="text-lg font-bold">{pkg.price}</span>
              <span className="text-xs text-(--color-olive)/60">
                {pkg.tagline}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Template */}
      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-semibold mb-1">
          2. Estilo do template{" "}
          <Link
            href="/#estilos"
            className="font-normal text-xs underline underline-offset-4 text-(--color-olive)/70"
          >
            (ver os modelos)
          </Link>
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TEMPLATE_STYLES.map((style) => (
            <label
              key={style.id}
              className="flex flex-col gap-2 rounded-xl border border-(--color-gold)/40 bg-white p-4 cursor-pointer transition-colors has-checked:border-(--color-olive) has-checked:bg-(--color-blush)"
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="templateStyle"
                  value={style.id}
                  defaultChecked={
                    order
                      ? order.templateStyle === style.id
                      : style.id === "classico"
                  }
                  className="accent-(--color-olive)"
                />
                <span className="text-sm font-semibold">{style.name}</span>
              </span>
              <span className="flex gap-1.5">
                {style.swatches.map((color) => (
                  <span
                    key={color}
                    className="size-3.5 rounded-full border border-black/10"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Material */}
      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-semibold mb-1">
          3. Material de vocês
        </legend>
        <input
          type="text"
          name="coupleNames"
          defaultValue={order?.coupleNames ?? ""}
          placeholder="Como querem aparecer no site (ex: Ana & Pedro)"
          className="rounded-xl border border-(--color-gold)/40 bg-white px-4 py-3 text-sm focus:border-(--color-gold) focus:outline-none"
        />
        <input
          type="date"
          name="weddingDate"
          defaultValue={order?.weddingDate ?? ""}
          aria-label="Data do casamento"
          className="rounded-xl border border-(--color-gold)/40 bg-white px-4 py-3 text-sm focus:border-(--color-gold) focus:outline-none"
        />
        <input
          type="url"
          name="photosLink"
          defaultValue={order?.photosLink ?? ""}
          placeholder="Link das fotos (Google Drive, Dropbox...)"
          className="rounded-xl border border-(--color-gold)/40 bg-white px-4 py-3 text-sm focus:border-(--color-gold) focus:outline-none"
        />
        <p className="text-xs text-(--color-muted) -mt-1">
          Coloquem as fotos numa pasta compartilhada e colem o link aqui —
          qualquer um serve.
        </p>
        <textarea
          name="notes"
          rows={4}
          defaultValue={order?.notes ?? ""}
          placeholder="História de vocês, local da festa, cores preferidas... tudo que quiserem contar"
          className="rounded-xl border border-(--color-gold)/40 bg-white px-4 py-3 text-sm resize-y focus:border-(--color-gold) focus:outline-none"
        />
      </fieldset>

      {state?.error && <p className="text-sm text-red-700">{state.error}</p>}
      {state?.saved && !state.error && (
        <p className="text-sm text-(--color-olive)">
          Rascunho salvo ✓ — podem voltar e continuar depois.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          name="intent"
          value="save"
          disabled={pending}
          className="rounded-full border border-(--color-olive)/30 px-6 py-3 text-sm font-medium transition-colors hover:bg-(--color-blush) disabled:opacity-50"
        >
          {pending ? "Salvando..." : "Salvar rascunho"}
        </button>
        <button
          type="submit"
          name="intent"
          value="submit"
          disabled={pending}
          className="rounded-full bg-(--color-olive) text-white px-8 py-3 text-sm font-medium transition-colors hover:bg-(--color-olive)/90 disabled:opacity-50"
        >
          {pending ? "Enviando..." : "Enviar pedido"}
        </button>
      </div>
    </form>
  );
}
