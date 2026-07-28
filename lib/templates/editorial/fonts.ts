import {
  Playfair_Display,
  Bodoni_Moda,
  Italiana,
  Cormorant_Garamond,
  Montserrat,
  Jost,
  Raleway,
  Spectral,
} from "next/font/google";
import type { FontSet } from "@/lib/fonts/types";

// Fontes do molde Editorial — revista de moda: serifas de alto contraste em
// caixa alta, sem serifa geométrica no corpo, e NENHUMA caligráfica.
//
// A ausência é curadoria, não esquecimento: uma Parisienne ou Great Vibes
// destruiria o Editorial, que se apoia justamente na tensão entre a serifa
// dramática e o sans limpo. O papel `script` aqui é ocupado pela Italiana,
// uma serifa fina e alongada — o molde não tem caligrafia por desenho.
//
// ATENÇÃO: cada fonte precisa de um `const` no escopo do módulo. Chamar
// direto dentro do objeto falha no build com "Font loaders must be called and
// assigned to a const in the module scope".
//
// Ver docs/sdd-geracao-automatica.md §4.3.

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--f-playfair", display: "swap" });
const bodoni = Bodoni_Moda({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--f-bodoni", display: "swap" });
const italiana = Italiana({ subsets: ["latin"], weight: "400", variable: "--f-italiana", display: "swap" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--f-cormorant", display: "swap" });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--f-montserrat", display: "swap" });
const jost = Jost({ subsets: ["latin"], weight: ["300", "400", "500"], variable: "--f-jost", display: "swap" });
const raleway = Raleway({ subsets: ["latin"], weight: ["300", "400", "500"], variable: "--f-raleway", display: "swap" });
const spectral = Spectral({ subsets: ["latin"], weight: ["300", "400", "500"], style: ["normal", "italic"], variable: "--f-spectral", display: "swap" });

export const EDITORIAL_FONTS: FontSet = {
  // títulos — serifas de alto contraste
  playfair,
  bodoni,
  italiana,
  cormorant,
  // corpo — sem serifa geométrica, mais a Spectral para quem quiser serifa
  montserrat,
  jost,
  raleway,
  spectral,
};
