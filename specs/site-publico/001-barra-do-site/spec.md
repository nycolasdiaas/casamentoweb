# Spec 001 — F1: a barra fixa do site publicado (área: site-publico)

**Status:** Pronta para implementação

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
  DEVE terminar com um botão apontando para `#confirmacao` (o `id` que
  `ANCORA_DA_SECAO.rsvp` já produz), escrito **"Confirmar presença"** —
  nunca "RSVP" (regras §6).
- **FR-006:** Quando `rsvp` **não** estiver entre as renderizadas (pacote
  Convite), a barra NÃO PODE mostrar botão nenhum. Oferecer confirmação num
  pacote que não a inclui é vender pelo desenho o que o pacote não dá.
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
- **SC-003:** O último elemento da barra é um `<a href="#confirmacao">` com
  as classes de botão do molde e o texto exato `Confirmar presença`. Atende
  FR-005.
- **SC-004:** Num site de pacote **Convite**, a barra não contém nenhum
  `<a href="#confirmacao">`. Atende FR-006.
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
  o `.enBtnInk` "Confirmar presença".
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
