import { Suspense } from "react";
import type { Metadata } from "next";
import SiteRenderer from "@/components/site/SiteRenderer";
import TemaAoVivo from "@/components/site/TemaAoVivo";
import { getTemplate } from "@/lib/templates/registry";
import { buildContentView } from "@/lib/site/content";
import { clampThemeFonts, resolveTheme } from "@/lib/theme/spec";
import { themePresetFor } from "@/lib/theme/presets";
import { isPackageTier } from "@/lib/packages";
import type { SectionKey } from "@/lib/templates/contract";

/**
 * A prévia do questionário, desenhada pelo MOTOR — não por uma maquete.
 *
 * ── O que ela substitui ────────────────────────────────────────────────────
 *
 * A etapa do modelo mostrava `/pacotes/estilos/<id>`, que é uma página de
 * vitrine escrita à mão, com hex fixo e fontes fixas. Ela nunca poderia reagir
 * às cores nem à tipografia do casal — e era por isso que o pedido do dono
 * ("quando eu edito cada coisa, mudar no preview") não tinha como ser atendido
 * com o que existia. Aqui quem renderiza é o `SiteRenderer`, o mesmo de
 * `/s/<slug>`: o que aparece no quadro é o site de verdade.
 *
 * ── Por que o conteúdo é o do CASAL ────────────────────────────────────────
 *
 * Porque ele já digitou. Quando esta tela aparece, o questionário passou pelos
 * nomes, pela data e pelos endereços; mostrar "Ana & Pedro casando em
 * Fortaleza" logo depois disso fazia o casal procurar onde os dados dele
 * foram parar. O que falta (foto, presentes, recados) continua faltando, e as
 * seções degradam sozinhas — é o mesmo comportamento do site antes da primeira
 * foto.
 *
 * ── Por que só algumas seções ──────────────────────────────────────────────
 *
 * As que dependem só do conteúdo digitado. Galeria, presentes, mural e álbum
 * saem do banco de um site que ainda não existe: renderizariam vazias e
 * ensinariam o casal que o pacote dele não tem aquilo. O `siteId` nulo abaixo
 * é o que garante que nenhuma delas encontre dado de outro casal, caso alguém
 * acrescente uma seção nova a esta lista sem pensar.
 */

/* O UUID zero. Capa e História consultam fotos por `siteId`; com este valor a
   consulta é legítima e não acha nada, que é o certo — o site ainda não
   existe. Um id de verdade aqui mostraria a foto de outro casal. */
const SEM_SITE = "00000000-0000-0000-0000-000000000000";

const SECOES_DA_PREVIA: SectionKey[] = [
  "cover",
  "countdown",
  "story",
  "details",
  "rsvp",
  "footer",
];

export const metadata: Metadata = {
  title: "Prévia do estilo",
  // É uma tela de trabalho do casal dentro do questionário, não conteúdo.
  robots: { index: false, follow: false },
};

export default function PreviaDoEstiloPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    /* `searchParams` é dado não cacheado: com Cache Components, lê-lo fora de
       um limite de Suspense reprova o build inteiro ("Uncached data was
       accessed outside of <Suspense>"). O `next dev` deixa passar. */
    <Suspense fallback={null}>
      <Previa searchParams={searchParams} />
    </Suspense>
  );
}

function umValor(v: string | string[] | undefined): string | null {
  const s = Array.isArray(v) ? v[0] : v;
  return s?.trim() ? s.trim() : null;
}

/** As cores viajam sem `#` — na URL ele abriria um fragmento. */
function hex(v: string | string[] | undefined): string | null {
  const s = umValor(v);
  if (!s) return null;
  const limpo = s.replace(/^#/, "");
  return /^[0-9a-fA-F]{6}$/.test(limpo) ? `#${limpo}` : null;
}

async function Previa({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const q = await searchParams;

  const modelo = umValor(q.m);
  const template = getTemplate(modelo) ?? getTemplate("classico");
  // O registry é `Partial`: sem nenhum molde portado não há o que desenhar, e
  // um quadro vazio é melhor que uma exceção dentro do iframe do casal.
  if (!template) return null;

  const pacoteCru = umValor(q.p);
  const tier = pacoteCru && isPackageTier(pacoteCru) ? pacoteCru : "para-sempre";

  /* O MESMO caminho do provisionamento: preset do molde + escolhas do casal.
     Se esta tela resolvesse o tema por conta própria, ela mostraria um site
     que o `provision` não vai montar — e a prévia passaria a mentir
     exatamente no que ela existe para provar. */
  const tema = clampThemeFonts(
    resolveTheme(themePresetFor(modelo), {
      primaryColor: hex(q.c1),
      secondaryColor: hex(q.c2),
      tertiaryColor: hex(q.c3),
      fontStyle: umValor(q.f),
    }),
    new Set(Object.keys(template.fonts)),
    template.defaultTheme.fonts
  );

  const dataCrua = umValor(q.d);
  const data = dataCrua ? new Date(dataCrua) : null;

  const content = buildContentView({
    coupleNames: umValor(q.n),
    partnerA: null,
    partnerB: null,
    weddingDate: data && !Number.isNaN(data.getTime()) ? data : null,
    timezone: "America/Fortaleza",
    ceremonyVenue: umValor(q.lc),
    ceremonyAddress: null,
    ceremonyMapUrl: null,
    receptionVenue: umValor(q.lf),
    receptionAddress: null,
    receptionTime: null,
    story: umValor(q.hi),
    dressCode: umValor(q.tr),
    giftMessage: null,
  });

  /* TODAS as fontes do molde, e não só as três do tema.

     O site publicado carrega só o que o desenho usa — é a economia medida na
     Fase 1, e ela continua valendo lá. Aqui é o contrário de propósito: se a
     classe `variable` da fonte não estiver na árvore, `var(--f-<id>)` não
     resolve, e trocar a tipografia sem recarregar deixaria o título numa fonte
     de sistema. São oito fontes de um molde, dentro do quadro do próprio
     casal. */
  const todasAsFontes = Object.values(template.fonts)
    .map((f) => f?.variable)
    .filter(Boolean)
    .join(" ");

  return (
    <div className={todasAsFontes}>
      {/* Troca de cor e de fonte sem recarregar o quadro. Ver `TemaAoVivo`. */}
      <TemaAoVivo />
      <SiteRenderer
        template={template}
        theme={tema}
        content={content}
        tier={tier}
        // O site ainda não tem endereço. Os links das seções apontam para a
        // própria prévia, que é onde o casal está.
        slug="previa-do-estilo"
        siteId={SEM_SITE}
        enabledSections={SECOES_DA_PREVIA}
        // Não conta visita: é o casal olhando o próprio rascunho.
        previa
      />
    </div>
  );
}
