// Envio dos e-mails transacionais (redefinição de senha e confirmação de
// cadastro). Dois transportes, escolhidos pelo que estiver configurado:
//
//   1. Gmail SMTP  — GMAIL_USER + GMAIL_APP_PASSWORD
//      Solução temporária enquanto não há domínio próprio. Envia a partir da
//      sua conta Google, então NÃO precisa verificar domínio. Limite de
//      ~500 destinatários/dia e a senha de app é uma credencial da conta
//      inteira — troque por um provedor dedicado quando o volume crescer.
//
//   2. Resend      — RESEND_API_KEY + RESET_EMAIL_FROM
//      Exige domínio verificado (SPF/DKIM). É o destino final.
//
// O Gmail tem prioridade quando os dois estão preenchidos, porque é o que
// se configura "temporariamente por cima". Sem nenhum dos dois, o envio
// fica desligado: a redefinição aponta para o WhatsApp e a confirmação de
// e-mail não bloqueia o envio do pedido.

import nodemailer, { type Transporter } from "nodemailer";
import { baseUrlEstatica } from "@/lib/baseUrl";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");

// O remetente muda com o transporte: no Gmail o From TEM que ser a própria
// conta autenticada (o Google reescreve qualquer outro), no Resend é o
// endereço do domínio verificado.
const FROM = GMAIL_APP_PASSWORD
  ? (process.env.MAIL_FROM_NAME ?? "Enlace") + ` <${GMAIL_USER}>`
  : (process.env.RESET_EMAIL_FROM ?? "Enlace <onboarding@resend.dev>");

export function isEmailConfigured(): boolean {
  return Boolean((GMAIL_USER && GMAIL_APP_PASSWORD) || RESEND_API_KEY);
}

/** Qual transporte está ativo — usado pelo script de teste e por diagnóstico. */
export function emailTransport(): "gmail" | "resend" | "none" {
  if (GMAIL_USER && GMAIL_APP_PASSWORD) return "gmail";
  if (RESEND_API_KEY) return "resend";
  return "none";
}

// Reaproveita a conexão SMTP entre envios (pool) em vez de abrir uma nova a
// cada e-mail — o Google limita conexões por minuto.
let transporter: Transporter | null = null;
function gmailTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      pool: true,
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    });
  }
  return transporter;
}

/* ==========================================================================
   A casca dos e-mails transacionais — `Enlace - Emails.dc.html`.

   HTML de e-mail não é HTML de página, e a diferença não é estética: o
   Outlook renderiza com o motor do Word. Nada de flex, grid, `gap`, custom
   property, folha externa ou `<button>` — tabela aninhada e estilo inline,
   como em 2003. As sete regras de construção do desenho estão nos FR-001 a
   FR-011 de `specs/design-system/007-casca-de-email`.

   Web font não carrega no Outlook, então a pilha cai em fontes de sistema:
   serifa no título, sans no corpo, mono no rodapé.
   ========================================================================== */

const PAPEL = "#f2efe7"; // o papel da vitrine, dentro da moldura
const FUNDO = "#e2e2dc"; // a mesa em volta, para a moldura ter borda
const TINTA = "#1a1d21"; // o botão — um por e-mail (FR-010)
const FIO = "#d8d0bf"; // os dois fios: sob o cabeçalho, sobre o rodapé
const BORDA = "#c9c9c2"; // a moldura dos 600px
const TERCIARIO = "#8b9099"; // link em texto puro e rodapé

const F_DISPLAY = "Georgia, 'Times New Roman', serif";
const F_CORPO = "Helvetica, Arial, sans-serif";
const F_DADO = "'Courier New', Courier, monospace";

/**
 * Texto de pessoa entrando em HTML.
 *
 * O nome do casal é digitado por ele, e daqui vai direto para dentro de um
 * atributo `alt` e de uma célula de tabela. Um `&` já quebra o atributo; aspas
 * ou `<` quebrariam a mensagem inteira e, no limite, deixariam um casal
 * escrever marcação no e-mail que a Enlace assina.
 *
 * Escapar aqui, e não confiar em cliente de e-mail: o Outlook desenha com o
 * motor do Word, e o que ele faz com marcação torta não é previsível.
 */
function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * A linha que a caixa de entrada mostra ao lado do assunto.
 *
 * Sem ela o Gmail puxa o começo do cabeçalho — que é o logotipo, ou seja,
 * nada. É a segunda linha de texto que o casal lê do produto, antes mesmo de
 * abrir, e por isso `layout` a exige em vez de aceitar como opcional.
 *
 * Os 120 caracteres invisíveis depois do texto empurram o resto da mensagem
 * para fora da prévia. Sem eles a caixa de entrada emenda o preheader com o
 * primeiro parágrafo e a linha vira uma frase cortada no meio.
 */
export function preheader(texto: string): string {
  const invisivel = "&#8199;&#65279;".repeat(60); // 60 pares = 120 caracteres
  return `<div data-preheader="1" style="display:none;font-size:1px;color:${PAPEL};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">${escaparHtml(texto)}${invisivel}</div>`;
}

/** O rodapé: quem mandou e de onde. Em mono, como a `t-data` da Prensa. */
export function rodape(base: string): string {
  const endereco = base.replace(/^https?:\/\//, "");
  return `<tr><td style="padding:20px 40px;border-top:1px solid ${FIO};font-family:${F_DADO};font-size:11px;line-height:1.7;color:${TERCIARIO}">
          Enlace &middot; sites de casamento<br>
          <a href="${base}" style="color:${TERCIARIO};text-decoration:none">${endereco}</a>
        </td></tr>`;
}

/**
 * O botão de tinta — célula de tabela com fundo sólido, nunca `<button>`.
 *
 * A altura clicável sai da conta e não do olho: 20px de linha mais 15px de
 * padding em cima e embaixo dão 50px, acima do mínimo de 44px que o dedo
 * pede. O raio de 2px vira quadrado no Outlook, e tudo bem — é o único
 * detalhe do desenho que degrada, e ele degrada para o que já era.
 *
 * O endereço vem repetido em texto puro logo abaixo. Não é redundância: é
 * quem lê o e-mail num cliente que engole o link, ou de um aparelho e
 * responde de outro.
 */
export function button(
  href: string,
  label: string,
  /**
   * Repetir o endereço em texto puro logo abaixo (FR-005 de
   * `design-system/007`). Existe para o DESTINO que o leitor pode querer abrir
   * de outro jeito — de outro aparelho, de um cliente que engole o link.
   *
   * `false` só para botão de AÇÃO, cujo endereço não é um destino que alguém
   * copiaria: `wa.me/?text=…` colado num navegador não leva a lugar nenhum
   * útil, e imprimir 140 caracteres de URL escapada abaixo de "Compartilhar no
   * WhatsApp" é ruído, não acessibilidade.
   */
  repetirEndereco = true
): string {
  return `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:24px 0">
        <tr><td bgcolor="${TINTA}" style="border-radius:2px">
          <a href="${href}" style="display:inline-block;padding:15px 28px;font-family:${F_CORPO};font-size:15px;line-height:20px;font-weight:500;color:#ffffff;text-decoration:none">${label}</a>
        </td></tr>
      </table>${
        repetirEndereco
          ? `
      <p style="margin:0 0 8px;font-family:${F_CORPO};font-size:12px;line-height:1.6;color:${TERCIARIO};word-break:break-all">Ou copie e cole: ${href}</p>`
          : ""
      }`;
}

/**
 * A casca. Documento inteiro, porque o preheader precisa ser o primeiro nó
 * dentro do `<body>` — antes de qualquer tabela, senão a prévia da caixa de
 * entrada pega o cabeçalho.
 *
 * `permitirDoisBotoes` existe para um caso só: o lembrete de RSVP do desenho,
 * com "vou" e "não vou". Fora dele, dois botões de tinta é defeito — o e-mail
 * tem uma ação, e duas ações com o mesmo peso não têm nenhuma. A guarda só
 * roda fora de produção: é erro de quem escreve o e-mail, não do casal que o
 * recebe, e derrubar um envio real por isso seria trocar um defeito visual
 * por um funcional.
 */
export function layout({
  titulo,
  linhaDaCaixa,
  corpo,
  antesDoTitulo = "",
  permitirDoisBotoes = false,
}: {
  titulo: string;
  /** O preheader. Obrigatório de propósito — ver `preheader()`. */
  linhaDaCaixa: string;
  corpo: string;
  /**
   * `<tr>` que entram entre o cabeçalho e o título, sem o recuo de 40px do
   * miolo — a faixa de foto do modelo 04 precisa alcançar as bordas dos
   * 600px. Vem como linha de tabela e não como bloco solto porque este é o
   * único jeito de sangrar até a borda num HTML que o Outlook desenha.
   */
  antesDoTitulo?: string;
  permitirDoisBotoes?: boolean;
}): string {
  const botoes = corpo.split(`bgcolor="${TINTA}"`).length - 1;
  if (botoes > 1 && !permitirDoisBotoes && process.env.NODE_ENV !== "production") {
    throw new Error(
      `E-mail "${titulo}" tem ${botoes} botões de tinta. Um e-mail tem uma ação — se os dois são mesmo necessários, passe permitirDoisBotoes: true.`
    );
  }

  const base = baseUrlEstatica();

  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${titulo}</title></head>
<body style="margin:0;padding:0;background:${FUNDO}">
  ${preheader(linhaDaCaixa)}
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="${FUNDO}" style="width:100%;background:${FUNDO}">
    <tr><td align="center" style="padding:24px 12px">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" bgcolor="${PAPEL}" style="width:600px;max-width:100%;background:${PAPEL};border:1px solid ${BORDA}">
        <tr><td style="padding:24px 40px;border-bottom:1px solid ${FIO}">
          <img src="${base}/logo-enlace.png" alt="Enlace" height="26" style="height:26px;width:auto;border:0;display:block">
        </td></tr>
        ${antesDoTitulo}
        <tr><td style="padding:32px 40px;font-family:${F_CORPO};color:#3d4a36">
          <h1 style="margin:0 0 16px;font-family:${F_DISPLAY};font-size:24px;line-height:1.3;font-weight:400;color:${TINTA}">${titulo}</h1>
          ${corpo}
        </td></tr>
        ${rodape(base)}
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/**
 * Versão em texto puro: sem ela o Gmail marca o e-mail como suspeito.
 *
 * O `<head>` e o preheader saem antes de tudo. O preheader é a linha da caixa
 * de entrada; deixá-lo aqui faria a versão em texto abrir repetindo a si
 * mesma, com 120 caracteres invisíveis de brinde.
 */
export function toPlainText(html: string): string {
  return html
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<div data-preheader="1"[\s\S]*?<\/div>/gi, "")
    .replace(/<a [^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi, "$2: $1")
    .replace(/<\/(p|div|h1|h2|td|tr)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&middot;/g, "·")
    .replace(/&#8199;|&#65279;|&nbsp;/g, " ")
    /* As entidades voltam a ser caracteres. Sem isto, um casal chamado
       "Ana & Pedro" lia "Ana &amp; Pedro" na versão em texto — que é a que
       alguns clientes mostram. `&amp;` por último, senão `&amp;lt;` viraria
       `<`. */
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

export async function send(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  const transport = emailTransport();

  if (transport === "gmail") {
    await gmailTransporter().sendMail({
      from: FROM,
      to,
      subject,
      html,
      text: toPlainText(html),
    });
    return;
  }

  if (transport === "none") {
    throw new Error(
      "Nenhum transporte de e-mail configurado (GMAIL_APP_PASSWORD ou RESEND_API_KEY)."
    );
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend respondeu ${res.status}: ${detail}`);
  }
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<void> {
  await send(
    to,
    "Redefinir sua senha — Enlace",
    layout({
      titulo: "Redefinir sua senha",
      linhaDaCaixa: "O link vale por 1 hora.",
      corpo: `<p style="font-size:14px;line-height:1.6;color:#5a624f">
        Recebemos um pedido para redefinir a senha da sua conta. Clique no
        botão abaixo — o link vale por 1 hora. Se não foi você, pode ignorar
        este e-mail com tranquilidade.
      </p>
      ${button(resetUrl, "Redefinir senha")}`,
    })
  );
}

/**
 * "A prévia está pronta" — o e-mail que transforma "enviei o pedido" em
 * "recebi meu site". Sem ele o casal só descobre a prévia se voltar à tela
 * por conta própria (item 2 dos próximos passos do PLANNING).
 */
export async function sendPreviewReadyEmail(
  to: string,
  name: string,
  previewUrl: string,
  painelUrl: string
): Promise<void> {
  await send(
    to,
    "A prévia do site de vocês está pronta 💚",
    layout({
      titulo: "A prévia está pronta!",
      linhaDaCaixa: "Montamos o site de vocês. Abram para ver como ficou.",
      corpo: `<p style="font-size:14px;line-height:1.6;color:#5a624f">
        Oi, ${escaparHtml(name)}! Montamos o site de vocês com o que veio no pedido. Abram
        para ver como ficou.
      </p>
      ${button(previewUrl, "Ver a prévia do site")}
      <p style="font-size:13px;line-height:1.6;color:#5a624f">
        Dá para trocar textos, datas e locais, escolher o que aparece e subir
        as fotos direto no painel — e a mudança aparece no site na hora:<br>
        <a href="${painelUrl}" style="color:#3d4a36">${painelUrl}</a>
      </p>
      <p style="font-size:12px;color:#a8a39a">
        Este link é só de vocês: o site ainda não está público. Ele vai ao ar
        depois da confirmação do pagamento.
      </p>`,
    })
  );
}

export async function sendEmailVerification(
  to: string,
  name: string,
  verifyUrl: string
): Promise<void> {
  await send(
    to,
    "Confirmem o e-mail de vocês — Enlace",
    layout({
      titulo: "Falta só confirmar o e-mail",
      linhaDaCaixa: "O link vale por 24 horas.",
      corpo: `<p style="font-size:14px;line-height:1.6;color:#5a624f">
        Oi, ${escaparHtml(name)}! A conta de vocês na Enlace foi criada. Clique no botão
        para confirmar que este e-mail é de vocês — é por ele que a gente
        avisa quando a prévia do site ficar pronta. O link vale por 24 horas.
      </p>
      ${button(verifyUrl, "Confirmar meu e-mail")}
      <p style="font-size:12px;color:#a8a39a">Se não foi você quem criou a conta, é só ignorar este e-mail.</p>`,
    })
  );
}

/* ==========================================================================
   Os dois e-mails do fim do funil — modelos 03 e 04 da prancha de e-mails.

   Eles não existiam, e o buraco era o pior tipo: `publishSiteForOrder` põe o
   site no ar por três caminhos (SDD §7.2) e NENHUM avisava ninguém. O casal
   pagava, o site entrava no ar, e ele só descobria se voltasse ao painel por
   conta própria. Com o webhook do AbacatePay desligado
   (`ABACATEPAY_WEBHOOK_SECRET` vazio), esse silêncio era o caminho mais
   provável, não a exceção.
   ========================================================================== */

/** Data no formato de Voz V5 (`19 Set 2026`), no fuso do SITE. */
function dataCurta(quando: Date, timezone: string): string {
  /* O fuso do site e não o do servidor: um pagamento às 22h de 19/09 em
     Fortaleza vira 20/09 em UTC, e o recibo diria um dia depois do que o
     extrato do casal diz. */
  const partes = new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).formatToParts(quando);
  const p = (t: string) => partes.find((x) => x.type === t)?.value ?? "";
  const mes = p("month").replace(".", "");
  return `${p("day")} ${mes.charAt(0).toUpperCase()}${mes.slice(1)} ${p("year")}`;
}

function linhaDaTabela(rotulo: string, valor: string, forte = false): string {
  return `<tr>
            <td style="padding:9px 0;border-bottom:1px solid #e8e2d5;font-family:${F_CORPO};font-size:13px;color:${TERCIARIO}">${rotulo}</td>
            <td align="right" style="padding:9px 0;border-bottom:1px solid #e8e2d5;font-family:${F_DADO};font-size:${forte ? "16px;font-weight:500" : "13px"};color:${TINTA}">${valor}</td>
          </tr>`;
}

/**
 * Modelo 03 · o recibo.
 *
 * Só sai quando o pagamento está confirmado de verdade — publicar por
 * cortesia pelo admin não gera recibo, porque não houve pagamento e um
 * "Pagamento confirmado" ali seria mentira com carimbo.
 */
export async function sendReciboEmail(
  to: string,
  dados: {
    /** Identificador curto e legível do pedido. */
    numero: string;
    pacote: string;
    total: string;
    pagoEm: Date;
    timezone: string;
    painelUrl: string;
  }
): Promise<void> {
  const quando = `${dataCurta(dados.pagoEm, dados.timezone)} · Pix`;

  await send(
    to,
    `Pagamento confirmado · pedido #${dados.numero}`,
    layout({
      titulo: "Está tudo certo",
      linhaDaCaixa: `${dados.total} · ${dados.pacote}. Seu site já está no ar.`,
      corpo: `<p style="margin:0 0 14px;font-family:${F_DADO};font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#2f6b4f">Pagamento confirmado</p>
      <p style="font-size:14px;line-height:1.6;color:#5a624f">
        Recebemos seu pagamento e o site de vocês já está no ar.
      </p>
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width:100%;margin:22px 0">
        ${linhaDaTabela("Pedido", `#${dados.numero}`)}
        ${linhaDaTabela("Pacote", dados.pacote)}
        ${linhaDaTabela("Pago em", quando)}
        ${linhaDaTabela("Total", dados.total, true)}
      </table>
      ${button(dados.painelUrl, "Ver meu site")}
      <p style="font-size:12px;line-height:1.6;color:${TERCIARIO}">
        Guarde este e-mail como comprovante. Precisa de nota fiscal? Responda
        esta mensagem.
      </p>`,
    })
  );
}

/**
 * Modelo 04 · "o site de vocês está no ar".
 *
 * Sem emoji no assunto, contra o artboard. A prancha de Voz V5 é literal:
 * *"Emoji: só em e-mail para convidado e em texto que o casal escreve. Nunca
 * em rótulo, botão, estado de erro ou no admin."* Assunto de transacional é
 * rótulo, e quando a tela e a Fundação discordam a Fundação vence.
 */
export async function sendSiteNoArEmail(
  to: string,
  dados: {
    nomes: string;
    /** Endereço público completo, com protocolo. */
    siteUrl: string;
    /** `/f/<id>` absoluto da foto de capa, ou `null`. */
    capaUrl: string | null;
  }
): Promise<void> {
  const endereco = dados.siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const nomes = escaparHtml(dados.nomes);

  /* Com foto, a faixa; sem foto, o cartão tipográfico em papel — nunca um
     retângulo quebrado. Mesma queda que o cartão de link já faz
     (`lib/site/ogImagem.tsx`) e que a prancha I3 escreve.

     Nos dois casos os NOMES são texto de verdade, não pixels: metade dos
     clientes de e-mail bloqueia imagem por padrão, e a mensagem tem que
     funcionar inteira sem ela. */
  const faixa = dados.capaUrl
    ? `<tr><td style="padding:0;position:relative">
            <img src="${dados.capaUrl}" alt="Foto de ${nomes}" width="600" height="170" style="display:block;width:100%;height:170px;object-fit:cover;border:0">
          </td></tr>
          <tr><td align="center" style="padding:18px 40px 0;font-family:${F_DISPLAY};font-size:26px;color:${TINTA}">${nomes}</td></tr>`
    : `<tr><td align="center" style="padding:44px 40px;background:${PAPEL};border-bottom:1px solid ${FIO};font-family:${F_DISPLAY};font-size:30px;color:${TINTA}">${nomes}</td></tr>`;

  await send(
    to,
    "O site de vocês está no ar",
    layout({
      titulo: "Está no ar!",
      linhaDaCaixa: `${endereco} — hora de compartilhar.`,
      antesDoTitulo: faixa,
      corpo: `<p style="font-size:14px;line-height:1.6;color:#5a624f">
        O site de vocês saiu da prévia. Qualquer pessoa com o endereço abaixo
        já consegue abrir, confirmar presença e ver a lista de presentes.
      </p>
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width:100%;margin:20px 0">
        <tr><td align="center" style="padding:16px;background:#ffffff;border:1px solid ${FIO};font-family:${F_DADO};font-size:15px;color:${TINTA}">
          <a href="${dados.siteUrl}" style="color:${TINTA};text-decoration:none">${endereco}</a>
        </td></tr>
      </table>
      ${button(
        `https://wa.me/?text=${encodeURIComponent(`O site do nosso casamento está no ar: ${dados.siteUrl}`)}`,
        "Compartilhar no WhatsApp",
        false
      )}
      <p style="font-size:13px;line-height:1.6;color:#5a624f">
        Ainda dá para editar tudo — fotos, textos e presentes — pelo painel, a
        qualquer momento.
      </p>`,
    })
  );
}
