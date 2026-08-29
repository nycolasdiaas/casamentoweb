import { createHash } from "crypto";

/**
 * O cartão que aparece no WhatsApp — prancha `Compartilhamento` S1.
 *
 * ── Por que isto importa mais que a maioria das telas ──────────────────────
 *
 * A prancha é literal: *"No Brasil o casamento se espalha pelo WhatsApp. O que
 * decide se a pessoa abre não é o site — é o cartão que aparece na conversa."*
 * Hoje o produto não emite nenhuma metatag Open Graph, então o link do
 * casamento cai na conversa como texto cru.
 *
 * ── A VERSÃO no endereço da imagem ─────────────────────────────────────────
 *
 * Regra explícita da prancha: *"O WhatsApp guarda o cartão em cache por dias.
 * Ao trocar a foto de capa, regerar a imagem COM NOME NOVO — senão os
 * convidados continuam vendo a antiga."*
 *
 * Nenhum cabeçalho de cache resolve isso, porque quem guarda é o WhatsApp e
 * ele não revalida. A única saída é o endereço mudar. `versaoDoCartao`
 * transforma o que compõe o cartão — nomes, data, foto de capa — num hash
 * curto; qualquer edição gera um `?v=` diferente, e o WhatsApp trata como
 * imagem nova.
 *
 * Não é aleatório de propósito: o mesmo conteúdo tem que gerar o mesmo
 * endereço, senão cada render invalidaria o cache e a imagem seria refeita
 * a cada visita.
 */
export function versaoDoCartao(partes: {
  coupleNames: string | null;
  weddingDate: Date | null;
  ceremonyVenue: string | null;
  fotoDeCapaId: string | null;
}): string {
  const semente = [
    partes.coupleNames ?? "",
    partes.weddingDate?.toISOString() ?? "",
    partes.ceremonyVenue ?? "",
    partes.fotoDeCapaId ?? "",
  ].join("|");

  return createHash("sha256").update(semente).digest("hex").slice(0, 8);
}

/**
 * "19 . 09 . 2026" — o formato de data do cartão.
 *
 * Espaçado de propósito: é como as pranchas escrevem a data em Meta, e o
 * espaço entre os pontos é o que faz o número parecer composto em vez de
 * digitado.
 */
export function dataDoCartao(data: Date | null, timezone: string): string | null {
  if (!data) return null;
  try {
    const partes = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .format(data)
      .split("-");
    return `${partes[2]} . ${partes[1]} . ${partes[0]}`;
  } catch {
    return null;
  }
}

/** A descrição do cartão. Uma frase, sem ponto de interrogação. */
export const DESCRICAO_DO_SITE =
  "Confirme sua presença e veja a lista de presentes.";

export const DESCRICAO_DO_CONVITE = "Você está convidado.";
