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
import {
  createOrder,
  updateOrder,
  submitOrderById,
  deleteOrder,
  getOrderById,
} from "@/lib/repositories/orders";
import { canCancelOrder } from "@/lib/orderStatus";
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
  // Template é opcional: vazio = casal monta do zero com cores/fonte próprias
  if (
    templateStyle !== "" &&
    !TEMPLATE_STYLES.some((style) => style.id === templateStyle)
  ) {
    return { error: "Estilo de template inválido." as const };
  }

  const primaryColor = formData.get("primaryColor")?.toString().trim() ?? "";
  const secondaryColor =
    formData.get("secondaryColor")?.toString().trim() ?? "";
  const fontStyle = formData.get("fontStyle")?.toString() ?? "";

  return {
    input: {
      packageTier: packageTier as PackageTier,
      templateStyle: templateStyle || null,
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

// Retorna o pedido se ele existe E pertence ao casal logado; senão null.
async function getOwnedOrder(userId: string, orderId: string) {
  if (!orderId) return null;
  const order = await getOrderById(orderId);
  if (!order || order.userId !== userId) return null;
  return order;
}

export async function saveOrderAction(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/conta/entrar");

  const parsed = parseOrderForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const orderId = formData.get("orderId")?.toString() ?? "";
  const existing = await getOwnedOrder(userId, orderId);

  if (existing) {
    if (existing.status !== "draft") {
      return { error: "Este pedido já foi enviado e não pode ser editado." };
    }
    await updateOrder(existing.id, parsed.input);
    revalidatePath(`/conta/pedido/${existing.id}`);
    return { saved: true };
  }

  // Primeiro salvamento de um pedido novo: cria e leva para a tela de edição
  // (que já tem o id) para os próximos salvamentos atualizarem o mesmo.
  const created = await createOrder(userId, parsed.input);
  revalidatePath("/conta/pedidos");
  redirect(`/conta/pedido/${created.id}`);
}

export async function submitOrderAction(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/conta/entrar");

  const parsed = parseOrderForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const orderId = formData.get("orderId")?.toString() ?? "";
  const existing = await getOwnedOrder(userId, orderId);

  if (existing) {
    if (existing.status !== "draft") {
      return { error: "Este pedido já foi enviado." };
    }
    await updateOrder(existing.id, parsed.input);
    await submitOrderById(existing.id);
  } else {
    const created = await createOrder(userId, parsed.input);
    await submitOrderById(created.id);
  }

  // Volta para o início (hub), que lista os pedidos com o andamento.
  revalidatePath("/conta");
  revalidatePath("/conta/pedidos");
  redirect("/conta");
}

export async function cancelOrderAction(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/conta/entrar");

  const orderId = formData.get("orderId")?.toString() ?? "";
  const order = await getOwnedOrder(userId, orderId);
  // Só cancela o que é do casal e ainda não entrou em produção.
  if (order && canCancelOrder(order.status)) {
    await deleteOrder(order.id);
  }

  revalidatePath("/conta");
  revalidatePath("/conta/pedidos");
  redirect("/conta/pedidos");
}
