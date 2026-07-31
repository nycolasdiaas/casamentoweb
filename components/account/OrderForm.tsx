"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import LivePreview from "@/components/account/LivePreview";
import {
  Cormorant_Garamond,
  Playfair_Display,
  EB_Garamond,
  Lora,
  Libre_Baskerville,
  Bodoni_Moda,
  DM_Serif_Display,
  Prata,
  Marcellus,
  Cardo,
  Cinzel,
  Italiana,
  Spectral,
  Gilda_Display,
  Crimson_Text,
  Great_Vibes,
  Dancing_Script,
  Parisienne,
  Sacramento,
  Allura,
  Pinyon_Script,
  Alex_Brush,
  Tangerine,
  Petit_Formal_Script,
  Yellowtail,
  Style_Script,
  Kaushan_Script,
  Josefin_Sans,
  Poiret_One,
  Montserrat,
  Jost,
  Raleway,
  Amatic_SC,
  Caveat,
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
  FONT_CATEGORY_LABELS,
  type FontStyleId,
  type FontCategory,
} from "@/lib/customization";
import { WHATSAPP_LINK } from "@/lib/site";
import type { OrderStatus } from "@/lib/orderStatus";

// Cada fonte carregada com um peso que existe no Google Fonts.
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: "500" });
const playfair = Playfair_Display({ subsets: ["latin"], weight: "600" });
const ebGaramond = EB_Garamond({ subsets: ["latin"], weight: "500" });
const lora = Lora({ subsets: ["latin"], weight: "500" });
const libreBaskerville = Libre_Baskerville({ subsets: ["latin"], weight: "400" });
const bodoni = Bodoni_Moda({ subsets: ["latin"], weight: "500" });
const dmSerif = DM_Serif_Display({ subsets: ["latin"], weight: "400" });
const prata = Prata({ subsets: ["latin"], weight: "400" });
const marcellus = Marcellus({ subsets: ["latin"], weight: "400" });
const cardo = Cardo({ subsets: ["latin"], weight: "400" });
const cinzel = Cinzel({ subsets: ["latin"], weight: "500" });
const italiana = Italiana({ subsets: ["latin"], weight: "400" });
const spectral = Spectral({ subsets: ["latin"], weight: "500" });
const gilda = Gilda_Display({ subsets: ["latin"], weight: "400" });
const crimson = Crimson_Text({ subsets: ["latin"], weight: "400" });
const greatVibes = Great_Vibes({ subsets: ["latin"], weight: "400" });
const dancing = Dancing_Script({ subsets: ["latin"], weight: "600" });
const parisienne = Parisienne({ subsets: ["latin"], weight: "400" });
const sacramento = Sacramento({ subsets: ["latin"], weight: "400" });
const allura = Allura({ subsets: ["latin"], weight: "400" });
const pinyon = Pinyon_Script({ subsets: ["latin"], weight: "400" });
const alexBrush = Alex_Brush({ subsets: ["latin"], weight: "400" });
const tangerine = Tangerine({ subsets: ["latin"], weight: "400" });
const petitFormal = Petit_Formal_Script({ subsets: ["latin"], weight: "400" });
const yellowtail = Yellowtail({ subsets: ["latin"], weight: "400" });
const styleScript = Style_Script({ subsets: ["latin"], weight: "400" });
const kaushan = Kaushan_Script({ subsets: ["latin"], weight: "400" });
const josefin = Josefin_Sans({ subsets: ["latin"], weight: "300" });
const poiret = Poiret_One({ subsets: ["latin"], weight: "400" });
const montserrat = Montserrat({ subsets: ["latin"], weight: "500" });
const jost = Jost({ subsets: ["latin"], weight: "400" });
const raleway = Raleway({ subsets: ["latin"], weight: "400" });
const amatic = Amatic_SC({ subsets: ["latin"], weight: "700" });
const caveat = Caveat({ subsets: ["latin"], weight: "600" });

const FONT_PREVIEW_CLASS: Record<FontStyleId, string> = {
  cormorant: cormorant.className,
  playfair: playfair.className,
  "eb-garamond": ebGaramond.className,
  lora: lora.className,
  "libre-baskerville": libreBaskerville.className,
  bodoni: bodoni.className,
  "dm-serif": dmSerif.className,
  prata: prata.className,
  marcellus: marcellus.className,
  cardo: cardo.className,
  cinzel: cinzel.className,
  italiana: italiana.className,
  spectral: spectral.className,
  gilda: gilda.className,
  crimson: crimson.className,
  "great-vibes": greatVibes.className,
  dancing: dancing.className,
  parisienne: parisienne.className,
  sacramento: sacramento.className,
  allura: allura.className,
  pinyon: pinyon.className,
  "alex-brush": alexBrush.className,
  tangerine: tangerine.className,
  "petit-formal": petitFormal.className,
  yellowtail: yellowtail.className,
  "style-script": styleScript.className,
  kaushan: kaushan.className,
  josefin: josefin.className,
  poiret: poiret.className,
  montserrat: montserrat.className,
  jost: jost.className,
  raleway: raleway.className,
  amatic: amatic.className,
  caveat: caveat.className,
};

// Tamanho do preview por categoria (scripts pedem mais corpo).
const CATEGORY_PREVIEW_SIZE: Record<FontCategory, string> = {
  serifa: "text-2xl",
  manuscrita: "text-3xl",
  sans: "text-xl tracking-wide",
  rustica: "text-3xl tracking-wide",
};

const FONT_CATEGORY_ORDER: FontCategory[] = [
  "serifa",
  "manuscrita",
  "sans",
  "rustica",
];

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
  order,
  orderId,
}: {
  order: OrderData | null;
  orderId: string | null;
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

  // O pacote também é estado: a prévia mostra seções diferentes conforme o
  // tier, então precisa reagir junto com o molde.
  const [pacote, setPacote] = useState<PackageTier>(
    order?.packageTier ?? (PACKAGES.find((p) => p.highlight)?.tier ?? "site")
  );

  return (
    <form action={action} className="flex flex-col gap-8">
      <input type="hidden" name="orderId" value={orderId ?? ""} />
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
                  checked={pacote === pkg.tier}
                  onChange={() => setPacote(pkg.tier)}
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

        {/* Prévia do molde escolhido, aqui mesmo. Ainda não existe site
            provisionado (isso só acontece ao ENVIAR o pedido), então a fonte
            é a prévia do molde — que já reage ao modelo e ao pacote. */}
        {templateStyle && (
          <LivePreview
            src={`/pacotes/estilos/${templateStyle}?pacote=${pacote}`}
            titulo="Como este modelo fica"
            descricao="Troquem o modelo ou o pacote acima e veja mudar aqui. Depois de enviar o pedido, esta prévia passa a mostrar o site com o conteúdo de vocês."
          />
        )}

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
              {FONT_STYLES.length} opções — role para ver todas, ou peçam a de
              vocês nas observações
            </span>
          </p>
          <div className="max-h-[28rem] overflow-y-auto rounded-xl border border-(--color-gold)/30 bg-(--color-paper)/40 p-3 flex flex-col gap-5">
            {FONT_CATEGORY_ORDER.map((category) => {
              const fontsInCategory = FONT_STYLES.filter(
                (f) => f.category === category
              );
              if (fontsInCategory.length === 0) return null;
              return (
                <div key={category} className="flex flex-col gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-(--color-gold) sticky top-0 bg-(--color-paper) py-1">
                    {FONT_CATEGORY_LABELS[category]}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {fontsInCategory.map((font) => (
                      <label
                        key={font.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-(--color-gold)/40 bg-white px-4 py-3 cursor-pointer transition-colors has-checked:border-(--color-olive) has-checked:bg-(--color-blush)"
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="radio"
                            name="fontStyle"
                            value={font.id}
                            defaultChecked={order?.fontStyle === font.id}
                            className="accent-(--color-olive)"
                          />
                          <span className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold truncate">
                              {font.name}
                            </span>
                            <span className="text-xs text-(--color-muted) truncate">
                              {font.description}
                            </span>
                          </span>
                        </span>
                        <span
                          aria-hidden
                          className={`${FONT_PREVIEW_CLASS[font.id]} ${CATEGORY_PREVIEW_SIZE[font.category]} text-(--color-olive) leading-none shrink-0`}
                        >
                          Ana &amp; Pedro
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
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
