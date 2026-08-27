import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getConvitePublicado,
  getConviteDespublicado,
  listPublishedInviteSlugs,
} from "@/lib/repositories/siteInvites";
import ConviteVisual from "@/components/site/ConviteVisual";
import { baseUrlEstatica } from "@/lib/baseUrl";
import BecoComSaida from "@/components/site/BecoComSaida";
import { dataPorExtenso } from "@/lib/site/dataLegivel";
import { getSiteViewBySlug } from "@/lib/repositories/siteView";
import { versaoDoCartao, DESCRICAO_DO_CONVITE } from "@/lib/site/cartaoDeLink";

/**
 * O convite como PÁGINA — `/c/<slug>`.
 *
 * ── Por que uma página, e não só um arquivo ────────────────────────────────
 *
 * O convite nasceu como imagem para baixar, e o casal descobriu o limite na
 * prática: num PNG o botão "Lista de presentes" é desenho, não botão. No PDF
 * dá para anotar um link, mas o convidado precisa baixar o arquivo, abrir num
 * leitor e clicar — três passos numa conversa de WhatsApp.
 *
 * Aqui é HTML: o casal manda o LINK, o convidado abre e os botões levam
 * mesmo à confirmação e à lista de presentes. O download continua existindo
 * para quem quer imprimir.
 *
 * ── `generateStaticParams` ─────────────────────────────────────────────────
 *
 * Como em `/s/[slug]`: com Cache Components, sem ele o `notFound()` cairia
 * dentro do shell já enviado e devolveria HTTP 200 em vez de 404.
 */

export async function generateStaticParams() {
  const slugs = await listPublishedInviteSlugs();
  if (slugs.length === 0) return [{ slug: "__sem-convites__" }];
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const achado = await getConvitePublicado(slug);
  if (!achado) return { title: "Convite" };

  // O primeiro texto do convite costuma ser o nome do casal — é o que faz
  // sentido aparecer na prévia do WhatsApp.
  const primeiroTexto = achado.convite.doc.blocos.find(
    (b) => b.tipo === "texto" && b.texto.trim()
  );
  const nomes =
    primeiroTexto && primeiroTexto.tipo === "texto"
      ? primeiroTexto.texto.trim()
      : "Nosso casamento";

  /* S1 · o cartão de link do convite.
     O `?v=` versiona pelo conteúdo do convite: republicar com outro desenho
     troca o endereço da imagem, e o WhatsApp — que guarda o cartão por dias e
     não revalida — passa a mostrar o novo. */
  /* O conteúdo vem da VIEW CACHEADA, não de `getSiteContent`.
     `getSiteContent` é sem cache de propósito (quem acabou de salvar precisa
     ver o próprio texto), e dado não cacheado dentro de `generateMetadata`
     torna a rota dinâmica — o build reprova com "generateMetadata that depends
     on ... uncached external data when the rest of the route does not".
     `getSiteViewBySlug` já traz o mesmo conteúdo, com tag e invalidação. */
  const doSite = await getSiteViewBySlug(achado.siteSlug);
  const conteudo = doSite?.content ?? null;
  const versao = versaoDoCartao({
    coupleNames: conteudo?.coupleNames ?? nomes,
    weddingDate: conteudo?.weddingDate ?? null,
    ceremonyVenue: conteudo?.ceremonyVenue ?? null,
    fotoDeCapaId: achado.convite.updatedAt?.toISOString() ?? null,
  });

  return {
    title: `${nomes} | Convite`,
    description: DESCRICAO_DO_CONVITE,
    // Convite não é conteúdo de busca: quem tem o link, tem o convite.
    robots: { index: false, follow: false },
    openGraph: {
      type: "website",
      title: conteudo?.coupleNames?.trim()
        ? `${conteudo.coupleNames.trim()} convidam você`
        : "Você está convidado",
      description: DESCRICAO_DO_CONVITE,
      url: `/c/${slug}`,
      images: [
        {
          url: `/c/${slug}/opengraph-image?v=${versao}`,
          width: 1200,
          height: 630,
          alt: "Convite de casamento",
        },
      ],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function ConvitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const achado = await getConvitePublicado(slug);

  /* H2 · o convite existiu e saiu do ar.
     `notFound()` aqui mentiria: 404 diz "esse endereço nunca existiu", e o
     convidado que recebeu o link conclui que digitou errado, guarda o link e
     não volta. O que aconteceu foi outra coisa — os noivos despublicaram — e
     o casamento provavelmente continua de pé.

     Por isso a tela é renderizada AQUI, e não no `not-found.tsx`: só neste
     ponto o slug está em mãos, e sem ele não dá para dizer de que casamento
     se trata. É a limitação que o comentário antigo do `not-found` registrava
     como impedimento; a saída foi uma consulta que distingue os dois casos. */
  if (!achado) {
    const desativado = await getConviteDespublicado(slug);
    if (desativado) return <ConviteForaDoAr {...desativado} />;
    notFound();
  }

  const { doc } = achado.convite;
  /* `baseUrlEstatica` e não `getBaseUrl`: esta rota é cacheada, e ler o header
     da requisição a tornaria dinâmica — o que o comentário de `baseUrl.ts` já
     documenta para o cartão de link. O destino do botão é o mesmo para todo
     convidado. */
  const base = baseUrlEstatica();

  return (
    <main
      className="flex min-h-screen items-center justify-center p-4"
      style={{ background: doc.fundo }}
    >
      {/* A largura acompanha a proporção do convite: um story 9:16 não pode
          nascer com a largura de um retrato e sair do rodapé. */}
      <div
        className="w-full"
        style={{ maxWidth: `min(100%, calc(92svh * ${doc.largura / doc.altura}))` }}
      >
        <ConviteVisual doc={doc} slug={achado.siteSlug} baseUrl={base} />
      </div>
    </main>
  );
}

/**
 * H2 · o convite não está mais disponível.
 *
 * A regra da prancha H que esta tela existe para cumprir: **quando o site
 * existe mas o convite não, sempre oferecer o site do casamento**. Sem isso o
 * convidado conclui que o casamento foi cancelado — que é a leitura natural de
 * "não encontrado" para quem recebeu um convite.
 *
 * ── Sobre o status HTTP ────────────────────────────────────────────────────
 *
 * A prancha pede **410** aqui (contra 404 em H1). O App Router não expõe API
 * para uma página devolver 410: `notFound()` é 404 e `redirect()` é 307/308.
 * Fazer isso exigiria repetir a consulta no `proxy.ts` — duas fontes para a
 * mesma decisão, e a do proxy sem cache.
 *
 * Fica em 200, e o custo real disso é pequeno: o motivo do 410 é dizer a
 * buscador e cache que o recurso morreu, e a rota é `noindex` desde sempre. O
 * que importa para quem está do outro lado — dizer o que houve, não culpar, e
 * oferecer saída — está inteiro. Registrado como divergência conhecida.
 */
function ConviteForaDoAr({
  siteSlug,
  siteNoAr,
  nomesDoCasal,
  weddingDate,
  cidade,
}: {
  siteSlug: string;
  siteNoAr: boolean;
  nomesDoCasal: string | null;
  weddingDate: Date | null;
  cidade: string | null;
}) {
  const data = weddingDate
    ? dataPorExtenso(weddingDate.toISOString().slice(0, 10))
    : null;

  return (
    <BecoComSaida
      codigo="Convite indisponível"
      titulo="Este convite não está mais disponível"
      saidaPrincipal={
        siteNoAr
          ? { rotulo: "Ir para o site do casamento", href: `/s/${siteSlug}` }
          : { rotulo: "Ir para a Enlace", href: "/" }
      }
      rodape="Acha que é engano? Fale direto com os noivos — eles geram um convite novo em segundos."
      cartao={
        /* O cartão só aparece quando há casamento no ar E nome para mostrar.
           Um cartão com "—" no lugar do nome do casal é pior que nenhum: ele
           promete uma informação e entrega um traço. */
        siteNoAr && nomesDoCasal ? (
          <div className="surface-raised mt-6 w-full max-w-[460px] rounded-[3px] p-6 text-left">
            <p className="meta text-(--c-ink-2)">O casamento</p>
            <p className="t-d3 mt-2 text-(--c-ink)">{nomesDoCasal}</p>
            {(data || cidade) && (
              <p className="t-corpo-p mt-1 text-(--c-ink-2)">
                {[data, cidade].filter(Boolean).join(" · ")}
              </p>
            )}
            <Link
              href={`/s/${siteSlug}`}
              className="btn btn-ink mt-5 w-full text-center"
            >
              Ir para o site do casamento
            </Link>
          </div>
        ) : undefined
      }
    >
      <p>
        Os noivos podem ter atualizado o link ou tirado o convite do ar por
        enquanto.
        {siteNoAr ? " O site do casamento continua funcionando." : ""}
      </p>
    </BecoComSaida>
  );
}
