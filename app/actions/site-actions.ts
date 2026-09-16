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
import {
  createGroup,
  removerFamiliaDaLista,
  atualizarFamilia,
} from "@/lib/repositories/groups";
import { tierAllowsSection } from "@/lib/templates/contract";
import type { PackageTier } from "@/lib/packages";

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

/* ── As famílias que confirmam presença ──────────────────────────────────────
 *
 * Cadastrar família era exclusividade do `/admin`: `createGroupAction` só
 * existia lá, presa ao site legado. O casal via a aba Convidados dizer "quando
 * vocês cadastrarem as famílias" e não tinha onde fazer isso — enquanto o site
 * dele já dizia aos convidados "cada família recebeu um link pessoal".
 *
 * Isso quebrava as regras §2.1 e §3: recurso que só funciona quando alguém
 * abre o /admin não está pronto, e montar site não é trabalho do dono. E
 * quebrava justamente no recurso que separa o pacote de R$ 9,90 do de
 * R$ 29,90.
 *
 * O que estas actions NÃO fazem, de propósito:
 *
 * - não regeram slug de grupo existente (§2.5: `/rsvp/<slug>` já está no
 *   WhatsApp das famílias e nunca pode deixar de responder);
 * - não escrevem em `guests.rsvp_status`. A resposta do RSVP mora em dois
 *   lugares desde a migração 0016, e o painel lê `groups.seats_confirmed`.
 *   Encostar no outro lado misturaria dois números que ninguém reconstrói
 *   (AGENTS.md §2).
 */

/** Teto de nomes por família. Convite de casamento não é lista de e-mail. */
const MAXIMO_DE_PESSOAS_POR_FAMILIA = 20;

export async function criarFamiliaAction(
  _prev: SiteActionResult,
  formData: FormData
): Promise<SiteActionResult> {
  const dono = await siteDoCasal(formData);
  if ("error" in dono) return { error: dono.error };
  const { site } = dono;

  /* Mesma guarda da aba. Sem ela, quem tem o pacote Convite chegaria aqui
     por POST direto e criaria grupo para um site que não mostra RSVP. */
  if (!tierAllowsSection(site.tier as PackageTier, "rsvp")) {
    return { error: "A confirmação de presença entra a partir do Site do Casamento." };
  }

  const label = formData.get("label")?.toString().trim() ?? "";
  const nomes = formData
    .getAll("nome")
    .map((v) => v.toString().trim())
    .filter(Boolean);

  if (!label && nomes.length === 0) {
    return { error: "Escrevam ao menos o nome da família." };
  }
  if (nomes.length > MAXIMO_DE_PESSOAS_POR_FAMILIA) {
    return {
      error: `São até ${MAXIMO_DE_PESSOAS_POR_FAMILIA} pessoas por família. Para grupos maiores, criem mais de uma.`,
    };
  }

  /* Família sem nomes individuais é caso legítimo — e comum: o casal quase
     sempre sabe "Família Silva, 4 lugares" antes de saber o nome completo de
     todo mundo. Nesse caso os lugares vêm do campo de número; com nomes
     escritos, eles vêm da lista (ver `createGroup`). */
  const lugares = Number(formData.get("lugares") ?? 1);

  await createGroup({
    siteId: site.id,
    label: label || undefined,
    guestNames: nomes,
    seats: Number.isFinite(lugares) ? Math.min(Math.max(1, lugares), MAXIMO_DE_PESSOAS_POR_FAMILIA) : 1,
  });

  revalidatePath("/conta/pedidos/[id]/convidados", "page");
  revalidatePath("/conta/pedidos/[id]/convites", "page");
  revalidatePath("/conta/pedidos/[id]", "page");

  return { saved: true, message: "Família cadastrada ✓" };
}

export async function apagarFamiliaAction(
  _prev: SiteActionResult,
  formData: FormData
): Promise<SiteActionResult> {
  const dono = await siteDoCasal(formData);
  if ("error" in dono) return { error: dono.error };
  const { site } = dono;

  const groupId = formData.get("groupId")?.toString() ?? "";
  if (!groupId) return { error: "Família não informada." };

  /* A remoção filtra por `siteId` — família de outro casamento não sai da
     lista por id adivinhado. */
  /* REMOVER não é apagar, e a diferença é de dado de terceiro.

     A resposta do convidado (`seats_confirmed`, `attending_names`, `message`)
     não está em backup nenhum: `groups_backup` guarda id, slug, label e
     created_at. Apagada, some para sempre — e o link que a família já tem no
     WhatsApp passaria a devolver 404. Marcando a saída, a família some da
     lista do casal, a resposta fica gravada e `/rsvp/<slug>` continua
     respondendo, avisando para procurar os noivos. Decisão do dono,
     15/09/2026. */
  const removida = await removerFamiliaDaLista(site.id, groupId);
  if (!removida) return { error: "Essa família já tinha saído da lista." };

  /* O link do convidado é cacheado por horas (`group:<slug>`). Sem isto, quem
     abrisse continuaria vendo o convite de pé depois de a família sair. */
  updateTag(`group:${removida.slug}`);

  revalidatePath("/conta/pedidos/[id]/convidados", "page");
  revalidatePath("/conta/pedidos/[id]/convites", "page");
  revalidatePath("/conta/pedidos/[id]", "page");

  return { saved: true, message: "Família removida ✓" };
}

/**
 * Edita a família: nome, lugares e quem foi convidado.
 *
 * O que ela NÃO mexe: o endereço `/rsvp/<slug>` (imutável — já está no
 * WhatsApp da família) e a resposta que o convidado deu. Reduzir os lugares
 * para menos do que já foi confirmado é permitido — os lugares são decisão do
 * casal —, e a resposta continua valendo como foi dada; a tela avisa antes.
 */
export async function editarFamiliaAction(
  _prev: SiteActionResult,
  formData: FormData
): Promise<SiteActionResult> {
  const dono = await siteDoCasal(formData);
  if ("error" in dono) return { error: dono.error };
  const { site } = dono;

  // Mesma guarda da criação: sem o pacote, nem por POST direto.
  if (!tierAllowsSection(site.tier as PackageTier, "rsvp")) {
    return { error: "A confirmação de presença entra a partir do Site do Casamento." };
  }

  const groupId = formData.get("groupId")?.toString() ?? "";
  if (!groupId) return { error: "Família não informada." };

  const label = formData.get("label")?.toString().trim() ?? "";

  /* Os pares vêm alinhados: `pessoaId[i]` é de quem `nome[i]` fala. Id vazio é
     pessoa nova. Nome apagado tira a pessoa da lista — e só ela. */
  const ids = formData.getAll("pessoaId").map((v) => v.toString());
  const pessoas = formData
    .getAll("nome")
    .map((v, i) => ({ id: ids[i] || undefined, nome: v.toString().trim() }))
    .filter((p) => p.nome.length > 0);

  if (!label && pessoas.length === 0) {
    return { error: "Escrevam ao menos o nome da família." };
  }
  if (pessoas.length > MAXIMO_DE_PESSOAS_POR_FAMILIA) {
    return {
      error: `São até ${MAXIMO_DE_PESSOAS_POR_FAMILIA} pessoas por família. Para grupos maiores, criem mais de uma.`,
    };
  }

  /* Mesma regra do cadastro: com nomes escritos, os lugares saem da lista;
     sem nomes, do campo de número. Duas fontes para o mesmo número é como um
     grupo passa a "ter 3 lugares" com dois nomes dentro. */
  const pedidos = Number(formData.get("lugares") ?? 1);
  const lugares =
    pessoas.length > 0
      ? pessoas.length
      : Number.isFinite(pedidos)
        ? Math.min(Math.max(1, pedidos), MAXIMO_DE_PESSOAS_POR_FAMILIA)
        : 1;

  const atualizada = await atualizarFamilia({
    siteId: site.id,
    groupId,
    label: label || undefined,
    seats: lugares,
    pessoas,
  });
  if (!atualizada) return { error: "Essa família não está mais na lista." };

  updateTag(`group:${atualizada.slug}`);

  revalidatePath("/conta/pedidos/[id]/convidados", "page");
  revalidatePath("/conta/pedidos/[id]/convites", "page");
  revalidatePath("/conta/pedidos/[id]", "page");

  return { saved: true, message: "Família atualizada ✓" };
}
