/**
 * A casca dos e-mails transacionais — spec `design-system/007`.
 *
 * O e-mail é a única parte do produto que roda num renderizador que ninguém
 * controla: o Outlook desenha com o motor do Word, o Gmail reescreve o que
 * não entende, e metade dos clientes bloqueia imagem por padrão. Nada disso
 * dá para ver rodando o projeto — a mensagem sai da máquina e só volta como
 * reclamação.
 *
 * Por isso as invariantes viram teste: a largura em dois lugares, a ausência
 * de flex/grid/`<button>`, um único botão de tinta, o link repetido em texto,
 * e o preheader existindo no HTML sem contaminar a versão em texto.
 *
 * O transporte é dublê. O que se confere é o que sai daqui, não o que o
 * Google faz com isso.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

const { enviados } = vi.hoisted(() => {
  // Lidas no topo de `lib/email.ts`, então precisam existir antes do import.
  process.env.GMAIL_USER = "enlace@teste.invalid";
  process.env.GMAIL_APP_PASSWORD = "senha de app";
  process.env.NEXT_PUBLIC_SITE_URL = "https://enlace.test";
  return { enviados: [] as { subject: string; html: string; text: string }[] };
});

vi.mock("nodemailer", () => ({
  default: {
    createTransport: () => ({
      sendMail: async (m: { subject: string; html: string; text: string }) => {
        enviados.push(m);
      },
    }),
  },
}));

import {
  layout,
  button,
  preheader,
  toPlainText,
  sendPasswordResetEmail,
  sendPreviewReadyEmail,
  sendEmailVerification,
} from "./email";

const LINK = "https://enlace.test/conta/redefinir?t=abc";

async function gerar(f: () => Promise<void>) {
  enviados.length = 0;
  await f();
  return enviados[0];
}

const reset = () =>
  gerar(() => sendPasswordResetEmail("casal@teste.invalid", LINK));

beforeEach(() => {
  enviados.length = 0;
});

describe("a casca — o que o Outlook exige", () => {
  it("SC-001: 600px declarados duas vezes, e nada que o Word não desenhe", async () => {
    const { html } = await reset();
    expect(html).toContain('width="600"');
    expect(html).toContain("max-width:100%");
    for (const proibido of ["display:flex", "display:grid", "gap:", "<button"]) {
      expect(html).not.toContain(proibido);
    }
  });

  it("SC-002: a casca antiga não sobrou em canto nenhum", async () => {
    const { html } = await reset();
    // Inter é web font (não carrega no Outlook), o raio de 9999px era pílula
    // e o verde era a paleta de antes da Prensa.
    for (const velho of ["Inter", "border-radius:9999px", "#2f3a29"]) {
      expect(html).not.toContain(velho);
    }
    expect(html).toContain("Georgia, 'Times New Roman', serif");
    expect(html).toContain("Helvetica, Arial, sans-serif");
    expect(html).toContain("'Courier New', Courier, monospace");
    // Web font por link também não: o Outlook ignora e o Gmail às vezes some
    // com a mensagem inteira.
    expect(html).not.toContain("fonts.googleapis.com");
    expect(html).not.toContain("@font-face");
  });

  it("SC-003: o preheader é o primeiro nó dentro do body", async () => {
    const { html } = await reset();
    const corpo = html.slice(html.indexOf("<body")).replace(/^<body[^>]*>/, "");
    expect(corpo.trimStart().startsWith('<div data-preheader="1"')).toBe(true);
    expect(html).toContain("&#8199;&#65279;");
    // 120 caracteres invisíveis — o que empurra o parágrafo para fora da
    // prévia da caixa de entrada.
    expect(preheader("oi").split("&#8199;&#65279;").length - 1).toBe(60);
  });

  it("SC-004: um botão de tinta, com o endereço repetido em texto logo abaixo", async () => {
    const { html } = await reset();
    expect(html.split('bgcolor="#1a1d21"').length - 1).toBe(1);

    const depoisDoBotao = html.slice(html.indexOf('bgcolor="#1a1d21"'));
    expect(depoisDoBotao).toContain("word-break:break-all");
    expect(depoisDoBotao).toContain("Ou copie e cole: " + LINK);
    // A área do dedo: 20px de linha + 15px de padding em cima e embaixo.
    expect(html).toContain("padding:15px 28px");
    expect(html).toContain("line-height:20px");
  });

  it("SC-005: dois botões de tinta sem autorização explícita quebram em dev", () => {
    const dois =
      button("https://a.test", "Vou") + button("https://b.test", "Não vou");
    expect(() =>
      layout({ titulo: "Confirma?", linhaDaCaixa: "Falta você.", corpo: dois })
    ).toThrow(/2 botões de tinta/);

    expect(() =>
      layout({
        titulo: "Confirma?",
        linhaDaCaixa: "Falta você.",
        corpo: dois,
        permitirDoisBotoes: true,
      })
    ).not.toThrow();
  });

  it("SC-006: o preheader não vaza para a versão em texto", async () => {
    const { text } = await reset();
    expect(text.startsWith("O link vale por 1 hora.")).toBe(false);
    expect(text).not.toContain("&#8199;");
    // E a versão em texto existe de verdade — sem ela o Gmail desconfia.
    expect(text.length).toBeGreaterThan(80);
  });

  it("SC-007 e SC-010: a imagem tem alt, e o cabeçalho é o do desenho", async () => {
    const { html } = await reset();
    const imgs = html.match(/<img[^>]*>/g) ?? [];
    expect(imgs.length).toBeGreaterThan(0);
    for (const img of imgs) expect(img).toMatch(/alt="[^"]+"/);

    expect(html).toContain('alt="Enlace"');
    expect(html).toContain('height="26"');
    expect(html).toContain("padding:24px 40px;border-bottom:1px solid #d8d0bf");
  });

  it("SC-011: o rodapé fecha em mono, com quem mandou e de onde", async () => {
    const { html } = await reset();
    const fim = html.slice(html.lastIndexOf("border-top:1px solid #d8d0bf"));
    expect(fim).toContain("font-size:11px");
    expect(fim).toContain("'Courier New', Courier, monospace");
    expect(fim).toContain("Enlace &middot; sites de casamento");
    expect(fim).toContain("enlace.test");
  });

  it("a mensagem se sustenta com as imagens bloqueadas", async () => {
    const { html } = await reset();
    // Nada essencial dentro de <img>: tirando as imagens, o texto continua
    // dizendo o que é e o que fazer.
    const semImagem = toPlainText(html.replace(/<img[^>]*>/g, ""));
    expect(semImagem).toContain("Redefinir sua senha");
    expect(semImagem).toContain(LINK);
  });
});

describe("SC-008: o texto dos três e-mails não mudou", () => {
  const trecho = (texto: string, frase: string) =>
    expect(texto.replace(/\s+/g, " ")).toContain(frase);

  it("redefinir senha", async () => {
    const { subject, text } = await reset();
    expect(subject).toBe("Redefinir sua senha — Enlace");
    trecho(text, "Recebemos um pedido para redefinir a senha da sua conta.");
    trecho(text, "o link vale por 1 hora");
    trecho(text, "Se não foi você, pode ignorar este e-mail com tranquilidade.");
  });

  it("a prévia está pronta", async () => {
    const { subject, text } = await gerar(() =>
      sendPreviewReadyEmail(
        "casal@teste.invalid",
        "Ana",
        "https://enlace.test/preview/xyz",
        "https://enlace.test/conta/pedidos/1"
      )
    );
    expect(subject).toBe("A prévia do site de vocês está pronta 💚");
    trecho(text, "Oi, Ana! Montamos o site de vocês com o que veio no pedido.");
    trecho(text, "Abram para ver como ficou.");
    trecho(text, "e a mudança aparece no site na hora");
    trecho(text, "Este link é só de vocês: o site ainda não está público.");
  });

  it("confirmar o e-mail", async () => {
    const { subject, text } = await gerar(() =>
      sendEmailVerification(
        "casal@teste.invalid",
        "Ana",
        "https://enlace.test/conta/confirmar?t=abc"
      )
    );
    expect(subject).toBe("Confirmem o e-mail de vocês — Enlace");
    trecho(text, "A conta de vocês na Enlace foi criada.");
    trecho(text, "O link vale por 24 horas.");
    trecho(text, "Se não foi você quem criou a conta, é só ignorar este e-mail.");
  });
});
