/**
 * As iniciais que vão no círculo do cabeçalho.
 *
 * Duas letras, no máximo: "Ana Beatriz Costa" vira "AB". Três ou mais não
 * cabem no círculo de 32px sem encolher a letra até virar borrão.
 *
 * O nome do casal costuma vir como "Ana & Pedro" — o `&` é descartado junto
 * com qualquer outro pedaço que não comece por letra, senão a inicial sairia
 * "A&".
 */
export function iniciaisDe(nome: string | null | undefined, padrao = ""): string {
  const partes = (nome ?? "")
    .trim()
    .split(/\s+/)
    .map((parte) => parte[0] ?? "")
    .filter((letra) => /\p{L}/u.test(letra));

  if (partes.length === 0) return padrao;
  return partes.slice(0, 2).join("").toUpperCase();
}
