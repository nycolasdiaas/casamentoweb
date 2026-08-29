/**
 * E7 · a aba Convites como lista de trabalho — spec `painel-casal/001`.
 *
 * O que se confere aqui é o que a lista DIZ sobre o estado de cada convite, e
 * o que ela faz com o pedido de apagar. Errar o primeiro faz o casal mandar um
 * link que ainda não está no ar; errar o segundo derruba um endereço que já
 * está no WhatsApp de gente de verdade.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import ListaDeConvites from "./ListaDeConvites";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/** A página da aba — quatro critérios são sobre o que está escrito nela. */
const PAGINA = readFileSync(
  resolve(process.cwd(), "app/conta/pedidos/[id]/convites/page.tsx"),
  "utf-8"
);

/* Sem comentário: a página CITA `listGroupsWithGuests` e `metricasDoSite` para
   explicar por que não as chama, e um `not.toContain` acusaria a explicação.
   Quarta vez que este padrão aparece nas specs — ver `design-system/006`. */
const PAGINA_CODIGO = PAGINA.replace(/\/\*[\s\S]*?\*\//g, "").replace(
  /^\s*\/\/.*$/gm,
  ""
);

const acoes = vi.hoisted(() => ({
  publicar: vi.fn(),
  despublicar: vi.fn(),
  apagar: vi.fn(),
}));

vi.mock("@/app/actions/invite-actions", () => ({
  publicarConviteAction: acoes.publicar,
  despublicarConviteAction: acoes.despublicar,
  apagarConviteAction: acoes.apagar,
}));

const CONVITES = [
  {
    id: "i1",
    nome: "Família da noiva",
    slug: "familia-noiva",
    miniatura: <span data-mini="i1" />,
  },
  { id: "i2", nome: "Padrinhos", slug: null, miniatura: <span data-mini="i2" /> },
];

function montar(convites = CONVITES) {
  document.body.innerHTML = "";
  return render(
    <ListaDeConvites siteId="s1" orderId="o1" convites={convites} />
  );
}

/** A tabela do desktop — a versão de celular repete o mesmo estado. */
const tabela = () => document.querySelector("table")!;
const linhas = () => [...tabela().querySelectorAll("tbody tr")];

beforeEach(() => vi.clearAllMocks());

describe("o que cada linha conta", () => {
  it("SC-003: cinco colunas, e nenhuma delas é CONVIDADOS", () => {
    montar();
    const cabecalho = [...tabela().querySelectorAll("thead th")];
    expect(cabecalho).toHaveLength(5);
    const textos = cabecalho.map((th) => th.textContent);
    expect(textos).toContain("Convite");
    expect(textos).toContain("Link");
    expect(textos).toContain("Status");
    // Não há chave ligando convite a grupo; um número por linha seria
    // inventado. Ver as Perguntas em aberto da spec.
    expect(textos).not.toContain("Convidados");
  });

  it("SC-004: publicado mostra o endereço e a etiqueta sólida", () => {
    montar();
    const linha = linhas()[0];
    expect(linha.textContent).toContain("/c/familia-noiva");
    const etiqueta = linha.querySelector(".etiqueta")!;
    expect(etiqueta.className).toContain("etiqueta-noar");
    expect(etiqueta.textContent).toBe("Publicado");
  });

  it("SC-004: rascunho mostra a palavra, não um traço", () => {
    montar();
    const linha = linhas()[1];
    // "—" diria "não tem endereço". A verdade é que ele existe e não está no
    // ar ainda.
    expect(linha.textContent).toContain("rascunho");
    const etiqueta = linha.querySelector(".etiqueta")!;
    expect(etiqueta.className).not.toContain("etiqueta-noar");
    expect(etiqueta.textContent).toContain("Rascunho");
    expect(etiqueta.querySelector(".etiqueta-ponto")).not.toBeNull();
  });

  it("SC-013: a miniatura é 48×60 e o nome leva ao editor", () => {
    montar();
    const linha = linhas()[0];
    const caixa = linha.querySelector("[data-mini='i1']")!.parentElement!;
    expect(caixa.className).toContain("w-[48px]");
    expect(caixa.className).toContain("h-[60px]");
    const nome = screen.getAllByRole("link", { name: "Família da noiva" })[0];
    expect(nome.getAttribute("href")).toBe("/conta/convites/i1");
  });

  it("as ações de publicado e de rascunho são diferentes", () => {
    montar();
    expect(linhas()[0].textContent).toContain("Abrir");
    expect(linhas()[0].textContent).toContain("Despublicar");
    expect(linhas()[0].textContent).not.toContain("Publicar presença");
    expect(linhas()[1].textContent).toContain("Publicar");
    expect(linhas()[1].textContent).not.toContain("Abrir");
  });
});

describe("SC-005: publicar muda a linha inteira, sem sair da aba", () => {
  it("o endereço aparece e a etiqueta vira sólida", async () => {
    acoes.publicar.mockResolvedValue({
      url: "https://enlace.test/c/padrinhos",
    });
    montar();

    const botao = screen.getAllByRole("button", { name: "Publicar" })[0];
    await act(async () => {
      botao.click();
    });

    expect(acoes.publicar).toHaveBeenCalledWith("s1", "i2");
    const linha = linhas()[1];
    expect(linha.textContent).toContain("/c/padrinhos");
    expect(linha.textContent).not.toContain("rascunho");
    expect(linha.querySelector(".etiqueta")!.className).toContain(
      "etiqueta-noar"
    );
    // E a ação vira o par de quem está no ar.
    expect(linha.textContent).toContain("Despublicar");
  });

  it("as duas formas — tabela e cartão — contam a mesma história", async () => {
    acoes.publicar.mockResolvedValue({
      url: "https://enlace.test/c/padrinhos",
    });
    montar();
    await act(async () => {
      screen.getAllByRole("button", { name: "Publicar" })[0].click();
    });
    // Um `useState` só alimenta as duas marcações: a de celular fica montada
    // (escondida) no desktop, e desatualizada seria uma segunda verdade.
    const cartoes = document.querySelector("ul")!;
    expect(cartoes.textContent).toContain("/c/padrinhos");
  });

  it("despublicar devolve a linha ao rascunho", async () => {
    acoes.despublicar.mockResolvedValue({ ok: true });
    montar();
    await act(async () => {
      screen.getAllByRole("button", { name: "Despublicar" })[0].click();
    });
    expect(acoes.despublicar).toHaveBeenCalledWith("s1", "i1");
    expect(linhas()[0].textContent).toContain("rascunho");
  });

  it("erro da ação aparece na linha, e a linha não mente", async () => {
    acoes.publicar.mockResolvedValue({ error: "Convite não encontrado." });
    montar();
    await act(async () => {
      screen.getAllByRole("button", { name: "Publicar" })[0].click();
    });
    expect(document.querySelector('[role="alert"]')!.textContent).toBe(
      "Convite não encontrado."
    );
    expect(linhas()[1].textContent).toContain("rascunho");
  });
});

describe("SC-006: apagar passa pelo diálogo", () => {
  it("o botão repete o verbo, e o aviso muda se o convite está no ar", async () => {
    montar();
    await act(async () => {
      screen.getAllByLabelText("Apagar Família da noiva")[0].click();
    });

    const dialogo = document.querySelector('[role="dialog"]')!;
    expect(dialogo.textContent).toContain("Apagar convite");
    // O que está no ar tem consequência para outra pessoa, e o texto diz qual.
    expect(dialogo.textContent).toContain("/c/familia-noiva");
    expect(dialogo.textContent).toContain("página que não existe mais");
    // O foco vai para "Manter": a saída segura é a que recebe o teclado.
    expect(document.activeElement?.textContent).toBe("Manter");
  });

  it("rascunho apagado não promete link quebrado que não existe", async () => {
    montar();
    await act(async () => {
      screen.getAllByLabelText("Apagar Padrinhos")[0].click();
    });
    const dialogo = document.querySelector('[role="dialog"]')!;
    expect(dialogo.textContent).not.toContain("/c/");
    expect(dialogo.textContent).toContain("O desenho deste convite não volta.");
  });
});

describe("a aba em volta da lista", () => {
  it("SC-009: tabela e cartões trocam no mesmo corte `md`", () => {
    montar();
    /* Tailwind não roda no jsdom, então o que se afere é a DECLARAÇÃO: a
       tabela só aparece de `md` para cima, os cartões só abaixo. Sem os dois
       lados do corte, uma das formas apareceria junto com a outra. */
    expect(tabela().parentElement!.className).toContain("hidden");
    expect(tabela().parentElement!.className).toContain("md:block");
    expect(document.querySelector("ul")!.className).toContain("md:hidden");
  });

  it("SC-007: no limite o botão fica desabilitado E explicado", () => {
    // Sumir sem dizer por quê é o que fazia o casal procurar um botão que ele
    // tinha visto na semana passada.
    expect(PAGINA).toContain("disabled={noLimite}");
    expect(PAGINA).toContain("`Limite de ${MAX_CONVITES} convites`");
    expect(PAGINA).toContain('"+ Novo convite"');
  });

  it("SC-008: com zero convites não há tabela, e sim o estado vazio", () => {
    expect(PAGINA).toContain("convites.length === 0 ?");
    expect(PAGINA).toContain("Nenhum convite criado");
    expect(PAGINA).toContain(
      "Separe os convidados em grupos — família, amigos, trabalho."
    );
    expect(PAGINA).toContain("Criar convite");
  });

  it("SC-011: o texto de apoio parou de vender arquivo", () => {
    // SDD §15.1: o convite é uma PÁGINA, não um arquivo. Num PNG o botão
    // "Lista de presentes" é desenho, não botão.
    expect(PAGINA_CODIGO).not.toContain("baixem em PNG, JPEG ou PDF");
    expect(PAGINA).toContain("vira uma página com endereço próprio");
  });

  it("SC-010: duas consultas, e nenhuma repete o que o layout já fez", () => {
    // `listGroupsWithGuests` é do layout, para montar os avisos. Chamá-la de
    // novo aqui seria a mesma ida ao banco duas vezes na mesma tela.
    expect(PAGINA_CODIGO).not.toContain("listGroupsWithGuests");
    // E `metricasDoSite` traria cinco idas para usar duas.
    expect(PAGINA_CODIGO).not.toContain("metricasDoSite");
    expect(PAGINA).toContain("Promise.all([listInvites(site.id), contagemDeConvidados(site.id)])");
  });

  it("SC-001: as três réguas, e só CONFIRMARAM em `--c-ok`", () => {
    expect(PAGINA).toContain('rotulo="Convites"');
    expect(PAGINA).toContain('rotulo="Convidados"');
    expect(PAGINA).toContain('rotulo="Confirmaram"');
    expect(PAGINA.split(" ok />").length - 1).toBe(1);
  });
});
