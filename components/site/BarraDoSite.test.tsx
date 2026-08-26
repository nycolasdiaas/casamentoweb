/**
 * F1 · a barra fixa do site — spec `site-publico/001`.
 *
 * O que se confere aqui é a REGRA, não o desenho: quais âncoras a barra
 * mostra, em que ordem, e quando ela decide não existir. Tudo isso sai do que
 * o pacote libera e do que o casal ligou na aba Páginas — e errar significa
 * oferecer ao convidado um destino que a página não tem, ou esconder o botão
 * de confirmar presença de quem pagou por ele.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import type { SectionKey } from "@/lib/templates/contract";
import { ANCORA_DA_SECAO } from "@/lib/site/ancoras";
import BarraDoSite from "./BarraDoSite";

/** O que um site "para sempre" com tudo ligado renderiza, na ordem do molde. */
/** O arquivo em si — dois critérios são sobre o que está escrito nele. */
const FONTE = readFileSync(
  resolve(process.cwd(), "components/site/BarraDoSite.tsx"),
  "utf-8"
);

const TUDO: SectionKey[] = [
  "cover",
  "countdown",
  "story",
  "details",
  "gallery",
  "rsvp",
  "gifts",
  "guestbook",
  "album",
  "footer",
];

function montar(chaves: SectionKey[], nomes = "Ana & Pedro") {
  document.body.innerHTML = "";
  const { container } = render(
    <BarraDoSite nomes={nomes} chaves={chaves} />
  );
  return container;
}

/** As âncoras da barra, sem o link dos nomes e sem o botão de confirmar. */
const itens = (c: HTMLElement) =>
  [...c.querySelectorAll("nav > div > a")].map((a) => ({
    href: a.getAttribute("href"),
    rotulo: a.textContent,
  }));

describe("quais destinos a barra oferece", () => {
  it("SC-002: as seis âncoras do site completo, na ordem e com rótulo curto", () => {
    expect(itens(montar(TUDO))).toEqual([
      { href: "#historia", rotulo: "História" },
      { href: "#detalhes", rotulo: "O dia" },
      { href: "#fotos", rotulo: "Galeria" },
      { href: "#presentes", rotulo: "Presentes" },
      { href: "#recados", rotulo: "Recados" },
      { href: "#album", rotulo: "Álbum" },
    ]);
  });

  it("SC-002: capa, contagem, confirmação e rodapé ficam de fora da faixa", () => {
    const hrefs = itens(montar(TUDO)).map((i) => i.href);
    for (const fora of ["#inicio", "#contagem", "#confirmacao", "#final"]) {
      expect(hrefs).not.toContain(fora);
    }
  });

  it("SC-002b: o mural responde por #recados, não pelo nome interno", () => {
    // A regra está escrita no próprio `ancoras.ts`: o endereço aparece no
    // navegador do convidado, e `#guestbook` num convite brasileiro é
    // vazamento de nome interno. Faltava a entrada; agora existe.
    expect(ANCORA_DA_SECAO.guestbook).toBe("recados");
  });

  it("a ordem é a do molde, não a de uma lista fixa", () => {
    const invertido: SectionKey[] = ["cover", "gifts", "story", "footer"];
    expect(itens(montar(invertido)).map((i) => i.rotulo)).toEqual([
      "Presentes",
      "História",
    ]);
  });
});

describe("o botão de confirmar presença", () => {
  it("SC-003: fecha a barra, apontando para #confirmacao", () => {
    const c = montar(TUDO);
    const nav = c.querySelector("nav")!;
    const ultimo = nav.lastElementChild!;
    expect(ultimo.tagName).toBe("A");
    expect(ultimo.getAttribute("href")).toBe("#confirmacao");
    expect(ultimo.textContent).toBe("Confirmar presença");
  });

  it("SC-003: nunca a sigla — 'RSVP' é vocabulário nosso, não do convidado", () => {
    expect(montar(TUDO).textContent).not.toContain("RSVP");
  });

  it("SC-004: no pacote Convite, que não tem confirmação, o botão não existe", () => {
    const convite: SectionKey[] = [
      "cover",
      "countdown",
      "details",
      "gallery",
      "gifts",
      "footer",
    ];
    const c = montar(convite);
    expect(c.querySelector('a[href="#confirmacao"]')).toBeNull();
    expect(c.textContent).not.toContain("Confirmar presença");
    // E a barra continua de pé: três destinos justificam a faixa.
    expect(c.querySelector("nav")).not.toBeNull();
  });
});

describe("quando a barra decide não existir", () => {
  it("SC-005: um destino e nenhum botão não sustentam uma barra", () => {
    const c = montar(["cover", "details", "footer"]);
    expect(c.querySelector("nav")).toBeNull();
  });

  it("só capa e rodapé: nada a navegar", () => {
    expect(montar(["cover", "footer"]).querySelector("nav")).toBeNull();
  });

  it("um destino E o botão sustentam — o botão é o motivo da barra", () => {
    const c = montar(["cover", "details", "rsvp", "footer"]);
    expect(c.querySelector("nav")).not.toBeNull();
    expect(c.querySelector('a[href="#confirmacao"]')).not.toBeNull();
  });
});

describe("o que a barra herda do tema, e o que ela não chumba", () => {
  it("SC-012: os nomes do casal abrem a barra, na fonte de display do tema", () => {
    const c = montar(TUDO, "Isabelle & Nycolas");
    const primeiro = c.querySelector("nav")!.firstElementChild as HTMLElement;
    expect(primeiro.textContent).toBe("Isabelle & Nycolas");
    expect(primeiro.style.fontFamily).toBe("var(--font-display)");
  });

  it("SC-008: nenhum hex literal — a cor vem toda de token", () => {
    // A barra aparece nos seis moldes e em todo tema que o casal montar. Um
    // `#f2efe7` chumbado aqui seria papel bege numa capa preta.
    const fonte = FONTE;
    const codigo = fonte.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(codigo).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(codigo).toContain("var(--paper)");
    expect(codigo).toContain("var(--ink)");
  });

  it("SC-009: server component — o convidado não baixa JS por causa da barra", () => {
    const fonte = FONTE;
    expect(fonte).not.toContain("use client");
  });

  it("é sticky no topo, acima do conteúdo que rola por baixo", () => {
    const nav = montar(TUDO).querySelector("nav")!;
    expect(nav.className).toContain("sticky");
    expect(nav.className).toContain("top-0");
    expect(nav.className).toContain("z-20");
    // 52px no celular, 60px quando o cartão abre para o desenho de desktop.
    expect(nav.className).toContain("h-[52px]");
    expect(nav.className).toContain("@[700px]:h-[60px]");
  });
});
