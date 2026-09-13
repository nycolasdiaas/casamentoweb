# Feature Specification: O que eu tinha deixado de fora

**Feature Branch**: `005-ux-o-que-faltava`

**Created**: 2026-09-12

**Input**: as três coisas que o relatório de correções listava como "não feitas, e por quê" —
e uma quarta pendência que se dissolveu quando foi medida.

## Contexto

Fechadas as features 001 a 004, o relatório terminava com uma lista honesta do que **não**
tinha sido feito. Esta feature zera essa lista.

| O que faltava | Por que eu tinha deixado |
|---|---|
| **UX-020** — sair da conta e cancelar pedido terminavam em silêncio | Confirmar no destino exigiria `searchParams` em rota cacheada |
| **Saudação do convidado** ficou neutra ("Vocês vêm?") ao tirar o rótulo privado | Usar os nomes exigiria mexer na consulta de `/rsvp/<slug>`, rota crítica |
| **Máscara do WhatsApp** | O `pattern` já barrava lixo; achei cosmético |
| **Sites com a paleta cruzada** | Repintar site publicado é decisão do dono |

O quarto item **não era uma pendência**: medido no site no ar, os dois sites publicados —
o casamento real e o de demonstração — têm a paleta **correta** (`ink: #3d4a36`,
`accent: #b8985f`). Eles nasceram fora do questionário, então nunca passaram pelo
preenchimento trocado. Os únicos sites afetados eram os meus, de teste. Não há o que
repintar, e não há decisão a tomar.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - O convidado é chamado pelo nome (Priority: P1)

Antônia abre o link que a família recebeu. A tela diz **"Antônia e José, vocês vêm?"** —
os nomes que o casal digitou ao cadastrar a família, não o apelido interno que o casal deu
ao grupo.

**Why this priority**: é o que devolve o calor perdido quando o rótulo privado saiu da
tela (UX-008), sem desfazer aquela correção.

**Acceptance Scenarios**:

1. **Given** um grupo com "Antônia Souza" e "José Souza", **When** o convidado abre
   `/rsvp/<slug>`, **Then** lê "Antônia e José, vocês vêm?".
2. **Given** um grupo de uma pessoa e um lugar, **When** ela abre a tela, **Then** lê
   "Antônia, você vem?" — no singular.
3. **Given** um grupo com quatro ou mais nomes, **When** alguém abre a tela, **Then** a
   saudação volta a ser neutra: uma lista de seis primeiros nomes num título não é carinho.
4. **Given** um grupo sem nomes cadastrados, **When** alguém abre a tela, **Then** lê
   "Vocês vêm?".
5. **Given** qualquer um desses casos, **When** a tela é montada, **Then** o **rótulo do
   grupo continua sem aparecer**.

---

### User Story 2 - Toda ação diz que aconteceu (Priority: P2)

O casal cancela um pedido e chega à lista com **"Pedido cancelado."** escrito. Sai da conta
e chega à vitrine com **"Vocês saíram da conta."**

**Acceptance Scenarios**:

1. **Given** um pedido cancelado, **When** a lista abre, **Then** a confirmação aparece.
2. **Given** a confirmação na tela, **When** a pessoa recarrega, **Then** ela **não** se
   repete — foi uma coisa que aconteceu uma vez.
3. **Given** as rotas envolvidas, **When** o build roda, **Then** nenhuma delas deixa de
   ser cacheada por causa da confirmação.

---

### User Story 3 - O número de WhatsApp se corrige na hora (Priority: P3)

**Acceptance Scenarios**:

1. **Given** o cadastro, **When** o casal digita `11999998888`, **Then** o campo mostra
   `(11) 99999-8888` enquanto digita.
2. **Given** um número de telefone fixo, **When** digitado, **Then** o hífen cai no lugar
   certo: `(11) 3888-7777`.
3. **Given** um número colado com `+55` e parênteses, **When** ele entra no campo, **Then**
   só os dígitos são considerados.

## Requirements *(mandatory)*

- **FR-001**: A tela de confirmação de presença MUST saudar pelos nomes das pessoas
  convidadas quando houver de um a três, e MUST permanecer neutra fora disso.
- **FR-002**: O tratamento MUST concordar com o número de lugares — "você vem" para um.
- **FR-003**: O rótulo do grupo MUST continuar fora de toda tela pública (não regredir
  UX-008).
- **FR-004**: Cancelar pedido e sair da conta MUST confirmar o que aconteceu na tela de
  destino, sem tornar nenhuma rota dinâmica.
- **FR-005**: A confirmação MUST desaparecer do endereço depois de lida.
- **FR-006**: O campo de WhatsApp MUST formatar enquanto o casal digita.

## Success Criteria *(mandatory)*

- **SC-001**: O convidado lê o próprio nome na tela de confirmação.
- **SC-002**: Nenhuma ação do casal termina sem dizer o que aconteceu.
- **SC-003**: `npm run build` continua marcando as rotas tocadas como cacheadas.

## Assumptions

- A segunda ida ao banco para buscar os nomes é aceitável numa rota cacheada por horas —
  e é mais barata que um `join`, que multiplicaria a linha do cabeçalho por convidado.
- Nenhuma migração de banco.
