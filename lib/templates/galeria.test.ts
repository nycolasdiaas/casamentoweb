/**
 * Os seis estilos — spec `site-publico/005`, sem a galeria.
 *
 * O que estes testes guardam é a regra de §4.4.1 aplicada à vitrine: a cor e a
 * fonte de cada cartão saem do `defaultTheme` do molde, nunca de uma cópia
 * guardada ao lado. Uma cópia é uma segunda verdade — e a segunda verdade é
 * sempre a que fica velha, mostrando ao casal um estilo que o site não entrega
 * mais.
 *
 * ── O que saiu daqui, e por quê ────────────────────────────────────────────
 *
 * A tela de comparação (`/pacotes/estilos`) foi removida a pedido do dono em
 * 15/09/2026. Com ela foram os critérios que só existiam para aquela página
 * (SC-005, SC-007, SC-008, SC-009, SC-012) e o SC-010, que exigia a porta da
 * home para ela. As PRÉVIAS de cada estilo (`/pacotes/estilos/<id>`) ficam:
 * são elas que a home, os pacotes e o questionário abrem.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { TEMPLATE_STYLES } from "@/lib/templates";
import { getTemplate } from "@/lib/templates/registry";
import { FONT_STYLES } from "@/lib/customization";

const HOME = readFileSync(resolve(process.cwd(), "app/page.tsx"), "utf-8");
const CHROME = readFileSync(
  resolve(process.cwd(), "components/templates/TemplateChrome.tsx"),
  "utf-8"
);

/* Sem comentário: o `TemplateChrome` CITA o rótulo antigo para explicar por
   que não o usa, e `grep` não distingue a citação do uso. */
const semComentario = (t: string) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const CHROME_CODIGO = semComentario(CHROME);

describe("os seis estilos", () => {
  it("SC-003: são seis, com os nomes do artboard", () => {
    expect(TEMPLATE_STYLES.map((e) => e.name)).toEqual([
      "Clássico",
      "Moderno",
      "Romântico",
      "Toscana",
      "Film",
      "Editorial",
    ]);
  });

  it("SC-015: cada um tem caráter, e o do Film é o do artboard", () => {
    expect(
      TEMPLATE_STYLES.every(
        (t) => typeof t.carater === "string" && t.carater.length > 0
      )
    ).toBe(true);
    const film = TEMPLATE_STYLES.find((e) => e.id === "film")!;
    expect(film.carater).toBe("grão · mudo · cinematográfico");
  });

  it("o caráter é curto — três palavras para varrer seis cartões", () => {
    for (const { carater, name } of TEMPLATE_STYLES) {
      expect(carater.split(" · ").length, name).toBeLessThanOrEqual(3);
      expect(carater.length, name).toBeLessThan(34);
      // Substantivos soltos, não frase: sem ponto final e sem maiúscula.
      expect(carater.endsWith("."), name).toBe(false);
    }
  });
});

describe("SC-004 e SC-006: cor e fonte saem do molde, não de cópia", () => {
  it("os seis moldes estão portados e trazem `defaultTheme`", () => {
    for (const { id } of TEMPLATE_STYLES) {
      const molde = getTemplate(id);
      expect(molde, id).not.toBeNull();
      expect(molde!.defaultTheme.palette.paper, id).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("SC-006: as três linhas do painel existem para todo estilo", () => {
    for (const { id, name } of TEMPLATE_STYLES) {
      const tema = getTemplate(id)!.defaultTheme;
      const nome = (f: string) => FONT_STYLES.find((x) => x.id === f)?.name;
      expect(nome(tema.fonts.display), `${name} · títulos`).toBeTruthy();
      expect(nome(tema.fonts.body), `${name} · texto`).toBeTruthy();
      for (const cor of [
        tema.palette.outer,
        tema.palette.ink,
        tema.palette.accent,
      ]) {
        expect(cor, `${name} · paleta`).toMatch(/^#[0-9a-f]{6}$/i);
      }
    }
  });

  it("o Film: fonte de títulos e paleta do preset dele", () => {
    const tema = getTemplate("film")!.defaultTheme;
    // Prata nos títulos e Great Vibes na caligráfica: o que desenha os nomes
    // do casal é a de TÍTULOS.
    expect(FONT_STYLES.find((f) => f.id === tema.fonts.display)?.name).toBe(
      "Prata"
    );
    expect(FONT_STYLES.find((f) => f.id === tema.fonts.script)?.name).toBe(
      "Great Vibes"
    );
    expect([
      tema.palette.outer,
      tema.palette.ink,
      tema.palette.accent,
    ]).toEqual(["#2a231b", "#3c3227", "#a5603a"]);
  });
});

describe("as ligações dos estilos", () => {
  it("a home abre a prévia de cada estilo", () => {
    expect(HOME).toContain("/pacotes/estilos/${style.id}");
  });

  it("SC-011: o caminho de volta da prévia é onde se escolhe o estilo", () => {
    /* O que este critério trava não é o desenho da seta: é o DESTINO. Com a
       galeria removida, o lugar onde se escolhe qual prévia abrir são os seis
       cartões da home. */
    expect(CHROME).toContain("Estilos");
    expect(CHROME).toContain('nome="setaEsquerda"');
    expect(CHROME).toContain('href="/#estilos"');
    /* O rótulo antigo continua proibido pelo literal exato: ele levava para o
       topo da landing, e é essa volta errada que o critério existe para
       impedir. */
    expect(CHROME_CODIGO).not.toContain("← Pacotes");
  });
});
