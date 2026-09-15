# Tasks: O que eu tinha deixado de fora

**Input**: [spec.md](./spec.md)

---

## Fase A — O convidado é chamado pelo nome

- [x] **T001** `lib/site/saudacao.ts` **(novo)**: `saudacaoDeConvidados` (até três nomes) e
  `pluralDoConvite` (você/vocês pelo número de lugares). — `[FR-001][FR-002]`
- [x] **T002** `lib/site/saudacao.test.ts` **(novo)**: nove casos, incluindo o corte em
  quatro nomes e o singular de um lugar. — `[FR-001][FR-002]`
- [x] **T003** `lib/repositories/groups.ts`: a consulta do RSVP passa a devolver os nomes
  dos convidados — segunda ida ao banco, não `join`. — `[FR-001]`
- [x] **T004** `components/site/ConfirmacaoDePresenca.tsx` e as duas telas públicas usam a
  saudação. O rótulo continua fora. — `[FR-001][FR-002][FR-003]`

## Fase B — Toda ação diz que aconteceu

- [x] **T005** `components/ui/prensa/AvisoPorHash.tsx` **(novo)**: lê o fragmento, escreve
  o recado e limpa o endereço. Sem estado, sem `searchParams`. — `[FR-004][FR-005]`
- [x] **T006** `signoutAction` → `/#saiu`; `cancelOrderAction` → `/conta/pedidos#cancelado`.
  — `[FR-004]`
- [x] **T007** A vitrine e a lista de pedidos mostram o recado. — `[FR-004]`

## Fase C — O WhatsApp

- [x] **T008** `lib/telefone.ts` + teste: máscara que acompanha quem digita. — `[FR-006]`
- [x] **T009** `app/conta/criar/page.tsx`: o campo formata no `onInput`. — `[FR-006]`

## Fase D — A pendência que não existia

- [x] **T010** Medir, no site no ar, a paleta dos dois sites publicados. Resultado:
  `ink:#3d4a36`, `accent:#b8985f` nos dois — **corretos**. Os sites afetados pelo
  preenchimento trocado eram só os de teste. Registrado na auditoria e no relatório.

## Fase E — Portões

- [x] **T011** `npm run lint` limpo
- [x] **T012** `npx tsc --noEmit` limpo
- [x] **T013** `npm run build` passando
- [x] **T014** `npm run test` verde
- [ ] **T015** **Verificação no navegador (E2E)** no site no ar: saudação pelos nomes no
  RSVP e no convite pessoal; "Pedido cancelado." e "Vocês saíram da conta."; máscara do
  WhatsApp. — `[SC-001][SC-002]`
- [x] **T016** Atualizar auditoria e relatório: UX-020 sai de "adiado" para resolvido, e a
  lista de "o que não foi feito" encolhe. — `[constitution · princípio II]`

## Estado final — 12/09/2026

Portões: lint limpo, `tsc --noEmit` limpo, `next build` passando, `npm run test` com
**833 testes em 74 arquivos, todos verdes**.

## Fase F — Achado do reteste de 14/09/2026

- [x] **T017** `lib/site/saudacao.ts`: `perguntaDosLugares(lugares)` — singular sem
  "dos 1 lugar"; teste em `saudacao.test.ts`. — `[UX-022]`
- [x] **T018** `components/site/ConfirmacaoDePresenca.tsx` usa a função. — `[UX-022]`
- [x] **T019** Portões + verificação no site no ar: grupo de 1 lugar mostra "Quantas
  pessoas vão?"; grupo de 2 continua "Quantos dos 2 lugares vão?". — `[UX-022]`

## Fase G — Achado do 2º reteste de 14/09/2026

- [x] **T020** `preload: false` nas 49 fontes de `lib/templates/*/fonts.ts`. — `[UX-023]`
- [x] **T021** `preload: false` nas 34 prévias de `components/account/wizard/fontPreview.ts`. — `[UX-023]`
- [x] **T022** Portões + comparar `next-font-manifest.json` antes/depois por rota. — `[UX-023]`
  Lint, `tsc` e `next build` limpos. Arquivos pré-carregados: `/rsvp` 17→6, `/conta` 17→6,
  `/s/[slug]` 44→6, `/preview` 44→6, `/conta/pedido/novo` 45→6, visual e convites 44→6.
  Sobram só Italiana, Petit Formal Script (raiz) e as três da plataforma (~103 KB).
- [x] **T023** Verificação no site no ar: arquivos de fonte baixados no RSVP, no painel e
  no site do casal; os seis moldes e o casamento real continuam com as fontes certas. — `[UX-023]`

## Fase H — Teste exploratório em produção de 15/09/2026

- [x] **T024** `ConfirmacaoDePresenca.tsx`: sucesso volta a aparecer depois de editar a
  resposta (estado reaberto em vez de booleano). — `[UX-024]`
- [x] **T025** `lib/site/saudacao.ts`: `tituloDoConvite` com maiúscula sem nomes; teste. — `[UX-025]`
- [x] **T026** `lib/telefone.ts`: `whatsappValido`; `signupAction` recusa número
  incompleto; `pattern` do campo escapado para a flag `v`; testes. — `[UX-026]`
- [x] **T027** `Campo.tsx`: `role="alert"` na mensagem de erro. — `[UX-027]`
- [x] **T028** Portões: lint, tsc e build limpos; 844 testes em 74 arquivos verdes, com a suíte rodando sozinha. — `[UX-024..027]`
- [x] **T029** Verificação no site no ar: editar resposta confirma; família sem nomes lê
  "Vocês vêm?"; cadastro recusa "(81) 9"; casamento real intacto. — `[UX-024..027]`
- [x] **T030** Contraste dos itens ausentes nos pacotes: `--c-ink-2` cheio na home e em
  `/pacotes` (2,66:1 e 3,21:1 → 6,43:1). — `[UX-028]`
- [x] **T031** AGENTS.md: `CRON_SECRET` vazio vira pendência conhecida, e a linha do
  webhook passa a dizer que ele está configurado. — `[UX-028]`
- [x] **T032** Verificação no site no ar do contraste e do erro anunciado: home e `/pacotes`
  em 6,43:1, Lighthouse da home 90 → 94, erro do login com `role="alert"`. — `[UX-027][UX-028]`

