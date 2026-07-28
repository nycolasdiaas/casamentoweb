import {
  Prata,
  Cormorant_Garamond,
  Marcellus,
  Cardo,
  Spectral,
  Crimson_Text,
  Lora,
  Great_Vibes,
  Allura,
  Tangerine,
} from "next/font/google";
import type { FontSet } from "@/lib/fonts/types";

// Fontes do molde Film — fotografia analógica, luz quente de fim de tarde.
//
// A Prata abre o catálogo por ser art nouveau: tem o ar de cartaz antigo que
// o molde persegue. As caligráficas são clássicas e finas — nada de pincel
// moderno, que quebraria o clima de arquivo de família.
//
// ATENÇÃO: cada fonte precisa de um `const` no escopo do módulo.
//
// Ver docs/sdd-geracao-automatica.md §4.3.

const prata = Prata({ subsets: ["latin"], weight: "400", variable: "--f-prata", display: "swap" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--f-cormorant", display: "swap" });
const marcellus = Marcellus({ subsets: ["latin"], weight: "400", variable: "--f-marcellus", display: "swap" });
const cardo = Cardo({ subsets: ["latin"], weight: ["400", "700"], style: ["normal", "italic"], variable: "--f-cardo", display: "swap" });
const spectral = Spectral({ subsets: ["latin"], weight: ["300", "400", "500"], style: ["normal", "italic"], variable: "--f-spectral", display: "swap" });
const crimson = Crimson_Text({ subsets: ["latin"], weight: ["400", "600"], style: ["normal", "italic"], variable: "--f-crimson", display: "swap" });
const lora = Lora({ subsets: ["latin"], weight: ["400", "500"], style: ["normal", "italic"], variable: "--f-lora", display: "swap" });
const greatVibes = Great_Vibes({ subsets: ["latin"], weight: "400", variable: "--f-great-vibes", display: "swap" });
const allura = Allura({ subsets: ["latin"], weight: "400", variable: "--f-allura", display: "swap" });
const tangerine = Tangerine({ subsets: ["latin"], weight: ["400", "700"], variable: "--f-tangerine", display: "swap" });

export const FILM_FONTS: FontSet = {
  // títulos
  prata,
  cormorant,
  marcellus,
  cardo,
  // corpo
  spectral,
  crimson,
  lora,
  // caligráficas clássicas
  "great-vibes": greatVibes,
  allura,
  tangerine,
};
