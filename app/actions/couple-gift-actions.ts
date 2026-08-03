"use server";

import { revalidatePath, updateTag } from "next/cache";
import { getSessionUserId } from "@/lib/auth/userSession";
import { getSiteOwnedByUser } from "@/lib/repositories/sites";
import {
  createGift,
  updateGift,
  deleteGift,
} from "@/lib/repositories/gifts";
import { parsePriceToCents } from "@/lib/format";

// Lista de presentes editável PELO CASAL.
//
// As ações em `gift-actions.ts` são do admin e vivem presas ao site legado
// (`getLegacySiteId`). Reaproveitá-las daria ao casal a lista de outro
// casamento — o mesmo vazamento entre clientes que a Fase 0 corrigiu.
// Aqui o escopo vem da POSSE do site, conferida a cada chamada.

export type GiftActionResult =
  | { error: string }
  | { saved: true; message: string }
  | undefined;

type Site = NonNullable<Awaited<ReturnType<typeof getSiteOwnedByUser>>>;

async function siteDoCasal(
  formData: FormData
): Promise<{ error: string } | { site: Site }> {
  const userId = await getSessionUserId();
  if (!userId) return { error: "Entrem na conta para continuar." };

  const siteId = formData.get("siteId")?.toString() ?? "";
  if (!siteId) return { error: "Site não informado." };

  // Mesma resposta para "não existe" e "não é seu": quem sonda ids alheios
  // não aprende nada com o erro.
  const site = await getSiteOwnedByUser(siteId, userId);
  if (!site) return { error: "Site não encontrado." };
  if (site.status === "archived") {
    return { error: "Este site está arquivado. Fale com a gente para reabrir." };
  }

  return { site };
}

const LIMITE_NOME = 120;
const LIMITE_CATEGORIA = 60;

function parseCota(formData: FormData):
  | { error: string }
  | { value: { category: string; name: string; priceCents: number | null } } {
  const name = formData.get("name")?.toString().trim() ?? "";
  const category = formData.get("category")?.toString().trim() ?? "";
  const priceRaw = formData.get("price")?.toString().trim() ?? "";

  if (!name) return { error: "Dê um nome para a cota." };
  if (name.length > LIMITE_NOME) {
    return { error: `O nome passou de ${LIMITE_NOME} caracteres.` };
  }
  if (!category) return { error: "Escolham ou escrevam uma categoria." };
  if (category.length > LIMITE_CATEGORIA) {
    return { error: `A categoria passou de ${LIMITE_CATEGORIA} caracteres.` };
  }

  // Preço vazio é intencional e vira "você decide" no site — o convidado
  // escolhe quanto dar, e o BR Code sai sem o campo de valor.
  const priceCents = priceRaw ? parsePriceToCents(priceRaw) : null;
  if (priceRaw && priceCents === null) {
    return { error: "Preço inválido. Use algo como 180 ou 180,00." };
  }
  if (priceCents !== null && priceCents <= 0) {
    return { error: "O preço precisa ser maior que zero — ou deixem em branco." };
  }

  return { value: { category, name, priceCents } };
}

/**
 * Derruba o cache da lista e redesenha a tela do casal.
 *
 * `updateTag` na tag da lista (read-your-own-writes, o convidado nunca vê
 * versão velha) E `revalidatePath` no painel, que lê o banco direto e por
 * isso não é alcançado por tag nenhuma.
 */
function derrubarCache(siteId: string) {
  updateTag(`gifts:${siteId}`);
  revalidatePath("/conta/pedidos/[id]/presentes", "page");
}

export async function criarCotaAction(
  _prev: GiftActionResult,
  formData: FormData
): Promise<GiftActionResult> {
  const dono = await siteDoCasal(formData);
  if ("error" in dono) return { error: dono.error };

  const parsed = parseCota(formData);
  if ("error" in parsed) return { error: parsed.error };

  await createGift(dono.site.id, parsed.value);
  derrubarCache(dono.site.id);
  return { saved: true, message: "Cota criada ✓" };
}

export async function editarCotaAction(
  _prev: GiftActionResult,
  formData: FormData
): Promise<GiftActionResult> {
  const dono = await siteDoCasal(formData);
  if ("error" in dono) return { error: dono.error };

  const giftId = formData.get("giftId")?.toString() ?? "";
  if (!giftId) return { error: "Cota não informada." };

  const parsed = parseCota(formData);
  if ("error" in parsed) return { error: parsed.error };

  // `updateGift` exige giftId E siteId: cota de outro casal não é encontrada.
  const cota = await updateGift(dono.site.id, giftId, parsed.value);
  if (!cota) return { error: "Essa cota não existe nesta lista." };

  derrubarCache(dono.site.id);
  return { saved: true, message: "Cota atualizada ✓" };
}

export async function apagarCotaAction(
  _prev: GiftActionResult,
  formData: FormData
): Promise<GiftActionResult> {
  const dono = await siteDoCasal(formData);
  if ("error" in dono) return { error: dono.error };

  const giftId = formData.get("giftId")?.toString() ?? "";
  if (!giftId) return { error: "Cota não informada." };

  // Apagar a cota NÃO apaga quem já presenteou: `gift_contributions` guarda
  // `giftName` em texto justamente para a contribuição sobreviver à cota.
  await deleteGift(dono.site.id, giftId);
  derrubarCache(dono.site.id);
  return { saved: true, message: "Cota removida ✓" };
}
