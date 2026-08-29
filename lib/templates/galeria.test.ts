/**
 * A galeria de estilos — spec `site-publico/005`.
 *
 * O que estes testes guardam é a regra de §4.4.1 aplicada à vitrine: a cor e a
 * fonte de cada cartão saem do `defaultTheme` do molde, nunca de uma cópia
 * guardada ao lado. Uma cópia é uma segunda verdade — e a segunda verdade é
 * sempre a que fica velha, mostrando ao casal um estilo que o site não entrega
 * mais.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { TEMPLATE_STYLES } from "@/lib/templates";
import { getTemplate } from "@/lib/templates/registry";
import { FONT_STYLES } from "@/lib/customization";

const GALERIA = readFileSync(
  resolve(process.cwd(), "app/pacotes/estilos/page.tsx"),
  "utf-8"
);
const HOME = readFileSync(resolve(process.cwd(), "app/page.tsx"), "utf-8");
const CHROME = readFileSync(
  resolve(process.cwd(), "components/templates/TemplateChrome.tsx"),
  "utf-8"
);

/* Sem comentário. Dois critérios desta spec proíbem um texto que os próprios
   arquivos CITAM para explicar por que não o usam: a galeria comenta que não
   diz "Usar este estilo", e o `TemplateChrome` conta que o link "← Pacotes"
   mentia sobre o destino. `grep` não distingue a citação do uso. */
const semComentario = (t: string) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const GALERIA_CODIGO = semComentario(GALERIA);
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

  it("SC-005: só o Editorial é a casa", () => {
    const aCasa = TEMPLATE_STYLES.filter((e) => e.id === "editorial");
    expect(aCasa).toHaveLength(1);
    expect(GALERIA.split('estilo.id === "editorial"').length - 1).toBe(1);
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

  it("a galeria lê `defaultTheme` e não escreve hex nenhum", () => {
    expect(GALERIA).toContain("getTemplate(estilo.id)");
    expect(GALERIA).toContain("themeToCssVars");
    // Nenhuma cor literal: trocar o preset do Toscana muda o cartão sozinho.
    const codigo = GALERIA.replace(/\/\*[\s\S]*?\*\//g, "").replace(
      /^\s*\/\/.*$/gm,
      ""
    );
    expect(codigo).not.toMatch(/#[0-9a-fA-F]{6}\b/);
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

  it("o Film do painel: fonte de títulos e paleta do preset dele", () => {
    const tema = getTemplate("film")!.defaultTheme;
    // Prata nos títulos e Great Vibes na caligráfica: o painel mostra a de
    // TÍTULOS, que é a que desenha os nomes do casal.
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

describe("as ligações da galeria", () => {
  it("SC-008: o botão do painel leva à prévia e diz o que faz", () => {
    expect(GALERIA).toContain("href={`/pacotes/estilos/${estilo.id}`}");
    expect(GALERIA).toContain("Ver este estilo");
    // "Usar este estilo" (o artboard) prometeria escolher, e a escolha só
    // acontece dentro do questionário.
    expect(GALERIA_CODIGO).not.toContain("Usar este estilo");
  });

  it("SC-011: o caminho de volta da prévia é a galeria, não a home", () => {
    /* O rótulo perdeu a seta tipográfica para o `<Icone nome="setaEsquerda">`,
       mas o que este critério trava não é o desenho da seta: é o DESTINO. O
       caminho de volta de uma prévia é a galeria, nunca a home. */
    expect(CHROME).toContain("Estilos");
    expect(CHROME).toContain('nome="setaEsquerda"');
    expect(CHROME).toContain('href="/pacotes/estilos"');
    /* O rótulo antigo continua proibido pelo literal exato: ele levava para a
       home, e é essa volta errada que o critério existe para impedir. Buscar
       só "Pacotes" daria falso positivo — a barra tem um seletor de pacote. */
    expect(CHROME_CODIGO).not.toContain("← Pacotes");
  });

  it("SC-010: a home tem porta para a galeria", () => {
    expect(HOME).toContain('href="/pacotes/estilos"');
  });

  it("SC-007: valor fora da lista cai no padrão em vez de quebrar", () => {
    expect(GALERIA).toContain('TEMPLATE_STYLES.find((e) => e.id === "editorial")!');
    expect(GALERIA).not.toContain("notFound(");
  });

  it("SC-012: server component — a seleção viaja pela URL, não por estado", () => {
    expect(GALERIA_CODIGO).not.toContain("use client");
    expect(GALERIA).not.toContain("useState");
    expect(GALERIA).toContain("searchParams");
  });

  it("SC-009: o painel vem depois da grade e some no celular", () => {
    expect(GALERIA.indexOf("data-grade-estilos")).toBeLessThan(
      GALERIA.indexOf("PainelDeDetalhe busca=")
    );
    expect(GALERIA).toContain("data-painel-estilo");
    expect(GALERIA).toContain("hidden");
  });
});
