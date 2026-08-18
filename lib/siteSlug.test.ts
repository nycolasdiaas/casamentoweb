import { describe, it, expect } from "vitest";
import {
  slugifyCoupleNames,
  isValidSiteSlug,
  isReservedSlug,
  generateSiteSlug,
} from "./siteSlug";

describe("slugifyCoupleNames", () => {
  it("turns couple names into a readable slug", () => {
    expect(slugifyCoupleNames("Ana & Pedro")).toBe("ana-e-pedro");
    expect(slugifyCoupleNames("Isabelle e Nycolas")).toBe("isabelle-e-nycolas");
  });

  it("strips accents", () => {
    expect(slugifyCoupleNames("Antônio & Conceição")).toBe(
      "antonio-e-conceicao"
    );
  });

  it("collapses punctuation and spaces", () => {
    expect(slugifyCoupleNames("  João   ---  Maria!!! ")).toBe("joao-maria");
  });

  it("never leaves a trailing hyphen, even when truncating", () => {
    const slug = slugifyCoupleNames("a".repeat(38) + " b");
    expect(slug.endsWith("-")).toBe(false);
  });
});

describe("isValidSiteSlug", () => {
  it("accepts a normal slug", () => {
    expect(isValidSiteSlug("ana-e-pedro")).toBe(true);
  });

  it("rejects slugs that are too short or too long", () => {
    expect(isValidSiteSlug("ab")).toBe(false);
    expect(isValidSiteSlug("a".repeat(41))).toBe(false);
  });

  it("rejects leading/trailing/double hyphens and uppercase", () => {
    expect(isValidSiteSlug("-ana")).toBe(false);
    expect(isValidSiteSlug("ana-")).toBe(false);
    expect(isValidSiteSlug("ana--pedro")).toBe(false);
    expect(isValidSiteSlug("Ana-Pedro")).toBe(false);
  });

  // Sem isto, um casal chamado "admin" tornaria /admin inacessível — e na
  // Fase 2, um slug "mail" ou "www" quebraria e-mail e site institucional.
  it("rejects reserved route and infrastructure names", () => {
    for (const reserved of ["admin", "api", "conta", "www", "mail", "preview"]) {
      expect(isReservedSlug(reserved)).toBe(true);
      expect(isValidSiteSlug(reserved)).toBe(false);
    }
  });
});

describe("generateSiteSlug", () => {
  it("returns the plain slug when it is free", async () => {
    const slug = await generateSiteSlug("Ana & Pedro", async () => false);
    expect(slug).toBe("ana-e-pedro");
  });

  it("suffixes on collision", async () => {
    const taken = new Set(["ana-e-pedro", "ana-e-pedro-2"]);
    const slug = await generateSiteSlug("Ana & Pedro", async (s) =>
      taken.has(s)
    );
    expect(slug).toBe("ana-e-pedro-3");
  });

  it("skips reserved names by suffixing", async () => {
    const slug = await generateSiteSlug("admin", async () => false);
    expect(slug).toBe("admin-2");
  });

  it("falls back when the names produce nothing usable", async () => {
    const slug = await generateSiteSlug("!!!", async () => false);
    expect(slug).toBe("casamento");
  });

  // Caso REAL de produção: uma URL colada no campo dos nomes virou o endereço
  // público do site (`https-github-com-accordavaliacao-api-res`). O campo é
  // texto livre e ninguém digita errado de propósito — mas cola.
  it("drops pasted URLs instead of turning them into the address", () => {
    expect(
      slugifyCoupleNames("https://github.com/acme/repo/pull/19")
    ).not.toContain("github");
    expect(slugifyCoupleNames("Ana e Pedro www.instagram.com/ana")).toBe(
      "ana-e-pedro"
    );
    expect(slugifyCoupleNames("Ana e Pedro ana@gmail.com")).toBe("ana-e-pedro");
  });

  // A limpeza não pode recusar casal de verdade: nome com número, com hífen
  // ou de uma palavra só continua virando endereço.
  it("keeps names that only look unusual", () => {
    expect(slugifyCoupleNames("Ana-Maria e João")).toBe("ana-maria-e-joao");
    expect(slugifyCoupleNames("Casamento 2026")).toBe("casamento-2026");
    expect(slugifyCoupleNames("Iracema")).toBe("iracema");
  });
});
