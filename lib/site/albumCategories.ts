/**
 * As categorias do álbum, na ordem em que a história do casamento acontece.
 *
 * O pedido do Anderson (feedback 2, ponto 5c) foi específico: "as fotos não
 * contam história aí". Um álbum sem categoria é uma pilha de imagens; com
 * categoria, ele vira a narrativa do dia — que é o que o pacote Para Sempre
 * promete vender.
 *
 * A ORDEM É A DO EVENTO, não alfabética nem por quantidade de fotos. Ela foi
 * ditada pelo Anderson e não deve ser reordenada por conveniência de código:
 * quem abre o álbum está reconstruindo o dia na cabeça, e a sequência é a
 * própria informação. "Making-of da noiva" fecha porque é o extra que se olha
 * depois de já ter visto o casamento, não porque aconteceu por último.
 *
 * ── Por que isto existe ANTES da migração ───────────────────────────────────
 *
 * A coluna em `site_photos` ainda não existe. Este arquivo é a fonte única da
 * verdade que a migração, a interface de organização e os seis moldes vão
 * consumir — escrevê-lo primeiro impede que os três nasçam com listas
 * ligeiramente diferentes, que é como esse tipo de dado costuma divergir.
 */

export const CATEGORIAS_ALBUM = [
  { id: "pre-wedding", rotulo: "Pré-wedding" },
  { id: "noivado", rotulo: "Noivado" },
  { id: "entrada-noivos", rotulo: "Entrada dos noivos" },
  { id: "entrada-padrinhos", rotulo: "Entrada das madrinhas e padrinhos" },
  { id: "protocolares", rotulo: "Familiares & amigos" },
  { id: "aliancas-entrega", rotulo: "Entrega das alianças" },
  { id: "votos", rotulo: "Os votos e a troca de alianças" },
  { id: "saida", rotulo: "Saída dos recém-casados" },
  { id: "decoracao", rotulo: "Decoração e detalhes" },
  { id: "making-of", rotulo: "Making-of da noiva" },
] as const;

export type CategoriaAlbumId = (typeof CATEGORIAS_ALBUM)[number]["id"];

/**
 * Categoria de foto antiga: `null`.
 *
 * A migração é ADITIVA — a coluna entra anulável e assim permanece. Nenhuma
 * foto já enviada é reclassificada por adivinhação, e um álbum existente
 * continua funcionando exatamente como hoje. Tornar a coluna obrigatória, se
 * um dia fizer sentido, é outra migração, depois de verificar em produção.
 */
export const SEM_CATEGORIA = null;

export function ehCategoriaAlbum(valor: string): valor is CategoriaAlbumId {
  return CATEGORIAS_ALBUM.some((c) => c.id === valor);
}

/** O rótulo de uma categoria, para a interface e para os moldes. */
export function rotuloDaCategoria(id: string): string | null {
  return CATEGORIAS_ALBUM.find((c) => c.id === id)?.rotulo ?? null;
}

/**
 * Agrupa fotos por categoria NA ORDEM do evento, descartando categorias
 * vazias. É o que o molde consome: ele nunca desenha um título de seção sem
 * foto embaixo — a mesma regra de degradação que vale para o resto do site.
 */
export function agruparPorCategoria<T extends { category?: string | null }>(
  fotos: readonly T[]
): { id: CategoriaAlbumId; rotulo: string; fotos: T[] }[] {
  return CATEGORIAS_ALBUM.map((categoria) => ({
    id: categoria.id,
    rotulo: categoria.rotulo,
    fotos: fotos.filter((f) => f.category === categoria.id),
  })).filter((grupo) => grupo.fotos.length > 0);
}
