import { IBM_Plex_Mono, IBM_Plex_Sans, Instrument_Serif } from "next/font/google";

/**
 * Fontes da PLATAFORMA (painel do casal e landing) — Direção A, "Prensa".
 *
 * Por que um módulo só, e por que fora de `lib/templates/<id>/fonts.ts`:
 *
 * - Declarar N fontes num módulo embarca o CSS das N em qualquer página que o
 *   importe. Medido: 34 fontes = 83,6 KB, 61% desperdiçado. São três aqui, e
 *   só as telas da plataforma importam este arquivo.
 * - Elas NÃO entram no catálogo dos moldes. `clampThemeFonts` recorta a
 *   escolha do casal ao catálogo do molde; fonte de painel vazando para lá é
 *   uma Amatic SC destruindo o Clássico.
 * - Cada uma vai para um `const` no escopo do módulo. Dentro de objeto
 *   literal o build falha com "Font loaders must be called and assigned to a
 *   const in the module scope".
 * - Cada uma tem a PRÓPRIA variável (`--f-ui-*`), não uma por papel: duas
 *   fontes declarando `--font-display` colidiriam ao serem usadas juntas.
 *
 * `--font-serif` (Italiana) e `--font-script` seguem declaradas no root por
 * `app/layout.tsx` e intocadas — 33 arquivos dependem delas, incluindo a rota
 * `/rsvp/<slug>`.
 */

// Serifada de alto contraste, editorial. Tem presença em 44px e não é a
// serifada de convite — lê como revista. Peso 400 é o único que existe.
const display = Instrument_Serif({
  variable: "--f-ui-display",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

// Sans industrial com letras levemente estranhas (o `a`, o `g`): lê como
// desenhada, não como padrão. Pesos de verdade — 400 a 600 — que é o que
// Italiana em 400 nunca permitiu para hierarquia.
const body = IBM_Plex_Sans({
  variable: "--f-ui-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

// Número de pedido, data, valor, slug. Resolve o alinhamento de coluna que a
// proporcional nunca resolve, e é a marca de registro aplicada à interface.
const mono = IBM_Plex_Mono({
  variable: "--f-ui-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

/**
 * As três variáveis + o escopo `.ui-prensa`, que liga os tokens de cor de
 * `app/globals.css`. Uma string só para nenhuma tela esquecer metade.
 */
export const uiPrensa = `${display.variable} ${body.variable} ${mono.variable} ui-prensa`;
