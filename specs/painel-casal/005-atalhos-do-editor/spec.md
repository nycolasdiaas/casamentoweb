# Spec 005 — E9: atalhos de teclado do editor de convite (área: painel-casal)

**Status:** Implementada (27/08/2026)

## Contexto

`HANDOFF-editor-convite.md` §7 fecha com a lista de atalhos:

> Ctrl/Cmd Z / Shift+Z, C/V/D, Delete, setas, `[`/`]` z-order, `+`/`-` zoom,
> `0` = ajustar à tela, Espaço+arrasto = pan.

E §5 detalha dois deles: *"Setas do teclado movem 1px (Shift = 10px)"* e
*"Copiar/colar/duplicar: Ctrl/Cmd+C/V, Ctrl/Cmd+D (cola deslocado 12px)"*.

`EditorDeConvite.tsx:374-393` implementa **dois**: `Delete`/`Backspace` apaga
o bloco escolhido, e `Escape` desmarca. O resto não existe. Desfazer e refazer
existem, mas só pelos botões da barra (`:751` e `:759`) — não pelo teclado.

O arquivo já resolveu a parte difícil: ele distingue "está digitando" de "está
editando o convite", olhando `INPUT`/`TEXTAREA`/`isContentEditable` e o
estado `editandoTexto`. Sem essa guarda, apagar uma letra apagaria o bloco
inteiro — o comentário registra isso. Todo atalho novo herda a mesma guarda.

## Escopo

- Os atalhos de §7 que faltam, no `EditorDeConvite`.
- A área de transferência interna (copiar/colar dentro do editor).
- Uma legenda de atalhos alcançável na própria tela.

## Fora de escopo

- Colar imagem do sistema operacional (`Ctrl+V` com um arquivo na área de
  transferência). A foto entra por `requestPhotoUpload`/`confirmPhotoUpload`,
  e um segundo caminho de foto é o que o comentário de `EditorDeConvite.tsx:452`
  diz explicitamente que não existe.
- Colar entre convites diferentes ou entre abas.
- Snap — `specs/painel-casal/004`.

## Requisitos funcionais

- **FR-001:** Todo atalho DEVE respeitar a guarda que já existe: se o alvo do
  evento for `INPUT`, `TEXTAREA` ou `contentEditable`, ou se `editandoTexto`
  estiver ativo, o atalho NÃO dispara. A única exceção é `Escape`, que
  encerra a edição de texto.
- **FR-002:** `Ctrl/Cmd + Z` DEVE desfazer e `Ctrl/Cmd + Shift + Z` DEVE
  refazer, chamando as mesmas funções que os botões da barra já chamam.
- **FR-003:** As **setas** DEVEM mover o bloco selecionado em **1px do
  convite** (convertido para fração: `1 / doc.largura` na horizontal,
  `1 / doc.altura` na vertical). Com **Shift**, **10px**.
- **FR-004:** Uma sequência de setas DEVE produzir **uma** entrada de
  desfazer, não uma por tecla. O `useHistorico` já tem o conceito de "1
  entrada por gesto"; aqui o gesto termina 500ms depois da última tecla.
- **FR-005:** `Ctrl/Cmd + D` DEVE duplicar o bloco selecionado, deslocado
  **12px** para a direita e 12px para baixo (em fração), com `id` novo, e o
  novo bloco fica selecionado.
- **FR-006:** `Ctrl/Cmd + C` DEVE guardar o bloco selecionado numa área de
  transferência **em memória** (um `useRef`, não a área do sistema), e
  `Ctrl/Cmd + V` DEVE colar com `id` novo, deslocado 12px, selecionado.
  Colar sem nada copiado não faz nada e não erra.
- **FR-007:** `[` DEVE enviar o bloco selecionado uma posição para trás e `]`
  uma para frente, na ordem do array `doc.blocos` (que **é** o z-index — a
  `Camadas.tsx` já trabalha assim).
- **FR-008:** `+` e `=` DEVEM aumentar o zoom em 10%; `-` DEVE diminuir 10%.
  Os dois DEVEM respeitar os limites que a roda do mouse já usa (0,4 a 4).
- **FR-009:** `0` DEVE ajustar o convite à moldura — o zoom em que o convite
  cabe inteiro, que é o valor inicial da tela.
- **FR-010:** **Espaço + arrasto** DEVE mover a tela (pan), com o cursor
  virando `grab`/`grabbing` enquanto o Espaço estiver pressionado. O arrasto
  do fundo continua funcionando como hoje — este é um segundo caminho, que é
  o que permite arrastar a tela com um bloco por baixo do cursor.
- **FR-011:** Nenhum atalho pode disparar `preventDefault` sem necessidade.
  Em particular `Ctrl/Cmd + C` e `Ctrl/Cmd + V` só previnem o padrão quando há
  bloco selecionado; sem seleção, a cópia normal do navegador continua
  funcionando.
- **FR-012:** DEVE existir uma legenda de atalhos alcançável pela tela: um
  botão discreto na barra de zoom (`?` ou `Atalhos`) que abre um painel com a
  lista. Atalho que ninguém descobre é atalho que não existe.
- **FR-013:** A legenda DEVE mostrar `Ctrl` ou `Cmd` conforme a plataforma,
  lida de `navigator.platform` no cliente.
- **FR-014:** Nenhum atalho pode usar apenas uma letra sem modificador, além
  dos já definidos (`[`, `]`, `+`, `-`, `0`, setas, Delete, Escape, Espaço).
  Letras soltas colidiriam com a digitação assim que o foco escapasse da
  guarda de FR-001.

## Critérios de aceite

- **SC-001:** Com um bloco selecionado e o foco no artboard,
  `Ctrl+Z` desfaz o último gesto. Com o foco dentro do campo de texto de um
  bloco, `Ctrl+Z` desfaz a digitação (comportamento do navegador) e **não**
  mexe no documento. Atende FR-001 e FR-002.
- **SC-002:** Apertar `→` 5 vezes move o bloco 5px e produz **uma** entrada de
  desfazer. Atende FR-003 e FR-004.
- **SC-003:** `Shift + →` move 10px. Atende FR-003.
- **SC-004:** `Ctrl+D` com um bloco selecionado deixa `doc.blocos.length + 1`
  blocos, o novo com `id` diferente e `x`/`y` deslocados em `12 / largura` e
  `12 / altura`. Atende FR-005.
- **SC-005:** `Ctrl+C` seguido de `Ctrl+V` produz o mesmo resultado de
  `Ctrl+D`; `Ctrl+V` sem nada copiado não altera `doc`. Atende FR-006.
- **SC-006:** `]` num bloco que está em `doc.blocos[0]` o move para
  `doc.blocos[1]`, e a `Camadas` reflete a nova ordem. Atende FR-007.
- **SC-007:** `+` cinco vezes a partir de 100% chega a ~161% e para em 400%
  por mais que se aperte. Atende FR-008.
- **SC-008:** `0` devolve o zoom ao valor de ajuste à moldura, seja qual for o
  zoom anterior. Atende FR-009.
- **SC-009:** Segurar Espaço muda o cursor para `grab`; arrastar com Espaço
  pressionado move a tela e **não** move nenhum bloco. Atende FR-010.
- **SC-010:** Sem bloco selecionado, selecionar texto no painel lateral e
  apertar `Ctrl+C` copia para a área de transferência do sistema. Atende
  FR-011.
- **SC-011:** O botão de atalhos existe na barra de zoom e abre a lista com
  todos os atalhos de FR-002 a FR-010. Atende FR-012.
- **SC-012:** Num Mac, a legenda mostra `Cmd`; no Windows, `Ctrl`. Atende
  FR-013.
- **SC-013:** `npm run build`, `npm run lint` e `npm run test` passam.
- **SC-014:** `grep -oE "e\.key === \"[a-zA-Z]\"" components/account/convite/EditorDeConvite.tsx` não devolve nenhuma letra sem verificação de `ctrlKey`/`metaKey`. Atende FR-014.

## Impacto em dados

Nenhum. Os atalhos mexem nos mesmos campos do `doc` que o mouse já mexe.

## Referências

- Protótipo: `HANDOFF-editor-convite.md` §5 (setas de 1px/10px,
  copiar/colar/duplicar com deslocamento de 12px, z-order pelo menu de
  contexto), §7 (a lista completa de atalhos), §9 critério 2 (*"undo/redo
  consistente por gesto"*). `Enlace - E Painel.dc.html` E9, barra de zoom no
  rodapé do artboard `EDITOR · DESKTOP · 1560`.
- Versão atual: `components/account/convite/EditorDeConvite.tsx:374-393`
  (Delete/Backspace e Escape, com a guarda de digitação), `:398-419` (zoom
  pela roda do mouse), `:751`/`:759` (botões de desfazer/refazer),
  `components/account/manage/useHistorico.ts`,
  `components/account/convite/Camadas.tsx`.
- SDD do Enlace: §15.1 (o editor de convites).

## Dependências

- **Depende de** `specs/painel-casal/002-modelo-do-convite`.
- Depende de `specs/painel-casal/004-snap-e-guias` só por ordem de trabalho:
  as duas mexem no mesmo arquivo de 1.417 linhas, e fazer as duas na mesma
  passada evita um segundo conflito de merge no mesmo componente.

## Perguntas em aberto

Nenhuma.

## Retida na execução de 26/08/2026

**Não implementada, e a razão não é técnica.** Esta spec declara, no próprio
campo Dependências, que depende da **decisão** de
`specs/painel-casal/002-modelo-do-convite` — que segue
`[CONFLITO COM DECISÃO EXISTENTE — REQUER APROVAÇÃO]`, sem decisão registrada.
O INDEX diz o mesmo com todas as letras: *"002 destrava 003 a 007"*.

Implementar agora seria escolher a **Opção A** da 002 (o modelo implementado
vence) em nome do dono. A Opção A é a recomendação escrita e custa zero — mas
recomendar não é decidir, e a regra de execução é explícita: nenhuma spec com
conflito aberto entra antes de a decisão estar registrada.

**O que destrava:** uma linha do dono escolhendo A, B ou C na spec 002. Com A
ou C, esta spec entra como está. Só a Opção B a invalidaria — e a própria 002
mostra que B cai na proibição de §13.1 (exigiria `UPDATE` em `doc` de convites
que o casal já desenhou).

## Retenção levantada — 27/08/2026

A decisão que faltava foi tomada: `painel-casal/002` fechou na **Opção A** (o
modelo implementado vence). Esta spec volta a `Pronta` e entra como estava
escrita — a Opção A não muda nenhum requisito dela.

## Notas de implementação

- **Feita na mesma passada que a `004`**, como o INDEX recomendava: as duas
  mexem no mesmo arquivo de 1.400 linhas.

- **A legenda usa `useSyncExternalStore`, não `useState` + efeito.** O servidor
  não tem plataforma nenhuma, então o valor precisa nascer diferente dos dois
  lados sem quebrar a hidratação — e é para isso que o terceiro argumento (o
  retrato do servidor) existe. Estado corrigido num efeito daria o mesmo
  resultado com um render a mais, e é o que `react-hooks/set-state-in-effect`
  reprova com razão.

- **`Escape` é tratado ANTES da guarda de FR-001**, e é a única tecla assim.
  Ele serve justamente para sair da digitação; depois da guarda, nunca
  chegaria.

- **`Ctrl/Cmd + C` e `+ V` só chamam `preventDefault` quando há bloco.** Sem
  seleção, o `return` vem antes — a cópia normal do navegador continua
  funcionando, e roubar `Ctrl+C` de quem queria copiar uma frase do próprio
  convite seria um defeito difícil de nomear.

- **A rajada de setas fecha em 500ms.** Ajustar a posição em dez toques
  produziria dez passos de desfazer, e voltar ao ponto de partida exigiria dez
  desfazeres — o oposto do que a pessoa quer.

- **Nenhuma letra solta.** Um teste varre o arquivo procurando
  `e.key === "<letra>"` e reprova se aparecer. Letra solta colidiria com a
  digitação no primeiro instante em que o foco escapasse da guarda.

## Como cada critério foi conferido

| Critério | Medida |
|---|---|
| A legenda | abre e fecha; lista treze atalhos com o que cada um faz; tem botão de fechar rotulado |
| FR-013 | com `navigator.platform = "MacIntel"` a legenda escreve `Cmd + Z` e nenhum `Ctrl`; com `Win32`, o contrário |
| FR-001 | a guarda `digitando || editandoTexto` vem antes de tudo; `Escape` vem antes dela |
| FR-002, FR-005, FR-006 | `Ctrl/Cmd` + `z`, `d`, `c`, `v` implementados e listados |
| FR-003 | `passo = e.shiftKey ? 10 : 1`, dividido por `doc.largura`/`doc.altura` — 1px do ARQUIVO, que não muda com o zoom |
| FR-004 | `gestoDeSeta` com janela de 500ms |
| FR-007 a FR-010 | `[`, `]`, `+`, `-`, `0`, `Space` e `altKey` presentes; o zoom por atalho respeita os mesmos limites da roda (0,4 a 4) |
| FR-011 | o `return` sem bloco vem antes do `preventDefault` |
| FR-014 | varredura por `e.key === "<letra>"` devolve zero |
| Build | `build`, `lint` e `test` (45 arquivos, 548 testes) |
