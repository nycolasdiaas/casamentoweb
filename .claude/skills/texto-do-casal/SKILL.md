---
name: texto-do-casal
description: Escrever ou revisar qualquer texto que o casal ou o convidado lê — botão, rótulo, mensagem de erro, e-mail, tela de status, copy da vitrine. Use SEMPRE que criar ou alterar string visível na interface. Traduz palavra técnica, proíbe promessa de espera, e diz quando parar e consultar o agente regras-de-negocio.
---

# Texto do casal

Público: casal brasileiro se organizando para casar, no celular, no meio de
outra coisa. Não é público técnico.

Tom: **claro, caloroso, curto, sem infantilizar.**

Regra de produto completa: `docs/regras-de-negocio.md` §6.

## Três filtros, nesta ordem

### 1. Palavra técnica? Traduza

| Nunca | Escreva |
|---|---|
| template, molde | modelo, estilo |
| deploy, build, release | colocar no ar |
| slug, rota, URL canônica | endereço do site, link |
| preview | prévia |
| upload | enviar foto |
| RSVP sozinho | confirmação de presença (`RSVP` só entre parênteses) |
| tenant, cache, render, request | nunca aparece para o casal |
| erro 500, falha na requisição | "não conseguimos salvar agora — tente de novo" |

### 2. Promete espera que não existe?

**Banidas do acompanhamento do pedido:** "em breve", "logo", "nossa equipe
vai", "aguarde", "assim que possível", "prazo".

Isto já foi um bug real. `STATUS_META` em `lib/orderStatus.ts` dizia *"nossa
equipe vai começar a montar em breve"* — copy da época em que um humano
montava o site à mão. Com o provisionamento automático, `submitOrderAction`
cria o site no MESMO request: a prévia está pronta antes de o casal terminar
de ler a frase.

**Prometer espera onde não há espera é vender o produto errado.**

### 3. Diz o que aconteceu, ou o que o sistema fez?

Vire para o lado do casal.

- Não: "upload concluído com sucesso" → Sim: "suas fotos já estão no site"
- Não: "pedido submetido" → Sim: "o site de vocês já está criado"

**Todo erro precisa de próximo passo.** Mensagem sem saída é beco sem saída.

## Duas proibições absolutas

- **Nunca invente dado do casal.** As prévias em `app/pacotes/estilos/` têm
  cronograma, legenda de foto e frase de casal fictício escritos no código.
  Copiar isso para um site real faz o casal anunciar um coquetel que não vai
  ter.
- **Nunca invente depoimento.** `TESTIMONIALS` vazio esconde a seção. Peça a
  frase real ao casal e acrescente em `lib/site.ts`.

## Onde a palavra "falta" importa

`lib/site/oQueFalta.ts` diz **"falta"**, nunca "pendência" ou "erro". É guia,
não trava: um casal que não quer contar a história tem um site legítimo.

E a lista respeita o pacote — cobrar chave Pix de quem comprou o Convite é
cobrar por recurso que ele não tem, e tarefa impossível trava o progresso para
sempre.

## Quando parar e perguntar ao agente

Consulte o agente **`regras-de-negocio`** — não decida sozinho — quando o texto:

- anuncia **preço, prazo, garantia ou recurso novo**;
- diz que algo está incluso num pacote (confira `lib/packages.ts` e
  `lib/templates/contract.ts`);
- pede ao casal que **fale com alguém** para concluir a compra;
- muda o que o **convidado** precisa fazer para confirmar presença.

Ele responde com veredito (`PODE` / `NÃO PODE` / `PODE, COM AJUSTE` /
`DECISÃO DO DONO`) e a regra que sustenta.

Se for só tradução de palavra técnica ou reescrita de tom, **resolva aqui** —
não gaste o agente com isso.

## Devolva a reescrita, não o comentário

Ao revisar, entregue o texto pronto. Um "esse texto está técnico demais" não
resolve nada.
