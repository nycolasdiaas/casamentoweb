import {
  Jost,
  Montserrat,
  Raleway,
  Josefin_Sans,
  Poiret_One,
} from "next/font/google";
import type { FontSet } from "@/lib/fonts/types";

// Fontes do molde Moderno — só geométricas sem serifa.
//
// O catálogo é curto por decisão, não por preguiça: o Moderno se apoia em
// peso tipográfico extremo (900 no display) contra filetes finos. Uma serifa
// clássica ou uma caligráfica aqui não seria "outra personalização", seria
// outro molde. Como o clampThemeFonts recorta a escolha do casal ao que o
// molde declara, não oferecer é o que garante que o desenho não se desfaz.
//
// A prévia usa um monoespaçado nos micro-rótulos; o catálogo de FONT_STYLES
// não tem mono, então esse papel fica com a fonte de `script` (Poiret One por
// padrão) em caixa alta e espacejada. Perde-se o ar de terminal, mantém-se o
// contraste técnico.
//
// ATENÇÃO: cada fonte precisa de um `const` no escopo do módulo.
//
// Ver docs/sdd-geracao-automatica.md §4.3.

const jost = Jost({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800", "900"], variable: "--f-jost", display: "swap" });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800", "900"], variable: "--f-montserrat", display: "swap" });
const raleway = Raleway({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"], variable: "--f-raleway", display: "swap" });
const josefin = Josefin_Sans({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--f-josefin", display: "swap" });
const poiret = Poiret_One({ subsets: ["latin"], weight: "400", variable: "--f-poiret", display: "swap" });

export const MODERNO_FONTS: FontSet = {
  jost,
  montserrat,
  raleway,
  josefin,
  poiret,
};
