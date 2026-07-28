import { describe, it, expect } from "vitest";
import { getTemplate, portedTemplateIds, isTemplatePorted } from "./registry";
import { sectionsForTier, SECTION_KEYS, type SectionKey } from "./contract";
import { THEME_PRESETS } from "@/lib/theme/presets";
import { TEMPLATE_STYLES } from "@/lib/templates";
import type { PackageTier } from "@/lib/packages";

// Invariantes estruturais de TODO molde portado.
//
// Cada molde é ~400 linhas de JSX que ninguém relê depois de escrever. Estes
// testes pegam o que passa despercebido numa revisão visual: papel de fonte
// apontando para fonte que o molde não declara (texto cai na fonte do
// sistema), seção que o pacote libera mas o molde não implementa (buraco no
// site do casal), ordem citando seção inexistente.

const portados = portedTemplateIds();

describe("registry", () => {
  it("tem ao menos um molde portado", () => {
    expect(portados.length).toBeGreaterThan(0);
  });

  it("reconhece molde não portado sem quebrar", () => {
    expect(isTemplatePorted("nao-existe")).toBe(false);
    expect(getTemplate("nao-existe")).toBeNull();
    expect(getTemplate(null)).toBeNull();
  });
});

describe.each(portados)("molde %s", (id) => {
  const molde = getTemplate(id)!;

  it("tem id coerente com a chave do registry", () => {
    expect(molde.id).toBe(id);
  });

  it("aparece no catálogo mostrado na landing", () => {
    expect(TEMPLATE_STYLES.some((s) => s.id === id)).toBe(true);
    expect(molde.meta).toBeDefined();
  });

  // Se o papel aponta para uma fonte que o molde não declara, o texto cai na
  // fonte do sistema — e o desenho inteiro se desfaz sem erro nenhum.
  it("declara todas as fontes que o tema padrão usa", () => {
    for (const papel of ["display", "body", "script"] as const) {
      const fonte = molde.defaultTheme.fonts[papel];
      expect(
        molde.fonts[fonte],
        `${id}: papel "${papel}" usa "${fonte}", que não está em fonts.ts`
      ).toBeDefined();
    }
  });

  // O preset é o que o provisionamento grava no banco no ato do pedido. Se
  // ele citar fonte fora do catálogo do molde, o site nasce com a fonte
  // errada (clampThemeFonts salva, mas silenciosamente).
  it("o preset de tema usa fontes que o molde oferece", () => {
    const preset = THEME_PRESETS[id];
    for (const papel of ["display", "body", "script"] as const) {
      expect(
        molde.fonts[preset.fonts[papel]],
        `${id}: preset usa "${preset.fonts[papel]}", ausente do catálogo do molde`
      ).toBeDefined();
    }
  });

  it("só cita seções conhecidas na ordem", () => {
    for (const key of molde.order) {
      expect(SECTION_KEYS).toContain(key);
    }
  });

  it("não repete seção na ordem", () => {
    expect(new Set(molde.order).size).toBe(molde.order.length);
  });

  it("toda seção implementada está na ordem", () => {
    for (const key of Object.keys(molde.sections) as SectionKey[]) {
      expect(molde.order, `${id}: "${key}" existe mas nunca é renderizada`).toContain(key);
    }
  });

  // Um pacote que libera a seção e um molde que não a implementa = buraco no
  // site do casal, sem erro. O mural (guestbook) é a exceção conhecida: nenhum
  // molde o implementa ainda.
  it.each(["convite", "site", "para-sempre"] as PackageTier[])(
    "implementa o que o pacote %s libera",
    (tier) => {
      const faltando = sectionsForTier(tier)
        .filter((key) => key !== "guestbook")
        .filter((key) => !molde.sections[key]);

      expect(faltando, `${id}/${tier}: sem implementação para ${faltando.join(", ")}`).toEqual([]);
    }
  );

  it("abre pela capa e fecha pelo rodapé", () => {
    expect(molde.order[0]).toBe("cover");
    expect(molde.order[molde.order.length - 1]).toBe("footer");
  });
});
