// Ciclo de vida de um pedido, do rascunho ao site no ar. A ordem aqui é a
// ordem real do fluxo — é o que o casal acompanha em /conta/pedidos e o que
// o admin controla em /admin/pedidos.
export const ORDER_STATUSES = [
  "draft",
  "submitted",
  "in_production",
  "preview_ready",
  "paid",
  "published",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

// Etapas visíveis no acompanhamento do casal. "draft" fica de fora — ainda é
// rascunho, o pedido nem foi enviado.
export const TRACKER_STEPS = [
  "submitted",
  "in_production",
  "preview_ready",
  "paid",
  "published",
] as const satisfies readonly OrderStatus[];

export type StatusMeta = {
  // rótulo curto no stepper
  short: string;
  // emoji do passo
  icon: string;
  // título grande quando é a etapa atual
  title: string;
  // texto pro casal quando é a etapa atual
  description: string;
  // rótulo pro admin no seletor de status
  adminLabel: string;
};

export const STATUS_META: Record<OrderStatus, StatusMeta> = {
  draft: {
    short: "Rascunho",
    icon: "📝",
    title: "Rascunho em aberto",
    description:
      "Vocês ainda não enviaram o pedido. Terminem de montar e cliquem em enviar.",
    adminLabel: "Rascunho",
  },
  submitted: {
    short: "Pedido recebido",
    icon: "📨",
    title: "Recebemos o pedido de vocês!",
    description:
      "Está tudo aqui. Nossa equipe vai começar a montar o site em breve — pode acompanhar por esta página.",
    adminLabel: "Pedido recebido",
  },
  in_production: {
    short: "Em produção",
    icon: "🎨",
    title: "Estamos montando o site de vocês",
    description:
      "Mãos à obra! Estamos desenhando cada detalhe com base no que vocês pediram. Logo a prévia aparece aqui.",
    adminLabel: "Em produção",
  },
  preview_ready: {
    short: "Prévia pronta",
    icon: "👀",
    title: "A prévia do site está pronta!",
    description:
      "Deem uma olhada no site de vocês. Gostaram? É só efetuar o pagamento para a gente colocar tudo no ar.",
    adminLabel: "Prévia pronta",
  },
  paid: {
    short: "Pagamento confirmado",
    icon: "💚",
    title: "Pagamento confirmado!",
    description:
      "Recebemos o pagamento — obrigado! Estamos publicando o site de vocês. Falta pouquinho.",
    adminLabel: "Pagamento confirmado",
  },
  published: {
    short: "Site no ar",
    icon: "🎉",
    title: "O site de vocês está no ar!",
    description:
      "Prontinho! O site está publicado e pronto para compartilhar com todo mundo. Parabéns, casal 💚",
    adminLabel: "Site no ar (finalizado)",
  },
};

/** Índice da etapa no fluxo do tracker (-1 se for rascunho / desconhecido). */
export function trackerStepIndex(status: OrderStatus): number {
  return (TRACKER_STEPS as readonly OrderStatus[]).indexOf(status);
}
