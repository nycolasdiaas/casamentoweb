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
  guestbook: "recados",
  album: "album",
  footer: "final",
};

/**
 * O rótulo curto — o que cabe na barra do site (F1).
 *
 * `SECTION_LABELS` não serve aqui: ele é o rótulo do PAINEL, escrito para o
 * casal decidindo o que ligar ("Cerimônia e festa", "Lista de presentes",
 * "Mural de recados"). Cinco rótulos desse tamanho numa barra, ao lado dos
 * nomes do casal e do botão de confirmar, não caberiam nem num monitor.
 *
 * `cover`, `countdown`, `rsvp` e `footer` não estão aqui de propósito: as duas
 * primeiras são onde o convidado já está quando a página abre, o rodapé não é
 * destino, e a confirmação vira o botão do fim da barra.
 */
export const ROTULO_CURTO: Record<string, string> = {
  story: "História",
  details: "O dia",
  gallery: "Galeria",
  gifts: "Presentes",
  guestbook: "Recados",
  album: "Álbum",
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
