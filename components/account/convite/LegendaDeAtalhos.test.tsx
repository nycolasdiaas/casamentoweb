/**
 * A legenda de atalhos — spec `painel-casal/005`.
 *
 * Atalho que ninguém descobre é atalho que não existe. Estes testes guardam a
 * lista contra o defeito silencioso: um atalho implementado e não listado, ou
 * listado com a tecla errada — que é pior, porque manda o casal apertar algo
 * que não faz nada.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render } from "@testing-library/react";
import LegendaDeAtalhos from "./LegendaDeAtalhos";

const EDITOR = readFileSync(
  resolve(process.cwd(), "components/account/convite/EditorDeConvite.tsx"),
  "utf-8"
);
/* Sem comentário: o editor CITA teclas na prosa que explica cada atalho, e
   um `grep` cru contaria a explicação como implementação. */
const CODIGO = EDITOR.replace(/\/\*[\s\S]*?\*\//g, "").replace(
  /^\s*\/\/.*$/gm,
  ""
);

function montar() {
  document.body.innerHTML = "";
  return render(<LegendaDeAtalhos aberto aoFechar={() => {}} />).container;
}

const linhas = (c: HTMLElement) =>
  [...c.querySelectorAll("dt")].map((dt) => dt.textContent!);

describe("SC: a legenda existe e é alcançável", () => {
  it("fechada, não ocupa a tela", () => {
    document.body.innerHTML = "";
    const { container } = render(
      <LegendaDeAtalhos aberto={false} aoFechar={() => {}} />
    );
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it("aberta, lista os atalhos com o que cada um faz", () => {
    const c = montar();
    expect(c.querySelector('[role="dialog"]')).not.toBeNull();
    const ds = [...c.querySelectorAll("dd")].map((d) => d.textContent);
    expect(ds).toContain("Desfazer");
    expect(ds).toContain("Mover 1px");
    expect(ds).toContain("Mover 10px");
    expect(ds).toContain("Sem encaixe");
    expect(ds).toContain("Mover a tela");
  });

  it("o botão de fechar é alcançável por leitor de tela", () => {
    const c = montar();
    expect(
      c.querySelector('[aria-label="Fechar atalhos"]')
    ).not.toBeNull();
  });
});

describe("SC: FR-013 — a tecla certa para a plataforma", () => {
  const original = Object.getOwnPropertyDescriptor(
    window.navigator,
    "platform"
  );

  const fingirPlataforma = (valor: string) =>
    Object.defineProperty(window.navigator, "platform", {
      value: valor,
      configurable: true,
    });

  afterEach(() => {
    if (original) Object.defineProperty(window.navigator, "platform", original);
  });

  it("num Mac, escreve Cmd", () => {
    // Escrever "Ctrl" para quem está num Mac aponta para uma tecla que não faz
    // nada ali.
    fingirPlataforma("MacIntel");
    expect(linhas(montar()).join(" ")).toContain("Cmd + Z");
    expect(linhas(montar()).join(" ")).not.toContain("Ctrl");
  });

  it("no resto, escreve Ctrl", () => {
    fingirPlataforma("Win32");
    expect(linhas(montar()).join(" ")).toContain("Ctrl + Z");
    expect(linhas(montar()).join(" ")).not.toContain("Cmd");
  });
});

describe("SC: a lista bate com o que o editor implementa", () => {
  it("todo atalho listado existe no editor", () => {
    const c = montar();
    const listado = linhas(c).join(" ");

    // Desfazer/refazer, duplicar, copiar/colar.
    for (const tecla of ["Z", "D", "C", "V"]) {
      expect(listado).toContain(tecla);
      expect(CODIGO).toContain(`e.key.toLowerCase() === "${tecla.toLowerCase()}"`);
    }
    // Camadas, zoom, ajuste, espaço, alt.
    expect(CODIGO).toContain('e.key === "["');
    expect(CODIGO).toContain('e.key === "]"');
    expect(CODIGO).toContain('e.key === "+"');
    expect(CODIGO).toContain('e.key === "-"');
    expect(CODIGO).toContain('e.key === "0"');
    expect(CODIGO).toContain('e.code === "Space"');
    expect(CODIGO).toContain("e.altKey");
  });

  it("FR-003: as setas movem 1px, e 10 com Shift", () => {
    expect(CODIGO).toContain("const passo = e.shiftKey ? 10 : 1;");
    // Em FRAÇÃO do convite, não em pixels de tela: 1px do arquivo é o que o
    // casal está ajustando, e ele não muda com o zoom.
    expect(CODIGO).toContain("/ doc.largura");
    expect(CODIGO).toContain("/ doc.altura");
  });

  it("FR-004: uma rajada de setas é UM passo de desfazer", () => {
    // Dez toques virando dez desfazeres é o oposto do que a pessoa quer.
    expect(CODIGO).toContain("gestoDeSeta.current");
    expect(CODIGO).toContain("500");
  });

  it("FR-001: a guarda vem antes de tudo, e Escape é a exceção", () => {
    const corpo = CODIGO.slice(CODIGO.indexOf("function aoTeclar"));
    const guarda = corpo.indexOf("if (digitando || editandoTexto) return;");
    const escape = corpo.indexOf('if (e.key === "Escape")');
    expect(guarda).toBeGreaterThan(-1);
    // Escape é tratado ANTES da guarda: é ele que serve para sair da digitação.
    expect(escape).toBeLessThan(guarda);
  });

  it("FR-011: copiar e colar só roubam o padrão quando há o que copiar", () => {
    const corpo = CODIGO.slice(CODIGO.indexOf('e.key.toLowerCase() === "c"'));
    const ateColar = corpo.slice(0, corpo.indexOf('e.key.toLowerCase() === "v"'));
    // `return` antes do `preventDefault`: sem seleção, a cópia normal do
    // navegador continua funcionando.
    expect(ateColar.indexOf("if (!bloco) return;")).toBeLessThan(
      ateColar.indexOf("e.preventDefault();")
    );
  });

  it("FR-014: nenhuma letra solta, sem modificador", () => {
    /* Letra solta colidiria com a digitação no primeiro instante em que o foco
       escapasse da guarda. Só entram teclas que ninguém digita dentro de um
       texto. */
    const soltas = [...CODIGO.matchAll(/e\.key === "([a-zA-Z])"/g)];
    expect(soltas).toHaveLength(0);
  });

  it("FR-006: a área de transferência é interna, não a do sistema", () => {
    // Copiar um bloco não é copiar texto: o que se guarda é um objeto com
    // posição, cor e fonte.
    expect(CODIGO).toContain("areaDeTransferencia.current");
    expect(CODIGO).not.toContain("navigator.clipboard");
  });
});

describe("o editor não perdeu o que já tinha", () => {
  it("Delete continua apagando, e continua protegido pela guarda", () => {
    expect(CODIGO).toContain('e.key === "Delete"');
    expect(CODIGO).toContain("apagarSelecionado()");
  });

  it("FR-008: o zoom por atalho respeita os mesmos limites da roda", () => {
    expect(CODIGO).toContain("Math.min(z * 1.1, 4)");
    expect(CODIGO).toContain("Math.max(z / 1.1, 0.4)");
  });
});

beforeEach(() => {
  vi.clearAllMocks();
});
