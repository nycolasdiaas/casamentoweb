/**
 * SC-008 · publicar sem transporte de e-mail configurado.
 *
 * Arquivo separado de propósito: `lib/email.ts` lê `GMAIL_USER` e
 * `RESEND_API_KEY` no topo do módulo, uma vez. Para testar a ausência delas é
 * preciso um módulo carregado com o ambiente vazio — e o `.env.local` deste
 * repositório traz as duas preenchidas.
 *
 * O que se protege: uma instalação sem SMTP continua publicando sites. O aviso
 * é cortesia; o site no ar é o produto.
 */

import { describe, it, expect, vi } from "vitest";

vi.hoisted(() => {
  delete process.env.GMAIL_USER;
  delete process.env.GMAIL_APP_PASSWORD;
  delete process.env.RESEND_API_KEY;
});

const enviou = vi.hoisted(() => ({ vezes: 0 }));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: () => ({
      sendMail: async () => {
        enviou.vezes += 1;
      },
    }),
  },
}));

import { isEmailConfigured } from "@/lib/email";
import { avisarPublicacao } from "./avisarPublicacao";

describe("sem transporte configurado", () => {
  it("`isEmailConfigured` reconhece a ausência", () => {
    expect(isEmailConfigured()).toBe(false);
  });

  it("SC-008: nenhum envio é TENTADO, e nada lança", async () => {
    // Sai antes de tocar no banco: sem transporte, buscar pedido, site, dono,
    // conteúdo e fotos seria trabalho para jogar fora.
    const relatorio = await avisarPublicacao(
      "00000000-0000-0000-0000-000000000000"
    );
    expect(relatorio).toEqual({
      recibo: "sem-transporte",
      noAr: "sem-transporte",
    });
    expect(enviou.vezes).toBe(0);
  });
});
