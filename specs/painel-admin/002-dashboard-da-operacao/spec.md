# Spec 002 — G3: o dashboard da operação, e o destino das telas do casamento legado (área: painel-admin)

**Status:** Bloqueada (ver Perguntas em aberto)

## Contexto

O protótipo e o produto usam os mesmos dois endereços para coisas
**diferentes**. Não é uma divergência de layout: é uma divergência de
significado.

| Endereço | O que o protótipo desenha | O que o produto entrega |
|---|---|---|
| `/admin` | **G2** · "Grupos e permissões" — cartões de grupos de acesso da equipe (Equipe Enlace, Suporte, Financeiro), com avatares de membros e botão de criar grupo | "Gerenciar convidados" — os **grupos de convidados do casamento legado**, via `getLegacySiteId()` |
| `/admin/dashboard` | **G3** · o painel da operação — `PEDIDOS · MÊS 312`, `RECEITA R$ 21k`, `SITES NO AR 1.284`, `CONVERSÃO 63%`, barras dos últimos 14 dias e distribuição por pacote | `RsvpDashboard` — as **confirmações do casamento legado** |

A barra de navegação do produto (`AdminNav.tsx:30-34`) é honesta sobre isso:
o quarto item se chama **Convidados**, não "Grupos". O protótipo chama
"Grupos". São dois produtos diferentes no mesmo lugar.

O que o produto tem hoje em `/admin` e `/admin/dashboard` é a operação do
**primeiro casamento** — 23 grupos, 31 convidados, 23 confirmações, casamento
em 16/10/2026 (SDD §6.2). Elas nasceram antes da multi-tenancy e funcionam:
`listGroupsWithGuests(await getLegacySiteId())` é escopado por site, e o site
é o legado, fixo.

`regras-de-negocio.md` §3 diz o que o `/admin` deve ser: *"O dono define
preço, pacotes e estilos. **Olha métricas.** Socorre um caso raro"* — e
*"o `/admin` existe para exceção, não para operação"*. As duas telas atuais
são operação de **um** casamento; o dashboard do protótipo é a métrica que o
dono não tem.

E os dados existem. `site_events` coleta desde a Fase 0 (SDD §6.1), `orders`
tem status, pacote e valor, `sites` tem `status` e `published_at`.

## Escopo

*Congelado até a decisão da pergunta em aberto.*

- O dashboard da operação em `/admin/dashboard`.
- Para onde vão as telas do casamento legado.
- A barra de navegação depois da mudança.

## Fora de escopo

- **G2 (grupos e permissões da equipe)**, que é
  `specs/painel-admin/004` e depende de um modelo de permissão que não existe.
- `/admin/pedidos` — `specs/painel-admin/001`.
- `/admin/presentes` — `specs/painel-admin/003`.
- O roll-up diário em `site_daily_stats`, que continua sem escritor
  (SDD §15.5) — ver "Perguntas em aberto", item 3.

## Requisitos funcionais

*Escritos para a Opção A da pergunta em aberto (mover o legado, dar o
endereço ao dashboard).*

- **FR-001:** `/admin/dashboard` DEVE mostrar quatro cartões de número, em
  grade de 4 colunas a partir de 1024px, cada um com rótulo em `meta` e valor
  em `t-display` de 42px:
  1. `PEDIDOS · MÊS` — pedidos com `created_at` no mês corrente;
  2. `RECEITA` — soma de `price_cents` dos pedidos que chegaram a `paid` ou
     `published` no mês, formatada como `R$ 21k` (milhar abreviado);
  3. `SITES NO AR` — total de `sites` com `status = 'published'`
     (acumulado, não do mês);
  4. `CONVERSÃO` — pedidos que chegaram a `paid`/`published` no mês dividido
     por pedidos criados no mês, em %.
- **FR-002:** Cada cartão DEVE trazer a comparação com o mês anterior em
  12,5px, verde (`--c-ok`) quando subiu e vermelho (`--c-danger`) quando
  caiu, no formato `+18% vs. ago`. `SITES NO AR` é acumulado e leva
  `acumulado` em `--c-ink-2` no lugar da comparação.
- **FR-003:** `RECEITA` DEVE somar **apenas** o valor dos pacotes
  (`orders.price_cents`). **Nunca** o valor de presentes — o Pix do presente
  vai direto para o casal e nunca é receita da Enlace
  (`regras-de-negocio.md` §2.4).
- **FR-004:** DEVE haver um gráfico de barras dos **últimos 14 dias** de
  pedidos criados, ocupando 1,5 fração da largura, com as barras em
  `#454b52` e as duas maiores em `var(--c-mark)`.
- **FR-005:** DEVE haver um bloco `POR PACOTE` com três barras de proporção
  (nome, %, trilho de 6px), lendo `orders.package_tier` do mês.
- **FR-006:** O título da tela DEVE ser o mês corrente por extenso e o ano
  (`Setembro 2026`), em `t-display` de 34px, com `atualizado agora` em `meta`
  à direita.
- **FR-007:** As telas do casamento legado (`GroupForm` + `GroupList` e
  `RsvpDashboard`) NÃO PODEM ser apagadas. Elas operam um casamento real com
  23 confirmações e 31 convidados, e o `AGENTS.md` §2 e o SDD §6.2 são
  literais sobre o que não se toca ali.
- **FR-008:** As duas DEVEM passar a viver sob `/admin/casamento` e
  `/admin/casamento/confirmacoes`, com a barra ganhando o item `Casamento` no
  lugar de `Convidados`.
- **FR-009:** `/admin` DEVE redirecionar (307, temporário) para
  `/admin/dashboard` enquanto G2 não existir. Deixar `/admin` respondendo a
  antiga tela de convidados depois da mudança seria manter dois endereços para
  a mesma coisa.
- **FR-010:** Nenhuma consulta do dashboard pode ler dado de convidado.
  Métrica de operação lê `orders`, `sites` e `site_events` — todas escopadas
  por site ou globais por natureza. `guests` e `groups` não entram.
- **FR-011:** A tela DEVE ficar dentro do `<Suspense>` do
  `app/admin/layout.tsx` e continuar dinâmica (SDD §3.2).

## Critérios de aceite

- **SC-001:** `/admin/dashboard` mostra quatro cartões com os rótulos exatos
  de FR-001. Atende FR-001.
- **SC-002:** Criar um pedido de R$ 99,90 e movê-lo para `paid` aumenta
  `RECEITA` em `R$ 99,90`; registrar uma contribuição de presente de R$ 250
  **não** muda `RECEITA`. Atende FR-003.
- **SC-003:** Com 10 pedidos criados no mês e 6 pagos, `CONVERSÃO` mostra
  `60%`. Atende FR-001.
- **SC-004:** O gráfico tem exatamente 14 barras. Atende FR-004.
- **SC-005:** O bloco `POR PACOTE` soma 100% entre os três. Atende FR-005.
- **SC-006:** `/admin/casamento` mostra `GroupList` com os 23 grupos, e
  `/admin/casamento/confirmacoes` mostra o `RsvpDashboard` com as 23
  confirmações. Nenhum dado mudou. Atende FR-007 e FR-008.
- **SC-007:** `curl -sI /admin` devolve `307` com destino
  `/admin/dashboard`. Atende FR-009.
- **SC-008:** `grep -c "listGroupsWithGuests\|guests" app/admin/dashboard/page.tsx`
  devolve `0`. Atende FR-010.
- **SC-009:** `npm run build` passa sem "Uncached data outside `<Suspense>`".
  Atende FR-011.
- **SC-010:** As contagens do banco continuam intactas depois da mudança: 23
  grupos, 31 convidados, 23 confirmações em `guests.rsvp_status`, 23 em
  `groups.seats_confirmed` (SDD §13.1, passo 3 — "Verificar").
- **SC-011:** `npm run lint` e `npm run test` passam.
- **SC-012:** Com 10 pedidos no mês e 8 no anterior, o cartão `PEDIDOS · MÊS` mostra `+25% vs. {mês anterior abreviado}` em `--c-ok`; com 6, mostra `−25%` em `--c-danger`. O cartão `SITES NO AR` mostra `acumulado`. Atende FR-002.
- **SC-013:** Em setembro de 2026, o título é `Setembro 2026` em `t-display` de 34px, com `atualizado agora` em `meta` à direita. Atende FR-006.

## Impacto em dados

**Nenhuma migração, nenhum dado movido.** As telas do legado mudam de
**endereço**, não de consulta: `getLegacySiteId()` continua o mesmo e
`listGroupsWithGuests` continua sendo chamada com o mesmo argumento.

O dashboard só **lê**: `orders`, `sites` e (se necessário) `site_events`.

## Referências

- Protótipo: `Enlace - G Admin.dc.html`, artboards **G3**
  (`GET /admin/dashboard` · desktop 1440 e mobile 390) e **G2**
  (`GET /admin` · `→ POST createGroupAction · deleteGroupAction`).
- Versão atual: `app/admin/dashboard/page.tsx` (`RsvpDashboard` do legado),
  `app/admin/page.tsx` (`GroupForm` + `GroupList` do legado),
  `components/admin/AdminNav.tsx:30-34` (os quatro itens, com `Convidados`),
  `lib/repositories/sites.ts` (`getLegacySiteId`),
  `lib/repositories/orders.ts`, `lib/db/schema.ts` (`siteEvents`,
  `siteDailyStats`).
- SDD do Enlace: §6.1 (as métricas que `site_events` coleta e as perguntas de
  produto que elas respondem), §6.2 (o casamento real e o que não se toca),
  §13 (métricas de sucesso), §15.5 (o roll-up diário que não existe),
  §3.2 (`cacheComponents`).
- Regras de negócio: §3 (*"o dono olha métricas"*, *"o `/admin` existe para
  exceção"*), §2.4 (o presente nunca é receita da Enlace).

## Dependências

- Depende de `specs/design-system/001-token-ink-3`.
- **Precede** `specs/painel-admin/004` (G2 · grupos e permissões): sem mover o
  legado para fora de `/admin`, G2 não tem endereço.

## Perguntas em aberto

1. **O casamento legado deve sair de `/admin` e `/admin/dashboard`?** É a
   decisão que destrava tudo nesta área, e ela é do dono porque envolve a
   operação de um casamento a menos de dois meses de distância (16/10/2026).

   - **Opção A — mover para `/admin/casamento`** (o que os FRs descrevem). O
     dono ganha o dashboard que `regras-de-negocio.md` §3 promete, e o
     casamento legado continua inteiro, com um endereço próprio e honesto.
     **Recomendação.**
   - **Opção B — deixar como está e pôr o dashboard em `/admin/operacao`.**
     Zero risco para a operação do casamento. Custo: o endereço do desenho
     fica com outro conteúdo, e a barra passa a ter cinco itens.
   - **Opção C — não fazer o dashboard.** O dono continua sem número nenhum
     sobre o próprio negócio, o que contraria §3 das regras.

   **Não fazer nada disso na semana do casamento.** SDD §13.1 congela
   mudanças a partir de outubro; mesmo sem migração, mudar o endereço da tela
   que o dono usa para acompanhar as confirmações na véspera é risco
   desnecessário.

2. **`RECEITA` e `CONVERSÃO` são números que o dono quer ver numa tela
   pública do painel interno?** São dados do negócio, e a tela hoje é
   protegida só por sessão de admin — sem 2FA, como `/admin/login` já
   registra. Se houver mais de uma pessoa com acesso (o desenho G2 pressupõe
   "Equipe Enlace", "Suporte", "Financeiro"), receita e conversão deveriam
   depender de permissão — que é justamente o que G2 traria e não existe.
   **Confirmar** se o dashboard sai antes ou depois de G2.

3. **De onde vêm os números de tendência (`+18% vs. ago`)?** Do jeito direto,
   somando `orders` do mês anterior a cada carregamento — que funciona bem
   até uns milhares de pedidos. O caminho "certo" seria `site_daily_stats`,
   que o SDD §6.1 desenhou para isso e que **continua sem escritor** (§15.5).
   A recomendação é somar direto agora e revisitar quando o roll-up existir;
   confirmar que isso é aceitável.
