/**
 * O rascunho local do editor — spec `painel-casal/006`.
 *
 * O que ele protege: fechar a aba nos 800ms de espera do autosave, ou perder a
 * conexão no meio. O trabalho fica no navegador, e o casal decide o que fazer
 * com ele — o editor não decide sozinho, porque carregar sozinho descartaria
 * em silêncio o que foi salvo de outro aparelho.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  apagarRascunho,
  guardarRascunho,
  useRascunhoLocal,
} from "./useRascunhoLocal";

const CHAVE = "invite:teste";
const converter = (b: unknown) => b as { blocos: string[] };

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("guardar e ler", () => {
  it("o rascunho mais novo que o servidor aparece", () => {
    guardarRascunho(CHAVE, { blocos: ["a", "b"] });

    const { result } = renderHook(() =>
      useRascunhoLocal(CHAVE, Date.now() - 60_000, converter)
    );
    expect(result.current.rascunho).toEqual({ blocos: ["a", "b"] });
  });

  it("rascunho mais VELHO que o servidor não aparece", () => {
    /* O servidor já tem tudo que ele tinha, e mais. Oferecer "recuperar" aqui
       seria oferecer ao casal voltar no tempo sem ele ter pedido. */
    guardarRascunho(CHAVE, { blocos: ["antigo"] });

    const { result } = renderHook(() =>
      useRascunhoLocal(CHAVE, Date.now() + 60_000, converter)
    );
    expect(result.current.rascunho).toBeNull();
  });

  it("sem rascunho nenhum, devolve null", () => {
    const { result } = renderHook(() =>
      useRascunhoLocal(CHAVE, 0, converter)
    );
    expect(result.current.rascunho).toBeNull();
  });

  it("rascunho ilegível não derruba a tela", () => {
    localStorage.setItem(CHAVE, "{isto não é json");
    const { result } = renderHook(() =>
      useRascunhoLocal(CHAVE, 0, converter)
    );
    expect(result.current.rascunho).toBeNull();
  });

  it("cada convite tem a própria chave", () => {
    guardarRascunho("invite:um", { blocos: ["x"] });
    const { result } = renderHook(() =>
      useRascunhoLocal("invite:dois", 0, converter)
    );
    expect(result.current.rascunho).toBeNull();
  });
});

describe("SC-006: sem `localStorage`, nada quebra", () => {
  it("gravar não lança quando o navegador recusa", () => {
    // Modo privado e cota cheia lançam. Um editor que quebra por causa do
    // rascunho é pior que um editor sem rascunho.
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });
    expect(() => guardarRascunho(CHAVE, { blocos: [] })).not.toThrow();
  });

  it("ler não lança, e devolve null", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("SecurityError");
    });
    const { result } = renderHook(() =>
      useRascunhoLocal(CHAVE, 0, converter)
    );
    expect(result.current.rascunho).toBeNull();
  });

  it("apagar não lança", () => {
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new DOMException("SecurityError");
    });
    expect(() => apagarRascunho(CHAVE)).not.toThrow();
  });
});

describe("SC-008: o rascunho some quando o servidor confirma", () => {
  it("apagar limpa a chave e a leitura acompanha na hora", () => {
    guardarRascunho(CHAVE, { blocos: ["a"] });

    const { result } = renderHook(() =>
      useRascunhoLocal(CHAVE, 0, converter)
    );
    expect(result.current.rascunho).not.toBeNull();

    act(() => {
      apagarRascunho(CHAVE);
    });

    expect(localStorage.getItem(CHAVE)).toBeNull();
    // O aviso some sem recarregar: quem lê é a própria fonte, não uma cópia
    // que precisaria de um efeito para se atualizar.
    expect(result.current.rascunho).toBeNull();
  });

  it("`descartar` faz o mesmo, sem quem chama saber a chave", () => {
    guardarRascunho(CHAVE, { blocos: ["a"] });
    const { result } = renderHook(() =>
      useRascunhoLocal(CHAVE, 0, converter)
    );
    act(() => {
      result.current.descartar();
    });
    expect(result.current.rascunho).toBeNull();
  });
});

describe("a gravação carrega o carimbo", () => {
  it("guarda `doc` e `em`, que é o que decide se é mais novo", () => {
    const antes = Date.now();
    guardarRascunho(CHAVE, { blocos: ["a"] });
    const guardado = JSON.parse(localStorage.getItem(CHAVE)!);

    expect(guardado.doc).toEqual({ blocos: ["a"] });
    expect(guardado.em).toBeGreaterThanOrEqual(antes);
  });
});
