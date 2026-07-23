"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  Cormorant_Garamond,
  Archivo,
  Great_Vibes,
  Playfair_Display,
  Dancing_Script,
  Poiret_One,
  Josefin_Sans,
  Amatic_SC,
} from "next/font/google";
import {
  saveOrderAction,
  submitOrderAction,
} from "@/app/actions/account-actions";
import { PACKAGES, type PackageTier } from "@/lib/packages";
import { TEMPLATE_STYLES } from "@/lib/templates";
import {
  COLOR_PRESETS,
  FONT_STYLES,
  type FontStyleId,
} from "@/lib/customization";
import { CONTACT, WHATSAPP_LINK } from "@/lib/site";
import type { OrderStatus } from "@/lib/orderStatus";

const fontClassica = Cormorant_Garamond({ subsets: ["latin"], weight: "500" });
const fontModerna = Archivo({ subsets: ["latin"], weight: "600" });
const fontRomantica = Great_Vibes({ subsets: ["latin"], weight: "400" });
const fontEditorial = Playfair_Display({ subsets: ["latin"], weight: "600" });
const fontManuscrita = Dancing_Script({ subsets: ["latin"], weight: "600" });
const fontArtdeco = Poiret_One({ subsets: ["latin"], weight: "400" });
const fontMinimalista = Josefin_Sans({ subsets: ["latin"], weight: "300" });
const fontBoho = Amatic_SC({ subsets: ["latin"], weight: "700" });

const FONT_PREVIEW_CLASS: Record<FontStyleId, string> = {
  classica: fontClassica.className,
  moderna: fontModerna.className,
  romantica: fontRomantica.className,
  editorial: fontEditorial.className,
  manuscrita: fontManuscrita.className,
  artdeco: fontArtdeco.className,
  minimalista: fontMinimalista.className,
  boho: fontBoho.className,
};

const FONT_PREVIEW_SIZE: Record<FontStyleId, string> = {
  classica: "text-2xl",
  moderna: "text-xl",
  romantica: "text-3xl",
  editorial: "text-2xl",
  manuscrita: "text-3xl",
  artdeco: "text-2xl tracking-wide",
  minimalista: "text-xl tracking-[0.15em]",
  boho: "text-3xl tracking-wide",
};

export type OrderData = {
  packageTier: PackageTier;
  templateStyle: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  fontStyle: string | null;
  styleNotes: string | null;
  coupleNames: string | null;
  weddingDate: string | null;
  photosLink: string | null;
  notes: string | null;
  status: OrderStatus;
};

function ColorField({
  label,
  hint,
  name,
  initial,
  onPicked,
}: {
  label: string;
  hint: string;
  name: string;
  initial: string | null;
  onPicked?: () => void;
}) {
  const [selected, setSelected] = useState(initial ?? "");
  const isPreset = COLOR_PRESETS.some((preset) => preset.hex === selected);

  function pick(hex: string) {
    setSelected(hex);
    if (hex) onPicked?.();
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">
        {label}{" "}
        <span className="font-normal text-xs text-(--color-muted)">
          {hint}
        </span>
      </p>
      <input type="hidden" name={name} value={selected} />
      <div className="flex flex-wrap items-center gap-2">
        {COLOR_PRESETS.map((preset) => (
          <button
            key={preset.hex}
            type="button"
            title={preset.name}
            aria-label={`${label}: ${preset.name}`}
            aria-pressed={selected === preset.hex}
            onClick={() =>
              selected === preset.hex ? setSelected("") : pick(preset.hex)
            }
            className={`size-9 rounded-full border-2 transition-transform hover:scale-110 ${
              selected === preset.hex
                ? "border-(--color-olive) ring-2 ring-(--color-olive)/30 scale-110"
                : "border-black/10"
            }`}
            style={{ backgroundColor: preset.hex }}
          />
        ))}
        <label
          className={`relative size-9 rounded-full border-2 cursor-pointer overflow-hidden transition-transform hover:scale-110 ${
            selected && !isPreset
              ? "border-(--color-olive) ring-2 ring-(--color-olive)/30 scale-110"
              : "border-black/10"
          }`}
          style={{
            background:
              selected && !isPreset
                ? selected
                : "conic-gradient(#e57373, #ffb74d, #fff176, #81c784, #64b5f6, #ba68c8, #e57373)",
          }}
          title="Cor personalizada"
        >
          <input
            type="color"
            aria-label={`${label}: cor personalizada`}
            value={selected && !isPreset ? selected : "#b8985f"}
            onChange={(event) => pick(event.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>
        {selected && (
          <span className="flex items-center gap-2 text-xs text-(--color-olive)/70">
            {COLOR_PRESETS.find((p) => p.hex === selected)?.name ?? selected}
            <button
              type="button"
              onClick={() => setSelected("")}
              className="underline underline-offset-2"
            >
              limpar
            </button>
          </span>
        )}
        {!selected && (
          <span className="text-xs text-(--color-muted)">
            sem preferência — a gente sugere
          </span>
        )}
      </div>
    </div>
  );
}

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

  // Ponto de partida controlado: escolher uma cor própria deseleciona o
  // template (o casal está montando o estilo do zero).
  const [templateStyle, setTemplateStyle] = useState<string>(
    order ? order.templateStyle ?? "" : "classico"
  );

  const isSubmitted =
    state?.submitted || (order ? order.status !== "draft" : false);

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
          Recebemos tudo! Agora é com a gente. Acompanhem cada etapa — da
          produção à prévia e ao site no ar — na página Meus pedidos.
        </p>
        <div className="flex flex-col items-center gap-3 w-full">
          <Link
            href="/conta/pedidos"
            className="rounded-full bg-(--color-olive) text-white text-sm font-medium px-8 py-3.5 transition-transform hover:scale-105"
          >
            Acompanhar meu pedido
          </Link>
          <a
            href={`https://wa.me/${CONTACT.whatsappNumber}?text=${message}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-(--color-olive)/70 underline underline-offset-4 hover:text-(--color-olive)"
          >
            Ou confirmar no WhatsApp
          </a>
        </div>
        <div className="text-xs text-(--color-muted) border-t border-(--color-gold)/30 pt-4 w-full max-w-sm flex flex-col items-center gap-1.5">
          <p>
            {pkg?.name} · {pkg?.price}
            {style ? ` · base ${style.name}` : " · estilo do zero"}
          </p>
          {(order.primaryColor || order.secondaryColor) && (
            <p className="flex items-center gap-1.5">
              Cores:
              {[order.primaryColor, order.secondaryColor]
                .filter((c): c is string => Boolean(c))
                .map((color) => (
                  <span
                    key={color}
                    className="inline-block size-3.5 rounded-full border border-black/10 align-middle"
                    style={{ backgroundColor: color }}
                  />
                ))}
            </p>
          )}
          {order.fontStyle && (
            <p>
              Tipografia:{" "}
              {FONT_STYLES.find((f) => f.id === order.fontStyle)?.name ??
                order.fontStyle}
            </p>
          )}
          {order.photosLink && <p>Fotos: link recebido ✓</p>}
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-8">
      {/* Pacote */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold">1. Pacote</p>
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
      </div>

      {/* Estilo do site — personalização completa */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-semibold">2. O estilo de vocês</p>
          <p className="text-xs text-(--color-muted)">
            O template é só o ponto de partida — as escolhas de vocês abaixo
            mandam mais que ele. Tudo é adaptado à mão, nada é obrigatório.
          </p>
        </div>

        <div className="rounded-xl border border-(--color-olive)/30 bg-(--color-blush) p-4 flex items-start gap-3">
          <span aria-hidden className="text-lg leading-none">
            🎨
          </span>
          <p className="text-sm text-(--color-olive) leading-relaxed">
            <span className="font-semibold">
              Aqui vocês podem tudo: 100% personalizável.
            </span>{" "}
            As opções abaixo são só atalhos. Se quiserem uma cor, uma fonte ou
            um detalhe que não está aqui, é só escrever no campo de
            observações — a gente faz do jeito de vocês, sem custo extra.
          </p>
        </div>

        {/* Ponto de partida */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">
            Ponto de partida{" "}
            <Link
              href="/#estilos"
              className="font-normal text-xs underline underline-offset-4 text-(--color-olive)/70"
            >
              (ver os modelos)
            </Link>
          </p>
          <input type="hidden" name="templateStyle" value={templateStyle} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {TEMPLATE_STYLES.map((style) => {
              const active = templateStyle === style.id;
              return (
                <button
                  key={style.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setTemplateStyle(active ? "" : style.id)}
                  className={`flex flex-col gap-2 rounded-xl border bg-white p-4 text-left transition-colors ${
                    active
                      ? "border-(--color-olive) bg-(--color-blush)"
                      : "border-(--color-gold)/40 hover:border-(--color-gold)"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className={`size-4 rounded-full border-2 shrink-0 ${
                        active
                          ? "border-(--color-olive) bg-(--color-olive)"
                          : "border-(--color-muted)"
                      }`}
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
                </button>
              );
            })}
          </div>
          {!templateStyle && (
            <p className="text-xs text-(--color-olive)/70">
              Sem modelo base — vamos montar do zero com as cores e a
              tipografia que vocês escolherem abaixo. 🎨
            </p>
          )}
        </div>

        {/* Cores */}
        <ColorField
          label="Cor principal"
          hint="a cor que define o site"
          name="primaryColor"
          initial={order?.primaryColor ?? null}
          onPicked={() => setTemplateStyle("")}
        />
        <ColorField
          label="Cor secundária"
          hint="detalhes, botões, ornamentos"
          name="secondaryColor"
          initial={order?.secondaryColor ?? null}
          onPicked={() => setTemplateStyle("")}
        />

        {/* Tipografia */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">
            Tipografia{" "}
            <span className="font-normal text-xs text-(--color-muted)">
              o jeito da letra nos títulos — ou peçam a de vocês nas
              observações
            </span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FONT_STYLES.map((font) => (
              <label
                key={font.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-(--color-gold)/40 bg-white px-4 py-3 cursor-pointer transition-colors has-checked:border-(--color-olive) has-checked:bg-(--color-blush)"
              >
                <span className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="fontStyle"
                    value={font.id}
                    defaultChecked={order?.fontStyle === font.id}
                    className="accent-(--color-olive)"
                  />
                  <span className="flex flex-col">
                    <span className="text-sm font-semibold">{font.name}</span>
                    <span className="text-xs text-(--color-muted)">
                      {font.description}
                    </span>
                  </span>
                </span>
                <span
                  aria-hidden
                  className={`${FONT_PREVIEW_CLASS[font.id]} ${FONT_PREVIEW_SIZE[font.id]} text-(--color-olive) leading-none shrink-0`}
                >
                  Ana &amp; Pedro
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Observações de estilo */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">
            Observações de estilo{" "}
            <span className="font-normal text-xs text-(--color-muted)">
              peçam o que quiserem — aqui não tem limite
            </span>
          </p>
          <textarea
            name="styleNotes"
            rows={4}
            defaultValue={order?.styleNotes ?? ""}
            placeholder="Escrevam à vontade: uma cor específica, uma fonte que viram por aí, tema praia ou campo, flores em aquarela, nada de rosa, um detalhe que sonharam... a gente monta do jeito de vocês."
            className="rounded-xl border border-(--color-gold)/40 bg-white px-4 py-3 text-sm resize-y focus:border-(--color-gold) focus:outline-none"
          />
          <p className="text-xs text-(--color-muted)">
            Quer algo que não está no site? {""}
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-(--color-olive) underline underline-offset-2"
            >
              Chama a gente no WhatsApp
            </a>{" "}
            que a gente resolve.
          </p>
        </div>
      </div>

      {/* Material */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold">3. Material de vocês</p>
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
      </div>

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
