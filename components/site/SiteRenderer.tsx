import { themeToCssVars, themeFontClassNames } from "@/lib/theme/css";
import { sectionsForTier, type SectionKey } from "@/lib/templates/contract";
import type { TemplateModule } from "@/lib/templates/contract";
import type { SiteContentView } from "@/lib/templates/contract";
import type { ThemeSpec } from "@/lib/theme/spec";
import type { PackageTier } from "@/lib/packages";
import TrackView from "@/components/TrackView";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import PhotoLightbox from "@/components/site/PhotoLightbox";
import { ANCORA_DA_SECAO } from "@/lib/site/ancoras";

/**
 * Renderiza o site de um casal: molde + tokens + conteúdo.
 *
 * É o coração da plataforma. Não sabe de banco nem de pedido — recebe tudo
 * resolvido e monta as seções na ordem do molde, filtradas pelo pacote.
 *
 * O wrapper carrega as classes `variable` só das fontes que o tema usa, e as
 * custom properties do tema. Daí para dentro, as seções falam só var(--ink),
 * var(--accent), var(--font-display).
 *
 * Ver docs/sdd-geracao-automatica.md §4.
 */
export default function SiteRenderer({
  template,
  theme,
  content,
  tier,
  slug,
  siteId,
  enabledSections,
}: {
  template: TemplateModule;
  theme: ThemeSpec;
  content: SiteContentView;
  tier: PackageTier;
  slug: string;
  siteId: string;
  /** seções desligadas pelo casal; ausente = tudo que o pacote permite */
  enabledSections?: SectionKey[];
}) {
  const permitidas = sectionsForTier(tier);
  const chaves = template.order.filter(
    (key) =>
      permitidas.includes(key) &&
      (enabledSections ? enabledSections.includes(key) : true) &&
      template.sections[key]
  );

  const props = { content, theme, tier, slug, siteId };

  return (
    <div
      className={`${themeFontClassNames(theme, template.fonts)} min-h-screen w-full flex justify-center`}
      style={{ ...themeToCssVars(theme), background: "var(--outer)" }}
    >
      {/*
        `site-canvas`: 480px no celular, largura de verdade no desktop.

        O cartão estreito era mobile-first de propósito — o convidado abre pelo
        WhatsApp — mas num monitor virava um telefone encalhado no meio da
        tela, com duas faixas enormes de fundo dos lados. Vertical agora é o
        que acontece no celular, não o que acontece sempre.

        A largura cresce em `lg` (1024px), não antes: tablet em retrato ainda
        lê melhor em coluna. As seções acompanham por `lg:` na própria
        marcação de cada molde — não por CSS global sobrescrevendo o Tailwind,
        que viraria uma guerra de especificidade a cada seção nova.
      */}
      {/*
        `@container` e não media query: o site renderiza DENTRO de um <iframe>
        na prévia do painel, onde a janela tem 1440px mas o quadro pode ter
        390px. Media query leria a janela e mostraria o desenho de desktop
        dentro do "modo celular" — container query lê a largura do cartão, que
        é o que de fato manda no desenho.

        A largura vai de 480px (celular, o desenho base — o convidado abre
        pelo WhatsApp) a 1120px no desktop.
      */}
      <div
        className="site-canvas @container w-full max-w-[480px] lg:max-w-[1120px] flex flex-col shadow-2xl font-[family-name:var(--font-body)]"
        style={{ background: "var(--paper)", color: "var(--ink)" }}
      >
        <TrackView siteSlug={slug} />

        {/* A coreografia de rolagem mora aqui, num componente só, e alcança
            os 6 moldes de uma vez — um molde novo a herda sem saber que ela
            existe. Ela lê os filhos de `.site-canvas` no cliente, então as
            seções continuam sendo server components puros.

            Passo mais lento e percurso maior que na landing: aqui é um
            convite, e o ritmo faz parte da peça. */}
        <RevealOnScroll raiz=".site-canvas" passo={0.11} percurso={30} />

        {/* Ampliar foto. Escuta o clique por delegação, então alcança os 6
            moldes sem que nenhum precise virar client component. */}
        <PhotoLightbox />

        {/* Cada seção ganha uma ÂNCORA (`#presentes`, `#confirmacao`…) para
            o convite poder apontar para um pedaço do site — "ver a lista de
            presentes" leva direto lá, não à capa.

            O invólucro mora aqui, e não em cada molde, pelo mesmo motivo do
            ScrollChoreography: alcança os 6 de uma vez e um molde novo herda
            sem saber que existe. `scroll-mt` compensa a rolagem suave para o
            título não colar no topo da janela. */}
        {chaves.map((key) => {
          const Section = template.sections[key]!;
          return (
            <div key={key} id={ANCORA_DA_SECAO[key] ?? key} className="scroll-mt-4">
              <Section {...props} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
