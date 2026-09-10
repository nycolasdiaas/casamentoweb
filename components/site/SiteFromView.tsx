import { getTemplate } from "@/lib/templates/registry";
import { parseThemeSpec, clampThemeFonts } from "@/lib/theme/spec";
import { themePresetFor } from "@/lib/theme/presets";
import { buildContentView } from "@/lib/site/content";
import { getTemplateStyle } from "@/lib/templates";
import { themeToCssVars } from "@/lib/theme/css";
import type { SectionKey } from "@/lib/templates/contract";
import SiteRenderer from "./SiteRenderer";
import type { sites, siteContent, siteSections } from "@/lib/db/schema";

/* O hash da senha é OMITIDO do tipo, não só da consulta.
   `getSiteViewBySlug` já o remove em tempo de execução; tirá-lo também daqui é
   o que faz o compilador reprovar qualquer caminho novo que tente passar a
   linha crua de `sites` para esta árvore — que é como um segredo volta ao
   payload seis meses depois, sem ninguém notar. */
type SiteRow = Omit<typeof sites.$inferSelect, "accessPasswordHash">;
type ContentRow = typeof siteContent.$inferSelect;
type SectionRow = typeof siteSections.$inferSelect;

export type SiteView = {
  site: SiteRow;
  content: ContentRow | null;
  sections: SectionRow[];
};

/**
 * Renderiza um site a partir da view do banco.
 *
 * Compartilhado entre a rota pública (/s/<slug>) e a prévia
 * (/preview/<token>) — as duas montam o mesmo site, mudando só como o
 * tenant é resolvido e quem tem permissão de ver.
 */
export default function SiteFromView({
  view,
  slug,
  previa = false,
  apenas,
}: {
  view: SiteView;
  slug: string;
  /**
   * Renderizando dentro de `/preview/<token>`?
   *
   * Carimba o selo de prévia sobre o site. **Nunca pode chegar `true` a partir
   * de `/s/<slug>`** — o site publicado não tem carimbo, e é por isso que o
   * padrão é `false` em vez de derivar de `view.site.status`: derivar deixaria
   * um site em `preview` publicado por outro caminho aparecer carimbado para
   * o convidado.
   */
  previa?: boolean;
  /**
   * Renderiza SÓ estas seções — o que sustenta `/s/<slug>/presentes`, o link
   * que o casal manda para quem só vai presentear.
   *
   * É um RECORTE do que o site já mostraria, nunca um atalho por cima das
   * regras: a seção pedida ainda precisa passar pelo pacote (`sectionsForTier`
   * dentro do `SiteRenderer`) e pelo interruptor da aba Páginas (o filtro de
   * `desligadas` logo abaixo). Desligar "Lista de presentes" no painel derruba
   * a seção aqui também — se não derrubasse, o casal teria um interruptor que
   * não desliga o link que ele mandou no WhatsApp.
   */
  apenas?: SectionKey[];
}) {
  const template = getTemplate(view.site.templateId);

  // Molde escolhido ainda não portado para o motor (Fase 2). Não é erro nem
  // 404: o site existe, o pedido está de pé. Mostra um estado honesto em vez
  // de fingir outro estilo ou dar página não encontrada.
  if (!template) {
    return <EmPreparacao view={view} />;
  }

  const theme = clampThemeFonts(
    parseThemeSpec(view.site.theme) ?? template.defaultTheme,
    new Set(Object.keys(template.fonts)),
    template.defaultTheme.fonts
  );

  const content = buildContentView(
    view.content ?? {
      coupleNames: null,
      partnerA: null,
      partnerB: null,
      weddingDate: null,
      timezone: "America/Fortaleza",
      ceremonyVenue: null,
      ceremonyAddress: null,
      ceremonyMapUrl: null,
      receptionVenue: null,
      receptionAddress: null,
      story: null,
      dressCode: null,
      giftMessage: null,
    }
  );

  const desligadas = view.sections.filter((s) => !s.enabled).map((s) => s.sectionKey);
  const habilitadas = view.sections.length
    ? (template.order.filter((k) => !desligadas.includes(k)) as SectionKey[])
    : undefined;

  /* O recorte entra por INTERSEÇÃO, nunca por substituição: `apenas` só
     consegue tirar seções da lista, nunca acrescentar uma que o casal
     desligou ou que o pacote não libera. */
  const secoes = apenas
    ? (habilitadas ?? (template.order as SectionKey[])).filter((k) =>
        apenas.includes(k)
      )
    : habilitadas;

  return (
    <>
      {previa && <SeloDePrevia />}
      <SiteRenderer
        template={template}
        theme={theme}
        content={content}
        tier={view.site.tier}
        slug={slug}
        siteId={view.site.id}
        enabledSections={secoes}
        previa={previa}
      />
    </>
  );
}

/**
 * F5 · o carimbo de prévia sobre o hero.
 *
 * ── Por que ele existe, além da faixa preta do topo ────────────────────────
 *
 * A faixa de `/preview/<token>` diz tudo o que precisa — e rola para fora da
 * tela no primeiro gesto. A partir daí a prévia é indistinguível do site
 * publicado, e o casal conclui que já publicou. É o mesmo defeito que a faixa
 * foi criada para consertar, um scroll depois.
 *
 * `fixed`, e não `absolute`: ele acompanha a tela. `pointer-events: none` para
 * não roubar clique de nada abaixo, e `aria-hidden` porque a informação já
 * está escrita na faixa — anunciá-la duas vezes é ruído para quem usa leitor.
 *
 * A cor é branca com fio translúcido porque o hero de todo molde é foto escura
 * ou tinta. Sobre um hero claro ele perde contraste; a saída certa nesse caso é
 * `mix-blend-mode`, que ainda não está resolvida para todos os moldes.
 */
function SeloDePrevia() {
  return (
    <span
      aria-hidden="true"
      /* No celular o selo desce para o RODAPÉ à direita.
         Em `top-16` ele caía exatamente sobre a barra fixa do site, cobrindo
         o botão "Confirmar presença" — o único botão que o convidado precisa
         achar. `pointer-events-none` impedia que ele roubasse o clique, mas
         não impedia que escondesse o alvo. No desktop há folga de sobra e ele
         continua no alto. */
      className="pointer-events-none fixed bottom-6 right-4 z-40 flex size-16 flex-col items-center justify-center rounded-full border-[1.5px] border-white/80 text-white mix-blend-difference lg:bottom-auto lg:right-7 lg:top-24 lg:size-[92px]"
      style={{ transform: "rotate(-8deg)" }}
    >
      <span className="font-mono text-[9px] tracking-[0.14em] lg:text-[11px]">
        PRÉVIA
      </span>
    </span>
  );
}

function EmPreparacao({ view }: { view: SiteView }) {
  const estilo = getTemplateStyle(view.site.templateId ?? "");
  const tema = themePresetFor(view.site.templateId);
  const nomes = view.content?.coupleNames ?? "O casamento de vocês";

  return (
    <div
      className="min-h-screen w-full flex justify-center"
      style={{ ...themeToCssVars(tema), background: "var(--outer)" }}
    >
      {/* Mesma largura do site de verdade: esta tela é o que o convidado vê se
          abrir o link cedo, e um cartão de 480px encalhado num monitor entrega
          que é estado provisório mal-acabado. */}
      <div
        className="site-canvas w-full max-w-[480px] lg:max-w-[1920px] flex flex-col items-center justify-center gap-5 px-8 py-20 lg:px-24 lg:py-32 text-center shadow-2xl"
        style={{ background: "var(--paper)", color: "var(--ink)" }}
      >
        <div
          className="w-16 h-px"
          style={{ background: "var(--accent)" }}
          aria-hidden
        />
        <h1 className="text-3xl lg:text-5xl leading-tight">{nomes}</h1>
        <p className="text-sm leading-relaxed opacity-80">
          O site de vocês está sendo preparado
          {estilo ? ` no estilo ${estilo.name}` : ""}. Assim que estiver
          pronto, ele aparece aqui neste mesmo endereço.
        </p>
        <div
          className="w-10 h-px"
          style={{ background: "var(--accent)" }}
          aria-hidden
        />
      </div>
    </div>
  );
}
