# Spec 007 — H5: "O Pix não foi confirmado" (área: site-publico)

**Status:** Implementada (27/08/2026) — **Opção B**: uma tela honesta, com outro texto. O H5 do artboard continua recusado

## Contexto

`Enlace - Falhas Convidado.dc.html`, artboard **H5**, desenha uma tela para o
convidado cujo Pix de presente não caiu:

> `PAGAMENTO NÃO CONCLUÍDO` · **O Pix não foi confirmado** · *"O tempo do
> código expirou antes do pagamento cair. **Nada foi cobrado de você.** A cota
> continua disponível — é só gerar um código novo."* · botões
> `Gerar novo código Pix` e `Escolher outro presente` · rodapé: *"Se o valor
> saiu da sua conta, escreva para ajuda@enlace.site com o comprovante — a
> gente resolve em até 1 dia útil."*

A anotação da prancha aponta para `POST startPaymentAction ·
/api/pagamento/confirmar`.

**A tela não é implementável como desenhada**, e o motivo não é técnico — é o
modelo de negócio. `regras-de-negocio.md` §2.4:

> **100% do presente vai para o casal. O Enlace nunca fica no meio.**

O Pix de presente é gerado a partir da chave do casal
(`lib/pix/brcode.ts` monta o BR Code com o valor da cota no campo 54), o
convidado paga **direto na conta do casal**, e depois **declara** que pagou —
`registerContributionAction`, disparada pelo `GiftPixModal`. Não há cobrança,
não há expiração, não há retorno de status, porque o dinheiro nunca passa por
nenhum sistema da Enlace.

Consequências diretas, cada uma matando uma parte do artboard:

| O que o desenho diz | Por que não pode |
|---|---|
| "O tempo do código expirou" | O BR Code não tem prazo. É gerado no render e vale para sempre. |
| "Nada foi cobrado de você" | A Enlace não sabe se foi ou não. Afirmar é chute sobre dinheiro. |
| "Gerar novo código Pix" | O código nunca foi invalidado; o botão geraria o mesmo. |
| "a gente resolve em até 1 dia útil" | Promete um estorno que a Enlace **não pode fazer** — o dinheiro está na conta do casal. |
| A tela existir | Ela precisa de um evento ("o Pix falhou") que o produto não observa. |

O `startPaymentAction` que a prancha cita é do **pacote**, não do presente:
ele cobra o casal via AbacatePay para publicar o site. Esse fluxo, sim, tem
cobrança, status e webhook. Mas o artboard H5 fala de "Lua de mel · 1 cota ·
R$ 250" e de "presente para Ana & João" — é o presente, não o pacote.

Isto já foi registrado como divergência assumida na auditoria de 24/08/2026,
onde o dono decidiu que o produto vence o desenho.

## Escopo

Nenhum código. Esta spec existe para **registrar o conflito**, apontar o que
o convidado vê hoje, e propor as duas saídas possíveis.

## Fora de escopo

- Mexer em `lib/pix/*`, `GiftPixModal.tsx` ou `registerContributionAction`.
- A tela de checkout do **pacote** (E10), que é
  `specs/painel-casal/008-e10-publicar` e tem outro conflito, separado.
- H1–H4, que estão implementadas e sem divergência.

## Requisitos funcionais

- **FR-001:** Nenhuma tela do produto pode afirmar ao convidado que **nada foi
  cobrado** dele num Pix de presente. A Enlace não tem essa informação; a
  afirmação seria falsa por construção.
- **FR-002:** Nenhuma tela do produto pode prometer estorno, acerto ou
  "resolvemos em X dias úteis" para Pix de presente. O dinheiro está na conta
  do casal (`regras-de-negocio.md` §2.4).
- **FR-003:** `lib/pix/sem-chave-global.test.ts` DEVE continuar passando — a
  proibição de chave de fallback é o que garante que o Pix é sempre do casal,
  e é ela que torna FR-001 e FR-002 inevitáveis.
- **FR-004:** Se o dono aprovar a Opção B da pergunta em aberto, o texto novo
  DEVE dizer o que é verdade: que a confirmação é do próprio convidado, que o
  valor vai direto para o casal, e que a dúvida se resolve **com o casal**,
  não com a Enlace.

## Critérios de aceite

- **SC-001:** `grep -rin "nada foi cobrado" app components lib` devolve `0`
  linhas. Atende FR-001.
- **SC-002:** `grep -rinE "dia útil|estorn|reembols" app components lib`
  devolve `0` linhas em arquivos que o convidado lê. Atende FR-002.
- **SC-003:** `npx vitest run lib/pix/sem-chave-global.test.ts` passa. Atende
  FR-003.
- **SC-004:** Se a Opção B for aprovada, o texto novo passa pelo agente
  `regras-de-negocio` com veredito `PODE` antes de ser escrito.
- **SC-005:** Se a Opção B for aprovada, o texto novo diz que a confirmação é do convidado, que o valor vai direto para o casal, e manda falar **com o casal** — nunca com a Enlace. Atende FR-004.

## Impacto em dados

Nenhum, em qualquer das duas saídas.

## Referências

- Protótipo: `Enlace - Falhas Convidado.dc.html`, artboard **H5**
  (`POST startPaymentAction · /api/pagamento/confirmar` · *"falha no presente
  por Pix — o convidado está pagando"*), desktop 900 e mobile 390. E o bloco
  de regras da mesma prancha: *"Em falha de dinheiro (H5), dizer
  explicitamente que nada foi cobrado — é a primeira dúvida de quem paga."*
- Versão atual: `components/gifts/GiftPixModal.tsx` (o modal que gera o QR),
  `app/actions/gift-actions.ts` (`registerContributionAction`),
  `lib/pix/brcode.ts` (o BR Code é gerado, o campo 54 carrega o valor da
  cota), `lib/pix/sem-chave-global.test.ts`. A tela H5: **não existe, e não é
  observável**.
- SDD do Enlace: "Pendências conhecidas" do `AGENTS.md` — *"Pix de presente
  falho não é detectável: o convidado auto-declara que pagou
  (`registerContributionAction`), e o dinheiro nunca passa pela Enlace (§3).
  Não há como saber que um Pix não caiu — logo, não há tela H5."*
- Regras de negócio: §2.4 (o dinheiro do presente é do casal, sempre), §7
  (taxa sobre presente descartada), §8 item 3.

## Dependências

Nenhuma. É uma spec de registro.

## Perguntas em aberto

1. **Como fechar o buraco que H5 tentava fechar, sem mentir?** A necessidade
   do artboard é real: o convidado que abriu o QR, saiu do app do banco sem
   pagar, e voltou ao site fica sem saber o que fazer. Duas saídas:

   - **Opção A — não fazer nada.** A divergência fica registrada e o produto
     vence o desenho. O convidado que desistiu simplesmente fecha a página; a
     cota continua disponível porque nunca foi reservada. Custo: zero. Perda:
     o convidado inseguro escreve para o casal — exatamente o trabalho que
     `/s/:slug/meu-convite` existe para tirar dele.
   - **Opção B — uma tela honesta, com outro texto.** Mesmo lugar do fluxo
     (o convidado fecha o modal sem confirmar), mas dizendo o que é verdade:
     *"O Pix vai direto para a conta dos noivos — a Enlace não fica no meio,
     então a gente não tem como conferir se caiu. Se você pagou, confirme
     aqui para eles saberem. Se não pagou, a cota continua livre."* Com dois
     caminhos: `Já paguei, confirmar` (a mesma
     `registerContributionAction`) e `Escolher outro presente`. Custo: uma
     tela pequena. Ganho: o convidado sai sabendo o que aconteceu.

   **A recomendação é a Opção B**, porque ela resolve o problema do convidado
   sem afirmar nada que a Enlace não saiba. Mas ela **escreve texto novo sobre
   dinheiro para um terceiro**, e isso é decisão do dono
   (`regras-de-negocio.md` §8, itens 2 e 3).

## Decisão registrada — 27/08/2026

**Opção B: uma tela honesta, com outro texto.**

O H5 do artboard continua recusado, e a razão não mudou: ele afirma que o
pagamento "não foi confirmado", e a Enlace **não observa o Pix**. Não existe
falha detectável — existe um convidado que fechou a tela e ficou sem saber o
que aconteceu.

A Opção A (não fazer nada) deixaria esse convidado escrevendo para o casal na
semana do casamento, que é exatamente o trabalho que o produto existe para
tirar de cena.

## O texto passou pelo `regras-de-negocio`

**Veredito: PODE, COM AJUSTE.** Três trocas de palavra contra o rascunho da
spec, e cada uma tem motivo:

| Rascunho | Aprovado | Por quê |
|---|---|---|
| `Já paguei, confirmar` | **`Já fiz o Pix`** | é exatamente o rótulo que o convidado acabou de ver no modal. Rótulo diferente para a mesma ação faz ele achar que é um segundo passo — ou uma segunda cobrança |
| `Escolher outro presente` | **`Ver outros presentes`** | "escolher" é obrigação; "ver" é saída. Ele acabou de desistir de um |
| `a cota continua livre` | **`nada ficou reservado no seu nome e o presente continua na lista`** | a galeria do convidado nunca mostra disponibilidade nem usa a palavra "cota". "Cota livre" ensinaria que presentes se esgotam — promessa de disponibilidade que a tela não sustenta |

**Confirmado que nada reserva:** abrir o QR não escreve linha nenhuma
(`buildBrCode` é puro e roda no cliente). A única escrita é o `insert` que o
clique dispara. A frase é verdade.

**Emoji: não.** Voz V5 libera emoji só em e-mail para convidado e em texto que
o casal escreve. Esta é tela de site — e numa tela sobre dinheiro ele lê como
alívio forçado.

**A lista de palavras proibidas cresceu**, e virou teste: além de
`confirmado`, `processando`, `pendente` e `verificar`, ficaram de fora
`cobrado`, `estorno`, `reembolso`, `comprovante`, `expirou`,
`gerar novo código`, `não identificamos`, `erro no pagamento` e qualquer
`nossa equipe` — dúvida de presente vai para o casal, não para a Enlace.

**Sugestão do agente para `docs/regras-de-negocio.md` §2.4** (não aplicada — é
edição de documento do dono): *"nenhuma tela pode afirmar ao convidado que um
Pix de presente caiu, falhou ou foi cobrado, nem prometer estorno; dúvida de
presente vai para o casal"*.

## Notas de implementação

**A tela mora dentro do `GiftPixModal`**, como um estado de saída — não como
rota nova. É onde o gesto acontece, e é o único lugar que sabe se o convidado
chegou a ver o QR.

**Três saídas, e é de propósito.** O agente foi explícito: uma tela com dois
botões que exigem ato vira a cobrança que ela existe para evitar.

- o **×** fecha direto, sem gravar nada — sempre existe um caminho de um
  clique para fora;
- **Escape** e o clique fora passam pela tela honesta, que é onde ela alcança
  quem fecha por reflexo depois de ver o QR;
- **`Ver outros presentes`** fecha e não grava nada.

**Ela só aparece para quem viu o QR.** Sem chave Pix configurada não houve QR e
o convidado não tem o que avisar; já tendo confirmado, a tela não tem o que
dizer.

**`Já fiz o Pix` chama a MESMA ação**, com o mesmo nome opcional. Um segundo
caminho de registro seria um segundo lugar para manter — no único lugar do
produto onde o assunto é dinheiro de terceiro.

## Como cada critério foi conferido

Doze testes em `components/gifts/GiftPixModal.test.tsx`, sobre o texto e sobre
as saídas:

| O quê | Medida |
|---|---|
| O texto | as quatro frases aprovadas estão na tela, palavra por palavra |
| O que não se pode dizer | doze palavras proibidas, nenhuma presente; nenhuma promessa de prazo; nenhum emoji; nenhuma menção a "cota" |
| Quem responde dúvida | `Fale com os noivos — a conta é deles`; nenhum `nossa equipe`, `suporte` ou `fale conosco` |
| As três saídas | `×` → `fecharDeVez`; `Escape` e o scrim → `tentarSair`; `Ver outros presentes` → fecha sem gravar |
| A guarda | `if (done || !pix || !brCode || saindo)` — só quem viu o QR e ainda não avisou |
| A ação | `registerContributionAction`, a mesma do modal |
| Build | `build`, `lint` e `test` (55 arquivos, 650 testes) |
