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
): Promise<
  | { ok: true; privado: boolean }
  | { error: string; valores?: Record<string, string>; marca?: number }
> {
  /* O que o convidado digitou volta com a recusa.
     Sem isto o React reinicia o formulário quando a action termina, e o
     recado escrito some junto com a mensagem de erro — o convidado precisa
     escrever tudo de novo para descobrir que o problema não era ele (UX-012). */
  const digitado = () => ({
    guestName: formData.get("guestName")?.toString() ?? "",
    message: formData.get("message")?.toString() ?? "",
  });
  const recusar = (error: string) => ({
    error,
    valores: digitado(),
    marca: Date.now(),
  });
  const ip = await getClientIp();
  // Mais folgado que o RSVP (20): o mural é o lugar onde a família inteira
  // escreve da mesma casa, atrás do mesmo IP. Apertado demais, a tia não
  // consegue mandar o recado dela depois do sobrinho.
  const { allowed } = await checkRateLimit(`mural:${ip}`, 30);
  if (!allowed) {
    return recusar(
      "Chegaram muitos recados desse aparelho agora há pouco. Espere alguns minutos e mande de novo."
    );
  }

  const site = await getSiteBySlug(slug);

  /* Duas recusas diferentes, duas mensagens diferentes.
     
     A regra não mudou: recado só entra em site NO AR — numa prévia o mural
     existe para o casal ver o desenho, e um recado gravado ali apareceria do
     nada no dia da publicação, sem que ninguém tivesse sido convidado ainda.
     
     O que mudou é o texto. As duas situações dividiam a frase "Não achamos
     esse casamento", e o casal que abria a própria prévia para testar o mural
     lia que o casamento dele não existe — olhando para ele na tela (UX-012). */
  if (!site) {
    return recusar("Não achamos esse casamento.");
  }
  if (site.status !== "published") {
    return recusar(
      "O mural começa a valer quando o site estiver no ar. Aí os recados ficam guardados."
    );
  }
  const siteId = site.id;

  const guestName = String(formData.get("guestName") ?? "");
  const message = String(formData.get("message") ?? "");

  if (!guestName.trim()) {
    return recusar("Falta o seu nome — é como o casal vai saber quem é.");
  }
  if (!message.trim()) {
    return recusar("O recado ficou vazio. Escreva alguma coisa carinhosa.");
  }
  if (message.length > LIMITE_RECADO) {
    return recusar(
      `O recado passou de ${LIMITE_RECADO} caracteres. Encurte um pouquinho.`
    );
  }
  if (guestName.length > LIMITE_NOME) {
    return recusar("Esse nome é comprido demais — use o primeiro e o último.");
  }

  /* PARA ONDE O RECADO VAI — e isso depende do pacote.

     O mural é do Para Sempre. O botão "Recado para os noivos" existe também
     no Site do Casamento (decisão do dono, 15/09/2026), e ali o recado é
     privado: não entra no mural, e o casal lê no painel. A tela avisa isso
     ANTES de a pessoa escrever — recado que o convidado acha público e não é
     seria uma promessa quebrada com terceiro.

     A decisão é do servidor, não do formulário: um campo escondido dizendo
     "sou público" viraria a porta para escrever no mural de quem não comprou
     mural. */
  const privado = site.tier !== "para-sempre";

  const criado = await criarRecado(siteId, { guestName, message, privado });
  if (!criado) return recusar("Não conseguimos salvar agora. Tente de novo.");

  // `updateTag` e não `revalidateTag`: quem acabou de escrever precisa ver o
  // próprio recado na tela, não uma versão velha do mural. Recado privado não
  // muda o mural — não há cache a derrubar.
  if (!privado) updateTag(muralTag(siteId));
  return { ok: true, privado };
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
