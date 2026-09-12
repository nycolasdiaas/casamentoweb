import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import { getRsvpViewBySlug, listGroupSlugs } from "@/lib/repositories/groups";
import ConfirmacaoDePresenca from "@/components/site/ConfirmacaoDePresenca";
import TrackView from "@/components/TrackView";
import { uiPrensa } from "@/lib/fonts/ui";
import { prazoVencido, prazoPorExtenso } from "@/lib/site/prazoRsvp";
import { dataPorExtenso } from "@/lib/site/dataLegivel";

/**
 * F4 · confirmação de presença. **A rota com gente real.**
 *
 * 23 confirmações e links já no WhatsApp (regras §2.5). Três coisas que esta
 * página faz de propósito e não podem ser "simplificadas":
 *
 * 1. **O slug nunca muda de significado.** `getRsvpViewBySlug` busca global,
 *    sem `siteId`, porque o link do convidado não carrega o site.
 * 2. **Prazo vencido é 200, não 404.** A prancha H é explícita: o link está
 *    certo, o que fechou foi a lista. Um 404 faria o convidado achar que
 *    errou o endereço e guardar o link em vez de falar com os noivos.
 * 3. **Nada aqui é indexável.** O convite é de quem tem o link.
 *
 * ── O que saiu ─────────────────────────────────────────────────────────────
 *
 * O `<SaveTheDate />` que abria a tela era um JPEG chumbado de UM casal —
 * `/save-the-date.jpeg`, com "Isabelle e Nycolas" até no `alt`. Num produto
 * multi-tenant isso significa que o convidado de qualquer outro casamento
 * abriria o link e veria a capa do casamento errado. Hoje ninguém é atingido
 * (os 23 grupos são do site legado), e é justamente por isso que a hora de
 * tirar é antes do segundo casal, não depois.
 */

export const metadata: Metadata = {
  title: "Confirmar presença",
  robots: { index: false, follow: false },
};

export async function generateStaticParams() {
  const slugs = await listGroupSlugs();
  // Cache Components exige ao menos um param declarado; sem isso o
  // `notFound()` cairia dentro do shell já enviado e devolveria HTTP 200.
  if (slugs.length === 0) return [{ slug: "__sem-grupos__" }];
  return slugs.map((slug) => ({ slug }));
}

export default async function RsvpPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  /* O `notFound()` fica AQUI FORA, e é de propósito.
     `getRsvpViewBySlug` é `"use cache"`, então ler daqui é permitido sem
     `<Suspense>` — e é o que faz um slug inventado devolver 404 de verdade,
     antes de qualquer byte da tela sair. Dentro do limite, o shell já teria
     sido enviado e o Next devolveria 200 com "não encontrado" no meio. */
  const { slug } = await params;
  const view = await getRsvpViewBySlug(slug);
  if (!view) notFound();

  return (
    <main
      className={`${uiPrensa} flex-1 flex flex-col items-center justify-center bg-(--c-paper-warm) px-6 py-16 text-(--c-ink)`}
    >
      {/* Sem site resolvido, NÃO conta a visita.

          Aqui havia `?? LEGACY_SITE_SLUG`: um grupo cujo `leftJoin` com
          `sites` viesse vazio tinha a abertura do RSVP contabilizada no
          casamento legado — o número ia para o balde de outro casal, em
          silêncio. Métrica errada é pior que métrica faltando: a faltante
          alguém investiga, a errada alguém usa para decidir.

          Hoje o caso é raro (todo grupo tem site), e é justamente por isso
          que o fallback passaria despercebido pelo tempo que fosse. */}
      {view.siteSlug && (
        <TrackView siteSlug={view.siteSlug} kind="rsvp_open" />
      )}

      {/* A DECISÃO DE PRAZO É POR PEDIDO, o resto da rota não precisa ser.

          `prazoVencido` compara com o dia de HOJE, e com Cache Components ler a
          hora durante o prerender é erro de build ("used `new Date()` before
          accessing ... Request data"). A regra existe por um bom motivo: a
          decisão congelaria no momento do build, e um site gerado em agosto
          abriria em outubro dizendo que o prazo ainda está aberto.

          A saída é isolar só o que depende da hora. `connection()` dentro do
          limite marca ESTE pedaço como dinâmico; o resto da página — incluindo
          o 404 acima — segue prerenderável, e a ida ao banco continua em cache.

          Mesma decisão, pelo mesmo motivo, em `FaixaDoCasamento.tsx`. */}
      <Suspense fallback={<Esqueleto />}>
        <PortaoDoPrazo view={view} slug={slug} />
      </Suspense>
    </main>
  );
}

/**
 * Decide entre o formulário e a tela de prazo encerrado.
 *
 * Existe como componente só para carregar o `connection()` — é ele que diz ao
 * Next que daqui para baixo o render acontece a cada pedido.
 */
async function PortaoDoPrazo({
  view,
  slug,
}: {
  view: NonNullable<Awaited<ReturnType<typeof getRsvpViewBySlug>>>;
  slug: string;
}) {
  await connection();

  const fechado = prazoVencido(view.rsvpDeadline, view.timezone ?? undefined);
  const dataDoCasamento = view.weddingDate
    ? dataPorExtenso(view.weddingDate.toISOString().slice(0, 10))
    : null;
  const linkDoSite =
    view.siteStatus === "published" && view.siteSlug
      ? `/s/${view.siteSlug}`
      : null;

  if (fechado) {
    return (
      <PrazoEncerrado
        nomesDoCasal={view.coupleNames}
        prazo={prazoPorExtenso(view.rsvpDeadline, true)}
        dataDoCasamento={dataDoCasamento}
        local={view.ceremonyVenue}
        linkDoSite={linkDoSite}
      />
    );
  }

  return (
    <ConfirmacaoDePresenca
      slug={slug}
      nomesDoCasal={view.coupleNames}
      /* O RÓTULO DO GRUPO NÃO VEM PARA CÁ.
       *
       * O painel pede esse nome dizendo, embaixo do campo: "Do jeito que vocês
       * chamam eles. Só vocês veem este nome." E ele aparecia aqui, em caixa
       * alta, no título: "Família Souza — tios da noiva, vocês vêm?" (UX-008).
       *
       * Um casal que confie na frase escreve o que quiser — "os chatos do
       * trabalho", "tios que ninguém aguenta" — e manda o link no WhatsApp da
       * família. O constrangimento seria criado pela promessa do próprio
       * produto.
       *
       * Entre mudar a promessa e cumpri-la, cumprir custa uma saudação menos
       * pessoal; mudar custa a confiança de quem já preencheu. O convidado
       * chegou por um link pessoal: ele sabe que o convite é dele. */
      // `Math.max(…, 1)`: grupo com zero lugares é dado incompleto, não um
      // grupo que não pode responder. Um contador travado em 0 é um beco.
      lugares={Math.max(view.seats, 1)}
      jaRespondeu={
        view.seatsConfirmed === null
          ? null
          : {
              lugares: view.seatsConfirmed,
              nomes: view.attendingNames,
              recado: view.message,
            }
      }
      prazo={prazoPorExtenso(view.rsvpDeadline)}
      linkDoSite={linkDoSite}
      linkDaAgenda={view.weddingDate ? `/api/agenda/${slug}` : null}
      dataDoCasamento={dataDoCasamento}
    />
  );
}

/**
 * O que aparece enquanto o servidor decide se o prazo venceu.
 *
 * Silhueta, não spinner: a espera aqui é de milissegundos, e um indicador
 * girando por um piscar de olhos chama mais atenção para si do que a tela que
 * está chegando. As medidas acompanham a tela real para não haver pulo.
 */
function Esqueleto() {
  return (
    <div
      className="w-full max-w-[560px] flex flex-col items-center gap-4"
      aria-hidden="true"
    >
      <div className="motion-skeleton h-4 w-32 rounded-[2px]" />
      <div className="motion-skeleton h-3 w-44 rounded-[2px]" />
      <div className="motion-skeleton mt-3 h-11 w-72 rounded-[2px]" />
      <div className="mt-4 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="motion-skeleton h-[88px] rounded-[3px]" />
        <div className="motion-skeleton h-[88px] rounded-[3px]" />
      </div>
    </div>
  );
}

/**
 * H3 · as confirmações já fecharam.
 *
 * Não usa `BecoComSaida` de propósito: aquele componente é a casca da ENLACE
 * (logo, marca, "Ir para a Enlace") e existe para o caso em que não há
 * casamento a mostrar. Aqui o casamento existe e está de pé — a tela é dele, e
 * a marca da plataforma no meio dessa conversa é exatamente o que a Voz e
 * Microcopy V2 manda evitar ("aqui a Enlace desaparece").
 *
 * O que a prancha H exige e está aqui: o código do erro em Meta pequeno (nunca
 * como manchete), o texto que não culpa ninguém, e uma saída — que não é um
 * beco.
 */
function PrazoEncerrado({
  nomesDoCasal,
  prazo,
  dataDoCasamento,
  local,
  linkDoSite,
}: {
  nomesDoCasal: string | null;
  prazo: string | null;
  dataDoCasamento: string | null;
  local: string | null;
  linkDoSite: string | null;
}) {
  return (
    <div className="w-full max-w-[560px] flex flex-col items-center text-center">
      {nomesDoCasal && (
        <p className="t-display text-[24px] leading-none text-(--c-ink)">
          {nomesDoCasal}
        </p>
      )}
      <span
        className="my-6 block h-px w-11 bg-(--c-rule)"
        aria-hidden="true"
      />

      <p className="meta text-(--c-warn)">
        {prazo ? `Prazo encerrado em ${prazo}` : "Prazo encerrado"}
      </p>

      <h1 className="t-d1 mt-4 max-w-[20ch] text-(--c-ink)">
        As confirmações já fecharam
      </h1>

      <p className="t-corpo mt-4 max-w-[48ch] text-(--c-ink-2)">
        Os noivos precisaram fechar a lista para acertar os últimos detalhes. Se
        você ainda quer ir, ainda dá — mas fale direto com eles.
      </p>

      {linkDoSite && (
        <div className="mt-8">
          <Link href={linkDoSite} className="btn btn-ink btn-g">
            Ver o site do casamento
          </Link>
        </div>
      )}

      {(dataDoCasamento || local) && (
        <div className="mt-10 w-full border-t border-(--c-rule) pt-6">
          <p className="meta text-(--c-ink-2)">
            {[dataDoCasamento, local].filter(Boolean).join(" · ")}
          </p>
        </div>
      )}
    </div>
  );
}
