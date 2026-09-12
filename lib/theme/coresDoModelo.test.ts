import { describe, it, expect } from "vitest";
import { TEMPLATE_STYLES } from "@/lib/templates";
import { THEME_PRESETS, themePresetFor } from "./presets";
import { resolveTheme } from "./spec";
import { coresDoModelo } from "./coresDoModelo";

/**
 * A invariante que a UX-006 quebrava.
 *
 * Escolher um modelo no questionário preenche as três cores com a paleta dele.
 * Se o casal não mexer em mais nada, o site tem que nascer **com a paleta
 * daquele modelo** — nem mais, nem menos, nem trocada.
 *
 * Era exatamente isso que não acontecia: a cor 1 (que vira o `accent`) recebia
 * a tinta, e a cor 2 (que vira o `ink`) recebia o acento. Resultado medido na
 * auditoria de 11/09/2026, nos seis modelos: o site nascia com a cor de
 * enfeite como cor do texto, e a própria etapa avisava que o resultado ficaria
 * ilegível no celular.
 *
 * O teste vai de ponta a ponta da decisão — swatch → override → tema
 * resolvido —, porque é no meio desse caminho que a troca acontecia sem que
 * nada quebrasse.
 */

describe("coresDoModelo", () => {
  it.each(TEMPLATE_STYLES.map((e) => [e.id, e] as const))(
    "%s: escolher o modelo e não tocar em nada devolve a paleta dele",
    (id, estilo) => {
      const tema = resolveTheme(
        themePresetFor(id),
        coresDoModelo(estilo.swatches)
      );

      expect(tema.palette).toEqual(THEME_PRESETS[id].palette);
    }
  );

  it("a cor do texto é a tinta escura do modelo, não o acento", () => {
    const toscana = TEMPLATE_STYLES.find((e) => e.id === "toscana")!;
    const cores = coresDoModelo(toscana.swatches);

    // #33351f é a tinta do Toscana; #9c8654, o acento dourado.
    expect(cores.secondaryColor).toBe("#33351f");
    expect(cores.primaryColor).toBe("#9c8654");
  });

  it("sem swatches, não inventa cor — devolve vazio e o preset vale", () => {
    const cores = coresDoModelo([]);
    expect(cores).toEqual({
      primaryColor: "",
      secondaryColor: "",
      tertiaryColor: "",
    });

    const tema = resolveTheme(themePresetFor("classico"), cores);
    expect(tema.palette).toEqual(THEME_PRESETS.classico.palette);
  });
});
