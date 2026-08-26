import { STATUS_META, type OrderStatus } from "@/lib/orderStatus";

/**
 * A4 · Etiqueta de status.
 *
 * Contorno para tudo que está em curso; PREENCHIDA só para "no ar". Um estado
 * é uma conquista e cinco são um varal — se todas fossem sólidas, nenhuma
 * teria peso, que é o defeito de qualquer painel com seis pílulas coloridas
 * na mesma linha.
 *
 * Note que ela NÃO carrega emoji. `STATUS_META.icon` existe e continua sendo
 * usado no acompanhamento (onde o passo é grande e o emoji é ilustração); numa
 * etiqueta de 11px o emoji vira ruído e some no leitor de tela.
 */

export type TomDaEtiqueta = "neutro" | "ok" | "warn" | "danger" | "gold" | "noar";

const TOM: Record<TomDaEtiqueta, string> = {
  neutro: "",
  ok: "etiqueta-ok",
  warn: "etiqueta-warn",
  danger: "etiqueta-danger",
  gold: "etiqueta-gold",
  noar: "etiqueta-noar",
};

export function Etiqueta({
  tom = "neutro",
  ponto = true,
  children,
  className,
}: {
  tom?: TomDaEtiqueta;
  /** O ponto some na sólida — sobre o verde cheio ele não tem contraste. */
  ponto?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`etiqueta ${TOM[tom]} ${className ?? ""}`}>
      {ponto && tom !== "noar" && (
        <span className="etiqueta-ponto" aria-hidden="true" />
      )}
      {children}
    </span>
  );
}

/**
 * O tom de cada etapa do pedido. Fica aqui, e não em `lib/orderStatus.ts`,
 * porque é decisão de DESENHO: `orderStatus` descreve o fluxo, não a paleta —
 * e o dia em que a etiqueta mudar de cor não se mexe na regra de negócio.
 */
const TOM_DO_STATUS: Record<OrderStatus, TomDaEtiqueta> = {
  draft: "neutro",
  submitted: "neutro",
  in_production: "warn",
  preview_ready: "gold",
  paid: "ok",
  published: "noar",
};

export function EtiquetaDoPedido({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <Etiqueta tom={TOM_DO_STATUS[status]} className={className}>
      {status === "published" ? "No ar" : STATUS_META[status].short}
    </Etiqueta>
  );
}
