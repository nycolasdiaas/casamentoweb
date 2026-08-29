"use server";

import { revalidatePath, updateTag } from "next/cache";
import { getSessionAdminId } from "@/lib/auth/session";
import { getAdminById } from "@/lib/repositories/admins";
import { isOrderStatus, STATUS_META } from "@/lib/orderStatus";
import { publishSiteForOrder, publishedSiteTags } from "@/lib/site/publish";
import { getBaseUrl } from "@/lib/baseUrl";
import {
  getOrderById,
  updateOrderStatus,
  updateOrderAdminFields,
} from "@/lib/repositories/orders";
import { logOrderChanges, type AuditChange } from "@/lib/repositories/orderAudit";
import { criarRecado, marcarEmailEnviado } from "@/lib/repositories/adminNotices";
import { sendRecadoDoTimeEmail } from "@/lib/email";

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
  // Publicar de verdade acontece só depois de gravar os campos abaixo —
  // senão updateOrderAdminFields sobrescreveria o siteUrl recém-preenchido
  // com o valor (possivelmente vazio) do formulário.
  const deveOPublicar = isOrderStatus(status) && status === "published";

  /* CAMPO AUSENTE NÃO É CAMPO VAZIO.

     Antes esta função lia `formData.get(...) ?? ""` para os três campos de
     texto e gravava o resultado sempre. Funcionava porque o formulário
     mandava os três — e passou a ser uma armadilha no instante em que a tela
     parou de mandar: `get` devolve `null` para campo que não existe, `?? ""`
     vira string vazia, e a gravação APAGA o link da prévia de um pedido que
     ninguém quis editar.

     Com `has`, o formulário decide o que edita. O que ele não manda fica como
     está — que é o que "não editei isso" tem que significar. */
  const mexeuNaPrevia = formData.has("previewUrl");
  const mexeuNoSite = formData.has("siteUrl");
  const mexeuNoRecado = formData.has("adminMessage");

  const previewUrl = mexeuNaPrevia
    ? sanitizeUrl(formData.get("previewUrl")?.toString() ?? "")
    : existing.previewUrl;
  const siteUrl = mexeuNoSite
    ? sanitizeUrl(formData.get("siteUrl")?.toString() ?? "")
    : existing.siteUrl;
  const adminMessage = mexeuNoRecado
    ? formData.get("adminMessage")?.toString().trim() || null
    : existing.adminMessage;
  const priceCents = parsePriceToCents(
    formData.get("priceReais")?.toString() ?? ""
  );

  if (mexeuNaPrevia && previewUrl !== existing.previewUrl) {
    changes.push({
      field: "Link da prévia",
      oldValue: existing.previewUrl,
      newValue: previewUrl,
    });
  }
  if (mexeuNoSite && siteUrl !== existing.siteUrl) {
    changes.push({
      field: "Link do site",
      oldValue: existing.siteUrl,
      newValue: siteUrl,
    });
  }
  if (mexeuNoRecado && adminMessage !== existing.adminMessage) {
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

  // Marcar o pedido como "site no ar" tem que colocar o site no ar. Sem isto,
  // o admin via o pedido publicado, o casal via "no ar" — e /s/<slug>
  // devolvia 404, porque o site continuava em `preview`.
  //
  // requirePaid: false — admin publicando à mão já decidiu (cortesia, acerto
  // por fora). Quem exige pagamento confirmado é o caminho do pagamento.
  if (deveOPublicar) {
    let base: string | null = null;
    try {
      base = await getBaseUrl();
    } catch {
      console.error("[publicar] getBaseUrl falhou — siteUrl fica como está");
    }

    const publicado = await publishSiteForOrder(orderId, {
      baseUrl: base,
      requirePaid: false,
    });
    if (publicado.ok) {
      for (const tag of publishedSiteTags(publicado.slug)) updateTag(tag);
    } else {
      console.error(`[publicar] pedido ${orderId}: ${publicado.reason}`);
    }
  }

  revalidatePath("/admin/pedidos");
  revalidatePath("/conta/pedidos");
}

/**
 * Manda um recado do time para o casal — migração 0022.
 *
 * ── O e-mail não pode derrubar o recado ────────────────────────────────────
 *
 * O recado é gravado PRIMEIRO e o e-mail sai depois, fora da transação. Se o
 * provedor estiver fora do ar, o casal ainda tem o recado no painel e o
 * `email_sent_at` fica `null` dizendo a verdade — o contrário (mandar o
 * e-mail e falhar ao gravar) avisaria sobre um recado que não existe, que é o
 * único dos dois erros que não tem conserto.
 *
 * Por isso o `catch` engole a falha de envio em vez de propagá-la: a ação já
 * cumpriu o que prometeu quando a linha entrou.
 */
export type EstadoDoRecado = { error?: string; ok?: true } | undefined;

export async function enviarRecadoAction(
  _anterior: EstadoDoRecado,
  formData: FormData
): Promise<EstadoDoRecado> {
  const admin = await ensureAdmin();

  const orderId = formData.get("orderId")?.toString() ?? "";
  const titulo = formData.get("titulo")?.toString().trim() ?? "";
  const corpo = formData.get("corpo")?.toString().trim() ?? "";

  if (!orderId) return { error: "Pedido não informado." };
  if (!titulo) return { error: "Escreva um título para o recado." };
  if (!corpo) return { error: "Escreva o recado." };

  const order = await getOrderById(orderId);
  if (!order) return { error: "Pedido não encontrado." };

  const recado = await criarRecado({
    orderId,
    adminId: admin.id,
    adminName: admin.name ?? admin.email,
    title: titulo,
    body: corpo,
  });

  /* O aviso por e-mail. Melhor esforço, e o motivo está no cabeçalho acima. */
  const destino = order.user?.email;
  if (destino) {
    try {
      const base = await getBaseUrl();
      await sendRecadoDoTimeEmail(destino, {
        nomes: order.coupleNames?.trim() || "vocês",
        titulo,
        painelUrl: `${base}/conta/pedidos/${orderId}`,
      });
      await marcarEmailEnviado(recado.id);
    } catch {
      /* `email_sent_at` fica null — é o registro honesto de que não saiu. */
    }
  }

  revalidatePath("/admin/pedidos");
  revalidatePath(`/conta/pedidos/${orderId}`);

  return { ok: true as const };
}
