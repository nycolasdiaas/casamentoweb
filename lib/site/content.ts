import type { SiteContentView } from "@/lib/templates/contract";

// Converte a linha de site_content na view que as seções consomem.
//
// Toda formatação de data vive aqui, não no template: assim os 6 moldes
// mostram a mesma data do mesmo jeito, e um ajuste de formato não precisa ser
// repetido seis vezes.

type ContentRow = {
  coupleNames: string | null;
  partnerA: string | null;
  partnerB: string | null;
  weddingDate: Date | null;
  timezone: string;
  ceremonyVenue: string | null;
  ceremonyAddress: string | null;
  ceremonyMapUrl: string | null;
  receptionVenue: string | null;
  receptionAddress: string | null;
  story: string | null;
  dressCode: string | null;
  giftMessage: string | null;
};

function initialsFrom(
  coupleNames: string,
  a: string | null,
  b: string | null
): [string, string] | null {
  if (a && b) return [a.trim()[0].toUpperCase(), b.trim()[0].toUpperCase()];

  // "Isabelle e Nycolas" / "Ana & Pedro" → ["I", "N"] / ["A", "P"]
  const partes = coupleNames.split(/\s+(?:e|&|and)\s+/i);
  if (partes.length === 2 && partes[0] && partes[1]) {
    return [partes[0].trim()[0].toUpperCase(), partes[1].trim()[0].toUpperCase()];
  }
  return null;
}

export function buildContentView(row: ContentRow): SiteContentView {
  const coupleNames = row.coupleNames?.trim() || "Nosso casamento";
  const date = row.weddingDate;
  const tz = row.timezone || "America/Fortaleza";

  const fmt = (options: Intl.DateTimeFormatOptions) =>
    date
      ? new Intl.DateTimeFormat("pt-BR", { timeZone: tz, ...options }).format(date)
      : null;

  // Meia-noite quase sempre significa "hora ainda não informada", não uma
  // cerimônia à meia-noite — melhor omitir do que exibir "às 00:00".
  const horas = date
    ? Number(
        new Intl.DateTimeFormat("pt-BR", {
          timeZone: tz,
          hour: "numeric",
          hour12: false,
        }).format(date)
      )
    : null;
  const minutos = date
    ? Number(
        new Intl.DateTimeFormat("pt-BR", { timeZone: tz, minute: "numeric" }).format(
          date
        )
      )
    : null;
  const temHorario = horas !== null && !(horas === 0 && minutos === 0);

  return {
    coupleNames,
    partnerA: row.partnerA,
    partnerB: row.partnerB,
    initials: initialsFrom(coupleNames, row.partnerA, row.partnerB),
    weddingDate: date,
    weddingDateLabel: fmt({ day: "numeric", month: "long", year: "numeric" }),
    weddingTimeLabel: temHorario
      ? fmt({ hour: "2-digit", minute: "2-digit" })
      : null,
    weekdayLabel: fmt({ weekday: "long" }),
    ceremonyVenue: row.ceremonyVenue,
    ceremonyAddress: row.ceremonyAddress,
    ceremonyMapUrl: row.ceremonyMapUrl,
    receptionVenue: row.receptionVenue,
    receptionAddress: row.receptionAddress,
    story: row.story,
    dressCode: row.dressCode,
    giftMessage: row.giftMessage,
  };
}
