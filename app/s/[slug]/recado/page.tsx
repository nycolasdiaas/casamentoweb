import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import BecoComSaida from "@/components/site/BecoComSaida";
import SenhaDoSite from "@/components/site/SenhaDoSite";
import FormularioDeRecado from "@/components/site/FormularioDeRecado";
import {
  getSiteViewBySlug,
  listPublishedSiteSlugs,
} from "@/lib/repositories/siteView";
import { getSiteAccess } from "@/lib/repositories/sites";
import { temCracha } from "@/lib/site/acessoDoSite";
import { listaDePresentesVisivel } from "@/lib/site/giftSection";
import { getTemplate } from "@/lib/templates/registry";
import { clampThemeFonts, parseThemeSpec } from "@/lib/theme/spec";
import { themePresetFor } from "@/lib/theme/presets";
import { themeToCssVars, themeFontClassNames } from "@/lib/theme/css";
import type { SiteView } from "@/components/site/SiteFromView";

/**
 * "Recado para os noivos" — a tela que substituiu o beco do convite perdido.
 *
 * ── De onde ela veio ───────────────────────────────────────────────────────
 *
 * O bloco da confirmação de presença oferecia "Não recebi meu link" como
 * única saída para quem chegava sem convite. O dono viu o que isso significa
 * na prática (15/09/2026): o link não faz sentido para a maioria de quem
 * clica ali, e o que aquela gente queria mesmo era falar com os noivos. O
 * link continua existindo, mais discreto — quem de fato perdeu o convite
 * precisa dele. O que mudou é qual das duas portas é a principal.
 *
 * ── Dois destinos, e o pacote decide ───────────────────────────────────────
 *
 * - **Para Sempre**: o recado vai para o mural do site, e DEPOIS de enviado a
 *   tela convida a mandar um presente junto — o Pix que só este pacote tem.
 * - **Site do Casamento**: não há mural nem lista. O recado vai direto para o
 *   casal, que o lê no painel, e a tela avisa isso antes de a pessoa escrever.
 *
 * Quem decide é `enviarRecadoAction`, no servidor, pelo `tier` do site. Aqui a
 * rota decide apenas o TEXTO — se as duas decidissem, uma ficaria para trás na
 * primeira mudança de pacote e o convidado leria uma promessa que o banco não
 * cumpre.
 *
 * ── As guardas são as de `/s/<slug>` ───────────────────────────────────────
 *
 * Mesma regra de `/s/<slug>/presentes`: site fora do ar responde fora do ar,
 * site com senha pede senha (e o crachá vale), e o pacote manda. Um recado
 * gravado numa prévia apareceria do nada no dia da publicação.
 */

export async function generateStaticParams() {
  const slugs = await listPublishedSiteSlugs();
  // Cache Components exige ao menos um param declarado — é o que deixa o
  // notFound() abaixo devolver 404 de verdade.
  if (slugs.length === 0) return [{ slug: "__sem-sites__" }];
  return slugs.map((slug) => ({ slug }));
}

export const metadata: Metadata = {
  title: "Recado para os noivos",
  // Recado não é conteúdo de busca, e o nome de quem escreve menos ainda.
  robots: { index: false, follow: false },
};

export default async function RecadoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const view = await getSiteViewBySlug(slug);

  if (!view) notFound();
  if (view.site.status !== "published") return <ForaDoAr />;

  if (view.site.accessMode === "password") {
    return (
      <Suspense fallback={null}>
        <PortaoDeAcesso slug={slug} view={view} />
      </Suspense>
    );
  }

  return <Tela view={view} slug={slug} />;
}

/**
 * O crachá de quem já digitou a senha.
 *
 * Isolado porque lê `cookies()` — dado de pedido, que com Cache Components
 * exige um limite de `<Suspense>`. Mesmo desenho de `/s/<slug>/presentes`.
 */
async function PortaoDeAcesso({
  slug,
  view,
}: {
  slug: string;
  view: SiteView;
}) {
  const acesso = await getSiteAccess(slug);
  const entrou = await temCracha(
    acesso?.id ?? view.site.id,
    acesso?.accessPasswordHash ?? null
  );

  if (!entrou) {
    return (
      <SenhaDoSite slug={slug} nomesDoCasal={view.content?.coupleNames ?? null} />
    );
  }

  return <Tela view={view} slug={slug} />;
}

function Tela({ view, slug }: { view: SiteView; slug: string }) {
  /* O pacote Convite não tem confirmação de presença, e é de lá que o botão
     do recado sai. Sem esta guarda, o endereço digitado à mão abriria uma
     caixa de mensagem em um site que não comprou nenhuma — e o casal não
     teria onde ler o que chegasse. */
  if (view.site.tier === "convite") return <ForaDoAr />;

  const template = getTemplate(view.site.templateId);
  const tema = template
    ? clampThemeFonts(
        parseThemeSpec(view.site.theme) ?? template.defaultTheme,
        new Set(Object.keys(template.fonts)),
        template.defaultTheme.fonts
      )
    : themePresetFor(view.site.templateId);

  const nomes = view.content?.coupleNames ?? null;
  const vaiParaOMural = view.site.tier === "para-sempre";
  /* O convite para presentear só aparece se a lista estiver de pé DE VERDADE:
     pacote, molde e o interruptor da aba Páginas. Mandar para uma lista
     desligada é o beco que a prancha H proíbe. */
  const temPresentes = vaiParaOMural && listaDePresentesVisivel(view);

  return (
    <main
      className={`${
        template ? themeFontClassNames(tema, template.fonts) : ""
      } flex min-h-screen w-full flex-col items-center px-6 py-16`}
      style={{
        ...themeToCssVars(tema),
        background: "var(--paper)",
        color: "var(--ink)",
      }}
    >
      <div className="w-full max-w-[520px] text-center">
        <p
          className="text-[11px] uppercase tracking-[0.26em]"
          style={{ color: "var(--accent)" }}
        >
          Recado para os noivos
        </p>

        <h1 className="mt-5 text-[26px] leading-tight lg:text-[30px]">
          {nomes ? `Escreva para ${nomes}` : "Escreva para os noivos"}
        </h1>

        <div className="mt-8">
          <FormularioDeRecado
            slug={slug}
            rotuloDoBotao="Enviar meu recado"
            convite={
              vaiParaOMural
                ? "Seu recado entra no mural do site, para todo mundo ler junto com os noivos."
                : "Seu recado vai direto para os noivos. Ninguém mais vê."
            }
            presentes={
              temPresentes
                ? {
                    href: `/s/${slug}/presentes`,
                    rotulo: "Ver a lista de presentes",
                  }
                : undefined
            }
          />
        </div>

        {/* A saída de quem chegou aqui por engano — quem queria mesmo era o
            convite. É o par do link secundário que a seção de confirmação
            mostra: as duas portas continuam existindo, uma de cada lado. */}
        <Link
          href={`/s/${slug}/meu-convite`}
          className="mt-10 inline-block text-[13px] underline underline-offset-4 opacity-70 transition-opacity hover:opacity-100"
        >
          Na verdade eu procuro meu convite
        </Link>
      </div>
    </main>
  );
}

/**
 * Site fora do ar, ou pacote sem recado — a mesma resposta para os dois, e sem
 * nada do casal na tela.
 *
 * O 404 mentiria quando é só um site ainda não publicado: o endereço está
 * certo e vai funcionar. Nomes ou data aqui vazariam conteúdo de um site que
 * não está público.
 */
function ForaDoAr() {
  return (
    <BecoComSaida
      codigo="Recados fechados por enquanto"
      titulo="Os noivos estão dando os retoques finais"
      saidaPrincipal={{ rotulo: "Ir para a Enlace", href: "/" }}
      rodape="Guardem o link: ele continua o mesmo quando abrir."
    >
      <p>
        Este endereço está reservado e volta em breve. Não é engano de vocês —
        o link está certo.
      </p>
    </BecoComSaida>
  );
}
