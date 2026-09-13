/**
 * Como a tela do convidado chama quem está do outro lado.
 *
 * ── Por que existe ─────────────────────────────────────────────────────────
 *
 * A confirmação de presença abria com o rótulo que o CASAL deu ao grupo —
 * "Família Souza — tios da noiva, vocês vêm?" — e o painel promete, embaixo
 * daquele campo, que só o casal vê esse nome (UX-008). O rótulo saiu, e a
 * saudação ficou neutra: "Vocês vêm?".
 *
 * Correto, e mais frio do que o produto merece. Os nomes das pessoas
 * convidadas o casal também digitou, e esses são públicos por natureza: é o
 * convidado lendo o próprio nome no convite dele.
 *
 * ── Onde para ──────────────────────────────────────────────────────────────
 *
 * Até três nomes a saudação lista. De quatro em diante ela volta a ser neutra:
 * um título com seis primeiros nomes não é carinho, é uma lista — e o convite
 * já mostra quem foi convidado logo abaixo.
 */

/**
 * Palavras que vêm ANTES do nome e não são o nome.
 *
 * "Dona Ivete" virava "Dona, você vem?" — pego na verificação em produção. No
 * Brasil o tratamento cola no nome com naturalidade ("Tia Antônia", "Seu
 * João", "Vó Maria"), e é assim que a pessoa é chamada: o certo é manter os
 * dois, não escolher um.
 */
const TRATAMENTOS = new Set([
  "dona",
  "dna",
  "dr",
  "dra",
  "sr",
  "sra",
  "seu",
  "dom",
  "vo",
  "vó",
  "vô",
  "tia",
  "tio",
  "padre",
  "pastor",
  "prof",
  "profa",
]);

/** Como se chama alguém num convite: o primeiro nome, com o tratamento junto. */
function primeiroNome(nomeCompleto: string): string {
  const partes = nomeCompleto.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "";

  const chave = partes[0].toLowerCase().replace(/\.$/, "");
  if (TRATAMENTOS.has(chave) && partes.length > 1) {
    return `${partes[0]} ${partes[1]}`;
  }
  return partes[0];
}

export function saudacaoDeConvidados(
  nomes: readonly string[] | null | undefined
): string | null {
  if (!nomes || nomes.length === 0) return null;

  const primeiros = nomes
    .map(primeiroNome)
    .filter((n) => n.length > 0);

  if (primeiros.length === 0 || primeiros.length > 3) return null;
  if (primeiros.length === 1) return primeiros[0];

  const ultimo = primeiros[primeiros.length - 1];
  const anteriores = primeiros.slice(0, -1);
  return `${anteriores.join(", ")} e ${ultimo}`;
}

/**
 * "você vem?" ou "vocês vêm?".
 *
 * Um grupo de um lugar é uma pessoa, e tratá-la no plural é o tipo de detalhe
 * que faz o convite parecer gerado. A conta é do número de LUGARES, não do de
 * nomes: o casal pode reservar dois lugares sem ter digitado os dois nomes.
 */
export function pluralDoConvite(lugares: number): {
  pronome: string;
  verbo: string;
} {
  return lugares <= 1
    ? { pronome: "você", verbo: "vem" }
    : { pronome: "vocês", verbo: "vêm" };
}
