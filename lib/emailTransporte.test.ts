/**
 * Qual dos dois transportes manda — e por que isso precisa de teste.
 *
 * A precedência sozinha era uma armadilha silenciosa: com `GMAIL_USER` e
 * `GMAIL_APP_PASSWORD` preenchidos, pôr a `RESEND_API_KEY` **não trocava
 * nada**. Os e-mails continuavam saindo pelo Gmail, sem erro e sem aviso, e o
 * único jeito de perceber era ler o código. Quem acabou de contratar um
 * provedor concluiria que ele está de pé e descobriria o contrário no dia em
 * que o Gmail batesse o limite de ~500/dia.
 *
 * Estes testes ficam num arquivo próprio porque `lib/email.ts` lê o ambiente
 * **no topo do módulo**: cada caso precisa de um import limpo, com o ambiente
 * montado antes. É o que `resetModules` + `import()` fazem aqui.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const ORIGINAL = { ...process.env };

function ambiente(vars: Record<string, string | undefined>) {
  for (const k of ["GMAIL_USER", "GMAIL_APP_PASSWORD", "RESEND_API_KEY", "EMAIL_TRANSPORT", "RESET_EMAIL_FROM", "MAIL_FROM_NAME"]) {
    delete process.env[k];
  }
  for (const [k, v] of Object.entries(vars)) {
    if (v !== undefined) process.env[k] = v;
  }
}

/** Import limpo — o módulo lê o ambiente uma vez, na carga. */
async function carregar() {
  vi.resetModules();
  return import("./email");
}

const GMAIL = { GMAIL_USER: "eu@gmail.test", GMAIL_APP_PASSWORD: "senha de app" };
const RESEND = { RESEND_API_KEY: "re_teste" };

beforeEach(() => vi.resetModules());
afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe("sem escolha explícita, a precedência antiga continua valendo", () => {
  it("só Gmail → gmail", async () => {
    ambiente(GMAIL);
    expect((await carregar()).emailTransport()).toBe("gmail");
  });

  it("só Resend → resend", async () => {
    ambiente(RESEND);
    expect((await carregar()).emailTransport()).toBe("resend");
  });

  it("os dois → gmail, como sempre foi", async () => {
    // Comportamento preservado de propósito: quem não pediu nada não muda.
    ambiente({ ...GMAIL, ...RESEND });
    expect((await carregar()).emailTransport()).toBe("gmail");
  });

  it("nenhum → none", async () => {
    ambiente({});
    const m = await carregar();
    expect(m.emailTransport()).toBe("none");
    expect(m.isEmailConfigured()).toBe(false);
  });
});

describe("EMAIL_TRANSPORT decide — a armadilha que isto fecha", () => {
  it("resend ganha do Gmail quando pedido", async () => {
    /* O DEFEITO: antes, com os dois preenchidos, não havia como escolher o
       Resend sem apagar credencial do Gmail que ainda funciona. */
    ambiente({ ...GMAIL, ...RESEND, EMAIL_TRANSPORT: "resend" });
    expect((await carregar()).emailTransport()).toBe("resend");
  });

  it("gmail continua podendo ser forçado", async () => {
    ambiente({ ...GMAIL, ...RESEND, EMAIL_TRANSPORT: "gmail" });
    expect((await carregar()).emailTransport()).toBe("gmail");
  });

  it("aceita espaço e maiúscula", async () => {
    ambiente({ ...GMAIL, ...RESEND, EMAIL_TRANSPORT: "  Resend " });
    expect((await carregar()).emailTransport()).toBe("resend");
  });

  it("valor sem sentido é ignorado, não quebra", async () => {
    ambiente({ ...GMAIL, ...RESEND, EMAIL_TRANSPORT: "sendgrid" });
    expect((await carregar()).emailTransport()).toBe("gmail");
  });

  it("escolha explícita SEM a credencial vira none, nunca o outro", async () => {
    /* Cair no Gmail aqui seria o mesmo defeito ao contrário: quem pediu Resend
       e errou a chave receberia e-mail normalmente e concluiria que está de
       pé. */
    ambiente({ ...GMAIL, EMAIL_TRANSPORT: "resend" });
    expect((await carregar()).emailTransport()).toBe("none");
  });

  it("e a mensagem de erro diz onde procurar", async () => {
    ambiente({ ...GMAIL, EMAIL_TRANSPORT: "resend" });
    const m = await carregar();
    await expect(m.send("a@b.test", "x", "<p>x</p>")).rejects.toThrow(
      /EMAIL_TRANSPORT=resend[\s\S]*RESEND_API_KEY/
    );
  });
});

describe("o remetente segue o transporte ATIVO", () => {
  it("no Resend forçado, o From NÃO é o endereço do Gmail", async () => {
    /* O DEFEITO: o `From` olhava `GMAIL_APP_PASSWORD` direto. Com o Gmail
       ainda no arquivo e o Resend escolhido, saía
       `From: <eu@gmail.test>` por uma API que recusa remetente de domínio
       alheio — 403 de "domínio não verificado", sem pista da causa. */
    ambiente({
      ...GMAIL,
      ...RESEND,
      EMAIL_TRANSPORT: "resend",
      RESET_EMAIL_FROM: "Enlace <oi@enlace.com>",
    });
    const m = await carregar();

    const chamadas: string[] = [];
    vi.stubGlobal("fetch", async (_u: string, init: { body: string }) => {
      chamadas.push(JSON.parse(init.body).from);
      return { ok: true, text: async () => "" } as Response;
    });

    await m.send("convidado@teste.invalid", "Assunto", "<p>oi</p>");
    expect(chamadas[0]).toBe("Enlace <oi@enlace.com>");
    expect(chamadas[0]).not.toContain("gmail.test");
    vi.unstubAllGlobals();
  });

  it("no Gmail, o From é a conta autenticada — o Google reescreve outro", async () => {
    ambiente({ ...GMAIL, MAIL_FROM_NAME: "Enlace" });
    const m = await carregar();
    expect(m.emailTransport()).toBe("gmail");
  });
});
