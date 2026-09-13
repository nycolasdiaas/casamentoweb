import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import BuscaDeConvite, { type BuscaState } from "@/components/site/BuscaDeConvite";
import type { Metadata } from "next";
import {
  getSiteViewBySlug,
  listPublishedSiteSlugs,
} from "@/lib/repositories/siteView";
import { findGroupByGuestName } from "@/lib/repositories/findGroupByGuestName";
import { saudacaoDeConvidados } from "@/lib/site/saudacao";
import { getRsvpViewBySlug } from "@/lib/repositories/groups";
import { dataPorExtenso } from "@/lib/site/dataLegivel";
import { resolveTheme, type ThemeSpec } from "@/lib/theme/spec";
import { themePresetFor } from "@/lib/theme/presets";

/**
 * F2 · o convite pessoal do convidado — e a porta de entrada dele.
 *
 * A rota tem DOIS estados, e os dois são necessários:
 *
 * 1. **Sem `?grupo=`** — a busca por nome. Existe porque o problema real do
 *    convidado é que a mensagem sumiu na conversa; mandar ele escrever para o
 *    casal transfere trabalho para quem está casando, no mês do casamento,
 *    com dezenas de pessoas fazendo o mesmo.
 * 2. **Com `?grupo=`** — a página pessoal que a prancha F2 desenha: quantos
 *    lugares reservaram, o que ele já respondeu, e onde e quando é.
 *
 * Antes, a busca levava direto para `/rsvp/<slug>` — e o convidado caía no
 * formulário sem saber quantos lugares eram dele nem o que já tinha
 * respondido. As duas informações que ele mais quer estavam justamente na tela
 * que não existia.
 *
 * ── Por que `?grupo=` na URL não é vazamento ───────────────────────────────
 *
 * É o mesmo slug que já está no WhatsApp dele, em `/rsvp/<slug>`. O que a
 * rota NÃO faz é aceitar slug de outro casamento: `Conteudo` confere se o
 * grupo pertence a este site antes de mostrar qualquer coisa.
 *
 * ── Por que a busca é por nome COMPLETO e exato ────────────────────────────
 *
 * Ver `findGroupByGuestName`: busca parcial com lista de resultados
 * transformaria esta página na lista de convidados do casamento.
 *
 * ── Por que quase tudo mora dentro de `<Suspense>` ─────────────────────────
 *
 * `searchParams` é dado não cacheado, e com Cache Components lê-lo no corpo da
 * página trava a rota inteira: o `next build` reprova com "Uncached data was
 * accessed outside of <Suspense>". O `next dev` deixa passar — foi só no build
 * que apareceu. Então a casca (cores do tema) é estática, e o conteúdo entra
 * por streaming.
 */

export async function generateStaticParams() {
  const slugs = await listPublishedSiteSlugs();
  // Cache Components exige ao menos um param declarado — e é isso que permite
  // o notFound() abaixo devolver 404 de verdade.
  if (slugs.length === 0) return [{ slug: "__sem-sites__" }];
  return slugs.map((slug) => ({ slug }));
}

export const metadata: Metadata = {
  title: "Meu convite",
  robots: { index: false, follow: false },
};

type Cores = { paper: string; ink: string; accent: string };

export default async function MeuConvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  /* `nome` e `erro` saíram: o nome do convidado não volta mais pela URL,
     e sim pelo estado do formulário. Ver `BuscaDeConvite`. */
  searchParams: Promise<{ grupo?: string }>;
}) {
  const { slug } = await params;

  const view = await getSiteViewBySlug(slug);
  if (!view) notFound();

  const tema: ThemeSpec =
    (view.site.theme as ThemeSpec | null) ??
    resolveTheme(themePresetFor(view.site.templateId));
  const cores: Cores = {
    paper: tema.palette.paper,
    ink: tema.palette.ink,
    accent: tema.palette.accent,
  };

  return (
    <main
      className="flex min-h-screen flex-col items-center px-6 py-16"
      style={{ background: cores.paper, color: cores.ink }}
    >
      <Suspense
        fallback={
          <div
            className="mt-24 min-h-[180px] w-full max-w-[440px]"
            aria-hidden
            style={{
              background: `color-mix(in srgb, ${cores.ink} 6%, transparent)`,
            }}
          />
        }
      >
        <Conteudo
          slug={slug}
          siteId={view.site.id}
          cores={cores}
          nomesDoCasal={view.content?.coupleNames ?? null}
          ceremonia={{
            local: view.content?.ceremonyVenue ?? null,
            mapa: view.content?.ceremonyMapUrl ?? null,
          }}
          festa={{ local: view.content?.receptionVenue ?? null }}
          weddingDate={view.content?.weddingDate ?? null}
          searchParams={searchParams}
        />
      </Suspense>
    </main>
  );
}

/**
 * Decide entre a BUSCA e a PÁGINA PESSOAL.
 *
 * Um componente só porque os dois estados dependem de `searchParams`, e o
 * limite de `<Suspense>` precisa envolver o conjunto — inclusive o título, que
 * muda de "Encontrar meu convite" para "Olá, Família Costa".
 */
async function Conteudo({
  slug,
  siteId,
  cores,
  nomesDoCasal,
  ceremonia,
  festa,
  weddingDate,
  searchParams,
}: {
  slug: string;
  siteId: string;
  cores: Cores;
  nomesDoCasal: string | null;
  ceremonia: { local: string | null; mapa: string | null };
  festa: { local: string | null };
  weddingDate: Date | null;
  searchParams: Promise<{ nome?: string; erro?: string; grupo?: string }>;
}) {
  const { grupo } = await searchParams;

  if (grupo) {
    const convite = await getRsvpViewBySlug(grupo);

    /* O GRUPO TEM QUE SER DESTE CASAMENTO.
       Sem esta checagem, um `?grupo=` de outro site mostraria o convite de um
       convidado alheio dentro da moldura deste casal — vazamento por
       parâmetro de URL. Não vale mostrar erro: quem chega com slug de outro
       casamento provavelmente errou o link, e a busca é a saída certa. */
    if (convite && convite.siteId === siteId) {
      return (
        <PaginaPessoal
          slug={slug}
          cores={cores}
          convite={convite}
          ceremonia={ceremonia}
          festa={festa}
          weddingDate={weddingDate}
        />
      );
    }
  }

  async function procurar(
    _prev: BuscaState,
    formData: FormData
  ): Promise<BuscaState> {
    "use server";
    const digitado = String(formData.get("nome") ?? "");
    const achado = await findGroupByGuestName(siteId, digitado);

    /* Sem resultado, o nome volta pelo ESTADO do formulário — reescrever tudo
       é o que faz a pessoa desistir, mas devolvê-lo pela URL punha o nome
       completo de um convidado no log, no histórico e no `Referer`. */
    if (!achado) return { erro: true, nome: digitado };

    redirect(`/s/${slug}/meu-convite?grupo=${achado.slug}`);
  }

  return (
    <div className="w-full max-w-[440px] text-center">
      <p
        className="text-[11px] uppercase tracking-[0.26em]"
        style={{ color: cores.accent }}
      >
        Encontrar meu convite
      </p>

      <h1 className="mt-5 text-[26px] leading-tight">
        {nomesDoCasal ? `Casamento de ${nomesDoCasal}` : "Seu convite"}
      </h1>

      <p className="mt-4 text-[15px] leading-relaxed opacity-80">
        Escreva seu nome completo, como você acha que os noivos cadastraram. A
        gente te leva direto para o seu convite.
      </p>

      <BuscaDeConvite acao={procurar} cores={cores} />

      <Link
        href={`/s/${slug}`}
        className="mt-10 inline-block text-[13px] underline underline-offset-4 opacity-70 transition-opacity hover:opacity-100"
      >
        Voltar para o site do casamento
      </Link>
    </div>
  );
}

/**
 * A página pessoal — o desenho F2.
 *
 * ── Por que ela usa o tema do CASAL, e não a Prensa ────────────────────────
 *
 * É uma página do site do casamento, e ali a Enlace desaparece (Voz e
 * Microcopy V2). Cor e tipografia vêm do `ThemeSpec` do casal, como no resto
 * de `/s/<slug>`. O desenho mostra a coluna da direita em oliva porque oliva é
 * a cor daquele artboard; aqui ela é a tinta do casal, que é o equivalente
 * certo — um oliva fixo apareceria igual em seis estilos diferentes.
 */
function PaginaPessoal({
  slug,
  cores,
  convite,
  ceremonia,
  festa,
  weddingDate,
}: {
  slug: string;
  cores: Cores;
  convite: NonNullable<Awaited<ReturnType<typeof getRsvpViewBySlug>>>;
  ceremonia: { local: string | null; mapa: string | null };
  festa: { local: string | null };
  weddingDate: Date | null;
}) {
  const respondeu = convite.seatsConfirmed !== null;
  const vai = (convite.seatsConfirmed ?? 0) > 0;
  const lugares = Math.max(convite.seats, 1);
  const data = weddingDate
    ? dataPorExtenso(weddingDate.toISOString().slice(0, 10))
    : null;

  return (
    <div className="w-full max-w-[900px]">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
        <div>
          <p
            className="text-[11px] uppercase tracking-[0.26em]"
            style={{ color: cores.accent }}
          >
            Seu convite pessoal
          </p>

          <h1 className="mt-4 text-[32px] leading-tight lg:text-[42px]">
            {/* Sem o rótulo do grupo: o painel promete que só o casal o vê.
                Os NOMES dos convidados, sim — é o convidado lendo o próprio
                nome. Ver `lib/site/saudacao.ts` (UX-008). */}
            {saudacaoDeConvidados(convite.nomesDosConvidados)
              ? `Olá, ${saudacaoDeConvidados(convite.nomesDosConvidados)}`
              : "Olá!"}
          </h1>

          <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed opacity-80">
            Que alegria ter você com a gente. Reservamos{" "}
            <strong className="font-semibold opacity-100">
              {lugares} {lugares === 1 ? "lugar" : "lugares"}
            </strong>{" "}
            no seu nome.
          </p>

          <div
            className="mt-7 border p-6"
            style={{
              borderColor: `color-mix(in srgb, ${cores.ink} 18%, transparent)`,
              background: `color-mix(in srgb, ${cores.paper} 85%, white)`,
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] uppercase tracking-[0.2em] opacity-70">
                Sua resposta
              </span>
              <span
                className="px-2.5 py-1 text-[10.5px] uppercase tracking-[0.08em]"
                style={
                  respondeu && vai
                    ? { background: cores.accent, color: cores.paper }
                    : {
                        border: `1px solid color-mix(in srgb, ${cores.ink} 30%, transparent)`,
                      }
                }
              >
                {!respondeu ? "Aguardando" : vai ? "Confirmado" : "Não vai"}
              </span>
            </div>

            {respondeu ? (
              <div className="mt-5 flex flex-wrap items-end gap-8">
                <div>
                  <p className="text-[34px] leading-none">
                    {convite.seatsConfirmed}
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.16em] opacity-70">
                    {convite.seatsConfirmed === 1
                      ? "lugar confirmado"
                      : "lugares confirmados"}
                  </p>
                </div>
                {convite.attendingNames && (
                  <p className="max-w-[26ch] text-[14px] leading-relaxed opacity-80">
                    {convite.attendingNames}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-4 text-[14px] leading-relaxed opacity-80">
                Vocês ainda não responderam. É rapidinho.
              </p>
            )}

            <Link
              href={`/rsvp/${convite.slug}`}
              className="mt-5 inline-block text-[13px] underline underline-offset-4 opacity-80 transition-opacity hover:opacity-100"
            >
              {respondeu ? "Alterar minha resposta" : "Confirmar presença"}
            </Link>
          </div>
        </div>

        {/* O DIA — a coluna escura do desenho, na tinta do casal. */}
        <aside
          className="p-6"
          style={{ background: cores.ink, color: cores.paper }}
        >
          <p className="text-[11px] uppercase tracking-[0.2em] opacity-60">
            O dia
          </p>
          {data && <p className="mt-2 text-[22px] leading-tight">{data}</p>}

          <div className="mt-5 flex flex-col gap-4 text-[13.5px]">
            {ceremonia.local && (
              <div
                className="flex flex-col gap-1 border-b pb-4"
                style={{
                  borderColor: `color-mix(in srgb, ${cores.paper} 18%, transparent)`,
                }}
              >
                <span className="opacity-60">Cerimônia</span>
                <span>{ceremonia.local}</span>
              </div>
            )}
            {festa.local && (
              <div className="flex flex-col gap-1">
                <span className="opacity-60">Festa</span>
                <span>{festa.local}</span>
              </div>
            )}
          </div>

          {/* O botão do mapa só existe quando HÁ mapa. Um "Ver no mapa" que
              não abre nada é o beco que a prancha H proíbe. */}
          {ceremonia.mapa && (
            <a
              href={ceremonia.mapa}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 block w-full py-3 text-center text-[11.5px] uppercase tracking-[0.2em] transition-opacity hover:opacity-85"
              style={{ background: cores.paper, color: cores.ink }}
            >
              Ver no mapa
            </a>
          )}
        </aside>
      </div>

      <Link
        href={`/s/${slug}`}
        className="mt-10 inline-block text-[13px] underline underline-offset-4 opacity-70 transition-opacity hover:opacity-100"
      >
        Voltar para o site do casamento
      </Link>
    </div>
  );
}
