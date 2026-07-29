import { config } from "dotenv";
import nodemailer from "nodemailer";

config({ path: ".env.local" });

// Testa o envio de e-mail sem passar pela interface. Use assim:
//   node scripts/test-email.mjs seu@email.com
//
// Serve para separar "o e-mail não chega" de "o formulário está errado":
// se este script envia, o problema está na aplicação; se ele falha, o
// problema é credencial ou bloqueio do Google.
const to = process.argv[2];
if (!to) {
  console.error("Uso: node scripts/test-email.mjs destino@email.com");
  process.exit(1);
}

const user = process.env.GMAIL_USER;
const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");

if (!user || !pass) {
  console.error(
    "Faltam GMAIL_USER e/ou GMAIL_APP_PASSWORD no .env.local.\n" +
      "A senha de app tem 16 letras; espaços podem ficar, o script os remove."
  );
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: { user, pass },
});

try {
  console.log(`Conectando ao Gmail como ${user}...`);
  await transporter.verify();
  console.log("Autenticação OK. Enviando...");

  const info = await transporter.sendMail({
    from: `${process.env.MAIL_FROM_NAME ?? "Enlace"} <${user}>`,
    to,
    subject: "Teste de envio — Enlace",
    text: "Se você está lendo isto, o envio por Gmail SMTP está funcionando.",
    html: '<p style="font-family:Arial,sans-serif;color:#3d4a36">Se você está lendo isto, o envio por <strong>Gmail SMTP</strong> está funcionando.</p>',
  });

  console.log(`\nEnviado para ${to} (id ${info.messageId}).`);
  console.log("Confira a caixa de entrada e o spam.");
} catch (error) {
  console.error("\nFalhou:", error.message);
  if (String(error.message).includes("Username and Password not accepted")) {
    console.error(
      "\nCausa mais comum: a senha usada é a senha normal do Google, não uma\n" +
        "Senha de app. Gere uma em https://myaccount.google.com/apppasswords\n" +
        "(exige verificação em 2 etapas ativa na conta)."
    );
  }
  process.exit(1);
} finally {
  transporter.close();
}
