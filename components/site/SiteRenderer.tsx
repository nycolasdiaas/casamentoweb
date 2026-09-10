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
import BarraDoSite from "@/components/site/BarraDoSite";

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
  previa = false,
}: {
  template: TemplateModule;
  theme: ThemeSpec;
  content: SiteContentView;
  tier: PackageTier;
  slug: string;
  siteId: string;
  /** seções desligadas pelo casal; ausente = tudo que o pacote permite */
  enabledSections?: SectionKey[];
  /**
   * Estamos dentro da prévia do casal, não do site do convidado.
   *
   * Serve só para NÃO contar a visita: o casal abre a própria prévia dezenas
   * de vezes enquanto monta o site, e cada abertura entrava em "Visitas nos
   * últimos 30 dias". O painel mostrava movimento antes de existir um único
   * convidado, e o número que devia dizer "o link está circulando" dizia
   * "você recarregou a página".
   */
  previa?: boolean;
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
        `site-canvas`: 480px no celular, a JANELA INTEIRA no desktop.

        O cartão estreito era mobile-first de propósito — o convidado abre pelo
        WhatsApp — mas num monitor virava um telefone encalhado no meio da
        tela, com duas faixas enormes de fundo dos lados. Vertical agora é o
        que acontece no celular, não o que acontece sempre.

        A largura cresce em `lg` (1024px), não antes: tablet em retrato ainda
        lê melhor em coluna. As seções acompanham por `lg:` na própria
        marcação de cada molde — não por CSS global sobrescrevendo o Tailwind,
        que viraria uma guerra de especificidade a cada seção nova.

        ── Por que `lg:max-w-none` e não um número ───────────────────────────

        Até 27/08/2026 isto era `lg:max-w-[1120px]`: um cartão centralizado
        sobre `--outer`. A `specs/site-publico/002` mediu a alternativa e
        REJEITOU trocar o número, com razão — afastar o teto não redesenha
        nada, só afasta o que é centralizado e estica o que sangra. A saída
        que ela desenhava (Opção B, "o cartão vira largura cheia e cada seção
        decide o que sangra") ficou bloqueada por uma coisa só: o protótipo
        desenhava UM molde a 1440, e levar isso aos seis exigia cinco desenhos
        que não existiam.

        Eles existem desde 28/08/2026 (`Enlace - Estilos Completos.dc.html`,
        os seis moldes inteiros a 1920). A spec foi reaberta e fechada na
        Opção B. Daí este teto: a moldura morta de `--outer` some, e quem
        decide entre sangrar e ficar no trilho passa a ser cada seção, na
        própria marcação — o fundo da seção ocupa a largura toda, e o que
        precisa de trilho ganha `lg:px-*` e teto de medida no elemento, como
        o desenho faz.

        ── Por que 1920 e não `none` ─────────────────────────────────────────

        Porque 1920 é a prancha. É a largura em que os seis moldes foram
        desenhados, e é até ela que existe decisão de desenho: a capa do
        Editorial em duas colunas com fio no meio, o nome de 138px, a grade
        de galeria em `2fr 1fr 1fr`. Sem teto, num monitor de 2560 essas
        medidas esticariam para uma largura que ninguém compôs — que é o
        mesmo defeito que a spec 002 apontou na Opção A, só que do outro
        lado. Num monitor de 1920, que é o caso que o desenho mira, não sobra
        um pixel de `--outer`.

        O celular NÃO mudou: abaixo de `lg` continua o cartão de 480px, e as
        capturas de 390px são idênticas às de antes — é o requisito FR-008 da
        própria spec.
      */}
      {/*
        `@container` e não media query: o site renderiza DENTRO de um <iframe>
        na prévia do painel, onde a janela tem 1440px mas o quadro pode ter
        390px. Media query leria a janela e mostraria o desenho de desktop
        dentro do "modo celular" — container query lê a largura do cartão, que
        é o que de fato manda no desenho.
      */}
      <div
        className="site-canvas @container w-full max-w-[480px] lg:max-w-[1920px] flex flex-col shadow-2xl font-[family-name:var(--font-body)]"
        style={{ background: "var(--paper)", color: "var(--ink)" }}
      >
        {/* F1 · a barra fixa. Primeiro filho do cartão porque é `sticky`:
            um irmão acima dela dentro do mesmo contexto de rolagem a
            empurraria para fora antes de ela grudar.

            Recebe as chaves JÁ filtradas por pacote e pela escolha do casal —
            a barra nunca inventa um destino que a página não tem. */}
        <BarraDoSite nomes={content.coupleNames} chaves={chaves} />

        {!previa && <TrackView siteSlug={slug} />}

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
            <div
              key={key}
              id={ANCORA_DA_SECAO[key] ?? key}
              /* A barra cobre 52px no celular e 60px no desktop; o respiro de
                 8px separa o título do fio de baixo. Sem isto, clicar numa
                 âncora esconde justamente o título da seção que se pediu. */
              className="scroll-mt-[60px] @[700px]:scroll-mt-[68px]"
            >
              <Section {...props} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
