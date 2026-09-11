import type { Metadata } from "next";
import ThemeEditor from "@/components/account/ThemeEditor";
import TemplatePicker from "@/components/account/TemplatePicker";
import PhotoOrder from "@/components/account/PhotoOrder";
import { carregarGerenciamento } from "@/lib/site/manageData";
import { linhaDeLugar } from "@/lib/site/lugar";
import { buildContentView } from "@/lib/site/content";
import { getSiteContent } from "@/lib/repositories/siteContent";
import { getTemplate } from "@/lib/templates/registry";
import { getTemplateStyle } from "@/lib/templates";
import { parseThemeSpec, clampThemeFonts } from "@/lib/theme/spec";
import { FONT_STYLES } from "@/lib/customization";
import { fontVar } from "@/lib/fonts/types";
import {
  listSitePhotosFresh,
  SLOT_LABEL,
  type PhotoSlot,
} from "@/lib/repositories/sitePhotos";
import { isStorageEnabled } from "@/lib/storage/supabase";
import LivePreview from "@/components/account/LivePreview";

export const metadata: Metadata = { title: "Visual" };

/** A linha de baixo da amostra: data e lugar, como no convite. */
function linhaDaAmostra(conteudo: {
  weddingDateLabel: string | null;
  ceremonyAddress: string | null;
}): string {
  const partes = [
    conteudo.weddingDateLabel,
    linhaDeLugar(conteudo.ceremonyAddress),
  ].filter(Boolean);
  return partes.length > 0 ? partes.join(" · ") : "a data e o lugar de vocês";
}

export default async function VisualPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { order, site } = await carregarGerenciamento(id);
  const linhaDeConteudo = site ? await getSiteContent(site.id) : null;
  const conteudo = linhaDeConteudo ? buildContentView(linhaDeConteudo) : null;
  const previewSrc = order.previewUrl ?? order.siteUrl ?? null;

  /* A amostra de cores mostra o casal DELES, não o da vitrine (UX-018).
     `linhaDeLugar` é a mesma função que a capa usa, então a amostra mostra
     exatamente a linha que vai sair no site. Sem conteúdo salvo, cai no
     exemplo — melhor um exemplo do que um cartão vazio. */
  const casalDaAmostra = (() => {
    if (!conteudo) return null;
    const primeiro = conteudo.partnerA?.trim();
    const segundo = conteudo.partnerB?.trim();
    if (!primeiro || !segundo) {
      const [a, b] = (conteudo.coupleNames ?? "")
        .split(/\s+(?:&|e)\s+/i)
        .map((n: string) => n.trim());
      if (!a || !b) return null;
      return {
        primeiro: a,
        segundo: b,
        linha: linhaDaAmostra(conteudo),
      };
    }
    return { primeiro, segundo, linha: linhaDaAmostra(conteudo) };
  })();

  const template = site ? getTemplate(site.templateId) : null;

  // As fontes ofertadas são as do MOLDE — o mesmo recorte que `clampThemeFonts`
  // faz ao renderizar, para o formulário não oferecer o que o site descartaria.
  const temaAtual =
    site && template
      ? clampThemeFonts(
          parseThemeSpec(site.theme) ?? template.defaultTheme,
          new Set(Object.keys(template.fonts)),
          template.defaultTheme.fonts
        )
      : null;

  // templateId é nullable: o casal pode ter pedido "montar do zero". Sem molde
  // não há catálogo de fontes nem preset, então o editor não aparece — o site
  // desses casos é montado à mão pela equipe.
  const nomeDoModelo = site?.templateId
    ? (getTemplateStyle(site.templateId)?.name ?? site.templateId)
    : "";

  const fontesDoModelo = template
    ? FONT_STYLES.filter((f) => f.id in template.fonts).map((f) => ({
        id: f.id,
        nome: f.name,
        descricao: f.description,
        cssVar: fontVar(f.id),
      }))
    : [];

  // Classes `variable` de TODAS as fontes do molde: é o que faz cada amostra
  // ser desenhada na própria fonte. Sem elas, `var(--f-x)` não resolve e todas
  // sairiam iguais.
  const fontClassNames = template
    ? Array.from(
        new Set(
          Object.values(template.fonts)
            .map((f) => f?.variable)
            .filter(Boolean) as string[]
        )
      ).join(" ")
    : "";

  const fotos =
    site && isStorageEnabled() ? await listSitePhotosFresh(site.id) : [];

  // Marcação de ponta para as setas já chegarem desabilitadas em quem é
  // primeira ou última do próprio slot. A URL é `/f/<id>`, a mesma rota que o
  // site usa — nunca URL do Storage (§8.1 do SDD).
  const fotosOrdenaveis = fotos.map((f) => {
    const doSlot = fotos.filter((o) => o.slot === f.slot);
    const idx = doSlot.findIndex((o) => o.id === f.id);
    return {
      id: f.id,
      slot: f.slot,
      slotLabel: SLOT_LABEL[f.slot as PhotoSlot] ?? f.slot,
      url: `/f/${f.id}`,
      primeira: idx === 0,
      ultima: idx === doSlot.length - 1,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <span className="meta text-(--c-mark)">Visual</span>
        <h1 className="t-d2 text-(--c-ink)">O visual do site</h1>
        <p className="t-corpo text-(--c-ink-2) medida">
          Estilo, cores e tipografia. Cada troca vale na hora.
        </p>
      </header>

      {/* E4 é PAINEL + PALCO: os controles numa coluna estreita à esquerda e a
          prévia ocupando o resto. Escolher cor sem ver o resultado é escolher
          no escuro — e era o que a coluna única obrigava, com a prévia a três
          rolagens de distância dos seletores. */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8 items-start">
        <div className="flex flex-col gap-6">
          {/* O seletor de molde vem SEMPRE, inclusive quando não há molde
              ainda — é ele que tira o casal do beco em que a tela só sabia
              dizer "fale com a gente pelo WhatsApp". */}
          {site !== null && (
            <TemplatePicker siteId={site.id} atual={site.templateId ?? null} />
          )}

          {site !== null && temaAtual !== null ? (
            <ThemeEditor
              siteId={site.id}
              casal={casalDaAmostra}
              nomeDoModelo={nomeDoModelo}
              fontesDoModelo={fontesDoModelo}
              fontClassNames={fontClassNames}
              values={{ ...temaAtual.palette, ...temaAtual.fonts }}
              fotoSlot={<PhotoOrder siteId={site.id} fotos={fotosOrdenaveis} />}
            />
          ) : (
            site !== null && (
              <p className="surface-flat rounded-[3px] p-6 t-corpo-p text-(--c-ink-2)">
                Escolham um modelo acima e as cores e a tipografia aparecem
                aqui para editar.
              </p>
            )
          )}
        </div>

        {previewSrc && (
          <aside className="hidden lg:block lg:sticky lg:top-6">
            <LivePreview src={previewSrc} fullBleed={false} />
          </aside>
        )}
      </div>
    </div>
  );
}
