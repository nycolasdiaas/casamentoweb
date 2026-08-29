# Spec 004 — E9: encaixe e guias no editor de convite (área: painel-casal)

**Status:** Implementada (27/08/2026)

## Contexto

`HANDOFF-editor-convite.md` §5 é o núcleo da tela mais difícil do produto, e o
item de **mover** é literal:

> **Snap** a: centro-H/centro-V do artboard, bordas, e às guias de outros
> elementos (tolerância 6px em coords de tela). Mostrar **guias magenta
> `--mark`** enquanto encaixa.

§9, critério 1, cobra: *"Inserir, mover, redimensionar, rotacionar e editar
texto de um elemento — tudo com snap e guias magenta."* E §10 acrescenta a
regra de acessibilidade: *"Respeitar `prefers-reduced-motion` (sem animação de
snap)."*

`grep -rn "snap\|encaix\|guia\|imã" components/account/convite/` devolve
vazio. O editor arrasta livre. O efeito é o que todo editor sem encaixe tem:
o casal alinha os nomes com a data no olho, erra por 3px, e o convite fica
com um desalinho que ninguém aponta e todo mundo sente — o mesmo argumento
que `Icone.tsx` usa para os tamanhos de ícone.

O que já existe e serve de base: as coordenadas são **fração** e o editor já
converte tela↔documento dividindo pelo `zoom` (`EditorDeConvite.tsx:122-135`),
que é o requisito que §5 do handoff coloca em negrito.

## Escopo

- Encaixe durante o arrasto de um bloco.
- Encaixe durante o redimensionamento.
- As guias visuais enquanto encaixa.
- O comportamento sob `prefers-reduced-motion`.

## Fora de escopo

- Multisseleção (Shift+clique) e caixa envolvente combinada — o handoff §5 a
  pede, mas ela muda o modelo de seleção do editor inteiro e merece spec
  própria.
- Réguas nas bordas do espaço de trabalho (§3 do handoff).
- Atalhos de teclado — `specs/painel-casal/005`.

## Requisitos funcionais

- **FR-001:** Durante o arrasto de um bloco, o editor DEVE calcular candidatos
  de encaixe para três alvos, nesta ordem de prioridade:
  1. centro horizontal e centro vertical do convite;
  2. as quatro bordas do convite;
  3. bordas e centros dos **outros** blocos (esquerda, centro-H, direita,
     topo, centro-V, base).
- **FR-002:** A tolerância DEVE ser **6px em coordenadas de tela** — ou seja,
  `6 / zoom` convertidos para fração antes de comparar. Tolerância em fração
  fixa faria o encaixe ficar frouxo com zoom baixo e impossível com zoom alto.
- **FR-003:** Quando houver encaixe, a posição do bloco DEVE ser **corrigida
  para o alvo** (não apenas sinalizada). Guia que aparece sem grudar é pior
  que guia nenhuma.
- **FR-004:** No máximo **um** encaixe horizontal e **um** vertical valem por
  quadro. Com mais de um candidato dentro da tolerância, vence o de maior
  prioridade (FR-001); empate dentro da mesma prioridade é resolvido pelo
  menor desvio.
- **FR-005:** A guia DEVE ser uma linha de **1px** na cor `var(--c-mark)`,
  atravessando o convite inteiro no eixo do encaixe, desenhada **acima** dos
  blocos e **abaixo** das alças de seleção.
- **FR-006:** A guia DEVE aparecer só enquanto o gesto estiver ativo e sumir
  no `pointerup`. Nunca fica na tela depois de soltar.
- **FR-007:** A guia NÃO PODE ter transição de entrada durante o arrasto. O
  handoff §3 item 10 é explícito: *"sem transição durante o arrasto (segue o
  dedo)"*. A aparição é instantânea.
- **FR-008:** O encaixe DEVE poder ser suspenso segurando **Alt** durante o
  arrasto — o escape que todo editor precisa para posicionar 2px fora do
  alinhamento de propósito.
- **FR-009:** No redimensionamento, o encaixe DEVE valer para a **aresta que
  está sendo movida**, contra os mesmos três alvos de FR-001.
- **FR-010:** Com `prefers-reduced-motion: reduce` e sem
  `data-movimento="ligado"` no `<html>`, o encaixe continua funcionando
  (é precisão, não movimento) e a guia continua aparecendo — o que já não
  existe é animação, então nada muda. O requisito existe para o
  implementador não acrescentar uma.
- **FR-011:** O encaixe NÃO PODE gerar entrada no histórico própria. O
  `useHistorico` já registra **1 entrada por gesto**; o encaixe acontece
  dentro do gesto.
- **FR-012:** No toque (celular), a tolerância DEVE subir para **10px de
  tela** — o dedo cobre o alvo e 6px vira inalcançável.

## Critérios de aceite

- **SC-001:** Com zoom em 100%, arrastar um bloco até 5px do centro horizontal
  do convite gruda o bloco no centro exato
  (`bloco.x + bloco.w / 2 === 0.5`, com tolerância de ponto flutuante) e
  mostra uma guia vertical. Atende FR-001, FR-002, FR-003 e FR-005.
- **SC-002:** Com zoom em 200%, o mesmo gesto a 5px **de tela** ainda gruda —
  ou seja, a tolerância acompanha o zoom. Atende FR-002.
- **SC-003:** Arrastar um bloco de texto até a borda esquerda de outro bloco,
  a 4px, alinha as duas bordas e mostra uma guia vertical na posição delas.
  Atende FR-001 e FR-005.
- **SC-004:** Com o centro do convite e a borda de outro bloco os dois dentro
  da tolerância, vence o centro do convite. Atende FR-004.
- **SC-005:** `getComputedStyle` da guia devolve `background-color` igual a
  `--c-mark` e `width: 1px` (guia vertical). Atende FR-005.
- **SC-006:** Soltar o bloco remove a guia do DOM em menos de um quadro.
  Atende FR-006.
- **SC-007:** `getComputedStyle(guia).transitionDuration` é `"0s"`. Atende
  FR-007.
- **SC-008:** Segurar Alt durante o arrasto move o bloco livremente e não
  desenha guia nenhuma. Atende FR-008.
- **SC-009:** Arrastar a alça direita de um bloco até 4px da borda direita do
  convite alinha a aresta. Atende FR-009.
- **SC-010:** Um arrasto com três encaixes no meio do caminho produz **uma**
  entrada de desfazer. Atende FR-011.
- **SC-011:** `npm run build`, `npm run lint` e `npm run test` passam.
- **SC-012:** Com "reduzir movimento" ligado, o encaixe continua grudando e a guia continua aparecendo; `getComputedStyle(guia).animationName` é `"none"`. Atende FR-010.
- **SC-013:** Num evento de ponteiro com `pointerType === "touch"`, o encaixe acontece a 9px de tela do alvo (e não aconteceria a 9px com mouse). Atende FR-012.

## Impacto em dados

Nenhum. O encaixe muda `x`/`y`/`w` do bloco durante o gesto — os mesmos campos
que o arrasto já muda.

## Referências

- Protótipo: `HANDOFF-editor-convite.md` §5 (mover, redimensionar, tolerância
  de 6px, guias magenta), §8 (`prefers-reduced-motion`, alças de 44px no
  toque), §9 critério 1. `Enlace - E Painel.dc.html` E9, artboard
  `EDITOR · DESKTOP · 1560` — o contorno de seleção em `#b8412c` e as alças.
  `HANDOFF-motion.md` §3 item 10 (*"sem transição durante o arrasto"*).
- Versão atual: `components/account/convite/EditorDeConvite.tsx` (1.417
  linhas — arrasto livre, conversão tela↔documento pelo zoom em `:122-135`),
  `components/account/convite/BlocoNaTela.tsx`,
  `components/account/manage/useHistorico.ts`.
  O encaixe: **não existe — NOVO**.
- SDD do Enlace: §15.1 (o editor de convites), §2 (não-objetivo: editor
  arrasta-e-solta de **layout de site** — o convite é a exceção consciente e
  já existente, não uma reabertura).

## Dependências

- **Depende de** `specs/painel-casal/002-modelo-do-convite` (a decisão de
  modelo).
- Não bloqueia nenhuma outra spec.

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

- **O encaixe virou módulo próprio, `lib/site/inviteSnap.ts`.** O
  `EditorDeConvite` tem 1.400 linhas e nenhuma é testável sem navegador: tudo
  ali é `PointerEvent`. O encaixe é justamente a parte que erra em silêncio —
  gruda no alvo errado, fica frouxo com zoom baixo, ou desenha a guia sem
  corrigir a posição. Separado, é aritmética, e aritmética se confere: 20
  testes, sem navegador nenhum.

- **A tolerância é separada por eixo.** A spec fala em "6px", e o convite não é
  quadrado: 6px na horizontal é `6/1000` de fração, e na vertical `6/1250`.
  Uma tolerância só faria o encaixe vertical ficar 25% mais frouxo que o
  horizontal, e ninguém saberia dizer por quê.

- **O zoom não é dividido duas vezes.** `getBoundingClientRect` já devolve a
  medida COM o zoom aplicado — é o que o comentário da moldura já registrava
  para o arrasto. `toleranciaEmFracao` aceita o zoom como parâmetro, e o editor
  passa `1`.

- **A altura do bloco vem de `alturaAproximada`, a mesma do export em SVG.**
  Encaixar por uma altura e exportar por outra alinharia na tela e sairia torto
  no arquivo — que é exatamente o defeito que o encaixe existe para evitar.

- **FR-011 saiu de graça.** O encaixe acontece DENTRO de `aoMover`, e
  `registrar` só é chamado em `aoSoltar`. Nunca houve chance de o encaixe
  gerar entrada própria no histórico.

## Como cada critério foi conferido

Tudo em `lib/site/inviteSnap.test.ts`, sem navegador — o módulo é puro.

| Critério | Medida |
|---|---|
| SC-001 | a 5px do centro (tolerância 6px), o bloco gruda e `x + w/2 === 0.5`; a 8px, não gruda **e** não desenha guia |
| SC-002 | com zoom 200%, 5px de TELA continuam grudando, e 5px de FRAÇÃO deixam de grudar |
| SC-003 | borda com borda e centro com centro do vizinho, com a guia na posição do alvo |
| SC-004 | centro do convite vence borda de vizinho; borda do convite vence borda de vizinho; empate de prioridade decidido pela menor distância; nunca mais de um encaixe por eixo |
| SC-005, SC-007, SC-012 | a guia é `bg-(--c-mark)` com `width: 1` (vertical) ou `height: 1`, `transition: "none"` explícito, e nenhuma animação declarada |
| SC-006 | `setGuias([])` em `aoSoltar`, no mesmo quadro |
| SC-008 | `e.altKey` sai antes de calcular encaixe: move livre e não desenha guia |
| SC-009 | a aresta direita gruda na borda do convite e na de um vizinho; a esquerda a 1px do centro **não** gruda, porque não é ela que está sendo puxada |
| SC-010 | o encaixe acontece dentro do gesto; `registrar` só em `aoSoltar` |
| SC-011 | `build`, `lint` e `test` (45 arquivos, 548 testes) |
| SC-013 | a 9px de tela o toque gruda e o mouse não |
