import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import { uiPrensa } from "@/lib/fonts/ui";
import { TEMPLATE_STYLES, type TemplateStyle } from "@/lib/templates";
import { getTemplate } from "@/lib/templates/registry";
import { themeToCssVars, themeFontClassNames } from "@/lib/theme/css";
import { FONT_STYLES } from "@/lib/customization";
import AccountNav, { LoggedOutLinks } from "@/components/landing/AccountNav";
import InterruptorDeMovimento from "@/components/ui/InterruptorDeMovimento";

export const metadata: Metadata = {
  /* O layout raiz põe "| Enlace" pelo `template`. Ver o comentário gêmeo em
     `app/pacotes/page.tsx`. */
  title: "Estilos",
  description:
    "Seis estilos para o site de casamento. O conteúdo é seu; o estilo troca com um clique.",
};

/**
 * B4–B9 · a galeria dos seis estilos.
 *
 * "Seis rotas, uma página", diz o protótipo. As seis rotas já existem e são
 * boas: `/pacotes/estilos/<id>` renderiza a prévia INTEIRA do casal fictício
 * naquele estilo, e o SDD §4.4.1 as preserva de propósito. O que faltava era
 * a porta: a tela onde se decide qual das seis abrir.
 *
 * A diferença que justifica esta página existir ao lado da faixa da home: aqui
 * a cor e a fonte de cada cartão saem do `defaultTheme` do molde de verdade,
 * não de uma lista de hex ao lado. Se o preset do Toscana mudar, o cartão do
 * Toscana muda junto — e ninguém precisa lembrar de vir aqui.
 */
export default async function GaleriaDeEstilos({
  searchParams,
}: {
  searchParams: Promise<{ estilo?: string }>;
}) {
  return (
    <div
      className={`${uiPrensa} flex-1 flex flex-col bg-(--c-surface) text-(--c-ink)`}
    >
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-(--c-rule)">
        <nav className="trilho py-4 flex items-center justify-between gap-4">
          <Link href="/" className="t-display text-[22px] leading-none tracking-tight">
            {SITE_NAME}
            <span className="hidden sm:inline text-sm font-normal text-(--c-ink-2)">
              {" "}
              · {SITE_TAGLINE}
            </span>
          </Link>
          <div className="flex items-center gap-5 text-sm">
            <Link href="/pacotes" className="hidden sm:inline hover:underline underline-offset-4">
              Pacotes
            </Link>
            <Suspense fallback={<LoggedOutLinks />}>
              <AccountNav />
            </Suspense>
          </div>
        </nav>
      </header>

      <main className="trilho flex flex-col gap-12 py-16">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="meta text-(--c-mark)">SEIS ESTILOS</span>
          <h1 className="t-d1">O mesmo amor, seis vestidos.</h1>
          <p className="t-corpo max-w-[52ch] text-(--c-ink-2)">
            Escolha o clima. O conteúdo é seu; o estilo troca com um clique.
          </p>
        </div>

        {/* A grade vem ANTES do painel na ordem de leitura. No celular o
            painel some (ele empurraria a grade para baixo da dobra, e ali o
            cartão já leva direto à prévia), mas continua no DOM — e um leitor
            de tela não deve tropeçar num detalhe antes de ver a lista. */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px] lg:items-start">
          <ul
            data-grade-estilos
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {TEMPLATE_STYLES.map((estilo) => (
              <CartaoDeEstilo key={estilo.id} estilo={estilo} />
            ))}
          </ul>

          {/* `searchParams` é dado não cacheado: lido fora de `<Suspense>`
              trava a rota inteira no build ("Uncached data was accessed
              outside of `<Suspense>`"), e o `next dev` não avisa. A promessa
              desce sem `await`. */}
          <Suspense fallback={<PainelVazio />}>
            <PainelDeDetalhe busca={searchParams} />
          </Suspense>
        </div>
      </main>

      <footer className="mt-auto bg-(--c-olive) text-white/60 border-t border-white/10">
        <div className="trilho py-6 flex flex-wrap items-center justify-between gap-2 text-xs">
          <p>
            {SITE_NAME} · {SITE_TAGLINE}
          </p>
          <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <span>Sem mensalidade · Pix sem taxa · Feito no Brasil</span>
            <InterruptorDeMovimento />
          </p>
        </div>
      </footer>
    </div>
  );
}

function CartaoDeEstilo({ estilo }: { estilo: TemplateStyle }) {
  const molde = getTemplate(estilo.id);
  const tema = molde?.defaultTheme;
  const aCasa = estilo.id === "editorial";

  return (
    <li className="flex">
      <Link
        href={`/pacotes/estilos?estilo=${estilo.id}`}
        data-estilo={estilo.id}
        className="relative flex flex-1 flex-col overflow-hidden rounded-[3px] bg-(--c-surface) transition-all hover:-translate-y-0.5 hover:shadow-md"
        /* Estilo e não classe: o Tailwind não gera `border-[1.5px]` —
           conferido no CSS do build. Ver `app/pacotes/page.tsx`. */
        style={{
          border: aCasa
            ? "1.5px solid var(--c-ink)"
            : "1px solid var(--c-rule)",
        }}
      >
        {aCasa && (
          <span className="meta absolute right-3 top-3 z-10 rounded-[2px] bg-(--c-mark) px-1.5 py-0.5 text-[9.5px] text-white">
            A CASA
          </span>
        )}

        {/* O hero é o molde falando por si: a paleta e a fonte de display saem
            do `defaultTheme` dele, não de uma cópia guardada aqui. É a regra
            de §4.4.1 aplicada à vitrine — hex escrito na galeria seria uma
            segunda verdade para desatualizar. */}
        <div
          className={`flex h-[200px] items-center justify-center px-4 text-center ${
            molde ? themeFontClassNames(tema!, molde.fonts) : ""
          }`}
          style={
            tema
              ? { ...themeToCssVars(tema), background: "var(--paper)" }
              : { background: estilo.swatches[0] }
          }
        >
          <span
            className="text-[30px] leading-none"
            style={{
              fontFamily: "var(--font-display)",
              color: tema ? "var(--ink)" : estilo.swatches[1],
            }}
          >
            Ana &amp; João
          </span>
        </div>

        <div className="flex flex-col gap-1.5 border-t border-(--c-rule) p-4">
          <p className="t-display text-[19px] leading-none">{estilo.name}</p>
          <p className="meta text-(--c-ink-2)">{estilo.carater}</p>
          <span className="mt-1 text-[13px] font-medium underline underline-offset-4">
            Ver →
          </span>
        </div>
      </Link>
    </li>
  );
}

/** A casca do painel enquanto o `searchParams` não chegou. */
function PainelVazio() {
  return (
    <aside
      data-painel-estilo
      aria-hidden="true"
      className="hidden h-[420px] rounded-[3px] border border-(--c-rule) lg:block"
    />
  );
}

async function PainelDeDetalhe({
  busca,
}: {
  busca: Promise<{ estilo?: string }>;
}) {
  const { estilo: pedido } = await busca;

  /* Valor fora da lista cai no padrão em vez de dar erro. Quem digita
     `?estilo=qualquercoisa` na barra de endereços merece uma página, não um
     500 — e `editorial` é a casa. */
  const estilo =
    TEMPLATE_STYLES.find((e) => e.id === pedido) ??
    TEMPLATE_STYLES.find((e) => e.id === "editorial")!;

  const molde = getTemplate(estilo.id);
  const tema = molde?.defaultTheme;
  const nomeDaFonte = (id: string) =>
    FONT_STYLES.find((f) => f.id === id)?.name ?? id;

  return (
    <aside
      data-painel-estilo
      className="hidden flex-col gap-5 rounded-[3px] border border-(--c-rule) bg-(--c-surface) p-6 lg:flex lg:sticky lg:top-24"
    >
      <span className="meta text-(--c-mark)">ESTILO</span>
      <h2 className="t-d1">{estilo.name}</h2>
      <p className="text-[14px] leading-relaxed text-(--c-ink-2)">
        {estilo.description}
      </p>

      {tema && (
        <dl className="flex flex-col gap-2.5 border-t border-(--c-rule) pt-4 text-[13px]">
          <Linha rotulo="Títulos" valor={nomeDaFonte(tema.fonts.display)} />
          <Linha rotulo="Texto" valor={nomeDaFonte(tema.fonts.body)} />
          <div className="flex items-center justify-between gap-4">
            <dt className="meta text-(--c-ink-2)">Paleta</dt>
            <dd className="flex gap-1.5">
              {[tema.palette.outer, tema.palette.ink, tema.palette.accent].map(
                (cor) => (
                  <span
                    key={cor}
                    data-cor={cor}
                    className="size-4 rounded-[2px] border border-black/10"
                    style={{ background: cor }}
                  />
                )
              )}
            </dd>
          </div>
        </dl>
      )}

      {/* "Ver este estilo", não "Usar este estilo" como no artboard: "usar"
          promete escolher, e o casal só escolhe dentro do questionário.
          Prometer escolha e entregar uma prévia é exatamente o botão que
          descreve o conceito em vez da ação. */}
      <Link
        href={`/pacotes/estilos/${estilo.id}`}
        className="btn btn-ink w-full justify-center"
      >
        Ver este estilo
      </Link>
    </aside>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="meta text-(--c-ink-2)">{rotulo}</dt>
      <dd className="t-data text-[12.5px]">{valor}</dd>
    </div>
  );
}
