/**
 * B3 · `/pacotes/exemplo/:pacote` — spec `site-publico/004`.
 *
 * A rota era um `redirect("/")` que engolia qualquer coisa: até
 * `/pacotes/exemplo/qualquer-lixo` respondia 307 para a home, como se fosse um
 * endereço válido. Agora pacote inválido é 404 — que é a verdade — e pacote
 * válido é 308 para a prévia real com o pacote na URL.
 *
 * A faixa EXEMPLO mora no `TemplateChrome` pelo mesmo motivo de tudo que
 * atravessa as seis prévias: um lugar só, e um molde novo herda sem saber.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PACKAGES } from "@/lib/packages";

const ROTA = readFileSync(
  resolve(process.cwd(), "app/pacotes/exemplo/[pacote]/page.tsx"),
  "utf-8"
);
const CHROME = readFileSync(
  resolve(process.cwd(), "components/templates/TemplateChrome.tsx"),
  "utf-8"
);
const COMECAR = readFileSync(
  resolve(process.cwd(), "app/comecar/route.ts"),
  "utf-8"
);

describe("SC-001 e SC-002: a rota valida antes de redirecionar", () => {
  it("pacote fora da lista é 404, não um desvio silencioso", () => {
    expect(ROTA).toContain("if (!valido) notFound();");
    expect(ROTA).toContain("PACKAGES.some((p) => p.tier === pacote)");
  });

  it("o desvio é PERMANENTE, e leva o pacote junto", () => {
    // 308 conta ao navegador e ao buscador que a mudança é definitiva; 307
    // diria que a rota ainda pode voltar a ter conteúdo próprio.
    expect(ROTA).toContain("permanentRedirect(");
    expect(ROTA).toContain("/pacotes/estilos/editorial?pacote=");
    // O comentário do arquivo CITA o `redirect("/")` antigo para contar o que
    // mudou; o que não pode existir é a chamada.
    const codigo = ROTA.replace(/\/\*[\s\S]*?\*\//g, "").replace(
      /^\s*\/\/.*$/gm,
      ""
    );
    expect(codigo).not.toContain('redirect("/")');
  });

  it("os três pacotes são pré-gerados", () => {
    expect(ROTA).toContain("generateStaticParams");
    expect(PACKAGES.map((p) => p.tier)).toEqual([
      "convite",
      "site",
      "para-sempre",
    ]);
  });
});

describe("SC-003 a SC-007: a faixa EXEMPLO", () => {
  it("só existe quando a prévia foi aberta POR PACOTE", () => {
    /* Sem `?pacote=`, o visitante está olhando ESTILO — a faixa não teria o
       que dizer. */
    expect(CHROME).toContain('busca.get("pacote")');
    expect(CHROME).toContain("const pacoteDaFaixa = embutido");
  });

  it("some dentro do questionário", () => {
    // Ali o casal já está comprando, e a faixa roubaria altura de um quadro
    // que já é apertado.
    expect(CHROME).toMatch(/const pacoteDaFaixa = embutido\s*\?\s*null/);
  });

  it("o texto é o do artboard, com o nome do pacote", () => {
    expect(CHROME).toContain(
      "Exemplo · pacote {pacoteDaFaixa.name} — este site é só uma amostra"
    );
  });

  it("fica acima da barra do site e não some ao rolar", () => {
    /* `z-30` contra o `z-20` da barra do site. Uma faixa que some na primeira
       rolagem deixaria o visitante lendo o site fictício como se fosse real —
       que é o mal-entendido que ela existe para evitar. */
    expect(CHROME).toContain("sticky top-0 z-30");
  });

  it("o botão é branco sobre tinta, como o desenho", () => {
    expect(CHROME).toContain('background: "#ffffff", color: "#1a1d21"');
    expect(CHROME).toContain("Criar o meu igual →");
  });
});

describe("SC-009: o botão não manda quem já tem conta para o cadastro", () => {
  it("aponta para `/comecar`, que decide pela sessão", () => {
    /* `CtaPacote` faria isso, mas é server component — e as seis prévias são
       client de ponta a ponta, sem fronteira de servidor onde encaixá-lo.
       `/conta` também não serve: manda quem não tem sessão para o LOGIN, e um
       visitante que nunca comprou precisa do cadastro. */
    expect(CHROME).toContain('href="/comecar"');
    expect(COMECAR).toContain('redirect(logado ? "/conta/pedido/novo" : "/conta/criar")');
  });
});
