# Spec 005 — B4–B9: a galeria de estilos (área: site-publico)

**Status:** Pronta para implementação

## Contexto

`Enlace - B Vitrine.dc.html`, bloco **B4–B9**, é explícito sobre o que
desenha: *"Seis rotas, uma página. Cada estilo é um tema que veste o mesmo
conteúdo — os cards abaixo são o hero de cada rota. O painel de detalhe (à
direita) abre ao escolher um estilo."*

O artboard mostra a barra da vitrine, o cabeçalho `SEIS ESTILOS` /
`O mesmo amor, seis vestidos.` e uma **grade de 6 cartões** (200px de hero
cada, com o nome do estilo, três palavras de caráter — "serifa · dourado ·
simétrico" — e um link "Ver →"). O Editorial vem marcado `A CASA` com borda de
1,5px. Ao lado, o **painel de detalhe**: nome grande, um parágrafo, a tabela
Títulos / Texto / Paleta, e o botão `Usar este estilo`.

O que existe em `/pacotes/estilos/<id>` é outra coisa e é boa: a **prévia
inteira** do site fictício naquele estilo (5.121 linhas somadas nos seis), com
`TemplateChrome` no topo oferecendo troca de modelo em pílulas e troca de
pacote. O SDD §4.4.1 preserva essas prévias de propósito: *"elas são a vitrine
com casal fictício, onde inventar contexto é justamente o trabalho."*

Portanto isto **não é uma substituição**. A prévia continua onde está; o que
falta é a **porta de entrada** — a tela que o casal vê antes de escolher qual
prévia abrir. Hoje a home tem uma faixa com três estilos e um link
"Ver todos os estilos →", e esse link não tem para onde ir.

## Escopo

- Rota nova `app/pacotes/estilos/page.tsx` — a galeria dos seis, com o painel
  de detalhe.
- Ligar o "Ver todos os estilos →" da home a ela.
- Ligar o "← Pacotes" do `TemplateChrome` de volta a ela.

## Fora de escopo

- Qualquer alteração em `app/pacotes/estilos/<id>/page.tsx` (as seis prévias).
  SDD §4.4.1 as preserva.
- A pílula de troca de modelo do `TemplateChrome`, que continua servindo quem
  já está dentro de uma prévia.
- `/pacotes` — é `specs/site-publico/003`.

## Requisitos funcionais

- **FR-001:** DEVE existir `app/pacotes/estilos/page.tsx`, respondendo 200 em
  `/pacotes/estilos`, com `metadata.title = "Estilos | Enlace"`.
- **FR-002:** A página DEVE usar a casca da vitrine (`AccountNav` + rodapé
  oliva) e o conteúdo dentro de `.trilho`.
- **FR-003:** O cabeçalho DEVE ser: rótulo `meta` em `--c-mark` com o texto
  `SEIS ESTILOS`; `<h1 class="t-d1">` com `O mesmo amor, seis vestidos.`; e a
  linha de apoio `Escolha o clima. O conteúdo é seu; o estilo troca com um
  clique.` — os três centralizados.
- **FR-004:** A grade DEVE ter 3 colunas a partir de 1024px, 2 entre 640 e
  1024, e 1 abaixo, com `gap: 20px`, e listar os seis estilos na ordem de
  `TEMPLATE_STYLES` (`lib/templates.ts`).
- **FR-005:** Cada cartão DEVE ter: uma área de hero de **200px** de altura
  pintada com o `defaultTheme.palette` do molde correspondente (via
  `getTemplate(id).defaultTheme`), mostrando `Ana & João` na
  `defaultTheme.fonts.display` daquele molde; e, abaixo do fio, o nome do
  estilo em `t-display` de 19px, a linha de caráter em `meta`, e um link
  `Ver →`.
- **FR-006:** A cor e a fonte de cada cartão DEVEM vir de
  `getTemplate(id).defaultTheme` — nunca de hex escrito na galeria. É a mesma
  regra de §4.4.1: se o preset do molde mudar, o cartão muda junto.
- **FR-007:** O cartão do Editorial DEVE ter `border: 1.5px solid var(--c-ink)`
  e a etiqueta `A CASA` em `--c-mark` no canto superior direito. Os outros
  cinco, `border: 1px solid var(--c-rule)`.
- **FR-008:** A linha de caráter DEVE vir de um campo novo em
  `lib/templates.ts` (`TemplateStyle.carater: string`), com estes seis
  valores literais, tirados do artboard:
  Clássico → `serifa · dourado · simétrico`;
  Editorial → `grotesk · alto contraste`;
  Toscana → `terracota · sol · rústico`;
  Romântico → `blush · script · suave`;
  Moderno → `sans · preto e branco · limpo`;
  Film → `grão · mudo · cinematográfico`.
- **FR-009:** O painel de detalhe DEVE ser uma coluna à direita a partir de
  1024px, mostrando o estilo apontado por `?estilo=<id>` na URL, com padrão
  `editorial`. Abaixo de 1024px ele DEVE ficar `display: none` (classe
  `hidden lg:block`) — num celular ele empurraria a grade para baixo da
  dobra, e ali o cartão já leva direto à prévia. Fica no DOM, e depois da
  grade na ordem de leitura, para não atrapalhar leitor de tela.
- **FR-010:** O painel de detalhe DEVE carregar `data-painel-estilo` e conter: rótulo `ESTILO` em `meta`; o
  nome em `t-d1`; a descrição (`TemplateStyle.description`, que já existe);
  três linhas de dado (`Títulos` → nome da fonte de display,
  `Texto` → nome da fonte de corpo, `Paleta` → três quadrados de 16px com
  `outer`, `ink` e `accent` do `defaultTheme`); e o botão
  `.btn-ink` escrito `Ver este estilo`.
- **FR-011:** O botão do painel DEVE levar a
  `/pacotes/estilos/<id>` — a prévia real. O rótulo é `Ver este estilo` e não
  `Usar este estilo` (o artboard): "usar" promete escolher, e o casal só
  escolhe dentro do questionário. Prometer escolha aqui e cair numa prévia é
  o tipo de mentira que Voz V4 chama de botão que descreve o conceito em vez
  da ação.
- **FR-012:** O link `Ver todos os estilos →` de `app/page.tsx` DEVE apontar
  para `/pacotes/estilos`.
- **FR-013:** O link `← Pacotes` de `TemplateChrome.tsx:178` DEVE apontar para
  `/pacotes/estilos` — hoje ele aponta para `/` e o rótulo mente sobre o
  destino.
- **FR-014:** A página DEVE ser server component, sem `"use client"`. A
  seleção do painel viaja pela URL (`?estilo=`), não por estado.
- **FR-015:** `?estilo=` com valor fora de `TEMPLATE_STYLES` DEVE cair no
  padrão `editorial`, nunca dar erro.

## Critérios de aceite

- **SC-001:** `curl -sI /pacotes/estilos` devolve `200`. Atende FR-001.
- **SC-002:** O HTML contém `O mesmo amor, seis vestidos.` e `SEIS ESTILOS`.
  Atende FR-003.
- **SC-003:** A grade tem exatamente 6 cartões, com os nomes `Clássico`,
  `Editorial`, `Toscana`, `Romântico`, `Moderno` e `Film`. Atende FR-004.
- **SC-004:** O cartão do Toscana tem `background` igual a
  `getTemplate("toscana").defaultTheme.palette.paper`, verificável comparando
  `getComputedStyle` com o valor do módulo. Trocar o preset do Toscana em
  `lib/templates/toscana/index.ts` muda o cartão sem tocar na galeria. Atende
  FR-005 e FR-006.
- **SC-005:** Exatamente um cartão tem a etiqueta `A CASA`, e é o do
  Editorial. Atende FR-007.
- **SC-006:** `/pacotes/estilos?estilo=film` mostra no painel o nome `Film`,
  a fonte de títulos do preset do Film, e três quadrados de cor iguais a
  `outer`/`ink`/`accent` daquele preset. Atende FR-009 e FR-010.
- **SC-007:** `/pacotes/estilos?estilo=inexistente` mostra o Editorial no
  painel, com HTTP 200. Atende FR-015.
- **SC-008:** O botão do painel aponta para `/pacotes/estilos/film` e está
  escrito `Ver este estilo`. Atende FR-011.
- **SC-009:** Em viewport de 390px,
  `getComputedStyle(document.querySelector('[data-painel-estilo]')).display`
  é `"none"`, e o painel vem **depois** da grade em
  `document.body.textContent`. Em 1440px o mesmo `display` é `"block"`.
  Atende FR-009.
- **SC-010:** `grep -n "Ver todos os estilos" app/page.tsx` mostra o `href`
  como `/pacotes/estilos`. Atende FR-012.
- **SC-011:** `grep -n "← Pacotes" components/templates/TemplateChrome.tsx`
  mostra o `href` como `/pacotes/estilos`. Atende FR-013.
- **SC-012:** `grep -c "use client" app/pacotes/estilos/page.tsx` devolve `0`.
  Atende FR-014.
- **SC-013:** `npm run build`, `npm run lint` e `npm run test` passam, e
  `lib/templates/registry.test.ts` continua verde com o campo `carater` novo.
- **SC-014:** A grade tem 3 colunas a 1440px, 2 a 768px e 1 a 390px, com `gap: 20px`, e a ordem dos seis cartões é a de `TEMPLATE_STYLES`. Atende FR-004 e FR-002.
- **SC-015:** `TEMPLATE_STYLES.every(t => typeof t.carater === "string" && t.carater.length > 0)` é verdadeiro, e o cartão do Film mostra `grão · mudo · cinematográfico`. Atende FR-008.

## Impacto em dados

Nenhum no banco. O campo `carater` é acrescentado ao **tipo**
`TemplateStyle` em `lib/templates.ts` (constante em código), não a nenhuma
tabela.

## Referências

- Protótipo: `Enlace - B Vitrine.dc.html`, bloco **B4–B9** — a frase que
  define a tela ("Seis rotas, uma página"), o artboard `GALERIA · DESKTOP ·
  1440` com os 6 cartões, o artboard `DETALHE · /estilos/editorial · DESKTOP`
  com a tabela Títulos/Texto/Paleta, e o artboard `GALERIA · MOBILE · 390`.
- Versão atual: `app/pacotes/estilos/<id>/page.tsx` (as seis prévias, que
  ficam), `components/templates/TemplateChrome.tsx:168-215` (o seletor em
  pílulas), `app/page.tsx` (a faixa de três estilos com o link solto),
  `lib/templates.ts` (`TEMPLATE_STYLES`), `lib/templates/registry.ts`
  (`getTemplate`). A galeria em si: **não existe — NOVO**.
- SDD do Enlace: §4.4.1 (as prévias com casal fictício são preservadas),
  §4.2 (`defaultTheme` é a fonte da cor do cartão).

## Dependências

- Depende de `specs/design-system/006-voz-verificavel` (o texto do cabeçalho e
  as seis linhas de caráter são strings novas).
- Não bloqueia nenhuma outra spec.

## Perguntas em aberto

Nenhuma.
