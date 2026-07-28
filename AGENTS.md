<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

> Isto é real: o Next 16 empacota a documentação completa em
> `node_modules/next/dist/docs/`. Confira lá antes de assumir qualquer API —
> `middleware.ts` virou `proxy.ts`, `cacheComponents` substituiu
> `experimental.ppr`/`dynamicIO`, e por aí vai.

---

# ⚠️ Este banco tem dados de clientes reais

**Não é ambiente de testes.** O banco de produção contém um casamento que
está no ar:

- 23 grupos, 31 convidados, **22 já confirmaram presença**
- Casamento em **16/10/2026**
- Os links `/rsvp/<slug>` **já estão no WhatsApp dos convidados**

Consequências que não se negociam:

1. **A rota `/rsvp/[slug]` nunca pode deixar de funcionar.** Quebrá-la é
   perder confirmações de gente real.
2. **Slugs de grupo existentes são imutáveis.**
3. **Nada é apagado ou reescrito.** Migração é aditiva; `NOT NULL` e
   constraints entram numa migração posterior, depois de verificar em
   produção.
4. **Backup antes, rollback escrito antes.** `npm run backup:full` e um
   `down` à mão em `lib/db/migrations/down/` (o drizzle-kit só gera o `up`).
5. **Congelar mudanças de schema nas tabelas de RSVP a partir de outubro/2026.**

## 🚫 NUNCA rode `drizzle-kit push`

O `push` compara com o banco vivo e proporia **dropar 4 tabelas** que existem
em produção mas não vieram por migração (resquício de um push antigo):

`groups_backup` · `guests_backup` · `email_verification_tokens` · `order_photos`

As duas primeiras guardam **snapshots de convidados dos últimos 30 dias**.
Use sempre `npm run db:generate` + `npm run db:migrate`, que comparam com os
snapshots do journal e são seguros.

## Como ensaiar uma migração sem Docker

DDL no Postgres é transacional. Aplique a migração inteira numa transação
contra o schema real, verifique as contagens e dê `ROLLBACK`. Valida contra o
banco de verdade sem deixar rastro — foi assim que a 0008 foi validada.

Agora é `npm run db:rehearse` (a 0009 passou por ele). Reprova sozinho se a
migração derrubar tabela ou mexer em contagem existente — as duas coisas que
não podem acontecer neste banco.

## Backup automático que já existe

`pg_cron` roda `public.snapshot_guests_backup()` a cada 6h, com retenção de
30 dias. Está saudável — não recrie, e não confunda `backup_at` (quando o
snapshot rodou) com `created_at` (quando o grupo foi criado).

---

# Armadilhas do Cache Components (custaram build/regressão)

`cacheComponents: true` está ligado. PPR é o padrão.

- **O `next dev` é permissivo; o `next build` é estrito.** Sempre rode
  `npm run build` antes de confiar. Erros de rota só aparecem lá.
- **`notFound()` dentro de `<Suspense>` devolve HTTP 200, não 404.** O shell
  já foi enviado (`x-nextjs-postponed: 1`) e o status não muda mais. Para ter
  404 real numa rota dinâmica, declare `generateStaticParams` e faça o lookup
  no corpo da página.
- **`generateStaticParams` precisa devolver ao menos um param.** Quando os
  valores são segredo (tokens de prévia), use um placeholder que cai no
  `notFound()`.
- **`cacheTag`/`cacheLife` só existem no runtime do Next** — são mockados em
  `vitest.setup.ts`. Testes com `vi.mock("next/cache")` local precisam
  incluir os dois, senão sobrescrevem o mock global.
- **`updateTag` (não `revalidateTag`) nas ações do casal**: read-your-own-writes,
  para ele ver a própria mudança em vez de versão stale.

# Armadilhas do `next/font`

- **Cada fonte precisa ir para um `const` no escopo do módulo.** Dentro de
  objeto literal falha com *"Font loaders must be called and assigned to a
  const in the module scope"*.
- **Declarar N fontes num módulo embarca o CSS das N** em qualquer página que
  o importe. Medido: 34 fontes = 83,6 KB de CSS, 61% desperdiçado. Por isso
  **cada molde declara as suas** em `lib/templates/<id>/fonts.ts`.
- Cada fonte tem a **própria variável** (`--f-<id>`), não uma por papel — se
  duas fontes declarassem `--font-display`, usar a mesma em dois papéis
  colidiria. O wrapper mapeia papel → fonte.

---

# Scripts

| Comando | O quê |
|---|---|
| `npm run backup:full` | Dump lógico completo → `backups/` (gitignored). **Antes de toda migração.** |
| `npm run backup:guests` | Só convidados (o antigo; não substitui o full) |
| `npm run db:generate` / `db:migrate` | Migrações. **Nunca `push`.** |
| `npm run db:rehearse` | Ensaia a última migração contra o banco real e dá ROLLBACK (ver abaixo) |
| `npm run setup:storage` | Cria o bucket privado das fotos. Uma vez por ambiente. |
| `npm run test:setup` | Sincroniza o schema `test`, que é mantido à mão e **não** recebe as migrações |
| `npm run backfill:legacy` | Vincula o casamento legado ao seu `site` (idempotente) |
| `npm run seed:demo` | Site de demonstração `ana-e-pedro` no motor novo |

Os testes rodam no schema `test` da mesma instância (`DATABASE_SCHEMA=test`).
Eles **apagam tabelas inteiras** entre casos — por isso o schema separado.
Ao adicionar tabela nova, atualize `scripts/setup-test-schema.mjs`.

# Arquitetura

Leia **[docs/sdd-geracao-automatica.md](docs/sdd-geracao-automatica.md)** — é
o documento de referência: decisões, medições e fases.

Resumo do que existe hoje:

- **Multi-tenant**: `sites` é o tenant raiz. Toda consulta pública é escopada
  por `siteId`; há testes que falham se alguma vazar entre casais.
  `getGroupBySlug` é global **de propósito** (§6.2 do SDD).
- **Motor de templates**: molde (`lib/templates/<id>/`) + tokens
  (`ThemeSpec`) + conteúdo do banco. Corrigir um molde corrige todos os sites.
  Só o **Clássico** está portado; os outros 5 mostram "em preparação".
- **Provisionamento**: `submitOrderAction` cria o site na hora e move o
  pedido para `preview_ready` com o link da prévia.
- **Métricas**: beacon em `/api/track`. **IP nunca é gravado** — `visitor_hash`
  é HMAC de (IP + UA + dia) com sal que gira a cada 24h (LGPD: o convidado é
  terceiro).
- **Fotos**: `site_photos` (escopada por site, não por pedido), bucket
  **privado** no Supabase Storage, upload assinado direto do browser. O casal
  sobe pela tela de acompanhamento do pedido; o molde cai no placeholder
  enquanto o slot estiver vazio. Ver §8 do SDD.
- **Publicação**: pagamento confirmado põe o site no ar sozinho, por três
  caminhos (retorno do checkout, webhook, ação do admin). Ver §7.2 do SDD.

# Armadilha do cache ao publicar

**Publicar exige derrubar cache, e isso não pode acontecer no render.**
`updateTag` só vale em Server Action; `revalidateTag` em Server Action ou
Route Handler; **nenhum dos dois durante o render de uma página**. Por isso a
publicação mora em `/api/pagamento/confirmar`, e a tela de acompanhamento
apenas **redireciona** para lá quando detecta pagamento confirmado com site
ainda em prévia (com `?publicacao=erro` cortando o laço).

Publicar sem invalidar deixaria `/s/<slug>` em 404 por dias — `site-view` vive
com `cacheLife("days")` — enquanto o pedido diz "no ar". E use `{ expire: 0 }`,
não `"max"`: stale-while-revalidate serviria justamente o 404 anterior para o
casal que acabou de pagar.

Não esqueça a tag `published-site-slugs`: é ela que alimenta o
`generateStaticParams` de `/s/[slug]`. `publishedSiteTags()` já devolve as três.

# Armadilhas das fotos

- **A foto sai por `/f/<id>`, nunca por URL do Storage no HTML.** O site fica
  em `cacheLife("days")`; uma URL assinada embutida expiraria dentro do cache
  e o convidado veria foto quebrada.
- **Essa rota REPASSA os bytes; não redirecione.** O otimizador do
  `next/image` segue redirects só para imagens **remotas**. `/f/<id>` é
  caminho local: a busca é interna, não segue o 307, e devolve
  `"url" parameter is valid but internal response is invalid` — com redirect,
  nenhuma foto renderiza. Custou uma volta; está medido no §8.1 do SDD.
- **`images.remotePatterns` continua vazio de propósito** — a URL é da nossa
  própria origem. Adicionar o domínio do Storage lá abriria superfície à toa.
- **Sem `SUPABASE_SERVICE_ROLE_KEY`, o upload fica desligado** — o painel some
  da tela do casal e o site mostra as imagens de exemplo. Nada quebra, mas
  também nada avisa: se o upload "sumiu", é a chave.
- **`createImageBitmap` precisa de `imageOrientation: "from-image"`.** Sem
  isso, foto tirada na vertical no celular chega deitada — o canvas ignora o
  EXIF.
- **O `content-type` que o browser declara não vale como prova.** Quem envia
  está com uma URL assinada na mão; a confirmação lê os primeiros bytes do
  objeto e confere a assinatura do arquivo.
- **Apagar foto deixa a linha sair primeiro, o objeto depois.** Se o objeto
  não sair, sobra lixo invisível no bucket — melhor que o inverso, que deixaria
  foto quebrada no site.

# Pendências conhecidas

- **Álbum pós-festa ainda é placeholder**: as fotos da festa (slot `album`)
  não têm upload — só existem depois do casamento.
- **`ABACATEPAY_WEBHOOK_SECRET` está vazio, então o webhook está DESLIGADO**
  (responde 503 e não processa nada). Não é falta de verificação: quando o
  segredo existe, ele compara em tempo constante e ainda reconfirma com a API
  do AbacatePay antes de liberar. Sem ele, a confirmação depende do casal
  voltar do checkout — o que funciona, só não é instantâneo.
- **Cancelar pedido órfã o site**: `deleteOrder` apaga o pedido e
  `sites.order_id` é `set null`, então o site provisionado fica sem dono.
  Invisível (segue em `preview`), mas acumula. Apagar a conta do casal faz o
  mesmo — aí de propósito: o site do casamento não some porque a conta sumiu.
- **`DATABASE_URL_TEST` aponta para a mesma instância de produção** (isolado
  por schema, mas um erro de config alcança dados reais).
- Mural de recados é a única seção do contrato sem implementação.
