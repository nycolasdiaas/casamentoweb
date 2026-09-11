"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth/userSession";
import { getSiteOwnedByUser } from "@/lib/repositories/sites";
import { getSiteContent } from "@/lib/repositories/siteContent";
import { toEditorValues } from "@/lib/site/contentFields";
import { baseUrlOuNulo } from "@/lib/baseUrl";
import { themePresetFor } from "@/lib/theme/presets";
import type { ThemeSpec } from "@/lib/theme/spec";
import {
  CONVITES_PUBLICADOS,
  conviteTag,
  createInvite,
  deleteInvite,
  despublicarConvite,
  getInvite,
  listInvites,
  publicarConvite,
  saveInvite,
} from "@/lib/repositories/siteInvites";
import { conviteInicial } from "@/lib/site/inviteSeed";
import { MAX_CONVITES, parseInviteDoc, temSaida } from "@/lib/site/inviteDoc";
import { tierAllowsSection } from "@/lib/templates/contract";
import { dataPorExtenso } from "@/lib/site/dataLegivel";

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

export type InviteActionResult =
  | { error: string }
  | { saved: true; updatedAt: number }
  /** Outra aba gravou depois. O editor para o autosave e pede recarga — o
      contrato é last-write-wins COM AVISO, nunca sobrescrever em silêncio. */
  | { conflito: true; updatedAt: number }
  | undefined;

export async function criarConviteAction(formData: FormData) {
  const siteId = String(formData.get("siteId") ?? "");
  const orderId = String(formData.get("orderId") ?? "");
  const site = await siteDoDono(siteId);
  if (!site) redirect("/conta/pedidos");

  /* `baseUrlOuNulo` e não `getBaseUrl`: o endereço entra no convite como
     rodapé, e um rodapé não pode impedir o convite de nascer. Em 11/09/2026
     impedia — `getBaseUrl()` lançava em produção e "Criar convite" devolvia
     uma tela de erro em inglês (UX-002). */
  const [conteudo, baseUrl, existentes] = await Promise.all([
    getSiteContent(siteId),
    baseUrlOuNulo(),
    listInvites(siteId),
  ]);

  if (existentes.length >= MAX_CONVITES) {
    redirect(`/conta/pedidos/${orderId}/convites?erro=limite`);
  }

  const v = toEditorValues(conteudo ?? null);
  const data = dataPorExtenso(v.weddingDate, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const tema =
    (site.theme as ThemeSpec | null) ?? themePresetFor(site.templateId);

  const doc = conviteInicial(
    {
      nomes: v.coupleNames.trim() || "Nosso casamento",
      data,
      hora: v.weddingTime || null,
      local: v.ceremonyVenue.trim() || null,
      endereco: baseUrl
        ? `${baseUrl.replace(/^https?:\/\//, "")}/s/${site.slug}`
        : `/s/${site.slug}`,
      url: baseUrl ? `${baseUrl.replace(/\/+$/, "")}/s/${site.slug}` : "",
      // O gating de verdade, o mesmo que o `SiteRenderer` obedece.
      temRsvp: tierAllowsSection(site.tier, "rsvp"),
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
  nome?: string,
  /**
   * O `updatedAt` que o navegador tinha quando começou a editar, em
   * milissegundos. Sem ele, a gravação segue como antes (é o caminho do botão
   * antigo e de qualquer chamada que não acompanha versão).
   */
  updatedAtCliente?: number
): Promise<InviteActionResult> {
  const site = await siteDoDono(siteId);
  if (!site) return { error: "Não foi possível salvar." };

  /* Guarda de conflito: duas abas abertas no mesmo convite.
     
     O contrato é last-write-wins COM AVISO, não merge. Sem isto, a aba que
     ficou aberta a manhã inteira sobrescreveria em silêncio o que foi salvo na
     outra — e o casal perderia trabalho sem ver nada acontecer.
     
     A margem de 1s existe porque `updatedAt` volta do banco com precisão de
     microssegundo e o JavaScript arredonda para milissegundo: sem ela, salvar
     duas vezes seguidas da MESMA aba acusaria conflito consigo mesma. */
  if (updatedAtCliente !== undefined) {
    const atual = await getInvite(siteId, inviteId);
    if (!atual) return { error: "Convite não encontrado." };
    if (atual.updatedAt.getTime() > updatedAtCliente + 1000) {
      return { conflito: true, updatedAt: atual.updatedAt.getTime() };
    }
  }

  // O documento vem do navegador: valida ANTES de gravar, senão o jsonb
  // guarda o que mandarem e o erro só aparece no render de outra pessoa.
  const doc = parseInviteDoc(docBruto);

  const gravado = await saveInvite(siteId, inviteId, { doc, name: nome });
  if (!gravado) return { error: "Convite não encontrado." };

  revalidatePath(`/conta/convites/${inviteId}`);
  revalidatePath(`/conta/pedidos/${orderId}/convites`);
  return { saved: true, updatedAt: gravado.getTime() };
}

export async function apagarConviteAction(formData: FormData) {
  const siteId = String(formData.get("siteId") ?? "");
  const inviteId = String(formData.get("inviteId") ?? "");
  const orderId = String(formData.get("orderId") ?? "");

  const site = await siteDoDono(siteId);
  if (!site) redirect("/conta/pedidos");

  await deleteInvite(siteId, inviteId);

  // Sem pedido (site órfão — ver `deleteOrder` no AGENTS.md) não existe
  // `/conta/pedidos//convites`: seria uma URL com barra dupla, que o Next
  // normaliza com um 308 e leva a lugar nenhum. A lista de pedidos é o
  // destino honesto nesse caso.
  const destino = orderId
    ? `/conta/pedidos/${orderId}/convites`
    : "/conta/pedidos";
  revalidatePath(destino);
  redirect(destino);
}

/**
 * Põe o convite no ar e devolve o endereço.
 *
 * Publicar é o gesto que o casal realmente quer: o produto é o LINK que ele
 * manda no WhatsApp, não o arquivo. Salvar já grava o desenho; publicar é o
 * que faz o convidado poder abrir.
 *
 * Republicar mantém o mesmo slug (ver `publicarConvite`), então o link que já
 * circulou continua valendo com o desenho novo.
 */
export async function publicarConviteAction(
  siteId: string,
  inviteId: string
): Promise<{ url: string } | { error: string }> {
  const site = await siteDoDono(siteId);
  if (!site) return { error: "Não foi possível publicar." };

  /* Convite sem saída não publica.
     
     A regra da prancha H: *"toda tela tem uma saída primária. Beco sem saída é
     bug."* Um convite publicado é uma página que o convidado abre e fecha sem
     ter para onde ir — e o casal só descobre quando alguém avisa.
     
     O que NÃO trava: nomes, data, local. As regras §2.3 são literais —
     *"só uma coisa é obrigatória: os nomes"*, e *"a lista 'o que falta' é
     guia, nunca trava"*. Convite sem data é legítimo: casal que ainda não
     fechou o dia.
     
     A guarda vale AQUI e não só na tela: `PublicarConvite` é client component,
     e a action é a fronteira que importa. */
  const atualParaValidar = await getInvite(siteId, inviteId);
  if (atualParaValidar && !temSaida(atualParaValidar.doc)) {
    return { error: "sem-saida" };
  }

  const [slug, baseUrl] = await Promise.all([
    publicarConvite(siteId, inviteId),
    baseUrlOuNulo(),
  ]);
  if (!slug) return { error: "Convite não encontrado." };

  // As duas tags: a do convite (o convidado vê a versão nova) e a da lista
  // (o `generateStaticParams` passa a conhecer o endereço). Sem elas o link
  // recém-publicado responderia 404 por dias — `cacheLife("days")`.
  // `updateTag`, não `revalidateTag`: read-your-own-writes. O casal clica em
  // publicar e abre o link na hora — com stale-while-revalidate ele veria o
  // 404 anterior. Mesma razão do §7.2 do SDD na publicação do site.
  updateTag(conviteTag(slug));
  updateTag(CONVITES_PUBLICADOS);
  revalidatePath(`/conta/convites/${inviteId}`);
  /* Publicar deu certo mesmo sem endereço descoberto — o convite existe e o
     link é o mesmo caminho. Devolver o caminho relativo é melhor que devolver
     um erro por causa do prefixo. */
  return { url: baseUrl ? `${baseUrl.replace(/\/+$/, "")}/c/${slug}` : `/c/${slug}` };
}

/** Tira do ar. O endereço fica guardado, para voltar no mesmo link. */
export async function despublicarConviteAction(
  siteId: string,
  inviteId: string
): Promise<{ ok: true } | { error: string }> {
  const site = await siteDoDono(siteId);
  if (!site) return { error: "Não foi possível tirar do ar." };

  const atual = await getInvite(siteId, inviteId);
  const ok = await despublicarConvite(siteId, inviteId);
  if (!ok) return { error: "Convite não encontrado." };

  if (atual?.slug) updateTag(conviteTag(atual.slug));
  updateTag(CONVITES_PUBLICADOS);
  revalidatePath(`/conta/convites/${inviteId}`);
  return { ok: true };
}
