import {
  Cormorant_Garamond, Playfair_Display, EB_Garamond, Lora, Libre_Baskerville,
  Bodoni_Moda, DM_Serif_Display, Prata, Marcellus, Cardo, Cinzel, Italiana,
  Spectral, Gilda_Display, Crimson_Text, Great_Vibes, Dancing_Script,
  Parisienne, Sacramento, Allura, Pinyon_Script, Alex_Brush, Tangerine,
  Petit_Formal_Script, Yellowtail, Style_Script, Kaushan_Script, Josefin_Sans,
  Poiret_One, Montserrat, Jost, Raleway, Amatic_SC, Caveat,
} from "next/font/google";
import type { FontStyleId } from "@/lib/customization";

// Registry central das fontes do catálogo.
//
// POR QUE UM REGISTRY ESTÁTICO: `next/font/google` não aceita chamada
// dinâmica — precisa de invocação literal em escopo de módulo, porque o
// download e o subsetting acontecem em build. Não dá para fazer
// `Font(nomeEscolhidoPeloCasal)`. Então todas as fontes selecionáveis são
// declaradas aqui, uma vez, e o tema só escolhe entre elas.
//
// CADA FONTE TEM SUA PRÓPRIA VARIÁVEL CSS (--f-<id>), não uma variável por
// papel. Se cada fonte declarasse `--font-display`, usar a mesma fonte em
// dois papéis colidiria. Com uma variável por fonte, o wrapper do site
// aponta o papel para a fonte: --font-display: var(--f-cormorant).
//
// Os pesos são os que existem no Google Fonts para cada família (mesmos já
// validados em components/account/OrderForm.tsx).
//
// Ver docs/sdd-geracao-automatica.md §4.3.

const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--f-cormorant", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600"], variable: "--f-playfair", display: "swap" });
const ebGaramond = EB_Garamond({ subsets: ["latin"], weight: ["400", "500"], variable: "--f-eb-garamond", display: "swap" });
const lora = Lora({ subsets: ["latin"], weight: ["400", "500"], style: ["normal", "italic"], variable: "--f-lora", display: "swap" });
const libreBaskerville = Libre_Baskerville({ subsets: ["latin"], weight: "400", variable: "--f-libre-baskerville", display: "swap" });
const bodoni = Bodoni_Moda({ subsets: ["latin"], weight: ["400", "500"], variable: "--f-bodoni", display: "swap" });
const dmSerif = DM_Serif_Display({ subsets: ["latin"], weight: "400", variable: "--f-dm-serif", display: "swap" });
const prata = Prata({ subsets: ["latin"], weight: "400", variable: "--f-prata", display: "swap" });
const marcellus = Marcellus({ subsets: ["latin"], weight: "400", variable: "--f-marcellus", display: "swap" });
const cardo = Cardo({ subsets: ["latin"], weight: "400", variable: "--f-cardo", display: "swap" });
const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "500"], variable: "--f-cinzel", display: "swap" });
const italiana = Italiana({ subsets: ["latin"], weight: "400", variable: "--f-italiana", display: "swap" });
const spectral = Spectral({ subsets: ["latin"], weight: ["400", "500"], variable: "--f-spectral", display: "swap" });
const gilda = Gilda_Display({ subsets: ["latin"], weight: "400", variable: "--f-gilda", display: "swap" });
const crimson = Crimson_Text({ subsets: ["latin"], weight: "400", variable: "--f-crimson", display: "swap" });
const greatVibes = Great_Vibes({ subsets: ["latin"], weight: "400", variable: "--f-great-vibes", display: "swap" });
const dancing = Dancing_Script({ subsets: ["latin"], weight: ["400", "600"], variable: "--f-dancing", display: "swap" });
const parisienne = Parisienne({ subsets: ["latin"], weight: "400", variable: "--f-parisienne", display: "swap" });
const sacramento = Sacramento({ subsets: ["latin"], weight: "400", variable: "--f-sacramento", display: "swap" });
const allura = Allura({ subsets: ["latin"], weight: "400", variable: "--f-allura", display: "swap" });
const pinyon = Pinyon_Script({ subsets: ["latin"], weight: "400", variable: "--f-pinyon", display: "swap" });
const alexBrush = Alex_Brush({ subsets: ["latin"], weight: "400", variable: "--f-alex-brush", display: "swap" });
const tangerine = Tangerine({ subsets: ["latin"], weight: "400", variable: "--f-tangerine", display: "swap" });
const petitFormal = Petit_Formal_Script({ subsets: ["latin"], weight: "400", variable: "--f-petit-formal", display: "swap" });
const yellowtail = Yellowtail({ subsets: ["latin"], weight: "400", variable: "--f-yellowtail", display: "swap" });
const styleScript = Style_Script({ subsets: ["latin"], weight: "400", variable: "--f-style-script", display: "swap" });
const kaushan = Kaushan_Script({ subsets: ["latin"], weight: "400", variable: "--f-kaushan", display: "swap" });
const josefin = Josefin_Sans({ subsets: ["latin"], weight: ["300", "400"], variable: "--f-josefin", display: "swap" });
const poiret = Poiret_One({ subsets: ["latin"], weight: "400", variable: "--f-poiret", display: "swap" });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500"], variable: "--f-montserrat", display: "swap" });
const jost = Jost({ subsets: ["latin"], weight: ["400", "500"], variable: "--f-jost", display: "swap" });
const raleway = Raleway({ subsets: ["latin"], weight: ["400", "500"], variable: "--f-raleway", display: "swap" });
const amatic = Amatic_SC({ subsets: ["latin"], weight: "700", variable: "--f-amatic", display: "swap" });
const caveat = Caveat({ subsets: ["latin"], weight: ["400", "600"], variable: "--f-caveat", display: "swap" });

type LoadedFont = { variable: string; className: string };

export const FONT_REGISTRY: Record<FontStyleId, LoadedFont> = {
  cormorant, playfair, "eb-garamond": ebGaramond, lora,
  "libre-baskerville": libreBaskerville, bodoni, "dm-serif": dmSerif, prata,
  marcellus, cardo, cinzel, italiana, spectral, gilda, crimson,
  "great-vibes": greatVibes, dancing, parisienne, sacramento, allura,
  pinyon, "alex-brush": alexBrush, tangerine, "petit-formal": petitFormal,
  yellowtail, "style-script": styleScript, kaushan, josefin, poiret,
  montserrat, jost, raleway, amatic, caveat,
};

/** Nome da variável CSS de uma fonte, ex: "--f-cormorant". */
export function fontVar(id: FontStyleId): string {
  return `--f-${id}`;
}

/**
 * Classes `variable` das fontes escolhidas, para o wrapper do site.
 *
 * Só as fontes de fato usadas entram no HTML — declarar as 34 aqui não
 * significa carregar as 34 numa página.
 */
export function fontClassNames(ids: FontStyleId[]): string {
  return Array.from(new Set(ids))
    .map((id) => FONT_REGISTRY[id].variable)
    .join(" ");
}
