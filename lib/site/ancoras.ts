/**
 * Âncoras das seções do site do convidado.
 *
 * O convite pode apontar para um pedaço do site — "ver a lista de presentes"
 * leva a `/s/<slug>#presentes`, não à capa. Sem isto o casal teria que digitar
 * a URL à mão e adivinhar se existe âncora do outro lado.
 *
 * Em PORTUGUÊS de propósito: o endereço aparece no navegador do convidado, e
 * `#gifts` num convite de casamento brasileiro é vazamento de nome interno. A
 * chave é a do molde; o valor é o que o mundo vê.
 */
export const ANCORA_DA_SECAO: Record<string, string> = {
  cover: "inicio",
  countdown: "contagem",
  story: "historia",
  details: "detalhes",
  gallery: "fotos",
  rsvp: "confirmacao",
  gifts: "presentes",
  album: "album",
  footer: "final",
};

/** Seções que fazem sentido virar botão num convite. */
export const LINKS_DO_CONVITE = [
  { chave: "rsvp", rotulo: "Confirmar presença" },
  { chave: "gifts", rotulo: "Lista de presentes" },
  { chave: "details", rotulo: "Local e horário" },
  { chave: "gallery", rotulo: "Nossas fotos" },
  { chave: "story", rotulo: "Nossa história" },
] as const;

/** Endereço absoluto de uma seção, para o convite. */
export function linkDaSecao(
  baseUrl: string,
  slug: string,
  chave: string
): string {
  const ancora = ANCORA_DA_SECAO[chave] ?? chave;
  return `${baseUrl.replace(/\/+$/, "")}/s/${slug}#${ancora}`;
}
