"use server";

import { revalidatePath, updateTag } from "next/cache";
import { getSessionUserId } from "@/lib/auth/userSession";
import { getSiteOwnedByUser } from "@/lib/repositories/sites";
import {
  setSectionEnabled,
  moveSection,
} from "@/lib/repositories/siteSections";
import { archiveSite, unarchiveSite } from "@/lib/site/visibility";
import { publishedSiteTags } from "@/lib/site/publish";

// Controle do site pelo casal — Fase 4 do SDD. Ligar/desligar seção e tirar
// o site do ar ou colocar de volta.

export type SiteActionResult =
  | { error: string }
  | { saved: true; message: string }
  | undefined;

/**
 * Derruba todo cache que serve este site. `publishedSiteTags` já devolve as
 * três de publicação — incluindo `published-site-slugs`, que alimenta o
 * `generateStaticParams` de `/s/[slug]` e é a mais fácil de esquecer.
 *
 * `updateTag` e não `revalidateTag`: é Server Action, e o casal precisa ver a
 * própria mudança na volta.
 */
function derrubarCache(slug: string, previewToken: string) {
  for (const tag of publishedSiteTags(slug)) updateTag(tag);
  updateTag(`site-preview:${previewToken}`);

  // E o PAINEL, que é outra história.
  //
  // As tags acima servem o site do CONVIDADO. A tela do casal lê
  // `listSiteSections` direto do banco, sem tag nenhuma — então ela mudava no
  // banco e continuava desenhada na ordem antiga até um recarregamento à mão.
  // Era o que fazia as setinhas parecerem não funcionar.
  //
  // O padrão dinâmico (`[id]`) invalida a tela de qualquer pedido: a action
  // conhece o site, não o pedido, e buscar um só para revalidar seria uma ida
  // ao banco por clique de seta.
  revalidatePath("/conta/pedidos/[id]/paginas", "page");
  revalidatePath("/conta/pedidos/[id]", "page");
}

type SiteDoCasal = NonNullable<Awaited<ReturnType<typeof getSiteOwnedByUser>>>;

// Tipo de retorno explícito: sem ele o TS infere `error?: string | undefined`
// nos dois ramos, e o estreitamento por `"error" in dono` deixa de valer.
async function siteDoCasal(
  formData: FormData
): Promise<{ error: string } | { site: SiteDoCasal }> {
  const userId = await getSessionUserId();
  if (!userId) return { error: "Entrem na conta para continuar." };

  const siteId = formData.get("siteId")?.toString() ?? "";
  if (!siteId) return { error: "Site não informado." };

  // Mesma mensagem para "não existe" e "não é seu" — quem sonda ids alheios
  // não aprende nada com a resposta.
  const site = await getSiteOwnedByUser(siteId, userId);
  if (!site) return { error: "Site não encontrado." };

  return { site };
}

export async function toggleSectionAction(
  _prev: SiteActionResult,
  formData: FormData
): Promise<SiteActionResult> {
  const dono = await siteDoCasal(formData);
  if ("error" in dono) return { error: dono.error };
  const { site } = dono;

  if (site.status === "archived") {
    return { error: "Coloquem o site no ar antes de mudar as seções." };
  }

  const sectionKey = formData.get("sectionKey")?.toString() ?? "";
  // O checkbox só chega no FormData quando está marcado — ausência é "desligar".
  const enabled = formData.get("enabled") === "on";

  const mudou = await setSectionEnabled(site.id, sectionKey, enabled);
  if (!mudou) {
    return { error: "Essa seção não pode ser alterada neste pacote." };
  }

  derrubarCache(site.slug, site.previewToken);
  return {
    saved: true,
    message: enabled ? "Seção ligada ✓" : "Seção desligada ✓",
  };
}

export async function moveSectionAction(
  _prev: SiteActionResult,
  formData: FormData
): Promise<SiteActionResult> {
  const dono = await siteDoCasal(formData);
  if ("error" in dono) return { error: dono.error };
  const { site } = dono;

  if (site.status === "archived") {
    return { error: "Coloquem o site no ar antes de mudar as seções." };
  }

  const sectionKey = formData.get("sectionKey")?.toString() ?? "";
  const direcao = formData.get("direcao")?.toString();
  if (direcao !== "up" && direcao !== "down") {
    return { error: "Direção inválida." };
  }

  const mudou = await moveSection(site.id, sectionKey, direcao);
  if (!mudou) return { error: "Essa seção não pode ser movida." };

  derrubarCache(site.slug, site.previewToken);
  return { saved: true, message: "Ordem atualizada ✓" };
}

export async function setSiteVisibilityAction(
  _prev: SiteActionResult,
  formData: FormData
): Promise<SiteActionResult> {
  const dono = await siteDoCasal(formData);
  if ("error" in dono) return { error: dono.error };
  const { site } = dono;

  const intent = formData.get("intent")?.toString();
  const resultado =
    intent === "despublicar"
      ? await archiveSite(site)
      : intent === "publicar"
        ? await unarchiveSite(site)
        : { ok: false as const, error: "Ação desconhecida." };

  if (!resultado.ok) return { error: resultado.error };

  derrubarCache(site.slug, site.previewToken);
  return {
    saved: true,
    message:
      resultado.status === "archived"
        ? "Site fora do ar. O endereço para de responder, mas nada foi apagado."
        : "Site no ar de novo ✓",
  };
}
