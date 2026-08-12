import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { sites, sitePhotos, gifts, groups } from "@/lib/db/schema";
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
  //
  // E o site com CONVIDADOS também fica. `groups.site_id` é `onDelete:
  // "restrict"` de propósito: cada grupo carrega o slug de `/rsvp/<slug>`, que
  // já foi distribuído no WhatsApp. Apagar isso é arrancar do ar o link pelo
  // qual gente real confirma presença — e nenhum cancelamento de pedido vale
  // esse preço. Aqui a checagem é explícita para o cancelamento NÃO FALHAR:
  // sem ela, o `restrict` do banco derrubava a ação inteira com erro 500, e o
  // casal via "This page couldn't load" em vez do pedido cancelado.
  const [grupo] = site
    ? await db
        .select({ id: groups.id })
        .from(groups)
        .where(eq(groups.siteId, site.id))
        .limit(1)
    : [];

  const podeApagarSite = Boolean(
    site && site.publishedAt === null && grupo === undefined
  );

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

  if (podeApagarSite && site) {
    // A lista de presentes sai ANTES do site, à mão.
    //
    // `gifts.site_id` também é `onDelete: "restrict"` — e era exatamente ele
    // que estourava aqui:
    //
    //   update or delete on table "sites" violates foreign key constraint
    //   "gifts_site_id_sites_id_fk" · Key (id)=(…) is still referenced
    //
    // O comentário antigo dizia que "foto e seção caem por cascata", o que é
    // verdade, e concluía daí que estava tudo coberto. Não estava: `gifts` e
    // `groups` ficaram em `restrict` na migração que os vinculou ao site, e
    // ninguém revisitou este caminho. Presente é dado do casal para ESTE site
    // que está sendo cancelado, então some junto; convidado não, e por isso é
    // tratado acima impedindo a exclusão.
    await db.delete(gifts).where(eq(gifts.siteId, site.id));

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
