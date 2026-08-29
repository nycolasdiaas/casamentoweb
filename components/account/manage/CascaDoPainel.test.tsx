/**
 * A batida do selo "No ar" — transição #6 do HANDOFF-motion.
 *
 * O que se confere aqui é a GUARDA, não a animação. A animação em si é CSS e
 * está verificada no build (SC-004/005/007); o que só código decide é *quando*
 * a classe entra. E a resposta certa tem duas metades — `status === "published"`
 * E `?publicado=1` — porque o parâmetro sozinho é digitável na barra de
 * endereços, e o selo diria "no ar" sobre um site que ainda está em prévia.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import type { OrderStatus } from "@/lib/orderStatus";

const busca = { valor: new URLSearchParams() };

vi.mock("next/navigation", () => ({
  usePathname: () => "/conta/pedidos/4821",
  useSearchParams: () => busca.valor,
}));

import CascaDoPainel from "./CascaDoPainel";

const ABAS = [
  { href: "/conta/pedidos/4821", rotulo: "Início" },
  { href: "/conta/pedidos/4821/fotos", rotulo: "Fotos" },
];

function montar(status: OrderStatus, query: string) {
  busca.valor = new URLSearchParams(query);
  window.history.replaceState(
    null,
    "",
    `/conta/pedidos/4821${query ? `?${query}` : ""}`
  );
  return render(
    <CascaDoPainel
      titulo="Ana e Pedro"
      status={status}
      linkDoSite={null}
      abas={ABAS}
      avisos={[]}
      orderId="4821"
      recentes={0}
      iniciais="AP"
    />
  );
}

const comAnimacao = () =>
  document.querySelectorAll(".selo-noar, .previa-saindo").length;

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("CascaDoPainel — a guarda da transição #6", () => {
  it("SC-009: com o site no ar e ?publicado=1, a etiqueta carrega selo-noar", () => {
    montar("published", "publicado=1");
    expect(document.querySelectorAll(".selo-noar")).toHaveLength(1);
  });

  it("SC-001: ?publicado=1 digitado à mão num pedido em prévia não anima nada", () => {
    montar("preview_ready", "publicado=1");
    expect(comAnimacao()).toBe(0);
  });

  it("SC-010: site no ar aberto sem o parâmetro mostra o selo parado", () => {
    montar("published", "");
    expect(comAnimacao()).toBe(0);
  });

  it("SC-006: o parâmetro sai do endereço, sem levar os outros junto", () => {
    montar("published", "publicado=1&aba=fotos");
    expect(window.location.search).toBe("?aba=fotos");
  });

  it("SC-006: sozinho na URL, o parâmetro deixa o endereço limpo", () => {
    montar("published", "publicado=1");
    expect(window.location.search).toBe("");
    // E o caminho continua o mesmo — limpar o parâmetro não pode navegar.
    expect(window.location.pathname).toBe("/conta/pedidos/4821");
  });

  it("num pedido em prévia o endereço fica intocado — nada a limpar", () => {
    montar("preview_ready", "publicado=1");
    expect(window.location.search).toBe("?publicado=1");
  });
});
