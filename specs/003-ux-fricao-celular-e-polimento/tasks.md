# Tasks: A fricção que sobrou

**Input**: [spec.md](./spec.md)
**Auditoria**: `docs/auditoria/AUDITORIA-E2E.md` — UX-009, UX-010, UX-011, UX-013, UX-014,
UX-015, UX-017, UX-018, UX-019, UX-020

---

## Fase A — O questionário avisa antes de deixar passar

- [x] **T001** `app/actions/account-actions.ts` · `parseOrderForm`: recusar data anterior a
  hoje, com mensagem que diz o que fazer. Sem tocar na tela de Conteúdo. — `[UX-009][FR-001]`

## Fase B — O produto fala português

- [x] **T002** `lib/site/prepararFoto.ts`: conferir o tipo do arquivo antes de decodificar
  e traduzir a falha do navegador. — `[UX-010][FR-002]`
- [x] **T003** `components/account/wizard/OrderWizard.tsx`: avisar quando a história chegar
  ao limite de 5.000. — `[UX-019][FR-008]`
- [x] **T004** `OrderWizard` + `app/conta/pedido/[id]/page.tsx`: "Salvar e sair" vira
  "Salvar rascunho", e o texto da página acompanha. — `[UX-011][FR-003]`

## Fase C — O convidado alcança o que vê

- [x] **T005** `lib/site/lugar.ts`: descartar o penúltimo trecho quando ele começa por
  número. — `[UX-014][FR-004]`
- [x] **T006** `lib/site/lugar.test.ts` **(novo)**: seis casos, incluindo o endereço que
  quebrou na auditoria. — `[UX-014][FR-004]`
- [x] **T007** `components/site/BarraDoSite.tsx`: área de toque das âncoras e do botão de
  confirmar presença. — `[UX-015][FR-005]`

## Fase D — O painel diz a verdade

- [x] **T008** `app/conta/page.tsx`: mostrar o WhatsApp nos dados da conta. — `[UX-017][FR-006]`
- [x] **T009** `components/account/ThemeEditor.tsx` + `app/conta/pedidos/[id]/visual/page.tsx`:
  a amostra de cores usa os nomes e a data do casal. — `[UX-018][FR-007]`

## Fase E — Achados sem código

- [x] **T010** **UX-013 retratado**: medido de novo clicando por script — scrollY 990 antes
  e 990 depois. O scroll era do automatizador de teste. Registrado na auditoria. — `[UX-013][FR-009]`
- [x] **T011** **UX-020 adiado**, com justificativa escrita na spec e na auditoria: exigiria
  `searchParams` em duas rotas cacheadas, e é 🟢. — `[UX-020][FR-010]`

## Fase F — Portões e verificação

- [x] **T012** `npm run lint` limpo
- [x] **T013** `npx tsc --noEmit` limpo
- [ ] **T014** `npm run build` passando
- [ ] **T015** `npm run test` verde
- [ ] **T016** **Verificação no navegador (E2E)** no site no ar: data no passado recusada;
  arquivo inválido com mensagem em português; botão "Salvar rascunho"; linha de lugar sem
  número; alvos de toque ≥ 40px em 390px; WhatsApp nos dados da conta; amostra com os nomes
  do casal. — `[SC-001][SC-002][SC-003][SC-004]`
- [ ] **T017** Atualizar o status dos dez achados na auditoria. — `[constitution · princípio II]`

## Cobertura

| UX-ID | FR | Código | Verificação |
|---|---|---|---|
| UX-009 | FR-001 | T001 | T016 |
| UX-010 | FR-002 | T002 | T016 |
| UX-011 | FR-003 | T004 | T016 |
| UX-013 | FR-009 | — (retratado) | T010 |
| UX-014 | FR-004 | T005, T006 | T016 |
| UX-015 | FR-005 | T007 | T016 |
| UX-017 | FR-006 | T008 | T016 |
| UX-018 | FR-007 | T009 | T016 |
| UX-019 | FR-008 | T003 | T016 |
| UX-020 | FR-010 | — (adiado) | T011 |
