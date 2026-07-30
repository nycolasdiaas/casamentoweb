import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getSessionUserId } from "@/lib/auth/userSession";
import {
  getOrderById,
  setOrderPayment,
  markOrderPaid,
} from "@/lib/repositories/orders";
import { getChargeStatus } from "@/lib/payments/abacatepay";
import AccountShell from "@/components/account/AccountShell";
import CancelOrderButton from "@/components/account/CancelOrderButton";
import OrderStatusTracker, {
  type TrackerOrder,
} from "@/components/account/OrderStatusTracker";
import PhotoManager from "@/components/account/PhotoManager";
import ContentEditor from "@/components/account/ContentEditor";
import SiteControls from "@/components/account/SiteControls";
import ThemeEditor from "@/components/account/ThemeEditor";
import PhotoOrder from "@/components/account/PhotoOrder";
import { getTemplate } from "@/lib/templates/registry";
import { getTemplateStyle } from "@/lib/templates";
import { parseThemeSpec, clampThemeFonts } from "@/lib/theme/spec";
import { FONT_STYLES } from "@/lib/customization";
import { SLOT_LABEL, type PhotoSlot } from "@/lib/repositories/sitePhotos";
import { getSiteContent } from "@/lib/repositories/siteContent";
import {
  listSiteSections,
  podeDesligar,
} from "@/lib/repositories/siteSections";
import { SECTION_LABELS } from "@/lib/site/sectionLabels";
import { isSectionKey, type SectionKey } from "@/lib/templates/contract";
import { toEditorValues } from "@/lib/site/contentFields";
import { getSiteByOrderId } from "@/lib/repositories/sites";
import {
  listSitePhotosFresh,
  photoLimitForTier,
} from "@/lib/repositories/sitePhotos";
import { isStorageEnabled } from "@/lib/storage/supabase";
import { canCancelOrder, type OrderStatus } from "@/lib/orderStatus";
import type { PackageTier } from "@/lib/packages";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Acompanhar pedido | ${SITE_NAME}`,
};

export default async function OrderTrackerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ publicacao?: string }>;
}) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/conta/entrar");

  const { id } = await params;
  const order = await getOrderById(id);
  if (!order || order.userId !== userId) redirect("/conta/pedidos");
  if (order.status === "draft") redirect(`/conta/pedido/${order.id}`);

  // Confirmação de pagamento sem depender de webhook: ao voltar do checkout,
  // consultamos o status real da cobrança e atualizamos o pedido.
  let status = order.status as OrderStatus;
  let paymentStatus = order.paymentStatus ?? null;
  if (order.paymentId && order.paymentStatus !== "PAID") {
    const remote = await getChargeStatus(order.paymentId);
    if (remote && remote !== order.paymentStatus) {
      if (remote === "PAID") {
        const updated = await markOrderPaid(order.id);
        status = (updated?.status ?? status) as OrderStatus;
        paymentStatus = "PAID";
      } else {
        await setOrderPayment(order.id, {
          paymentId: order.paymentId,
          paymentUrl: order.paymentUrl,
          paymentStatus: remote,
        });
        paymentStatus = remote;
      }
    }
  }

  // O site já existe desde o envio do pedido (provisionamento automático), e é
  // nele que as fotos penduram — por isso o painel de fotos vive aqui, e não
  // no briefing: o casal vê a prévia e preenche os lugares que estão vazios.
  const site = await getSiteByOrderId(order.id);

  // Rede de segurança para quem pagou e voltou por fora do checkout (fechou a
  // aba, abriu o link do e-mail dias depois, webhook desligado). Publicar
  // exige derrubar cache, e isso não pode acontecer durante o render — então
  // manda para a rota que sabe fazer isso e volta para cá.
  //
  // O marcador `publicacao=erro` corta o laço: se a rota não conseguiu
  // publicar, a tela não a chama de novo.
  const { publicacao } = await searchParams;
  const publicacaoFalhou = publicacao === "erro";
  if (
    paymentStatus === "PAID" &&
    site !== null &&
    site.status !== "published" &&
    site.status !== "archived" &&
    !publicacaoFalhou
  ) {
    redirect(`/api/pagamento/confirmar?pedido=${order.id}`);
  }

  const podeSubirFotos = site !== null && isStorageEnabled();
  const fotos = podeSubirFotos ? await listSitePhotosFresh(site.id) : [];

  // Conteúdo editável pelo casal (Fase 4). Lido sem cache de propósito: quem
  // acabou de salvar precisa ver o próprio texto no formulário, não uma
  // versão anterior.
  const conteudo = site ? await getSiteContent(site.id) : null;
  // Arquivado é decisão de tirar do ar; não faz sentido oferecer edição.
  const podeEditarConteudo = site !== null && site.status !== "archived";

  // Seções: o provisionamento semeia conforme o pacote, então o que está no
  // banco já é o que este pacote libera — não precisa filtrar por tier aqui.
  const linhasSecoes = site
    ? (await listSiteSections(site.id)).filter((s) => isSectionKey(s.sectionKey))
    : [];
  // As setas só valem entre seções móveis: `cover` e `footer` são âncoras, e
  // oferecer "subir" para quem já é o primeiro móvel só gera erro na volta.
  const moveis = linhasSecoes.filter((s) =>
    podeDesligar(s.sectionKey as SectionKey)
  );
  const secoes = linhasSecoes.map((s) => {
    const key = s.sectionKey as SectionKey;
    const idxMovel = moveis.findIndex((m) => m.sectionKey === s.sectionKey);
    return {
      key,
      label: SECTION_LABELS[key].label,
      descricao: SECTION_LABELS[key].descricao,
      enabled: s.enabled,
      fixa: !podeDesligar(key),
      podeSubir: idxMovel > 0,
      podeDescer: idxMovel >= 0 && idxMovel < moveis.length - 1,
    };
  });

  // Tema (cores e fontes) editável pelo casal. As fontes ofertadas são as do
  // MOLDE — o mesmo recorte que `clampThemeFonts` faz ao renderizar, para o
  // formulário não oferecer o que o site descartaria.
  const template = site ? getTemplate(site.templateId) : null;
  const temaAtual =
    site && template
      ? clampThemeFonts(
          parseThemeSpec(site.theme) ?? template.defaultTheme,
          new Set(Object.keys(template.fonts)),
          template.defaultTheme.fonts
        )
      : null;
  // templateId é nullable: o casal pode ter pedido "montar do zero". Sem
  // molde não há catálogo de fontes nem preset, então o editor de estilo não
  // aparece — o site desses casos é montado à mão pela equipe.
  const nomeDoModelo = site?.templateId
    ? (getTemplateStyle(site.templateId)?.name ?? site.templateId)
    : "";
  const fontesDoModelo = template
    ? FONT_STYLES.filter((f) => f.id in template.fonts).map((f) => ({
        id: f.id,
        nome: f.name,
        descricao: f.description,
      }))
    : [];

  // Fotos com marcação de ponta, para as setas já chegarem desabilitadas em
  // quem é primeira ou última do próprio slot.
  //
  // A URL é `/f/<id>`, a mesma rota que o site usa — nunca URL do Storage.
  // Ver §8.1 do SDD: a rota repassa os bytes de um bucket privado.
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
    <AccountShell active="pedidos">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Acompanhar pedido
          </h1>
          <p className="text-sm text-(--color-olive)/70 max-w-md">
            Cada etapa do site de vocês, da produção até o site no ar.
          </p>
        </div>
        <Link
          href="/conta/pedidos"
          className="text-xs text-(--color-olive)/70 underline underline-offset-4 hover:text-(--color-olive)"
        >
          ← Todos os pedidos
        </Link>
      </div>

      <OrderStatusTracker
        orderId={order.id}
        order={
          {
            status,
            packageTier: order.packageTier as PackageTier,
            coupleNames: order.coupleNames,
            previewUrl: order.previewUrl,
            siteUrl: order.siteUrl,
            adminMessage: order.adminMessage,
            priceCents: order.priceCents,
            paymentStatus,
          } satisfies TrackerOrder
        }
      />

      {publicacaoFalhou && (
        <p
          role="alert"
          className="rounded-xl border border-(--color-gold)/50 bg-(--color-blush) px-4 py-3 text-sm text-(--color-olive) leading-relaxed"
        >
          Recebemos o pagamento de vocês, mas não conseguimos colocar o site no
          ar automaticamente. Já estamos vendo isso — se preferir, chame a gente
          no WhatsApp que resolvemos na hora.
        </p>
      )}

      {site !== null && secoes.length > 0 && (
        <SiteControls
          siteId={site.id}
          status={site.status}
          slug={site.slug}
          secoes={secoes}
          jaFoiPublicado={site.publishedAt !== null}
        />
      )}

      {podeEditarConteudo && (
        <ContentEditor
          siteId={site.id}
          values={toEditorValues(conteudo)}
          previewUrl={order.previewUrl ?? order.siteUrl}
        />
      )}

      {site !== null && temaAtual !== null && (
        <ThemeEditor
          siteId={site.id}
          nomeDoModelo={nomeDoModelo}
          fontesDoModelo={fontesDoModelo}
          values={{ ...temaAtual.palette, ...temaAtual.fonts }}
          fotoSlot={<PhotoOrder siteId={site.id} fotos={fotosOrdenaveis} />}
        />
      )}

      {podeSubirFotos && (
        <PhotoManager
          siteId={site.id}
          limit={photoLimitForTier(site.tier as PackageTier)}
          photos={fotos.map((f) => ({
            id: f.id,
            slot: f.slot,
            width: f.width,
            height: f.height,
            blurDataUrl: f.blurDataUrl,
          }))}
        />
      )}

      {canCancelOrder(status) && (
        <div className="flex flex-col gap-1 border-t border-(--color-gold)/30 pt-4">
          <CancelOrderButton orderId={order.id} label="Cancelar este pedido" />
          <p className="text-xs text-(--color-muted)">
            Dá para cancelar enquanto o pedido ainda não entrou em produção.
          </p>
        </div>
      )}
    </AccountShell>
  );
}
