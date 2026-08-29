# Rollback da migração 0020 — `sites.expires_at`

**Escrito ANTES de a migração rodar**, como o `AGENTS.md` §2 exige.

Spec: `specs/site-publico/008-site-que-expira/spec.md` (FR-001).

## O que a migração faz

```sql
ALTER TABLE "sites" ADD COLUMN "expires_at" timestamp with time zone;
```

Uma linha. Nullable, **sem default**, **sem backfill**, sem `NOT NULL`.

Zero `DROP`, zero `DELETE`, zero `UPDATE`. Nenhuma linha existente é tocada.

## Por que ela não muda o comportamento de nenhum site

`null` significa **"nunca expira"** em toda a lógica de
`lib/site/expiracao.ts`, e é o valor que todo site existente recebe ao ganhar a
coluna.

O caso que mais importa: **o casamento real de 16/10/2026 fica com `null`** e
segue no ar para sempre, exatamente como antes. `estaExpirado(null)` é `false`
por teste (`lib/site/expiracao.test.ts`), e é o primeiro caso do arquivo
justamente porque um erro ali tiraria do ar um casamento com convidados
confirmados.

## O rollback

**Esta é reversível de verdade** — ao contrário da `0018`, em que
`ALTER TYPE ... ADD VALUE` não volta atrás no Postgres.

```sql
ALTER TABLE "sites" DROP COLUMN "expires_at";
```

Seguido de remover a linha correspondente em `lib/db/migrations/meta/_journal.json`
e o arquivo `0020_*.sql`.

### A janela em que o rollback é gratuito

Enquanto **nenhuma data tiver sido gravada**. Confira antes:

```sql
SELECT count(*) FROM sites WHERE expires_at IS NOT NULL;
```

- **Zero** → o `DROP COLUMN` não perde nada. Reverta à vontade.
- **Maior que zero** → o `DROP` apaga datas de expiração que a publicação
  calculou. Nenhum casamento sai do ar por isso (perder a data significa
  "nunca expira", que é o comportamento antigo), mas as datas precisariam ser
  recalculadas na próxima publicação. **Nesse caso, prefira desligar o cron**
  (`vercel.json`) a apagar a coluna.

## Contagens a conferir depois

Iguais às de antes da migração — o `backup:full` de 28/08/2026 registra:

| Tabela | Antes |
|---|---|
| `sites` | 18 |
| `groups` | 23 |
| `guests` | 31 |
| `site_content` | 18 |
| `orders` | 13 |
| `users` | 5 |

E, específico do casamento real:

```sql
SELECT count(*) FROM groups WHERE seats_confirmed IS NOT NULL;  -- 23
```

## Se algo der errado no meio

A migração é uma instrução só, então ou ela aplicou ou não aplicou — não há
estado parcial. Confira com:

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'sites' AND column_name = 'expires_at';
```

Sem linha = não aplicou, nada a desfazer.
