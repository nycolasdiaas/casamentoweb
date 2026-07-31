import { describe, it, expect } from "vitest";
import { parseThemeForm, avisosDeContraste, contraste } from "./themeInput";

function form(campos: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(campos)) fd.set(k, v);
  return fd;
}

const VALIDO = {
  outer: "#e9e8e4",
  paper: "#fafafa",
  ink: "#1c1c1c",
  accent: "#bd5b32",
  display: "cormorant",
  body: "lora",
  script: "allura",
};

// O catálogo do molde Clássico, por exemplo — curto de propósito.
const DO_MOLDE = new Set(["cormorant", "lora", "allura", "playfair"]);

describe("parseThemeForm", () => {
  it("aceita um tema completo e válido", () => {
    const r = parseThemeForm(form(VALIDO), DO_MOLDE);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.version).toBe(1);
    expect(r.value.palette.accent).toBe("#bd5b32");
    expect(r.value.fonts.display).toBe("cormorant");
  });

  it("recusa cor que não é hex", () => {
    for (const ruim of ["vermelho", "rgb(0,0,0)", "#12", "", "#gggggg"]) {
      const r = parseThemeForm(form({ ...VALIDO, accent: ruim }), DO_MOLDE);
      expect(r.ok, ruim).toBe(false);
    }
  });

  it("nomeia o papel da cor no erro, não a chave técnica", () => {
    const r = parseThemeForm(form({ ...VALIDO, ink: "roxo" }), DO_MOLDE);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toContain("cor do texto");
  });

  // A regra central: fonte fora do catálogo do molde não entra. O
  // clampThemeFonts já a descartaria ao renderizar, e aí o casal veria a
  // escolha dele ser ignorada sem explicação.
  it("recusa fonte que existe no catálogo global mas não neste molde", () => {
    const r = parseThemeForm(form({ ...VALIDO, display: "amatic" }), DO_MOLDE);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toContain("não faz parte deste modelo");
  });

  it("recusa fonte inexistente", () => {
    const r = parseThemeForm(
      form({ ...VALIDO, body: "comic-sans" }),
      DO_MOLDE
    );
    expect(r.ok).toBe(false);
  });

  it("recusa campo de fonte ausente", () => {
    const semScript = { ...VALIDO };
    delete (semScript as Record<string, string>).script;
    const r = parseThemeForm(form(semScript), DO_MOLDE);
    expect(r.ok).toBe(false);
  });

  it("aceita a mesma fonte em papéis diferentes", () => {
    const r = parseThemeForm(
      form({ ...VALIDO, display: "lora", body: "lora" }),
      DO_MOLDE
    );
    expect(r.ok).toBe(true);
  });
});

describe("contraste", () => {
  it("dá 21 entre preto e branco", () => {
    expect(Math.round(contraste("#000000", "#ffffff"))).toBe(21);
  });

  it("dá 1 entre cores iguais", () => {
    expect(contraste("#3d4a36", "#3d4a36")).toBeCloseTo(1, 5);
  });

  it("entende hex de 3 dígitos", () => {
    expect(Math.round(contraste("#000", "#fff"))).toBe(21);
  });
});

describe("avisosDeContraste", () => {
  it("não reclama de uma paleta legível", () => {
    expect(
      avisosDeContraste({
        outer: "#e9e8e4",
        paper: "#ffffff",
        ink: "#1c1c1c",
        accent: "#a04a20",
      })
    ).toEqual([]);
  });

  // O caso que motiva o aviso: casal escolhe bege sobre bege, fica bonito na
  // tela do computador e ilegível no celular sob sol.
  it("avisa quando o texto quase desaparece no fundo", () => {
    const avisos = avisosDeContraste({
      outer: "#f2efe7",
      paper: "#f2efe7",
      ink: "#e8e4da",
      accent: "#efece4",
    });
    expect(avisos.length).toBeGreaterThan(0);
    expect(avisos.join(" ")).toContain("contraste");
  });

  it("avisa quando o destaque não se distingue do fundo", () => {
    const avisos = avisosDeContraste({
      outer: "#ffffff",
      paper: "#ffffff",
      ink: "#000000",
      accent: "#fdfdfd",
    });
    expect(avisos.join(" ")).toContain("destaque");
  });
});
