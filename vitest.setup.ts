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

afterEach(() => {
  cleanup();
});
