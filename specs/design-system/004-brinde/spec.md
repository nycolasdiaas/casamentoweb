# Spec 004 — Transição #4: o brinde (toast) (área: design-system)

**Status:** Implementada (26/08/2026)

## Contexto

`HANDOFF-motion.md` §3, item 4, define o **brinde** (o produto não escreve
"toast" — Voz V5 proíbe termo técnico em texto visível, e este nome vale
também para o código, para não haver dois vocabulários): entra em
`translateY(24px)→0 + fade` com `--base`, sai sozinho depois de **4 s** com
fade reverso em `--fast`. O §4 acrescenta: fila de no máximo 3.

A Fundação A4 desenha a peça: fundo `#1a1d21`, raio 3px, ponto verde de 8px,
texto branco de 13,5px, sombra `0 8px 24px rgb(26 29 33 / .22)`. A Voz V4 dá
a fórmula do texto: **resultado no passado, com ponto final** — "Suas fotos
estão no site.", nunca "Upload realizado com sucesso!".

Hoje o produto não tem nenhum. A confirmação efêmera mais próxima é
`CopiarLink.tsx`, que troca o próprio rótulo para "Copiado!" e volta — o que
funciona para um botão, mas não serve para autosave, para "fotos no site" nem
para "link copiado" disparado de outro lugar da tela.

## Escopo

- Componente novo `components/ui/prensa/Brinde.tsx`, exportado pela porta
  única `components/ui/prensa/index.ts`.
- Provider de fila `components/ui/prensa/BrindeProvider.tsx` (ou equivalente),
  montado uma vez na casca da conta.
- Classes de animação em `app/globals.css`, sob `.ui-prensa`.
- Ligar os três disparos que já existem hoje sem peça própria: autosave do
  `ContentEditor`, conclusão de envio de fotos no `PhotoManager`, e cópia de
  link no `CopiarLink`.

## Fora de escopo

- Brinde no site do convidado (`/s/:slug`, `/c/:slug`, `/rsvp/:slug`). Lá o
  vocabulário é do molde, e a biblioteca da Prensa não pode alcançar
  `lib/templates/*` (`npm run verify:template` reprova).
- Brinde de erro. Voz V4 é explícita: erro de campo mora **abaixo do campo**,
  nunca em alerta flutuante. Esta peça só confirma.
- Ação dentro do brinde ("Desfazer"). O desenho não tem, e acrescentar exigiria
  decidir o que é reversível — outra spec.

## Requisitos funcionais

- **FR-001:** DEVE existir `components/ui/prensa/Brinde.tsx`, exportado por
  `components/ui/prensa/index.ts`.
- **FR-002:** A peça DEVE renderizar em `position: fixed`, ancorada
  `bottom: 24px` e centralizada horizontalmente (`left: 50%; transform:
  translateX(-50%)`), com `z-index: 60` — acima do `z-50` do
  `DialogoDestrutivo`, pelo motivo de FR-011.
- **FR-003:** O desenho DEVE ser: fundo `#1a1d21`, `border-radius: 3px`,
  `padding: 14px 16px`, `box-shadow: 0 8px 24px rgb(26 29 33 / 0.22)`, texto
  em 13,5px na cor `#ffffff`, e um ponto de 8px `border-radius: 50%` na cor
  `#5fae86` à esquerda do texto, com `gap: 12px`.
- **FR-004:** A entrada DEVE ser `{ opacity: 0, transform: translateY(24px) }`
  → `{ opacity: 1, transform: none }`, duração `var(--t-base)` (440 ms),
  easing `var(--e-saida)`.
- **FR-005:** A saída DEVE começar **4000 ms** depois da entrada, ser o
  reverso da entrada, com duração `var(--t-rapido)` (140 ms) e easing
  `var(--e-suave)`.
- **FR-006:** A fila DEVE aceitar no máximo **3** brindes visíveis ao mesmo
  tempo, empilhados de baixo para cima com `gap: 8px`. O quarto disparo
  descarta o **mais antigo** imediatamente (sem esperar os 4 s dele).
- **FR-007:** O contêiner da fila DEVE ter `role="status"` e
  `aria-live="polite"` — o leitor de tela anuncia ao terminar a frase atual,
  em vez de interromper.
- **FR-008:** O texto do brinde DEVE ser passado por quem dispara. A peça NÃO
  PODE ter texto padrão nem montar frase: a fórmula ("resultado no passado,
  com ponto final") é responsabilidade de quem chama.
- **FR-009:** Com `prefers-reduced-motion: reduce` e sem
  `data-movimento="ligado"` no `<html>`, entrada e saída DEVEM virar fade puro
  com `var(--t-reduzido)` (320 ms), sem deslocamento. O tempo de 4 s **não**
  muda: ele é informação, não movimento.
- **FR-010:** O provider DEVE ser montado **uma vez**, em
  `app/conta/layout.tsx`. Montar por tela faria dois brindes empilharem
  contadores separados ao navegar entre abas.
- **FR-011:** Enquanto houver um `[role="dialog"]` montado, a fila DEVE
  continuar visível e acima do scrim (`z-index: 60` contra o `z-50` do
  diálogo). Um "salvo." escondido atrás do scrim é uma confirmação que não
  confirma.
- **FR-012:** ~~`ContentEditor`, `PhotoManager` e `CopiarLink` disparam o
  brinde.~~ **Corrigido na implementação, 26/08/2026.** Dois dos três já
  confirmam no lugar da ação, e o brinde ali seria a segunda confirmação da
  mesma coisa:

  | Onde | O que já existe | Decisão |
  |---|---|---|
  | `CopiarLink` | "Copiado" dentro do próprio botão, 2s | **fica como está** |
  | `ContentEditor` | `<div aria-live="polite">` com "Salvo ✓ — o site já está com o conteúdo novo." ao lado do botão | **fica como está** |
  | `PhotoManager` | **nada** — a barra de envio some e a grade muda | **dispara o brinde** |

  O `CopiarLink` já argumentava contra, no próprio arquivo: *"Um brinde
  (toast) para isto seria movimento demais para uma ação de meio segundo — e a
  confirmação precisa aparecer onde o dedo está, não no canto da tela."* O
  argumento é bom e vale igual para o `ContentEditor`.

  Sobra o `PhotoManager`, que é justamente o exemplo que a prancha A4 e a Voz
  V4 usam ("Suas fotos estão no site."): ali a grade muda, mas ninguém garante
  que o casal estava olhando para ela.

- **FR-012b:** `PhotoManager` DEVE disparar ao fim do envio, **e só quando
  alguma foto entrou** — envio que falhou inteiro já tem a mensagem de erro
  abaixo do campo, e um brinde de sucesso ao lado dela seria contradição. O
  texto é `Sua foto está no site.` no singular e `Suas fotos estão no site.`
  no plural.

## Critérios de aceite

- **SC-001:** `grep -c "Brinde" components/ui/prensa/index.ts` devolve no
  mínimo `1`. Atende FR-001.
- **SC-002:** No navegador, em `/conta/pedidos/<id>/conteudo`, salvar e ler
  `getComputedStyle` do brinde devolve `background-color: rgb(26, 29, 33)`,
  `border-radius: 3px` e `box-shadow: rgba(26, 29, 33, 0.22) 0px 8px 24px 0px`.
  Atende FR-003.
- **SC-003:** No mesmo teste, `getAnimations()[0].effect.getTiming()` devolve
  `duration: 440` e `easing: "cubic-bezier(0.16, 1, 0.3, 1)"`, e
  `getKeyframes()[0].transform` é `"translateY(24px)"`. Atende FR-004.
- **SC-004:** O nó do brinde sai do DOM entre 4400 e 4600 ms depois de
  aparecer (4000 de espera + 140 de saída + folga de agendamento). Atende
  FR-005.
- **SC-005:** Disparar 4 brindes em sequência deixa exatamente 3 nós no DOM, e
  o texto do primeiro disparo não está entre eles. Atende FR-006.
- **SC-006:** `document.querySelector('[role="status"][aria-live="polite"]')`
  existe e é o contêiner da fila. Atende FR-007.
- **SC-007:** Com "reduzir movimento" ligado, `getAnimations()[0]` devolve
  `duration: 320` e nenhum `transform` nos quadros; o nó continua saindo entre
  4200 e 4500 ms. Atende FR-009.
- **SC-008:** Abrir o diálogo de apagar cota com um brinde na tela: o brinde
  continua legível, sem o scrim por cima (medir com
  `document.elementFromPoint` no centro do brinde — devolve o nó do brinde).
  Atende FR-011.
- **SC-009:** `CopiarLink` e `ContentEditor` **não** importam `useBrinde` —
  a confirmação deles continua onde a ação está. Atende FR-012.
- **SC-009b:** Enviar duas fotos mostra `Suas fotos estão no site.`; enviar
  uma mostra `Sua foto está no site.`; um envio que falha inteiro não mostra
  brinde nenhum. Atende FR-012b.
- **SC-010:** `npm run build`, `npm run lint` e `npm run test` passam.
- **SC-011:** `getComputedStyle` do contêiner da fila devolve `position: fixed`, `bottom: 24px` e `z-index: 60`. Atende FR-002.
- **SC-012:** `grep -cE '"[A-Z][^"]{5,}\."' components/ui/prensa/Brinde.tsx` devolve `0` — a peça não carrega nenhuma frase própria. Atende FR-008.
- **SC-013:** `grep -rn 'BrindeProvider' app/` devolve exatamente uma linha, em `app/conta/layout.tsx`. Atende FR-010.

## Impacto em dados

Nenhum.

## Referências

- Protótipo: `HANDOFF-motion.md` §3 item 4 e §4 ("Toast com fila (máx 3) e
  timer de 4s"). `Enlace - Movimento.dc.html`, cartão "Brinde (toast)"
  (`@keyframes toastUp`). `Enlace - Fundacao.dc.html` A4, bloco "Brinde de
  sucesso". `Enlace - Voz e Microcopy.dc.html` V4, cartão "CONFIRMAÇÃO
  (TOAST)" — a fórmula do texto.
- Versão atual: não existe — **NOVO**. O mais próximo é
  `components/ui/prensa/CopiarLink.tsx`, que troca o próprio rótulo.
- SDD do Enlace: §15.3 (o painel do casal é onde a peça vive); §4.4.1 (a
  restrição de não alcançar `lib/templates/*`).

## Dependências

- Depende de `specs/design-system/002-push-de-rota` e `003-dialogo` por ordem
  de revisão do vocabulário de movimento (os três tokens de duração e as duas
  curvas ficam fixados lá).
- **Precede** `specs/painel-casal/006-autosave-do-editor`, que usa o brinde como
  indicador de "salvo".

## Perguntas em aberto

Nenhuma.
