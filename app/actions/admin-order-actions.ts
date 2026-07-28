"use server";

import { revalidatePath } from "next/cache";
import { getSessionAdminId } from "@/lib/auth/session";
import { getAdminById } from "@/lib/repositories/admins";
import { isOrderStatus, STATUS_META } from "@/lib/orderStatus";
import {
  getOrderById,
  updateOrderStatus,
  updateOrderAdminFields,
} from "@/lib/repositories/orders";
import { logOrderChanges, type AuditChange } from "@/lib/repositories/orderAudit";

async function ensureAdmin() {
  const adminId = await getSessionAdminId();
  if (!adminId) throw new Error("Não autorizado");
  const admin = await getAdminById(adminId);
  if (!admin) throw new Error("Não autorizado");
  return admin;
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

// Só aceita URLs http/https absolutas (bloqueia javascript:, data:, etc. —
// esses links são renderizados como href pro casal). Valor inválido vira null.
function sanitizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function centsLabel(cents: number | null): string | null {
  if (cents == null) return null;
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Admin salva tudo de um pedido de uma vez: status da esteira, link da prévia,
 * link do site final, valor e recado pro casal. Cada campo que mudou vira uma
 * linha no rastro de auditoria (quem mudou, de quê pra quê, quando).
 */
export async function saveOrderAdminAction(formData: FormData) {
  const admin = await ensureAdmin();

  const orderId = formData.get("orderId")?.toString() ?? "";
  if (!orderId) return;

  const existing = await getOrderById(orderId);
  if (!existing) return;

  const changes: AuditChange[] = [];

  const status = formData.get("status")?.toString() ?? "";
  if (isOrderStatus(status) && status !== existing.status) {
    changes.push({
      field: "Etapa do pedido",
      oldValue: STATUS_META[existing.status].adminLabel,
      newValue: STATUS_META[status].adminLabel,
    });
    await updateOrderStatus(orderId, status);
  }

  const previewUrl = sanitizeUrl(formData.get("previewUrl")?.toString() ?? "");
  const siteUrl = sanitizeUrl(formData.get("siteUrl")?.toString() ?? "");
  const adminMessage = formData.get("adminMessage")?.toString().trim() || null;
  const priceCents = parsePriceToCents(
    formData.get("priceReais")?.toString() ?? ""
  );

  if (previewUrl !== existing.previewUrl) {
    changes.push({
      field: "Link da prévia",
      oldValue: existing.previewUrl,
      newValue: previewUrl,
    });
  }
  if (siteUrl !== existing.siteUrl) {
    changes.push({
      field: "Link do site",
      oldValue: existing.siteUrl,
      newValue: siteUrl,
    });
  }
  if (adminMessage !== existing.adminMessage) {
    changes.push({
      field: "Recado ao casal",
      oldValue: existing.adminMessage,
      newValue: adminMessage,
    });
  }
  if (priceCents !== undefined && priceCents !== existing.priceCents) {
    changes.push({
      field: "Valor",
      oldValue: centsLabel(existing.priceCents),
      newValue: centsLabel(priceCents),
    });
  }

  await updateOrderAdminFields(orderId, {
    previewUrl,
    siteUrl,
    adminMessage,
    ...(priceCents === undefined ? {} : { priceCents }),
  });

  await logOrderChanges(orderId, admin.id, admin.name, changes);

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${orderId}`);
  revalidatePath("/conta");
  revalidatePath("/conta/pedidos");
  revalidatePath(`/conta/pedidos/${orderId}`);
}
