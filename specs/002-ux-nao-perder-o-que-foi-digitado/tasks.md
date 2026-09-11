# Tasks: Nada do que o casal digitou se perde

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)
**Auditoria de origem**: `docs/auditoria/AUDITORIA-E2E.md` — UX-004, UX-012

---

## Fase A — História 1 (P1): errar o Pix não apaga o resto

- [x] **T001** `app/actions/content-actions.ts`: no ramo de erro, devolver também
  `valores` (o que veio no `FormData`) e `marca`. — `[UX-004][FR-001]`

- [x] **T002** `components/account/ContentEditor.tsx`: usar `state.valores` como
  `defaultValue` e `key={marca}` no formulário, para os valores devolvidos de
  fato aparecerem. — `[UX-004][FR-001]`

- [x] **T003** `components/account/ContentEditor.tsx`: mover a mensagem de erro
  para **acima** dos botões. — `[UX-004][FR-003]`

- [x] **T004** Teste da action: erro devolve os valores enviados; sucesso não
  devolve; chave Pix inválida não grava nada. — `[UX-004][FR-001][FR-002]`

- [x] **T005** **Verificação no navegador (E2E)**: preencher o Conteúdo inteiro,
  errar a chave Pix, salvar, e conferir campo a campo que nada se perdeu;
  corrigir a chave e salvar. Repetir em 390×844. Evidência em
  `docs/auditoria/evidencias/UX-004-depois.png`. — `[UX-004][SC-001][SC-002]`

## Fase B — História 2 (P2): o mural da prévia

- [x] **T006** `app/actions/guestbook-actions.ts`: separar "não achamos esse
  casamento" de "o mural entra em funcionamento quando o site estiver no ar".
  Texto pela Skill `texto-do-casal`. — `[UX-012][FR-004]`

- [x] **T007** Componente do mural: preservar nome e recado quando o envio for
  recusado. — `[UX-012][FR-005]`

- [x] **T008** Teste: site em prévia devolve a mensagem nova; site inexistente
  devolve a antiga. — `[UX-012][FR-004]`

- [x] **T009** **Verificação no navegador (E2E)**: escrever um recado na prévia,
  enviar, ler a mensagem e conferir que o texto continua no campo. Evidência em
  `docs/auditoria/evidencias/UX-012-depois.png`. — `[UX-012][SC-003]`

## Fase C — Portões

- [x] **T010** `npm run lint` limpo
- [x] **T011** `npx tsc --noEmit` limpo
- [x] **T012** `npm run build` passando
- [ ] **T013** `npm run test` verde
- [ ] **T014** Atualizar o status de UX-004 e UX-012 na auditoria e o índice de
  rastreabilidade. — `[constitution · princípio II]`

## Cobertura

| UX-ID | FR | Código | Verificação E2E |
|---|---|---|---|
| UX-004 | FR-001, FR-002, FR-003 | T001, T002, T003, T004 | T005 |
| UX-012 | FR-004, FR-005 | T006, T007, T008 | T009 |
