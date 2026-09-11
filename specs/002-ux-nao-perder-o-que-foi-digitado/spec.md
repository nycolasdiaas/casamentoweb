# Feature Specification: Nada do que o casal digitou se perde

**Feature Branch**: `002-ux-nao-perder-o-que-foi-digitado`

**Created**: 2026-09-11

**Status**: Draft

**Input**: Auditoria E2E de 11/09/2026 (`docs/auditoria/AUDITORIA-E2E.md`) — UX-004 e UX-012.

## Contexto

| UX-ID | O que acontece hoje |
|---|---|
| UX-004 🔴 | O casal preenche onze campos do Conteúdo — locais, endereços, horários, traje, a história inteira — erra um dígito da chave Pix, salva, e **perde tudo**. A mensagem sobre o Pix está certa; o formulário volta ao estado anterior |
| UX-012 🟡 | Na prévia, o mural responde *"Não achamos esse casamento"* — o casamento existe, só não está publicado — e **apaga o recado** que acabou de ser escrito |

Os dois são o mesmo princípio quebrado em dois lugares: **erro de validação não
pode custar o que já foi digitado**.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Errar o Pix não apaga o resto (Priority: P1)

O casal preenche a tela de Conteúdo inteira, digita a chave Pix com um
caractere errado e salva. A tela explica o problema da chave — e tudo o que foi
digitado continua ali, para corrigir só o Pix e salvar de novo.

**Why this priority**: é 🔴 e é perda de dado, causada pelo campo com o formato
mais exigente da tela. A história de amor do casal é o texto mais caro de
reescrever.

**Independent Test**: preencher o Conteúdo, pôr `abc` na chave Pix, salvar, e
conferir que os demais campos continuam preenchidos.

**Acceptance Scenarios**:

1. **Given** os onze campos preenchidos e uma chave Pix inválida, **When** o
   casal salva, **Then** vê a mensagem sobre a chave **e** todos os campos
   seguem com o que ele digitou.
2. **Given** o mesmo estado, **When** o casal corrige só a chave e salva,
   **Then** o salvamento conclui com tudo que estava na tela.
3. **Given** qualquer outro erro de validação (texto longo demais, link de mapa
   sem `http`, data impossível), **When** o casal salva, **Then** o que foi
   digitado continua na tela.
4. **Given** uma chave Pix inválida, **When** o salvamento é recusado, **Then**
   nenhuma chave "quase certa" é gravada — a recusa do Pix continua inteira.

---

### User Story 2 - O mural da prévia diz a verdade e guarda o recado (Priority: P2)

O casal abre a própria prévia para conferir o mural, escreve um recado de teste
e envia. A tela explica que o mural começa a valer quando o site estiver no ar —
e o texto escrito continua no campo.

**Why this priority**: a recusa é correta (recado gravado numa prévia
apareceria do nada no dia da publicação); o que está errado é a explicação e a
perda do texto.

**Independent Test**: escrever um recado na prévia e enviar.

**Acceptance Scenarios**:

1. **Given** um site em prévia, **When** alguém envia um recado, **Then** a
   mensagem diz que o mural entra em funcionamento com o site no ar — e não que
   o casamento não existe.
2. **Given** o mesmo envio recusado, **When** a mensagem aparece, **Then** o
   nome e o recado digitados continuam nos campos.
3. **Given** um endereço de casamento que realmente não existe, **When** alguém
   envia um recado, **Then** a mensagem continua sendo "não achamos esse
   casamento".

### Edge Cases

- Erro de validação **depois** de um salvamento bem-sucedido: a tela não pode
  voltar a mostrar valores antigos.
- Dois erros ao mesmo tempo (Pix inválido e texto longo): uma mensagem por vez
  é aceitável; o que não pode é perder o conteúdo.
- Campo esvaziado de propósito pelo casal (apagar a história): continua sendo
  gravado como vazio — preservar o digitado não pode ressuscitar texto apagado.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** (resolve UX-004): Quando o salvamento do conteúdo for recusado por
  validação, a tela MUST continuar mostrando **exatamente o que o casal
  digitou**, em todos os campos.
  *Aceite no navegador*: preencher tudo, errar o Pix, salvar, e conferir campo a
  campo que nada voltou ao valor anterior.

- **FR-002** (resolve UX-004): A recusa de chave Pix inválida MUST continuar
  inteira — nenhuma chave parcial ou "quase certa" é gravada.
  *Aceite*: teste garante que um salvamento recusado não escreve no banco.

- **FR-003** (resolve UX-004): A mensagem de erro MUST aparecer onde o casal
  está olhando ao salvar, não abaixo da dobra.
  *Aceite no navegador*: com a tela rolada até o botão, o erro está visível sem
  rolar mais.

- **FR-004** (resolve UX-012): A recusa de recado em site não publicado MUST
  explicar o motivo verdadeiro — o mural passa a valer quando o site entra no ar
  — e MUST ser diferente da mensagem de endereço inexistente.
  *Aceite no navegador*: enviar um recado numa prévia e ler a mensagem.

- **FR-005** (resolve UX-012): O nome e o recado digitados MUST continuar nos
  campos quando o envio for recusado.
  *Aceite no navegador*: enviar na prévia e conferir que o texto continua lá.

## Success Criteria *(mandatory)*

- **SC-001**: Nenhum erro de validação da tela de Conteúdo faz o casal redigitar
  qualquer campo.
- **SC-002**: Um casal que erra a chave Pix conclui o salvamento em menos de
  duas tentativas, sem reescrever nada.
- **SC-003**: Nenhuma mensagem do produto afirma que o casamento não existe
  quando ele existe.

## Assumptions

- O formulário de conteúdo continua sendo não-controlado (`defaultValue`), como
  hoje: a correção preserva os valores sem transformar a tela num formulário
  controlado, o que seria reescrevê-la (princípio III).
- A regra de negócio de recusar recado em prévia **não muda** — só o texto e a
  preservação do que foi digitado.
- Nenhuma migração de banco.
