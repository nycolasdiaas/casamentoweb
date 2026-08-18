import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getSiteViewBySlug,
  listPublishedSiteSlugs,
} from "@/lib/repositories/siteView";
import { findGroupByGuestName } from "@/lib/repositories/findGroupByGuestName";
import { resolveTheme, type ThemeSpec } from "@/lib/theme/spec";
import { themePresetFor } from "@/lib/theme/presets";

/**
 * "Não recebi meu link" — a página que o botão do site do convidado nunca teve.
 *
 * O botão existia nos 6 moldes e apontava para `/s/<slug>`: a própria página em
 * que o convidado já estava. Em prévia isso dava 404 na cara dele; publicado,
 * recarregava a página e não resolvia nada. Era um beco.
 *
 * ── Por que uma busca por nome, e não um formulário de contato ─────────────
 *
 * O problema do convidado é que a mensagem sumiu na conversa. Mandar ele
 * escrever para o casal transfere trabalho para quem está casando — no mês do
 * casamento, com dezenas de convidados fazendo o mesmo. Digitar o próprio nome
 * e cair no convite resolve sozinho.
 *
 * A busca é por NOME COMPLETO E EXATO e devolve no máximo um link. O porquê
 * está em `findGroupByGuestName`: busca parcial com lista de resultados
 * transformaria esta página na lista de convidados do casamento.
 *
 * ── Por que o formulário mora num componente separado ──────────────────────
 *
 * `searchParams` é dado não cacheado, e com Cache Components lê-lo no corpo da
 * página trava a rota inteira: o `next build` reprova com "Uncached data was
 * accessed outside of <Suspense>". O `next dev` deixa passar — foi só no build
 * que apareceu. Então a casca (nomes do casal, cores) é estática e cacheável, e
 * só o pedaço que depende da busca fica dentro do <Suspense>.
 */

export async function generateStaticParams() {
  const slugs = await listPublishedSiteSlugs();
  // Cache Components exige ao menos um param declarado — e é isso que permite
  // o notFound() abaixo devolver 404 de verdade.
  if (slugs.length === 0) return [{ slug: "__sem-sites__" }];
  return slugs.map((slug) => ({ slug }));
}

export const metadata: Metadata = {
  title: "Encontrar meu convite",
  robots: { index: false, follow: false },
};

type Cores = { paper: string; ink: string; accent: string };

async function Busca({
  slug,
  siteId,
  cores,
  searchParams,
}: {
  slug: string;
  siteId: string;
  cores: Cores;
  searchParams: Promise<{ nome?: string; erro?: string }>;
}) {
  const { nome, erro } = await searchParams;

  async function procurar(formData: FormData) {
    "use server";
    const digitado = String(formData.get("nome") ?? "");
    const achado = await findGroupByGuestName(siteId, digitado);

    // Sem resultado, volta com o nome preenchido: reescrever tudo é o que faz
    // a pessoa desistir. Com resultado, vai direto para o convite dela.
    if (!achado) {
      redirect(
        `/s/${slug}/meu-convite?erro=1&nome=${encodeURIComponent(digitado)}`
      );
    }
    redirect(`/rsvp/${achado.slug}`);
  }

  return (
    <>
      <form action={procurar} className="mt-8 flex flex-col gap-3">
        <input
          type="text"
          name="nome"
          required
          minLength={3}
          defaultValue={nome ?? ""}
          autoComplete="name"
          placeholder="Maria Souza"
          aria-label="Seu nome completo"
          className="min-h-12 w-full border px-4 text-center text-[16px] outline-none"
          style={{
            borderColor: `color-mix(in srgb, ${cores.ink} 30%, transparent)`,
            background: `color-mix(in srgb, ${cores.paper} 85%, white)`,
            color: cores.ink,
          }}
        />
        <button
          type="submit"
          className="min-h-12 w-full text-[11.5px] uppercase tracking-[0.24em] transition-opacity hover:opacity-85"
          style={{ background: cores.ink, color: cores.paper }}
        >
          Encontrar meu convite
        </button>
      </form>

      {erro === "1" && (
        <p
          className="mt-5 text-[14px] leading-relaxed"
          style={{ color: cores.accent }}
        >
          Não encontramos esse nome na lista. Tente com o nome completo, do
          jeito que os noivos devem ter escrito — ou peça o link para eles.
        </p>
      )}
    </>
  );
}

export default async function MeuConvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ nome?: string; erro?: string }>;
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

  const nomes = view.content?.coupleNames ?? null;

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-6 py-16"
      style={{ background: cores.paper, color: cores.ink }}
    >
      <div className="w-full max-w-[440px] text-center">
        <p
          className="text-[11px] uppercase tracking-[0.26em]"
          style={{ color: cores.accent }}
        >
          Encontrar meu convite
        </p>

        <h1 className="mt-5 text-[26px] leading-tight">
          {nomes ? `Casamento de ${nomes}` : "Seu convite"}
        </h1>

        <p className="mt-4 text-[15px] leading-relaxed opacity-80">
          Escreva seu nome completo, como você acha que os noivos cadastraram.
          A gente te leva direto para a sua confirmação.
        </p>

        <Suspense
          fallback={
            <div
              className="mt-8 min-h-[104px] w-full"
              aria-hidden
              style={{
                background: `color-mix(in srgb, ${cores.ink} 6%, transparent)`,
              }}
            />
          }
        >
          <Busca
            slug={slug}
            siteId={view.site.id}
            cores={cores}
            searchParams={searchParams}
          />
        </Suspense>

        <Link
          href={`/s/${slug}`}
          className="mt-10 inline-block text-[13px] underline underline-offset-4 opacity-70 transition-opacity hover:opacity-100"
        >
          Voltar para o site do casamento
        </Link>
      </div>
    </main>
  );
}
