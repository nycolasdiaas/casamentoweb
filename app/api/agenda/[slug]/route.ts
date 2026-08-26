import { getRsvpViewBySlug } from "@/lib/repositories/groups";

/**
 * O casamento como arquivo de agenda — o botão "Adicionar à agenda" da F4.
 *
 * ── Por que uma rota, e não um `data:` no cliente ──────────────────────────
 *
 * `data:text/calendar` não abre o app de agenda no iOS e vira download de
 * arquivo sem nome no Android. Uma URL com `Content-Type: text/calendar` e
 * `.ics` no fim é o que faz o celular oferecer "Adicionar ao Calendário" —
 * que é o gesto inteiro. Um botão que baixa um arquivo que ninguém sabe abrir
 * é decoração.
 *
 * ── A chave é o slug do GRUPO, não o do site ───────────────────────────────
 *
 * É o único identificador que o convidado tem em mãos: ele veio de
 * `/rsvp/<slug>`. Pedir o slug do site exigiria que ele soubesse de outra
 * coisa. E como o slug do grupo já é público (está no WhatsApp dele), isto
 * não expõe nada novo — só a data e o local, que são o convite.
 *
 * ── Escapes ────────────────────────────────────────────────────────────────
 *
 * O formato iCalendar (RFC 5545) trata `,` `;` `\` como separadores e quebra
 * linha com `\n` literal. Um nome de local com vírgula — "Igreja N.S. do
 * Brasil, São Paulo", que é o caso comum — corromperia o arquivo sem o escape.
 */

/* Sem `export const dynamic`: com `cacheComponents` ligado o Next reprova a
   configuração de segmento no build ("not compatible with
   nextConfig.cacheComponents"). Também é desnecessária — a rota lê `params` e
   o `DTSTAMP` do arquivo, então já é dinâmica por natureza. O que garante
   frescor da leitura é a tag `group:<slug>`, que a action de confirmação
   derruba. */

function escapar(texto: string): string {
  return texto
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** "20260919T160000Z" — o formato de instante do iCalendar. */
function instante(data: Date): string {
  return data.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * Dobra as linhas em 75 octetos, como a RFC exige.
 *
 * Sem isso, um nome de local longo gera uma linha que alguns clientes
 * simplesmente ignoram — e o evento chega sem local.
 */
function dobrar(linha: string): string {
  if (linha.length <= 75) return linha;
  const partes: string[] = [linha.slice(0, 75)];
  let resto = linha.slice(75);
  while (resto.length > 74) {
    partes.push(` ${resto.slice(0, 74)}`);
    resto = resto.slice(74);
  }
  if (resto) partes.push(` ${resto}`);
  return partes.join("\r\n");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const view = await getRsvpViewBySlug(slug);

  // Sem casamento ou sem data não há evento a criar. 404 e pronto: o botão só
  // aparece na tela quando há data, então chegar aqui já é caso de borda.
  if (!view || !view.weddingDate) {
    return new Response("Not found", { status: 404 });
  }

  const inicio = view.weddingDate;
  const fuso = view.timezone ?? "America/Fortaleza";

  /* HORA NÃO INFORMADA VIRA EVENTO DE DIA INTEIRO.
     `toEditorValues` trata meia-noite no fuso do site como "o casal ainda não
     disse a hora" — é o combinado do produto. Marcar isso na agenda como um
     evento das 00h às 04h põe o casamento na madrugada do convidado, e ele
     acorda com um alarme errado ou perde o dia certo.
     `VALUE=DATE` é como o iCalendar diz "este dia, sem hora": o app mostra na
     faixa do topo, que é exatamente o que se sabe. */
  const horaLocal = new Intl.DateTimeFormat("en-GB", {
    timeZone: fuso,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(inicio);
  const semHora = horaLocal === "00:00";

  // Só usado quando há hora: quatro horas é a duração convencional de um
  // casamento, e sem `DTEND` alguns apps criam um evento de 30 minutos.
  const fim = new Date(inicio.getTime() + 4 * 60 * 60 * 1000);

  /** "20261016" — o formato de DIA do iCalendar, no fuso do casamento. */
  const dia = (data: Date): string =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: fuso,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .format(data)
      .replace(/-/g, "");

  const titulo = view.coupleNames
    ? `Casamento de ${view.coupleNames}`
    : "Casamento";

  const quando = semHora
    ? [
        `DTSTART;VALUE=DATE:${dia(inicio)}`,
        // `DTEND` de evento de dia inteiro é EXCLUSIVO: precisa do dia
        // seguinte, senão alguns apps mostram um evento de duração zero.
        `DTEND;VALUE=DATE:${dia(new Date(inicio.getTime() + 86_400_000))}`,
      ]
    : [`DTSTART:${instante(inicio)}`, `DTEND:${instante(fim)}`];

  const linhas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Enlace//Sites de casamento//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    // O UID precisa ser estável: sem ele, cada download vira um evento novo e
    // o convidado que clicar duas vezes fica com o casamento duplicado.
    `UID:enlace-${view.groupId}@enlace.site`,
    `DTSTAMP:${instante(new Date())}`,
    ...quando,
    `SUMMARY:${escapar(titulo)}`,
    view.ceremonyVenue ? `LOCATION:${escapar(view.ceremonyVenue)}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((l): l is string => l !== null);

  const ics = linhas.map(dobrar).join("\r\n");

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="casamento.ics"`,
      // O convidado não é indexável e o arquivo não é conteúdo de busca.
      "X-Robots-Tag": "noindex",
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
