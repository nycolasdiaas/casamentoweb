import { eq, desc, and, inArray, sql, type SQL, type AnyColumn } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { orders, users } from "@/lib/db/schema";
import type { PackageTier } from "@/lib/packages";
import type { OrderStatus } from "@/lib/orderStatus";

export type OrderInput = {
  packageTier: PackageTier;
  templateStyle?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  /* Estava faltando aqui, embora `parseOrderForm` já a devolvesse: entrava no
     banco de carona no spread, sem o TypeScript conferir nada. */
  tertiaryColor?: string;
  fontStyle?: string;
  styleNotes?: string;
  coupleNames?: string;
  weddingDate?: string;
  photosLink?: string;
  notes?: string;
  /** Conteúdo do site enquanto o pedido é rascunho. Ver `orders.draftContent`. */
  draftContent?: Record<string, string>;
};

/** Todos os pedidos do casal, do mais recente ao mais antigo. */
export async function listOrdersByUserId(userId: string) {
  return db.query.orders.findMany({
    where: eq(orders.userId, userId),
    orderBy: [desc(orders.updatedAt)],
  });
}

/** Cria um novo pedido (rascunho) para o casal. */
export async function createOrder(userId: string, input: OrderInput) {
  const [created] = await db
    .insert(orders)
    .values({ userId, ...input })
    .returning();
  return created;
}

/** Atualiza o conteúdo de um pedido existente (usado só em rascunhos). */
export async function updateOrder(orderId: string, input: OrderInput) {
  const [updated] = await db
    .update(orders)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(orders.id, orderId))
    .returning();
  return updated ?? null;
}

/** Marca um pedido específico como enviado. */
export async function submitOrderById(orderId: string) {
  const [updated] = await db
    .update(orders)
    .set({ status: "submitted", updatedAt: new Date() })
    .where(eq(orders.id, orderId))
    .returning();
  return updated ?? null;
}

/** Cancela = remove o pedido (só permitido antes da produção). */
/**
 * Cancelar é MARCAR, não apagar.
 *
 * A função que existia aqui, `deleteOrder`, fazia `DELETE FROM orders` — a
 * única exceção viva à regra 6 da §14 do SDD, *"nada é apagado ou
 * reescrito"*. Ela saiu, e não ficou exportada sem uso: uma função que apaga
 * pedido viva no repositório é um convite para alguém chamá-la.
 *
 * O que se ganhou apagando o `DELETE`:
 *
 * - a operação passa a **ver** o cancelamento (a pílula `Cancelados` de
 *   `/admin/pedidos` existia no desenho e não tinha o que mostrar);
 * - o **site órfão some**. Quando o site não pode ser apagado junto —
 *   publicado, ou com convidados, os dois protegidos por
 *   `cancelarPedidoComSite` — o `sites.order_id` virava null e o site ficava
 *   acumulando invisível, como o `AGENTS.md` registrava.
 *
 * O casal continua sem ver o pedido: quem filtra é a tela.
 */
export async function cancelarOrder(orderId: string) {
  await db
    .update(orders)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(orders.id, orderId));
}

/** Acha o pedido dono de uma cobrança AbacatePay (usado no webhook). */
export async function getOrderByPaymentId(paymentId: string) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.paymentId, paymentId),
  });
  return order ?? null;
}

/** Pedido específico (com o casal), para admin e fluxo de pagamento. */
export async function getOrderById(orderId: string) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: { user: true },
  });
  return order ?? null;
}

/** Para o admin acompanhar os pedidos que chegam. */
/**
 * Achata acento em SQL, sem depender de extensão.
 *
 * `unaccent()` resolveria em uma chamada, mas é extensão do Postgres e pode
 * não estar instalada — descobrir isso em produção, na tela que o dono usa
 * para socorrer um casal, é o pior lugar possível. `translate` é função de
 * base e funciona em qualquer instalação.
 *
 * Por que achatar: o operador digita "ana" com o casal cadastrado como "Aná",
 * ou o contrário. Busca que erra por causa de um til é busca que não serve.
 */
function semAcento(expr: SQL | AnyColumn) {
  return sql`translate(lower(${expr}),
    'áàâãäéèêëíìîïóòôõöúùûüçñ',
    'aaaaaeeeeiiiiooooouuuucn')`;
}

export type FiltroDePedidos = {
  /** Estados a incluir. Ausente = todos. */
  estados?: readonly OrderStatus[];
  /** Texto livre: nome do casal, e-mail ou início do id. */
  busca?: string;
};

/**
 * Os pedidos para o `/admin/pedidos`, já filtrados NO BANCO.
 *
 * Filtrar em memória funciona com os 312 pedidos de hoje e deixa de funcionar
 * bem antes de virar problema visível — e `/admin` é a tela de socorro, onde
 * lentidão custa o atendimento de um casal esperando.
 */
export async function listOrdersWithUsers(filtro: FiltroDePedidos = {}) {
  const termo = filtro.busca?.trim().replace(/^#/, "") ?? "";

  const condicoes: SQL[] = [];

  if (filtro.estados && filtro.estados.length > 0) {
    condicoes.push(inArray(orders.status, [...filtro.estados]));
  }

  if (termo) {
    const achatado = termo
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
    const como = `%${achatado}%`;

    condicoes.push(
      sql`(
        ${semAcento(orders.coupleNames)} like ${como}
        or ${semAcento(users.email)} like ${como}
        or ${orders.id}::text like ${`${achatado}%`}
      )`
    );
  }

  /* `innerJoin` e não `query.findMany({ with })`: a busca precisa alcançar
     `users.email`, e o `with` do relacional não deixa filtrar pela tabela
     ligada. O formato de saída é remontado igual ao de antes para OrderCard
     e a página não notarem a troca. */
  const linhas = await db
    .select({ pedido: orders, usuario: users })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .where(condicoes.length ? and(...condicoes) : undefined)
    .orderBy(desc(orders.updatedAt));

  return linhas.map((l) => ({ ...l.pedido, user: l.usuario }));
}

/** Admin move o pedido pela esteira de produção. */
export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const [updated] = await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, orderId))
    .returning();
  return updated ?? null;
}

export type AdminOrderFields = {
  previewUrl?: string | null;
  siteUrl?: string | null;
  priceCents?: number | null;
  adminMessage?: string | null;
};

/** Admin preenche prévia, link final, preço e recado pro casal. */
export async function updateOrderAdminFields(
  orderId: string,
  fields: AdminOrderFields
) {
  const [updated] = await db
    .update(orders)
    .set({ ...fields, updatedAt: new Date() })
    .where(eq(orders.id, orderId))
    .returning();
  return updated ?? null;
}

/** Guarda os dados da cobrança AbacatePay no pedido. */
export async function setOrderPayment(
  orderId: string,
  payment: {
    paymentId?: string | null;
    paymentUrl?: string | null;
    paymentStatus?: string | null;
  }
) {
  const [updated] = await db
    .update(orders)
    .set({ ...payment, updatedAt: new Date() })
    .where(eq(orders.id, orderId))
    .returning();
  return updated ?? null;
}

/**
 * Confirma o pagamento: marca paymentStatus=PAID e, se o pedido estava na
 * prévia, avança para "paid". Não rebaixa status já publicado.
 */
export async function markOrderPaid(orderId: string) {
  const existing = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });
  if (!existing) return null;

  const nextStatus =
    existing.status === "preview_ready" || existing.status === "submitted"
      ? "paid"
      : existing.status;

  const agora = new Date();

  const [updated] = await db
    .update(orders)
    .set({
      paymentStatus: "PAID",
      status: nextStatus,
      /* A hora do pagamento, escrita UMA vez.
      
         `existing.paidAt ?? agora` e não `agora` direto: esta função é chamada
         pelos dois caminhos de confirmação (o webhook e a volta do casal do
         checkout), e o segundo costuma acontecer depois. Sobrescrever moveria
         a hora do recibo para a segunda chamada, que não é quando o dinheiro
         entrou. */
      paidAt: existing.paidAt ?? agora,
      updatedAt: agora,
    })
    .where(eq(orders.id, orderId))
    .returning();
  return updated ?? null;
}
