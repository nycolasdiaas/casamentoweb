/**
 * A guarda de voz — spec `design-system/006`.
 *
 * ── Por que ela pôde ser ligada ────────────────────────────────────────────
 *
 * A primeira medição desta ferramenta, em 25/08/2026, devolveu **98 achados,
 * ~80 deles ruído** — `"use cache"`, `"next/cache"`, `"preview_ready"`,
 * `"slug"` —, e a conclusão registrada foi que *"um literal de string não é
 * texto visível"*. Estava certa sobre o que faltava e errada sobre ser
 * impossível: o discriminador existe, só não é léxico. É **posicional**.
 *
 * Import é import, diretiva é diretiva, chave de objeto é chave, argumento de
 * `cacheTag` é etiqueta de cache. O compilador distingue cada um sem
 * heurística — ver `ehTextoDeGente` em `varrer.ts`.
 *
 * Com o filtro, sobraram **18 achados e todos eram reais**: nove "Inválido"
 * que não diziam o que fazer, três "template", dois "RSVP" na vitrine, um
 * "experiência", um "simplesmente", um "slug" numa mensagem de erro. Corrigir
 * esses dezoito revelou mais quatro que estavam escondidos atrás do ruído —
 * incluindo os três `RSVP` que o convidado via nos moldes Editorial e Toscana,
 * que era a pior violação de voz do produto no ar.
 *
 * Hoje o varredor devolve zero, e este teste é o que impede o dezenove.
 */

import { describe, it, expect } from "vitest";
import { varrer, descrever, listarArquivos } from "./varrer";
import {
  PALAVRAS_PROIBIDAS,
  TERMOS_TECNICOS,
  SO_PARA_O_CONVIDADO,
  TRADUCAO,
} from "./vocabulario";

const RAIZ = process.cwd();

describe("nenhuma palavra proibida chega à tela", () => {
  it("o produto inteiro passa", () => {
    const achados = varrer(RAIZ);

    /* A mensagem é a metade que importa: um teste que só diz "falhou" manda a
       pessoa procurar. Este diz onde, qual palavra e o que escrever no lugar. */
    expect(
      achados.map(descrever).join("\n"),
      achados.length === 0
        ? ""
        : `\n${achados.length} texto(s) fora da voz do produto.\n` +
            "Corrija, ou escreva `// voz-ok: <motivo>` nas linhas acima se for\n" +
            "exceção legítima (homógrafa, citação, nome próprio).\n"
    ).toBe("");
  });
});

describe("a varredura olha onde deve", () => {
  it("cobre `app`, `components` e `lib`", () => {
    const arquivos = listarArquivos(RAIZ);
    expect(arquivos.length).toBeGreaterThan(100);
    for (const raiz of ["app", "components", "lib"]) {
      expect(arquivos.some((a) => a.includes(`${raiz}`))).toBe(true);
    }
  });

  it("não varre teste nem as prévias com casal fictício", () => {
    /* As prévias de `/pacotes/estilos` são a vitrine com casal inventado, onde
       inventar contexto é justamente o trabalho (SDD §4.4.1). E teste cita as
       palavras para conferi-las. */
    const arquivos = listarArquivos(RAIZ);
    expect(arquivos.some((a) => /\.test\.tsx?$/.test(a))).toBe(false);
    expect(arquivos.some((a) => a.includes("pacotes"))).toBe(true);
    const comBarra = (a: string) => a.split("\\").join("/");
    expect(
      arquivos.some((a) => comBarra(a).includes("pacotes/estilos/"))
    ).toBe(false);
  });
});

describe("o vocabulário", () => {
  it("toda palavra proibida tem tradução", () => {
    // Um teste que proíbe sem dizer o que escrever no lugar transfere o
    // trabalho para quem foi reprovado.
    for (const termo of [...PALAVRAS_PROIBIDAS, ...TERMOS_TECNICOS]) {
      expect(TRADUCAO[termo], termo).toBeTruthy();
    }
  });

  it("`RSVP` é conferido com sensibilidade a maiúscula", () => {
    /* A sigla é banida; a palavra "rsvp" minúscula é chave de seção
       (`SectionKey`), e bani-la reprovaria o contrato do motor de templates. */
    expect(SO_PARA_O_CONVIDADO).toEqual(["RSVP"]);
  });
});
