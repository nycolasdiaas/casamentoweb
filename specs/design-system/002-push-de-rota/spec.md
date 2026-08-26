# Spec 002 — Transição #1: push de rota com direção (área: design-system)

**Status:** Implementada (26/08/2026)

## Contexto

`HANDOFF-motion.md` §3, item 1, define o **push de rota** como a transição das
etapas do questionário, das abas do painel e da vitrine para o checkout:
saída em `opacity→0, translateX(-8%)`, entrada em `translateX(22px)→0` com
fade, token `--slow` e atraso de 120 ms. O §6, item 4, cobra:
*"push de rota respeita direção (avançar vs. voltar)"*.

`components/ui/PageTransition.tsx` faz outra coisa: `translateY(22px)
scale(0.985) blur(4px)` em 520 ms, sem direção e sem saída. O `blur` é
proibido nominalmente pelo §1 do handoff (*"Nada de `blur`, gradientes
animados, parallax, bounce exagerado"*).

O único lugar do produto onde a direção já está certa é a troca de etapa do
questionário (`.motion-step-next` / `.motion-step-prev` em `app/globals.css`),
que anima `translateX(±28px)`. Esta spec traz o `PageTransition` para o mesmo
vocabulário e corrige o percurso para o número do handoff.

O arquivo carrega uma restrição que **não pode ser desfeita**: o servidor
nunca renderiza conteúdo escondido. O estado inicial é aplicado no cliente,
num `useLayoutEffect`; sem JS, a tela aparece inteira, só sem transição. A
versão anterior lia `useReducedMotion()` durante o render e quebrava a
hidratação, deixando a tela embaçada para sempre.

## Escopo

- `components/ui/PageTransition.tsx`: eixo, percurso, duração, easing, atraso
  e direção da entrada.
- Detecção da direção (avançar × voltar) sem depender de biblioteca de
  animação.
- Comportamento sob `prefers-reduced-motion`.

## Fora de escopo

- A **saída** (`translateX(-8%)`). O App Router do Next 16 desmonta a árvore
  antiga antes de montar a nova; animar a saída exigiria `AnimatePresence` com
  a rota congelada, que é outra arquitetura. Ver "Perguntas em aberto".
- `.motion-step-next` / `.motion-step-prev` (troca de etapa do questionário),
  que já respeitam direção e ficam como estão.
- A transição de rolagem do site do convidado (`RevealOnScroll`,
  `ScrollChoreography`).

## Requisitos funcionais

- **FR-001:** `PageTransition` NÃO PODE aplicar `filter: blur()` em nenhum
  quadro, em nenhum estado de `prefers-reduced-motion`.
- **FR-002:** `PageTransition` NÃO PODE aplicar `scale()` em nenhum quadro.
- **FR-003:** Com movimento normal, o quadro inicial DEVE ser
  `{ opacity: 0, transform: "translateX(22px)" }` quando a navegação **avança**
  e `{ opacity: 0, transform: "translateX(-22px)" }` quando **volta**. O
  quadro final DEVE ser `{ opacity: 1, transform: "none" }`.
- **FR-004:** A duração com movimento normal DEVE ser **620 ms**
  (`--t-lento`), e o `easing` DEVE ser `cubic-bezier(0.16, 1, 0.3, 1)`
  (`--e-saida`).
- **FR-005:** A animação DEVE começar **120 ms** depois da montagem
  (`delay: 120` na Web Animations API).
- **FR-006:** A direção DEVE ser derivada de um contador de profundidade de
  histórico mantido em `sessionStorage` sob a chave `enlace:nav-depth`:
  guarda-se `history.length` a cada navegação; se o `history.length` atual for
  **maior** que o guardado, a navegação avançou; se for **menor ou igual**,
  voltou. Na primeira montagem da sessão (sem valor guardado) a direção é
  **avançar**.
- **FR-007:** Com `prefers-reduced-motion: reduce` **e** sem
  `data-movimento="ligado"` no `<html>`, os quadros DEVEM ser
  `[{ opacity: 0 }, { opacity: 1 }]`, duração **320 ms** (o mesmo
  `--t-reduzido` do CSS), `easing` `cubic-bezier(0.65, 0, 0.35, 1)`
  (`--e-suave`) e atraso **0**. Nenhum deslocamento.
- **FR-008:** O elemento raiz do `PageTransition` DEVE continuar sem estilo
  inline de opacidade no HTML do servidor. Verificável no HTML entregue: a
  `<div>` de `PageTransition` não pode conter `style="opacity:0"`.
- **FR-009:** As classes de layout do elemento raiz (`flex flex-1 flex-col`)
  DEVEM ser preservadas — sem elas o `flex-1` do `<main>` de cada tela fica
  sem contra quem crescer e o rodapé da janela vira fundo pelado.
- **FR-010:** O elemento raiz do `PageTransition` DEVE carregar
  `data-transicao="rota"`, para os critérios de aceite deste documento terem
  um seletor estável. Não pode ser `id`: o componente aparece uma vez por
  árvore, mas `/conta` e `/conta/pedidos/<id>` montam cascas aninhadas e um
  `id` repetido seria HTML inválido.

## Critérios de aceite

- **SC-001:** O array de quadros passado a `el.animate()` não contém `filter`
  nem `scale(` em nenhuma das duas ramificações (movimento normal e reduzido).
  Verificável lendo o bloco `const quadros = …`.

  > *Correção do critério, 25/08/2026:* a versão anterior era
  > `grep -c "blur\|scale" … devolve 0`, e ela é grosseira demais — reprova o
  > **comentário** que explica por que o `blur` saiu, que é justamente o que
  > se quer manter no arquivo. FR-001 e FR-002 falam dos quadros, não do
  > texto do arquivo.
- **SC-002:** No navegador, em `/conta/pedidos/<id>`, clicar na aba
  **Conteúdo** e ler `document.querySelector('[data-transicao="rota"]').getAnimations()[0]`
  devolve `effect.getTiming()` com `duration: 620`, `delay: 120` e
  `easing: "cubic-bezier(0.16, 1, 0.3, 1)"`. Atende FR-004 e FR-005.
- **SC-003:** No mesmo teste, `getKeyframes()[0].transform` é
  `"translateX(22px)"`. Atende FR-003.
- **SC-004:** Voltar pelo botão do navegador e repetir a leitura devolve
  `getKeyframes()[0].transform === "translateX(-22px)"`. Atende FR-003 e
  FR-006.
- **SC-005:** Com o sistema em "reduzir movimento", a mesma leitura devolve
  `duration: 320`, `delay: 0` e nenhum `transform` nos quadros. Atende FR-007.
- **SC-006:** `curl -s http://localhost:3000/conta/pedidos/<id> | grep -c
  'style="opacity:0"'` devolve `0`. Atende FR-008.
- **SC-007:** `document.querySelectorAll('[data-transicao="rota"]').length` é maior que 0 em toda tela de `/conta`. Atende FR-010.
- **SC-008:** Em viewport de 1600px, `/conta/pedidos/<id>` com pouco conteúdo
  não mostra faixa de fundo do `body` abaixo do `<main>` (a casca continua
  ocupando a altura da janela). Atende FR-009.
- **SC-009:** `npm run build`, `npm run lint` e `npm run test` passam.

## Impacto em dados

Nenhum. `sessionStorage` é do navegador, não do banco.

## Referências

- Protótipo: `HANDOFF-motion.md` §1 (proibição de `blur`), §3 item 1 (valores
  do push), §4 (variants de rota reutilizáveis), §5 (durações > 620ms só em
  publicar), §6 item 4 (direção). `Enlace - Movimento.dc.html`, cartão
  "Transição de tela · push · rota → rota" (`@keyframes pIn`/`pOut`).
- Versão atual: `components/ui/PageTransition.tsx` (`PERCURSO = 22`,
  `DURACAO = 520`, quadros com `blur(4px)` e `scale(0.985)`).
- SDD do Enlace: §15.3 (as abas de `/conta/pedidos/<id>/` são o principal
  consumidor desta transição).

## Dependências

- Nenhuma spec precede esta.
- **Precede** `specs/design-system/003-dialogo` e `004-brinde`: as três
  compartilham o vocabulário de tokens de movimento, e o valor de referência
  (`--t-lento` = 620ms) é fixado aqui.

## Perguntas em aberto

1. **A saída (`translateX(-8%)`) fica de fora nesta spec.** No App Router a
   árvore antiga é desmontada antes de a nova montar; animar a saída exige
   segurar a rota anterior no DOM (View Transitions API ou
   `AnimatePresence mode="popLayout"`, as duas alternativas que o handoff §4
   lista). Ambas mudam a arquitetura de navegação do painel inteiro e
   merecem spec própria. **Vale a pena?** — decisão do dono. Até lá, a
   entrada sozinha cumpre o §6 item 4 (direção), que é o critério de aceite
   escrito no handoff.
