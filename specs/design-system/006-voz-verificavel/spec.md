# Spec 006 — Voz e microcopy verificáveis (área: design-system)

**Status:** Pronta para implementação — a pergunta em aberto tem padrão decidido em FR-004/FR-005 e não trava a implementação.

## Contexto

`Enlace - Voz e Microcopy.dc.html` V5 traz duas listas fechadas: o
**vocabulário oficial** (8 pares "assim sim / assim não") e as **12 palavras
que o produto não escreve**. `docs/regras-de-negocio.md` §6 repete as mesmas
regras e acrescenta a tabela de tradução obrigatória, e a §2.2 acrescenta 7
palavras banidas do acompanhamento do pedido.

As três listas são cumpridas à mão. O produto já teve a regressão que elas
existem para impedir — os textos de `STATUS_META` prometiam *"nossa equipe vai
começar a montar em breve"* depois de o provisionamento virar automático, e o
comentário no código registra isso como erro a nunca repetir.

Um valor de sistema cumprido à mão é a mesma classe de defeito que a `.trilho`
corrigiu para a largura. A diferença é que aqui não é estilo, é promessa: uma
palavra errada em `STATUS_META` reintroduz uma espera que não existe
(regras §2.2), e "template" numa tela do casal quebra a tradução obrigatória
(regras §6).

Esta spec não reescreve texto nenhum. Ela transforma as listas em **teste**.

## Escopo

- Um módulo `lib/voz/vocabulario.ts` com as três listas como constantes
  exportadas.
- Um teste `lib/voz/vocabulario.test.ts` que varre as strings visíveis do
  produto e reprova.
- A definição, escrita, de o que conta como "string visível" e o que é
  exceção legítima.

## Fora de escopo

- Corrigir as strings que o teste reprovar. Cada correção é decisão de texto
  e passa pelo agente `regras-de-negocio`; entra nas specs de área.
- Texto que o **casal escreve** (história, mensagem de presente, recado,
  nome do convite). O produto não edita a voz do cliente.
- Texto de `app/pacotes/estilos/*` — são as prévias com casal fictício, onde
  inventar contexto é o trabalho (SDD §4.4.1).
- Formatos de número, data e dinheiro (V5, primeira coluna). Já existem em
  `lib/format.ts` e `lib/site/dataLegivel.ts` e não divergiram.

## Requisitos funcionais

- **FR-001:** `lib/voz/vocabulario.ts` DEVE exportar
  `PALAVRAS_PROIBIDAS: readonly string[]` com exatamente estas 12 entradas,
  na forma em que aparecem na prancha V5:
  `"Ops!"`, `"Sucesso!"`, `"Inválido"`, `"Algo deu errado"`,
  `"Tem certeza?"`, `"Clique aqui"`, `"jornada"`, `"experiência"`,
  `"incrível"`, `"mágico"`, `"simplesmente"`, `"apenas alguns cliques"`.
- **FR-002:** `lib/voz/vocabulario.ts` DEVE exportar
  `TERMOS_TECNICOS: readonly string[]` com as 11 entradas da tabela de
  tradução de `regras-de-negocio.md` §6 que nunca podem aparecer para o
  casal: `"template"`, `"molde"`, `"deploy"`, `"build"`, `"slug"`, `"rota"`,
  `"preview"`, `"upload"`, `"tenant"`, `"cache"`, `"render"`.
- **FR-003:** `lib/voz/vocabulario.ts` DEVE exportar
  `PALAVRAS_DE_ESPERA: readonly string[]` com as 7 entradas de
  `regras-de-negocio.md` §2.2: `"em breve"`, `"logo"`, `"nossa equipe vai"`,
  `"aguarde"`, `"assim que possível"`, `"prazo de entrega"`, `"em fila"`.
- **FR-003b:** `lib/voz/vocabulario.ts` DEVE exportar
  `SO_PARA_O_CONVIDADO: readonly string[]` com uma entrada: `"RSVP"`, **em
  caixa alta**. `Enlace - Voz e Microcopy.dc.html` V5 é literal: *"'RSVP' pode
  aparecer na rota e no admin; para o convidado é sempre **confirmar
  presença**"*, e `regras-de-negocio.md` §6 repete. A comparação desta lista
  **diferencia maiúscula** — é o que separa a violação (`RSVP` como texto) do
  uso legítimo (`rsvp` como chave de `SectionKey`, âncora e nome de rota).
- **FR-004:** O teste DEVE varrer, de todos os arquivos `.ts`/`.tsx` em
  `app/`, `components/` e `lib/`, **duas coisas**: os literais de string
  **e o texto solto dentro de JSX** (nós de texto entre `>` e `<`). Exceto:
  arquivos `*.test.ts` e `*.test.tsx`; `app/pacotes/estilos/**`;
  `lib/buildPrompt.ts`; e comentários (`//`, `/* */`, JSDoc).
- **FR-004b:** Varrer texto de JSX **não** é detalhe de implementação: as três
  violações conhecidas de FR-003b são todas nós de texto, não literais
  (`lib/templates/editorial/sections.tsx:119` e `:423`,
  `lib/templates/toscana/sections.tsx:370`). Um teste que só olhasse literais
  passaria com a pior violação de voz do produto no ar.
- **FR-005:** A comparação DEVE ser **sem diferenciar maiúscula de minúscula**
  e **sem diferenciar acento** para `PALAVRAS_PROIBIDAS` e `TERMOS_TECNICOS`,
  e DEVE casar apenas palavra inteira (limite `\b`), para que `"logo"` não
  reprove `"logotipo"` nem `"/logo-enlace.png"`.
- **FR-006:** `PALAVRAS_DE_ESPERA` DEVE ser aplicada **apenas** a
  `lib/orderStatus.ts` e `components/account/OrderStatusTracker.tsx` — é
  onde a regra §2.2 mora. Aplicá-la ao produto inteiro reprovaria "logo" e
  "em breve" em textos legítimos do site do convidado.
- **FR-007:** O teste DEVE aceitar uma linha de exceção explícita: um literal
  precedido, na linha imediatamente acima, do comentário
  `// voz-ok: <motivo>` é ignorado. Sem escape, a primeira ocorrência
  legítima transformaria o teste em algo que se desliga.
- **FR-008:** A mensagem de falha DEVE nomear o arquivo, a linha, a palavra
  encontrada e a substituição da tabela — "`app/x.tsx:12` — 'preview' →
  escreva 'prévia'". Uma falha que só diz "palavra proibida" obriga quem lê a
  reabrir a prancha.
- **FR-009:** O teste NÃO PODE depender de banco. Ele lê arquivos do
  repositório com `node:fs` e roda em qualquer ambiente — inclusive sem
  `DATABASE_URL`.

## Critérios de aceite

- **SC-001:** `npx vitest run lib/voz/vocabulario.test.ts` roda sem
  `DATABASE_URL` no ambiente. Atende FR-009.
- **SC-002:** Acrescentar `<p>Ops! Algo deu errado</p>` a um arquivo de
  `components/` faz o teste falhar, e a mensagem contém o caminho do arquivo,
  o número da linha e a palavra `Ops!`. Atende FR-001, FR-004 e FR-008.
- **SC-003:** Acrescentar `const x = "logotipo"` a um arquivo de
  `components/` **não** faz o teste falhar. Atende FR-005.
- **SC-004:** Acrescentar `"em breve"` a `lib/orderStatus.ts` faz o teste
  falhar; acrescentar `"em breve"` a `components/site/BecoComSaida.tsx` não
  faz. Atende FR-003 e FR-006.
- **SC-005:** Um literal com `// voz-ok: nome de arquivo do Storage` na linha
  acima é ignorado. Atende FR-007.
- **SC-006:** Alterar um arquivo em `app/pacotes/estilos/` para conter
  `"incrível"` não faz o teste falhar. Atende FR-004.
- **SC-007:** Rodado contra a `main` de hoje, o teste **DEVE falhar com pelo
  menos as três linhas já conhecidas** (ver FR-004b). Se passar, ele não está
  varrendo texto de JSX e FR-004 não foi cumprido.
- **SC-007b:** `SO_PARA_O_CONVIDADO` reprova `>RSVP<` em
  `lib/templates/editorial/sections.tsx` e **não** reprova
  `rsvp: "confirmacao"` em `lib/site/ancoras.ts`, nem `"rsvp"` em
  `SECTION_KEYS`. Atende FR-003b.
- **SC-007c:** A lista completa de falhas do primeiro rodar DEVE ser
  transcrita na seção "Perguntas em aberto" da spec de área correspondente
  antes de qualquer correção de texto. **Nenhuma string é corrigida dentro
  desta spec.**
- **SC-008:** Os **outros** testes de `npm run test` continuam passando — o
  teste novo entra na suíte sem depender das tabelas que as outras limpam
  (`AGENTS.md`, "Nunca rode duas suítes ao mesmo tempo").
- **SC-008b:** O teste novo **falha** no primeiro rodar, e isso é o esperado
  (SC-007). Ele só entra em `npm run test` como bloqueante **depois** de a
  spec de correção de texto ter zerado a lista. Até lá, DEVE ser marcado
  `it.fails` ou `describe.skip` com um comentário apontando para SC-007c — um
  teste vermelho permanente na suíte é um teste que todo mundo aprende a
  ignorar.
- **SC-009:** `TERMOS_TECNICOS.length === 11` e a lista contém `template`, `deploy`, `slug`, `preview`, `upload`, `tenant`, `cache` e `render`. Atende FR-002.
- **SC-010:** Acrescentar `const t = "preview"` a um arquivo de `app/` faz o teste falhar com a mensagem `escreva 'prévia'`. Atende FR-002 e FR-008.

## Impacto em dados

Nenhum.

## Referências

- Protótipo: `Enlace - Voz e Microcopy.dc.html` V5, cartões "COMO CHAMAMOS AS
  COISAS" (8 pares) e "NÃO ESCREVEMOS" (12 palavras); V3 ("assim sim / assim
  não", strings reais do produto); V4 (as cinco fórmulas por componente).
- Versão atual: nenhum equivalente — **NOVO**. As regras estão só em prosa,
  em `docs/regras-de-negocio.md` §2.2 e §6.
- SDD do Enlace: §7 (a reescrita de `STATUS_META` que a automação exigiu — o
  precedente que justifica o teste).

## Dependências

- Nenhuma spec precede esta.
- **Precede, como guarda**, todas as specs que escrevem texto novo:
  `site-publico/006` (e-mails do convidado), `site-publico/003` e `005` (vitrine),
  `painel-casal/011` (e-mails do casal), `painel-admin/003` (filtros e busca).

## Perguntas em aberto

0. **Três violações já estão medidas e não são corrigidas aqui.** Encontradas
   ao fotografar os moldes em 25/08/2026, fora do que a auditoria previu:

   | Arquivo | Linha | Texto | Deveria ser |
   |---|---|---|---|
   | `lib/templates/editorial/sections.tsx` | 119 | `RSVP` (etiqueta no topo da capa) | `Confirmar presença` |
   | `lib/templates/editorial/sections.tsx` | 423 | `RSVP` (`<h2>` da seção) | `Confirme sua presença` ou equivalente |
   | `lib/templates/toscana/sections.tsx` | 370 | `Kindly RSVP` (`<h2>` da seção) | *(idem, e sem inglês)* |

   As três são texto que **o convidado lê**, e as três contrariam
   `regras-de-negocio.md` §6 e a prancha V5. Corrigi-las é escrever texto novo
   para o convidado, o que passa pelo agente `regras-de-negocio` — e mexe em
   dois moldes, não no sistema de voz. **Entra numa spec de `site-publico`
   própria**, criada quando esta aqui for implementada e a lista de falhas
   estiver completa (SC-007c).

   O `Kindly RSVP` do Toscana tem um agravante que a lista de V5 não cobre:
   é **inglês** num produto que fala português com o convidado. Se a correção
   for feita, vale decidir se "sem inglês em texto do convidado" também vira
   regra verificável — **decisão do dono**, porque o Toscana é um estilo
   italiano e o desenho pode ter querido o estrangeirismo.

1. **`"molde"` está na lista de `TERMOS_TECNICOS` (FR-002) e é o nome que o
   SDD usa o tempo todo.** A tabela de `regras-de-negocio.md` §6 diz
   "template, molde → modelo, estilo", ou seja: proibido **para o casal**,
   correto em documentação e em nome de diretório. O teste varre `lib/` junto,
   e `lib/templates/*` está cheio da palavra em comentário — por isso FR-004
   exclui comentários. **Confirmar com o dono** se `"molde"` deve reprovar
   também em literal de string dentro de `lib/`, ou só em `app/` e
   `components/`. Enquanto não houver resposta, implementar como FR-004 e
   FR-005 descrevem (todos os três diretórios, só literais, fora de
   comentário) e registrar o resultado em SC-007.
