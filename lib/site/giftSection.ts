import { listGifts } from "@/lib/repositories/gifts";
import { getSitePix } from "@/lib/pix/resolve";
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

export type GiftSectionData = {
  gifts: Gift[];
  pix: PixParaConvidado | null;
};

export async function loadGiftSection(
  siteId: string
): Promise<GiftSectionData> {
  // Em paralelo: são duas consultas independentes, ambas em `use cache`.
  const [linhas, pix] = await Promise.all([
    listGifts(siteId),
    getSitePix(siteId),
  ]);

  return {
    gifts: linhas.map((g) => ({
      id: g.id,
      category: g.category,
      name: g.name,
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
  };
}
