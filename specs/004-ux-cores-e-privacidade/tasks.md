# Tasks: As cores certas, e o nome que era para ser privado

**Input**: [spec.md](./spec.md) · **Auditoria**: UX-006, UX-008

---

## Fase A — As cores do modelo (UX-006)

- [x] **T001** `lib/theme/coresDoModelo.ts` **(novo)**: a conversão
  `swatches → [primaryColor, secondaryColor, tertiaryColor]` sai do componente, com a
  ordem certa (acento, tinta, papel). — `[UX-006][FR-001]`
- [x] **T002** `lib/theme/coresDoModelo.test.ts` **(novo)**: a invariante, de ponta a ponta
  — para os **seis** modelos, escolher e não mexer em nada devolve a paleta daquele
  modelo. — `[UX-006][FR-002]`
- [x] **T003** `components/account/wizard/OrderWizard.tsx`: usar a função nova em
  `escolherModelo`. — `[UX-006][FR-001]`
- [x] **T004** Confirmar que nada recalcula tema gravado — a correção não toca em site
  provisionado. — `[UX-006][FR-003]`

## Fase B — O rótulo é do casal (UX-008)

- [x] **T005** `app/rsvp/[slug]/page.tsx`: parar de passar o rótulo para a tela pública. —
  `[UX-008][FR-004]`
- [x] **T006** `components/site/ConfirmacaoDePresenca.tsx`: remover a prop `grupo` — do
  título e da tela de sucesso. Remover, não tornar opcional. — `[UX-008][FR-004]`
- [x] **T007** `app/s/[slug]/meu-convite/page.tsx`: saudação sem o rótulo. —
  `[UX-008][FR-004]`
- [x] **T008** `lib/site/rotulo-do-grupo-e-privado.test.ts` **(novo)**: teste estrutural —
  nenhuma tela pública lê `.label`, e o painel continua prometendo o sigilo. —
  `[UX-008][FR-004][FR-005]`

## Fase C — Portões e verificação

- [x] **T009** `npm run lint` limpo
- [x] **T010** `npx tsc --noEmit` limpo
- [x] **T011** `npm run build` passando
- [ ] **T012** `npm run test` verde
- [ ] **T013** **Verificação no navegador (E2E)** no site no ar: os seis modelos sem aviso
  de contraste; rótulo de família reconhecível não aparece nas duas telas do convidado. —
  `[SC-001][SC-002]`
- [ ] **T014** Atualizar o status de UX-006 e UX-008 na auditoria e no relatório. —
  `[constitution · princípio II]`

## Cobertura

| UX-ID | FR | Código | Verificação |
|---|---|---|---|
| UX-006 | FR-001, FR-002, FR-003 | T001, T003 | T002, T013 |
| UX-008 | FR-004, FR-005 | T005, T006, T007 | T008, T013 |
