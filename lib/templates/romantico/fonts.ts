import {
  Cormorant_Garamond,
  EB_Garamond,
  Lora,
  Crimson_Text,
  Parisienne,
  Great_Vibes,
  Dancing_Script,
  Sacramento,
  Allura,
} from "next/font/google";
import type { FontSet } from "@/lib/fonts/types";

// Fontes do molde Romântico — jardim ao entardecer: serifas suaves e uma
// prateleira generosa de caligráficas, porque aqui a manuscrita não é
// enfeite: é ela que assina os títulos.
//
// É o molde com mais opções de script do catálogo, e de propósito — trocar a
// caligrafia é a personalização que mais muda a cara deste desenho.
//
// ATENÇÃO: cada fonte precisa de um `const` no escopo do módulo. Chamar
// direto dentro do objeto falha no build com "Font loaders must be called and
// assigned to a const in the module scope".
//
// Ver docs/sdd-geracao-automatica.md §4.3.

const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--f-cormorant", display: "swap" });
const ebGaramond = EB_Garamond({ subsets: ["latin"], weight: ["400", "500"], style: ["normal", "italic"], variable: "--f-eb-garamond", display: "swap" });
const lora = Lora({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--f-lora", display: "swap" });
const crimson = Crimson_Text({ subsets: ["latin"], weight: ["400", "600"], style: ["normal", "italic"], variable: "--f-crimson", display: "swap" });
const parisienne = Parisienne({ subsets: ["latin"], weight: "400", variable: "--f-parisienne", display: "swap" });
const greatVibes = Great_Vibes({ subsets: ["latin"], weight: "400", variable: "--f-great-vibes", display: "swap" });
const dancing = Dancing_Script({ subsets: ["latin"], weight: ["400", "600"], variable: "--f-dancing", display: "swap" });
const sacramento = Sacramento({ subsets: ["latin"], weight: "400", variable: "--f-sacramento", display: "swap" });
const allura = Allura({ subsets: ["latin"], weight: "400", variable: "--f-allura", display: "swap" });

export const ROMANTICO_FONTS: FontSet = {
  // títulos e corpo — serifas suaves
  cormorant,
  "eb-garamond": ebGaramond,
  lora,
  crimson,
  // caligráficas — o coração do molde
  parisienne,
  "great-vibes": greatVibes,
  dancing,
  sacramento,
  allura,
};
