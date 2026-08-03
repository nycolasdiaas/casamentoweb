import type { Metadata } from "next";
import ThemeEditor from "@/components/account/ThemeEditor";
import TemplatePicker from "@/components/account/TemplatePicker";
import PhotoOrder from "@/components/account/PhotoOrder";
import { carregarGerenciamento } from "@/lib/site/manageData";
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
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: `Visual | ${SITE_NAME}` };

export default async function VisualPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { site } = await carregarGerenciamento(id);

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
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight">O visual do site</h1>
        <p className="text-sm leading-relaxed text-(--color-olive)/70">
          Cores e tipografia. Cada troca vale na hora.
        </p>
      </div>

      {/* O seletor de molde vem SEMPRE, inclusive quando não há molde ainda —
          é ele que tira o casal do beco em que a tela só sabia dizer "fale
          com a gente pelo WhatsApp". */}
      {site !== null && (
        <TemplatePicker siteId={site.id} atual={site.templateId ?? null} />
      )}

      {site !== null && temaAtual !== null ? (
        <ThemeEditor
          siteId={site.id}
          nomeDoModelo={nomeDoModelo}
          fontesDoModelo={fontesDoModelo}
          fontClassNames={fontClassNames}
          values={{ ...temaAtual.palette, ...temaAtual.fonts }}
          fotoSlot={<PhotoOrder siteId={site.id} fotos={fotosOrdenaveis} />}
        />
      ) : (
        site !== null && (
          <p className="rounded-2xl border border-(--color-gold)/40 bg-white p-6 text-sm leading-relaxed text-(--color-olive)/70">
            Escolham um modelo acima e as cores e a tipografia aparecem aqui
            para editar.
          </p>
        )
      )}
    </div>
  );
}
