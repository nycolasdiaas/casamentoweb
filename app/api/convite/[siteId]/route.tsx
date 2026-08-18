import { ImageResponse } from "next/og";
import { getSessionUserId } from "@/lib/auth/userSession";
import { getSiteOwnedByUser } from "@/lib/repositories/sites";
import { getSiteContent } from "@/lib/repositories/siteContent";
import { toEditorValues } from "@/lib/site/contentFields";
import { themePresetFor } from "@/lib/theme/presets";
import type { ThemeSpec } from "@/lib/theme/spec";
import { getBaseUrl } from "@/lib/baseUrl";

/**
 * O CONVITE, como arquivo.
 *
 * É o buraco de produto que as capturas do iCasei revelaram: eles entregam uma
 * IMAGEM que o casal manda no grupo da família; a gente entregava um link. São
 * coisas diferentes — o link exige que o convidado clique e carregue um site,
 * a imagem aparece na conversa.
 *
 * ── Por que no servidor, e não no navegador ─────────────────────────────────
 *
 * A decisão que ficou aberta no protótipo. Escolhi servidor, com o
 * `ImageResponse` que o próprio Next já traz:
 *
 * - **Zero dependência nova.** A alternativa no cliente (html2canvas e
 *   parentes) são ~50 KB no bundle do painel para um botão que a maioria
 *   clica uma vez.
 * - **O resultado não depende do aparelho.** Captura no navegador varia com
 *   fonte instalada, densidade de tela e versão do motor: o mesmo convite
 *   sairia diferente no celular de cada casal. Aqui sai igual sempre.
 * - **Custa pouco.** É uma rota que roda quando alguém clica em baixar, não
 *   um serviço de pé.
 *
 * ── O que isto NÃO é ────────────────────────────────────────────────────────
 *
 * Não é o molde renderizado. O `ImageResponse` usa Satori, que entende um
 * subconjunto de CSS (flexbox sim, grid não) e não roda as fontes do catálogo
 * nem os ornamentos SVG dos moldes. Tentar reproduzir o molde aqui daria uma
 * imagem PARECIDA — e parecida é pior que assumidamente diferente: o casal
 * compararia com o site e veria os erros.
 *
 * Então este é um convite próprio, composto com a tinta e o acento do tema do
 * casal (que vêm do ThemeSpec, nunca de hex escrito aqui) e a tipografia
 * padrão. Ele conversa com o site sem fingir ser uma foto dele.
 *
 * 1080×1350 é o retrato 4:5 — o formato que WhatsApp e Instagram não cortam.
 */

const LARGURA = 1080;
const ALTURA = 1350;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;

  // O convite carrega nomes, data e local do casal: é dado do site, e sai
  // daqui só para quem é dono. Mesma trava das ações de escrita.
  const userId = await getSessionUserId();
  if (!userId) return new Response("Não autorizado", { status: 401 });

  const site = await getSiteOwnedByUser(siteId, userId);
  if (!site) return new Response("Não encontrado", { status: 404 });

  const [conteudo, baseUrl] = await Promise.all([
    getSiteContent(siteId),
    getBaseUrl(),
  ]);

  // `toEditorValues` e não uma leitura direta da linha: ele já traduz o
  // instante UTC para dia e hora NO FUSO DO SITE, e devolve hora vazia quando
  // é meia-noite (o combinado de "não informado"). Fazer a conversão de novo
  // aqui criaria um segundo caminho para a data — e é assim que a cerimônia
  // das 16h vira 19h no convite que já foi para o grupo da família.
  const v = toEditorValues(conteudo ?? null);

  const nomes = v.coupleNames.trim() || "Nosso casamento";

  const dataLonga = v.weddingDate
    ? new Date(`${v.weddingDate}T12:00:00`).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;
  const hora = v.weddingTime || null;
  const local = v.ceremonyVenue.trim() || null;

  // Sem data não há convite. Um "Save the Date" sem data é pior que nenhum
  // convite: a imagem sai bonita, com um vão no meio onde a data deveria
  // estar, e o casal só descobre depois de mandar no grupo da família.
  // Recusar aqui é o que permite ao painel dizer o que falta.
  if (!dataLonga) {
    return new Response("Sem data do casamento", { status: 409 });
  }

  // A paleta sai do tema salvo do casal. `resolveTheme` já validou os hex na
  // hora de salvar, mas a coluna é JSON: reconferir a forma aqui é barato, e
  // o preset do molde é a rede quando o site é antigo ou o tema veio torto.
  const salvo = site.theme as ThemeSpec | null;
  const paleta =
    salvo?.palette ?? themePresetFor(site.templateId ?? null).palette;
  const { paper: papel, ink: tinta, accent: acento } = paleta;

  const endereco = `${baseUrl.replace(/^https?:\/\//, "")}/s/${site.slug}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: papel,
          color: tinta,
          padding: 72,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flexGrow: 1,
            width: "100%",
            border: `2px solid ${acento}`,
            padding: 72,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 26,
              letterSpacing: 14,
              textTransform: "uppercase",
              color: acento,
            }}
          >
            Save the Date
          </div>

          <div
            style={{
              display: "flex",
              fontSize: nomes.length > 24 ? 84 : 108,
              lineHeight: 1.1,
              marginTop: 48,
              maxWidth: "100%",
            }}
          >
            {nomes}
          </div>

          <div
            style={{ width: 120, height: 2, background: acento, margin: "48px 0" }}
          />

          <div style={{ fontSize: 40, letterSpacing: 2 }}>{dataLonga}</div>
          {hora && (
            <div style={{ fontSize: 32, marginTop: 12, opacity: 0.75 }}>
              às {hora}
            </div>
          )}
          {local && (
            <div
              style={{
                display: "flex",
                fontSize: 32,
                marginTop: 32,
                opacity: 0.75,
                maxWidth: "100%",
              }}
            >
              {local}
            </div>
          )}
        </div>

        <div style={{ fontSize: 26, marginTop: 40, color: acento, letterSpacing: 2 }}>
          {endereco}
        </div>
      </div>
    ),
    {
      width: LARGURA,
      height: ALTURA,
      headers: {
        // Sem isto o celular ABRE a imagem numa aba em vez de salvar. O
        // `download` na âncora não basta: no iOS ele é ignorado, e é
        // justamente no celular que o casal vai mandar o convite no grupo.
        "Content-Disposition": `attachment; filename="convite-${site.slug}.png"`,
        // O convite muda quando o conteúdo muda. Cachear em CDN entregaria o
        // convite com a data velha para quem acabou de corrigi-la.
        "Cache-Control": "private, no-store",
      },
    }
  );
}
