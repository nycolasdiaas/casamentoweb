# Spec 003 — E9/F3: o botão de confirmar presença no convite (área: painel-casal)

**Status:** Pronta para implementação — retenção levantada em 27/08/2026 pela decisão da `002`

## Contexto

`Enlace - F Site Casamento.dc.html`, artboard **F3** (`GET /c/:slug`), termina
o convite com um botão de tinta escrito **Confirmar presença** e, abaixo,
`Responda até 05 de Setembro`. `HANDOFF-editor-convite.md` reforça em três
lugares:

- §2 — `ButtonEl` é um dos quatro tipos de elemento;
- §6 — *"**Botão:** rótulo (fixo — sempre leva ao RSVP `/rsvp/:slug`, não
  editável como link)"*;
- §7 — *"**Publicar:** valida (nomes, data, botão RSVP presente) →
  `publicarConviteAction`. Bloquear publicação com aviso `--warn` se faltar
  campo essencial."*

O que existe hoje: o convite semeado (`lib/site/inviteSeed.ts:116-135`) termina
com um bloco de **texto** cujo `link` aponta para o **endereço do site**
(`dados.url`), não para a confirmação. `PublicarConvite.tsx` publica sem
validar nada. E não existe tipo `botao` em `lib/site/inviteDoc.ts`.

O efeito prático: o casal desenha o convite, publica, manda `/c/<slug>` no
grupo da família, e o convidado que clica cai na capa do site — de onde ainda
precisa achar a confirmação. O convite virou página justamente para o botão
levar a algum lugar (SDD §15.1: *"numa imagem, o botão 'Lista de presentes' é
desenho; aqui ele leva à lista"*).

A infraestrutura para acertar isso **já existe inteira**:
`lib/site/ancoras.ts` exporta `LINKS_DO_CONVITE`, com
`{ chave: "rsvp", rotulo: "Confirmar presença" }` em primeiro lugar, e
`linkDaSecao(baseUrl, slug, chave)` monta `/s/<slug>#confirmacao`.

## Escopo

- Um tipo `BlocoBotao` **aditivo** em `lib/site/inviteDoc.ts`.
- O botão no convite semeado (`inviteSeed.ts`).
- A validação de publicar (`PublicarConvite.tsx` +
  `publicarConviteAction`).
- O render do botão em `BlocoVisual` (editor, miniatura e `/c/:slug`).

## Fora de escopo

- Trocar o modelo de dados do convite — `specs/painel-casal/002` decide isso,
  e este acréscimo cabe na Opção A dela sem reescrever nada.
- Snap, atalhos, autosave e painel de modelos — 004 a 007.
- A seção `rsvp` do site (`/rsvp/<slug>`), que tem 23 confirmações reais e
  não é tocada.

## Requisitos funcionais

- **FR-001:** `lib/site/inviteDoc.ts` DEVE ganhar
  `BlocoBotao = BlocoBase & { tipo: "botao"; destino: DestinoDoBotao;
  rotulo: string; fundo: string; cor: string; raio: number;
  fonte: "serif"|"sans"|"script"; tamanho: number }`, e `Bloco` DEVE passar a
  incluí-lo.
- **FR-002:** `DestinoDoBotao` DEVE ser a lista fechada
  `"rsvp" | "gifts" | "details" | "gallery" | "story" | "site"` — as cinco
  chaves de `LINKS_DO_CONVITE` mais o endereço do site. Endereço livre **não**
  é aceito: `linkSeguro` já existe para o bloco de texto, e um botão com
  destino digitado à mão reabre a superfície que §7 do handoff manda fechar
  (*"não editável como link"*).
- **FR-003:** `parseBloco` DEVE aceitar `tipo: "botao"` e cair em padrões
  seguros para todo campo ausente ou inválido, como já faz com os outros
  quatro tipos. Um `doc` gravado antes desta spec DEVE continuar carregando
  sem perder bloco nenhum.
- **FR-004:** O endereço final DEVE ser resolvido **no render**, por
  `linkDaSecao(baseUrl, slug, destino)`, e nunca gravado no `doc`. Gravar o
  endereço congelaria o slug do site dentro do convite; resolver no render
  faz o botão continuar certo se o endereço mudar.
- **FR-005:** `conviteInicial` (`inviteSeed.ts`) DEVE trocar o bloco de texto
  final por um `BlocoBotao` com `destino: "rsvp"`, `rotulo:
  "Confirmar presença"`, `fundo` = `cores.ink`, `cor` = `cores.paper`,
  `raio: 2`, `fonte: "sans"`. O endereço do site continua aparecendo **abaixo**
  do botão como texto sem link, como no artboard F3.
- **FR-006:** O botão só entra no convite semeado quando o pacote do site
  incluir a seção `rsvp` (`tierAllowsSection(tier, "rsvp")`). Num pacote
  **Convite**, que não tem confirmação de presença, o botão semeado DEVE ter
  `destino: "site"` e rótulo `Ver o site`. Semear um botão que leva a uma
  seção que o pacote não libera é vender o que não foi comprado.
- **FR-007:** `BlocoVisual` DEVE desenhar o botão com `background`, `color`,
  `border-radius` e fonte do bloco, com **44px de altura mínima** de área de
  toque (Fundação A4).
- **FR-008:** `ConviteVisual` (o `/c/:slug` público) DEVE renderizar o botão
  como `<a>` de verdade — não `<div>` com `onClick`. Semântica real é o que a
  §8 do handoff cobra (*"`mode="view"` gera markup semântico… `<a>` no botão
  RSVP"*).
- **FR-009:** `publicarConviteAction` DEVE recusar publicação quando o `doc`
  não contiver **nenhum** bloco do tipo `botao` **e** nenhum bloco de texto
  com `link` preenchido. A recusa DEVE devolver um erro nomeado
  (`"sem-saida"`), nunca uma exceção genérica.
- **FR-010:** `PublicarConvite.tsx` DEVE mostrar, antes de publicar, um
  `Aviso` de tom `warn` com o texto
  `Este convite não tem para onde levar. Acrescente o botão de confirmar
  presença antes de publicar.` e um botão que acrescenta o bloco de botão no
  centro-inferior do convite.
- **FR-011:** A validação DEVE valer **no servidor** e não só na tela. O
  `PublicarConvite` é client component e a action é a fronteira que importa.
- **FR-012:** A validação NÃO PODE recusar por nomes ou data (o handoff §7
  também os pede). `regras-de-negocio.md` §2.3 é literal: *"Só uma coisa é
  obrigatória: os nomes"*, e *"a lista 'o que falta' é guia, nunca trava"*.
  Um convite sem data é legítimo — casal que ainda não fechou o dia. O que
  trava é só o beco sem saída, que é a regra da prancha H
  (*"Toda tela tem uma saída primária. Beco sem saída é bug."*).

## Critérios de aceite

- **SC-001:** `parseInviteDoc` aplicado a um `doc` sem nenhum bloco `botao`
  devolve os mesmos blocos de antes, sem erro. Atende FR-003.
- **SC-002:** Criar um convite novo num pedido **Para Sempre** produz um `doc`
  com exatamente um bloco `tipo: "botao"`, `destino: "rsvp"`, rótulo
  `Confirmar presença`. Atende FR-005.
- **SC-003:** Criar um convite novo num pedido **Convite** produz um bloco
  `tipo: "botao"` com `destino: "site"` e rótulo `Ver o site`. Atende FR-006.
- **SC-004:** Em `/c/<slug>`, o botão é um `<a>` cujo `href` termina em
  `/s/<slug>#confirmacao`, e ele tem `getBoundingClientRect().height >= 44`.
  Atende FR-004, FR-007 e FR-008.
- **SC-005:** Trocar o `slug` do site (`npm run fix:slug`, que só funciona em
  prévia sem convidados) muda o `href` do botão sem tocar no `doc`. Atende
  FR-004.
- **SC-006:** Apagar o botão e tentar publicar: `publicarConviteAction`
  devolve `"sem-saida"` e o convite continua com `published_at` nulo. Atende
  FR-009 e FR-011.
- **SC-007:** Na mesma situação, a tela mostra o aviso `warn` com o texto
  exato de FR-010, e o botão do aviso acrescenta o bloco. Atende FR-010.
- **SC-008:** Um convite **sem data** e **sem local**, mas com o botão,
  publica normalmente. Atende FR-012.
- **SC-009:** `npx vitest run lib/site/inviteDoc.test.ts` passa, com um caso
  novo para `BlocoBotao`.
- **SC-010:** `npm run build`, `npm run lint` e `npm run test` passam.
- **SC-011:** `lib/site/inviteDoc.ts` exporta `BlocoBotao`, e `Bloco` é a união dos **cinco** tipos. Atende FR-001.
- **SC-012:** `parseBloco` com `destino: "http://exemplo.com"` cai no padrão `"site"` — endereço livre não é aceito. Atende FR-002.

## Impacto em dados

**Aditivo e sem migração.** `site_invites.doc` é `jsonb`: um tipo de bloco
novo é uma chave nova dentro do JSON, não uma coluna. Nenhum `doc` existente
é lido de outra forma, nenhum é reescrito, nenhuma coluna é alterada.

## Referências

- Protótipo: `Enlace - F Site Casamento.dc.html`, artboard **F3**
  (`GET /c/:slug`) — o botão de tinta `Confirmar presença` e o
  `Responda até 05 de Setembro`. `HANDOFF-editor-convite.md` §2 (`ButtonEl`),
  §6 (destino fixo, não editável como link), §7 (validação de publicar), §8
  (markup semântico no modo view), §9 item 1 e §10 (`GET /rsvp/:slug` como
  *"destino fixo do `ButtonEl`"*).
- Versão atual: `lib/site/inviteSeed.ts:116-135` (o bloco de texto com link
  para o site), `lib/site/inviteDoc.ts` (os quatro tipos de bloco),
  `lib/site/ancoras.ts` (`LINKS_DO_CONVITE`, `linkDaSecao` — a infraestrutura
  que já existe), `components/account/convite/BlocoVisual.tsx`,
  `components/site/ConviteVisual.tsx`,
  `components/account/convite/PublicarConvite.tsx`,
  `app/actions/invite-actions.ts`.
- SDD do Enlace: §15.1 (o convite é uma página para o botão levar a algum
  lugar), §4.5 (gating por pacote — FR-006).
- Regras de negócio: §2.3 (só os nomes são obrigatórios — FR-012), §2.5
  (`/rsvp/<slug>` é sagrado e não é tocado).

## Dependências

- **Depende de** `specs/painel-casal/002-modelo-do-convite` — o acréscimo cabe
  na Opção A dela, mas a decisão precisa estar tomada.
- Depende de `specs/design-system/006-voz-verificavel` (o rótulo é
  `Confirmar presença`, nunca `RSVP`).

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
