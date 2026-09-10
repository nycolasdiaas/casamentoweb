import postgres from "postgres";

/**
 * O cliente de banco dos scripts, com o schema respeitado.
 *
 * ── Por que isto existe ────────────────────────────────────────────────────
 *
 * Cada script montava o próprio `postgres(process.env.DATABASE_URL, …)`, e
 * nenhum olhava `DATABASE_SCHEMA`. O aplicativo olha (`lib/db/client.ts`), os
 * testes olham (`vitest.config.ts` fixa `DATABASE_SCHEMA=test`) — só os
 * scripts não olhavam.
 *
 * Como o `DATABASE_URL` deste repositório aponta para PRODUÇÃO, com casamento
 * de cliente no ar, isso significava que `npm run seed:demo`,
 * `npm run backfill:legacy` e companhia escreviam no `public` mesmo quando
 * quem rodava tinha acabado de exportar `DATABASE_SCHEMA=e2e` justamente para
 * não escrever ali. Aconteceu de verdade: um `DATABASE_SCHEMA=e2e npm run
 * backfill:legacy` foi direto para produção. Não houve estrago porque o script
 * é idempotente e não tinha o que mudar — mas a próxima vez podia ter.
 *
 * ── O aviso ────────────────────────────────────────────────────────────────
 *
 * Escrever no `public` continua permitido: é o caso normal quando a intenção
 * é essa. O que muda é que a intenção passa a estar visível na saída do
 * script, antes de qualquer comando, em vez de ser descoberta depois pelas
 * contagens.
 */
export function clienteDeBanco({ silencioso = false } = {}) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const schema = process.env.DATABASE_SCHEMA?.trim();

  if (!silencioso) {
    console.log(
      schema
        ? `banco: schema "${schema}"`
        : "banco: schema \x1b[1mpublic\x1b[0m — este é o schema de PRODUÇÃO"
    );
  }

  return postgres(url, {
    prepare: false,
    max: 1,
    ...(schema ? { connection: { search_path: schema } } : {}),
  });
}
