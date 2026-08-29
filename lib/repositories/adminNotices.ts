import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { adminNotices } from "@/lib/db/schema";

/**
 * Recados que o time manda para o casal — migração 0022.
 *
 * O que existia antes era `orders.admin_message`: um campo só, sobrescrito a
 * cada envio. Aqui cada recado é uma linha, com quem mandou, quando, e se o
 * casal já leu.
 *
 * Escopado por `orderId` sempre. O recado é do acompanhamento de UM pedido, e
 * um recado aparecendo no painel de outro casal seria o mesmo vazamento que a
 * §1.2 do SDD trata como o pior possível deste produto.
 *
 * ── Sem `use cache` aqui, de propósito ─────────────────────────────────────
 *
 * O painel do casal já é dinâmico (lê relógio para montar os avisos), e o
 * recado precisa aparecer no primeiro carregamento depois do envio. Uma
 * etiqueta de cache aqui daria ao casal uma tela que diz "nenhum recado"
 * enquanto o e-mail avisando do recado já está na caixa de entrada dele.
 */

export type RecadoDoTime = {
  id: string;
  orderId: string;
  adminName: string;
  title: string;
  body: string;
  readAt: Date | null;
  emailSentAt: Date | null;
  createdAt: Date;
};

/** Cria o recado. O e-mail é responsabilidade de quem chama — ver a action. */
export async function criarRecado(dados: {
  orderId: string;
  adminId: string | null;
  adminName: string;
  title: string;
  body: string;
}): Promise<RecadoDoTime> {
  const [criado] = await db
    .insert(adminNotices)
    .values({
      orderId: dados.orderId,
      adminId: dados.adminId,
      adminName: dados.adminName,
      title: dados.title,
      body: dados.body,
    })
    .returning();

  return criado as RecadoDoTime;
}

/** Do mais novo para o mais velho — é a ordem em que o casal quer ler. */
export async function listarRecados(orderId: string): Promise<RecadoDoTime[]> {
  const linhas = await db
    .select()
    .from(adminNotices)
    .where(eq(adminNotices.orderId, orderId))
    .orderBy(desc(adminNotices.createdAt));

  return linhas as RecadoDoTime[];
}

/** Só os que o casal ainda não leu — é o que acende o sino. */
export async function recadosNaoLidos(orderId: string): Promise<RecadoDoTime[]> {
  const linhas = await db
    .select()
    .from(adminNotices)
    .where(
      and(eq(adminNotices.orderId, orderId), isNull(adminNotices.readAt))
    )
    .orderBy(desc(adminNotices.createdAt));

  return linhas as RecadoDoTime[];
}

/**
 * Marca como lido.
 *
 * `isNull(readAt)` no WHERE não é otimização: sem ele, abrir o sino uma
 * segunda vez reescreveria `read_at` para agora e o "lido em" viraria "lido
 * pela última vez que passou por aqui". A primeira leitura é a que interessa.
 */
export async function marcarRecadosComoLidos(orderId: string): Promise<number> {
  const linhas = await db
    .update(adminNotices)
    .set({ readAt: new Date() })
    .where(
      and(eq(adminNotices.orderId, orderId), isNull(adminNotices.readAt))
    )
    .returning({ id: adminNotices.id });

  return linhas.length;
}

/** Registra que o e-mail de aviso saiu. Falha de e-mail não desfaz o recado. */
export async function marcarEmailEnviado(id: string): Promise<void> {
  await db
    .update(adminNotices)
    .set({ emailSentAt: new Date() })
    .where(eq(adminNotices.id, id));
}
