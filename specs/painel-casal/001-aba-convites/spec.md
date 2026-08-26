# Spec 001 — E7: a aba Convites como lista de trabalho (área: painel-casal)

**Status:** Pronta para implementação — a pergunta em aberto tem padrão decidido em FR-003 (a coluna `CONVIDADOS` fica de fora) e não trava a implementação.

## Contexto

`Enlace - E Painel.dc.html`, artboard **E7** (`GET /conta/pedidos/:id/convites`),
desenha a aba em duas partes:

1. **Três cartões de número** no topo: `CONVITES` (4), `CONVIDADOS` (186),
   `CONFIRMARAM` (138, em `--ok`).
2. Uma **tabela** de cinco colunas
   (`1.6fr 1fr 1fr 130px 120px`): CONVITE · LINK · CONVIDADOS · STATUS ·
   ações. Cada linha traz o nome, o endereço em mono (`/c/familia-noiva`), a
   contagem (`64 · 58 ok`), a etiqueta (`Publicado` sólida em `--ok`,
   `Rascunho` em contorno) e, à direita, `Abrir` ou `Publicar` mais o × de
   apagar.

`app/conta/pedidos/[id]/convites/page.tsx` entrega outra coisa: uma grade de
miniaturas (`MiniConvite`) de 2 a 4 colunas, cada uma com o nome embaixo, mais
um cartão tracejado "Novo convite". Não há número nenhum, não há endereço, não
há estado, e publicar/despublicar só existe **dentro** do editor
(`PublicarConvite.tsx`).

A diferença é de função, não de estilo. A grade responde *"como ficaram?"*; a
tabela responde *"o que já está no ar e quem ainda não respondeu?"* — que é a
pergunta que o casal faz no mês do casamento, e a razão de a aba existir.

As três ações que a tabela precisa **já existem**: `criarConviteAction`,
`apagarConviteAction`, `publicarConviteAction` e `despublicarConviteAction`
em `app/actions/invite-actions.ts`. O que falta é a tela chamá-las de fora do
editor.

## Escopo

- `app/conta/pedidos/[id]/convites/page.tsx`: os três cartões e a tabela.
- Manter a miniatura como **coluna** da tabela, não como o item inteiro — ela
  é a única coisa que a grade fazia melhor.
- Ligar publicar/despublicar/apagar na própria listagem.

## Fora de escopo

- O editor visual (`/conta/convites/:id`) e tudo em
  `components/account/convite/`.
- O teto de 5 convites (`MAX_CONVITES`), que fica como está.
- A contagem por convite quando o convite **não tem grupo associado** — ver
  "Perguntas em aberto".

## Requisitos funcionais

- **FR-001:** No topo DEVEM aparecer três cartões `surface-raised`, em grade
  de 3 colunas a partir de 768px, cada um com rótulo em `meta` e número em
  `t-display` de 32px: `CONVITES` (total de linhas em `site_invites`),
  `CONVIDADOS` (soma de `groups.seats` do site) e `CONFIRMARAM` (soma de
  `groups.seats_confirmed`, tratando `null` como 0), este último em
  `--c-ok`.
- **FR-002:** `CONFIRMARAM` DEVE ler `groups.seats_confirmed` e **nunca**
  `guests.rsvp_status`. As duas fontes existem e as duas são verdade; a que o
  painel e as métricas leem é a primeira (`lib/repositories/siteMetrics.ts`),
  e misturar as duas numa tela nova criaria um terceiro número.
- **FR-003:** Abaixo, DEVE haver uma tabela com cabeçalho em `meta` e as
  colunas, nesta ordem: **(miniatura)**, `CONVITE`, `LINK`, `STATUS`, e uma
  coluna de ações sem rótulo. A coluna `CONVIDADOS` do artboard **fica de
  fora** — ver a pergunta em aberto: não existe chave ligando um convite a um
  grupo, e o número por linha teria de ser inventado.
- **FR-004:** A miniatura DEVE ser o `MiniConvite` já existente, em 48×60px,
  e o nome do convite DEVE ser um link para `/conta/convites/<id>`.
- **FR-005:** A coluna `LINK` DEVE mostrar `/c/<slug>` em `t-data` de 12,5px
  quando o convite estiver publicado, e a palavra `rascunho` em `--c-ink-3`
  quando não estiver — exatamente como o artboard.
- **FR-006:** A coluna `STATUS` DEVE usar `.etiqueta-noar` (sólida) com o
  texto `Publicado` para convite publicado, e `.etiqueta` com ponto cinza e o
  texto `Rascunho` para o resto.
- **FR-007:** A coluna de ações DEVE trazer, para convite publicado:
  `Abrir` (link para `/c/<slug>`, aba nova) e `Despublicar`. Para rascunho:
  `Publicar`. Nos dois casos, o × de apagar, que DEVE passar pelo
  `DialogoDestrutivo` — apagar convite publicado tira do ar um link que pode
  já estar no WhatsApp de gente.
- **FR-008:** O botão `+ Novo convite` DEVE sair da grade e ir para o
  cabeçalho da aba, à direita do título, como `.btn-ink`. Ele DEVE ficar
  `disabled` com o texto `Limite de {MAX_CONVITES} convites` quando o teto for
  atingido, em vez de sumir — sumir sem explicação é o que fazia o casal
  procurar o botão.
- **FR-009:** Com **zero** convites, a tabela NÃO renderiza; no lugar entra o
  `EstadoVazio` com a fórmula de Voz V4 (o que falta + o que aparece aqui +
  a ação), usando o texto do artboard I2: título `Nenhum convite criado`,
  apoio `Separe os convidados em grupos — família, amigos, trabalho. Cada
  grupo ganha um link próprio.`, botão `Criar convite`.
- **FR-010:** Abaixo de 768px a tabela DEVE virar uma pilha de cartões, cada
  um com miniatura + nome + etiqueta na primeira linha e o link na segunda — o mesmo desenho do artboard `CONVITES · MOBILE · 390`.
- **FR-011:** A aba NÃO PODE chamar `listGroupsWithGuests` duas vezes. O
  layout (`app/conta/pedidos/[id]/layout.tsx:145`) já faz essa consulta para
  montar os avisos; a página DEVE reaproveitar `carregarGerenciamento` +
  uma consulta única, em `Promise.all` com `listInvites`.
- **FR-012:** O texto de apoio do cabeçalho DEVE ser reescrito. Hoje ele diz
  *"Desenhem o convite de vocês e baixem em PNG, JPEG ou PDF para mandar no
  grupo da família"*, o que contradiz a decisão registrada no SDD §15.1:
  **o convite é uma página, não um arquivo** — o casal manda `/c/<slug>`. O
  download continua existindo, mas deixa de ser o assunto da frase.

## Critérios de aceite

- **SC-001:** Com 4 convites, 186 lugares e 138 confirmados, a aba mostra os
  três números exatos. Atende FR-001.
- **SC-002:** Alterar `guests.rsvp_status` de um convidado sem tocar em
  `groups.seats_confirmed` **não** muda o número de `CONFIRMARAM`. Atende
  FR-002.
- **SC-003:** A tabela tem 5 colunas e o cabeçalho contém `CONVITE`, `LINK` e
  `STATUS`, e **não** contém `CONVIDADOS`. Atende FR-003.
- **SC-004:** Um convite publicado mostra `/c/<slug>` e a etiqueta sólida
  `Publicado`; um rascunho mostra `rascunho` e a etiqueta de contorno.
  Atende FR-005 e FR-006.
- **SC-005:** Clicar em `Publicar` numa linha de rascunho chama
  `publicarConviteAction` e a linha passa a mostrar `/c/<slug>` sem sair da
  aba. Atende FR-007.
- **SC-006:** Clicar no × abre o `DialogoDestrutivo` com o botão escrito
  `Apagar convite`, e o foco vai para `Manter`. Atende FR-007.
- **SC-007:** Com `MAX_CONVITES` convites, o botão do cabeçalho está
  `disabled` e escrito `Limite de 5 convites`. Atende FR-008.
- **SC-008:** Com zero convites, `document.querySelector('table')` é `null` e
  o HTML contém `Nenhum convite criado`. Atende FR-009.
- **SC-009:** Em 390px, não há `<table>` visível e cada convite é um cartão.
  Atende FR-010.
- **SC-010:** A aba faz no máximo **duas** consultas ao banco além das do
  layout (medível pelo log de consultas em desenvolvimento). Atende FR-011.
- **SC-011:** O texto de apoio não contém `baixem em PNG, JPEG ou PDF`.
  Atende FR-012.
- **SC-012:** `npm run build`, `npm run lint` e `npm run test` passam.
- **SC-013:** A miniatura de cada linha é o `MiniConvite`, em 48×60px, e o nome ao lado é um `<a href="/conta/convites/<id>">`. Atende FR-004.

## Impacto em dados

Nenhum. Todos os números vêm de consultas que já existem
(`listInvites`, `listGroupsWithGuests`, `siteMetrics`).

## Referências

- Protótipo: `Enlace - E Painel.dc.html`, artboard **E7**
  (`GET /conta/pedidos/:id/convites` · `→ POST criarConvite · apagarConvite ·
  publicarConvite · despublicarConvite`), desktop 1440 e mobile 390.
  `Enlace - Primeira Vez.dc.html` I2, cartão `/convites` (o estado vazio).
- Versão atual: `app/conta/pedidos/[id]/convites/page.tsx` (grade de
  miniaturas), `components/account/convite/MiniConvite.tsx`,
  `components/account/convite/PublicarConvite.tsx` (publicar só dentro do
  editor), `app/actions/invite-actions.ts` (as quatro ações),
  `lib/repositories/siteInvites.ts`, `lib/repositories/groups.ts`
  (`listGroupsWithGuests`), `lib/repositories/siteMetrics.ts`.
- SDD do Enlace: §15.1 (o convite é uma página, não um arquivo), §6.2 (as
  duas fontes de verdade do RSVP — a razão de FR-002), §15.3 (as abas do
  painel).

## Dependências

- Depende de `specs/design-system/001-token-ink-3` (a palavra `rascunho` na
  coluna LINK usa `--c-ink-3`).
- Depende de `specs/design-system/003-dialogo` (o × de apagar).
- Não bloqueia nenhuma outra spec.

## Perguntas em aberto

1. **Convite e grupo de convidados são coisas separadas no banco, e a coluna
   `CONVIDADOS` da tabela assume que não são.** `site_invites` tem `doc`,
   `slug` e `published_at`; `groups` tem `seats` e `seats_confirmed`. **Não
   há chave ligando um convite a um grupo.** O artboard mostra "Família da
   noiva · /c/familia-noiva · 64 · 58 ok", tratando os dois como a mesma
   coisa.

   Enquanto a ligação não existir, FR-001 entrega os três números **do site
   inteiro** (que é informação verdadeira e útil) e a coluna `CONVIDADOS` da
   tabela fica **de fora**: mostrar um número por linha exigiria inventar a
   associação. Ligar os dois é migração aditiva (`site_invites.group_id`
   nullable, §13.1) **e** uma decisão de produto — "um convite serve um grupo"
   muda o significado de MAX_CONVITES=5 num casamento com 23 grupos.
   **Decisão do dono.**
