# Tasks: O casal termina o questionário e recebe o site

**Input**: `specs/001-ux-provisionamento-e-ambiente/` — [spec.md](./spec.md), [plan.md](./plan.md)

**Auditoria de origem**: `docs/auditoria/AUDITORIA-E2E.md` — UX-001, UX-002, UX-003,
UX-005, UX-016, UX-021

**Formato**: `[ID] [P?] [História] Descrição — [UX-ID][FR]`
· **[P]** = pode rodar em paralelo (arquivo diferente, sem dependência)
· Toda tarefa de código tem uma tarefa de verificação **no navegador** correspondente

---

## Fase A — Fundação (bloqueia todo o resto)

- [x] **T001** Escrever `lib/baseUrl.test.ts` cobrindo a cascata de descoberta do endereço,
  **antes** de mudar a função: (a) `NEXT_PUBLIC_SITE_URL` vence tudo; (b) sem ela, usa o
  domínio de produção informado pela plataforma; (c) sem ele, usa o da publicação atual;
  (d) sem nenhum, usa o host da requisição **só** se estiver na allowlist; (e) host fora da
  allowlist **não** vira endereço; (f) `localhost` só aparece fora de produção; (g) barra
  no fim é removida. — `[UX-001][UX-021][FR-002][FR-007][FR-012]`

- [x] **T002** Reescrever `lib/baseUrl.ts`: `getBaseUrl()` e `baseUrlEstatica()` passam a
  usar a mesma cascata da D1 do plano; acrescentar o domínio de produção atual à
  `ALLOWED_HOSTS`; `baseUrlEstatica()` deixa de devolver `localhost` em produção e passa a
  devolver string vazia quando não souber. Manter os comentários que explicam a proteção
  contra `Host` forjado. — `[UX-001][UX-002][UX-005][UX-021][FR-002][FR-007][FR-012]`

- [x] **T003** Rodar `npm run test lib/baseUrl.test.ts` e confirmar os 7 casos verdes. —
  `[FR-002][FR-007][FR-012]`

---

## Fase B — História 1 (P1): o site nasce ao fim do questionário

**Meta**: `UX-001` e `UX-003` resolvidos. Entregável independente — sozinho já devolve o
funil.

- [x] **T004** `lib/site/provision.ts`: tornar `baseUrl` opcional de verdade — sem
  endereço, o site nasce igual e `previewUrl` fica nulo. — `[UX-001][FR-011]`

- [x] **T005** `lib/site/provision.ts`: copiar para `site_content`, no INSERT do site novo,
  todos os campos que o questionário coleta (`weddingTime`, `ceremonyVenue`,
  `ceremonyAddress`, `receptionVenue`, `receptionAddress`, `receptionTime`, `dressCode`) e
  usar `order.story` na história — `order.notes` deixa de ser publicado como história.
  **Não tocar em site já existente**: a função continua retornando cedo quando acha um. —
  `[UX-003][FR-009][FR-010]`

- [x] **T006** [P] Teste de `provisionSiteForOrder` cobrindo T004 e T005: sem `baseUrl` o
  site nasce; com pedido completo, os sete campos chegam a `site_content`; `notes` não
  vira `story`; site existente não é reescrito. — `[UX-003][FR-009][FR-010][FR-011]`

- [x] **T007** `app/actions/account-actions.ts`: tirar `await getBaseUrl()` de dentro do
  bloco que provisiona e salva o conteúdo; obtê-lo antes, em `try/catch` próprio, e seguir
  com `null` se falhar. — `[UX-001][UX-003][FR-001][FR-011]`

- [x] **T008** `app/api/pedido/provisionar/route.ts`: não deixar a ausência de endereço
  derrubar a rota; em falha real, voltar para o painel com `provisionamento=erro` em vez de
  500. — `[UX-001][FR-001][FR-003][FR-004]`

- [x] **T009** `app/conta/pedidos/[id]/page.tsx`: mensagem em português quando
  `provisionamento=erro` — o que houve, o que fazer, e um caminho de volta. Texto revisado
  pela Skill `texto-do-casal`. — `[UX-001][FR-004]`

- [x] **T010** **Verificação no navegador (E2E)**: em produção, com conta nova, responder o
  questionário e enviar. Conferir: pedido em "PRÉVIA PRONTA", painel abre sem erro, e a aba
  Conteúdo mostra cerimônia, festa, traje e a história certa. Repetir em 390×844. Evidência
  em `docs/auditoria/evidencias/UX-001-depois.png` e `UX-003-depois.png`. —
  `[UX-001][UX-003][SC-001][SC-002][SC-007]`

---

## Fase C — História 2 (P2): o casal cria o convite

- [x] **T011** [P] `app/actions/invite-actions.ts`: tolerar ausência de endereço ao criar e
  ao publicar convite — o convite é criado e o endereço aparece quando houver. —
  `[UX-002][FR-003][FR-005]`

- [x] **T012** [P] `app/conta/convites/[conviteId]/page.tsx` e
  `app/conta/pedidos/[id]/compartilhar/page.tsx`: mesmo tratamento — a tela abre mesmo sem
  endereço, e diz o que não pôde mostrar. — `[UX-002][FR-003]`

- [x] **T013** [P] `app/error.tsx` e `app/global-error.tsx`: tela de erro em português, na
  voz da Enlace, com "tentar de novo" e caminho de volta. Texto revisado pela Skill
  `texto-do-casal`. — `[UX-002][FR-008]`

- [x] **T014** **Verificação no navegador (E2E)**: em produção, abrir a aba Convites e
  clicar em "Criar convite"; o editor abre e o endereço mostrado é o domínio real.
  Evidência em `docs/auditoria/evidencias/UX-002-depois.png`. — `[UX-002][SC-003]`

---

## Fase D — História 3 (P3): QR, link da família e cartão de compartilhamento

- [x] **T015** [P] `app/conta/pedidos/[id]/convidados/page.tsx`: mostrar o endereço da
  família como texto ao lado do botão de copiar, para o casal conferir e digitar se
  precisar. — `[UX-016][FR-013]`

- [x] **T016** **Verificação no navegador (E2E)**: pedir o QR de um site publicado em
  produção e receber a imagem; pedir o de um site em prévia e receber "não encontrado".
  Evidência em `docs/auditoria/evidencias/UX-005-depois.png`. — `[UX-005][FR-006][SC-004]`

- [x] **T017** **Verificação no navegador (E2E)**: ler as etiquetas de compartilhamento de
  um site publicado em produção e confirmar que `og:url` e `og:image` usam o domínio real;
  conferir que o painel mostra esse mesmo domínio. Evidência em
  `docs/auditoria/evidencias/UX-021-depois.png`. — `[UX-021][FR-012][SC-008]`

- [x] **T018** **Verificação no navegador (E2E)**: na aba Convidados em produção, a coluna
  "Endereço" mostra o endereço da família e o botão de copiar funciona. Evidência em
  `docs/auditoria/evidencias/UX-016-depois.png`. — `[UX-016][FR-013][SC-009]`

- [x] **T019** **Verificação no navegador (E2E)**: provocar uma falha de servidor numa rota
  do painel e confirmar que a tela resultante é da Enlace, **em português**, com caminho de
  volta — e não a tela em inglês do framework. Evidência em
  `docs/auditoria/evidencias/UX-002-erro-depois.png`. — `[UX-002][FR-004][FR-008][SC-005]`

---

## Fase E — Portões e fechamento

- [x] **T020** `npm run lint` limpo. — `[constitution · portão 1]`
- [x] **T021** `npx tsc --noEmit` limpo. — `[constitution · portão 2]`
- [x] **T022** `npm run build` passando (o `next build` é a verdade). — `[constitution · portão 3]`
- [x] **T023** `npm run test` verde, suíte inteira, uma de cada vez. — `[constitution · portão 4]`
- [x] **T024** Atualizar o **Status** de UX-001, UX-002, UX-003, UX-005, UX-016 e UX-021 na
  auditoria e preencher as colunas *Feature SDD* e *Tasks* do índice de rastreabilidade. —
  `[constitution · princípio II]`

---

## Dependências

```
T001 → T002 → T003 ─┬─→ T004 → T005 → T006 → T007 → T008 → T009 → T010
                    ├─→ T011 ┐
                    ├─→ T012 ├─→ T014
                    ├─→ T013 ┘
                    └─→ T015

T010, T014 → T020 → T021 → T022 → T023 → T024
T016, T017, T018, T019  (verificações em produção: só depois do deploy)
```

**T016 a T019 exigem deploy.** São verificações no ambiente publicado e dependem de
autorização explícita do dono para subir — a constitution proíbe deploy sem ela. As
tarefas de código e os portões (T001–T015, T020–T023) rodam sem deploy nenhum.

## Estado final — 11/09/2026

Todas as 24 tarefas concluídas. Portões: `npm run lint` limpo, `npx tsc --noEmit`
limpo, `npm run build` passando, `npm run test` com **792 testes em 67 arquivos,
todos verdes**. Verificação em produção depois do deploy `c85f436` — ver
`docs/auditoria/evidencias/RESULTADOS-DEPOIS.md`.

Uma correção durante a verificação: a T015 duplicou o endereço na célula da
tabela (a mesma substituição pegou a tabela e a lista do celular). Pego na
verificação em produção, corrigido no commit `c85f436`.

## Cobertura (conferida em `/speckit-analyze`)

| UX-ID | FR | Tarefas de código | Verificação E2E |
|---|---|---|---|
| UX-001 | FR-001, FR-002, FR-003, FR-004 | T002, T004, T007, T008, T009 | T010 |
| UX-002 | FR-003, FR-005, FR-008 | T002, T011, T012, T013 | T014, T019 |
| UX-003 | FR-009, FR-010, FR-011 | T004, T005, T007 | T010 |
| UX-005 | FR-006 | T002 | T016 |
| UX-016 | FR-013 | T002, T015 | T018 |
| UX-021 | FR-012 | T002 | T017 |
