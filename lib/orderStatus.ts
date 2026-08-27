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
  /* Cancelado NÃO é etapa do fluxo, e por isso entra no fim.
     
     A ordem deste array é a ordem real do caminho até o site no ar, e mais de
     um lugar lê posição. Pôr `cancelled` no meio deslocaria índice de coisa
     que não tem nada a ver com ele.
     
     Ele existe porque cancelar APAGAVA a linha do pedido — a única exceção
     viva à regra 6 da §14 do SDD ("nada é apagado ou reescrito"). O custo
     disso não era teórico: a operação não conseguia ver um cancelamento nem
     contar quantos foram, e o site que não podia ser apagado junto (publicado,
     ou com convidados) ficava órfão, acumulando. Ver
     `specs/painel-casal/013-cancelar-vira-estado`. */
  "cancelled",
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
  // ATENÇÃO ao mexer nestes dois textos: eles PROMETIAM UMA ESPERA QUE NÃO
  // EXISTE.
  //
  // Diziam "nossa equipe vai começar a montar em breve" e "logo a prévia
  // aparece aqui" — copy da época em que um humano montava o site à mão. Com
  // o provisionamento automático (Fase 3), `submitOrderAction` cria o site no
  // MESMO request e o pedido já nasce em `preview_ready`: a prévia está pronta
  // antes de o casal terminar de ler a frase.
  //
  // Prometer espera onde não há espera é vender o produto errado — o
  // concorrente entrega o site em minutos e diz isso. Nunca reintroduza
  // "em breve", "logo" ou "nossa equipe vai" aqui.
  submitted: {
    short: "Pedido recebido",
    icon: "📨",
    title: "Pedido recebido — a prévia já está pronta",
    description:
      "O site de vocês foi criado agora. Abram a prévia, comecem a preencher o conteúdo e mudem o que quiserem: cada alteração aparece na hora.",
    adminLabel: "Pedido recebido",
  },
  in_production: {
    short: "Ajustes",
    icon: "🎨",
    title: "Estamos dando uma olhada no site de vocês",
    description:
      "A prévia continua no ar e vocês podem editar normalmente. Esta etapa só aparece quando pedimos ou fazemos um ajuste à mão.",
    adminLabel: "Em ajustes (manual)",
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
      "Prontinho! O site está publicado e pronto para compartilhar com todo mundo. Parabéns, casal!",
    adminLabel: "Site no ar (finalizado)",
  },
  /* Cancelado não aparece no acompanhamento do casal — `TRACKER_STEPS` não o
     inclui, e a lista dele filtra o estado fora. Este texto existe para a
     operação, em `/admin/pedidos`.

     Sem exclamação e sem emoji: cancelar é uma escolha do casal, e comemorar
     ou lamentar por ele seria a tela opinando sobre uma decisão que não é
     dela. */
  cancelled: {
    short: "Cancelado",
    icon: "",
    title: "Pedido cancelado",
    description: "Este pedido foi cancelado pelo casal antes do pagamento.",
    adminLabel: "Cancelado pelo casal",
  },
};

/** Índice da etapa no fluxo do tracker (-1 se for rascunho / desconhecido). */
export function trackerStepIndex(status: OrderStatus): number {
  return (TRACKER_STEPS as readonly OrderStatus[]).indexOf(status);
}

/**
 * Só dá para cancelar antes de entrar em produção: rascunho ou pedido
 * recebido mas ainda não iniciado.
 */
export function canCancelOrder(status: OrderStatus): boolean {
  // A linha é o PAGAMENTO, não a produção.
  //
  // A regra antiga era `draft || submitted`, escrita quando um humano movia o
  // pedido de etapa. Com o provisionamento automático (Fase 3), o envio cria
  // o site e salta para `preview_ready` no MESMO request — a janela de
  // `submitted` dura milissegundos. Na prática o casal nunca conseguia
  // cancelar: o botão simplesmente não aparecia.
  //
  // Depois de pago, cancelar deixa de ser um botão e vira conversa de
  // estorno — por isso `paid` e `published` ficam de fora.
  // E `cancelled` sai também: cancelar duas vezes não é operação.
  return (
    status !== "paid" && status !== "published" && status !== "cancelled"
  );
}
