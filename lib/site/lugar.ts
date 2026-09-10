/**
 * A linha curta de lugar que aparece na CAPA dos moldes.
 *
 * ── O problema ─────────────────────────────────────────────────────────────
 *
 * A capa reserva uma linha em caixa alta, com entreletra larga, para dizer
 * ONDE é o casamento. Os desenhos foram feitos com "FORTALEZA — CE" ali: duas
 * palavras curtas.
 *
 * O que o casal digita é o endereço inteiro — "Praça Nossa Senhora do Brasil,
 * 15 — Jardim Paulista, São Paulo — SP". Com a entreletra da capa isso vira
 * duas linhas, empurra o bloco e, no celular, encavala com o selo de prévia e
 * com o botão de confirmar presença. O endereço completo continua aparecendo
 * na seção do dia, que é onde ele serve para alguma coisa.
 *
 * ── A regra ────────────────────────────────────────────────────────────────
 *
 * Endereço brasileiro termina em cidade e estado. Pegamos os dois últimos
 * trechos separados por vírgula, que é onde eles quase sempre estão, e
 * descartamos o resto. Sem vírgula nenhuma, devolvemos o texto como está — um
 * "Fazenda Santa Rita" inteiro cabe, e cortá-lo seria pior.
 */
export function linhaDeLugar(
  endereco: string | null | undefined,
  limite = 42
): string | null {
  if (!endereco) return null;

  const partes = endereco
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  if (partes.length === 0) return null;

  const cauda =
    partes.length >= 2
      ? partes.slice(-2).join(", ")
      : partes[partes.length - 1];

  // Ainda longo demais (endereço sem vírgula, ou cidade de nome comprido):
  // fica o último trecho sozinho, e só então cortamos.
  const curto = cauda.length > limite ? partes[partes.length - 1] : cauda;
  return curto.length > limite ? `${curto.slice(0, limite - 1)}…` : curto;
}
