"use server";

import crypto from "crypto";
import { redirect } from "next/navigation";
import { getUserByEmail, updateUserPassword } from "@/lib/repositories/users";
import {
  createResetToken,
  deleteUserResetTokens,
  findValidResetToken,
  markResetTokenUsed,
} from "@/lib/repositories/passwordResets";
import { hashPassword } from "@/lib/auth/password";
import { isEmailConfigured, sendPasswordResetEmail } from "@/lib/email";
import { getBaseUrl } from "@/lib/baseUrl";
import { checkRateLimit, getClientIp, RATE_LIMIT_MESSAGE } from "@/lib/rateLimit";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

type Result = { error?: string; info?: string } | undefined;

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

// Mensagem sempre igual, exista ou não a conta — não revela se o e-mail está
// cadastrado (anti-enumeração).
const GENERIC_SENT =
  "Se existir uma conta com esse e-mail, enviamos um link para redefinir a senha. Confira a caixa de entrada e o spam.";

export async function requestPasswordResetAction(
  _prev: Result,
  formData: FormData
): Promise<Result> {
  const email = formData.get("email")?.toString().trim().toLowerCase() ?? "";

  const ip = await getClientIp();
  const [ipOk, emailOk] = await Promise.all([
    checkRateLimit(`reset:${ip}`),
    email ? checkRateLimit(`reset-email:${email}`) : Promise.resolve({ allowed: true }),
  ]);
  if (!ipOk.allowed || !emailOk.allowed) return { error: RATE_LIMIT_MESSAGE };

  if (!EMAIL_PATTERN.test(email)) return { error: "E-mail inválido." };

  // Sem provedor de e-mail configurado: mesma mensagem para todos (não
  // revela existência) apontando para o WhatsApp.
  if (!isEmailConfigured()) {
    return {
      info: "A redefinição por e-mail ainda não está ativa. Fale com a gente no WhatsApp para recuperar o acesso.",
    };
  }

  const user = await getUserByEmail(email);
  if (user) {
    const token = crypto.randomBytes(32).toString("base64url");
    await deleteUserResetTokens(user.id);
    await createResetToken(
      user.id,
      sha256(token),
      new Date(Date.now() + TOKEN_TTL_MS)
    );
    try {
      const base = await getBaseUrl();
      await sendPasswordResetEmail(
        user.email,
        `${base}/conta/redefinir?token=${token}`
      );
    } catch {
      // Falha de envio/config não deve revelar nada nem quebrar a tela.
    }
  }

  return { info: GENERIC_SENT };
}

export async function resetPasswordAction(
  _prev: Result,
  formData: FormData
): Promise<Result> {
  const token = formData.get("token")?.toString() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const confirm = formData.get("confirm")?.toString() ?? "";

  if (password.length < 8) {
    return { error: "A senha precisa de pelo menos 8 caracteres." };
  }
  if (password !== confirm) {
    return { error: "As senhas não conferem." };
  }
  if (!token) {
    return { error: "Link inválido. Peça um novo." };
  }

  const record = await findValidResetToken(sha256(token));
  if (!record) {
    return { error: "Link inválido ou expirado. Peça um novo." };
  }

  await updateUserPassword(record.userId, await hashPassword(password));
  await markResetTokenUsed(record.id);

  redirect("/conta/entrar?redefinida=1");
}
