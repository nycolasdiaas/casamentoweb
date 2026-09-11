# Feature Specification: A fricção que sobrou

**Feature Branch**: `003-ux-fricao-celular-e-polimento`

**Created**: 2026-09-11

**Status**: Draft

**Input**: Auditoria E2E de 11/09/2026 — UX-009, UX-010, UX-011, UX-013, UX-014, UX-015,
UX-017, UX-018, UX-019, UX-020.

## Contexto

Resolvidos o funil (001) e a perda de dado (002), sobraram doze achados. Dois esperam
decisão do dono (UX-006 e UX-008) e não entram. Esta feature pega **todos os outros** —
são pequenos, independentes entre si, e nenhum precisa de decisão.

Agrupar dez achados numa feature só é escolha deliberada: cada um custa poucas linhas, e
três ciclos de cerimônia para "traduzir uma mensagem de erro" gastariam mais do que a
correção. O que **não** é negociado é a rastreabilidade: cada FR abaixo cita o UX-ID que
resolve, e cada um tem verificação própria.

| UX-ID | Sev. | O que acontece hoje |
|---|---|---|
| UX-009 | 🟡 | Data de casamento no passado é aceita sem aviso |
| UX-010 | 🟡 | Arquivo não suportado no upload responde *"The source image could not be decoded"* |
| UX-011 | 🟡 | "Salvar e sair" salva, mas não sai |
| UX-013 | 🟡 | **Retratado** — era o meu automatizador rolando a página, não o produto |
| UX-014 | 🟡 | A linha de lugar da capa começa pelo número da casa |
| UX-015 | 🟡 | Alvos de toque de 12px na navegação do site do convidado |
| UX-017 | 🟢 | O WhatsApp do cadastro não aparece em lugar nenhum depois |
| UX-018 | 🟢 | A amostra de cores mostra "Ana & Pedro", não o casal |
| UX-019 | 🟢 | História colada acima de 5.000 caracteres é cortada em silêncio |
| UX-020 | 🟢 | Sair da conta e cancelar pedido terminam sem confirmação |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - O questionário avisa antes de deixar passar (Priority: P1)

O casal digita a data errada — um ano trocado, um dia que já passou — e o questionário
avisa na hora, em vez de deixar o site nascer com uma contagem regressiva negativa.

**Acceptance Scenarios**:

1. **Given** a etapa da data, **When** o casal informa uma data anterior a hoje e avança,
   **Then** vê "Essa data já passou. Confiram o dia do casamento — ou deixem em branco se
   ainda não fecharam." e permanece na etapa.
2. **Given** a mesma etapa, **When** informa uma data futura, **Then** avança normalmente.
3. **Given** a tela de **Conteúdo** de um site já publicado, **When** o casal informa uma
   data passada, **Then** ela é aceita — o casamento pode já ter acontecido, e o álbum
   depende disso.

---

### User Story 2 - O produto fala português quando algo dá errado (Priority: P2)

**Acceptance Scenarios**:

1. **Given** a tela de Fotos, **When** o casal escolhe um arquivo que não é foto, **Then**
   lê "Esse arquivo não é uma foto que a gente consiga usar. Vale JPG, PNG ou WebP."
2. **Given** um arquivo corrompido que se diz JPG, **When** o envio falha, **Then** a
   mensagem também é em português e diz o que fazer.
3. **Given** a etapa da história, **When** o texto chega a 5.000 caracteres, **Then** o
   casal é avisado de que o que passar disso não entra.

---

### User Story 3 - O convidado alcança o que vê (Priority: P2)

**Acceptance Scenarios**:

1. **Given** o site no celular (390×844), **When** o convidado mira qualquer âncora da
   barra, **Then** a área de toque tem pelo menos 40px de altura.
2. **Given** o mesmo site, **When** ele mira "Confirmar presença", **Then** o alvo tem
   pelo menos 44px.
3. **Given** um endereço no formato "Rua X, 123 — Bairro, Cidade/UF", **When** a capa
   monta a linha de lugar, **Then** ela **não** começa pelo número.

---

### User Story 4 - O painel diz a verdade sobre o que faz (Priority: P3)

**Acceptance Scenarios**:

1. **Given** o questionário, **When** o casal olha o botão do topo, **Then** lê "Salvar
   rascunho" — que é o que ele faz — e recebe "Rascunho salvo." ao usá-lo.
2. **Given** a tela Visual com conteúdo salvo, **When** o casal olha a amostra de cores,
   **Then** vê os nomes **dele**, não os do casal da vitrine.
3. **Given** a tela da conta, **When** o casal procura o WhatsApp informado no cadastro,
   **Then** encontra o número — ou "não informado", se deixou em branco.

### Edge Cases

- Casal sem `partnerA`/`partnerB` preenchidos: a amostra tira os dois nomes de
  "Fulano & Beltrano"; sem isso, cai no exemplo.
- Endereço sem vírgula nenhuma ("Fazenda Santa Rita"): continua inteiro na capa.
- Arquivo sem `type` declarado: cai no `catch`, com mensagem em português.

## Requirements *(mandatory)*

- **FR-001** (resolve UX-009): O questionário MUST recusar data de casamento anterior a
  hoje, com mensagem que diz o que fazer. A tela de Conteúdo MUST NOT herdar essa trava.
- **FR-002** (resolve UX-010): Nenhuma mensagem de falha de upload MUST chegar ao casal em
  inglês ou com vocabulário técnico.
- **FR-003** (resolve UX-011): O rótulo do botão MUST descrever o que ele faz.
- **FR-004** (resolve UX-014): A linha de lugar da capa MUST NOT começar por número.
- **FR-005** (resolve UX-015): Todo alvo de toque da barra do site MUST ter pelo menos
  40px de altura no celular; o de confirmar presença, pelo menos 44px.
- **FR-006** (resolve UX-017): O WhatsApp informado no cadastro MUST aparecer nos dados da
  conta.
- **FR-007** (resolve UX-018): A amostra de cores MUST usar os nomes e a data do casal
  quando eles existirem.
- **FR-008** (resolve UX-019): O casal MUST ser avisado quando o texto atingir o limite.
- **FR-009** (resolve UX-013): **Nenhum requisito.** O achado foi retratado: medido de
  novo, clicando por script em vez de pelo automatizador, a página não se move
  (scrollY 990 antes e 990 depois). O scroll era do meu próprio navegador de teste, que
  rola o elemento para dentro da viewport antes de clicar.
- **FR-010** (resolve UX-020): **Adiado.** Confirmar "saiu da conta" e "pedido cancelado"
  no destino exigiria `searchParams` em duas rotas cacheadas — e `cacheComponents` está
  ligado, onde isso é armadilha conhecida (AGENTS.md §4). O custo não se justifica para um
  🟢 cujas duas ações já mudam de tela de forma inequívoca, e cujo cancelamento já tem
  diálogo de confirmação **antes**. Reabre se alguém relatar confusão real.

## Success Criteria *(mandatory)*

- **SC-001**: Nenhuma data no passado entra num pedido novo.
- **SC-002**: Nenhuma mensagem em inglês chega ao casal na tela de Fotos.
- **SC-003**: Todos os alvos de toque da barra do site ≥ 40px de altura em 390px.
- **SC-004**: Nenhuma capa começa a linha de lugar por número.

## Assumptions

- A máscara de digitação do WhatsApp **não** entra: o `pattern` do campo já barra lixo, e
  o que resolvia o problema descrito (um dígito errado invisível para sempre) era o número
  aparecer nos dados da conta.
- Nenhuma migração de banco.
