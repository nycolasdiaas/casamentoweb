import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import BecoComSaida from "@/components/site/BecoComSaida";
import SiteFromView from "@/components/site/SiteFromView";
import SenhaDoSite from "@/components/site/SenhaDoSite";
import {
  getSiteViewBySlug,
  listPublishedSiteSlugs,
} from "@/lib/repositories/siteView";
import { getSiteAccess } from "@/lib/repositories/sites";
import { temCracha } from "@/lib/site/acessoDoSite";
import { listaDePresentesVisivel } from "@/lib/site/giftSection";

/**
 * A lista de presentes do casal, sozinha.
 *
 * É o link que o casal manda para quem só vai presentear: abre direto na
 * lista, sem a capa, a história e a galeria rolando junto. A âncora
 * `/s/<slug>#presentes` já levava ao lugar certo, mas trazia o site inteiro
 * atrás — e o casal queria mandar a lista, não o convite.
 *
 * ── É uma VIEW do site, não um produto à parte ─────────────────────────────
 *
 * Herda TODAS as guardas de `/s/<slug>`, e essa é a regra que sustenta a
 * rota (veredito de `regras-de-negocio`, 03/09/2026):
 *
 * 1. **Site não publicado responde igual** — mostrar a lista de um site em
 *    prévia ou arquivado seria publicá-lo pela porta dos fundos, com o Pix
 *    do casal dentro.
 * 2. **Site com senha pede senha** — é aqui que mora o meio de pagamento;
 *    deixar esta rota fora da tranca anularia a senha do site inteiro. O
 *    crachá é por site, então quem já entrou não digita de novo.
 * 3. **Pacote e interruptor da aba Páginas mandam** — quem filtra é o
 *    `SiteFromView`/`SiteRenderer`, que já cruzam `sectionsForTier` com o que
 *    o casal desligou. Desligar "Lista de presentes" no painel derruba este
 *    link também: um link que sobrevivesse ao interruptor seria um segundo
 *    interruptor invisível, e o casal só descobriria pelo convidado.
 *
 * O Pix vem de `loadGiftSection`, dentro da própria seção do molde — esta
 * rota não tem caminho próprio até a chave. Ver o comentário em
 * `lib/site/giftSection.ts`: um atalho ali já fez todo casal mostrar a chave
 * da mesma pessoa.
 */

/* Mesmos params de `/s/<slug>`: com Cache Components, uma rota dinâmica sem
   params declarados tenta prerenderizar um slug que não existe e o build
   reprova com "Uncached data was accessed outside of <Suspense>". */
export async function generateStaticParams() {
  const slugs = await listPublishedSiteSlugs();
  if (slugs.length === 0) return [{ slug: "__sem-sites__" }];
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const view = await getSiteViewBySlug(slug);
  const nomes = view?.content?.coupleNames;

  // Mesma guarda de `/s/<slug>`: sem site publicado, o título não anuncia
  // casamento nenhum — publicar pela aba do navegador continua sendo publicar.
  if (!view || !nomes || view.site.status !== "published") {
    return { title: "Lista de presentes", robots: { index: false, follow: false } };
  }

  return {
    title: `${nomes} | Lista de presentes`,
    description: `A lista de presentes do casamento de ${nomes}.`,
    // Convite não é conteúdo de busca.
    robots: { index: false, follow: false },
  };
}

export default async function PresentesDoSitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const view = await getSiteViewBySlug(slug);

  if (!view) notFound();

  if (view.site.status !== "published") {
    return <ForaDoAr />;
  }

  if (view.site.accessMode === "password") {
    return (
      <Suspense fallback={null}>
        <PortaoDeAcesso
          slug={slug}
          view={view}
          nomesDoCasal={view.content?.coupleNames ?? null}
        />
      </Suspense>
    );
  }

  return <SoPresentes view={view} slug={slug} />;
}

/**
 * Confere o crachá de quem já digitou a senha.
 *
 * Isolado porque lê `cookies()` — dado de pedido, que com Cache Components
 * exige um limite de `<Suspense>`. Mesmo desenho de `/s/<slug>`.
 */
async function PortaoDeAcesso({
  slug,
  view,
  nomesDoCasal,
}: {
  slug: string;
  view: NonNullable<Awaited<ReturnType<typeof getSiteViewBySlug>>>;
  nomesDoCasal: string | null;
}) {
  const acesso = await getSiteAccess(slug);
  const entrou = await temCracha(
    acesso?.id ?? view.site.id,
    acesso?.accessPasswordHash ?? null
  );

  if (!entrou) {
    return <SenhaDoSite slug={slug} nomesDoCasal={nomesDoCasal} />;
  }

  return <SoPresentes view={view} slug={slug} />;
}

/**
 * A lista, com o mínimo de contexto que um link de Pix precisa carregar.
 *
 * Os nomes do casal e a volta para o site não são enfeite: sem eles, um link
 * só-presentes chegando no WhatsApp é indistinguível de golpe — o convidado
 * não tem como saber de que casamento é a chave que vai pagar.
 *
 * O que NÃO está escrito aqui, por decisão do dono (03/09/2026): nada sobre
 * taxa ou sobre para onde o dinheiro vai. Falar de dinheiro numa tela de
 * presente é o tom que a própria aba Compartilhar evita.
 */
function SoPresentes({
  view,
  slug,
}: {
  view: NonNullable<Awaited<ReturnType<typeof getSiteViewBySlug>>>;
  slug: string;
}) {
  /* A seção pode estar desligada na aba Páginas, fora do pacote, ou o molde
     pode não desenhá-la. Nos três casos o link responde o mesmo que um site
     fora do ar — o interruptor do casal vale aqui como vale no site. */
  if (!listaDePresentesVisivel(view)) return <ForaDoAr />;

  const nomes = view.content?.coupleNames ?? null;

  return (
    <>
      {nomes && (
        <div className="flex flex-col items-center gap-1 px-6 pt-8 pb-2 text-center">
          <Link
            href={`/s/${slug}`}
            className="text-lg text-(--color-olive) no-underline"
          >
            {nomes}
          </Link>
          <Link
            href={`/s/${slug}`}
            className="text-xs text-(--color-muted) underline underline-offset-4"
          >
            ver o site do casamento
          </Link>
        </div>
      )}
      <SiteFromView view={view} slug={slug} apenas={["gifts"]} />
    </>
  );
}

/**
 * Site fora do ar, seção desligada ou fora do pacote — a mesma resposta para
 * os três, e sem nada do casal na tela.
 *
 * O 404 mentiria: o link está certo e vai voltar a funcionar. Nomes, foto ou
 * data aqui vazariam conteúdo de um site que não está público.
 */
function ForaDoAr() {
  return (
    <BecoComSaida
      codigo="Lista fora do ar por enquanto"
      titulo="Os noivos estão dando os retoques finais"
      saidaPrincipal={{ rotulo: "Ir para a Enlace", href: "/" }}
      rodape="Guardem o link: ele continua o mesmo quando a lista voltar."
    >
      <p>
        Este endereço está reservado e a lista volta em breve. Não é engano de
        vocês — o link está certo.
      </p>
    </BecoComSaida>
  );
}
