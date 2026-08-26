# Spec 005 — Transição #6: publicar → no ar (área: design-system)

**Status:** Implementada (26/08/2026)

## Contexto

`HANDOFF-motion.md` §3, item 6, define a única sequência do produto que pode
passar de 620 ms (§5 é explícito: *"> 700ms só na sequência de publicar"*): a
marca d'água **PRÉVIA** sai em `fade-out` com `--slow`, e o selo verde
**No ar** entra com `pop` (`scale .8 → 1.08 → 1`) em `--base`, a partir de
700 ms. O §6, item 6, cobra a regra que importa mais que a animação: *"A
sequência 'publicar → no ar' só dispara após confirmação real do pagamento."*

Hoje as duas metades existem separadas e nenhuma se move:

- A marca d'água `PRÉVIA` está em `components/site/SiteFromView.tsx:131`, e
  desaparece porque a página **inteira** volta a renderizar depois de
  `derrubarCache` — um corte, não uma transição.
- A etiqueta "No ar" existe como `.etiqueta-noar` (`app/globals.css`), estática.

O momento em que a sequência precisa rodar já é conhecido pelo código: é
`publishSiteForOrder` (`lib/site/publish.ts`), chamado por três caminhos —
retorno do checkout (`/api/pagamento/confirmar`), webhook do AbacatePay, e
ação do admin (SDD §7.2). Os três terminam com o casal chegando em
`/conta/pedidos/<id>`.

## Escopo

- Animar a saída da marca d'água e a entrada do selo **na tela de
  `/conta/pedidos/<id>`**, no primeiro carregamento depois de publicar.
- O sinal que diz "acabou de publicar agora" — sem ele a animação rodaria toda
  vez que o casal abrisse a tela, o que transformaria uma comemoração em tique
  nervoso.
- Classes de animação em `app/globals.css`, sob `.ui-prensa`.

## Fora de escopo

- Animar a marca d'água dentro do site renderizado (`SiteFromView`). Ali ela
  vive sob `lib/templates/*`, onde a biblioteca da Prensa não alcança, e o
  convidado nunca vê a transição de qualquer forma.
- Mudar quem publica, quando publica ou como o cache é derrubado. `publish.ts`
  e os três caminhos de §7.2 ficam intactos.
- A tela de sucesso "Seu site está no ar!" com os dois botões — é E10 e está
  em `specs/painel-casal/008-e10-publicar`.

## Requisitos funcionais

- **FR-001:** `app/globals.css` DEVE declarar, sob `.ui-prensa`, o
  `@keyframes selo-pop` com três paradas: `0% { opacity: 0; transform:
  scale(0.8) }`, `55% { opacity: 1; transform: scale(1.08) }`,
  `100% { opacity: 1; transform: scale(1) }`.
- **FR-002:** `app/globals.css` DEVE declarar `.selo-noar { animation:
  selo-pop var(--t-base) var(--e-saida) 700ms both; }`.
- **FR-003:** `app/globals.css` DEVE declarar `.previa-saindo { animation:
  motion-fade var(--t-lento) var(--e-saida) reverse both; }` — o fade reverso
  de 620 ms que apaga a marca d'água.
- **FR-004:** A rota de retorno `/api/pagamento/confirmar` e a ação do admin
  DEVEM redirecionar para `/conta/pedidos/<id>?publicado=1` **apenas quando
  `publishSiteForOrder` de fato mudou o status para `published` nesta
  chamada** — nunca quando ele foi idempotente (site já publicado).
  > **Corrigido na implementação:** a ação do admin **não emite** o sinal, e
  > não tem como — `admin-order-actions.ts` roda no navegador da equipe, não
  > no do casal. Quem publica pelo admin faz o casal encontrar o site já no ar
  > da próxima vez que abrir o painel, sem a batida. É o certo: o momento não
  > é dele. FR-004 vale só para `/api/pagamento/confirmar`.

- **FR-005:** `app/conta/pedidos/[id]/page.tsx` DEVE ler `?publicado=1` e,
  quando presente, aplicar `.selo-noar` na `EtiquetaDoPedido` da casca do
  painel (`CascaDoPainel.tsx`).

  > **Corrigido na implementação:** quem lê o parâmetro é a própria
  > `CascaDoPainel.tsx`, não a `page.tsx`. O selo mora na casca, que é um
  > *layout* — e layout não recebe `searchParams` no App Router. A leitura é
  > `useSearchParams()` no render (ler num efeito para guardar em `useState`
  > é o que `react-hooks/set-state-in-effect` reprova, com razão).

- **FR-005b:** A classe `.previa-saindo` é **entregue aqui e consumida em
  `specs/painel-casal/008-e10-publicar`**, que é quem cria a marca d'água
  sobre a miniatura do painel. Enquanto 007 não existir, `.previa-saindo`
  fica declarada e sem uso — é a metade que esta spec pode fechar sozinha
  sem inventar a tela da outra.
- **FR-006:** Sem `?publicado=1`, nem `.previa-saindo` nem `.selo-noar` podem
  ser aplicadas. Recarregar a tela um minuto depois mostra o selo parado.
- **FR-007:** O parâmetro `?publicado=1` DEVE ser removido do endereço depois
  da animação, por `history.replaceState`, para o casal não reexecutar a
  sequência ao recarregar ou ao compartilhar o link do painel.
- **FR-008:** Com `prefers-reduced-motion: reduce` e sem
  `data-movimento="ligado"` no `<html>`, `.selo-noar` DEVE cair para
  `animation: motion-fade var(--t-reduzido) var(--e-suave) both` (sem escala)
  e `.previa-saindo` DEVE ficar em `opacity: 0` sem animação. O resultado
  final é idêntico: sem marca d'água, com selo.
- **FR-009:** A sequência NÃO PODE ser disparada por nenhum caminho que não
  passe por `publishSiteForOrder`. Em particular, `?publicado=1` digitado à
  mão na barra de endereços com o pedido ainda em `preview_ready` NÃO PODE
  animar nada — a página DEVE ignorar o parâmetro quando
  `site.status !== "published"`.

## Critérios de aceite

- **SC-001:** Num pedido em `preview_ready`, abrir
  `/conta/pedidos/<id>?publicado=1` à mão não aplica nenhuma das duas classes
  (`document.querySelectorAll('.selo-noar, .previa-saindo').length === 0`).
  Atende FR-009.
- **SC-002:** Com o pedido pago e o site ainda em `preview`, chamar
  `/api/pagamento/confirmar?pedido=<id>` redireciona para
  `/conta/pedidos/<id>?publicado=1`. Atende FR-004.
- **SC-003:** Chamar a mesma rota **de novo** (o site já está `published`)
  redireciona para `/conta/pedidos/<id>` **sem** o parâmetro. Atende FR-004.
- **SC-004:** Na tela que chega com `?publicado=1`, `getComputedStyle` da
  etiqueta devolve `animation-name: selo-pop`, `animation-duration: 0.44s` e
  `animation-delay: 0.7s`. Atende FR-001 e FR-002.
- **SC-005:** Uma folha de estilo do build declara `.previa-saindo` com
  `animation-name: motion-fade`, `animation-duration: 0.62s` e
  `animation-direction: reverse` — verificável por
  `grep -A3 "previa-saindo" app/globals.css`. Atende FR-003 e FR-005b.
- **SC-006:** 2 segundos depois de carregar, `location.search` é `""`.
  Recarregar não repete a animação. Atende FR-007.
- **SC-007:** Com "reduzir movimento" ligado, a etiqueta tem
  `animation-name: motion-fade` e a marca d'água tem `opacity: 0` sem
  `animation-name`. Atende FR-008.
- **SC-008:** `npm run build`, `npm run lint` e `npm run test` passam, com os
  testes de `lib/site/publish.test.ts` intactos (a idempotência de §7.2 não
  pode regredir).
- **SC-009:** Na tela que chega com `?publicado=1`, a `EtiquetaDoPedido` da casca do painel carrega a classe `selo-noar`. Atende FR-005.
- **SC-010:** Num pedido `published` aberto **sem** `?publicado=1`, `document.querySelectorAll('.selo-noar, .previa-saindo').length` é `0`. Atende FR-006.

## Impacto em dados

Nenhum. O sinal viaja na URL, não no banco. Guardar "já mostrei a comemoração"
numa coluna exigiria migração num banco com casamento no ar, e o parâmetro de
uma navegação resolve o mesmo problema sem custo.

## Referências

- Protótipo: `HANDOFF-motion.md` §3 item 6, §5 (o teto de 700 ms e a exceção),
  §6 item 6 (só depois de pagamento confirmado).
  `Enlace - Movimento.dc.html`, cartão "Publicar → no ar"
  (`@keyframes markOut` e `@keyframes badgePop`).
  `Enlace - E Painel.dc.html` E10, artboard "PAGO · SITE NO AR".
- Versão atual: `components/site/SiteFromView.tsx:131` (marca d'água estática),
  `app/globals.css` (`.etiqueta-noar` estática),
  `lib/site/publish.ts` (`publishSiteForOrder`),
  `app/api/pagamento/confirmar/route.ts`,
  `app/conta/pedidos/[id]/page.tsx:96-104` (o redirect que já existe).
- SDD do Enlace: §7.2 (os três caminhos de publicação e a idempotência),
  §15.3 (a tela de destino).

## Dependências

- Depende de `specs/design-system/002-push-de-rota` (vocabulário de movimento).
- **Precede** `specs/painel-casal/008-e10-publicar`, que monta a tela de
  sucesso onde este selo aparece.

## Perguntas em aberto

Nenhuma.

## Notas de implementação

Como cada critério foi conferido, quando o meio foi diferente do escrito:

- **SC-001, SC-006, SC-009, SC-010** — `components/account/manage/CascaDoPainel.test.tsx`
  (6 testes). O caso do parâmetro digitado à mão num pedido em prévia é o
  primeiro deles.
- **SC-002, SC-003** — `app/api/pagamento/confirmar/route.test.ts` (3 testes,
  toda a conversa externa em dublê). O terceiro cobre o galho de falha, que a
  spec não pedia mas divide a mesma linha.
- **SC-004, SC-005, SC-007** — a spec pedia `getComputedStyle` num navegador.
  Conferido no chunk de CSS do `next build`, que é a fonte de verdade do
  projeto (`app/globals.css` em dev serve o chunk anterior — ver Skill
  `cache-e-build`). O compilado traz, literalmente:
  `@keyframes selo-pop{0%{opacity:0;transform:scale(.8)}55%{opacity:1;transform:scale(1.08)}to{opacity:1;transform:scale(1)}}`,
  `.ui-prensa .selo-noar{animation:selo-pop var(--t-base) var(--e-saida) .7s both}`,
  `.ui-prensa .previa-saindo{animation:motion-fade var(--t-lento) var(--e-saida) reverse both}`
  e as duas quedas de movimento reduzido
  (`.selo-noar{animation:motion-fade var(--t-reduzido) var(--e-suave) both}`,
  `.previa-saindo{opacity:0;animation:none}`).
- **SC-008** — `npm run build`, `npm run lint` e `npm run test` na íntegra;
  `lib/site/publish.test.ts` intacto (a idempotência de §7.2 continua sendo o
  que este sinal lê).
