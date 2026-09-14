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

// `preload: false` em todas (UX-023, 14/09/2026). O manifesto de fontes do
// build espalhava o pré-carregamento destas pelas rotas — o RSVP do convidado
// baixava 17 arquivos (421 KB) e usava 3; o site do casal, 44. Sem o preload a
// fonte continua carregando quando o CSS a usa; só deixa de ser baixada à toa.

const prata = Prata({ subsets: ["latin"], weight: "400", variable: "--f-prata", display: "swap", preload: false });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--f-cormorant", display: "swap", preload: false });
const marcellus = Marcellus({ subsets: ["latin"], weight: "400", variable: "--f-marcellus", display: "swap", preload: false });
const cardo = Cardo({ subsets: ["latin"], weight: ["400", "700"], style: ["normal", "italic"], variable: "--f-cardo", display: "swap", preload: false });
const spectral = Spectral({ subsets: ["latin"], weight: ["300", "400", "500"], style: ["normal", "italic"], variable: "--f-spectral", display: "swap", preload: false });
const crimson = Crimson_Text({ subsets: ["latin"], weight: ["400", "600"], style: ["normal", "italic"], variable: "--f-crimson", display: "swap", preload: false });
const lora = Lora({ subsets: ["latin"], weight: ["400", "500"], style: ["normal", "italic"], variable: "--f-lora", display: "swap", preload: false });
const greatVibes = Great_Vibes({ subsets: ["latin"], weight: "400", variable: "--f-great-vibes", display: "swap", preload: false });
const allura = Allura({ subsets: ["latin"], weight: "400", variable: "--f-allura", display: "swap", preload: false });
const tangerine = Tangerine({ subsets: ["latin"], weight: ["400", "700"], variable: "--f-tangerine", display: "swap", preload: false });

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
