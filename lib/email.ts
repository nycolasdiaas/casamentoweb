// Envio dos e-mails transacionais (redefinição de senha e confirmação de
// cadastro). Dois transportes, escolhidos pelo que estiver configurado:
//
//   1. Gmail SMTP  — GMAIL_USER + GMAIL_APP_PASSWORD
//      Solução temporária enquanto não há domínio próprio. Envia a partir da
//      sua conta Google, então NÃO precisa verificar domínio. Limite de
//      ~500 destinatários/dia e a senha de app é uma credencial da conta
//      inteira — troque por um provedor dedicado quando o volume crescer.
//
//   2. Resend      — RESEND_API_KEY + RESET_EMAIL_FROM
//      Exige domínio verificado (SPF/DKIM). É o destino final.
//
// O Gmail tem prioridade quando os dois estão preenchidos, porque é o que
// se configura "temporariamente por cima". Sem nenhum dos dois, o envio
// fica desligado: a redefinição aponta para o WhatsApp e a confirmação de
// e-mail não bloqueia o envio do pedido.

import nodemailer, { type Transporter } from "nodemailer";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");

// O remetente muda com o transporte: no Gmail o From TEM que ser a própria
// conta autenticada (o Google reescreve qualquer outro), no Resend é o
// endereço do domínio verificado.
const FROM = GMAIL_APP_PASSWORD
  ? (process.env.MAIL_FROM_NAME ?? "Enlace") + ` <${GMAIL_USER}>`
  : (process.env.RESET_EMAIL_FROM ?? "Enlace <onboarding@resend.dev>");

export function isEmailConfigured(): boolean {
  return Boolean((GMAIL_USER && GMAIL_APP_PASSWORD) || RESEND_API_KEY);
}

/** Qual transporte está ativo — usado pelo script de teste e por diagnóstico. */
export function emailTransport(): "gmail" | "resend" | "none" {
  if (GMAIL_USER && GMAIL_APP_PASSWORD) return "gmail";
  if (RESEND_API_KEY) return "resend";
  return "none";
}

// Reaproveita a conexão SMTP entre envios (pool) em vez de abrir uma nova a
// cada e-mail — o Google limita conexões por minuto.
let transporter: Transporter | null = null;
function gmailTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      pool: true,
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    });
  }
  return transporter;
}

// Casca comum dos e-mails transacionais. Cores em hex literal: cliente de
// e-mail não entende custom property nem folha de estilo externa.
function layout(title: string, bodyHtml: string): string {
  return `
    <div style="font-family:Inter,Arial,sans-serif;color:#3d4a36;max-width:480px;margin:0 auto;padding:24px">
      <p style="letter-spacing:.25em;text-transform:uppercase;font-size:12px;color:#b8985f;margin:0 0 16px">Enlace</p>
      <h1 style="font-size:20px;margin:0 0 12px">${title}</h1>
      ${bodyHtml}
    </div>
  `;
}

function button(href: string, label: string): string {
  return `<p style="margin:24px 0"><a href="${href}" style="background:#2f3a29;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:9999px;display:inline-block">${label}</a></p>`;
}

/** Versão em texto puro: sem ela o Gmail marca o e-mail como suspeito. */
function toPlainText(html: string): string {
  return html
    .replace(/<a [^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi, "$2: $1")
    .replace(/<\/(p|div|h1|h2)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

export async function send(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  const transport = emailTransport();

  if (transport === "gmail") {
    await gmailTransporter().sendMail({
      from: FROM,
      to,
      subject,
      html,
      text: toPlainText(html),
    });
    return;
  }

  if (transport === "none") {
    throw new Error(
      "Nenhum transporte de e-mail configurado (GMAIL_APP_PASSWORD ou RESEND_API_KEY)."
    );
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend respondeu ${res.status}: ${detail}`);
  }
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<void> {
  await send(
    to,
    "Redefinir sua senha — Enlace",
    layout(
      "Redefinir sua senha",
      `<p style="font-size:14px;line-height:1.6;color:#5a624f">
        Recebemos um pedido para redefinir a senha da sua conta. Clique no
        botão abaixo — o link vale por 1 hora. Se não foi você, pode ignorar
        este e-mail com tranquilidade.
      </p>
      ${button(resetUrl, "Redefinir senha")}
      <p style="font-size:12px;color:#a8a39a;word-break:break-all">Ou copie e cole: ${resetUrl}</p>`
    )
  );
}

/**
 * "A prévia está pronta" — o e-mail que transforma "enviei o pedido" em
 * "recebi meu site". Sem ele o casal só descobre a prévia se voltar à tela
 * por conta própria (item 2 dos próximos passos do PLANNING).
 */
export async function sendPreviewReadyEmail(
  to: string,
  name: string,
  previewUrl: string,
  painelUrl: string
): Promise<void> {
  await send(
    to,
    "A prévia do site de vocês está pronta 💚",
    layout(
      "A prévia está pronta!",
      `<p style="font-size:14px;line-height:1.6;color:#5a624f">
        Oi, ${name}! Montamos o site de vocês com o que veio no pedido. Abram
        para ver como ficou.
      </p>
      ${button(previewUrl, "Ver a prévia do site")}
      <p style="font-size:13px;line-height:1.6;color:#5a624f">
        Dá para trocar textos, datas e locais, escolher o que aparece e subir
        as fotos direto no painel — e a mudança aparece no site na hora:<br>
        <a href="${painelUrl}" style="color:#3d4a36">${painelUrl}</a>
      </p>
      <p style="font-size:12px;color:#a8a39a">
        Este link é só de vocês: o site ainda não está público. Ele vai ao ar
        depois da confirmação do pagamento.
      </p>`
    )
  );
}

export async function sendEmailVerification(
  to: string,
  name: string,
  verifyUrl: string
): Promise<void> {
  await send(
    to,
    "Confirmem o e-mail de vocês — Enlace",
    layout(
      "Falta só confirmar o e-mail",
      `<p style="font-size:14px;line-height:1.6;color:#5a624f">
        Oi, ${name}! A conta de vocês na Enlace foi criada. Clique no botão
        para confirmar que este e-mail é de vocês — é por ele que a gente
        avisa quando a prévia do site ficar pronta. O link vale por 24 horas.
      </p>
      ${button(verifyUrl, "Confirmar meu e-mail")}
      <p style="font-size:12px;color:#a8a39a;word-break:break-all">Ou copie e cole: ${verifyUrl}</p>
      <p style="font-size:12px;color:#a8a39a">Se não foi você quem criou a conta, é só ignorar este e-mail.</p>`
    )
  );
}
