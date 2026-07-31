"use server";

import { updateTag } from "next/cache";
import { getSessionUserId } from "@/lib/auth/userSession";
import { getSiteOwnedByUser } from "@/lib/repositories/sites";
import { saveSiteTheme, moveSitePhoto } from "@/lib/repositories/siteTheme";
import { parseThemeForm } from "@/lib/site/themeInput";
import { publishedSiteTags } from "@/lib/site/publish";
import { getTemplate } from "@/lib/templates/registry";
import type { TemplateStyleId } from "@/lib/templates";

// Cores, fontes e ordem das fotos, editáveis pelo casal depois da prévia.

export type ThemeActionResult =
  | { error: string }
  | { saved: true; message: string }
  | undefined;

function derrubarCache(site: {
  id: string;
  slug: string;
  previewToken: string;
}) {
  for (const tag of publishedSiteTags(site.slug)) updateTag(tag);
  updateTag(`site-preview:${site.previewToken}`);
  // Esta é por ID, não por slug — é assim que sitePhotos.ts a declara.
  updateTag(`site-photos:${site.id}`);
}

type Site = NonNullable<Awaited<ReturnType<typeof getSiteOwnedByUser>>>;

async function siteDoCasal(
  formData: FormData
): Promise<{ error: string } | { site: Site }> {
  const userId = await getSessionUserId();
  if (!userId) return { error: "Entrem na conta para continuar." };

  const siteId = formData.get("siteId")?.toString() ?? "";
  if (!siteId) return { error: "Site não informado." };

  const site = await getSiteOwnedByUser(siteId, userId);
  if (!site) return { error: "Site não encontrado." };
  if (site.status === "archived") {
    return { error: "Coloquem o site no ar antes de editar." };
  }

  return { site };
}

export async function saveThemeAction(
  _prev: ThemeActionResult,
  formData: FormData
): Promise<ThemeActionResult> {
  const dono = await siteDoCasal(formData);
  if ("error" in dono) return { error: dono.error };
  const { site } = dono;

  // O catálogo de fontes é do MOLDE, não global: cada molde declara só as
  // fontes que combinam com o desenho dele (§4.3 do SDD). Uma Amatic SC no
  // Clássico não é liberdade, é molde quebrado.
  const template = getTemplate(site.templateId as TemplateStyleId);
  if (!template) {
    return { error: "Este modelo ainda não está disponível para edição." };
  }

  const parsed = parseThemeForm(formData, new Set(Object.keys(template.fonts)));
  if (!parsed.ok) return { error: parsed.error };

  await saveSiteTheme(site.id, parsed.value);
  derrubarCache(site);

  return { saved: true, message: "Estilo salvo ✓ o site já está com as cores novas." };
}

export async function movePhotoAction(
  _prev: ThemeActionResult,
  formData: FormData
): Promise<ThemeActionResult> {
  const dono = await siteDoCasal(formData);
  if ("error" in dono) return { error: dono.error };
  const { site } = dono;

  const photoId = formData.get("photoId")?.toString() ?? "";
  const direcao = formData.get("direcao")?.toString();
  if (direcao !== "up" && direcao !== "down") {
    return { error: "Direção inválida." };
  }

  const mudou = await moveSitePhoto(site.id, photoId, direcao);
  if (!mudou) return { error: "Não foi possível mover essa foto." };

  derrubarCache(site);
  return { saved: true, message: "Ordem das fotos atualizada ✓" };
}
