/**
 * E10 · publicar — spec `painel-casal/008`.
 *
 * O defeito que esta tela conserta é de leitura, não de código: a prévia do
 * painel é boa demais. O casal vê o site montado com as fotos dele e conclui
 * que já está no ar — e só descobre que não quando manda o link para alguém.
 *
 * Por isso os testes olham três coisas: que o aviso aparece com o endereço
 * REAL (nunca um exemplo), que ele some quando o site publica, e que nada aqui
 * promete confirmação de presença num pacote que não a inclui.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, act } from "@testing-library/react";
import PublicarAgora from "./PublicarAgora";
import SiteNoAr from "./SiteNoAr";

const PAGINA = readFileSync(
  resolve(process.cwd(), "app/conta/pedidos/[id]/page.tsx"),
  "utf-8"
);
const CODIGO = PAGINA.replace(/\/\*[\s\S]*?\*\//g, "").replace(
  /^\s*\/\/.*$/gm,
  ""
);
const PREVIEW = readFileSync(
  resolve(process.cwd(), "components/account/LivePreview.tsx"),
  "utf-8"
);

const montar = (tier: "convite" | "site" | "para-sempre") => {
  document.body.innerHTML = "";
  return render(
    <PublicarAgora endereco="enlace.test/s/ana-e-pedro" tier={tier} />
  ).container;
};

describe("SC-001 e SC-002: a faixa", () => {
  it("diz o que está acontecendo, com o endereço real", () => {
    const c = montar("para-sempre");
    expect(c.textContent).toContain(
      "Seu site está pronto — e ainda invisível para os convidados."
    );
    expect(c.textContent).toContain(
      "A prévia é de vocês para revisar à vontade."
    );
    // O endereço REAL, nunca "seusite.com.br".
    expect(c.textContent).toContain("enlace.test/s/ana-e-pedro");
    expect(c.textContent).toContain("só entra no ar depois do pagamento.");
  });

  it("SC-003 (do botão): leva à decisão que já existe, não a uma tela nova", () => {
    /* Um segundo caminho de pagamento seria um segundo lugar para manter — e o
       lugar onde o dinheiro passa é o pior para se ter dois. O artboard 10.2
       desenha um checkout embutido, e ele foi cancelado pelo dono. */
    montar("para-sempre");
    const botao = screen.getByRole("link", { name: "Publicar site →" });
    expect(botao.getAttribute("href")).toBe("#pagar");
    expect(botao.className).toContain("btn-ink");
  });

  it("não promete prazo nenhum", () => {
    // Regras §2.2: "publicar" e "está no ar" descrevem ação e resultado.
    const c = montar("para-sempre");
    expect(c.textContent).not.toMatch(/em breve|aguarde|assim que poss/i);
  });
});

describe("SC-004: o cartão do que muda", () => {
  it("quatro linhas no Para Sempre", () => {
    const c = montar("para-sempre");
    const linhas = [...c.querySelectorAll("li")].map((l) => l.textContent);
    expect(linhas).toHaveLength(4);
    expect(linhas).toContain("O endereço entra no ar para os convidados");
    expect(linhas).toContain("A marca d'água de prévia some");
    expect(linhas).toContain("Convites e confirmação de presença ativam");
    expect(linhas).toContain(
      "Vocês podem continuar editando depois de publicar"
    );
  });

  it("três no pacote Convite — sem prometer confirmação de presença", () => {
    /* O pacote Convite não inclui `rsvp`. Prometer que ela "ativa ao publicar"
       seria vender pelo desenho o que não foi comprado. */
    const c = montar("convite");
    const linhas = [...c.querySelectorAll("li")].map((l) => l.textContent);
    expect(linhas).toHaveLength(3);
    expect(linhas).not.toContain("Convites e confirmação de presença ativam");
  });

  it("a última linha é garantia, não ganho — e não leva check verde", () => {
    // É ela que tira o medo de publicar.
    const c = montar("para-sempre");
    const ultima = [...c.querySelectorAll("li")].at(-1)!;
    expect(ultima.textContent).toContain("continuar editando depois");
    expect(ultima.querySelector("svg")).toBeNull();
  });
});

describe("SC-003: a marca d'água", () => {
  it("é irmã do iframe, não injetada dentro dele", () => {
    /* O quadro carrega `/preview/<token>`, que é outra origem lógica e já tem
       a própria faixa. Escrever por dentro criaria uma segunda marca d'água
       para manter. */
    expect(PREVIEW).toContain("data-marca-previa");
    // O `<iframe` do JSX, não a menção dele no comentário do topo do arquivo.
    expect(PREVIEW.indexOf("data-marca-previa")).toBeLessThan(
      PREVIEW.search(/<iframe\s*\n/)
    );
    expect(PREVIEW).not.toContain("contentDocument");
  });

  it("gira, não intercepta clique, e não é anunciada", () => {
    expect(PREVIEW).toContain('transform: "rotate(-18deg)"');
    expect(PREVIEW).toContain("pointer-events-none");
    expect(PREVIEW).toContain('aria-hidden="true"');
    expect(PREVIEW).toContain('letterSpacing: "0.4em"');
  });

  it("SC-005: só aparece enquanto o site não está publicado", () => {
    expect(CODIGO).toContain('marcaDePrevia={site.status !== "published"}');
  });
});

describe("SC-005: publicado, a tela não fala mais em prévia", () => {
  it("a faixa e o cartão só existem antes de publicar", () => {
    expect(CODIGO).toContain('site.status !== "published" &&');
    const trecho = CODIGO.slice(CODIGO.indexOf("<PublicarAgora"));
    expect(trecho.slice(0, 200)).toContain("endereco={enderecoDoSite}");
  });
});

describe("SC-006 e SC-008: a comemoração", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  const montarNoAr = () =>
    render(
      <SiteNoAr
        endereco="enlace.test/s/ana-e-pedro"
        urlCompleta="https://enlace.test/s/ana-e-pedro"
        linkDosConvites="/conta/pedidos/1/convites"
      />
    ).container;

  it("diz o que aconteceu, com a etiqueta e os dois botões", () => {
    const c = montarNoAr();
    expect(c.textContent).toContain("Seu site está no ar!");
    expect(c.textContent).toContain("Pagamento confirmado.");
    expect(c.textContent).toContain("enlace.test/s/ana-e-pedro");

    const etiqueta = c.querySelector(".etiqueta-noar")!;
    expect(etiqueta.textContent).toBe("No ar");

    expect(screen.getByRole("button", { name: "Copiar link do site" })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Enviar convites" }).getAttribute("href")
    ).toBe("/conta/pedidos/1/convites");
  });

  it("copiar leva a URL COMPLETA, e confirma com brinde", async () => {
    // O texto mostra o endereço sem esquema porque é assim que o casal o
    // reconhece; o que vai para a área de transferência precisa abrir.
    const escrever = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: escrever },
      configurable: true,
    });

    montarNoAr();
    await act(async () => {
      screen.getByRole("button", { name: "Copiar link do site" }).click();
    });

    expect(escrever).toHaveBeenCalledWith("https://enlace.test/s/ana-e-pedro");
  });

  it("área de transferência negada não vira botão morto", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: vi.fn().mockRejectedValue(new Error("negado")),
      },
      configurable: true,
    });

    montarNoAr();
    await act(async () => {
      screen.getByRole("button", { name: "Copiar link do site" }).click();
    });
    // Não lançou, e o endereço continua escrito na tela para copiar à mão.
    expect(document.body.textContent).toContain("enlace.test/s/ana-e-pedro");
  });

  it("SC-007: a dupla guarda — o parâmetro sozinho não basta", () => {
    /* `?publicado=1` é digitável na barra de endereços. Sem `published`, a tela
       diria "está no ar" sobre um site que não está. E o parâmetro some do
       endereço na transição #6, então a navegação seguinte não repete. */
    expect(CODIGO).toContain('status === "published" && publicado === "1"');
  });
});
