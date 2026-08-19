"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth/userSession";
import { getSiteOwnedByUser } from "@/lib/repositories/sites";
import { getSiteContent } from "@/lib/repositories/siteContent";
import { toEditorValues } from "@/lib/site/contentFields";
import { getBaseUrl } from "@/lib/baseUrl";
import { themePresetFor } from "@/lib/theme/presets";
import type { ThemeSpec } from "@/lib/theme/spec";
import {
  createInvite,
  deleteInvite,
  listInvites,
  saveInvite,
} from "@/lib/repositories/siteInvites";
import { conviteInicial } from "@/lib/site/inviteSeed";
import { MAX_CONVITES, parseInviteDoc } from "@/lib/site/inviteDoc";

/**
 * Ações do editor de convites.
 *
 * Toda ação repete a mesma primeira linha — sessão e posse do SITE — porque é
 * exatamente essa verificação que não pode faltar em nenhuma delas. Um id de
 * convite alheio, mandado à mão, precisa esbarrar aqui; o `siteId` também vai
 * no WHERE das consultas, então mesmo um engano aqui não alcançaria outro
 * casal.
 */
async function siteDoDono(siteId: string) {
  const userId = await getSessionUserId();
  if (!userId) return null;
  return getSiteOwnedByUser(siteId, userId);
}

export type InviteActionResult = { error: string } | { saved: true } | undefined;

export async function criarConviteAction(formData: FormData) {
  const siteId = String(formData.get("siteId") ?? "");
  const orderId = String(formData.get("orderId") ?? "");
  const site = await siteDoDono(siteId);
  if (!site) redirect("/conta/pedidos");

  const [conteudo, baseUrl, existentes] = await Promise.all([
    getSiteContent(siteId),
    getBaseUrl(),
    listInvites(siteId),
  ]);

  if (existentes.length >= MAX_CONVITES) {
    redirect(`/conta/pedidos/${orderId}/convites?erro=limite`);
  }

  const v = toEditorValues(conteudo ?? null);
  const data = v.weddingDate
    ? new Date(`${v.weddingDate}T12:00:00`).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  const tema =
    (site.theme as ThemeSpec | null) ?? themePresetFor(site.templateId);

  const doc = conviteInicial(
    {
      nomes: v.coupleNames.trim() || "Nosso casamento",
      data,
      hora: v.weddingTime || null,
      local: v.ceremonyVenue.trim() || null,
      endereco: `${baseUrl.replace(/^https?:\/\//, "")}/s/${site.slug}`,
    },
    tema.palette
  );

  const nome = `Convite ${existentes.length + 1}`;
  const r = await createInvite(siteId, nome, doc);
  if (!r.ok) redirect(`/conta/pedidos/${orderId}/convites?erro=limite`);

  revalidatePath(`/conta/pedidos/${orderId}/convites`);
  redirect(`/conta/convites/${r.id}`);
}

/**
 * Grava o desenho. Chamada pelo editor a cada mudança confirmada (soltar um
 * bloco, sair de um campo), não a cada pixel do arrasto.
 */
export async function salvarConviteAction(
  siteId: string,
  inviteId: string,
  orderId: string,
  docBruto: unknown,
  nome?: string
): Promise<InviteActionResult> {
  const site = await siteDoDono(siteId);
  if (!site) return { error: "Não foi possível salvar." };

  // O documento vem do navegador: valida ANTES de gravar, senão o jsonb
  // guarda o que mandarem e o erro só aparece no render de outra pessoa.
  const doc = parseInviteDoc(docBruto);

  const ok = await saveInvite(siteId, inviteId, { doc, name: nome });
  if (!ok) return { error: "Convite não encontrado." };

  revalidatePath(`/conta/convites/${inviteId}`);
  revalidatePath(`/conta/pedidos/${orderId}/convites`);
  return { saved: true };
}

export async function apagarConviteAction(formData: FormData) {
  const siteId = String(formData.get("siteId") ?? "");
  const inviteId = String(formData.get("inviteId") ?? "");
  const orderId = String(formData.get("orderId") ?? "");

  const site = await siteDoDono(siteId);
  if (!site) redirect("/conta/pedidos");

  await deleteInvite(siteId, inviteId);
  revalidatePath(`/conta/pedidos/${orderId}/convites`);
  redirect(`/conta/pedidos/${orderId}/convites`);
}
