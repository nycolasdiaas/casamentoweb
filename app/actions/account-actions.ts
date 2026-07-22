"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  createUserSessionCookie,
  clearUserSessionCookie,
  getSessionUserId,
} from "@/lib/auth/userSession";
import { createUser, getUserByEmail } from "@/lib/repositories/users";
import { upsertOrder, submitOrder } from "@/lib/repositories/orders";
import { PACKAGES, type PackageTier } from "@/lib/packages";
import { TEMPLATE_STYLES } from "@/lib/templates";
import { isFontStyle, isHexColor } from "@/lib/customization";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signupAction(formData: FormData) {
  const name = formData.get("name")?.toString().trim() ?? "";
  const email = formData.get("email")?.toString().trim().toLowerCase() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const whatsapp = formData.get("whatsapp")?.toString().trim() ?? "";

  if (name.length < 2) return { error: "Conta o nome de vocês pra gente 😊" };
  if (!EMAIL_PATTERN.test(email)) return { error: "E-mail inválido." };
  if (password.length < 6) {
    return { error: "A senha precisa de pelo menos 6 caracteres." };
  }

  const existing = await getUserByEmail(email);
  if (existing) {
    return { error: "Já existe uma conta com esse e-mail. Tente entrar." };
  }

  const user = await createUser({
    name,
    email,
    passwordHash: hashPassword(password),
    whatsapp: whatsapp || undefined,
  });

  await createUserSessionCookie(user.id);
  redirect("/conta");
}

export async function signinAction(formData: FormData) {
  const email = formData.get("email")?.toString().trim().toLowerCase() ?? "";
  const password = formData.get("password")?.toString() ?? "";

  const user = email ? await getUserByEmail(email) : null;
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "E-mail ou senha incorretos." };
  }

  await createUserSessionCookie(user.id);
  redirect("/conta");
}

export async function signoutAction() {
  await clearUserSessionCookie();
  redirect("/");
}

function parseOrderForm(formData: FormData) {
  const packageTier = formData.get("packageTier")?.toString() ?? "";
  const templateStyle = formData.get("templateStyle")?.toString() ?? "";

  if (!PACKAGES.some((pkg) => pkg.tier === packageTier)) {
    return { error: "Escolha um pacote." as const };
  }
  if (!TEMPLATE_STYLES.some((style) => style.id === templateStyle)) {
    return { error: "Escolha um estilo de template." as const };
  }

  const primaryColor = formData.get("primaryColor")?.toString().trim() ?? "";
  const secondaryColor =
    formData.get("secondaryColor")?.toString().trim() ?? "";
  const fontStyle = formData.get("fontStyle")?.toString() ?? "";

  return {
    input: {
      packageTier: packageTier as PackageTier,
      templateStyle,
      primaryColor: isHexColor(primaryColor) ? primaryColor : undefined,
      secondaryColor: isHexColor(secondaryColor) ? secondaryColor : undefined,
      fontStyle: isFontStyle(fontStyle) ? fontStyle : undefined,
      styleNotes: formData.get("styleNotes")?.toString().trim() || undefined,
      coupleNames: formData.get("coupleNames")?.toString().trim() || undefined,
      weddingDate: formData.get("weddingDate")?.toString().trim() || undefined,
      photosLink: formData.get("photosLink")?.toString().trim() || undefined,
      notes: formData.get("notes")?.toString().trim() || undefined,
    },
  };
}

export async function saveOrderAction(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/conta/entrar");

  const parsed = parseOrderForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  await upsertOrder(userId, parsed.input);
  revalidatePath("/conta");
  return { saved: true };
}

export async function submitOrderAction(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/conta/entrar");

  const parsed = parseOrderForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  await upsertOrder(userId, parsed.input);
  await submitOrder(userId);
  revalidatePath("/conta");
  return { submitted: true };
}
