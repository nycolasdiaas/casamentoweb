"use server";

import { updateTag } from "next/cache";
import { getSessionUserId } from "@/lib/auth/userSession";
import { getSiteOwnedByUser } from "@/lib/repositories/sites";
import { getSiteContent, saveSiteContent } from "@/lib/repositories/siteContent";
import { parseContentForm } from "@/lib/site/contentInput";
import { sitePixTag } from "@/lib/pix/resolve";

// Edição do conteúdo do site pelo próprio casal — Fase 4 do SDD, objetivo 3
// ("o casal edita o próprio conteúdo e vê o resultado na hora").
//
// Antes disto o conteúdo só era escrito uma vez, pelo provisionamento, a
// partir do briefing do pedido. Corrigir um horário errado exigia pedir para
// a equipe mexer no banco.

export type ContentActionResult =
  | { error: string }
  | { saved: true }
  | undefined;

export async function saveSiteContentAction(
  _prev: ContentActionResult,
  formData: FormData
): Promise<ContentActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return { error: "Entrem na conta para editar." };

  const siteId = formData.get("siteId")?.toString() ?? "";
  if (!siteId) return { error: "Site não informado." };

  // Mesma mensagem para "não existe" e "não é seu": quem sonda ids alheios
  // não aprende nada com a resposta. Mesmo critério do photo-actions.
  const site = await getSiteOwnedByUser(siteId, userId);
  if (!site) return { error: "Site não encontrado." };

  if (site.status === "archived") {
    return { error: "Este site está arquivado. Fale com a gente para reabrir." };
  }

  // O fuso vive em site_content, não em sites — e é ele que decide o que
  // "16:00" significa em UTC. Sem ler antes, uma cerimônia às 16h de
  // Fortaleza seria gravada como 16h UTC, três horas adiantada.
  const atual = await getSiteContent(site.id);
  const parsed = parseContentForm(formData, atual?.timezone ?? undefined);
  if (!parsed.ok) return { error: parsed.error };

  await saveSiteContent(site.id, parsed.value);

  // `updateTag`, não `revalidateTag`: read-your-own-writes. O casal salva e
  // precisa ver a própria mudança na volta, não a versão anterior servida
  // por stale-while-revalidate. Ver AGENTS.md.
  updateTag(`site-view:${site.slug}`);
  updateTag(`site-preview:${site.previewToken}`);
  updateTag(`site:${site.slug}`);
  // O Pix tem tag própria porque a seção de presentes o busca por siteId, sem
  // conhecer o slug. Esquecer esta linha deixaria a chave antiga no ar por
  // dias depois do casal trocá-la — dinheiro indo para a conta errada com o
  // painel dizendo que está tudo certo.
  updateTag(sitePixTag(site.id));

  return { saved: true };
}
