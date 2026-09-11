# Feature Specification: O casal termina o questionário e recebe o site

**Feature Branch**: `001-ux-provisionamento-e-ambiente`

**Created**: 2026-09-11

**Status**: Draft

**Input**: Auditoria E2E de 11/09/2026 (`docs/auditoria/AUDITORIA-E2E.md`) — UX-001, UX-002,
UX-003, UX-005, UX-016 e UX-021.

## Contexto

Esta feature nasce de três problemas observados em uso real do site no ar, não de
hipótese. Os três têm a mesma origem: **o produto não sabe dizer em que endereço ele
próprio está publicado**, e essa ignorância derruba a página inteira em vez de degradar.

| UX-ID | O que o casal vê hoje |
|---|---|
| UX-001 🔴 | Responde 11 etapas, clica em "Criar nosso site", o site **não é criado** e a tela Início do painel responde **HTTP 500** |
| UX-002 🔴 | Clica em "Criar convite" e a página é substituída por *"This page couldn't load — A server error occurred"* |
| UX-003 🔴 | O site criado pela rede de segurança nasce **sem** cerimônia, festa e traje, e com a história substituída por uma anotação interna |
| UX-005 🟠 | Pede o QR do site publicado e recebe erro — inclusive no casamento real que já está no ar |
| UX-016 🟠 | Cadastra a família e não encontra link nenhum para mandar para ela — a célula "Endereço" mostra só um traço |
| UX-021 🟠 | Manda o link do site no WhatsApp e o cartão aparece sem foto, apontando para `localhost` — também no casamento real |

A UX-003 entrou nesta feature depois de um teste controlado (dois pedidos criados do zero
em ambiente sadio) que mostrou que o envio **copia** o conteúdo corretamente — e que a
perda acontece justamente quando o envio falha e o site é criado depois pela rota de
resgate. É o mesmo caminho que a UX-001 abre; consertar um sem o outro deixaria metade do
problema de pé.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - O site nasce ao fim do questionário (Priority: P1)

Um casal que nunca viu a plataforma cria a conta, responde o questionário e clica em
"Criar nosso site". A tela seguinte mostra o site deles existindo: prévia pronta, com
link para ver e abas para continuar montando. É exatamente o que a etapa 11 promete —
*"Ao enviar, o site é criado na hora e vocês já sobem as fotos"*.

**Why this priority**: sem isto não existe produto. É o clique que converte o
questionário em entrega, e hoje ele termina em tela de erro do navegador. Todo o resto
desta auditoria está atrás deste bloqueio.

**Independent Test**: criar uma conta nova no ambiente publicado, responder o
questionário (pode pular tudo que é opcional), enviar, e verificar que o pedido aparece
como "prévia pronta" e que o painel abre sem erro.

**Acceptance Scenarios**:

1. **Given** um pedido preenchido na etapa 11, **When** o casal clica em "Criar nosso
   site", **Then** o site é criado, o pedido passa a "prévia pronta" e o casal chega a
   uma tela do painel — nunca a uma tela de erro do navegador.
2. **Given** um pedido enviado cujo site, por qualquer motivo, não existe, **When** o
   casal abre a tela Início do painel, **Then** o sistema tenta criar o site de novo e,
   conseguindo, mostra o painel normalmente.
3. **Given** que a criação do site falha mesmo assim, **When** o casal chega ao painel,
   **Then** ele vê uma explicação em português, com o que fazer em seguida — e não um
   código de erro.
4. **Given** o painel aberto após o envio, **When** o casal olha o cabeçalho, **Then**
   lê "PRÉVIA PRONTA" e encontra o link para ver o site.
5. **Given** um pedido com cerimônia, festa, traje e história respondidos, **When** o
   site é criado — pelo envio **ou** pela rede de segurança —, **Then** a aba Conteúdo
   mostra todos esses campos preenchidos, e a história é a que o casal escreveu.

---

### User Story 2 - O casal cria o convite (Priority: P2)

O casal abre a aba Convites e clica em "Criar convite". O editor abre e ele monta o
cartão que vai mandar no grupo da família.

**Why this priority**: o convite digital é o produto inteiro do pacote de R$ 9,90 e a
porta de entrada da confirmação de presença nos outros dois. Hoje o clique derruba a
página com um erro em inglês.

**Independent Test**: com um pedido já provisionado, abrir a aba Convites no ambiente
publicado e clicar em "Criar convite".

**Acceptance Scenarios**:

1. **Given** um pedido com site provisionado, **When** o casal clica em "Criar convite",
   **Then** o editor de convite abre com o convite criado.
2. **Given** o convite aberto, **When** o casal olha o rodapé do editor, **Then** o
   endereço do site aparece com o domínio real do ambiente — nunca `localhost`.

---

### User Story 3 - O QR do site publicado pode ser impresso (Priority: P3)

O casal com o site no ar pede o QR do endereço para levar à gráfica.

**Why this priority**: é o único dos três que atinge cliente que **já pagou** — o
casamento real publicado devolve erro hoje. Fica em P3 porque é o de menor volume: só
quem já publicou chega nele.

**Independent Test**: pedir o QR de um site publicado no ambiente publicado e conferir
que volta uma imagem.

**Acceptance Scenarios**:

1. **Given** um site publicado, **When** alguém pede o QR dele, **Then** recebe a imagem
   do QR apontando para o endereço público real do site.
2. **Given** um site em prévia ou um endereço que não existe, **When** alguém pede o QR,
   **Then** recebe "não encontrado" — e não um erro de servidor.

---

### Edge Cases

- **O endereço público muda** (hoje `casamentoweb-ten.vercel.app`, amanhã
  `enlace.com.br`): o produto continua funcionando sem alteração de código.
- **Ambiente de pré-visualização** com endereço gerado automaticamente e diferente a cada
  publicação: o produto continua funcionando.
- **Alguém forja o cabeçalho de host** tentando fazer o produto gerar links para um
  domínio de terceiros: o produto **não** aceita — é a proteção que a regra atual existe
  para dar, e ela não pode ser afrouxada por esta feature.
- **O endereço base é genuinamente indeterminável**: uma tela que só *exibe* um link
  mostra o que consegue e explica o resto; ela não pode deixar de abrir.
- **Duas abas abertas** disparando a criação do site ao mesmo tempo: continua existindo
  no máximo um site por pedido.
- **Endereço configurado com barra no fim** (`https://exemplo.com/`): os links gerados
  não saem com barra dupla.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** (resolve UX-001): Ao enviar o pedido, o sistema MUST criar o site do casal e
  deixar o pedido em "prévia pronta", em qualquer ambiente publicado, **sem depender de
  nenhuma variável de ambiente ter sido configurada à mão**.
  *Aceite no navegador*: criar conta nova em produção, enviar o questionário, e ver o
  cabeçalho do pedido em "PRÉVIA PRONTA" com o link da prévia funcionando.

- **FR-002** (resolve UX-001): O sistema MUST descobrir sozinho o endereço público em que
  está rodando, em produção, em pré-visualização e em desenvolvimento, nesta ordem de
  preferência: endereço configurado explicitamente → endereço informado pela plataforma
  de hospedagem → endereço da própria requisição, quando confiável.
  *Aceite no navegador*: nenhum link gerado pelo produto em produção aponta para
  `localhost`, e nenhuma tela falha por falta de configuração.

- **FR-003** (resolve UX-001, UX-002, UX-005): Uma tela ou rota que precise apenas
  **exibir** um endereço MUST continuar abrindo quando o endereço base não puder ser
  determinado. Falta de endereço base MUST NOT produzir erro de servidor.
  *Aceite no navegador*: com o endereço base indisponível, a tela Início, a aba Convites
  e a aba Compartilhar abrem, cada uma explicando o que não pôde ser mostrado.

- **FR-004** (resolve UX-001): Quando a criação do site falhar, o casal MUST ver uma tela
  em português dizendo o que aconteceu e o que fazer, com um caminho de volta — nunca a
  tela de erro do navegador nem um código de erro.
  *Aceite no navegador*: forçar a falha e confirmar que a tela resultante é da Enlace,
  em português, com ação possível.

- **FR-005** (resolve UX-002): Criar um convite MUST funcionar no ambiente publicado, e o
  endereço mostrado no convite MUST ser o endereço público real do site.
  *Aceite no navegador*: clicar em "Criar convite" em produção e ver o editor abrir.

- **FR-006** (resolve UX-005): O QR de um site publicado MUST ser gerado e apontar para o
  endereço público real. Site em prévia ou inexistente MUST continuar respondendo "não
  encontrado".
  *Aceite no navegador*: abrir o endereço do QR de um site publicado e ver a imagem;
  abrir o de um site em prévia e ver "não encontrado".

- **FR-007** (proteção existente, não pode regredir): A descoberta do endereço MUST
  recusar endereço derivado de cabeçalho de host não confiável, para que links de
  pagamento e de convite nunca apontem para domínio de terceiros.
  *Aceite*: requisição com host forjado não produz link com esse host.

- **FR-008** (resolve UX-002): Nenhuma falha inesperada MUST apresentar ao casal texto em
  inglês. O produto MUST ter uma tela de erro própria, em português, na voz da Enlace.
  *Aceite no navegador*: provocar uma falha e ler a tela resultante em português.

- **FR-013** (resolve UX-016): Com o site provisionado, o casal MUST conseguir obter o
  endereço de confirmação de cada família — **vendo** o endereço e podendo copiá-lo.
  *Aceite no navegador*: na aba Convidados em produção, a coluna "Endereço" mostra o
  endereço da família e o botão de copiar funciona.

- **FR-012** (resolve UX-021): Todo endereço que o produto **mostra ou envia** — o cartão
  de compartilhamento do site, o endereço exibido no painel, os links dos e-mails — MUST
  usar o endereço público real do ambiente. `localhost` MUST NOT aparecer fora do
  desenvolvimento.
  *Aceite no navegador*: ler as etiquetas de compartilhamento de um site publicado em
  produção e encontrar o domínio real; conferir que o painel mostra esse mesmo domínio.

- **FR-009** (resolve UX-003): O site MUST nascer com **todo** o conteúdo respondido no
  questionário — local, endereço e horário da cerimônia, local, endereço e horário da
  festa, traje e história —, **por qualquer um dos caminhos** que o criam.
  *Aceite no navegador*: responder o questionário completo, enviar, abrir a aba Conteúdo e
  encontrar todos os campos preenchidos; repetir forçando o caminho da rede de segurança e
  obter o mesmo resultado.

- **FR-010** (resolve UX-003): A história publicada no site MUST ser a resposta de "a
  história de vocês". A resposta de "mais alguma coisa que a gente precisa saber?" MUST
  NOT aparecer no site.
  *Aceite no navegador*: preencher as duas caixas com textos distintos e confirmar qual
  aparece na aba Conteúdo e no site.

- **FR-011** (resolve UX-003): Montar um link MUST NOT ser pré-requisito para gravar o
  conteúdo do casal. Uma falha ao descobrir o endereço base MUST NOT impedir que o site
  seja criado nem que o conteúdo seja salvo.
  *Aceite*: com a descoberta de endereço falhando, o site ainda nasce com o conteúdo.

### Key Entities

- **Pedido**: o questionário respondido pelo casal. Tem um estado que vai de rascunho a
  "recebido" e a "prévia pronta".
- **Site**: o casamento gerado a partir do pedido. Um pedido tem no máximo um site.
- **Endereço base**: o endereço público em que o produto está sendo servido. É o que
  transforma um caminho interno em link que o casal pode mandar para alguém.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos pedidos enviados resultam em site criado — verificado em, no
  mínimo, 2 pedidos novos criados do zero no ambiente publicado.
- **SC-002**: O casal vai da última etapa do questionário até o painel **sem ver nenhuma
  tela de erro**, em desktop e em celular.
- **SC-003**: Criar um convite funciona na primeira tentativa, sem erro.
- **SC-004**: O QR de um site publicado devolve imagem — incluindo o do casamento que já
  está no ar hoje.
- **SC-005**: Nenhuma tela do produto mostra ao casal texto em inglês.
- **SC-006**: Trocar o endereço público do produto não exige alteração de código.
- **SC-007**: 100% dos campos respondidos no questionário aparecem preenchidos na aba
  Conteúdo logo após o envio — verificado campo a campo em pedido novo.
- **SC-009**: O casal consegue copiar o link de confirmação de uma família recém-cadastrada
  na primeira tentativa.
- **SC-008**: Nenhum endereço mostrado ou enviado pelo produto em produção contém
  `localhost` — verificado nas etiquetas de compartilhamento de um site publicado.

## Assumptions

- O produto é hospedado numa plataforma que informa ao próprio aplicativo, em tempo de
  execução, qual é o domínio de produção e o da publicação atual. (Vercel expõe
  `VERCEL_PROJECT_PRODUCTION_URL` e `VERCEL_URL`; a feature deve usar o que existir e não
  quebrar onde não existir.)
- Definir o endereço explicitamente continua sendo o caminho preferencial e recomendado —
  a feature apenas deixa de **depender** disso para funcionar.
- A allowlist de hosts continua existindo como proteção contra host forjado; esta feature
  a estende, não a remove.
- A auditoria já provou que o provisionamento em si funciona: rodado contra o mesmo banco
  a partir de um ambiente com o endereço configurado, o site nasce **com o conteúdo do
  questionário**. O defeito está na descoberta do endereço e no caminho de resgate, não na
  criação do site nem na cópia do conteúdo pelo envio.
- Nenhuma migração de banco é necessária.
