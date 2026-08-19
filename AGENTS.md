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
- **`searchParams` no corpo de uma página com `generateStaticParams` reprova
  o build.** É dado não cacheado: lê-lo fora de `<Suspense>` trava a rota
  inteira e o `next build` responde *"Uncached data was accessed outside of
  `<Suspense>`"* — apontando o `<body>`, nunca a linha culpada. O `next dev`
  não reclama.
  A saída é mover o trecho que usa `searchParams` para um componente próprio,
  embrulhá-lo em `<Suspense>` e passar a promise adiante **sem `await`**: a
  casca fica estática, só o pedaço da busca espera. Modelo em
  `app/s/[slug]/meu-convite/page.tsx`.
  **Isto agora é lint** (`enlace/searchparams-em-suspense`, em
  `eslint-rules/`), então aparece no editor com a linha certa. A regra só
  acusa quando há `generateStaticParams`, porque é ele que faz o build
  prerenderizar — três páginas do painel leem `searchParams` no corpo e
  passam justamente por não serem prerenderizadas hoje.
- **A regra do `searchParams` vale para QUALQUER leitura não cacheada.** A
  mesma mensagem apareceu numa rota sem `searchParams` nenhum (`/c/[slug]`):
  era uma consulta ao banco sem `"use cache"`. O lint não pega esse caso — ele
  só enxerga `searchParams` —, então a regra de bolso é: rota com
  `generateStaticParams` lê dados por função cacheada, ponto.
- **`cacheTag`/`cacheLife` só existem no runtime do Next** — são mockados em
  `vitest.setup.ts`. Testes com `vi.mock("next/cache")` local precisam
  incluir os dois, senão sobrescrevem o mock global.
- **`updateTag` (não `revalidateTag`) nas ações do casal**: read-your-own-writes,
  para ele ver a própria mudança em vez de versão stale.

# Ao portar ou mexer num molde

- **Rode `npm run verify:template <id>`** com o servidor de pé. Ele monta um
  site descartável com tema FORA da paleta padrão do molde: se algum hex
  ficou escrito na marcação de uma seção, aparece ali. O teste automatizado
  não pega isso.
- **Não invente dado que o banco não tem.** As prévias em
  `app/pacotes/estilos/` têm cronograma do dia, legendas de foto e frases de
  casal fictício escritas no código. Portar é omitir o que não existe, não
  transplantar o texto — senão o site de um casal real anuncia um coquetel
  que não vai ter.
- **Cada molde declara só as fontes que combinam com ele.** `clampThemeFonts`
  recorta a escolha do casal ao catálogo do molde, então *não oferecer* é o
  que impede uma Amatic SC de destruir o Clássico. Curadoria, não limitação.
- **Ornamentos SVG usam token, não hex.** Um ramo rosa num site azul-marinho
  é o detalhe que denuncia molde mal portado. Derive de `var(--accent)` e
  `color-mix` com a tinta.
- As invariantes estruturais (papel de fonte sem fonte declarada, seção que o
  pacote libera e o molde não implementa, ordem repetida) estão em
  `lib/templates/registry.test.ts` e rodam para todo molde do registry.

# Armadilhas do Turbopack em dev (custaram uma sessão)

## O CSS de `app/globals.css` fica velho e NÃO adianta recarregar

Editar `app/globals.css` com o `next dev` de pé serve o chunk de CSS
**anterior**. Isso sobrevive a:

- `reload` com cache desligado no navegador;
- **reiniciar o servidor**;
- `rm -rf .next/cache`.

Só `rm -rf .next` inteiro resolve. O sintoma é traiçoeiro: a regra aparece no
arquivo em disco, o `curl` no `.css` servido mostra a versão ANTIGA, e a
conclusão fácil ("o utilitário não está sendo gerado") é falsa. Confirme sempre
buscando o `<link rel=stylesheet>` e comparando com o disco antes de
diagnosticar.

Consequência prática: **escreva todo o CSS de uma tacada e nucleie uma vez
só**, ou verifique direto no `npm run build`, que compila do zero.

## Apagar `.next` quebra as fontes do Google por um tempo

O download das ~34 fontes dos moldes é feito pelo **Turbopack (Rust)**, não
pelo Node — então `--dns-result-order=ipv4first` não muda nada, e o `curl`
funcionar não prova nada. Sem o cache do `.next`, os pedidos em paralelo
falham em lote com

    Error while requesting resource
    There was an issue establishing a connection while requesting
    https://fonts.googleapis.com/css2?family=...

e as rotas que importam `lib/templates/registry.ts` (inclusive `/` e
`/s/<slug>`) respondem **500**. Nada disso é defeito de código.

É **intermitente e não converge**: rodadas medidas deram 5, 7, 31, 134, 171 e
180 erros em sequência. A saída é repetir — `npm run build` num laço de 3 a 4
tentativas passa. Não vale trocar para `--webpack` (estoura 10 min) nem mexer
em config.

# Armadilhas do `next/font`

- **Cada fonte precisa ir para um `const` no escopo do módulo.** Dentro de
  objeto literal falha com *"Font loaders must be called and assigned to a
  const in the module scope"*.
- **Nos testes, `next/font/google` é mockado** em `vitest.setup.ts` — é
  transformação de build, não biblioteca, e fora do Next os loaders nem são
  funções. A lista de nomes é explícita porque o vitest recusa um Proxy; ao
  oferecer fonte nova no catálogo, acrescente o loader lá.
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
| `npm run verify:template <ids>` | Renderiza cada molde com dado real (site descartável) e confere que o desenho vem de token. Precisa do servidor de pé. |
| `npm run test:setup` | Sincroniza o schema `test`, que é mantido à mão e **não** recebe as migrações |
| `npm run fix:slug` | Lista slugs tortos e troca o de um site **em prévia e sem convidados**. Slug publicado é imutável — a trava está no `WHERE`. |
| `npm run backfill:legacy` | Vincula o casamento legado ao seu `site` (idempotente) |
| `npm run seed:demo` | Site de demonstração `ana-e-pedro` no motor novo |

Os testes rodam no schema `test` da mesma instância (`DATABASE_SCHEMA=test`).
Eles **apagam tabelas inteiras** entre casos — por isso o schema separado.
Ao adicionar **tabela ou coluna** nova, atualize `scripts/setup-test-schema.mjs`:
o schema `test` não recebe migração, e esquecer disso derruba dezenas de casos
com `column "x" does not exist` (aconteceu na 0010 e na 0011).

## Nunca rode duas suítes ao mesmo tempo

`npm run test` limpa as tabelas do schema `test` entre casos. Duas rodadas em
paralelo — inclusive uma em segundo plano e outra em primeiro — apagam os dados
uma da outra e produzem falhas que **não existem**. Custou duas investigações
de falso positivo. Espere a primeira terminar.

## Por que o limite de tempo é 20 s e não 5 s

O banco é remoto e **uma ida custa 171 ms medidos**. O padrão do vitest (5 s)
dá ~29 idas; só a limpeza entre casos gasta ~1 s e o provisionamento é uma
transação longa. Os testes de `provision` e `publish` não eram lentos por
defeito — a rede é que é. `lib/db/testCleanup.ts` faz a limpeza numa ida só
(era 1707 ms em dez idas, agora 1101 ms).

# Arquitetura

Leia **[docs/sdd-geracao-automatica.md](docs/sdd-geracao-automatica.md)** — é
o documento de referência: decisões, medições e fases.

Resumo do que existe hoje:

- **Multi-tenant**: `sites` é o tenant raiz. Toda consulta pública é escopada
  por `siteId`; há testes que falham se alguma vazar entre casais.
  `getGroupBySlug` é global **de propósito** (§6.2 do SDD).
- **Motor de templates**: molde (`lib/templates/<id>/`) + tokens
  (`ThemeSpec`) + conteúdo do banco. Corrigir um molde corrige todos os sites.
  **Os 6 estilos estão portados** (Clássico, Editorial, Toscana, Romântico,
  Moderno, Film). O registry segue `Partial` de propósito: estilo novo que
  entre no catálogo antes de ser portado cai em "estamos preparando", não
  quebra.
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

# Movimento (entrou em 01/08/2026)

Duas bibliotecas, cada uma onde paga: **GSAP ScrollTrigger** para a
coreografia de rolagem do site do convidado, **Motion** (motion.dev) para
transição de tela e esqueleto no painel. O vocabulário de durações e curvas
mora em `app/globals.css`.

## Erro que já foi cometido duas vezes: animação tímida demais

**Animação que roda e ninguém percebe é o mesmo que animação ausente.** A
primeira versão usava 320 ms e 12 px de percurso, com um comentário no código
dizendo "sobe 12px, nunca mais". O navegador confirmava a animação em
`running` a cada navegação — e o dono do produto descreveu como "troca de tela
crua". Hoje: `--t-base: 440ms`, percurso de 20 px, e a transição de tela usa
escala e desfoque além do deslocamento. Abaixo de ~400 ms uma entrada suave
não é lida como movimento, é lida como "a tela apareceu".

O mesmo erro apareceu nas telas de espera: elas atrasavam o *aparecer* em
180 ms sem tempo mínimo, então numa resposta rápida **nunca eram vistas**.
Hoje `useDelayedFlag` segura ~700 ms.

## Regras que continuam valendo

- **A coreografia de rolagem usa `gsap.from`, nunca opacity 0 no CSS.** Com
  `from`, o estado natural do HTML já é o final: se o JS não carregar, o
  convidado vê o site inteiro, só sem animação. Segurança estrutural, não
  remendo — a versão em CSS precisava de `@supports` para não deixar seção
  invisível.
- **GSAP entra por import dinâmico dentro do efeito.** Não vai no bundle
  inicial nem bloqueia a hidratação. Medido: 194 KB gzip na primeira carga do
  site do convidado, com o GSAP num chunk separado de 44 KB que chega depois.
- **Motion só via `LazyMotion` + o componente `m`** (`MotionProvider`).
  ~4,6 KB em vez de 34. `domAnimation`, não `domMax` — nada aqui usa layout
  animation nem drag.
- **`ScrollChoreography` mora no `SiteRenderer`**, não nos moldes: alcança os
  6 de uma vez e um molde novo herda sem saber que existe.
- **A capa (índice 0) nunca é revelada na rolagem.** Ela já está na tela
  quando o convidado abre o link; animar o que já está visível faz piscar. A
  capa tem entrada própria (`SplitReveal` / `.motion-word`).
- **`prefers-reduced-motion: reduce` não desliga tudo.** O que confirma ação
  (botão cedendo ao toque, "Copiado!") continua, porque é informação; o que sai
  é deslocamento, escala e laço infinito. **O Motion não respeita isso
  sozinho** — é preciso `useReducedMotion()`. O GSAP verifica antes de
  importar, então quem pediu menos movimento nem paga o download.

## Como conferir que a animação ACONTECE

"O componente está importado" não é "a animação rodou". Dois scripts perguntam
ao navegador:

| Comando | O quê |
|---|---|
| `node scripts/verificar-animacao.mjs <url>` | conta seções marcadas pelo GSAP, confere que nada fica preso em opacity 0, e testa o caminho de movimento reduzido |
| `node scripts/verificar-transicao.mjs` | navega de verdade entre telas e lista `document.getAnimations()` no instante da troca |

# Pix é do casal, nunca do código

`lib/pix.ts` existiu com uma chave pessoal chumbada, e todo molde a lia direto:
qualquer casal com lista de presentes mostrava ao convidado o QR de outra
pessoa. Não vazava dado — desviava dinheiro.

- **Sem Pix próprio, sem forma de pagamento.** `getSitePix` devolve `null` e o
  modal diz para falar com os noivos. Não existe chave de fallback, de exemplo
  ou herdada: não há valor padrão seguro para "para onde vai o dinheiro".
- **O BR Code é gerado, não guardado** — o campo 54 carrega o valor da cota, e
  é por isso que o QR não pode ser uma imagem que o casal sobe.
- **`lib/pix/sem-chave-global.test.ts` reprova se a constante voltar.** O bug
  não era de lógica (o componente funcionava); era de onde o dado vinha. Por
  isso o teste é estrutural, não de unidade.
- **`updateTag(sitePixTag(siteId))` ao salvar conteúdo.** Esquecer deixa a
  chave antiga no ar por dias — `cacheLife("days")` — com o painel dizendo que
  já trocou.

# Painel do casal: questionário e gerenciamento (01/08/2026)

Duas telas que eram uma parede só cada, refeitas pelo mesmo motivo.

- **O pedido é um questionário de 7 etapas** (`components/account/wizard/`).
  Todo o estado vive no `OrderWizard`; o `<form>` só carrega campos ocultos. É
  o que permite trocar de etapa sem perder resposta, animar a troca, e fazer o
  modelo pronto **preencher as três cores** — com estado local em cada campo
  isso não acontecia.
- **O gerenciamento é um layout com menu e 6 rotas**
  (`/conta/pedidos/<id>/{,paginas,conteudo,visual,fotos,presentes}`). O menu
  mora no `layout.tsx` de propósito: ele não remonta ao navegar, então a barra
  fica parada e só o conteúdo troca.
- **`carregarGerenciamento` é a porta única** (`lib/site/manageData.ts`).
  Sessão, existência e posse do pedido em um lugar só — repetir isso em seis
  arquivos é como se esquece a verificação de dono em um deles.
- **Contagem regressiva é calculada no CLIENTE.** No servidor seria `Date.now()`
  durante o render: impuro, e com Cache Components a contagem congelaria dentro
  do cache ("faltam 102 dias" por dias a fio). O lint `react-hooks/purity` pega.
- **`useDelayedFlag` segura a tela de espera por ~700 ms, não atrasa o
  aparecer.** A versão anterior fazia o contrário e, como o servidor responde
  rápido, a tela nunca era vista — "criei o pedido e não aconteceu nada". Uma
  tela de espera que ninguém vê não é otimização, é ausência.
- **Ao acrescentar coluna, atualize `scripts/setup-test-schema.mjs`** — o
  schema `test` não recebe migração. Custou duas rodadas: 0010 e 0011.

# Widescreen do site do convidado (01/08/2026)

O cartão de 480px é o desenho do **celular** — que é de onde o convidado abre o
link do WhatsApp. Num monitor virava um telefone encalhado no meio da tela.

- **`site-canvas` cresce em `lg` (1024px)**: 480px → 1120px. Antes de `lg` não
  cresce porque tablet em retrato ainda lê melhor em coluna.
- **As seções acompanham por variantes `lg:` na marcação de cada molde**, não
  por CSS global sobrescrevendo o Tailwind — isso viraria guerra de
  especificidade a cada seção nova. São 238 variantes, geradas
  mecanicamente e conferidas no CSS compilado.
- **Duas regras globais em `.site-canvas`** cobrem o que a marcação não
  resolve: `p { max-width: 70ch }` (a 1120px um parágrafo passa de 200
  caracteres por linha) e `[class*="aspect-"] { max-height: 74vh }` (um
  `aspect-[3/4]` a 1120px pediria 1493px de altura).
- **Ao portar molde novo, lembre das variantes `lg:`** — sem elas o molde
  aparece com tipografia de celular esticada num cartão de 1120px.

- **Travões de largura precisam de `lg:` também.** O ajuste mecânico pegou
  espaçamento, tipografia e grade — mas `max-w-[250px]` numa foto de capa
  continuou valendo no desktop e a imagem sumia no cartão de 1120px. Ao portar
  molde, confira `w-[…]` e `max-w-[…]` em volta de foto.

## Como conferir de verdade

`npm run verify:template` confere tokens, **não confere largura nem escala**.
Para ver o desenho: `npm run shot:template <pasta> <ids>` — cria um site
descartável por molde (tema padrão, conteúdo real), fotografa em 1440px e
390px e apaga tudo no `finally`.

Quatro armadilhas que custaram tempo:

- **`--window-size=390` NÃO funciona no Windows.** O Chrome tem largura mínima
  de janela (~480px) e ignora o pedido; o `--screenshot` recorta a imagem para
  390, e o resultado é uma captura cheia de texto cortado que **não existe no
  layout**. Custou uma caçada a um bug imaginário. Por isso `shot:template`
  fala CDP e usa `Emulation.setDeviceMetricsOverride`, além de MEDIR
  `scrollWidth` — captura sozinha não distingue "cortado pelo layout" de
  "recortado pela ferramenta". Para diagnosticar estouro:
  `node scripts/medir-overflow.mjs <url> [largura]`.


- **`--headless` (o antigo) captura antes do CSS carregar** e devolve HTML
  cru. Use `--headless=new` com `--virtual-time-budget`.
- **`pkill -f "next start"` não mata o servidor no Windows** — o processo é
  `node`. Um servidor velho continua na porta 3000 servindo o build anterior,
  e os hashes novos do CSS respondem **500**. Mate pela porta:
  `Get-NetTCPConnection -LocalPort 3000 | Stop-Process`.
- **Não troque `template_id` direto no banco para testar molde** — o `theme`
  fica com fontes de outro catálogo e o site cai no "estamos preparando".

# A branch `feedback-001` NÃO deve ser mesclada

Existe uma branch `feedback-001` (sem o `fix/`) com um commit de 27/07 que
nunca entrou na `main`: `7160ade`, com 57 arquivos e +3.974 linhas. Ela parece
trabalho perdido, e não é — é a arquitetura **anterior** à multi-tenancy:

| No órfão | Na main hoje |
|---|---|
| `lib/repositories/orderPhotos.ts` (foto presa ao PEDIDO) | `sitePhotos.ts` (foto do SITE) |
| `lib/storage.ts` | `lib/storage/supabase.ts` |
| `PhotoUploader` + `OrderPhotoSection` | `PhotoManager` |
| migração 0008 | 0012 |

Mesclar ressuscitaria `order_photos` — que é justamente uma das quatro tabelas
que o AGENTS.md manda não deixar o `drizzle-kit push` dropar, porque sobrou de
um push antigo. O caminho de foto foi refeito por site, e voltar atrás
quebraria o álbum, a categorização e a galeria.

**O que de fato se perdeu ali: a verificação de e-mail.** `schema.ts` declara
`email_verification_tokens`, a tabela existe em produção, e NÃO há código na
`main` que a use — ele só existe no órfão
(`email-verification-actions.ts`, `repositories/emailVerification.ts`,
`EmailVerificationBanner`, `/conta/confirmar`). É feature a reconstruir sobre
a arquitetura de hoje, não a resgatar por merge.

A branch fica onde está, como registro. Não apague — mas também não mescle.

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
