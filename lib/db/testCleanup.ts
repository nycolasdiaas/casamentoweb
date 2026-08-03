import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";

/**
 * Esvazia as tabelas do schema de teste numa ÚNICA ida ao banco.
 *
 * Por que isso importa: o banco de teste é remoto (mesma instância do
 * Supabase de produção, isolado por schema — ver AGENTS.md), e cada ida custa
 * **171 ms medidos**. Seis `delete` seguidos num `beforeEach` gastavam ~1 s de
 * rede antes de o teste começar a fazer o que veio fazer. Num arquivo com 11
 * casos, é 11 s jogados fora — e era o que estourava o limite do vitest nos
 * testes de provisionamento e publicação.
 *
 * `DELETE` e não `TRUNCATE ... CASCADE`: o cascade seguiria chaves
 * estrangeiras para fora desta lista, e `DATABASE_URL_TEST` aponta para a
 * mesma instância que guarda os dados dos casais. A ordem abaixo respeita as
 * dependências, então o delete simples basta.
 */
export async function limparSchemaDeTeste(): Promise<void> {
  // Um comando só, na ordem que respeita as chaves estrangeiras:
  // filhos primeiro, donos por último.
  await db.execute(sql`
    delete from gift_contributions;
    delete from gifts;
    delete from site_sections;
    delete from site_content;
    delete from site_photos;
    delete from site_events;
    delete from site_daily_stats;
    delete from sites;
    delete from orders;
    delete from users;
  `);
}
