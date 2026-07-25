// Envio de e-mail via Resend (API REST, sem dependência). Gated por env:
// RESEND_API_KEY (obrigatória para enviar de verdade) e RESET_EMAIL_FROM
// (remetente com domínio verificado no Resend, ex: "Enlace
// <nao-responda@enlace.com.br>"). Sem a chave, o fluxo cai no WhatsApp.

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.RESET_EMAIL_FROM ?? "Enlace <onboarding@resend.dev>";

export function isEmailConfigured(): boolean {
  return Boolean(RESEND_API_KEY);
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<void> {
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY não configurada");

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;color:#3d4a36;max-width:480px;margin:0 auto;padding:24px">
      <p style="letter-spacing:.25em;text-transform:uppercase;font-size:12px;color:#b8985f;margin:0 0 16px">Enlace</p>
      <h1 style="font-size:20px;margin:0 0 12px">Redefinir sua senha</h1>
      <p style="font-size:14px;line-height:1.6;color:#5a624f">
        Recebemos um pedido para redefinir a senha da sua conta. Clique no
        botão abaixo — o link vale por 1 hora. Se não foi você, pode ignorar
        este e-mail com tranquilidade.
      </p>
      <p style="margin:24px 0">
        <a href="${resetUrl}" style="background:#3d4a36;color:#fff;text-decoration:none;font-size:14px;padding:12px 28px;border-radius:9999px;display:inline-block">Redefinir senha</a>
      </p>
      <p style="font-size:12px;color:#a8a39a;word-break:break-all">Ou copie e cole: ${resetUrl}</p>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [to],
      subject: "Redefinir sua senha — Enlace",
      html,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend respondeu ${res.status}: ${detail}`);
  }
}
