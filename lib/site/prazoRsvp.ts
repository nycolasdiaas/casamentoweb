/**
 * O prazo de confirmação de presença — quem decide se a lista ainda aceita
 * resposta.
 *
 * ── Por que isto é um arquivo, e não um `>` solto na página ────────────────
 *
 * Errar aqui fecha a lista de um casamento real um dia antes da hora, e o
 * convidado que tentar confirmar nesse dia não tem a quem reclamar — ele não
 * tem conta, não tem suporte, e provavelmente conclui que perdeu o prazo. A
 * comparação precisa de um lugar só, testado, com a regra escrita.
 *
 * ── As duas armadilhas ─────────────────────────────────────────────────────
 *
 * 1. **`rsvp_deadline` é `date`, não `timestamp`.** Ele vale o DIA INTEIRO.
 *    "Confirme até 05 de setembro" quer dizer que 05/09 às 23h ainda vale.
 *    Comparar contra meia-noite do dia 05 tira um dia de todo mundo.
 *
 * 2. **O fuso é o do CASAMENTO, não o do servidor.** A Vercel roda em UTC; um
 *    casamento em Fortaleza (UTC−3) vira o dia três horas antes na conta do
 *    servidor. Entre 21h e meia-noite do último dia, um convidado em Fortaleza
 *    veria "as confirmações já fecharam" com o prazo ainda aberto.
 *
 * A saída para as duas é a mesma: comparar DIA com DIA, e pegar o dia de hoje
 * já convertido para o fuso do site. `en-CA` é o único locale que o `Intl`
 * formata como `yyyy-mm-dd` — e nesse formato a comparação de string é
 * cronológica, sem `Date` no meio para o fuso estragar de novo.
 */

/** O dia de hoje no fuso do casamento, como "yyyy-mm-dd". */
export function diaDeHoje(timezone: string, agora: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(agora);
  } catch {
    // Fuso inválido gravado no banco não pode derrubar a rota do convidado.
    // Sem fuso confiável, cai no do servidor: erra por no máximo um dia, e
    // erra para o lado de deixar responder (ver `prazoVencido`).
    return new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(agora);
  }
}

/**
 * O prazo já venceu?
 *
 * `false` sempre que houver dúvida — sem prazo definido, com prazo ilegível,
 * ou no próprio dia do prazo. **Errar para o lado de aceitar a resposta é a
 * escolha certa**: uma confirmação a mais o casal resolve; uma confirmação
 * perdida ninguém recupera, porque o convidado não volta.
 */
export function prazoVencido(
  /** "yyyy-mm-dd", como a coluna `date` devolve. */
  rsvpDeadline: string | null | undefined,
  timezone: string = "America/Fortaleza",
  agora: Date = new Date()
): boolean {
  if (!rsvpDeadline) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(rsvpDeadline)) return false;
  return diaDeHoje(timezone, agora) > rsvpDeadline;
}

/**
 * "05 de setembro" — como o prazo aparece para o convidado.
 *
 * Sem o ano de propósito: o convite é sobre um casamento que acontece nos
 * próximos meses, e o ano só ocupa espaço. Quando a tela precisa do ano
 * (o rodapé de H3), ela pede o formato completo.
 */
export function prazoPorExtenso(
  rsvpDeadline: string | null | undefined,
  comAno = false
): string | null {
  if (!rsvpDeadline) return null;
  const quando = new Date(`${rsvpDeadline}T12:00:00`);
  if (Number.isNaN(quando.getTime())) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    ...(comAno ? { year: "numeric" } : {}),
  }).format(quando);
}
