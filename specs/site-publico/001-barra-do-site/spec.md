# Spec 001 — F1: a barra fixa do site publicado (área: site-publico)

**Status:** Implementada (26/08/2026)

## Contexto

`Enlace - F Site Casamento.dc.html`, artboard **F1 desktop 1440**, abre o site
do casal com uma barra fixa (`.enSiteNav`): fundo `rgba(242,239,231,.92)`,
`position: sticky; top: 0`, fio de 1px `#d8d0bf`, `padding: 16px 40px`. À
esquerda os nomes do casal em display de 22px; à direita quatro âncoras
(História · O dia · Presentes · Galeria) e o botão de tinta **Confirmar
presença**.

Nenhum dos seis moldes declara `<nav>` ou `sticky`
(`grep -rln "sticky\|<nav" lib/templates/*/sections.tsx` → vazio). O convidado
que abre `/s/<slug>` num casamento com sete seções rola tudo para achar a
lista de presentes, e o CTA de confirmar presença só existe no fim da página.

O SDD §4.4 é o que decide **onde** isto mora: `SectionKey` é a lista fechada
de seções e a barra não é seção — ela é chrome, que atravessa os seis moldes.
O `SiteRenderer` já tem o precedente: `RevealOnScroll`, `PhotoLightbox` e o
invólucro de âncoras (`ANCORA_DA_SECAO`) vivem lá justamente para alcançar os
seis de uma vez, e um molde novo os herda sem saber que existem.

As âncoras que a barra precisa **já existem**: `lib/site/ancoras.ts` mapeia
`SectionKey → id`, e o `SiteRenderer` envolve cada seção com `id` e
`scroll-mt-4`.

## Escopo

- Componente novo `components/site/BarraDoSite.tsx`, montado por
  `SiteRenderer` acima do laço de seções.
- Os itens da barra derivados das seções que **de fato** renderizaram
  (pacote + escolha do casal), nunca de uma lista fixa.
- Comportamento em 480px (celular) e a partir de 1024px (desktop).

## Fora de escopo

- Acrescentar `SectionKey` novo. A barra não é seção e não entra no contrato
  de §4.4.
- Mudar `LINKS_DO_CONVITE` ou `linkDaSecao` em `lib/site/ancoras.ts` — só o
  mapa de âncoras e o mapa de rótulos curtos são tocados (FR-004b, FR-004c).
- A largura do cartão — é `specs/site-publico/002`.
- A barra do convite (`/c/:slug`), que o desenho F3 não tem.
- A faixa preta de "PRÉVIA · só você vê isto" em `/preview/:token`, que já
  existe e continua acima da barra nova.
- Destacar a âncora da seção em que o convidado está durante a rolagem — é o
  que exigiria client component (FR-010).

## Requisitos funcionais

- **FR-001:** `SiteRenderer` DEVE renderizar `<BarraDoSite>` como primeiro
  filho de `.site-canvas`, antes de `TrackView`.
- **FR-002:** A barra DEVE ser `position: sticky; top: 0; z-index: 20`, com
  `background: color-mix(in srgb, var(--paper) 92%, transparent)`,
  `backdrop-filter: blur(8px)`, `border-bottom: 1px solid
  color-mix(in srgb, var(--ink) 14%, transparent)`.
  As cores vêm do `ThemeSpec` do casal (`var(--paper)`, `var(--ink)`) — nenhum
  hex literal, senão `npm run verify:template` reprova.
- **FR-003:** À esquerda DEVE aparecer `content.coupleNames` na fonte de
  display do tema (`var(--font-display)`), 22px no desktop e 17px abaixo de
  1024px.
- **FR-004:** À direita DEVEM aparecer âncoras **apenas** para as seções que o
  `SiteRenderer` de fato renderizou, na ordem em que renderizaram, excluindo
  `cover`, `countdown`, `rsvp` e `footer`.
- **FR-004b:** Os rótulos da barra DEVEM vir de um mapa **novo** e curto,
  `ROTULO_CURTO` em `lib/site/ancoras.ts`, com exatamente estes valores:
  `story` → `História`, `details` → `O dia`, `gallery` → `Galeria`,
  `gifts` → `Presentes`, `guestbook` → `Recados`, `album` → `Álbum`.
  `SECTION_LABELS` **não** serve: ele é o rótulo do painel do casal
  ("Cerimônia e festa", "Lista de presentes", "Mural de recados") e cinco
  rótulos assim não cabem numa barra ao lado dos nomes e do botão.
- **FR-004c:** `ANCORA_DA_SECAO` NÃO TEM entrada para `guestbook`, e o
  `SiteRenderer` cai no `?? key` — o mural do casal hoje responde por
  `#guestbook`. Isso contraria a regra escrita no próprio arquivo ("em
  português de propósito: `#gifts` num convite de casamento brasileiro é
  vazamento de nome interno"). Esta spec DEVE acrescentar
  `guestbook: "recados"` ao mapa. O `id` antigo nunca foi publicado em lugar
  nenhum (`grep -rn "#guestbook" app components lib` → vazio), então a troca
  não quebra link já distribuído.
- **FR-005:** Quando a seção `rsvp` estiver entre as renderizadas, a barra
  DEVE terminar com um botão apontando para `/s/<slug>/recado`, escrito
  **"Recado para os noivos"** — nunca "RSVP" (regras §6).

  > **Revisto em 16/09/2026.** O texto era "Confirmar presença" e o destino,
  > `#confirmacao`. O site nunca confirmou presença: quem confirma abre
  > `/rsvp/<slug>`, o endereço pessoal que chegou no WhatsApp da família. O
  > botão prometia a ação e entregava uma seção que diz "procure a mensagem
  > que enviamos" — e depois que o "não recebi meu link" saiu dessa seção, ele
  > passou a levar a uma caixa cujo único botão é outro. Decisão do dono,
  > vista por ele no celular.
  >
  > É também o único item da barra que não é âncora, e isso é deliberado:
  > rolar até a seção para exigir um segundo toque num botão de mesmo rótulo
  > repetiria o alvo duas vezes na mesma descida.
- **FR-006:** Quando `rsvp` **não** estiver entre as renderizadas (pacote
  Convite), a barra NÃO PODE mostrar botão nenhum. O recado sai de dentro da
  confirmação de presença, e oferecê-lo num pacote que não a inclui é vender
  pelo desenho o que o pacote não dá — a rota `/s/<slug>/recado` aplica a
  mesma recusa do outro lado.
- **FR-007:** Abaixo de 1024px, as âncoras DEVEM virar uma faixa com rolagem
  horizontal (`overflow-x: auto` + `.no-scrollbar`, que já existe em
  `app/globals.css`), e o botão DEVE continuar visível e fixo à direita.
- **FR-008:** A altura da barra DEVE ser **60px** no desktop e **52px** no
  celular, e `scroll-margin-top` de cada seção DEVE passar de `1rem`
  (`scroll-mt-4`) para essa altura + 8px, para o título da seção não ficar
  atrás da barra ao clicar numa âncora.
- **FR-009:** Com menos de **duas** âncoras disponíveis (um site só com capa e
  rodapé), a barra NÃO PODE renderizar. Uma barra de navegação com um item é
  ruído.
- **FR-010:** A barra DEVE ser server component — nenhum `"use client"`. O
  destaque da âncora ativa durante a rolagem **não** entra nesta spec, é o que
  exigiria JS.
- **FR-011:** A barra DEVE aparecer também em `/preview/:token`, porque a
  prévia renderiza pelo mesmo `SiteRenderer` e o casal precisa revisar o que o
  convidado vai ver.

## Critérios de aceite

- **SC-001:** Em `/s/<slug>` de um site "para sempre" com todas as seções
  ligadas, `document.querySelector('.site-canvas > nav')` existe, tem
  `position: sticky` e `top: 0px`. Atende FR-001 e FR-002.
- **SC-002:** A barra contém exatamente as âncoras `#historia`, `#detalhes`,
  `#fotos`, `#presentes`, `#recados`, `#album` — nenhuma para capa, contagem,
  confirmação ou rodapé — e nessa ordem, com os rótulos `História`, `O dia`,
  `Galeria`, `Presentes`, `Recados`, `Álbum`. Atende FR-004 e FR-004b.
- **SC-002b:** `ANCORA_DA_SECAO.guestbook === "recados"` e o invólucro da
  seção do mural em `/s/<slug>` tem `id="recados"`. Atende FR-004c.
- **SC-003:** O último elemento da barra é um `<a href="/s/<slug>/recado">`
  com as classes de botão do molde e o texto exato `Recado para os noivos`, e
  o endereço acompanha o slug do site. Atende FR-005.
- **SC-004:** Num site de pacote **Convite**, a barra não contém nenhum
  `<a>` terminado em `/recado`. Atende FR-006.
- **SC-005:** Desligar História, Galeria e Presentes na aba **Páginas** deixa
  a barra sem renderizar (menos de duas âncoras restantes num pacote Convite).
  Atende FR-009.
- **SC-006:** Clicar em "Presentes" deixa o título da seção de presentes com
  `getBoundingClientRect().top >= 60`. Atende FR-008.
- **SC-007:** Em viewport de 390px, a faixa de âncoras rola na horizontal sem
  barra de rolagem visível, e a página não rola na horizontal
  (`document.documentElement.scrollWidth === document.documentElement.clientWidth`).
  Atende FR-007.
- **SC-008:** `npm run verify:template` passa nos 6 moldes — nenhum hex
  literal entrou na barra. Atende FR-002.
- **SC-009:** `grep -c "use client" components/site/BarraDoSite.tsx` devolve
  `0`. Atende FR-010.
- **SC-010:** A barra aparece em `/preview/<token>` com o mesmo desenho.
  Atende FR-011.
- **SC-011:** `npm run build`, `npm run lint` e `npm run test` passam.
- **SC-012:** O primeiro elemento da barra é `content.coupleNames` com `font-family` resolvendo para `var(--font-display)`, em 22px a 1440px e 17px a 390px. Atende FR-003.

## Impacto em dados

Nenhum. Todos os dados de que a barra precisa (`coupleNames`, seções
habilitadas, `tier`) já chegam ao `SiteRenderer`.

## Referências

- Protótipo: `Enlace - F Site Casamento.dc.html`, F1 desktop 1440 —
  `.enSiteNav` (`position:sticky; top:0; background:rgba(242,239,231,.92);
  border-bottom:1px solid #d8d0bf; padding:16px 40px`), com os quatro links e
  o `.enBtnInk` "Confirmar presença" (rótulo revisto em 16/09/2026 — ver
  FR-005).
- Versão atual: `components/site/SiteRenderer.tsx:40-118` (o laço de seções e
  os três invólucros que já vivem lá), `lib/site/ancoras.ts`
  (`ANCORA_DA_SECAO`), `lib/site/sectionLabels.ts` (`SECTION_LABELS`).
  A barra em si: **não existe — NOVO**.
- SDD do Enlace: §4.4 (`SectionKey` é lista fechada; chrome não é seção),
  §4.5 (gating por pacote — a razão de FR-006), §4.4.1 (cor vem de token,
  nunca hex).

## Dependências

- Depende de `specs/design-system/006-voz-verificavel` (o rótulo "Confirmar
  presença", nunca "RSVP", é regra de voz verificável).
- **Precede** `specs/site-publico/002` (largura): a barra precisa existir
  antes de a largura mudar, senão o desenho de 1440 fica com uma faixa de
  nomes solta no topo.

## Perguntas em aberto

Nenhuma.

## Notas de implementação

**A dependência de `design-system/006` não travou.** Aquela spec está
Bloqueada, mas o que ela carregava para cá era uma regra de voz — nunca
"RSVP", sempre o que o convidado diria. A regra foi cumprida direto e virou
teste próprio (`BarraDoSite.test.tsx`), sem esperar o varredor. O rótulo em si
mudou depois para "Recado para os noivos" (FR-005), sem mexer na regra.

**Correções da spec, encontradas ao implementar:**

- **FR-009 / SC-005 — o botão conta como item.** A spec escreve "menos de duas
  âncoras" e o parêntese dá o exemplo de "um site só com capa e rodapé". Ao
  pé da letra, um site com uma seção e confirmação de presença ficaria sem
  barra — e sem o botão, que é o motivo de a barra existir. A regra
  implementada é: some quando há menos de duas âncoras **e** não há botão.
  SC-005 continua valendo como escrito, porque o exemplo dele é um pacote
  Convite, que não tem confirmação.

- **SC-003, "as classes de botão do molde": não existe uma.** Os seis moldes
  estilizam os próprios CTAs inline (`background: var(--ink); color:
  var(--paper)` em `classico` e `editorial`, e assim por diante) — `.btn` de
  `app/globals.css` é da Prensa, do lado de dentro do painel, e não pode
  atravessar para o site do casal. A barra repete o denominador comum dos
  seis, que é a inversão `--ink` sobre `--paper`. O resto de SC-003 (último
  elemento, `href="#confirmacao"`, texto exato) está conferido.

- **SC-009 conta comentário.** `grep -c "use client"` não distingue diretiva
  de prosa, e o comentário do arquivo explicava justamente por que a barra não
  é client component. O comentário foi reescrito sem a palavra; o critério
  passa pelo motivo certo (`grep -c` devolve `0`).

- **Container query, não media query.** FR-003 e FR-008 falam em "abaixo de
  1024px", mas o corte implementado é `@[700px]` sobre a largura do CARTÃO. É
  a mesma escolha que o `SiteRenderer` já documenta: o site renderiza dentro
  de um `<iframe>` de 390px na prévia do painel, e uma media query leria a
  janela de 1440px e mostraria o desenho de desktop dentro do "modo celular".
  O resultado medido bate com o pedido: 60px/22px no desktop, 52px/17px no
  celular.

**Ajuste que só a medição revelou.** Na primeira versão, a 390px, os nomes do
casal (`shrink-0 truncate` — combinação em que o `truncate` nunca dispara)
tomavam a faixa e sobravam **49px** de âncoras: uma faixa de rolagem onde não
cabe um rótulo inteiro. Com teto de 30% nos nomes, botão compacto no celular
e `gap-3 px-4`, a faixa passou a **96px**, com "História" e "O dia" inteiros
na tela e o resto rolando.

## Como cada critério foi conferido

Medido no navegador com o `next build` servido em `localhost:3000` (dev serve
CSS velho — Skill `cache-e-build`), no site de demonstração `ana-e-pedro`:

| Critério | Medida |
|---|---|
| SC-001 | `.site-canvas` tem `NAV` como primeiro filho; `position: sticky`, `top: 0px`, `z-index: 20` |
| SC-002 | `#historia História`, `#detalhes O dia`, `#fotos Galeria`, `#presentes Presentes`, `#recados Recados`, `#album Álbum` — nessa ordem, sem `#inicio`, `#contagem`, `#confirmacao` nem `#final` |
| SC-002b | `ANCORA_DA_SECAO.guestbook` devolve `recados`; os `id` da página são `inicio, contagem, historia, detalhes, fotos, confirmacao, presentes, recados, album, final` |
| SC-003 | último filho: `A` · `/s/<slug>/recado` · `Recado para os noivos` |
| SC-004 | teste de unidade com as seções do pacote Convite: nenhum `a[href$="/recado"]` |
| SC-005 | teste de unidade: uma âncora e sem botão, e a barra não renderiza |
| SC-006 | clicar em "Presentes" deixa a seção em `top: 68px` e o título em `221px` (`scroll-margin-top: 68px`) |
| SC-007 | a 390px reais (emulação de aparelho): `scrollWidth` e `clientWidth` iguais a 390; faixa com `overflow-x: auto`, 332px de conteúdo em 96px visíveis, barra de rolagem com 0px de altura; botão inteiro na tela |
| SC-008 | `verify:template` nos 6 moldes: 54 verificações `ok`, nenhuma falha. Mais um teste que reprova qualquer hex literal no arquivo |
| SC-009 | `grep -c "use client" components/site/BarraDoSite.tsx` devolve `0` |
| SC-010 | `/preview/<token>`: a barra existe, começa em `39px` (abaixo da faixa de prévia) e gruda em `0px` ao rolar |
| SC-011 | `build`, `lint` e `test` (34 arquivos, 397 testes) |
| SC-012 | 1440px: 22px em `Cormorant Garamond` (o `--font-display` do tema). 390px: 17px |
