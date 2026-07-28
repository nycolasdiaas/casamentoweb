"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { getSessionUserId } from "@/lib/auth/userSession";
import { getUserById } from "@/lib/repositories/users";
import {
  createVerificationToken,
  deleteUserVerificationTokens,
  findValidVerificationToken,
  markEmailVerified,
  markVerificationTokenUsed,
} from "@/lib/repositories/emailVerification";
import { isEmailConfigured, sendEmailVerification } from "@/lib/email";
import { getBaseUrl } from "@/lib/baseUrl";
import { checkRateLimit, getClientIp, RATE_LIMIT_MESSAGE } from "@/lib/rateLimit";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

/**
 * Gera o token e dispara o e-mail. Usada no cadastro e no "reenviar".
 * Nunca lança: falha de envio não pode derrubar a criação da conta — o casal
 * reenvia pelo painel.
 */
export async function sendVerificationEmailFor(user: {
  id: string;
  name: string;
  email: string;
}): Promise<boolean> {
  if (!isEmailConfigured()) return false;

  try {
    const token = crypto.randomBytes(32).toString("base64url");
    await deleteUserVerificationTokens(user.id);
    await createVerificationToken(
      user.id,
      sha256(token),
      new Date(Date.now() + TOKEN_TTL_MS)
    );
    const base = await getBaseUrl();
    await sendEmailVerification(
      user.email,
      user.name,
      `${base}/conta/confirmar?token=${token}`
    );
    return true;
  } catch {
    return false;
  }
}

type Result = { error?: string; info?: string } | undefined;

/** Botão "reenviar e-mail de confirmação" no painel do casal. */
export async function resendVerificationAction(): Promise<Result> {
  const userId = await getSessionUserId();
  if (!userId) return { error: "Entrem na conta primeiro." };

  const ip = await getClientIp();
  const { allowed } = await checkRateLimit(`verify:${ip}`);
  if (!allowed) return { error: RATE_LIMIT_MESSAGE };

  const user = await getUserById(userId);
  if (!user) return { error: "Conta não encontrada." };
  if (user.emailVerifiedAt) return { info: "Esse e-mail já está confirmado." };

  const sent = await sendVerificationEmailFor(user);
  if (!sent) {
    return {
      error:
        "Não conseguimos enviar agora. Tentem de novo em alguns minutos ou falem com a gente.",
    };
  }

  return {
    info: `Reenviamos o link para ${user.email}. Confiram a caixa de entrada e o spam.`,
  };
}

/** Consome o token do link do e-mail. */
export async function confirmEmailToken(
  token: string
): Promise<"ok" | "invalid"> {
  if (!token) return "invalid";

  const record = await findValidVerificationToken(sha256(token));
  if (!record) return "invalid";

  await markEmailVerified(record.userId);
  await markVerificationTokenUsed(record.id);

  revalidatePath("/conta");
  return "ok";
}
