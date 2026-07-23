"use server";

import { revalidatePath } from "next/cache";
import { verifySessionCookie } from "@/lib/auth/session";
import { isOrderStatus } from "@/lib/orderStatus";
import {
  updateOrderStatus,
  updateOrderAdminFields,
} from "@/lib/repositories/orders";

async function ensureAdmin() {
  const ok = await verifySessionCookie();
  if (!ok) throw new Error("Não autorizado");
}

// Converte "99,90" ou "99.90" (reais) em centavos. undefined = não mexer.
function parsePriceToCents(raw: string): number | null | undefined {
  const trimmed = raw.trim();
  if (trimmed === "") return null; // limpar = volta a usar o preço do pacote
  const normalized = trimmed.replace(/\./g, "").replace(",", ".");
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return undefined;
  return Math.round(value * 100);
}

/**
 * Admin salva tudo de um pedido de uma vez: status da esteira, link da prévia,
 * link do site final, valor e recado pro casal.
 */
export async function saveOrderAdminAction(formData: FormData) {
  await ensureAdmin();

  const orderId = formData.get("orderId")?.toString() ?? "";
  if (!orderId) return;

  const status = formData.get("status")?.toString() ?? "";
  if (isOrderStatus(status)) {
    await updateOrderStatus(orderId, status);
  }

  const previewUrl = formData.get("previewUrl")?.toString().trim() ?? "";
  const siteUrl = formData.get("siteUrl")?.toString().trim() ?? "";
  const adminMessage = formData.get("adminMessage")?.toString().trim() ?? "";
  const priceCents = parsePriceToCents(
    formData.get("priceReais")?.toString() ?? ""
  );

  await updateOrderAdminFields(orderId, {
    previewUrl: previewUrl || null,
    siteUrl: siteUrl || null,
    adminMessage: adminMessage || null,
    ...(priceCents === undefined ? {} : { priceCents }),
  });

  revalidatePath("/admin/pedidos");
  revalidatePath("/conta/pedidos");
}
