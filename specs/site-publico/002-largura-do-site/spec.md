# Spec 002 — F1: a largura do site publicado no desktop (área: site-publico)

**Status:** Rejeitada (27/08/2026) — **Opção C**: a divergência do cartão fica assumida
que o trabalho não é o que FR-001 descrevia. Falta decisão do dono, não medida.

## Contexto

`Enlace - F Site Casamento.dc.html` desenha F1 em **1440px de largura cheia**:
o hero sangra de borda a borda (560px de altura), a história é uma grade de
duas colunas com a foto ocupando metade da tela, a faixa da contagem é uma
faixa oliva de borda a borda, e a galeria é `repeat(4, 1fr)`.

`components/site/SiteRenderer.tsx:70` entrega
`max-w-[480px] lg:max-w-[1120px]`. O comentário logo acima explica a decisão
com clareza: 480px é o desenho do celular, que é de onde o convidado abre o
link do WhatsApp, e a largura cresce em `lg` para o site não virar "um
telefone encalhado no meio da tela". O `@container` (e não media query) existe
porque o site renderiza dentro de um `<iframe>` na prévia do painel.

Ou seja: **a decisão de crescer já foi tomada e implementada; o que divergiu
parecia ser só o número.** A medição abaixo mostrou que não é.

## Escopo

- O valor de `max-width` do `.site-canvas` em `SiteRenderer`.
- A revisão das variantes `lg:` das seções dos seis moldes no valor novo.
- As duas regras globais de `app/globals.css` que existem justamente para o
  widescreen (`.site-canvas p { max-width: 70ch }` e
  `.site-canvas [class*="aspect-"] { max-height: 74vh }`).

## Fora de escopo

- A barra fixa — é `specs/site-publico/001` e **precede** esta.
- O desenho de celular (480px), que o protótipo confirma e não muda.
- `/c/:slug` (convite), que tem medida própria (`doc.largura`/`doc.altura`).
- Qualquer mudança em `SectionKey` ou na ordem das seções.

## Requisitos funcionais

- **FR-001:** ~~`.site-canvas` DEVE passar de `lg:max-w-[1120px]` para
  `lg:max-w-[1440px]`.~~ **Retirado pela medição de 25/08/2026:** trocar o
  número afasta o que é centralizado e estica o que sangra, sem redesenhar
  nada, e custa 8% de altura. O requisito que substitui este depende da
  decisão da pergunta em aberto 1.
- **FR-002:** O ponto de virada DEVE continuar sendo o `@container`, nunca
  media query. Media query leria a janela e mostraria o desenho de desktop
  dentro do "modo celular" da prévia do painel, onde o quadro tem 390px e a
  janela tem 1440.
- **FR-003:** `app/globals.css` DEVE manter `.site-canvas p { max-width:
  70ch }`. **Medido:** ele já segura o parágrafo em 700–840 px a 1440, nos
  seis moldes — este requisito protege o que existe, não acrescenta nada.
- **FR-004:** `app/globals.css` DEVE manter
  `.site-canvas [class*="aspect-"] { max-height: 74vh }` — a 1440px um
  `aspect-[3/4]` pediria 1920px de altura.
- **FR-005:** Nos seis moldes, nenhuma seção pode passar a rolar na
  horizontal a 1440px: para cada molde,
  `document.querySelector('.site-canvas').scrollWidth` DEVE ser igual a
  `clientWidth`.
- **FR-006:** A galeria DEVE mostrar **4 colunas** a partir de 1024px em todos
  os seis moldes — é a única medida de grade que o protótipo desenha
  explicitamente (`grid-template-columns:repeat(4,1fr)` em F1).
- **FR-007:** Nenhum hex literal pode entrar nas seções durante o ajuste:
  `npm run verify:template` DEVE continuar passando nos seis.
- **FR-008:** A comparação DEVE ser feita com `npm run shot:template` antes e
  depois, em 1440px e 390px, para os seis moldes. As duas capturas de 390px
  DEVEM ser **idênticas** — nenhuma mudança pode vazar para o celular.

## Critérios de aceite

- **SC-001:** *(suspenso junto com FR-001 — ver a medição)*.
- **SC-002:** `grep -c "@container" components/site/SiteRenderer.tsx` devolve
  no mínimo `1`. Atende FR-002.
- **SC-003:** As duas regras de FR-003 e FR-004 continuam em
  `app/globals.css` (`grep -c "70ch" app/globals.css` ≥ 1 e
  `grep -c "74vh" app/globals.css` ≥ 1).
- **SC-004:** Para cada um dos seis moldes, em viewport de 1600px:
  `scrollWidth === clientWidth` no `.site-canvas`. Atende FR-005.
  **Já verificado em 25/08/2026 a 1440, nos 12 casos (hoje e forçado).**
- **SC-005:** Para cada um dos seis moldes, a grade da galeria a 1440px tem
  4 colunas (`getComputedStyle(grade).gridTemplateColumns` com 4 valores).
  Atende FR-006.
- **SC-006:** `npm run verify:template` passa nos 6. Atende FR-007.
- **SC-007:** `npm run shot:template` em 390px produz imagens byte-a-byte
  iguais às de antes da mudança, nos 6 moldes. Atende FR-008.
- **SC-008:** `npm run build`, `npm run lint` e `npm run test` passam.

## Impacto em dados

Nenhum.

## Referências

- Protótipo: `Enlace - F Site Casamento.dc.html`, F1 — artboard
  `DESKTOP · 1440`, com hero de 560px, história em
  `grid-template-columns:1fr 1fr`, faixa de contagem de borda a borda e
  galeria em `repeat(4,1fr)`. `README.md` do pacote, §4: *"Largura cheia
  obrigatória."*
- Versão atual: `components/site/SiteRenderer.tsx:70`
  (`max-w-[480px] lg:max-w-[1120px]`), `app/globals.css:330-360` (as regras
  de widescreen), `lib/templates/*/sections.tsx` (as variantes `lg:`).
- SDD do Enlace: §4.4.1 ("as seções crescem por variantes `lg:` na marcação de
  cada molde"), §4.4 (contrato de seção).

## Dependências

- **Depende de** `specs/site-publico/001` (barra fixa). A ordem importa: a
  1440 sem barra, o topo do site fica com um hero cheio e nada que ancore a
  navegação; e a barra precisa ser revista na largura final de qualquer forma.
- Não bloqueia nenhuma outra spec.

## A medição — feita em 25/08/2026

A pergunta em aberto original ("falta medir") **foi respondida**. Os seis
moldes foram renderizados a 1440 duas vezes: como estão hoje (cartão de 1120)
e com o cartão forçado a 1440 por CSS injetado no navegador — sem alterar
código. Site descartável criado e apagado no mesmo script, nenhum dado de
cliente tocado.

| Molde | Cartão hoje | Forçado a 1440 | Estouro horizontal | Altura total | Maior parágrafo |
|---|---|---|---|---|---|
| editorial | 1120 px | 1440 px | **nenhum** (scroll 1440 = janela 1440) | 6859 → **7385** (+526) | 770 px nos dois |
| classico | 1120 px | 1440 px | nenhum | 5934 → **6186** (+252) | 770 px nos dois |
| toscana | 1120 px | 1440 px | nenhum | 6967 → **7435** (+468) | 700 px nos dois |
| romantico | 1120 px | 1440 px | nenhum | 5835 → **5935** (+100) | 840 px nos dois |
| moderno | 1120 px | 1440 px | nenhum | 4655 → **4950** (+295) | 770 px nos dois |
| film | 1120 px | 1440 px | nenhum | 6756 → **7212** (+456) | 700 px nos dois |

**As capturas não foram versionadas** — são 12 PNGs de ~1,5 MB, e o que
sustenta os requisitos é a tabela acima, que é reproduzível. Para refazer as
imagens de "hoje", com o servidor de desenvolvimento no ar:

```
npm run shot:template <pasta> classico editorial toscana romantico moderno film
```

Para refazer a coluna "forçado a 1440", o mesmo caminho com esta regra
injetada no navegador depois do carregamento — **nunca no código**:

```css
@media (min-width: 1024px) { .site-canvas { max-width: 1440px !important } }
```

**Três coisas ficaram provadas, e uma delas muda o escopo desta spec.**

1. **Nada quebra.** Nenhum molde estoura na horizontal a 1440, nos 12 casos.
   FR-005 já passaria hoje.
2. **A linha de leitura já está protegida.** O `.site-canvas p { max-width:
   70ch }` do `globals.css` segura o parágrafo em 700–840 px **nos dois
   modos** — alargar o cartão não estica uma linha sequer. FR-003 é redundante
   com o que já existe, não um requisito novo.
3. **Alargar deixa o site MAIS ALTO, não mais largo** — de +100 px (romântico)
   a +526 px (editorial), ou 8% no pior caso. E, olhando as capturas, o motivo
   é o que invalida FR-001:

   > **As seções centralizadas não crescem junto com o cartão.** No editorial,
   > a capa inteira (as duas miniaturas, a data `22 · 05 · 27`, a foto do
   > centro e a legenda) fica **exatamente do mesmo tamanho** a 1120 e a 1440 —
   > ela só ganha 160 px de ar de cada lado. Já a faixa da contagem, que sangra
   > de borda a borda, cresce e melhora. A foto da história cresce de ~740 para
   > ~1000 px e passa a dominar a tela.

   Ou seja: trocar o número **não redesenha nada**. Ele afasta o que é
   centralizado e estica o que sangra, sem critério — que é a definição de
   layout que cresceu por acidente.

## Perguntas em aberto

1. **A divergência real não é "1120 contra 1440". É "cartão com letterbox"
   contra "site de largura cheia".** O artboard F1 não tem faixa de `--outer`
   nenhuma: o site ocupa a janela inteira, de borda a borda. O produto
   renderiza um **cartão centralizado** sobre `background: var(--outer)`
   (`SiteRenderer.tsx:60`), e a 1440 numa janela de 1600 ainda sobrariam 80 px
   de cinza de cada lado.

   Enquanto o cartão existir, **nenhum número o faz virar o desenho F1.** As
   saídas são três, e a escolha é do dono porque muda o que o site é:

   - **Opção A — manter o cartão e só afastar o teto.** É o que FR-001 dizia.
     Custo baixo, ganho baixo: pela medição, o site fica 8% mais alto e a capa
     continua do mesmo tamanho, com mais ar em volta. **Não recomendo** —
     paga altura sem entregar o desenho.
   - **Opção B — o cartão vira largura cheia, e cada seção decide o que
     sangra.** É o desenho F1 de verdade: hero e contagem de borda a borda,
     conteúdo de texto no trilho interno. Custo alto: são **seis moldes × ~9
     seções**, cada uma decidindo entre sangrar e centralizar. É redesenho,
     não ajuste de token, e o protótipo **desenha só um deles** (F1 não diz o
     que o Toscana ou o Film fazem a 1440).
   - **Opção C — assumir a divergência.** O cartão de 1120 fica, registrado
     como decisão consciente: ele já resolveu o defeito que existia ("um
     telefone encalhado no meio da tela") e a medição mostra que a linha de
     leitura e o estouro horizontal estão sob controle.

2. **Se for a Opção B, quem desenha as outras cinco?** O protótipo entrega F1
   num estilo só. Levar isso aos seis exige ou uma decisão de que todos
   sangram igual, ou cinco desenhos que não existem. **Decisão do dono.**

3. **O número, se houver um:** o `README.md` §4 do pacote diz "conteúdo máx.
   **1504**" (a `.trilho` da plataforma) e o artboard F1 é desenhado a
   **1440** — que é a largura da janela do mockup, moldura de navegador
   incluída. Os dois números não são o mesmo número, e o desenho não diz qual
   vale para o site do convidado.

## Decisão registrada — 27/08/2026

**Opção C: assumir a divergência. O cartão de 1120 fica.**

As outras duas se eliminaram sozinhas, e a própria spec já dizia isso:

- **Opção A** (manter o cartão e afastar o teto) — a spec escreve
  *"não recomendo"*. A medição de 25/08 mostrou o custo: o site fica ~8% mais
  alto, a capa continua do mesmo tamanho, e só sobra mais ar em volta. Paga
  altura sem entregar o desenho.
- **Opção B** (largura cheia de verdade) — **é redesenho, não ajuste**. Seis
  moldes × ~9 seções, cada uma decidindo entre sangrar e centralizar. E o
  protótipo desenha **um** deles: F1 não diz o que o Toscana ou o Film fazem a
  1440. Fazer B exigiria ou decidir que todos sangram igual, ou cinco desenhos
  que não existem.

**O que sustenta a Opção C**, e não é resignação: o cartão já resolveu o
defeito que existia — *"um telefone encalhado no meio da tela"* —, a medição
mostrou que a linha de leitura está protegida pela regra de 70ch, e não há
estouro horizontal em largura nenhuma. A divergência é entre um desenho e um
produto que funciona.

**O que reabre isto:** cinco desenhos. No dia em que existir F1 para os seis
moldes, a Opção B volta à mesa com o custo conhecido — e não antes, porque sem
eles a decisão seria minha e não sua.

**Fica também a pergunta 3 sem resposta, e ela não tem custo:** o `README.md`
do pacote diz 1504 e o artboard é desenhado a 1440 (a largura da janela do
mockup, moldura de navegador incluída). Os dois números não são o mesmo número,
e o desenho não diz qual vale para o site do convidado.
