/**
 * O comportamento do diálogo destrutivo — transição #3 e Voz V4.
 *
 * Por que teste e não clique no navegador: o componente só existe atrás de
 * autenticação (cancelar pedido, apagar cota, apagar convite), e as coisas que
 * importam aqui são de TEMPO e de FOCO — "o nó saiu do DOM em 140ms", "o foco
 * foi para Manter". Cronometrar isso à mão num navegador mede a mão, não o
 * componente.
 *
 * As regras de Voz V4 (o botão repete o verbo, a saída segura vem primeiro e
 * recebe o foco) entram junto: elas não são de movimento, mas são o que não
 * pode regredir enquanto se mexe no movimento.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import DialogoDestrutivo from "./DialogoDestrutivo";

function abrir() {
  act(() => {
    screen.getByRole("button", { name: "Apagar esta foto" }).click();
  });
}

function montar(onConfirmar?: () => void) {
  return render(
    <DialogoDestrutivo
      gatilho="Apagar esta foto"
      titulo="Apagar esta foto?"
      confirmar="Apagar"
      onConfirmar={onConfirmar}
    >
      Ela sai do site na hora.
    </DialogoDestrutivo>
  );
}

/** Por padrão o ambiente não pede movimento reduzido. */
function matchMediaFalso(reduzido: boolean) {
  vi.stubGlobal("matchMedia", (q: string) => ({
    matches: q.includes("prefers-reduced-motion") ? reduzido : false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    onchange: null,
    dispatchEvent: () => false,
  }));
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  matchMediaFalso(false);
  document.documentElement.removeAttribute("data-movimento");
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("DialogoDestrutivo", () => {
  it("abre com as classes de entrada da transição #3", () => {
    montar();
    abrir();

    const caixa = document.querySelector(".dialogo-caixa");
    const scrim = document.querySelector(".dialogo-scrim");

    expect(caixa).not.toBeNull();
    expect(scrim).not.toBeNull();
    // A entrada genérica de card não pode voltar: ela sobe 20px, sem escala.
    expect(document.querySelector(".motion-rise-in")).toBeNull();
    expect(caixa?.classList.contains("dialogo-saindo")).toBe(false);
  });

  it("dá o foco para a saída segura, não para a destrutiva (Voz V4)", () => {
    montar();
    abrir();
    expect(document.activeElement?.textContent).toBe("Manter");
  });

  it("o botão perigoso repete o verbo e é contorno, nunca preenchido", () => {
    montar();
    abrir();
    const perigo = screen.getByRole("button", { name: "Apagar" });
    expect(perigo.className).toContain("btn-perigo");
    expect(perigo.className).not.toContain("btn-ink");
  });

  it("fecha em 140ms, com fade reverso — não some no quadro do clique", () => {
    montar();
    abrir();

    act(() => {
      screen.getByRole("button", { name: "Manter" }).click();
    });

    // Ainda montado, agora marcado como saindo: é isso que dá o fade reverso.
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    expect(
      document.querySelector(".dialogo-caixa")?.classList.contains("dialogo-saindo")
    ).toBe(true);

    act(() => {
      vi.advanceTimersByTime(140);
    });

    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it("Escape fecha pelo mesmo caminho", () => {
    montar();
    abrir();

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(
      document.querySelector(".dialogo-caixa")?.classList.contains("dialogo-saindo")
    ).toBe(true);

    act(() => {
      vi.advanceTimersByTime(140);
    });
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it("confirmar NÃO espera o fade: a ação já foi dada", () => {
    const onConfirmar = vi.fn();
    montar(onConfirmar);
    abrir();

    act(() => {
      screen.getByRole("button", { name: "Apagar" }).click();
    });

    // Sem avançar o relógio: 140ms entre o clique e o efeito é latência que o
    // gesto não pediu, numa ação destrutiva já confirmada.
    expect(onConfirmar).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it("com movimento reduzido, fecha no quadro do clique", () => {
    matchMediaFalso(true);
    montar();
    abrir();

    act(() => {
      screen.getByRole("button", { name: "Manter" }).click();
    });

    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it("respeita o interruptor: movimento LIGADO à mão vence o sistema", () => {
    matchMediaFalso(true);
    document.documentElement.dataset.movimento = "ligado";
    montar();
    abrir();

    act(() => {
      screen.getByRole("button", { name: "Manter" }).click();
    });

    // Pediu movimento, então o fade reverso acontece mesmo com o sistema
    // dizendo "reduza" — é a mesma regra do `html:not([data-movimento=...])`
    // que o globals.css usa em toda animação.
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    act(() => {
      vi.advanceTimersByTime(140);
    });
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });
});
