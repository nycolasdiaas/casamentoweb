import { describe, it, expect } from "vitest";
import { parseThemeSpec, resolveTheme, type ThemeSpec } from "./spec";

const valido: ThemeSpec = {
  version: 1,
  palette: {
    outer: "#2f3a2a",
    paper: "#f2efe7",
    ink: "#3d4a36",
    accent: "#b8985f",
  },
  fonts: { display: "cormorant", body: "lora", script: "pinyon" },
};

describe("parseThemeSpec", () => {
  it("accepts a well-formed theme", () => {
    expect(parseThemeSpec(valido)).toEqual(valido);
  });

  it("accepts the same object after a JSON round-trip (as it comes from jsonb)", () => {
    expect(parseThemeSpec(JSON.parse(JSON.stringify(valido)))).toEqual(valido);
  });

  it.each([
    ["null", null],
    ["string", "tema"],
    ["array", []],
    ["objeto vazio", {}],
  ])("rejects %s", (_label, value) => {
    expect(parseThemeSpec(value)).toBeNull();
  });

  it("rejects an unknown version", () => {
    expect(parseThemeSpec({ ...valido, version: 2 })).toBeNull();
  });

  it("rejects a color that is not a hex", () => {
    const ruim = { ...valido, palette: { ...valido.palette, ink: "verde" } };
    expect(parseThemeSpec(ruim)).toBeNull();
  });

  it("rejects a missing palette role", () => {
    const semAccent = {
      ...valido,
      palette: {
        outer: valido.palette.outer,
        paper: valido.palette.paper,
        ink: valido.palette.ink,
      },
    };
    expect(parseThemeSpec(semAccent)).toBeNull();
  });

  it("rejects a font outside the catalogue", () => {
    const ruim = { ...valido, fonts: { ...valido.fonts, display: "comic-sans" } };
    expect(parseThemeSpec(ruim)).toBeNull();
  });
});

describe("resolveTheme", () => {
  it("returns the preset untouched when the couple chose nothing", () => {
    expect(resolveTheme(valido)).toEqual(valido);
  });

  it("uses the couple's primary colour as the accent", () => {
    const t = resolveTheme(valido, { primaryColor: "#c65a2e" });
    expect(t.palette.accent).toBe("#c65a2e");
    // o resto do preset continua de pé
    expect(t.palette.paper).toBe(valido.palette.paper);
  });

  it("uses the secondary colour as the ink and the chosen font as display", () => {
    const t = resolveTheme(valido, {
      secondaryColor: "#1f2a44",
      fontStyle: "playfair",
    });
    expect(t.palette.ink).toBe("#1f2a44");
    expect(t.fonts.display).toBe("playfair");
    expect(t.fonts.body).toBe(valido.fonts.body);
  });

  // O ponto que protege o casal: campo mal preenchido nunca deixa o site feio.
  it("ignores invalid choices instead of applying them", () => {
    const t = resolveTheme(valido, {
      primaryColor: "azul",
      secondaryColor: "#GGGGGG",
      fontStyle: "fonte-inexistente",
    });
    expect(t).toEqual(valido);
  });

  it("ignores null and empty values", () => {
    const t = resolveTheme(valido, {
      primaryColor: null,
      secondaryColor: "",
      fontStyle: null,
    });
    expect(t).toEqual(valido);
  });

  it("never mutates the preset it was given", () => {
    const copia = structuredClone(valido);
    resolveTheme(valido, { primaryColor: "#c65a2e", fontStyle: "playfair" });
    expect(valido).toEqual(copia);
  });
});
