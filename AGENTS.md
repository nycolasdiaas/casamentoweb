# Enlace — regras do projeto

Este arquivo é carregado em **toda** sessão. Só entra aqui o que não pode ser
ignorado nunca. O detalhe mora nas Skills, que carregam quando o assunto
aparece — não repita conteúdo de Skill aqui.

## Onde está o resto

| Assunto | Onde |
|---|---|
| Migração, schema, backup | Skill `banco` |
| Cache Components, build, Turbopack | Skill `cache-e-build` |
| Portar/mexer em molde, fontes, `lg:` | Skill `molde` |
| Rodar e escrever teste | Skill `testes` |
| Foto: upload, `/f/<id>`, EXIF | Skill `fotos` |
| Animação, GSAP, Motion | Skill `movimento` |
| Questionário e gerenciamento do casal | Skill `painel` |
| Texto que o casal ou o convidado lê | Skill `texto-do-casal` |
| **Regra de produto** (preço, pacote, promessa) | Agente `regras-de-negocio` |
| Decisões de arquitetura, medições, fases | `docs/sdd-geracao-automatica.md` |
| O que o produto promete | `docs/regras-de-negocio.md` |

---

## 1. Este NÃO é o Next.js que você conhece

Next 16. APIs, convenções e estrutura mudaram. **Leia
`node_modules/next/dist/docs/` antes de escrever código** — o Next 16 empacota
a documentação completa lá.

`middleware.ts` virou `proxy.ts`. `cacheComponents` substituiu
`experimental.ppr`/`dynamicIO`.

## 2. O banco tem clientes reais

Não é ambiente de teste. Casamento no ar: 23 grupos, 31 convidados, 23
confirmados, 16/10/2026. Os links `/rsvp/<slug>` já estão no WhatsApp.

**A resposta do RSVP vive em DOIS lugares desde a migração 0016**, e os dois
são verdade: `guests.rsvp_status` (um convidado por linha, o modelo original,
onde as 23 confirmações nasceram) e `groups.seats_confirmed` (quantos lugares
do grupo vão, que é o que `/rsvp/<slug>` grava hoje). O painel e as métricas
leem o segundo; nada escreve no primeiro. Não unifique os dois sem decisão do
dono — o backfill igualou os números uma vez, e refazer isso ao contrário
apagaria dado que ninguém reconstrói.

1. **`/rsvp/[slug]` nunca pode deixar de funcionar.** Quebrar é perder
   confirmação de gente real.
2. **Slug de grupo existente é imutável.**
3. **Migração é aditiva.** Nada apagado, nada reescrito.
4. **`npm run backup:full` antes, rollback escrito antes.**
5. **NUNCA `drizzle-kit push`** — proporia dropar 4 tabelas vivas. Use
   `db:generate` + `db:rehearse` + `db:migrate`.

Procedimento completo: Skill `banco`.

## 3. Pix é do casal, nunca do código

`lib/pix.ts` já teve uma chave pessoal chumbada, e todo casal com lista de
presentes mostrava o QR de outra pessoa. Não vazava dado — **desviava
dinheiro**.

- **Sem Pix próprio, sem forma de pagamento.** `getSitePix` devolve `null`.
  Não existe chave de fallback, de exemplo ou herdada.
- O BR Code é **gerado**, não guardado — o campo 54 carrega o valor da cota.
- `lib/pix/sem-chave-global.test.ts` reprova se a constante voltar.
- `updateTag(sitePixTag(siteId))` ao salvar conteúdo.

## 4. `next build` é a verdade

`cacheComponents: true` está ligado, PPR é o padrão. **O `next dev` é
permissivo; o `next build` é estrito.** Erro de rota só aparece no build.
Sempre `npm run build` antes de confiar.

Armadilhas (404 virando 200, `searchParams` fora de `<Suspense>`, CSS velho,
fontes falhando em lote): Skill `cache-e-build`.

## 5. Antes de decidir por produto, pergunte

Este arquivo diz como o **código** funciona. `docs/regras-de-negocio.md` diz o
que o **produto** promete — e quando os dois se contradizem, o produto vence.

Consulte o agente **`regras-de-negocio`** antes de mexer em preço, pacote, o
que cada pacote inclui, o fluxo do pedido, texto que o casal ou o convidado lê,
ou qualquer coisa que possa exigir trabalho manual por venda. Ele responde com
veredito (`PODE` / `NÃO PODE` / `PODE, COM AJUSTE` / `DECISÃO DO DONO`) e a
regra que sustenta.

**Não infira regra de negócio a partir do código** — o código já esteve errado.

As três promessas: **o casal não trabalha**, **o dono não encosta no código**,
**a página é a proposta** (sem funil por WhatsApp).

## 6. A branch `feedback-001` NÃO deve ser mesclada

Existe uma branch `feedback-001` (sem o `fix/`) com o commit `7160ade`, 57
arquivos, +3.974 linhas, que nunca entrou na `main`. Parece trabalho perdido; é
a arquitetura **anterior** à multi-tenancy:

| No órfão | Na main hoje |
|---|---|
| `lib/repositories/orderPhotos.ts` (foto presa ao PEDIDO) | `sitePhotos.ts` (foto do SITE) |
| `lib/storage.ts` | `lib/storage/supabase.ts` |
| `PhotoUploader` + `OrderPhotoSection` | `PhotoManager` |
| migração 0008 | 0012 |

Mesclar ressuscitaria `order_photos` — uma das quatro tabelas que o
`drizzle-kit push` não pode dropar.

**O que de fato se perdeu ali: a verificação de e-mail.** `schema.ts` declara
`email_verification_tokens`, a tabela existe em produção, e NÃO há código na
`main` que a use — ele só existe no órfão (`email-verification-actions.ts`,
`repositories/emailVerification.ts`, `EmailVerificationBanner`,
`/conta/confirmar`). É feature a reconstruir sobre a arquitetura de hoje, não a
resgatar por merge.

A branch fica onde está, como registro. Não apague — mas também não mescle.

---

## Scripts

| Comando | O quê |
|---|---|
| `npm run backup:full` | Dump completo → `backups/`. Antes de toda migração |
| `npm run db:generate` / `db:rehearse` / `db:migrate` | Migração. Nunca `push` |
| `npm run test:setup` | Sincroniza o schema `test` (mantido à mão) |
| `npm run verify:template <ids>` | Confere que o desenho vem de token |
| `npm run shot:template <pasta> <ids>` | Fotografa o molde em 1440px e 390px |
| `npm run setup:storage` | Bucket privado das fotos. Uma vez por ambiente |
| `npm run fix:slug` | Troca slug de site em prévia e sem convidados |
| `npm run seed:demo` | Site de demonstração `ana-e-pedro` |

**Nunca rode duas suítes de teste ao mesmo tempo** — elas limpam as mesmas
tabelas e produzem falhas que não existem. Ver Skill `testes`.

## Arquitetura, em cinco linhas

- **Multi-tenant**: `sites` é o tenant raiz. Toda consulta pública é escopada
  por `siteId`. `getGroupBySlug` é global **de propósito** (§6.2 do SDD).
- **Motor de templates**: molde + tokens (`ThemeSpec`) + conteúdo do banco.
  Corrigir um molde corrige todos os sites. Os 6 estilos estão portados.
- **Provisionamento**: `submitOrderAction` cria o site na hora e move o pedido
  para `preview_ready`.
- **Publicação**: pagamento confirmado põe o site no ar sozinho, por três
  caminhos (§7.2 do SDD).
- **Métricas**: beacon em `/api/track`. **IP nunca é gravado** — `visitor_hash`
  é HMAC com sal que gira a cada 24h (LGPD).

## Pendências conhecidas

- **`CRON_SECRET` está CONFIGURADO** desde 15/09/2026 — as duas rotas de
  `/api/cron/*` respondem 401 a chamada sem assinatura, e não mais o 503 de
  "não configurado". O resumo semanal sai às segundas, 11h UTC (8h de
  Brasília), e só para casal com movimento na semana; a expiração roda todo
  dia e hoje não tem o que arquivar (nenhum site tem prazo).
- **`ABACATEPAY_WEBHOOK_SECRET` está CONFIGURADO** desde antes de 15/09/2026 —
  o webhook responde 401 a chamada sem assinatura, e o 503 de "não
  configurado" não aparece mais. Esta linha dizia o contrário até então.
- **A chave do AbacatePay em produção é de SANDBOX** (`abc_dev…`, visto em
  16/09/2026). O checkout abre, o webhook responde e o site é publicado — mas
  **nenhum dinheiro é capturado**, e um pagamento de teste publica igual. O dono
  sabe e vai trocar a chave depois; até lá, não conclua de um pedido `paid` que
  houve pagamento real.
- **O interruptor de movimento perdeu a tela, não o mecanismo.**
  `components/ui/InterruptorDeMovimento.tsx` não é importado por ninguém desde
  que o dono mandou tirar a linha do rodapé (15/09/2026). **Não apague o
  arquivo nem as regras que ele liga**: `app/layout.tsx` ainda escreve
  `data-movimento` no `<html>` a partir de `localStorage["enlace:movimento"]`,
  ~20 regras de `globals.css` dependem desse atributo, e cinco specs de
  `specs/design-system/` o citam. Hoje o efeito prático é que
  `prefers-reduced-motion` do sistema sempre vence — que é o padrão acessível
  certo; o que sumiu foi a chave de virar isso por site. Reconstruir a tela em
  outro lugar é decisão do dono.
- **Álbum pós-festa é placeholder** — as fotos só existem depois da festa.
- **Pix de presente falho não é detectável**: o convidado auto-declara que
  pagou (`registerContributionAction`), e o dinheiro nunca passa pela Enlace
  (§3). Não há como saber que um Pix não caiu — logo, não há tela H5.
- **Cancelar pedido órfã o site**: `deleteOrder` apaga o pedido e
  `sites.order_id` é `set null`. Invisível (segue em `preview`), mas acumula.
  Apagar a conta do casal faz o mesmo — aí de propósito: o site do casamento
  não some porque a conta sumiu.
- **`DATABASE_URL_TEST` aponta para a mesma instância de produção** — isolado
  por schema, mas erro de config alcança dado real.
