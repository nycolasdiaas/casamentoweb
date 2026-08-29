"use server";

import { revalidatePath, updateTag } from "next/cache";
import {
  getGroupBySlug,
  getRsvpViewBySlug,
  responderRsvpDoGrupo,
} from "@/lib/repositories/groups";
import { updateGuestRsvp } from "@/lib/repositories/guests";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { prazoVencido } from "@/lib/site/prazoRsvp";
import type { rsvpStatusEnum } from "@/lib/db/schema";

type RsvpStatus = (typeof rsvpStatusEnum.enumValues)[number];

/** Teto dos campos livres. O convidado escreve num celular, não num editor. */
const MAX_NOMES = 300;
const MAX_RECADO = 500;

export type EstadoDoRsvp =
  | { ok: true; lugares: number }
  | { erro: string }
  | undefined;

/**
 * A resposta do GRUPO — o formulário da prancha F4.
 *
 * ── O que esta action não pode fazer ───────────────────────────────────────
 *
 * `/rsvp/<slug>` tem confirmação de gente real e links já distribuídos no
 * WhatsApp (regras §2.5). Então:
 *
 * - **Nunca lança para o convidado.** Toda falha vira `{ erro }` e a tela
 *   continua de pé com o que ele digitou. Um `throw` aqui é uma tela de erro
 *   do Next no lugar do convite — e o convidado não tem conta, não tem
 *   suporte, e não volta.
 * - **Não apaga resposta anterior por engano.** Responder de novo sobrescreve
 *   de propósito (o desenho tem "Editar resposta"), mas só depois de passar
 *   pela validação inteira.
 * - **Não toca em `guests`.** Ver `responderRsvpDoGrupo`.
 *
 * O `slug` vem preso por `.bind()` no server component, então o cliente
 * controla só o conteúdo do formulário.
 */
export async function responderRsvpAction(
  slug: string,
  _anterior: EstadoDoRsvp,
  formData: FormData
): Promise<EstadoDoRsvp> {
  const ip = await getClientIp();
  const { allowed } = await checkRateLimit(`rsvp:${ip}`, 20);
  if (!allowed) {
    return { erro: "Muitas tentativas seguidas. Espere alguns minutos e tente de novo." };
  }

  const view = await getRsvpViewBySlug(slug);
  if (!view) {
    return { erro: "Não achamos este convite. Peça o link de novo para os noivos." };
  }

  /* A trava do prazo mora AQUI, não só na tela.
     A tela some quando o prazo vence, mas um POST direto continuaria
     gravando — e aí a lista que o casal fechou para acertar o buffet volta a
     crescer sozinha depois de fechada. */
  if (prazoVencido(view.rsvpDeadline, view.timezone ?? undefined)) {
    return { erro: "As confirmações já fecharam. Fale direto com os noivos." };
  }

  const vai = formData.get("vai") === "sim";

  /* `lugares` só é lido quando a resposta é sim.
     Quem clicou em "Não posso" não passou pelo contador, e ler o campo dele
     traria o valor inicial do formulário — que faria "não vou" gravar
     "vamos em 2". */
  let lugares = 0;
  if (vai) {
    const bruto = Number(formData.get("lugares"));
    if (!Number.isInteger(bruto) || bruto < 1) {
      return { erro: "Diga quantas pessoas vão — pelo menos uma." };
    }
    if (bruto > view.seats) {
      return {
        erro: `Foram reservados ${view.seats} ${view.seats === 1 ? "lugar" : "lugares"} para vocês. Se precisarem de mais, falem com os noivos.`,
      };
    }
    lugares = bruto;
  }

  const nomes = texto(formData.get("nomes"), MAX_NOMES);
  const recado = texto(formData.get("recado"), MAX_RECADO);

  await responderRsvpDoGrupo(view.groupId, {
    lugares,
    // Quem não vai não tem nomes a informar; guardar o que sobrou no campo
    // seria gravar uma lista de presentes que não estarão lá.
    nomes: vai ? nomes : null,
    recado,
  });

  /* `updateTag`, não `revalidateTag`: quem acabou de confirmar precisa ver a
     própria resposta na hora, não uma versão de minutos atrás. */
  updateTag(`group:${slug}`);
  revalidatePath("/rsvp", "layout");

  return { ok: true, lugares };
}

function texto(valor: FormDataEntryValue | null, max: number): string | null {
  if (typeof valor !== "string") return null;
  const limpo = valor.trim();
  if (!limpo) return null;
  return limpo.slice(0, max);
}

/**
 * slug vem pré-preso via .bind() na página (server component), então o
 * cliente só controla guestId/status — e o guestId é validado contra o
 * grupo do slug antes de qualquer atualização.
 */
export async function submitRsvpAction(
  slug: string,
  guestId: string,
  status: RsvpStatus
) {
  const ip = await getClientIp();
  const { allowed } = await checkRateLimit(`rsvp:${ip}`, 20);
  if (!allowed) throw new Error("Muitas tentativas. Aguarde alguns minutos.");

  const group = await getGroupBySlug(slug);
  if (!group) throw new Error("Convite não encontrado");

  const updated = await updateGuestRsvp(group.id, guestId, status);
  // updateTag (não revalidateTag): o convidado tem que ver a própria
  // confirmação imediatamente, não uma versão stale.
  updateTag(`group:${slug}`);
  revalidatePath("/rsvp", "layout");
  return updated;
}
