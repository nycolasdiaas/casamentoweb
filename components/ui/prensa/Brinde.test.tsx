/**
 * A fila do brinde — transição #4 do HANDOFF-motion.
 *
 * O que importa aqui é contagem e tempo: no máximo 3 na tela, o quarto
 * descarta o mais antigo, e cada um sai sozinho em 4140ms (os 4s de
 * permanência do handoff mais os 140ms da saída). Nada disso dá para conferir
 * a olho num navegador sem cronômetro.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { BrindeProvider, useBrinde } from "./Brinde";

function Disparador({ textos }: { textos: string[] }) {
  const brinde = useBrinde();
  return (
    <button type="button" onClick={() => textos.forEach((t) => brinde(t))}>
      disparar
    </button>
  );
}

function montar(textos: string[]) {
  return render(
    <BrindeProvider>
      <Disparador textos={textos} />
    </BrindeProvider>
  );
}

const disparar = () =>
  act(() => {
    screen.getByRole("button", { name: "disparar" }).click();
  });

const brindesNaTela = () =>
  [...document.querySelectorAll(".brinde")].map((n) => n.textContent);

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => vi.useRealTimers());

describe("Brinde", () => {
  it("mostra o texto de quem dispara, com o ponto de confirmação", () => {
    montar(["Suas fotos estão no site."]);
    disparar();

    expect(brindesNaTela()).toEqual(["Suas fotos estão no site."]);
    // O ponto verde é decoração e não pode ser anunciado pelo leitor de tela.
    expect(
      document.querySelector(".brinde span[aria-hidden='true']")
    ).not.toBeNull();
  });

  it("a fila é anunciada com educação, não interrompendo a leitura", () => {
    montar(["Sua foto está no site."]);
    const regiao = document.querySelector('[role="status"]');
    expect(regiao?.getAttribute("aria-live")).toBe("polite");
  });

  it("aceita três ao mesmo tempo", () => {
    montar(["um.", "dois.", "três."]);
    disparar();
    expect(brindesNaTela()).toEqual(["um.", "dois.", "três."]);
  });

  it("o quarto descarta o mais antigo, sem esperar os 4s dele", () => {
    montar(["um.", "dois.", "três.", "quatro."]);
    disparar();

    const naTela = brindesNaTela();
    expect(naTela).toHaveLength(3);
    expect(naTela).not.toContain("um.");
    expect(naTela).toEqual(["dois.", "três.", "quatro."]);
  });

  it("sai sozinho em 4140ms — os 4s do handoff mais a saída", () => {
    montar(["Sua foto está no site."]);
    disparar();

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    // Ainda na tela: em 4000 a saída COMEÇA, não termina. Remover aqui
    // cortaria o fade pela metade.
    expect(brindesNaTela()).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(140);
    });
    expect(brindesNaTela()).toHaveLength(0);
  });

  it("fica acima do diálogo — z-60 contra o z-50 do scrim", () => {
    montar(["salvo."]);
    disparar();
    const regiao = document.querySelector('[role="status"]');
    expect(regiao?.className).toContain("z-[60]");
  });

  it("sem provider, disparar não quebra a tela", () => {
    /* Uma confirmação que não aparece é falha de acabamento; uma tela que
       quebra porque a confirmação não achou o provider é falha de produto. */
    render(<Disparador textos={["oi."]} />);
    expect(() =>
      act(() => {
        screen.getByRole("button", { name: "disparar" }).click();
      })
    ).not.toThrow();
  });
});
