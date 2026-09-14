import { clienteDeBanco } from "./_cliente.mjs";

/**
 * Apaga as contas de TESTE que a auditoria E2E de setembro/2026 deixou no
 * banco de produção — e nada além delas.
 *
 * ── Por que um script, e por que tão desconfiado ───────────────────────────
 *
 * A auditoria precisou criar contas e casamentos de verdade no ambiente
 * publicado: era a única forma de testar o que o casal realmente vive. O que
 * sobrou é lixo invisível para o público (site em prévia não é listado nem
 * indexado), mas é lixo num banco onde mora casamento de cliente com
 * convidado real.
 *
 * Daí as três travas:
 *
 * 1. **Só apaga conta cujo e-mail termina em `@example.com`** — domínio
 *    reservado pela RFC 2606, que ninguém de verdade usa. A conta real não
 *    tem como cair nesse filtro.
 * 2. **Roda em seco por padrão.** Sem `--apagar`, ele só lista o que faria.
 * 3. **Recusa se encontrar site PUBLICADO** numa dessas contas. Site no ar
 *    tem link no WhatsApp de alguém; se um aparecer aqui, a premissa está
 *    errada e o script para em vez de insistir.
 *
 * Antes de rodar com `--apagar`: `npm run backup:full`.
 *
 *     node scripts/limpar-dados-de-teste.mjs            (só lista)
 *     node scripts/limpar-dados-de-teste.mjs --apagar   (apaga)
 */

const APAGAR = process.argv.includes("--apagar");
const DOMINIO = "@example.com";

const sql = clienteDeBanco();

try {
  const contas = await sql`
    select id, name, email, created_at
    from users
    where email like ${"%" + DOMINIO}
    order by created_at
  `;

  if (contas.length === 0) {
    console.log("\nNenhuma conta de teste no banco. Nada a fazer.");
    process.exit(0);
  }

  const ids = contas.map((c) => c.id);

  const pedidos = await sql`
    select id, couple_names, status from orders where user_id in ${sql(ids)}
  `;
  const locais = await sql`
    select id, slug, status, published_at
    from sites
    where user_id in ${sql(ids)}
       or order_id in ${sql(pedidos.length ? pedidos.map((p) => p.id) : [null])}
  `;

  const idsDeSite = locais.map((s) => s.id);
  const grupos = idsDeSite.length
    ? await sql`select id, label from groups where site_id in ${sql(idsDeSite)}`
    : [];
  const convidados = grupos.length
    ? await sql`select id from guests where group_id in ${sql(grupos.map((g) => g.id))}`
    : [];
  const fotos = idsDeSite.length
    ? await sql`select id from site_photos where site_id in ${sql(idsDeSite)}`
    : [];
  /* `gifts` e `groups` são as DUAS únicas chaves com `restrict` apontando para
     `sites` — todo o resto (conteúdo, seções, eventos, convites, recados,
     fotos) cai por cascade. Sem apagar estas duas à mão, a transação inteira
     aborta com violação de chave estrangeira, que foi o que aconteceu na
     primeira tentativa. */
  const cotas = idsDeSite.length
    ? await sql`select id from gifts where site_id in ${sql(idsDeSite)}`
    : [];
  const avisosDePix = cotas.length
    ? await sql`select id from gift_contributions where gift_id in ${sql(cotas.map((c) => c.id))}`
    : [];

  console.log(`\n${contas.length} conta(s) de teste:`);
  for (const c of contas) console.log(`  · ${c.email}  —  ${c.name}`);

  console.log(`\n${pedidos.length} pedido(s):`);
  for (const p of pedidos) console.log(`  · ${p.couple_names} [${p.status}]`);

  console.log(`\n${locais.length} site(s):`);
  for (const s of locais) console.log(`  · /s/${s.slug} [${s.status}]`);

  console.log(
    `\n${grupos.length} grupo(s) de convidados, ${convidados.length} convidado(s), ${fotos.length} foto(s), ${cotas.length} presente(s), ${avisosDePix.length} aviso(s) de Pix.`
  );

  const publicados = locais.filter(
    (s) => s.status === "published" || s.published_at !== null
  );
  if (publicados.length > 0) {
    console.error(
      `\nPAREI. ${publicados.length} site(s) desta lista já estiveram NO AR:`
    );
    for (const s of publicados) console.error(`  · /s/${s.slug}`);
    console.error(
      "Site publicado tem link distribuído. Se isto é esperado, a decisão é do dono — não deste script."
    );
    process.exit(1);
  }

  if (!APAGAR) {
    console.log("\n(seco — nada foi apagado. Use --apagar para valer.)");
    process.exit(0);
  }

  /* A ordem é a das dependências, de fora para dentro. `guests` e
     `site_photos` cairiam por cascade, mas apagar à mão deixa a contagem
     visível na saída — e uma contagem que não bate é o sinal de que a
     premissa mudou. */
  await sql.begin(async (tx) => {
    if (grupos.length) {
      await tx`delete from guests where group_id in ${tx(grupos.map((g) => g.id))}`;
      await tx`delete from groups where id in ${tx(grupos.map((g) => g.id))}`;
    }
    if (cotas.length) {
      await tx`delete from gift_contributions where gift_id in ${tx(cotas.map((c) => c.id))}`;
      await tx`delete from gifts where id in ${tx(cotas.map((c) => c.id))}`;
    }
    if (idsDeSite.length) {
      await tx`delete from sites where id in ${tx(idsDeSite)}`;
    }
    if (pedidos.length) {
      await tx`delete from orders where id in ${tx(pedidos.map((p) => p.id))}`;
    }
    await tx`delete from users where id in ${tx(ids)}`;
  });

  console.log("\nApagado.");
} finally {
  await sql.end();
}
