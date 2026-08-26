"use server";

import { revalidatePath, updateTag } from "next/cache";
import { getSessionUserId } from "@/lib/auth/userSession";
import {
  getSiteAccess,
  getSiteOwnedByUser,
  setSiteAccess,
} from "@/lib/repositories/sites";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { darCracha } from "@/lib/site/acessoDoSite";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
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

  /* PROTEGER / LIBERAR — a terceira opção da prancha E2.
     Vive na mesma action que publicar e despublicar porque, para o casal, é a
     mesma pergunta: "quem consegue abrir o site?". Duas actions para um
     controle de três posições seria duas telas de erro diferentes para o mesmo
     card. */
  if (intent === "proteger" || intent === "liberar") {
    if (intent === "liberar") {
      await setSiteAccess(site.id, "public");
      derrubarCache(site.slug, site.previewToken);
      return {
        saved: true,
        message: "Site liberado. Qualquer pessoa com o link entra.",
      };
    }

    const senha = formData.get("senha")?.toString() ?? "";
    const jaTemSenha = Boolean(
      (await getSiteAccess(site.slug))?.accessPasswordHash
    );

    // Sem senha nova e sem senha antiga não há proteção a ligar — e ligar o
    // modo assim deixaria o site pedindo uma senha que ninguém pode acertar.
    if (!senha && !jaTemSenha) {
      return { error: "Escolham uma senha de pelo menos 4 caracteres." };
    }
    if (senha && senha.trim().length < 4) {
      return { error: "Escolham uma senha de pelo menos 4 caracteres." };
    }

    await setSiteAccess(
      site.id,
      "password",
      senha ? await hashPassword(senha.trim()) : undefined
    );
    derrubarCache(site.slug, site.previewToken);
    return {
      saved: true,
      message: senha
        ? "Senha salva. Quem abrir o site precisa dela agora."
        : "Site protegido de novo, com a mesma senha.",
    };
  }

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

export type EntrarNoSiteResult = { erro: string } | undefined;

/**
 * H4 · o convidado digita a senha do site.
 *
 * ── Quem chega aqui ────────────────────────────────────────────────────────
 *
 * Não é o casal: é um convidado, com a senha escrita no convite de papel,
 * digitando num celular. Três consequências:
 *
 * 1. **A resposta não distingue "senha errada" de "site sem senha".** Uma
 *    mensagem diferente para cada caso diria a quem sonda quais endereços têm
 *    proteção ligada.
 * 2. **O erro volta como estado, nunca como exceção.** Errar a senha não pode
 *    recarregar a página nem trocar a tela por um erro do Next — a prancha H é
 *    literal: "errar a senha não recarrega a página; mostra erro embaixo do
 *    campo".
 * 3. **Limite por IP**, que a prancha também exige. Dez tentativas: uma senha
 *    de convite é curta de propósito, e sem limite ela cai em minutos.
 */
export async function entrarNoSiteAction(
  slug: string,
  _anterior: EntrarNoSiteResult,
  formData: FormData
): Promise<EntrarNoSiteResult> {
  const ip = await getClientIp();
  const { allowed } = await checkRateLimit(`site-senha:${ip}:${slug}`, 10);
  if (!allowed) {
    return {
      erro: "Muitas tentativas seguidas. Espere alguns minutos e tente de novo.",
    };
  }

  const acesso = await getSiteAccess(slug);
  const senha = formData.get("senha")?.toString() ?? "";

  if (
    !acesso ||
    acesso.accessMode !== "password" ||
    !acesso.accessPasswordHash ||
    !senha ||
    !(await verifyPassword(senha, acesso.accessPasswordHash))
  ) {
    return { erro: "Essa senha não confere. Confira o convite e tente de novo." };
  }

  await darCracha(acesso.id, acesso.accessPasswordHash);

  // Sem redirect: a página relê o crachá no próximo render e mostra o site.
  // Um redirect para a mesma rota funcionaria, mas perderia o estado do
  // formulário se algo falhasse no meio.
  revalidatePath(`/s/${slug}`);
  return undefined;
}
