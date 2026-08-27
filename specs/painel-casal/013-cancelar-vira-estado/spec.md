# Spec 013 — Cancelar pedido vira estado, não `DELETE` (área: painel-casal)

**Status:** Pronta para implementação — com uma pergunta em aberto que **não**
trava os requisitos abaixo.

## Contexto

Esta spec não veio do protótipo. Veio da **decisão 11** do `specs/INDEX.md`,
levantada pela pergunta em aberto de
`specs/painel-admin/001-pedidos-como-tabela`: a pílula `Cancelados` do artboard
G4 não tem o que mostrar, e a razão é o modelo de dados.

`lib/orderStatus.ts` tem seis estados e **nenhum** é `cancelled`. Cancelar
chama `cancelarPedidoComSite`, que termina em `deleteOrder` — um
`DELETE FROM orders`. A linha some.

Três consequências, e nenhuma delas foi escolhida:

1. **A operação não consegue ver um pedido cancelado**, nem saber quantos
   foram. `painel-admin/002` entregou conversão (`pagos ÷ criados no mês`), e
   ela conta como "não convertido" um pedido que sumiu — sem saber dizer se ele
   foi cancelado, abandonado, ou se nunca existiu.
2. **Sites órfãos acumulam.** O `AGENTS.md` registra o efeito: *"Cancelar
   pedido órfã o site: `deleteOrder` apaga o pedido e `sites.order_id` é `set
   null`. Invisível (segue em `preview`), mas acumula."* Acontece sempre que o
   site **não** pode ser apagado junto — site já publicado, ou com convidados,
   que `cancelarPedidoComSite` protege de propósito.
3. **Contraria a regra 6 da §14 do SDD**, *"nada é apagado ou reescrito"*, e é
   a única exceção viva a ela no produto.

O que `cancelarPedidoComSite` já faz certo, e **não muda nesta spec**: site que
já esteve no ar não é apagado; site com convidados não é apagado (`groups` é
`onDelete: restrict`, porque cada grupo carrega o slug de `/rsvp/<slug>` que já
circulou no WhatsApp); presentes saem antes do site; objetos do Storage por
último, sem derrubar o cancelamento se falharem.

## Escopo

- Um sétimo valor em `ORDER_STATUSES`.
- `cancelarPedidoComSite` para de apagar a linha do pedido.
- A pílula `Cancelados` de `/admin/pedidos`.
- O que o casal vê depois de cancelar.

## Fora de escopo

- **A regra de quando o site é apagado.** Ela está certa e é delicada — mexer
  nela é outra spec, e não há motivo.
- Estorno. Cancelar só existe antes do pagamento (`canCancelOrder` barra `paid`
  e `published`); depois disso é conversa, não botão.
- Apagar a conta do casal, que é outro caminho e tem outra regra.

## Requisitos funcionais

- **FR-001:** `ORDER_STATUSES` DEVE ganhar `"cancelled"` como **último** valor.
  A ordem do array é a ordem real do fluxo, e cancelado não é uma etapa dele —
  entra no fim para não deslocar índice de nada que leia posição.
- **FR-002:** A migração DEVE ser `ALTER TYPE order_status ADD VALUE
  'cancelled'`, e nada mais. **Aditiva pura**: nenhuma linha existente muda,
  nenhum default muda, nenhuma coluna vira `NOT NULL`.
- **FR-003:** `TRACKER_STEPS` NÃO PODE incluir `cancelled`. O acompanhamento
  desenha o caminho até o site no ar; um pedido cancelado saiu do caminho.
- **FR-004:** `cancelarPedidoComSite` DEVE trocar `deleteOrder(orderId)` por
  uma escrita de status. A ordem das operações não muda: o pedido primeiro, o
  site e o Storage depois.
- **FR-005:** `deleteOrder` DEVE deixar de ser exportada, **ou** manter-se
  exportada com nenhum chamador. Ela é a única função do repositório que
  contraria a regra 6 da §14, e uma função assim viva e sem uso é um convite.
- **FR-006:** `canCancelOrder` DEVE devolver `false` para `cancelled`. Cancelar
  duas vezes não é operação.
- **FR-007:** O casal NÃO PODE continuar vendo o pedido cancelado na lista
  principal de `/conta/pedidos`. Ele pediu para sumir; a linha existir no banco
  é registro da operação, não conteúdo da tela dele.
- **FR-008:** `/admin/pedidos` DEVE ganhar a quarta pílula, `Cancelados`,
  mapeando para `["cancelled"]`. Ela sai do "fora de escopo" de
  `painel-admin/001` FR-001 — que a excluiu **porque** o estado não existia.
- **FR-009:** A `EtiquetaDoPedido` DEVE ter tom para `cancelled`: `.etiqueta`
  de contorno em `--c-ink-3`, com o texto `Cancelado`. Nunca `--c-danger`:
  cancelar é uma escolha do casal, não uma falha.
- **FR-010:** A conversão de `painel-admin/002` NÃO PODE mudar de fórmula.
  `criados` continua contando todo pedido do mês, cancelado incluído — um
  pedido que existiu e foi cancelado é exatamente o denominador que a taxa quer
  medir. O que muda é que agora ele é **visível**.
- **FR-011:** O site órfão NÃO PODE mais aparecer. Com o pedido preservado,
  `sites.order_id` continua apontando para ele — que é o que o `AGENTS.md`
  descreve como o defeito.

## Critérios de aceite

- **SC-001:** `ORDER_STATUSES` tem sete valores, com `cancelled` no fim, e
  `isOrderStatus("cancelled")` é verdadeiro. Atende FR-001.
- **SC-002:** A migração gerada contém `ADD VALUE` e **não** contém `DROP`,
  `DELETE`, `UPDATE` nem `ALTER COLUMN`. Atende FR-002.
- **SC-003:** `TRACKER_STEPS` continua com cinco passos. Atende FR-003.
- **SC-004:** Cancelar um pedido em `preview_ready` **sem** convidados deixa
  `orders.status = 'cancelled'` e apaga o site, como hoje. A linha do pedido
  continua no banco. Atende FR-004.
- **SC-005:** Cancelar um pedido cujo site tem convidados deixa o pedido em
  `cancelled` **e** `sites.order_id` apontando para ele — nenhum órfão. Atende
  FR-004 e FR-011.
- **SC-006:** `grep -rn "deleteOrder(" app/ lib/ components/` não devolve
  chamador nenhum. Atende FR-005.
- **SC-007:** `canCancelOrder("cancelled")` é `false`. Atende FR-006.
- **SC-008:** `/conta/pedidos` não lista o pedido cancelado. Atende FR-007.
- **SC-009:** `/admin/pedidos?estado=cancelados` lista só os `cancelled`, e a
  pílula fica ativa. Atende FR-008.
- **SC-010:** A etiqueta do pedido cancelado é de contorno em `--c-ink-3` com o
  texto `Cancelado`, e **não** usa `--c-danger`. Atende FR-009.
- **SC-011:** Com 10 pedidos criados no mês, 6 pagos e 2 cancelados, a conversão
  continua `60%`. Atende FR-010.
- **SC-012:** `npm run backup:full` rodado antes, com rollback escrito. Atende a
  regra 4 do `AGENTS.md`.
- **SC-013:** `npm run db:rehearse` passa antes do `db:migrate`, e
  `drizzle-kit push` **não** é usado em momento nenhum. Atende a regra 5.
- **SC-014:** `npm run build`, `npm run lint` e `npm run test` passam, com
  `publish.test.ts` e os testes de `orders` intactos.

## Impacto em dados

**Aditivo — e é a primeira migração de verdade de todo este trabalho.**

`ALTER TYPE order_status ADD VALUE 'cancelled'`. Nenhuma linha existente é
tocada: os pedidos de hoje continuam nos seis estados que já têm.

**O que ela NÃO recupera:** os pedidos já cancelados antes desta mudança. Eles
foram apagados e não voltam. A contagem de cancelados começa do zero no dia em
que isto entrar, e quem for comparar meses precisa saber disso.

**Rollback:** `ADD VALUE` de enum **não é reversível** no Postgres sem recriar o
tipo. Na prática o rollback é *não usar o valor* — nenhuma linha o recebe até o
código novo entrar. O plano escrito precisa dizer isso, em vez de prometer um
`DOWN` que não existe.

**Janela:** o `AGENTS.md` congela mudanças a partir de outubro, e o casamento é
16/10/2026. Esta migração toca `orders`, que o casamento legado **não** usa (ele
nasceu antes do fluxo de pedidos e tem `order_id` nulo) — mas o congelamento é
sobre o banco, não sobre a tabela. **Fazer antes de outubro, ou depois do
casamento.**

## Referências

- Origem: `specs/INDEX.md`, decisão 11; `specs/painel-admin/001`, pergunta 1.
- Versão atual: `lib/orderStatus.ts` (`ORDER_STATUSES`, `TRACKER_STEPS`,
  `canCancelOrder`), `lib/site/cancelOrder.ts` (`cancelarPedidoComSite`),
  `lib/repositories/orders.ts` (`deleteOrder`),
  `app/actions/account-actions.ts` (a action de cancelar),
  `app/admin/pedidos/page.tsx` (os três filtros),
  `components/ui/prensa/Etiqueta.tsx` (`EtiquetaDoPedido`),
  `lib/repositories/metricasDaOperacao.ts` (a conversão).
- SDD do Enlace: §14 decisão 6 (*"nada é apagado ou reescrito"*), §13.1
  (migração aditiva e a janela de congelamento).
- `AGENTS.md` §2 (o procedimento de migração) e "Pendências conhecidas" (o site
  órfão).

## Dependências

- Depende de `specs/painel-admin/001-pedidos-como-tabela`, já implementada: é a
  tela que ganha a quarta pílula.
- **Precede** nada. Mas destrava a pílula `Cancelados` do artboard G4, hoje
  registrada como divergência assumida.

## Perguntas em aberto

1. **O pedido cancelado desaparece da vista do casal, ou aparece esmaecido?**
   FR-007 escolhe desaparecer, e é o que menos surpreende: ele clicou em
   cancelar. Mas há um argumento do outro lado — um casal que cancelou por
   engano hoje não tem como saber que o pedido existiu, e uma linha esmaecida
   com "Cancelado em 12/09" seria o recibo daquele gesto.

   **A recomendação é FR-007 (desaparecer) agora**, porque é o comportamento de
   hoje e não muda nada para quem já usa. Mostrar é aditivo e pode vir depois,
   com dado real de quantos cancelamentos acontecem. **Não trava a spec.**
