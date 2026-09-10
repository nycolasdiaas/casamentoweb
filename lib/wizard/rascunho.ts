/**
 * O conteúdo do site guardado enquanto o pedido ainda é rascunho.
 *
 * Ver o comentário de `orders.draftContent` em `lib/db/schema.ts` para o
 * porquê da coluna. Aqui mora só a leitura: `jsonb` chega do banco como
 * `unknown`, e a tela do questionário precisa de um mapa de texto para
 * texto.
 *
 * A normalização é deliberadamente rígida. Um rascunho é dado que ficou
 * parado — pode ter sido gravado por uma versão anterior do formulário, ou
 * ter chave que não existe mais. Descartar o que não é string custa nada e
 * evita que um valor estranho vire `[object Object]` dentro de um campo do
 * casal.
 */
export function lerRascunho(valor: unknown): Record<string, string> | null {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return null;

  const limpo: Record<string, string> = {};
  for (const [chave, v] of Object.entries(valor as Record<string, unknown>)) {
    if (typeof v === "string" && v !== "") limpo[chave] = v;
  }

  return Object.keys(limpo).length > 0 ? limpo : null;
}
