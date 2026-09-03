import {
  listGifts,
  fotosPorPresente,
  contribuicoesPorCota,
} from "@/lib/repositories/gifts";
import { getSitePix } from "@/lib/pix/resolve";
import { getTemplate } from "@/lib/templates/registry";
import { tierAllowsSection } from "@/lib/templates/contract";
import type { PackageTier } from "@/lib/packages";
import type { PixParaConvidado } from "@/components/gifts/GiftPixModal";
import type { Gift } from "@/components/gifts/GiftGallery";

// Tudo que a seção de presentes precisa, num lugar só.
//
// Existe para que nenhum molde possa esquecer o Pix. Antes, cada um dos seis
// chamava `listGifts` e montava o mesmo `.map` — e o Pix vinha de uma
// constante global que ninguém precisava passar. Era exatamente essa
// "facilidade" que fazia todo site mostrar a chave da mesma pessoa.
//
// Agora o dado do pagamento entra pela mesma porta que a lista. Um molde novo
// que copie o padrão herda o comportamento certo; um que invente o próprio
// caminho não compila, porque `GiftGrid` exige `pix` explicitamente.

/**
 * A lista de presentes está visível para o convidado neste site?
 *
 * Cruza as três coisas que podem escondê-la, e é a MESMA regra que o
 * `SiteRenderer` aplica ao montar as seções — só que respondida antes de
 * renderizar, para `/s/<slug>/presentes` poder decidir entre mostrar a lista
 * e responder "fora do ar".
 *
 * Duplicar essa condição na rota seria criar um segundo lugar que decide o
 * mesmo, e um deles ficaria para trás na primeira mudança de pacote.
 */
export function listaDePresentesVisivel(view: {
  site: { templateId: string | null; tier: PackageTier };
  sections: { sectionKey: string; enabled: boolean }[];
}): boolean {
  const template = getTemplate(view.site.templateId);
  if (!template) return false;
  if (!template.order.includes("gifts") || !template.sections.gifts) return false;
  if (!tierAllowsSection(view.site.tier, "gifts")) return false;

  // Sem linhas semeadas, o site mostra tudo que o pacote libera — é o mesmo
  // padrão do `SiteFromView` (`view.sections.length ? ... : undefined`).
  const linha = view.sections.find((s) => s.sectionKey === "gifts");
  if (view.sections.length > 0 && (!linha || !linha.enabled)) return false;

  return true;
}

export type GiftSectionData = {
  gifts: Gift[];
  pix: PixParaConvidado | null;
  /** Foto de cada presente que tem uma, indexada por giftId. */
  fotos: Record<string, { id: string; blurDataUrl: string | null }>;
  /** ids dos presentes com pelo menos uma contribuição (já presenteado). */
  presenteados: string[];
};

export async function loadGiftSection(
  siteId: string
): Promise<GiftSectionData> {
  // Em paralelo: quatro consultas independentes, todas em `use cache`.
  const [linhas, pix, fotos, contribuicoes] = await Promise.all([
    listGifts(siteId),
    getSitePix(siteId),
    fotosPorPresente(siteId),
    contribuicoesPorCota(siteId),
  ]);

  return {
    gifts: linhas.map((g) => ({
      id: g.id,
      category: g.category,
      name: g.name,
      description: g.description,
      priceCents: g.priceCents,
    })),
    // `cidade` e `recebedor` já vêm resolvidos com padrão pelo getSitePix; o
    // que não tem padrão — a chave — é o que decide se `pix` é null.
    pix: pix && {
      chave: pix.chave,
      recebedor: pix.recebedor,
      cidade: pix.cidade,
      instituicao: pix.instituicao,
    },
    fotos: Object.fromEntries(fotos),
    presenteados: [...contribuicoes.keys()],
  };
}
