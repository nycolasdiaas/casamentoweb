import type { OrderStatus } from "@/lib/orderStatus";

/**
 * A ASSINATURA da plataforma: o estado do pedido como carimbo de prova.
 *
 * Todo painel do mundo mostra status como pílula colorida arredondada. Aqui
 * ele é o carimbo que um revisor bate numa folha — sobreimpresso, rotacionado,
 * vazado, na tinta de registro. Sai do vocabulário da GRÁFICA, que é o mundo
 * do produto (papelaria de casamento), e não do vocabulário de "dashboard".
 *
 * Regras que o mantêm funcionando, e que valem mais que o desenho:
 *
 * - É UM elemento, num lugar SÓ — a tela que o casal reabre para ver se saiu
 *   do forno. Um segundo elemento ousado transformaria os dois em ruído.
 * - Pinta um dado que JÁ EXISTE (o status e o `updatedAt` do pedido). Não
 *   inventa informação para ter o que carimbar.
 * - É estático: sobrevive a `prefers-reduced-motion` sem exceção.
 * - Não pede biblioteca: `border`, `rotate()` e a mono.
 */

/**
 * Vocabulário de gráfica, não de sistema.
 *
 * Nenhum rótulo promete espera. `submitted` já nasce com a prévia pronta
 * (o provisionamento é no mesmo request), então "em fila" ou "aguardando"
 * seriam mentira — o mesmo erro que os textos de STATUS_META carregam um
 * aviso para nunca repetir.
 */
const CARIMBO: Record<OrderStatus, string> = {
  draft: "Rascunho",
  submitted: "Pedido recebido",
  in_production: "Em revisão",
  preview_ready: "Prova pronta",
  paid: "Prova aprovada",
  published: "No ar",
};

/**
 * Data em fuso fixo de São Paulo.
 *
 * Sem o `timeZone` explícito a formatação sairia no fuso de quem renderiza, e
 * um pedido tocado às 22h viraria o dia seguinte no carimbo. É a mesma
 * armadilha que `contentInput.ts` documenta para a hora da cerimônia.
 */
function dataCurta(quando: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  })
    .format(quando)
    .replace(/\//g, ".");
}

export default function ProofStamp({
  status,
  quando,
}: {
  status: OrderStatus;
  quando: Date;
}) {
  return (
    <span className="stamp">
      <span className="stamp-titulo">{CARIMBO[status]}</span>
      <span className="stamp-data">{dataCurta(quando)}</span>
    </span>
  );
}
