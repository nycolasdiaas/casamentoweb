"use server";

import { redirect } from "next/navigation";
import { createSessionCookie, clearSessionCookie } from "@/lib/auth/session";
import { clearUserSessionCookie } from "@/lib/auth/userSession";
import { verifyPassword } from "@/lib/auth/password";
import { getAdminByEmail } from "@/lib/repositories/admins";
import { checkRateLimit, getClientIp, RATE_LIMIT_MESSAGE } from "@/lib/rateLimit";

// Hash descartável para normalizar o tempo quando o e-mail não existe.
const DUMMY_HASH =
  "0000000000000000000000000000000000000000000000000000000000000000:" +
  "0000000000000000000000000000000000000000000000000000000000000000" +
  "0000000000000000000000000000000000000000000000000000000000000000";

export async function loginAction(formData: FormData) {
  const email = formData.get("email")?.toString().trim().toLowerCase() ?? "";
  const password = formData.get("password")?.toString() ?? "";

  const ip = await getClientIp();
  const [ipOk, emailOk] = await Promise.all([
    checkRateLimit(`admin:${ip}`),
    email ? checkRateLimit(`admin-email:${email}`) : Promise.resolve({ allowed: true }),
  ]);
  if (!ipOk.allowed || !emailOk.allowed) {
    return { error: RATE_LIMIT_MESSAGE };
  }

  const admin = email ? await getAdminByEmail(email) : null;
  if (!admin) {
    await verifyPassword(password, DUMMY_HASH); // gasta o mesmo tempo
    return { error: "E-mail ou senha incorretos." };
  }
  if (!(await verifyPassword(password, admin.passwordHash))) {
    return { error: "E-mail ou senha incorretos." };
  }

  // Espelho do que a tela do casal faz: um navegador fica em um papel só.
  await clearUserSessionCookie();
  await createSessionCookie(admin.id);
  redirect("/admin/pedidos");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/admin/login");
}
