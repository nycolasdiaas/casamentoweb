// Links de prévia e de produção derivados do próprio pedido, para o admin não
// ter que digitar URL na mão (era o principal preenchimento manual da tela).
//
// Env opcionais (com padrões razoáveis):
//   PREVIEW_URL_BASE  — onde as prévias ficam, ex: https://previa.enlace.com.br
//   SITE_URL_BASE     — onde os sites finais ficam, ex: https://enlace.com.br
//
// O admin ainda pode sobrescrever qualquer um dos dois; o que muda é que o
// campo já chega preenchido com o valor certo.

const PREVIEW_BASE = (
  process.env.PREVIEW_URL_BASE ?? "https://previa.enlace.com.br"
).replace(/\/$/, "");

const SITE_BASE = (
  process.env.SITE_URL_BASE ?? "https://enlace.com.br"
).replace(/\/$/, "");

/**
 * Identificador estável e curto do site do casal: nome tratado + sufixo do id
 * do pedido, para dois "Ana & Pedro" nunca colidirem.
 */
export function orderSlug(order: {
  id: string;
  coupleNames: string | null;
}): string {
  const base = (order.coupleNames ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // tira acento
    .toLowerCase()
    .replace(/&/g, "e")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  const suffix = order.id.replace(/-/g, "").slice(0, 6);
  return base ? `${base}-${suffix}` : `site-${suffix}`;
}

export function suggestedPreviewUrl(order: {
  id: string;
  coupleNames: string | null;
}): string {
  return `${PREVIEW_BASE}/${orderSlug(order)}`;
}

export function suggestedSiteUrl(order: {
  id: string;
  coupleNames: string | null;
}): string {
  return `${SITE_BASE}/${orderSlug(order)}`;
}
