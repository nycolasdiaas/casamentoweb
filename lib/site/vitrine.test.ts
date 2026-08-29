/**
 * As linhas de benefício da vitrine — spec `site-publico/003`.
 *
 * O risco que estes testes guardam não é visual. É a vitrine passar a vender o
 * que o site não monta: alguém muda `TIER_SECTIONS` para tirar o mural do
 * pacote do meio, e `/pacotes` continua com o ✓ porque a lista foi escrita à
 * mão em algum componente. O cliente compra, não acha, e a Enlace descobre
 * pelo chamado.
 *
 * Por isso o que se afirma aqui é uma equivalência, não uma lista: o ✓ de cada
 * linha é `tierAllowsSection`, o mesmo gating que o `SiteRenderer` obedece.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PACKAGES } from "@/lib/packages";
import { formatPriceCents } from "@/lib/format";
import {
  tierAllowsSection,
  SECTION_KEYS,
  type SectionKey,
} from "@/lib/templates/contract";
import { LINHAS_DA_VITRINE } from "./vitrine";

const PAGINA = readFileSync(resolve(process.cwd(), "app/pacotes/page.tsx"), "utf-8");

/* A página SEM comentário.
   Dois critérios da spec são `grep` cru, e `grep` não distingue a promessa da
   negação dela: o comentário do arquivo explica que a página "era um
   `redirect`" e que §7 descartou o "funil por WhatsApp", e a resposta da
   primeira dúvida diz "não tem orçamento" — as três ocorrências são o
   contrário do que o critério proíbe. É o mesmo defeito que travou
   `design-system/006`: um literal não é uma promessa. Aqui o comentário sai
   antes, e a negação é conferida como negação. */
const CODIGO = PAGINA.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

/** Espaço fino que o `Intl` em pt-BR põe entre "R$" e o número. */
const semNbsp = (t: string) => t.replace(/ /g, " ");

const incluidas = (tier: (typeof PACKAGES)[number]["tier"]) =>
  LINHAS_DA_VITRINE.filter((l) => tierAllowsSection(tier, l.chave)).map(
    (l) => l.rotulo
  );

describe("o ✓ vem do gating, não de uma lista escrita à mão", () => {
  it("SC-005: cada linha segue `tierAllowsSection` — mudar o pacote muda a vitrine sozinha", () => {
    // A equivalência é o teste. Se `TIER_SECTIONS.site` ganhar `guestbook`,
    // "Mural de recados" vira ✓ no cartão do meio sem ninguém tocar em
    // `/pacotes`, porque não há segunda fonte de verdade para desatualizar.
    for (const pacote of PACKAGES) {
      for (const { chave } of LINHAS_DA_VITRINE) {
        expect(
          incluidas(pacote.tier).includes(
            LINHAS_DA_VITRINE.find((l) => l.chave === chave)!.rotulo
          )
        ).toBe(tierAllowsSection(pacote.tier, chave));
      }
    }
  });

  it("SC-004: os três cartões têm o mesmo número de linhas", () => {
    // O ✕ é informação: comparar pacotes exige ver o que falta, não só o que
    // tem. Listas de tamanhos diferentes viram três folhetos, não uma tabela.
    const tamanhos = PACKAGES.map(() => LINHAS_DA_VITRINE.length);
    expect(new Set(tamanhos).size).toBe(1);
    expect(LINHAS_DA_VITRINE).toHaveLength(8);
  });

  it("SC-004: a lista de presentes com Pix só está no Para Sempre", () => {
    expect(incluidas("convite")).not.toContain("Lista de presentes com Pix");
    expect(incluidas("site")).not.toContain("Lista de presentes com Pix");
    expect(incluidas("para-sempre")).toContain("Lista de presentes com Pix");
  });

  it("a escada dos pacotes é crescente — nenhum perde o que o anterior tinha", () => {
    const c = incluidas("convite");
    const s = incluidas("site");
    const p = incluidas("para-sempre");
    for (const linha of c) expect(s).toContain(linha);
    for (const linha of s) expect(p).toContain(linha);
    expect(s.length).toBeGreaterThan(c.length);
    expect(p.length).toBeGreaterThan(s.length);
  });

  it("toda chave da vitrine é uma seção de verdade", () => {
    for (const { chave } of LINHAS_DA_VITRINE) {
      expect(SECTION_KEYS).toContain(chave as SectionKey);
    }
  });

  it("capa e rodapé ficam de fora — estruturais nos três, e a capa tem conflito aberto", () => {
    const chaves = LINHAS_DA_VITRINE.map((l) => l.chave);
    expect(chaves).not.toContain("cover");
    expect(chaves).not.toContain("footer");
  });
});

describe("o preço e a voz da página", () => {
  it("SC-003: os três preços saem de PACKAGES, formatados por formatPriceCents", () => {
    expect(PACKAGES.map((p) => semNbsp(formatPriceCents(p.priceCents)))).toEqual([
      "R$ 9,90",
      "R$ 29,90",
      "R$ 99,90",
    ]);
    // E a página não escreve preço nenhum: se escrevesse, mudar `priceCents`
    // deixaria a vitrine mentindo até alguém lembrar dos dois lugares.
    expect(PAGINA).not.toMatch(/R\$\s?\d/);
    expect(PAGINA).toContain("formatPriceCents(pacote.priceCents)");
  });

  it("SC-010: nenhum funil por fora — a página é a proposta", () => {
    // Regras de negócio §1 e §7: sem orçamento, sem especialista, sem
    // WhatsApp antes da compra. Nenhum caminho de saída, em nenhuma forma.
    expect(CODIGO).not.toMatch(/wa\.me|whatsapp|api\.whats/i);
    expect(CODIGO).not.toMatch(/especialista|consulte valores|fale conosco/i);

    // "orçamento" a página diz — para dizer que NÃO tem. Toda ocorrência
    // precisa vir negada; uma solta seria a oferta que o critério proíbe.
    const soltas = [...CODIGO.matchAll(/orçamento/gi)].filter(
      (m) => !/(não tem|sem|nenhum)\s+$/i.test(CODIGO.slice(0, m.index))
    );
    expect(soltas).toHaveLength(0);
  });

  it("SC-001: a página não redireciona mais", () => {
    expect(CODIGO).not.toContain("redirect(");
    expect(CODIGO).not.toContain("next/navigation");
  });

  it("SC-015: as três dúvidas do artboard, com o texto literal", () => {
    for (const pergunta of [
      "É pagamento único mesmo? Tem mensalidade escondida?",
      "Consigo trocar o estilo depois de publicar?",
      "Como funciona a lista de presentes por Pix?",
    ]) {
      expect(PAGINA).toContain(pergunta);
    }
    expect(PAGINA.split('pergunta: "').length - 1).toBe(3);
  });

  it("as respostas não prometem o que a Enlace não observa", () => {
    // O Pix vai direto para o casal e o convidado AUTO-DECLARA que pagou
    // (AGENTS.md §3). A plataforma não sabe se o dinheiro caiu — qualquer
    // palavra de confirmação aqui é promessa que ninguém pode cumprir.
    const proibidas = [
      "pagamento confirmado",
      "confirmação de pagamento",
      "avisamos quando cair",
      "acompanhe os pagamentos",
    ];
    for (const frase of proibidas) {
      expect(PAGINA.toLowerCase()).not.toContain(frase);
    }
    // E não promete tempo no ar, que é pergunta aberta com o dono.
    expect(PAGINA).not.toMatch(/no ar para sempre|online para sempre/i);
  });

  it("SC-006: um único botão de tinta na grade", () => {
    const destaques = PACKAGES.filter((p) => p.highlight);
    expect(destaques).toHaveLength(1);
    expect(destaques[0].name).toBe("Para Sempre");
  });

  it("SC-007: o rótulo do botão nomeia o pacote, não o conceito", () => {
    expect(PAGINA).toContain("rotulo={`Escolher ${pacote.name}`}");
    expect(PACKAGES.map((p) => `Escolher ${p.name}`)).toEqual([
      "Escolher Convite",
      "Escolher Site do Casamento",
      "Escolher Para Sempre",
    ]);
  });

  it("SC-012: a casca da vitrine é a mesma da home", () => {
    expect(PAGINA).toContain("AccountNav");
    expect(PAGINA).toContain("LoggedOutLinks");
    expect(PAGINA).toContain("bg-(--c-olive)");
  });
});
