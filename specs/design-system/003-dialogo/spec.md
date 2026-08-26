# Spec 003 — Transição #3: diálogo (área: design-system)

**Status:** Pronta para implementação

## Contexto

`HANDOFF-motion.md` §3, item 3, define a entrada do diálogo destrutivo
(apagar foto, cancelar pedido, apagar convite, apagar cota): **scrim** em
`fade`, **caixa** em `scale(.96)→1 + translateY(8px)→0`, token `--base`. O
§6, item 5, cobra: *"modal fecha com fade reverso"*.

`components/ui/prensa/DialogoDestrutivo.tsx` usa `.motion-rise-in`, que é a
entrada genérica de card: `translateY(20px)` sem escala. O scrim
(`bg-[rgb(26_29_33/0.35)]`) aparece de uma vez, sem transição. E o
fechamento é `setAberto(false)` — desmonta na hora, sem fade reverso.

A diferença não é cosmética: `translateY(20px)` é o mesmo percurso que um
card de lista usa ao entrar. Uma caixa modal que sobe como card não lê como
"algo se abriu sobre a tela"; a escala é o que dá essa leitura.

O componente carrega três regras de desenho que **não podem ser tocadas**
nesta spec, porque são de Voz V4 e não de movimento: o botão repete o verbo
perigoso, a saída segura vem primeiro na leitura e recebe o foco ao abrir, e
perigo é contorno e nunca preenchido.

## Escopo

- `components/ui/prensa/DialogoDestrutivo.tsx`: entrada e saída do scrim e da
  caixa.
- Duas classes de animação novas em `app/globals.css`, sob `.ui-prensa`.
- Comportamento sob `prefers-reduced-motion`.

## Fora de escopo

- Estrutura, foco, rótulos e ordem dos botões do diálogo.
- Outros diálogos que não passam por `DialogoDestrutivo` (não há nenhum:
  `grep -rn "window.confirm" app components` devolve vazio, e é para continuar
  assim).
- O `role="dialog"` / `aria-modal` já presentes.

## Requisitos funcionais

- **FR-001:** `app/globals.css` DEVE declarar, sob `.ui-prensa`, a classe
  `.dialogo-caixa` com `animation: dialogo-caixa var(--t-base) var(--e-saida)
  both;` e o `@keyframes dialogo-caixa` indo de
  `{ opacity: 0; transform: scale(0.96) translateY(8px) }` para
  `{ opacity: 1; transform: none }`.
- **FR-002:** `app/globals.css` DEVE declarar, sob `.ui-prensa`, a classe
  `.dialogo-scrim` com `animation: motion-fade var(--t-base) var(--e-saida)
  both;` — o `@keyframes motion-fade` já existe e é reaproveitado.
- **FR-003:** `DialogoDestrutivo` DEVE trocar `motion-rise-in` por
  `dialogo-caixa` na caixa e acrescentar `dialogo-scrim` ao botão que faz o
  scrim.
- **FR-004:** Ao fechar (clique em "Manter", clique no scrim ou `Escape`), o
  diálogo DEVE permanecer montado por **140 ms** (`--t-rapido`) com
  `animation: motion-fade 140ms var(--e-suave) reverse both` aplicado ao scrim
  **e** à caixa, e só então desmontar. É o "fade reverso" do §6 item 5.
- **FR-005:** Se a confirmação for um `form` com `action`, o `submit` NÃO PODE
  esperar os 140 ms de FR-004 — a ação dispara no clique e o diálogo desmonta
  com a navegação. Adiar o envio para animar seria pagar 140 ms de latência
  numa ação destrutiva já confirmada.
- **FR-006:** Com `prefers-reduced-motion: reduce` e sem
  `data-movimento="ligado"` no `<html>`, `.dialogo-caixa` DEVE cair para
  `animation: motion-fade var(--t-reduzido) var(--e-suave) both` — sem escala
  e sem deslocamento. `.dialogo-scrim` fica como está (opacidade não tem
  vetor).
- **FR-007:** O tempo de fechamento de FR-004 DEVE cair para **0 ms** sob
  `prefers-reduced-motion`: o diálogo desmonta imediatamente.

## Critérios de aceite

- **SC-001:** `grep -c "motion-rise-in" components/ui/prensa/DialogoDestrutivo.tsx`
  devolve `0`. Atende FR-003.
- **SC-002:** No navegador, em `/conta/pedidos/<id>` → aba **Presentes** →
  "Apagar" numa cota, `getComputedStyle` da caixa durante a abertura devolve
  `animation-name: dialogo-caixa`, `animation-duration: 0.44s` e
  `animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1)`. Atende FR-001 e
  FR-003.
- **SC-003:** No mesmo teste, o primeiro quadro da caixa tem
  `transform: matrix(0.96, 0, 0, 0.96, 0, 8)`. Atende FR-001.
- **SC-004:** O scrim tem `animation-name: motion-fade` durante a abertura.
  Atende FR-002 e FR-003.
- **SC-005:** Clicar em "Manter" e medir com `performance.now()` entre o
  clique e a remoção do nó `[role="dialog"]` do DOM devolve um valor entre
  130 e 200 ms. Atende FR-004.
- **SC-006:** Clicar em "Apagar" numa cota dispara a Server Action no mesmo
  quadro do clique (a requisição aparece no painel de rede sem atraso de
  140 ms). Atende FR-005.
- **SC-007:** Com "reduzir movimento" ligado no sistema, `getComputedStyle` da
  caixa devolve `animation-name: motion-fade` e `animation-duration: 0.32s`, e
  o nó sai do DOM no mesmo quadro do clique em "Manter". Atende FR-006 e
  FR-007.
- **SC-008:** O foco continua indo para o botão "Manter" ao abrir, e `Escape`
  continua fechando. (Regressão de Voz V4 — não pode quebrar.)
- **SC-009:** `npm run build`, `npm run lint` e `npm run test` passam.

## Impacto em dados

Nenhum.

## Referências

- Protótipo: `HANDOFF-motion.md` §3 item 3 e §6 item 5.
  `Enlace - Movimento.dc.html`, cartão "Diálogo · modal + scrim"
  (`@keyframes pop` = `scale(.96) translateY(8px)` → `scale(1) translateY(0)`;
  `@keyframes fadeIn` no scrim). `Enlace - Voz e Microcopy.dc.html` V4,
  cartão "DIÁLOGO DESTRUTIVO" (as regras de estrutura que ficam intactas).
- Versão atual: `components/ui/prensa/DialogoDestrutivo.tsx` (`motion-rise-in`
  na caixa; scrim sem animação; desmonte imediato).
- SDD do Enlace: nenhuma seção toca diretamente; a biblioteca A4 é da
  plataforma e não alcança `lib/templates/*`.

## Dependências

- Depende de `specs/design-system/002-push-de-rota` apenas por ordem: as duas
  mexem no vocabulário de movimento e é melhor uma passada só de revisão.
- Não bloqueia nenhuma outra spec.

## Perguntas em aberto

Nenhuma.
