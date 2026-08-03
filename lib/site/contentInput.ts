import type { EditableContent } from "@/lib/repositories/siteContent";
import { parsePixKey } from "@/lib/pix/key";

// Validação do formulário de conteúdo do casal.
//
// Sem Zod de propósito: o projeto não tem a dependência e o resto da base
// valida à mão (ver lib/customization.ts). O que importa aqui é o mesmo
// contrato: entra FormData de fora, sai objeto tipado ou erro — nunca um
// objeto meio validado.

/** Limites generosos, só para barrar abuso e estouro de coluna. */
const LIMITES = {
  coupleNames: 120,
  partnerA: 60,
  partnerB: 60,
  ceremonyVenue: 160,
  ceremonyAddress: 300,
  ceremonyMapUrl: 600,
  receptionVenue: 160,
  receptionAddress: 300,
  story: 5000,
  dressCode: 200,
  giftMessage: 1000,
  // Os limites do Pix vêm do padrão EMV (campos 59 e 60), não de estética:
  // acima disso o BR Code é recusado pelo app do banco. `buildBrCode` ainda
  // corta por segurança, mas barrar aqui avisa o casal em vez de truncar o
  // nome dele em silêncio.
  pixRecipient: 25,
  pixCity: 15,
  pixInstitution: 40,
} as const;

type CampoTexto = keyof typeof LIMITES;

/**
 * Nome do campo como o casal o vê na tela. Sem isto o erro sai
 * `O campo "pixRecipient" passou do limite` — nome de coluna vazando para
 * quem está tentando corrigir o próprio site.
 */
const ROTULO: Record<CampoTexto, string> = {
  coupleNames: "Nomes do casal",
  partnerA: "Primeiro nome",
  partnerB: "Segundo nome",
  ceremonyVenue: "Local da cerimônia",
  ceremonyAddress: "Endereço da cerimônia",
  ceremonyMapUrl: "Link do mapa",
  receptionVenue: "Local da festa",
  receptionAddress: "Endereço da festa",
  story: "Nossa história",
  dressCode: "Traje",
  giftMessage: "Recado dos presentes",
  pixRecipient: "Nome de quem recebe o Pix",
  pixCity: "Cidade de quem recebe",
  pixInstitution: "Banco",
};

export type ContentInputResult =
  | { ok: true; value: EditableContent }
  | { ok: false; error: string };

// "pixKey" fica fora de LIMITES porque parsePixKey já é mais estrito que
// qualquer contagem de caracteres: valida formato e dígito verificador.
function texto(
  formData: FormData,
  campo: CampoTexto | "pixKey"
): string | null {
  const bruto = formData.get(campo)?.toString() ?? "";
  // Normaliza fim de linha antes de medir: \r\n contaria dobrado e o casal
  // veria "passou do limite" com menos texto do que o limite diz.
  const limpo = bruto.replace(/\r\n/g, "\n").trim();
  return limpo === "" ? null : limpo;
}

/**
 * Só http/https. Este valor vira `href` de um link que o convidado clica —
 * `javascript:` aqui seria XSS armazenado no site de um cliente.
 */
function urlDeMapa(bruto: string | null): string | null | "invalida" {
  if (bruto === null) return null;
  try {
    const url = new URL(bruto);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "invalida";
    return url.toString();
  } catch {
    return "invalida";
  }
}

/**
 * Data + hora vindas de dois campos (`<input type="date">` e `type="time"`),
 * interpretadas no fuso do site.
 *
 * Hora vazia grava meia-noite, e `buildContentView` trata meia-noite como
 * "hora ainda não informada" — é o combinado que já existe lá, então dá para
 * o casal salvar a data antes de fechar o horário da cerimônia.
 */
function dataHora(
  formData: FormData,
  timezone: string
): Date | null | "invalida" {
  const dia = formData.get("weddingDate")?.toString().trim() ?? "";
  if (dia === "") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) return "invalida";

  const hora = formData.get("weddingTime")?.toString().trim() ?? "";
  const hhmm = /^\d{2}:\d{2}$/.test(hora) ? hora : "00:00";

  // Descobre o deslocamento do fuso NAQUELA data (horário de verão muda o
  // offset, então não dá para fixar um número).
  const provisorio = new Date(`${dia}T${hhmm}:00Z`);
  if (Number.isNaN(provisorio.getTime())) return "invalida";

  const offsetMin = deslocamentoEmMinutos(provisorio, timezone);
  const real = new Date(provisorio.getTime() + offsetMin * 60_000);
  if (Number.isNaN(real.getTime())) return "invalida";
  return real;
}

/** Quantos minutos somar a um instante UTC para ele significar a hora local. */
function deslocamentoEmMinutos(instante: Date, timezone: string): number {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const p = Object.fromEntries(
      fmt.formatToParts(instante).map((part) => [part.type, part.value])
    );
    const comoLocal = Date.UTC(
      Number(p.year),
      Number(p.month) - 1,
      Number(p.day),
      Number(p.hour === "24" ? "0" : p.hour),
      Number(p.minute),
      Number(p.second)
    );
    return (instante.getTime() - comoLocal) / 60_000;
  } catch {
    return 0; // fuso inválido: trata como UTC em vez de recusar a edição
  }
}

export function parseContentForm(
  formData: FormData,
  timezone = "America/Fortaleza"
): ContentInputResult {
  for (const [campo, limite] of Object.entries(LIMITES) as [
    CampoTexto,
    number,
  ][]) {
    const valor = texto(formData, campo);
    if (valor && valor.length > limite) {
      return {
        ok: false,
        error: `"${ROTULO[campo]}" passou do limite de ${limite} caracteres.`,
      };
    }
  }

  const mapa = urlDeMapa(texto(formData, "ceremonyMapUrl"));
  if (mapa === "invalida") {
    return {
      ok: false,
      error: "O link do mapa precisa começar com http:// ou https://.",
    };
  }

  const quando = dataHora(formData, timezone);
  if (quando === "invalida") {
    return { ok: false, error: "Data ou horário do casamento inválidos." };
  }

  // Chave Pix: recusar é melhor que aceitar errado. Uma chave com dígito
  // verificador inválido não devolve o dinheiro nem avisa ninguém — o
  // convidado paga, o app aceita ou recusa lá na ponta, e o casal descobre
  // depois do casamento. Por isso um único caractere fora do lugar barra o
  // salvamento inteiro em vez de gravar "quase certo".
  const pixBruta = texto(formData, "pixKey");
  let pixKey: string | null = null;
  let pixKeyType: string | null = null;
  if (pixBruta !== null) {
    const chave = parsePixKey(pixBruta);
    if (!chave.ok) return { ok: false, error: chave.error };
    pixKey = chave.normalizada;
    pixKeyType = chave.type;
  }

  return {
    ok: true,
    value: {
      coupleNames: texto(formData, "coupleNames"),
      partnerA: texto(formData, "partnerA"),
      partnerB: texto(formData, "partnerB"),
      weddingDate: quando,
      ceremonyVenue: texto(formData, "ceremonyVenue"),
      ceremonyAddress: texto(formData, "ceremonyAddress"),
      ceremonyMapUrl: mapa,
      receptionVenue: texto(formData, "receptionVenue"),
      receptionAddress: texto(formData, "receptionAddress"),
      story: texto(formData, "story"),
      dressCode: texto(formData, "dressCode"),
      giftMessage: texto(formData, "giftMessage"),
      pixKey,
      pixKeyType,
      pixRecipient: texto(formData, "pixRecipient"),
      pixCity: texto(formData, "pixCity"),
      pixInstitution: texto(formData, "pixInstitution"),
    },
  };
}
