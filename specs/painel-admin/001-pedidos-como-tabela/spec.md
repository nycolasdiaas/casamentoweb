# Spec 001 — G4: `/admin/pedidos` como tabela com filtros e busca (área: painel-admin)

**Status:** Pronta para implementação

## Contexto

`Enlace - G Admin.dc.html`, artboard **G4** (`GET /admin/pedidos`), desenha a
tela de operação:

- uma linha de **filtros** em pílulas: `Todos · 312` (ativa, em `--mark`),
  `No ar`, `Prévia`, `Cancelados`;
- um campo de **busca** de 260px: `Buscar por casal, e-mail, #pedido…`;
- uma **tabela** de sete colunas
  (`110px 1.4fr 1.2fr 1fr 120px 130px 80px`): PEDIDO · CASAL · E-MAIL ·
  PACOTE · VALOR · STATUS · (ação `Editar`), com linhas alternadas
  (`#16181b` / transparente) e a etiqueta de status em cada uma.

`app/admin/pedidos/page.tsx` entrega outra coisa: `OrderCard` empilhado em
três seções (`Em andamento`, `No ar`, `Rascunhos`), sem filtro, sem busca e
sem tabela. Cada cartão traz o pedido inteiro aberto — incluindo, no topo da
página, um `<details>` com o **prompt de LLM** e o `SITE_BUILD_PROMPT`
completo em `<pre>`.

Esse `<details>` é resíduo do fluxo antigo. O SDD §1.1 descreve o gargalo que
ele servia: *"o admin abre `/admin/pedidos`, copia um prompt + JSON, cola num
LLM, recebe o código de um site novo, hospeda em algum lugar à mão"*. A §3
rejeitou esse caminho, a §7 automatizou o provisionamento, e
`regras-de-negocio.md` §7 lista "LLM gerando código por casal" entre as
decisões descartadas. O prompt continua na tela.

A tabela importa porque `/admin` é **exceção, não operação**
(`regras-de-negocio.md` §3): quem entra ali está procurando **um** pedido
específico para socorrer. Cartões empilhados servem para navegar; tabela com
busca serve para encontrar.

## Escopo

- `app/admin/pedidos/page.tsx`: filtros, busca e tabela.
- O que acontece com o `OrderCard` (vira o detalhe de uma linha, não some).
- Remoção do `<details>` do prompt de LLM.

## Fora de escopo

- `AdminOrderControls.tsx` e as ações de admin sobre o pedido, que continuam
  como estão.
- `lib/buildPrompt.ts`, que sai da **tela** mas não é apagado nesta spec —
  ver "Perguntas em aberto".
- Auditoria e reembolso, que o `README.md` do pacote lista em §5 como "o que
  ainda não existe" no próprio protótipo.

## Requisitos funcionais

- **FR-001:** No topo DEVE haver **três** pílulas de filtro, nesta ordem:
  `Todos · {n}`, `No ar`, `Prévia`. A ativa DEVE ter fundo `var(--c-mark)` e
  texto branco; as demais, contorno `var(--c-rule)`. A quarta pílula do
  artboard (`Cancelados`) **fica de fora** — ver a pergunta em aberto: o
  produto não tem estado `cancelled`, e cancelar apaga a linha.
- **FR-002:** O filtro DEVE viajar pela URL (`?estado=`), não por estado de
  cliente. É o que permite ao operador guardar `/admin/pedidos?estado=previa`
  e voltar direto.
- **FR-003:** Os três filtros DEVEM mapear para `OrderStatus`
  (`lib/orderStatus.ts`) assim: `todos` → os seis estados; `no-ar` →
  `published`; `previa` → `preview_ready` **e** `paid` (os dois são "prévia
  pronta, ainda não no ar" do ponto de vista da operação). `draft`,
  `submitted` e `in_production` aparecem só em `todos`.
- **FR-003b:** `?estado=` com valor fora dos três DEVE cair em `todos`, com
  HTTP 200 — nunca erro. Inclui `?estado=cancelados`, que pode chegar de um
  link guardado.
- **FR-004:** À direita DEVE haver um campo de busca com `placeholder`
  `Buscar por casal, e-mail, #pedido…`, que filtra por
  `orders.coupleNames`, `users.email` e o prefixo do `orders.id`, sem
  diferenciar maiúscula nem acento.
- **FR-005:** A busca DEVE viajar pela URL (`?q=`) e ser aplicada **no
  servidor**, na consulta. Filtrar em memória com 312 pedidos funciona; com
  3.000, não.
- **FR-006:** A busca por `#pedido` DEVE aceitar tanto `#4821` quanto `4821`
  quanto os 8 primeiros caracteres do uuid — é o que o operador tem à mão,
  vindo de um e-mail ou de um print do casal.
- **FR-007:** A tabela DEVE ter as sete colunas do artboard: `PEDIDO`,
  `CASAL`, `E-MAIL`, `PACOTE`, `VALOR`, `STATUS` e uma coluna de ação sem
  rótulo, com o cabeçalho em `meta` e `background: var(--c-surface)`.
- **FR-008:** `PEDIDO` DEVE mostrar `#` + os 4 primeiros caracteres do uuid em
  `t-data`. `VALOR` DEVE usar `formatPriceCents`. `STATUS` DEVE usar
  `EtiquetaDoPedido`, que já existe e já mapeia os seis estados.
- **FR-009:** A ação de cada linha DEVE ser `Editar`, expandindo o
  `OrderCard` **abaixo da linha** (uma `<tr>` extra), em vez de navegar. O
  operador que está comparando três pedidos não pode perder a lista a cada
  clique.
- **FR-010:** O `<details>` com `SITE_BUILD_PROMPT` DEVE ser removido da
  tela. O provisionamento é automático desde a Fase 3 (SDD §7) e a instrução
  na tela contradiz o produto: ela ensina o operador a montar site à mão.
- **FR-011:** Com zero pedidos no filtro atual, a tabela NÃO renderiza; entra
  um `EstadoVazio` com o texto do filtro
  (`Nenhum pedido no ar agora.` / `Nenhum pedido em prévia agora.`) e um link
  `Ver todos os pedidos`.
- **FR-012:** Abaixo de 1024px a tabela DEVE virar pilha de cartões — as sete
  colunas do artboard não cabem, e o artboard `PEDIDOS · MOBILE · 390` desenha
  exatamente essa pilha.
- **FR-013:** A tela NÃO PODE deixar de ser dinâmica nem sair do `<Suspense>`
  do `app/admin/layout.tsx`. Todo `/admin` lê sessão e banco; com
  `cacheComponents: true`, leitura não cacheada fora de limite reprova o build
  (SDD §3.2).
- **FR-014:** A busca e o filtro NÃO PODEM ser lidos fora de um limite de
  `<Suspense>` — `searchParams` sem `<Suspense>` é a armadilha que a regra de
  lint `eslint-rules/searchparams-em-suspense.mjs` deste repositório existe
  para pegar.

## Critérios de aceite

- **SC-001:** `/admin/pedidos` mostra três pílulas, com `Todos · {n}` ativa e
  o número igual ao total de pedidos, e **nenhuma** escrita `Cancelados`.
  Atende FR-001.
- **SC-002:** `/admin/pedidos?estado=no-ar` mostra só pedidos `published`, e a
  pílula `No ar` está ativa. Atende FR-002 e FR-003.
- **SC-003:** `/admin/pedidos?estado=previa` mostra pedidos `preview_ready` e
  `paid`, e nenhum `published`. Atende FR-003.
- **SC-004:** `?q=ana` devolve os pedidos cujo `coupleNames` ou `email`
  contêm "ana", sem diferenciar acento (`Ana`, `ANA`, `Aná`). Atende FR-004 e
  FR-005.
- **SC-005:** `?q=4821` e `?q=%234821` devolvem o mesmo pedido. Atende FR-006.
- **SC-006:** A tabela tem 7 colunas e o cabeçalho contém `PEDIDO`, `CASAL`,
  `E-MAIL`, `PACOTE`, `VALOR` e `STATUS`. Atende FR-007.
- **SC-007:** Um pedido de R$ 99,90 mostra `R$ 99,90` e a etiqueta `No ar`
  sólida. Atende FR-008.
- **SC-008:** Clicar em `Editar` abre o `OrderCard` sob a linha e
  `location.pathname` não muda. Atende FR-009.
- **SC-009:** `grep -c "SITE_BUILD_PROMPT\|buildFullPrompt" app/admin/pedidos/page.tsx`
  devolve `0`. Atende FR-010.
- **SC-010:** `/admin/pedidos?estado=cancelados` responde 200 e mostra todos
  os pedidos, com a pílula `Todos` ativa. Atende FR-003b.
- **SC-010b:** `/admin/pedidos?estado=no-ar` sem nenhum pedido publicado
  mostra `Nenhum pedido no ar agora.` e o link `Ver todos os pedidos`. Atende
  FR-011.
- **SC-011:** Em 390px não há `<table>` visível. Atende FR-012.
- **SC-012:** `npm run build` passa — nenhum "Uncached data was accessed
  outside of `<Suspense>`" e nenhum erro da regra de lint local. Atende FR-013
  e FR-014.
- **SC-013:** `npm run lint` e `npm run test` passam.

## Impacto em dados

Nenhum. `listOrdersWithUsers` já existe em `lib/repositories/orders.ts`; a
busca e o filtro entram como argumentos dela.

## Referências

- Protótipo: `Enlace - G Admin.dc.html`, artboard **G4**
  (`GET /admin/pedidos` · `→ POST saveOrderAdminAction`), desktop 1440 com a
  tabela de 7 colunas e mobile 390 com a pilha.
- Versão atual: `app/admin/pedidos/page.tsx` (cartões em três seções e o
  `<details>` do prompt), `components/admin/OrderCard.tsx`,
  `components/admin/AdminOrderControls.tsx`,
  `lib/repositories/orders.ts` (`listOrdersWithUsers`),
  `lib/orderStatus.ts`, `components/ui/prensa/Etiqueta.tsx`
  (`EtiquetaDoPedido`), `lib/buildPrompt.ts`,
  `eslint-rules/searchparams-em-suspense.mjs`.
- SDD do Enlace: §1.1 (o gargalo que o prompt servia), §3 (a rejeição do LLM
  gerando código), §7 (o provisionamento automático), §3.2 (`cacheComponents`
  e os limites de `<Suspense>`).
- Regras de negócio: §3 (*"o `/admin` existe para exceção, não para operação.
  Se ele virar rotina, o princípio 2.1 já foi quebrado"*), §7 (LLM por casal
  descartado).

## Dependências

- Depende de `specs/design-system/001-token-ink-3`.
- Não bloqueia nenhuma outra spec.

## Perguntas em aberto

1. **A pílula `Cancelados` do artboard não tem o que mostrar, e a razão é do
   modelo de dados.** `lib/orderStatus.ts` tem seis estados e **nenhum** é
   `cancelled`: cancelar um pedido chama `deleteOrder`, que **apaga a linha**.
   O `AGENTS.md` registra o efeito colateral: *"Cancelar pedido órfã o site:
   `deleteOrder` apaga o pedido e `sites.order_id` é `set null`. Invisível
   (segue em `preview`), mas acumula."*

   Ou seja: hoje a operação **não consegue ver** um pedido cancelado, nem
   saber quantos foram. Duas saídas, e a escolha é do dono:

   - **Opção A — deixar como está.** A pílula fica fora (FR-001), e a
     divergência é registrada. Custo zero.
   - **Opção B — cancelar passa a ser um estado, não um `DELETE`.** Um sétimo
     valor em `ORDER_STATUSES` (`cancelled`) e `deleteOrder` vira
     `cancelOrder`, que só muda o status. Isso **corrige de passagem o site
     órfão** que o `AGENTS.md` descreve, e alinha com a regra do projeto de
     que nada é apagado (SDD §14, decisão 6: *"Nada é apagado ou
     reescrito"*). É migração aditiva de enum e mudança de comportamento de
     uma ação existente — **não cabe nesta spec**, e merece spec própria na
     área `painel-casal` (é lá que o casal cancela).

   **A recomendação é a Opção B, em spec separada**, porque o `DELETE` de
   pedido é uma exceção à regra 6 do próprio SDD e já produz lixo conhecido.

2. **`lib/buildPrompt.ts` (139 linhas) sai da tela — deve sair do
   repositório?** O SDD §7.1 dá a ele um destino: *"O investimento em
   `buildPrompt.ts` não se perde — muda de alvo. Em vez de gerar código, o LLM
   gera um `ThemeSpec` + sugestões de texto"* — a Fase 6, opcional, que §15.5
   registra como "nunca começou".

   Apagar agora joga fora a base de uma fase planejada; manter deixa 139
   linhas de código morto que descrevem um fluxo abandonado. **A recomendação
   é manter o arquivo e tirar da tela** (que é o que FR-010 faz), com um
   comentário no topo apontando para §7.1. Apagar é decisão do dono.
