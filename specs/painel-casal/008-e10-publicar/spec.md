# Spec 008 — E10: a tela de publicar (área: painel-casal)

**Status:** Pronta para implementação — com **[CONFLITO COM DECISÃO EXISTENTE
— REQUER APROVAÇÃO]** na parte do checkout, que fica fora dos requisitos.

## Contexto

`Enlace - E Painel.dc.html`, artboard **E10**, é a tela onde o casal decide
pagar. Ela tem quatro peças, e o produto hoje tem duas:

| Peça do artboard | Situação |
|---|---|
| 10.1 · Faixa "Seu site está pronto — e ainda invisível para os convidados", com o endereço e o botão `Publicar site →` | **não existe** |
| 10.1 · Miniatura da prévia com a **marca d'água diagonal** `PRÉVIA · PRÉVIA` em `rgba(184,65,44,.16)`, rotacionada −18° | **não existe no painel** (existe dentro do site renderizado, em `SiteFromView.tsx:131`) |
| 10.1 · Cartão de preço (`PAGAMENTO ÚNICO` · nome do pacote · valor · `uma vez · sem mensalidade` · botão `Pagar e publicar` · `Pix ou cartão · pagamento seguro`) | **existe** — `PaymentButton.tsx` |
| 10.1 · Cartão "O QUE MUDA AO PUBLICAR" com quatro linhas | **não existe** |
| 10.2 · Checkout com QR Pix, copia-e-cola, resumo e "Aguardando pagamento…" | **[CONFLITO]** — cancelado pelo dono: o checkout é do AbacatePay |
| 10.2 · Tela `Seu site está no ar!` com selo verde e dois botões | **não existe** |

O produto hoje mostra, em `/conta/pedidos/<id>`: o `ProofStamp` (o carimbo de
estado), o `OrderStatusTracker` (a esteira), o `LivePreview` (a prévia num
iframe) e o `PaymentButton`. A informação está lá; o **momento** não está. O
casal com o site em prévia não vê, em nenhum lugar da tela, a frase que
resolve a dúvida dele: *isto já está no ar?*

O conflito do checkout é registrado e não vira requisito. `regras-de-negocio.md`
§2.1 sustenta a decisão do dono: um checkout próprio significaria manter tela
de pagamento, tratar estados de cobrança e responder por eles — trabalho por
venda que o produto existe para não ter. O AbacatePay já faz isso, e os três
caminhos de confirmação do SDD §7.2 já fecham o funil.

## Escopo

- A faixa de "pronto e invisível" acima da prévia, em `/conta/pedidos/<id>`.
- A marca d'água sobre a miniatura da prévia no painel.
- O cartão "O que muda ao publicar".
- A tela/estado `Seu site está no ar!` depois de publicar.

## Fora de escopo

- **O checkout embutido (10.2).** Registrado como conflito; ver "Perguntas em
  aberto".
- `PaymentButton.tsx` e o fluxo de cobrança, que ficam como estão.
- `lib/site/publish.ts` e os três caminhos de publicação (SDD §7.2).
- A animação da troca prévia → no ar, que é
  `specs/design-system/005-publicar-no-ar` e **precede** esta.

## Requisitos funcionais

- **FR-001:** Quando `site.status !== "published"` e o site existir, a tela
  DEVE mostrar, **acima** do `LivePreview`, uma faixa `surface-raised` com
  `border-left: 3px solid var(--c-ink)` contendo: um ícone `cadeado` de 17px
  num círculo de 34px; o título `Seu site está pronto — e ainda invisível para
  os convidados.`; a linha de apoio
  `A prévia é de vocês para revisar à vontade. O endereço {endereço} só entra
  no ar depois do pagamento.`; e o botão `.btn-ink` escrito `Publicar site →`.
- **FR-002:** O `{endereço}` de FR-001 DEVE ser o endereço real que o site
  terá (`enderecoDoSite(base, site.slug)` sem esquema, como
  `linkSemEsquema` já faz na aba Compartilhar) — nunca um exemplo.
- **FR-003:** O botão `Publicar site →` DEVE rolar até o `PaymentButton`
  (âncora `#pagar`), não abrir tela nova. A decisão de pagar já mora ali, e um
  segundo caminho de pagamento é um segundo lugar para manter.
- **FR-004:** A miniatura do `LivePreview` DEVE receber, enquanto
  `site.status !== "published"`, uma marca d'água sobreposta: texto
  `PRÉVIA · PRÉVIA` em mono, `letter-spacing: .4em`,
  `color: color-mix(in srgb, var(--c-mark) 16%, transparent)`,
  `transform: rotate(-18deg)`, `pointer-events: none`, centralizada.
- **FR-005:** A marca d'água DEVE ser irmã do iframe, **não** injetada dentro
  dele. O iframe carrega `/preview/<token>`, que é outra origem lógica e já
  tem a sua própria marca.
- **FR-006:** A marca d'água DEVE carregar `aria-hidden="true"` — ela é
  redundante com o texto da faixa de FR-001, e um leitor de tela anunciando
  "PRÉVIA PRÉVIA" no meio da página é ruído.
- **FR-007:** Ao lado do cartão de preço DEVE haver um cartão
  `surface-flat` com o rótulo `O QUE MUDA AO PUBLICAR` em `meta` e quatro
  linhas — as três primeiras com o ícone `check` em `--c-ok`, a quarta com um
  ponto neutro:
  1. `O endereço entra no ar para os convidados`
  2. `A marca d'água de prévia some`
  3. `Convites e confirmação de presença ativam`
  4. `Vocês podem continuar editando depois de publicar`
- **FR-008:** A linha 3 de FR-007 DEVE ser omitida quando o pacote não incluir
  a seção `rsvp` (`tierAllowsSection(tier, "rsvp")` falso). Prometer
  confirmação de presença num pacote Convite é vender o que não foi comprado.
- **FR-009:** Quando `site.status === "published"`, a faixa de FR-001, a marca
  d'água de FR-004 e o cartão de FR-007 NÃO PODEM renderizar.
- **FR-010:** Quando `site.status === "published"` **e** a tela tiver chegado
  com `?publicado=1` (o sinal de `specs/design-system/005-publicar-no-ar`), a
  tela DEVE mostrar, no topo, um bloco centralizado com: círculo de 56px em
  `--c-ok` com o ícone `check` em branco; `<h2 class="t-d1">Seu site está no
  ar!</h2>`; a linha `Pagamento confirmado. {endereço} já pode ser
  compartilhado com os convidados.`; a etiqueta `.etiqueta-noar` escrita
  `No ar`; e dois botões — `.btn-ink` `Copiar link do site` e `.btn-quiet`
  `Enviar convites` (que leva a `/conta/pedidos/<id>/convites`).
- **FR-011:** O bloco de FR-010 DEVE sumir na navegação seguinte, junto com o
  `?publicado=1` que `005` remove por `history.replaceState`. Ele é a
  comemoração de um momento, não um estado permanente da tela.
- **FR-012:** Nenhum texto desta tela pode prometer prazo. `Publicar site →`,
  `Pagar e publicar` e `Seu site está no ar!` descrevem ação e resultado; nada
  pode dizer "em breve", "aguarde" ou "assim que possível"
  (`regras-de-negocio.md` §2.2).

## Critérios de aceite

- **SC-001:** Num pedido em `preview_ready`, a tela mostra a faixa com o texto
  exato de FR-001 e com o endereço real do site. Atende FR-001 e FR-002.
- **SC-002:** Clicar em `Publicar site →` leva o foco ao `PaymentButton` sem
  mudar de rota (`location.pathname` inalterado). Atende FR-003.
- **SC-003:** A marca d'água está no DOM como irmã do `<iframe>`, com
  `transform: rotate(-18deg)`, `pointer-events: none` e `aria-hidden="true"`.
  Atende FR-004, FR-005 e FR-006.
- **SC-004:** O cartão "O QUE MUDA AO PUBLICAR" tem 4 linhas num pedido
  **Para Sempre** e 3 num pedido **Convite**. Atende FR-007 e FR-008.
- **SC-005:** Num pedido `published`, `document.body.textContent` não contém
  `ainda invisível para os convidados` nem `O QUE MUDA AO PUBLICAR`, e não há
  marca d'água. Atende FR-009.
- **SC-006:** Chegando com `?publicado=1` num pedido `published`, a tela
  mostra `Seu site está no ar!`, a etiqueta `No ar` e os dois botões. Atende
  FR-010.
- **SC-007:** Navegar para outra aba e voltar não mostra mais o bloco de
  FR-010. Atende FR-011.
- **SC-008:** `Copiar link do site` copia o endereço sem esquema e dispara o
  brinde `Link copiado.`. Atende FR-010.
- **SC-009:** `npx vitest run lib/voz/vocabulario.test.ts` passa sobre
  `app/conta/pedidos/[id]/page.tsx`. Atende FR-012.
- **SC-010:** `npm run build`, `npm run lint` e `npm run test` passam, com
  `lib/site/publish.test.ts` intacto.

## Impacto em dados

Nenhum. Todos os estados vêm de `site.status`, `order.paymentStatus` e do
parâmetro `?publicado=1`.

## Referências

- Protótipo: `Enlace - E Painel.dc.html` **E10** — artboards
  `PRÉVIA PRONTA · AINDA NÃO PAGO · DESKTOP · 1440` (a faixa, a marca d'água,
  o cartão de preço, o "O QUE MUDA AO PUBLICAR"),
  `PRÉVIA PRONTA · MOBILE · 390`, `CHECKOUT · PIX · DESKTOP · 760` (o
  conflito) e `PAGO · SITE NO AR · DESKTOP · 560`.
- Versão atual: `app/conta/pedidos/[id]/page.tsx`,
  `components/account/{PaymentButton,OrderStatusTracker,LivePreview,ProofStamp}.tsx`,
  `components/site/SiteFromView.tsx:131` (a marca d'água que existe, dentro do
  site), `lib/site/qrDoSite.ts` (`enderecoDoSite`, `linkSemEsquema`),
  `lib/templates/contract.ts` (`tierAllowsSection`).
- SDD do Enlace: §7.2 (publicação automática pelos três caminhos), §15.3 (as
  abas do painel).
- Regras de negócio: §2.1 (zero toque humano por venda — o argumento contra o
  checkout próprio), §2.2 (nunca prometer espera), §5 (a jornada do pedido).

## Dependências

- **Depende de** `specs/design-system/005-publicar-no-ar` — ela entrega
  `.previa-saindo`, `.selo-noar` e o sinal `?publicado=1` que FR-010 consome.
- Depende de `specs/design-system/004-brinde` (SC-008).
- Depende de `specs/design-system/006-voz-verificavel` (SC-009).

## Perguntas em aberto

1. **[CONFLITO] O checkout embutido (artboard 10.2) foi cancelado pelo dono, e
   esta spec registra isso em vez de implementar.** O artboard desenha QR Pix,
   Pix copia-e-cola, resumo do pedido e "Aguardando pagamento… a página
   atualiza sozinha" dentro do produto. Hoje o `PaymentButton` leva ao
   checkout do AbacatePay, que faz exatamente essas quatro coisas.

   Reconstruir dentro significaria: gerar e exibir cobrança, tratar estados
   (`PENDING`/`PAID`/`EXPIRED`), fazer *polling* ou stream do status, e
   responder pelo que der errado — trabalho por venda que `regras-de-negocio.md`
   §2.1 existe para eliminar. O produto vence o desenho, como em H5.

   **Só reabrir se o dono quiser trazer o pagamento do pacote para dentro** —
   e aí é uma frente inteira, não um ajuste de tela.

2. **Nada aqui bloqueia a implementação dos FR-001 a FR-012**, que são as
   três outras peças do artboard. Esta pergunta existe para o conflito ficar
   registrado com o motivo, não para travar o trabalho.
