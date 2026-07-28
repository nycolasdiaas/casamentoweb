import {
  Marcellus,
  Cormorant_Garamond,
  EB_Garamond,
  Cardo,
  Crimson_Text,
  Lora,
  Allura,
  Tangerine,
  Great_Vibes,
} from "next/font/google";
import type { FontSet } from "@/lib/fonts/types";

// Fontes do molde Toscana — villa italiana: romanas clássicas, serifas de
// leitura calorosas e caligrafia fluida para os respiros em italiano.
//
// A Marcellus abre o catálogo porque é romana de inscrição: dá o ar de pedra
// e vinha que o molde persegue. Fica de fora tudo que seja geométrico ou
// moderno — uma Jost aqui viraria outro molde.
//
// ATENÇÃO: cada fonte precisa de um `const` no escopo do módulo. Chamar
// direto dentro do objeto falha no build com "Font loaders must be called and
// assigned to a const in the module scope".
//
// Ver docs/sdd-geracao-automatica.md §4.3.

const marcellus = Marcellus({ subsets: ["latin"], weight: "400", variable: "--f-marcellus", display: "swap" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--f-cormorant", display: "swap" });
const ebGaramond = EB_Garamond({ subsets: ["latin"], weight: ["400", "500"], style: ["normal", "italic"], variable: "--f-eb-garamond", display: "swap" });
const cardo = Cardo({ subsets: ["latin"], weight: ["400", "700"], style: ["normal", "italic"], variable: "--f-cardo", display: "swap" });
const crimson = Crimson_Text({ subsets: ["latin"], weight: ["400", "600"], style: ["normal", "italic"], variable: "--f-crimson", display: "swap" });
const lora = Lora({ subsets: ["latin"], weight: ["400", "500"], style: ["normal", "italic"], variable: "--f-lora", display: "swap" });
const allura = Allura({ subsets: ["latin"], weight: "400", variable: "--f-allura", display: "swap" });
const tangerine = Tangerine({ subsets: ["latin"], weight: ["400", "700"], variable: "--f-tangerine", display: "swap" });
const greatVibes = Great_Vibes({ subsets: ["latin"], weight: "400", variable: "--f-great-vibes", display: "swap" });

export const TOSCANA_FONTS: FontSet = {
  // títulos — romanas e serifas clássicas
  marcellus,
  cormorant,
  "eb-garamond": ebGaramond,
  cardo,
  // corpo — serifas de leitura, calorosas
  crimson,
  lora,
  // caligráficas
  allura,
  tangerine,
  "great-vibes": greatVibes,
};
