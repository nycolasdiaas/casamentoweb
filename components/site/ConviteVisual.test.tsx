/**
 * O botão do convite, do lado do convidado — spec `painel-casal/003`.
 *
 * O convite virou página para o botão levar a algum lugar. Antes disto ele
 * terminava num texto com link para a CAPA do site: o convidado clicava em
 * "confirmar presença" e caía na primeira tela, de onde ainda precisava rolar
 * até achar a confirmação.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render } from "@testing-library/react";
import { conviteInicial } from "@/lib/site/inviteSeed";
import { parseInviteDoc, type InviteDoc } from "@/lib/site/inviteDoc";
import ConviteVisual from "./ConviteVisual";

const ACTIONS = readFileSync(
  resolve(process.cwd(), "app/actions/invite-actions.ts"),
  "utf-8"
);

const CORES = {
  outer: "#232514",
  paper: "#f2efe7",
  ink: "#1a1d21",
  accent: "#b8985f",
};

const semear = (temRsvp: boolean) =>
  conviteInicial(
    {
      nomes: "Ana & Pedro",
      data: "19 de setembro de 2026",
      hora: "16h",
      local: "Espaço Jardim",
      endereco: "enlace.test/s/ana-e-pedro",
      url: "https://enlace.test/s/ana-e-pedro",
      temRsvp,
    },
    CORES
  );

const botoes = (doc: InviteDoc) => doc.blocos.filter((b) => b.tipo === "botao");

describe("o convite semeado", () => {
  it("SC-002: pacote com confirmação ganha o botão que leva a ela", () => {
    const bs = botoes(semear(true));
    expect(bs).toHaveLength(1);
    expect(bs[0]).toMatchObject({
      tipo: "botao",
      destino: "rsvp",
      rotulo: "Confirmar presença",
      fundo: CORES.ink,
      cor: CORES.paper,
      raio: 2,
      fonte: "sans",
    });
  });

  it("SC-003: pacote Convite ganha botão para o site, e diz isso", () => {
    /* Semear "Confirmar presença" onde o pacote não inclui confirmação seria
       vender pelo desenho o que não foi comprado. */
    const bs = botoes(semear(false));
    expect(bs).toHaveLength(1);
    expect(bs[0]).toMatchObject({ destino: "site", rotulo: "Ver o site" });
  });

  it("o endereço fica ABAIXO do botão, como texto sem link", () => {
    // Ele serve a quem vai digitar; quem clica tem o botão logo acima, e dois
    // destinos colados confundem mais do que ajudam.
    const doc = semear(true);
    const endereco = doc.blocos.find(
      (b) => b.tipo === "texto" && b.texto === "enlace.test/s/ana-e-pedro"
    );
    expect(endereco).toBeTruthy();
    expect(endereco).toMatchObject({ link: "" });
    const botao = botoes(doc)[0];
    expect(endereco!.y).toBeGreaterThan(botao.y);
  });

  it("nenhum bloco de texto do convite semeado leva a lugar nenhum", () => {
    // A saída é o botão, e é uma só.
    const comLink = semear(true).blocos.filter(
      (b) => b.tipo === "texto" && b.link !== ""
    );
    expect(comLink).toHaveLength(0);
  });

  it("o que foi semeado sobrevive à leitura do banco", () => {
    const ida = semear(true);
    const volta = parseInviteDoc(JSON.parse(JSON.stringify(ida)));
    expect(botoes(volta)).toHaveLength(1);
    expect(botoes(volta)[0]).toMatchObject({ destino: "rsvp" });
  });
});

describe("SC-004: no `/c/<slug>`, o botão é um `<a>` de verdade", () => {
  const montar = (doc: InviteDoc, slug?: string, base?: string) => {
    document.body.innerHTML = "";
    return render(<ConviteVisual doc={doc} slug={slug} baseUrl={base} />)
      .container;
  };

  it("o href termina na âncora da confirmação", () => {
    const c = montar(semear(true), "ana-e-pedro", "https://enlace.test");
    const a = c.querySelector("a")!;
    expect(a.tagName).toBe("A");
    expect(a.getAttribute("href")).toBe(
      "https://enlace.test/s/ana-e-pedro#confirmacao"
    );
    expect(a.textContent).toContain("Confirmar presença");
  });

  it("destino `site` vai para a capa, sem âncora", () => {
    const c = montar(semear(false), "ana-e-pedro", "https://enlace.test");
    expect(c.querySelector("a")!.getAttribute("href")).toBe(
      "https://enlace.test/s/ana-e-pedro"
    );
  });

  it("SC-005: trocar o slug do site muda o href, sem tocar no `doc`", () => {
    /* O endereço é resolvido no RENDER. Gravá-lo no `doc` congelaria o slug
       dentro do convite, e um site que muda de endereço deixaria para trás
       convites publicados apontando para lugar nenhum. */
    const doc = semear(true);
    const antes = JSON.stringify(doc);

    const a1 = montar(doc, "ana-e-pedro", "https://enlace.test").querySelector("a")!;
    const a2 = montar(doc, "outro-slug", "https://enlace.test").querySelector("a")!;

    expect(a1.getAttribute("href")).toContain("/s/ana-e-pedro#confirmacao");
    expect(a2.getAttribute("href")).toContain("/s/outro-slug#confirmacao");
    expect(JSON.stringify(doc)).toBe(antes);
  });

  it("sem slug (editor, miniatura) o botão não vira link para lugar nenhum", () => {
    const c = montar(semear(true));
    expect(c.querySelector("a")).toBeNull();
    // Mas continua desenhado — o casal precisa ver o que está posicionando.
    expect(c.textContent).toContain("Confirmar presença");
  });

  it("SC-004: a área de toque tem no mínimo 44px", () => {
    const c = montar(semear(true), "ana-e-pedro", "https://enlace.test");
    const caixa = c.querySelector("a > div") as HTMLElement;
    expect(caixa.style.minHeight).toBe("44px");
    expect(caixa.style.background).toBeTruthy();
    expect(caixa.style.borderRadius).toBeTruthy();
  });
});

describe("SC-006 e SC-008: o que trava publicar, e o que não trava", () => {
  it("a recusa é um erro NOMEADO, conferido no servidor", () => {
    // `PublicarConvite` é client component; a action é a fronteira que importa.
    expect(ACTIONS).toContain("temSaida(atualParaValidar.doc)");
    expect(ACTIONS).toContain('return { error: "sem-saida" };');
  });

  it("SC-008: nomes, data e local NÃO travam publicar", () => {
    /* Regras §2.3: *"só uma coisa é obrigatória: os nomes"*, e *"a lista 'o
       que falta' é guia, nunca trava"*. Convite sem data é legítimo — casal
       que ainda não fechou o dia. */
    const codigo = ACTIONS.replace(/\/\*[\s\S]*?\*\//g, "").replace(
      /^\s*\/\/.*$/gm,
      ""
    );
    const publicar = codigo.slice(
      codigo.indexOf("export async function publicarConviteAction")
    );
    const ateOFim = publicar.slice(0, publicar.indexOf("despublicarConvite"));
    expect(ateOFim).not.toMatch(/weddingDate|coupleNames|ceremonyVenue/);
  });
});
