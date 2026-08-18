import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  setOrderPayment,
  markOrderPaid,
} from "@/lib/repositories/orders";
import { getChargeStatus } from "@/lib/payments/abacatepay";
import CancelOrderButton from "@/components/account/CancelOrderButton";
import ProofStamp from "@/components/account/ProofStamp";
import OrderStatusTracker, {
  type TrackerOrder,
} from "@/components/account/OrderStatusTracker";
import LivePreview from "@/components/account/LivePreview";
import ReguaDeNumeros from "@/components/account/manage/ReguaDeNumeros";
import OQueFalta from "@/components/account/manage/OQueFalta";
import AreasEditaveis from "@/components/account/manage/AreasEditaveis";
import { getSiteContent } from "@/lib/repositories/siteContent";
import { toEditorValues } from "@/lib/site/contentFields";
import { metricasDoSite } from "@/lib/repositories/siteMetrics";
import { oQueFalta } from "@/lib/site/oQueFalta";
import { carregarGerenciamento } from "@/lib/site/manageData";
import { canCancelOrder, type OrderStatus } from "@/lib/orderStatus";
import type { PackageTier } from "@/lib/packages";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Nosso site | ${SITE_NAME}`,
};

/**
 * Início do painel: onde o pedido está, a prévia ao vivo, e nada mais.
 *
 * A confirmação de pagamento mora AQUI e não no layout de propósito: ela
 * consulta a API do AbacatePay e tem efeito colateral. No layout, rodaria a
 * cada troca de aba — seis chamadas para navegar seis telas.
 */
export default async function GerenciarInicioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ publicacao?: string; provisionamento?: string }>;
}) {
  const { id } = await params;
  const { order, site } = await carregarGerenciamento(id);

  // Confirmação sem depender de webhook: ao voltar do checkout, consultamos o
  // status real da cobrança e atualizamos o pedido.
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

  // Rede de segurança para quem pagou e voltou por fora do checkout. Publicar
  // exige derrubar cache, e isso não pode acontecer durante o render — então
  // manda para a rota que sabe fazer isso e volta. `publicacao=erro` corta o
  // laço se ela não conseguiu. Ver AGENTS.md.
  const { publicacao, provisionamento } = await searchParams;
  const publicacaoFalhou = publicacao === "erro";

  // Pedido enviado e SEM site: o provisionamento falhou no envio e nada tenta
  // de novo. Manda para a rota que cria, e volta. Mesmo desenho da publicação
  // logo abaixo — escrita não pode acontecer no render de uma página.
  //
  // `provisionamento=erro` corta o laço; sem ele, uma falha persistente faria
  // a tela redirecionar para si mesma sem parar.
  const provisionamentoFalhou = provisionamento === "erro";
  if (site === null && !provisionamentoFalhou) {
    redirect(`/api/pedido/provisionar?pedido=${order.id}`);
  }
  if (
    paymentStatus === "PAID" &&
    site !== null &&
    site.status !== "published" &&
    site.status !== "archived" &&
    !publicacaoFalhou
  ) {
    redirect(`/api/pagamento/confirmar?pedido=${order.id}`);
  }

  // Só busca quando HÁ site — e em paralelo, porque cada ida ao banco custa
  // ~171ms medidos e as duas abrem a tela.
  const [metricas, falta, conteudo] = site
    ? await Promise.all([
        metricasDoSite(site.id),
        oQueFalta(site.id, order.id, order.packageTier as PackageTier),
        getSiteContent(site.id),
      ])
    : [null, null, null];

  // `toEditorValues` e nao uma conversao propria: ele traduz o timestamp para
  // dia+hora NO FUSO DO SITE e devolve hora vazia quando e meia-noite (o
  // combinado de "nao informado"). Refazer isso aqui criaria um segundo
  // caminho para a data — e e assim que a cerimonia das 16h vira 19h.
  const valoresEditaveis = site ? toEditorValues(conteudo) : null;

  return (
    <div className="flex flex-col gap-12">
      {/* O carimbo fica ao lado do título, não dentro do acompanhamento: é a
          primeira coisa que o casal procura ao reabrir a tela, e é aqui que a
          ousadia da refatoração inteira foi gasta — uma vez, num lugar só. */}
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex flex-col gap-3">
          <span className="meta text-(--c-ink-2)">Nosso pedido</span>
          <h1 className="t-display text-2xl md:text-[30px] leading-[1.15] text-(--c-ink)">
            O site de vocês
          </h1>
          <p className="text-base leading-relaxed text-(--c-ink-2) max-w-[52ch]">
            Cada etapa, da produção até o site no ar.
          </p>
        </div>
        <div className="pt-2 pr-2">
          <ProofStamp status={status} quando={order.updatedAt} />
        </div>
      </div>

      {/* Os números do site. Vêm do painel do iCasei, mas em régua de mono em
          vez dos quatro cartões coloridos — o cartão chamaria mais atenção que
          a prévia, e a prévia é o que o casal veio ver. */}
      {metricas && <ReguaDeNumeros metricas={metricas} />}

      {/* A PRÉVIA VEM PRIMEIRO, antes do acompanhamento.
          Ela estava no fim da página, depois do stepper e do bloco de
          pagamento — o casal precisava rolar para encontrar a única coisa que
          ele realmente quer ver. É o site dele; é o que abre a tela.
          Não depende de status: existindo site, a prévia aparece. */}
      {site !== null && site.status !== "archived" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
          {/* As ÁREAS EDITÁVEIS ao lado da prévia, não noutra tela.
              Editar e ver o resultado são o mesmo gesto — separá-los em
              telas diferentes é o que faz um formulário parecer burocracia.
              A tela /conteudo continua para quem quer o formulário completo,
              com Pix e mensagem de presente. */}
          {valoresEditaveis && (
            <AreasEditaveis siteId={site.id} valores={valoresEditaveis} />
          )}

        <LivePreview
          src={`/preview/${site.previewToken}`}
          descricao="É o site de verdade, com o conteúdo de vocês. Depois de salvar alguma mudança, clique em atualizar."
          fullBleed={false}
        />
        </div>
      )}

      {falta && <OQueFalta {...falta} />}

      {/* Sem site, o casal ficaria olhando um acompanhamento que nunca anda.
          O provisionamento roda no mesmo request do envio; se ele falhou, o
          pedido fica em "recebido" para sempre e a prévia nunca chega. Dizer
          isso é melhor que deixar a tela em silêncio — e o texto não promete
          prazo nenhum, porque não há prazo: há uma falha a investigar. */}
      {site === null && provisionamentoFalhou && (
        <div className="surface-raised rounded-[3px] p-6 flex flex-col gap-2">
          <span className="meta text-(--c-mark)">Prévia indisponível</span>
          <p className="text-base leading-relaxed text-(--c-ink-2) max-w-[52ch]">
            O site de vocês ainda não foi criado. Isso não é normal — o pedido
            chegou, mas a montagem não completou. Fale com a gente e a gente
            resolve na hora.
          </p>
        </div>
      )}

      {/* O acompanhamento SOME quando o site não existe.
          O passo 1 afirma "Pedido recebido — a prévia já está pronta", texto
          escrito assumindo que o provisionamento sempre completa no mesmo
          request. Quando ele falha, essa frase aparecia logo abaixo do aviso
          dizendo o contrário — a tela se contradizia. Acompanhar o progresso
          de algo que não começou também não informa nada: o aviso acima é a
          informação inteira nesse estado. */}
      {!(site === null && provisionamentoFalhou) && (
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
      )}

      {publicacaoFalhou && (
        <p
          role="alert"
          className="surface-sunken rounded-[3px] px-4 py-3 text-[15px] leading-relaxed text-(--c-ink) max-w-[60ch]"
        >
          Recebemos o pagamento de vocês, mas não conseguimos colocar o site no
          ar automaticamente. Já estamos vendo isso — se preferir, chame a gente
          no WhatsApp que resolvemos na hora.
        </p>
      )}

      {canCancelOrder(status) && (
        <div className="flex flex-col gap-1 border-t border-(--c-rule) pt-5">
          <CancelOrderButton orderId={order.id} label="Cancelar este pedido" />
          <p className="text-[13px] text-(--c-ink-2)">
            Dá para cancelar enquanto o pedido ainda não entrou em produção.
          </p>
        </div>
      )}
    </div>
  );
}
