/**
 * Os dois e-mails do fim do funil — spec `painel-casal/011`.
 *
 * O que se guarda aqui é a diferença entre avisar e mentir. O recibo diz
 * "Pagamento confirmado": mandá-lo numa publicação de cortesia do admin, onde
 * ninguém pagou, seria mentira com carimbo. E mandá-lo duas vezes — webhook
 * reenviado, tela recarregada — faria o casal achar que foi cobrado de novo.
 *
 * O transporte é dublê; o que se confere é o que sai daqui.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const dubles = vi.hoisted(() => {
  process.env.GMAIL_USER = "enlace@teste.invalid";
  process.env.GMAIL_APP_PASSWORD = "senha de app";
  return { enviados: [] as { subject: string; html: string; text: string }[] };
});

vi.mock("nodemailer", () => ({
  default: {
    createTransport: () => ({
      sendMail: async (m: { subject: string; html: string; text: string }) => {
        dubles.enviados.push(m);
      },
    }),
  },
}));

import { sendReciboEmail, sendSiteNoArEmail, toPlainText } from "@/lib/email";
import { numeroDoPedido } from "./avisarPublicacao";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const PUBLISH = readFileSync(resolve(process.cwd(), "lib/site/publish.ts"), "utf-8");
const AVISAR = readFileSync(
  resolve(process.cwd(), "lib/site/avisarPublicacao.ts"),
  "utf-8"
);

const { enviados } = dubles;

const RECIBO = {
  numero: "4821AB",
  pacote: "Para Sempre",
  total: "R$ 99,90",
  pagoEm: new Date("2026-09-20T01:00:00.000Z"), // 22h de 19/09 em Fortaleza
  timezone: "America/Fortaleza",
  painelUrl: "https://enlace.test/conta/pedidos/1",
};

const NO_AR = {
  nomes: "Ana & Pedro",
  siteUrl: "https://enlace.test/s/ana-e-pedro",
  capaUrl: "https://enlace.test/f/abc",
};

async function gerar(f: () => Promise<void>) {
  enviados.length = 0;
  await f();
  return enviados[0];
}

beforeEach(() => {
  enviados.length = 0;
});

describe("03 · o recibo", () => {
  it("SC-001: o rótulo, a tabela de quatro linhas e um botão só", async () => {
    const { subject, html } = await gerar(() =>
      sendReciboEmail("casal@teste.invalid", RECIBO)
    );
    expect(subject).toBe("Pagamento confirmado · pedido #4821AB");
    expect(html).toContain("Pagamento confirmado");
    expect(html).toContain("Está tudo certo");
    expect(html).toContain(
      "Recebemos seu pagamento e o site de vocês já está no ar."
    );
    for (const linha of ["Pedido", "Pacote", "Pago em", "Total"]) {
      expect(html).toContain(linha);
    }
    expect(html).toContain("#4821AB");
    expect(html).toContain("Para Sempre");
    expect(html).toContain("R$ 99,90");
    // A casca de 600px: um único botão de tinta por e-mail.
    expect(html.split('bgcolor="#1a1d21"').length - 1).toBe(1);
    expect(html).toContain("Ver meu site");
    expect(html).toContain("Guarde este e-mail como comprovante.");
  });

  it("SC-002: `Pago em` usa o fuso do SITE, não o do servidor", async () => {
    // 22h de 19/09 em Fortaleza é 01h de 20/09 em UTC. Um recibo dizendo
    // "20 Set" contradiria o extrato do casal.
    const { html } = await gerar(() =>
      sendReciboEmail("casal@teste.invalid", RECIBO)
    );
    expect(html).toContain("19 Set 2026 · Pix");
    expect(html).not.toContain("20 Set 2026");
  });

  it("o fuso é lido de verdade — outro fuso, outro dia", async () => {
    const { html } = await gerar(() =>
      sendReciboEmail("casal@teste.invalid", {
        ...RECIBO,
        timezone: "Europe/Lisbon",
      })
    );
    expect(html).toContain("20 Set 2026");
  });

  it("SC-009: transacional não tem descadastro", async () => {
    const { html } = await gerar(() =>
      sendReciboEmail("casal@teste.invalid", RECIBO)
    );
    expect(html.toLowerCase()).not.toContain("unsubscribe");
    expect(html.toLowerCase()).not.toContain("parar de receber");
  });

  it("SC-012 (FR-012): não promete prazo nenhum", async () => {
    const { html } = await gerar(() =>
      sendReciboEmail("casal@teste.invalid", RECIBO)
    );
    // "Está no ar" é resultado, não espera. Regras §2.2.
    expect(html).not.toMatch(/em até|dentro de \d|aguarde|prazo de/i);
  });
});

describe("04 · o site está no ar", () => {
  it("SC-012: assunto e preheader exatos", async () => {
    const { subject, html } = await gerar(() =>
      sendSiteNoArEmail("casal@teste.invalid", NO_AR)
    );
    expect(subject).toBe("O site de vocês está no ar");
    expect(html).toContain(
      "enlace.test/s/ana-e-pedro — hora de compartilhar."
    );
  });

  it("SC-003: o assunto não leva emoji, contra o artboard", async () => {
    // O desenho traz "💚". A Voz V5 é literal: emoji nunca em rótulo, e
    // assunto de transacional é rótulo. A Fundação vence a tela.
    const { subject } = await gerar(() =>
      sendSiteNoArEmail("casal@teste.invalid", NO_AR)
    );
    expect(subject).toMatch(/^[ -ÿ]+$/);
  });

  it("SC-004: com capa, a faixa é imagem com `alt` preenchido", async () => {
    const { html } = await gerar(() =>
      sendSiteNoArEmail("casal@teste.invalid", NO_AR)
    );
    expect(html).toContain('src="https://enlace.test/f/abc"');
    expect(html).toContain('alt="Foto de Ana &amp; Pedro"');
  });

  it("SC-004: sem capa, cartão tipográfico — nunca retângulo quebrado", async () => {
    const { html } = await gerar(() =>
      sendSiteNoArEmail("casal@teste.invalid", { ...NO_AR, capaUrl: null })
    );
    expect(html).not.toContain("/f/");
    expect(html).toContain("Georgia, 'Times New Roman', serif");
    expect(html).toContain("#f2efe7");
    expect(html).toContain("Ana &amp; Pedro");
  });

  it("SC-005: com as imagens bloqueadas, o endereço continua legível", async () => {
    const { html } = await gerar(() =>
      sendSiteNoArEmail("casal@teste.invalid", NO_AR)
    );
    const semImagem = toPlainText(html.replace(/<img[^>]*>/g, ""));
    expect(semImagem).toContain("enlace.test/s/ana-e-pedro");
    expect(semImagem).toContain("Ana & Pedro");
    expect(semImagem).toContain("Está no ar!");
  });

  it("o botão de compartilhar não imprime a URL escapada embaixo", async () => {
    const { html } = await gerar(() =>
      sendSiteNoArEmail("casal@teste.invalid", NO_AR)
    );
    // A repetição em texto puro serve a um DESTINO. `wa.me/?text=…` colado num
    // navegador não leva a lugar útil — imprimir 140 caracteres escapados
    // abaixo do botão seria ruído, não acessibilidade.
    expect(html).not.toContain("Ou copie e cole: https://wa.me");
    expect(html).toContain("wa.me/?text=");
  });

  it("SC-009: transacional não tem descadastro", async () => {
    const { html } = await gerar(() =>
      sendSiteNoArEmail("casal@teste.invalid", NO_AR)
    );
    expect(html.toLowerCase()).not.toContain("unsubscribe");
    expect(html.toLowerCase()).not.toContain("parar de receber");
  });
});

describe("o número do pedido", () => {
  it("é curto, estável e legível ao telefone", () => {
    const id = "4821ab3c-9d2e-4f10-8a77-0b1c2d3e4f56";
    expect(numeroDoPedido(id)).toBe("4821AB");
    expect(numeroDoPedido(id)).toBe(numeroDoPedido(id));
    expect(numeroDoPedido(id)).toMatch(/^[0-9A-F]{6}$/);
  });
});

describe("o disparo, do lado de publish.ts", () => {
  it("SC-006: só quando ESTA chamada publicou", () => {
    /* `publishSiteForOrder` é idempotente e diz isso em `alreadyPublished`
       (coberto por `publish.test.ts`). Sem a guarda, webhook reenviado e tela
       recarregada mandariam o mesmo recibo três vezes — e recibo repetido faz
       o casal achar que foi cobrado de novo. */
    expect(PUBLISH).toContain("if (!alreadyPublished) {");
    expect(PUBLISH).toContain("after(() => avisarPublicacao(orderId));");
    const guarda = PUBLISH.search(/if \(!alreadyPublished\) \{\s+try \{/);
    const disparo = PUBLISH.indexOf("after(() => avisarPublicacao");
    expect(guarda).toBeGreaterThan(-1);
    expect(disparo).toBeGreaterThan(guarda);
  });

  it("SC-007: falha de e-mail não pode impedir a publicação", () => {
    // Três camadas: `after()` roda depois da resposta; o `try/catch` em volta
    // dele cobre o caso de não haver requisição (teste, script); e cada envio
    // tem o próprio catch dentro de `avisarPublicacao`.
    expect(PUBLISH).toMatch(
      /after\(\(\) => avisarPublicacao\(orderId\)\);\s+\} catch \{/
    );
    expect(AVISAR.match(/catch \(error\)/g)?.length).toBeGreaterThanOrEqual(2);
    // E o disparo vem DEPOIS da transação que grava o status.
    expect(PUBLISH.indexOf("await db.transaction")).toBeLessThan(
      PUBLISH.indexOf("after(() => avisarPublicacao")
    );
  });

  it("o recibo não sai de publicação por cortesia do admin", () => {
    // `requirePaid: false` é o caminho do admin. Um "Pagamento confirmado"
    // onde ninguém pagou seria mentira com carimbo.
    expect(AVISAR).toContain('if (order.paymentStatus !== "PAID") {');
    expect(AVISAR).toContain('relatorio.recibo = "sem-pagamento";');
  });
});
