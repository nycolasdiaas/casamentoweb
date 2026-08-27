/**
 * O painel de Modelos do editor — spec `painel-casal/007`.
 *
 * A lógica de re-tematizar está provada em `lib/site/inviteTema.test.ts`. Aqui
 * é o que a tela faz antes de chamá-la: mostrar as seis, marcar a que está em
 * uso, e perguntar antes de mudar a tela inteira de uma vez.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, act } from "@testing-library/react";
import PainelDeModelos from "./PainelDeModelos";
import type { ModeloDeConvite } from "@/lib/templates/modelos";

const PAINEL = readFileSync(
  resolve(process.cwd(), "components/account/convite/PainelDeModelos.tsx"),
  "utf-8"
);
const EDITOR = readFileSync(
  resolve(process.cwd(), "components/account/convite/EditorDeConvite.tsx"),
  "utf-8"
);

const MODELOS: ModeloDeConvite[] = [
  {
    id: "classico",
    nome: "Clássico",
    paleta: {
      outer: "#232514",
      paper: "#f2efe7",
      ink: "#3d4a36",
      accent: "#b8985f",
    },
  },
  {
    id: "toscana",
    nome: "Toscana",
    paleta: {
      outer: "#232514",
      paper: "#f3eddd",
      ink: "#33351f",
      accent: "#9c8654",
    },
  },
  {
    id: "film",
    nome: "Film",
    paleta: {
      outer: "#2a231b",
      paper: "#f3ebda",
      ink: "#3c3227",
      accent: "#a5603a",
    },
  },
];

function montar(atual: "classico" | "toscana" | "film" | null = null) {
  document.body.innerHTML = "";
  const aoTrocar = vi.fn();
  const { container } = render(
    <PainelDeModelos modelos={MODELOS} atual={atual} aoTrocar={aoTrocar} />
  );
  return { container, aoTrocar };
}

beforeEach(() => vi.clearAllMocks());

describe("SC-002: as miniaturas saem do preset do molde", () => {
  it("uma por modelo, com a cor de cada um", () => {
    const { container } = montar();
    const minis = [...container.querySelectorAll("[data-modelo]")];
    expect(minis).toHaveLength(3);

    const toscana = container.querySelector(
      '[data-modelo="toscana"]'
    ) as HTMLElement;
    // `#f3eddd` é o `paper` do preset do Toscana. Se o preset mudar, isto muda
    // junto — nenhuma cor está escrita na tela.
    expect(toscana.style.background).toBe("rgb(243, 237, 221)");
  });

  it("nenhum hex literal no componente", () => {
    const codigo = PAINEL.replace(/\/\*[\s\S]*?\*\//g, "").replace(
      /^\s*\/\/.*$/gm,
      ""
    );
    expect(codigo).not.toMatch(/#[0-9a-fA-F]{6}\b/);
  });

  it("o registry NÃO é importado aqui", () => {
    /* O painel é client component; importar o registry arrastaria os seis
       moldes para o navegador, e com eles as consultas com `"use cache"` que o
       Next recusa em componente de cliente. As paletas vêm do servidor. */
    expect(PAINEL).not.toContain("templates/registry");
  });
});

describe("SC-003: a miniatura em uso é marcada", () => {
  it("contorno `--c-mark` e `aria-current`", () => {
    const { container } = montar("film");
    const film = container.querySelector('[data-modelo="film"]') as HTMLElement;
    expect(film.getAttribute("aria-current")).toBe("true");
    expect(film.style.border).toContain("var(--c-mark)");

    const outro = container.querySelector(
      '[data-modelo="classico"]'
    ) as HTMLElement;
    expect(outro.getAttribute("aria-current")).toBeNull();
    expect(outro.style.border).toContain("var(--c-rule)");
  });

  it("sem estilo definido, nenhuma fica marcada", () => {
    const { container } = montar(null);
    expect(container.querySelector("[aria-current]")).toBeNull();
  });
});

describe("SC-006: pergunta antes de mudar a tela inteira", () => {
  it("clicar abre o diálogo e NÃO troca nada ainda", () => {
    const { container, aoTrocar } = montar();

    act(() => {
      (container.querySelector('[data-modelo="toscana"]') as HTMLElement).click();
    });

    const dialogo = document.querySelector('[role="dialog"]')!;
    expect(dialogo.textContent).toContain("Trocar o modelo do convite?");
    expect(dialogo.textContent).toContain(
      "As cores e as fontes mudam para as do estilo novo."
    );
    expect(dialogo.textContent).toContain(
      "O texto e a posição dos blocos ficam como estão."
    );
    expect(aoTrocar).not.toHaveBeenCalled();
  });

  it("a saída segura recebe o foco", () => {
    const { container } = montar();
    act(() => {
      (container.querySelector('[data-modelo="toscana"]') as HTMLElement).click();
    });
    expect(document.activeElement?.textContent).toBe("Manter");
  });

  it("`Trocar modelo` entrega a paleta daquele modelo", () => {
    const { container, aoTrocar } = montar();
    act(() => {
      (container.querySelector('[data-modelo="film"]') as HTMLElement).click();
    });
    act(() => {
      screen.getByRole("button", { name: "Trocar modelo" }).click();
    });
    expect(aoTrocar).toHaveBeenCalledWith(MODELOS[2].paleta);
  });
});

describe("SC-006, SC-007, SC-009: o que o editor faz com a troca", () => {
  it("uma entrada de desfazer, como qualquer gesto", () => {
    // `mudar` seguido de `registrar(antes)` é o mesmo par que o arrasto usa.
    expect(EDITOR).toContain(
      "mudar((d) => retematizarConvite(d, paletaAtual.current, nova));"
    );
    // O arquivo tem finais de linha do Windows; a ordem é o que importa.
    expect(EDITOR).toMatch(/registrar\(antes\);\s+paletaAtual\.current = nova;/);
  });

  it("a paleta de referência avança a cada troca", () => {
    /* A segunda troca precisa comparar contra a paleta ATUAL, não contra a do
       site — que ficou para trás na primeira. Sem isto, trocar duas vezes
       deixaria de reconhecer as cores e nada mudaria na segunda. */
    expect(EDITOR).toContain("paletaAtual = useRef<ThemePalette>(paletaDoSite)");
  });

  it("SC-009: nada aqui toca no estilo do SITE", () => {
    /* As duas escolhas são independentes desde o `inviteSeed`. Ligá-las agora
       faria o casal mudar o site sem saber, a partir de uma tela de convite. */
    expect(PAINEL).not.toContain("templateId");
    expect(PAINEL).not.toContain("saveThemeAction");
    expect(EDITOR).not.toContain("aplicarTemplateAction");
  });
});
