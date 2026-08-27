/**
 * G4 · a tabela de `/admin/pedidos` — spec `painel-admin/001`.
 *
 * O filtro e a busca estão provados contra o banco em
 * `lib/repositories/listOrdersWithUsers.test.ts`. Aqui é o que a tela faz com
 * o resultado: sete colunas, o detalhe abrindo sem tirar o operador da lista,
 * e — o mais importante — o prompt de LLM fora da tela.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, act } from "@testing-library/react";
import TabelaDePedidos, { type LinhaDePedido } from "./TabelaDePedidos";

const PAGINA = readFileSync(
  resolve(process.cwd(), "app/admin/pedidos/page.tsx"),
  "utf-8"
);
/* Sem comentário: a página CITA `Cancelados` e `deleteOrder` para explicar por
   que a quarta pílula do artboard não existe. Quinta vez que este padrão
   aparece nas specs — ver `design-system/006`. */
const CODIGO = PAGINA.replace(/\/\*[\s\S]*?\*\//g, "").replace(
  /^\s*\/\/.*$/gm,
  ""
);

const LINHAS: LinhaDePedido[] = [
  {
    id: "o1",
    numero: "4821",
    casal: "Ana e Pedro",
    email: "ana@teste.invalid",
    pacote: "Para Sempre",
    valor: "R$ 99,90",
    status: "published",
    detalhe: <div data-detalhe="o1">ficha do pedido</div>,
  },
  {
    id: "o2",
    numero: "9F02",
    casal: "Bia e Caio",
    email: "bia@teste.invalid",
    pacote: "Convite",
    valor: "R$ 9,90",
    status: "preview_ready",
    detalhe: <div data-detalhe="o2">ficha do pedido</div>,
  },
];

function montar() {
  document.body.innerHTML = "";
  return render(<TabelaDePedidos linhas={LINHAS} />);
}

const tabela = () => document.querySelector("table")!;

beforeEach(montar);

describe("a tabela", () => {
  it("SC-006: sete colunas, com os seis rótulos do artboard", () => {
    const th = [...tabela().querySelectorAll("thead th")];
    expect(th).toHaveLength(7);
    expect(th.map((c) => c.textContent)).toEqual([
      "Pedido",
      "Casal",
      "E-mail",
      "Pacote",
      "Valor",
      "Status",
      "",
    ]);
  });

  it("SC-007: valor formatado e a etiqueta sólida de quem está no ar", () => {
    const primeira = tabela().querySelector("tbody tr")!;
    expect(primeira.textContent).toContain("#4821");
    expect(primeira.textContent).toContain("R$ 99,90");
    expect(primeira.textContent).toContain("No ar");
    expect(primeira.querySelector(".etiqueta-noar")).not.toBeNull();
  });

  it("prévia não usa a etiqueta sólida — ela é só de quem está no ar", () => {
    const segunda = tabela().querySelectorAll("tbody tr")[1];
    expect(segunda.querySelector(".etiqueta-noar")).toBeNull();
    expect(segunda.querySelector(".etiqueta")).not.toBeNull();
  });
});

describe("SC-008: Editar abre embaixo, sem tirar o operador da lista", () => {
  it("o detalhe entra numa linha nova, e nada navega", () => {
    const antes = window.location.pathname;
    expect(document.querySelector("[data-detalhe='o1']")).toBeNull();

    act(() => {
      screen.getAllByRole("button", { name: "Editar" })[0].click();
    });

    const detalhe = document.querySelector("[data-detalhe='o1']");
    expect(detalhe).not.toBeNull();
    // Dentro da própria tabela, sob a linha do pedido.
    expect(detalhe!.closest("table")).toBe(tabela());
    expect(window.location.pathname).toBe(antes);
  });

  it("abrir um fecha o outro — duas fichas abertas viram duas listas", () => {
    const botoes = () => screen.getAllByRole("button", { name: /Editar|Fechar/ });
    act(() => {
      botoes()[0].click();
    });
    act(() => {
      screen.getAllByRole("button", { name: "Editar" })[0].click();
    });
    /* Um pedido aberto por vez. Aparece duas vezes no DOM — uma na tabela,
       outra na pilha de celular — porque as duas formas leem o mesmo estado;
       só uma delas está visível em qualquer largura. */
    const abertos = new Set(
      [...document.querySelectorAll("[data-detalhe]")].map(
        (n) => (n as HTMLElement).dataset.detalhe
      )
    );
    expect([...abertos]).toEqual(["o2"]);
  });

  it("o botão diz o que vai acontecer, e o leitor de tela sabe o estado", () => {
    const botao = screen.getAllByRole("button", { name: "Editar" })[0];
    expect(botao.getAttribute("aria-expanded")).toBe("false");
    act(() => {
      botao.click();
    });
    expect(screen.getAllByRole("button", { name: "Fechar" })[0]).toBeTruthy();
  });
});

describe("SC-011: em 390px não há tabela", () => {
  it("tabela e pilha trocam no mesmo corte `lg`", () => {
    // Sete colunas não cabem em 390px, e espremer viraria rolagem lateral —
    // que esconde justamente a coluna de ação.
    expect(tabela().parentElement!.className).toContain("hidden");
    expect(tabela().parentElement!.className).toContain("lg:block");
    expect(document.querySelector("ul")!.className).toContain("lg:hidden");
  });

  it("a pilha mostra a mesma informação, e o mesmo botão", () => {
    const pilha = document.querySelector("ul")!;
    expect(pilha.textContent).toContain("Ana e Pedro");
    expect(pilha.textContent).toContain("R$ 99,90");
    expect(pilha.textContent).toContain("#4821");
    expect(pilha.querySelectorAll("button")).toHaveLength(2);
  });
});

describe("a página em volta", () => {
  it("SC-009: o prompt de LLM saiu da tela", () => {
    /* Resíduo do fluxo que o SDD §3 rejeitou e a §7 automatizou: um `<pre>`
       com o prompt inteiro, ensinando o operador a montar site à mão. As
       regras §7 listam "LLM gerando código por casal" entre as decisões
       descartadas — e a instrução continuava na tela. */
    expect(CODIGO).not.toContain("SITE_BUILD_PROMPT");
    expect(CODIGO).not.toContain("Como gerar o site a partir de um pedido");
    expect(CODIGO).not.toContain("<pre");
    // `buildFullPrompt` continua alimentando o `OrderCard`, que é outra tela.
    expect(CODIGO).toContain("buildFullPrompt");
  });

  it("SC-001: quatro pílulas — a de Cancelados nasceu com a spec 013", () => {
    /* Este critério mudou, e a mudança é a história de duas specs.
    
       Quando `painel-admin/001` foi escrita, a pílula `Cancelados` do artboard
       G4 ficou de fora porque `ORDER_STATUSES` não tinha `cancelled`: cancelar
       chamava `deleteOrder` e APAGAVA a linha, então ela só poderia mostrar
       zero — e pílula que só mostra zero é pior que pílula nenhuma.
    
       A `painel-casal/013` fez cancelar virar estado, pelas razões dela (o site
       órfão, e a regra 6 da §14 do SDD). Com o estado existindo, a pílula passa
       a ter o que mostrar, e o "fora de escopo" da 001 caiu junto. */
    expect(CODIGO).toContain('chave: "todos"');
    expect(CODIGO).toContain('chave: "no-ar"');
    expect(CODIGO).toContain('chave: "previa"');
    expect(CODIGO).toContain('chave: "cancelados"');
    expect(CODIGO).toContain('estados: ["cancelled"]');
    expect(CODIGO.split('chave: "').length - 1).toBe(4);
  });

  it("SC-010: valor desconhecido em `?estado=` cai em todos, sem erro", () => {
    expect(CODIGO).toContain(
      "FILTROS.find((f) => f.chave === estado) ?? FILTROS[0]"
    );
    expect(CODIGO).not.toContain("notFound(");
  });

  it("SC-010b: o vazio diz de qual filtro está falando", () => {
    expect(PAGINA).toContain("Nenhum pedido no ar agora.");
    expect(PAGINA).toContain("Nenhum pedido em prévia agora.");
    expect(PAGINA).toContain("Ver todos os pedidos");
  });

  it("SC-012: `searchParams` é lido dentro de um limite de Suspense", () => {
    // Fora dele, o build reprova a rota inteira — e o `next dev` não avisa.
    expect(CODIGO).toContain("<Suspense");
    expect(CODIGO).toContain("<Lista busca={searchParams} />");
    expect(CODIGO).not.toContain("await searchParams");
  });

  it("o filtro e a busca viajam pela URL, não por estado de cliente", () => {
    // É o que deixa o operador guardar `?estado=previa` e voltar direto.
    expect(CODIGO).toContain('method="get"');
    expect(CODIGO).toContain('name="q"');
    expect(CODIGO).toContain("Buscar por casal, e-mail, #pedido…");
  });
});
