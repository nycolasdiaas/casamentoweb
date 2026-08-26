import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

/**
 * Traz as respostas que já existem em `guests` para o modelo de GRUPO da 0016.
 *
 * ── Por que isto precisa existir ───────────────────────────────────────────
 *
 * A 0016 acrescentou a resposta no nível do grupo (`seats`, `seats_confirmed`,
 * `attending_names`, `responded_at`), e `/rsvp/<slug>` passa a ler dali. As 23
 * confirmações reais estão em `guests.rsvp_status` — sem este backfill, quem
 * já confirmou abriria o link e veria o formulário em branco, como se nunca
 * tivesse respondido. Para quem está do outro lado, isso é indistinguível de
 * "minha confirmação sumiu".
 *
 * ── O que ele NÃO faz ──────────────────────────────────────────────────────
 *
 * Não toca em `guests`. Nenhuma linha é apagada, alterada ou movida — o modelo
 * antigo continua sendo a fonte que o painel do casal e o `/admin` leem. Este
 * script só COPIA, numa direção só.
 *
 * ── Idempotente ────────────────────────────────────────────────────────────
 *
 * Só escreve em grupo com `seats_confirmed IS NULL`. Rodar duas vezes não
 * sobrescreve resposta dada pelo formulário novo — que é o caso que importa se
 * alguém rodar isto por engano depois de o produto estar no ar.
 *
 * Rode com:
 *   node scripts/backfill-rsvp-grupo.mjs --dry    (só mostra o que faria)
 *   node scripts/backfill-rsvp-grupo.mjs          (aplica)
 */

const seco = process.argv.includes("--dry");

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");

  const sql = postgres(databaseUrl, { prepare: false });

  /* Um grupo "já respondeu" quando ALGUM convidado dele saiu de `pending`.
     Não basta ter confirmado: um grupo em que todo mundo recusou também
     respondeu, e `seats_confirmed = 0` é a resposta dele. É essa diferença
     entre 0 e null que o casal usa para saber a quem cobrar. */
  const linhas = await sql`
    select
      g.id,
      g.slug,
      g.label,
      count(gu.id)::int as lugares,
      count(*) filter (where gu.rsvp_status = 'confirmed')::int as confirmados,
      count(*) filter (where gu.rsvp_status <> 'pending')::int as responderam,
      coalesce(
        string_agg(gu.name, ', ' order by gu.position, gu.name)
          filter (where gu.rsvp_status = 'confirmed'),
        ''
      ) as nomes,
      max(gu.responded_at) as respondido_em
    from groups g
    left join guests gu on gu.group_id = g.id
    where g.seats_confirmed is null
    group by g.id
    order by g.label nulls last
  `;

  let comResposta = 0;
  let semResposta = 0;

  for (const l of linhas) {
    const respondeu = l.responderam > 0;
    if (respondeu) comResposta++;
    else semResposta++;

    if (seco) {
      console.log(
        `${respondeu ? "✓" : "·"} ${l.slug.padEnd(10)} ${(l.label ?? "—").padEnd(26)}` +
          ` lugares=${l.lugares}` +
          (respondeu ? ` confirmados=${l.confirmados} nomes="${l.nomes}"` : " (sem resposta)")
      );
      continue;
    }

    await sql`
      update groups set
        seats = ${l.lugares},
        seats_confirmed = ${respondeu ? l.confirmados : null},
        attending_names = ${respondeu && l.nomes ? l.nomes : null},
        responded_at = ${respondeu ? l.respondido_em : null}
      where id = ${l.id}
    `;
  }

  console.log(
    `\n${seco ? "[ENSAIO] " : ""}${linhas.length} grupos: ` +
      `${comResposta} com resposta migrada, ${semResposta} ainda sem responder.`
  );

  if (!seco) {
    const [conf] = await sql`
      select
        coalesce(sum(seats_confirmed), 0)::int as lugares_confirmados,
        (select count(*)::int from guests where rsvp_status = 'confirmed') as guests_confirmados
      from groups
    `;
    console.log(
      `conferência: ${conf.lugares_confirmados} lugares no modelo novo ` +
        `× ${conf.guests_confirmados} convidados confirmados no modelo antigo ` +
        `→ ${conf.lugares_confirmados === conf.guests_confirmados ? "batem ✓" : "DIVERGEM ✗"}`
    );
  }

  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
