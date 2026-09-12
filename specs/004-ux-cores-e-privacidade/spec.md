# Feature Specification: As cores certas, e o nome que era para ser privado

**Feature Branch**: `004-ux-cores-e-privacidade`

**Created**: 2026-09-11

**Status**: Draft

**Input**: Auditoria E2E de 11/09/2026 — UX-006 e UX-008, os dois últimos achados abertos.

## Contexto

Os dois estavam parados esperando decisão do dono. Investigando o código antes de mexer,
a decisão de um deles **se dissolveu** e a do outro ficou fácil de tomar sem risco:

### UX-006 — as cores não estavam trocadas onde eu pensei

A dúvida era: "alinhar rótulo e papel das cores muda o tema resolvido; aplicar só a
pedidos novos ou a todos, inclusive o casamento no ar?".

Lendo o código, o alinhamento **já tinha sido feito**, e de propósito — há um comentário em
`OrderWizard.tsx` explicando que os rótulos foram escritos para seguir o que
`resolveTheme` faz, justamente porque trocar o mapeamento "teria repintado todo site já
provisionado".

O que restou trocado é **outra coisa, e é um erro simples**: ao escolher um modelo, o
questionário preenchia a cor 1 com a **tinta** e a cor 2 com o **acento** — o inverso do
que as duas significam. `swatches` é `[papel, tinta, acento]`, e a atribuição estava
cruzada.

**Consequência real, não cosmética:** o casal escolhia Toscana, não tocava em mais nada, e
o site nascia com o dourado do acento (`#9c8654`) como **cor do texto** sobre papel creme.
A própria etapa acusava — *"o texto vai ficar difícil de ler sobre esse fundo"* — e estava
certa. Os seis modelos faziam isso.

**E a decisão some porque a correção não repinta nada:** o tema é resolvido e gravado uma
vez, no provisionamento. Ninguém recalcula o que já está no banco. Corrigir o
preenchimento muda apenas o ponto de partida de um **pedido novo**.

### UX-008 — a promessa contra a tela

O painel pede o nome da família com esta frase embaixo do campo: *"Do jeito que vocês
chamam eles. **Só vocês veem este nome.**"* E esse nome abria as duas telas do convidado.

Entre mudar a promessa e cumpri-la, cumprir custa uma saudação menos pessoal; mudar custa
a confiança de quem **já preencheu** confiando nela. O convidado chega por um link pessoal
— ele já sabe que o convite é dele.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - O modelo escolhido é o modelo que nasce (Priority: P1)

O casal escolhe Toscana, gosta do que vê, não mexe em mais nada e envia. O site nasce com
a paleta do Toscana: tinta escura, acento dourado, papel creme — e sem aviso de contraste.

**Acceptance Scenarios**:

1. **Given** a etapa dos modelos, **When** o casal escolhe qualquer um dos seis, **Then**
   a etapa das cores mostra a cor do texto escura e a de destaque clara — e **nenhum**
   aviso de contraste aparece.
2. **Given** o mesmo pedido enviado sem tocar nas cores, **When** o site é criado, **Then**
   o tema gravado é exatamente a paleta do modelo.
3. **Given** um site já provisionado, **When** esta correção entra no ar, **Then** ele
   **não muda de cor** — nada é recalculado.

---

### User Story 2 - O nome que o casal deu à família fica com o casal (Priority: P2)

**Acceptance Scenarios**:

1. **Given** uma família chamada "Família Souza — tios da noiva", **When** o convidado abre
   `/rsvp/<slug>`, **Then** lê "Vocês vêm?" — sem o rótulo.
2. **Given** a mesma família, **When** o convidado abre o convite pessoal, **Then** lê
   "Olá!" — sem o rótulo.
3. **Given** a confirmação enviada, **When** a tela de sucesso aparece, **Then** ela não
   repete o rótulo.
4. **Given** o painel, **When** o casal cadastra uma família, **Then** a frase "Só vocês
   veem este nome" continua lá — e agora é verdade.

### Edge Cases

- Modelo sem `swatches` completas: nenhuma cor é inventada; o preset do molde vale.
- Casal que escolheu cores próprias antes desta correção: o pedido guarda o que ele
  escolheu, e nada é reescrito.

## Requirements *(mandatory)*

- **FR-001** (resolve UX-006): Escolher um modelo MUST preencher a cor de destaque com o
  acento do modelo e a cor do texto com a tinta do modelo.
  *Aceite no navegador*: escolher cada um dos seis e conferir que nenhum aviso de
  contraste aparece.
- **FR-002** (resolve UX-006): Escolher um modelo e não alterar nada MUST produzir
  exatamente a paleta daquele modelo no tema gravado.
  *Aceite*: teste que percorre os seis modelos, de `swatches` a tema resolvido.
- **FR-003** (resolve UX-006): A correção MUST NOT alterar o tema de site já provisionado.
- **FR-004** (resolve UX-008): O rótulo do grupo MUST NOT aparecer em nenhuma tela que o
  convidado abre.
  *Aceite no navegador*: cadastrar família com rótulo reconhecível e abrir as duas telas
  públicas.
- **FR-005** (resolve UX-008): A promessa do painel MUST continuar escrita — e verdadeira.

## Success Criteria *(mandatory)*

- **SC-001**: Nenhum dos seis modelos chega à etapa das cores com aviso de contraste.
- **SC-002**: O rótulo do grupo não aparece em nenhuma tela pública.
- **SC-003**: Nenhum site já publicado muda de aparência com este deploy.

## Assumptions

- **Sites provisionados com as cores trocadas continuam como estão.** Reescrever tema
  gravado contraria o princípio V e a decisão já registrada no código. Se o dono quiser
  recuperá-los, é outra conversa — e envolve escolher entre repintar sem avisar ou avisar
  cada casal.
- A saudação pelo **nome dos convidados** (em vez de neutra) exigiria uma coluna a mais na
  consulta de `/rsvp/<slug>`, que é rota crítica e cacheada. Fica como melhoria possível,
  não como parte desta correção.
