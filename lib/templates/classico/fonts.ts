import {
  Cormorant_Garamond,
  EB_Garamond,
  Playfair_Display,
  Marcellus,
  Lora,
  Crimson_Text,
  Pinyon_Script,
  Allura,
} from "next/font/google";
import type { FontSet } from "@/lib/fonts/types";

// Fontes do molde Clássico — papelaria de casamento de luxo: serifas
// elegantes e caligrafia formal.
//
// POR QUE POR MOLDE, e não um catálogo único de 34: declarar as 34 num
// módulo só fazia o CSS das 34 embarcar em qualquer página que importasse o
// registry. Medido na Fase 1: 83,6 KB de CSS, dos quais 51,1 KB (61%) eram
// de fontes que a página nem usava. Com o catálogo por molde, a rota importa
// só o molde que renderiza — e o convidado carrega só o que existe no desenho.
//
// Ganho de produto junto com o técnico: uma Amatic SC ou Caveat destruiria o
// Clássico. Não oferecer é curadoria, não limitação.
//
// ATENÇÃO ao mexer aqui: o loader do next/font exige que cada fonte seja
// atribuída a um `const` no escopo do módulo. Chamar direto dentro do objeto
// (`{ cormorant: Cormorant_Garamond({...}) }`) falha no build com
// "Font loaders must be called and assigned to a const in the module scope".
//
// Ver docs/sdd-geracao-automatica.md §4.3.

const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--f-cormorant", display: "swap" });
const ebGaramond = EB_Garamond({ subsets: ["latin"], weight: ["400", "500"], variable: "--f-eb-garamond", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600"], variable: "--f-playfair", display: "swap" });
const marcellus = Marcellus({ subsets: ["latin"], weight: "400", variable: "--f-marcellus", display: "swap" });
const lora = Lora({ subsets: ["latin"], weight: ["400", "500"], style: ["normal", "italic"], variable: "--f-lora", display: "swap" });
const crimson = Crimson_Text({ subsets: ["latin"], weight: "400", variable: "--f-crimson", display: "swap" });
const pinyon = Pinyon_Script({ subsets: ["latin"], weight: "400", variable: "--f-pinyon", display: "swap" });
const allura = Allura({ subsets: ["latin"], weight: "400", variable: "--f-allura", display: "swap" });

export const CLASSICO_FONTS: FontSet = {
  // títulos
  cormorant,
  "eb-garamond": ebGaramond,
  playfair,
  marcellus,
  // corpo
  lora,
  crimson,
  // caligráficas
  pinyon,
  allura,
};
