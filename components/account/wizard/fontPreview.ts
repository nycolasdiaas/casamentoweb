// Prévias de tipografia do painel.
//
// Cada fonte PRECISA de um const no escopo do módulo — dentro de objeto
// literal o next/font falha com "Font loaders must be called and assigned to
// a const in the module scope". Ver AGENTS.md.
//
// Declarar as 34 aqui embarca o CSS das 34 em quem importar este módulo. É
// aceito de propósito: isto é a tela do CASAL montando o pedido, onde ele
// precisa COMPARAR as fontes. O site do convidado nunca importa este arquivo
// — lá cada molde declara só as suas (lib/templates/<id>/fonts.ts).

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
import type { FontStyleId, FontCategory } from "@/lib/customization";

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

export const FONT_PREVIEW_CLASS: Record<FontStyleId, string> = {
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
export const CATEGORY_PREVIEW_SIZE: Record<FontCategory, string> = {
  serifa: "text-2xl",
  manuscrita: "text-3xl",
  sans: "text-xl tracking-wide",
  rustica: "text-3xl tracking-wide",
};
