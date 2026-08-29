---
name: banco
description: Migração, schema e backup do banco. Use ao criar/alterar tabela ou coluna, rodar drizzle-kit, db:generate, db:migrate, db:rehearse, backup, ou ao ver erro `column "x" does not exist`. Banco tem casamento real no ar — este é o caminho seguro.
---

# Banco

Produção. 23 grupos, 31 convidados, 22 confirmados, casamento 16/10/2026.
Links `/rsvp/<slug>` já estão no WhatsApp de gente real.

## Invariantes

1. `/rsvp/[slug]` nunca para de funcionar.
2. Slug de grupo existente é imutável.
3. Migração é **aditiva**. Nada apagado, nada reescrito. `NOT NULL` e
   constraint entram depois, em migração posterior, já verificado em produção.
4. Congelar schema das tabelas de RSVP a partir de outubro/2026.

## NUNCA `drizzle-kit push`

`push` compara com banco vivo. Proporia dropar 4 tabelas que existem em
produção mas não vieram por migração (resquício de push antigo):

`groups_backup` · `guests_backup` · `email_verification_tokens` · `order_photos`

As duas primeiras guardam snapshot de convidados dos últimos 30 dias.

## Procedimento de migração

Ordem importa. Não pule passo.

1. `npm run backup:full` — dump lógico completo em `backups/`. Antes de tudo.
2. Escreva o rollback à mão em `lib/db/migrations/down/`. O drizzle-kit só
   gera o `up`.
3. `npm run db:generate` — gera a migração a partir do snapshot do journal.
4. `npm run db:rehearse` — aplica contra o banco real numa transação e dá
   `ROLLBACK`. Reprova sozinho se a migração derrubar tabela ou mexer em
   contagem existente. DDL no Postgres é transacional, então isso valida sem
   deixar rastro. Foi assim que 0008 e 0009 passaram.
5. `npm run db:migrate` — aplica de verdade.
6. Atualize `scripts/setup-test-schema.mjs` (ver abaixo).

## Coluna nova? Atualize o schema `test`

Testes rodam no schema `test` da mesma instância. Esse schema é mantido à mão
e **não recebe migração**.

Esquecer disso derruba dezenas de casos com `column "x" does not exist`.
Aconteceu na 0010 e na 0011.

## Backup automático já existe

`pg_cron` roda `public.snapshot_guests_backup()` a cada 6h, retenção 30 dias.
Saudável. Não recrie.

Não confunda `backup_at` (quando o snapshot rodou) com `created_at` (quando o
grupo foi criado).

## Comandos

| Comando | O quê |
|---|---|
| `npm run backup:full` | Dump completo → `backups/` (gitignored) |
| `npm run backup:guests` | Só convidados. Não substitui o full |
| `npm run db:generate` | Gera migração |
| `npm run db:rehearse` | Ensaia contra banco real, dá ROLLBACK |
| `npm run db:migrate` | Aplica |
| `npm run test:setup` | Sincroniza schema `test` |
| `npm run fix:slug` | Lista slugs tortos, troca o de site em prévia e sem convidados. Slug publicado é imutável — trava está no `WHERE` |
| `npm run backfill:legacy` | Vincula casamento legado ao seu `site` (idempotente) |
| `npm run seed:demo` | Site de demonstração `ana-e-pedro` |

`DATABASE_URL_TEST` aponta para a mesma instância de produção — isolado por
schema, mas erro de config alcança dado real.

Testar? Ver skill `testes`. Regra de produto? Agente `regras-de-negocio`.
