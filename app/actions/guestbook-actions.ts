"use server";

import { updateTag } from "next/cache";
import {
  criarRecado,
  esconderRecado,
  muralTag,
} from "@/lib/repositories/guestbook";
import { LIMITE_NOME, LIMITE_RECADO } from "@/lib/site/muralLimites";
import { getSiteBySlug, getSiteByOrderId } from "@/lib/repositories/sites";
import { getOrderById } from "@/lib/repositories/orders";
import { getSessionUserId } from "@/lib/auth/userSession";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

/**
 * O recado do convidado — a única escrita pública do produto além do RSVP.
 *
 * `slug` (e não `siteId`) é o que vem do formulário: o convidado conhece o
 * endereço do casamento, não o identificador interno do tenant. Passar
 * `siteId` cru daria a qualquer pessoa a chance de escrever no mural de outro
 * casal trocando um campo escondido.
 */
export async function enviarRecadoAction(
  slug: string,
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  const ip = await getClientIp();
  // Mais folgado que o RSVP (20): o mural é o lugar onde a família inteira
  // escreve da mesma casa, atrás do mesmo IP. Apertado demais, a tia não
  // consegue mandar o recado dela depois do sobrinho.
  const { allowed } = await checkRateLimit(`mural:${ip}`, 30);
  if (!allowed) {
    return {
      error:
        "Chegaram muitos recados desse aparelho agora há pouco. Espere alguns minutos e mande de novo.",
    };
  }

  const site = await getSiteBySlug(slug);
  /* Recado só entra em site NO AR. Numa prévia o mural existe para o casal
     ver o desenho, e um recado gravado ali apareceria do nada no dia da
     publicação, sem que ninguém tivesse sido convidado ainda. */
  if (!site || site.status !== "published") {
    return { error: "Não achamos esse casamento." };
  }
  const siteId = site.id;

  const guestName = String(formData.get("guestName") ?? "");
  const message = String(formData.get("message") ?? "");

  if (!guestName.trim()) {
    return { error: "Falta o seu nome — é como o casal vai saber quem é." };
  }
  if (!message.trim()) {
    return { error: "O recado ficou vazio. Escreva alguma coisa carinhosa." };
  }
  if (message.length > LIMITE_RECADO) {
    return {
      error: `O recado passou de ${LIMITE_RECADO} caracteres. Encurte um pouquinho.`,
    };
  }
  if (guestName.length > LIMITE_NOME) {
    return { error: "Esse nome é comprido demais — use o primeiro e o último." };
  }

  const criado = await criarRecado(siteId, { guestName, message });
  if (!criado) return { error: "Não conseguimos salvar agora. Tente de novo." };

  // `updateTag` e não `revalidateTag`: quem acabou de escrever precisa ver o
  // próprio recado na tela, não uma versão velha do mural.
  updateTag(muralTag(siteId));
  return { ok: true };
}

/**
 * O casal esconde (ou traz de volta) um recado.
 *
 * A dona do pedido é conferida aqui à mão em vez de por
 * `carregarGerenciamento`: aquela função REDIRECIONA quando o pedido não é de
 * quem está logado, e redirect dentro de uma action que devolve JSON vira
 * exceção no meio do caminho. Aqui a mesma checagem devolve erro.
 */
export async function esconderRecadoAction(
  orderId: string,
  recadoId: string,
  hidden: boolean
): Promise<{ ok: true } | { error: string }> {
  const userId = await getSessionUserId();
  if (!userId) return { error: "Sessão expirada. Entre de novo." };

  const order = await getOrderById(orderId);
  // Mesma resposta para "não existe" e "não é seu" — quem sonda id alheio não
  // aprende nada com a diferença.
  if (!order || order.userId !== userId) {
    return { error: "Não achamos esse pedido." };
  }

  const site = await getSiteByOrderId(order.id);
  if (!site) return { error: "Este pedido ainda não tem site." };

  const mudou = await esconderRecado(site.id, recadoId, hidden);
  if (!mudou) return { error: "Não achamos esse recado." };

  updateTag(muralTag(site.id));
  return { ok: true };
}
