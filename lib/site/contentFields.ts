import type { ContentEditorValues } from "@/components/account/ContentEditor";

// Caminho de volta do que `contentInput.ts` faz: o banco guarda um instante
// UTC, e `<input type="date">` / `type="time"` querem a data e a hora COMO
// APARECEM no fuso do site.
//
// Formatar com `toISOString()` seria o bug clássico: cerimônia às 16h em
// Fortaleza (UTC-3) voltaria como 19:00 no formulário, e salvar de novo
// empurraria mais três horas a cada edição.

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
} | null;

function partesNoFuso(
  date: Date,
  timezone: string
): { dia: string; hora: string } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const p = Object.fromEntries(
    fmt.formatToParts(date).map((part) => [part.type, part.value])
  );
  // Intl devolve "24" para meia-noite em alguns ambientes.
  const hh = p.hour === "24" ? "00" : p.hour;
  return {
    dia: `${p.year}-${p.month}-${p.day}`,
    hora: `${hh}:${p.minute}`,
  };
}

export function toEditorValues(row: ContentRow): ContentEditorValues {
  const tz = row?.timezone || "America/Fortaleza";
  const quando = row?.weddingDate ? partesNoFuso(row.weddingDate, tz) : null;

  return {
    coupleNames: row?.coupleNames ?? "",
    partnerA: row?.partnerA ?? "",
    partnerB: row?.partnerB ?? "",
    weddingDate: quando?.dia ?? "",
    // Meia-noite é o combinado de "hora não informada" (ver buildContentView):
    // volta vazio para o casal não achar que marcou cerimônia às 00:00.
    weddingTime: quando && quando.hora !== "00:00" ? quando.hora : "",
    ceremonyVenue: row?.ceremonyVenue ?? "",
    ceremonyAddress: row?.ceremonyAddress ?? "",
    ceremonyMapUrl: row?.ceremonyMapUrl ?? "",
    receptionVenue: row?.receptionVenue ?? "",
    receptionAddress: row?.receptionAddress ?? "",
    story: row?.story ?? "",
    dressCode: row?.dressCode ?? "",
    giftMessage: row?.giftMessage ?? "",
  };
}
