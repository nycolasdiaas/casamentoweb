import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

/**
 * `cacheTag`/`cacheLife` só existem dentro do runtime do Next com
 * `cacheComponents` ligado. Os testes rodam no vitest, fora dele, então as
 * chamadas lançariam erro nos repositories que usam `use cache`.
 *
 * A diretiva `"use cache"` em si já é inofensiva aqui (vira uma string solta,
 * como "use strict"), e a função executa sem cache — que é exatamente o que
 * queremos no teste: exercitar a consulta de verdade, sem memória entre casos.
 *
 * `revalidateTag`/`updateTag` são mockados pela mesma razão: as actions os
 * chamam depois de gravar.
 */
vi.mock("next/cache", async (importOriginal) => {
  const original = await importOriginal<typeof import("next/cache")>();
  return {
    ...original,
    cacheTag: vi.fn(),
    cacheLife: vi.fn(),
    revalidateTag: vi.fn(),
    updateTag: vi.fn(),
    revalidatePath: vi.fn(),
  };
});

/**
 * `next/font/google` não é uma biblioteca: é uma transformação de build. Fora
 * do Next, `Cormorant_Garamond` nem é função — importar qualquer molde (que
 * declara as próprias fontes) explodia antes do primeiro teste rodar.
 *
 * A lista é explícita porque o vitest valida os exports do mock na hora de
 * registrá-lo: um Proxy que responde a tudo é recusado com
 * "No X export is defined on the next/font/google mock".
 *
 * Cobre o catálogo inteiro de FONT_STYLES (lib/customization.ts), não só o
 * que os moldes de hoje usam — assim molde novo não esbarra aqui. Ao oferecer
 * uma fonte nova no catálogo, acrescente o nome do loader nesta lista.
 */
const GOOGLE_FONT_LOADERS = [
  // serifadas
  "Cormorant_Garamond", "Playfair_Display", "EB_Garamond", "Lora",
  "Libre_Baskerville", "Bodoni_Moda", "DM_Serif_Display", "Prata",
  "Marcellus", "Cardo", "Cinzel", "Italiana", "Spectral", "Gilda_Display",
  "Crimson_Text",
  // caligráficas
  "Great_Vibes", "Dancing_Script", "Parisienne", "Sacramento", "Allura",
  "Pinyon_Script", "Alex_Brush", "Tangerine", "Petit_Formal_Script",
  "Yellowtail", "Style_Script", "Kaushan_Script",
  // sem serifa
  "Josefin_Sans", "Poiret_One", "Montserrat", "Jost", "Raleway",
  // rústicas
  "Amatic_SC", "Caveat",
  // usadas só nas páginas de prévia
  "Archivo",
  // plataforma (painel + landing), lib/fonts/ui.ts. NÃO entram no catálogo
  // dos moldes de propósito: clampThemeFonts recorta a escolha do casal ao
  // catálogo do molde, e fonte de painel vazando para lá destruiria o tema.
  "Instrument_Serif", "IBM_Plex_Sans", "IBM_Plex_Mono",
];

vi.mock("next/font/google", () =>
  Object.fromEntries(
    GOOGLE_FONT_LOADERS.map((nome) => [
      nome,
      // Mesmo formato que o loader real devolve: `variable` (consumida por
      // themeFontClassNames) e `className`.
      (options?: { variable?: string }) => ({
        variable: options?.variable ?? `--f-${nome.toLowerCase()}`,
        className: `mock-${nome.toLowerCase()}`,
      }),
    ])
  )
);

afterEach(() => {
  cleanup();
});
