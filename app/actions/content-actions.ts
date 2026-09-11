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

/**
 * Os campos que a tela de conteúdo manda — e que ela precisa de volta quando o
 * salvamento é recusado.
 *
 * Espelha `ContentEditorValues`. Ficam aqui, e não importados do componente,
 * porque uma action do servidor não deve depender de um arquivo "use client".
 */
const CAMPOS_DA_TELA = [
  "coupleNames",
  "partnerA",
  "partnerB",
  "weddingDate",
  "weddingTime",
  "ceremonyVenue",
  "ceremonyAddress",
  "ceremonyMapUrl",
  "receptionVenue",
  "receptionAddress",
  "receptionTime",
  "story",
  "dressCode",
  "giftMessage",
  "pixKey",
  "pixRecipient",
  "pixCity",
  "pixInstitution",
] as const;

export type ContentActionResult =
  | {
      error: string;
      /**
       * O que o casal tinha digitado. Vai de volta para a tela porque, sem
       * isto, o React reinicia o formulário não-controlado com o último valor
       * SALVO — e o casal que errou um dígito da chave Pix perdia os onze
       * campos, história inteira inclusive (UX-004).
       */
      valores: Record<string, string>;
      /** Muda a cada recusa: é o que faz a tela remontar com os valores novos. */
      marca: number;
    }
  | { saved: true }
  | undefined;

function valoresDaTela(formData: FormData): Record<string, string> {
  const valores: Record<string, string> = {};
  for (const campo of CAMPOS_DA_TELA) {
    valores[campo] = formData.get(campo)?.toString() ?? "";
  }
  return valores;
}

/** Recusa que devolve o que o casal digitou. */
function recusar(formData: FormData, error: string): ContentActionResult {
  return { error, valores: valoresDaTela(formData), marca: Date.now() };
}

export async function saveSiteContentAction(
  _prev: ContentActionResult,
  formData: FormData
): Promise<ContentActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return recusar(formData, "Entrem na conta para editar.");

  const siteId = formData.get("siteId")?.toString() ?? "";
  if (!siteId) return recusar(formData, "Site não informado.");

  // Mesma mensagem para "não existe" e "não é seu": quem sonda ids alheios
  // não aprende nada com a resposta. Mesmo critério do photo-actions.
  const site = await getSiteOwnedByUser(siteId, userId);
  if (!site) return recusar(formData, "Site não encontrado.");

  if (site.status === "archived") {
    return recusar(
      formData,
      "Este site está arquivado. Fale com a gente para reabrir."
    );
  }

  // O fuso vive em site_content, não em sites — e é ele que decide o que
  // "16:00" significa em UTC. Sem ler antes, uma cerimônia às 16h de
  // Fortaleza seria gravada como 16h UTC, três horas adiantada.
  const atual = await getSiteContent(site.id);
  const parsed = parseContentForm(formData, atual?.timezone ?? undefined);
  if (!parsed.ok) return recusar(formData, parsed.error);

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
