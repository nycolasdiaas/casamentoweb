import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { sites, sitePhotos } from "@/lib/db/schema";
import { deleteObject } from "@/lib/storage/supabase";
import { deleteOrder } from "@/lib/repositories/orders";

/**
 * Cancela um pedido e leva junto o site que ele criou.
 *
 * POR QUE ISTO EXISTE: `deleteOrder` sozinho apagava o pedido e deixava o
 * site de pé — `sites.order_id` é `set null`, então ele virava um site sem
 * dono, invisível e acumulando. Enquanto cancelar só era possível em
 * `submitted` (antes do provisionamento) isso quase nunca acontecia. Agora que
 * o casal pode cancelar em `preview_ready`, TODO cancelamento teria site —
 * o problema deixaria de ser raro e passaria a ser garantido.
 *
 * A ordem importa e é a mesma da exclusão de foto (§8 do SDD): a linha sai
 * primeiro, o objeto no Storage depois. Se o objeto não sair, sobra lixo
 * invisível no bucket — melhor que o inverso, que deixaria referência
 * apontando para arquivo inexistente.
 */
export async function cancelarPedidoComSite(orderId: string): Promise<void> {
  const [site] = await db
    .select({ id: sites.id, publishedAt: sites.publishedAt })
    .from(sites)
    .where(eq(sites.orderId, orderId));

  // Site que JÁ esteve no ar não é apagado nem que o pedido suma. O casamento
  // de alguém não deixa de existir porque o pedido foi cancelado — é a mesma
  // regra que vale ao apagar a conta do casal.
  const podeApagarSite = site && site.publishedAt === null;

  let caminhos: string[] = [];
  if (podeApagarSite) {
    caminhos = (
      await db
        .select({ storagePath: sitePhotos.storagePath })
        .from(sitePhotos)
        .where(eq(sitePhotos.siteId, site.id))
    ).map((f) => f.storagePath);
  }

  // O pedido primeiro: é o que o casal pediu para sumir. Se algo abaixo
  // falhar, ele ao menos não vê mais o pedido cancelado na lista.
  await deleteOrder(orderId);

  if (podeApagarSite) {
    // As linhas de foto e seção caem por cascata do próprio site.
    await db.delete(sites).where(eq(sites.id, site.id));

    // Os objetos do bucket por último, e sem derrubar o cancelamento se
    // falharem: lixo no Storage é problema de custo, não de correção.
    for (const caminho of caminhos) {
      try {
        await deleteObject(caminho);
      } catch (erro) {
        console.error(
          `[cancelar] objeto ${caminho} não removido do Storage:`,
          erro
        );
      }
    }
  }
}
