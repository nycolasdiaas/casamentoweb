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

// `preload: false` em todas (UX-023, 14/09/2026). O manifesto de fontes do
// build espalhava o pré-carregamento destas pelas rotas — o RSVP do convidado
// baixava 17 arquivos (421 KB) e usava 3; o site do casal, 44. Sem o preload a
// fonte continua carregando quando o CSS a usa; só deixa de ser baixada à toa.

const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--f-cormorant", display: "swap", preload: false });
const ebGaramond = EB_Garamond({ subsets: ["latin"], weight: ["400", "500"], style: ["normal", "italic"], variable: "--f-eb-garamond", display: "swap", preload: false });
const lora = Lora({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--f-lora", display: "swap", preload: false });
const crimson = Crimson_Text({ subsets: ["latin"], weight: ["400", "600"], style: ["normal", "italic"], variable: "--f-crimson", display: "swap", preload: false });
const parisienne = Parisienne({ subsets: ["latin"], weight: "400", variable: "--f-parisienne", display: "swap", preload: false });
const greatVibes = Great_Vibes({ subsets: ["latin"], weight: "400", variable: "--f-great-vibes", display: "swap", preload: false });
const dancing = Dancing_Script({ subsets: ["latin"], weight: ["400", "600"], variable: "--f-dancing", display: "swap", preload: false });
const sacramento = Sacramento({ subsets: ["latin"], weight: "400", variable: "--f-sacramento", display: "swap", preload: false });
const allura = Allura({ subsets: ["latin"], weight: "400", variable: "--f-allura", display: "swap", preload: false });

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
