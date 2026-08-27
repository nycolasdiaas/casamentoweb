# Spec 006 — Voz e microcopy verificáveis (área: design-system)

**Status:** Implementada (27/08/2026) — o bloqueio era técnico, e caiu
funcionam como escritos** (ver "A medição"). Falta decidir o discriminador.

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

## A medição — feita em 25/08/2026

`lib/voz/vocabulario.ts` e `lib/voz/varrer.ts` foram escritos e rodados contra
a `main`. O varredor usa o **compilador do TypeScript**, não expressão regular:
`ts.forEachChild` distingue `StringLiteral`, `JsxText` e template literal, e
comentário simplesmente não é nó — que é o único jeito de não reprovar a
documentação junto com a interface, num repositório que explica molde, cache e
render em português o tempo todo.

**Resultado: 98 violações. Cerca de 80 delas são ruído.**

| Termo | Achados | O que de fato eram |
|---|---:|---|
| `cache` | 45 | `"next/cache"` (especificador de import), `"use cache"` (a **diretiva do Next**), `"Cache-Control"` (cabeçalho HTTP), tags de cache |
| `preview` | 18 | `"site-preview:"` (tag), `"preview_ready"` (valor do enum de status), `/preview/` (rota) |
| `Inválido` | 9 | **violações reais** — "E-mail inválido.", "Preço inválido.", "Link inválido." |
| `slug` | 8 | nome de coluna em `schema.ts`, caminho de import `@/lib/slug` |
| `template` | 5 | 3 são `"template_id"`/`"template_style"` (colunas); 2 são reais |
| `RSVP` | 5 | 4 reais; 1 **legítima** — `lib/packages.ts:47`, "Confirmação de presença (RSVP)", que V5 permite entre parênteses |
| `upload` | 3 | `console.error("[fotos] falha ao assinar upload:")` — log, não texto |
| `rota` | 1 | **legítima** — "O convidado abre a rota num toque." é português, não jargão |
| `render`, `jornada`, `experiência`, `simplesmente` | 4 | a apurar |

**O que a medição provou, e que a spec não previu:** o discriminador não é
lexical. `"use cache"` é uma **diretiva de linguagem**; `"preview_ready"` é um
**valor de banco**; `"rota"` é uma **palavra portuguesa comum**; `"RSVP"` entre
parênteses é **permitido pela própria prancha**. FR-004 pede para varrer "os
literais de string", e um literal de string não é texto visível — é o que o
compilador vê, não o que a pessoa lê.

FR-007 (`// voz-ok:`) não salva: com ~80 exceções a escrever, o escape vira o
próprio defeito que ele documenta evitar — *"a primeira ocorrência legítima
transformaria o teste em algo que se desliga"*.

**O que sobrevive:** o varredor está escrito, correto e mede. As violações
reais existem e valem correção. O que falta é uma regra de "isto é texto que
alguém lê" que não seja adivinhação.

## Perguntas em aberto

0b. **Qual é o discriminador?** É a decisão que destrava esta spec, e ela é do
   dono porque escolhe entre um teste que ninguém liga e um teste que esconde
   violação. Três saídas:

   - **Opção A — varrer só texto de JSX, e podar a lista técnica.** Nó de
     texto em JSX é prosa por construção: nenhum `"use cache"`, nenhum nome de
     coluna, nenhum import cai ali. Junto, tirar de `TERMOS_TECNICOS` os cinco
     que são vocabulário de framework ou português comum — `cache`, `build`,
     `render`, `rota`, `molde` —, mantendo `template`, `deploy`, `slug`,
     `preview`, `upload`, `tenant`. Perda: mensagem de erro em Server Action
     (`"E-mail inválido."`) não é JSX e escaparia — e são justamente as nove
     ocorrências de `Inválido`, que são as violações mais claras. **Não
     recomendo sozinha.**
   - **Opção B — JSX + uma lista fechada de destinos de texto.** Além do JSX,
     varrer literais que chegam a lugares sabidamente visíveis: `title`,
     `description`, `label`, `placeholder`, `aria-label`, `alt`, e o valor de
     `erro`/`mensagem` devolvido por Server Action. Pega os `Inválido` e não
     pega `"use cache"`. Custo: a lista de destinos precisa ser mantida.
     **É a recomendação.**
   - **Opção C — inverter: lista de arquivos varridos, não de termos.** Só
     `components/**` e `app/**/page.tsx`, nunca `lib/`. Simples, mas deixa
     `lib/orderStatus.ts` de fora — e é justamente lá que mora a regressão de
     §2.2 que motivou a spec inteira.

0c. **`RSVP` entre parênteses.** V5 permite (*"`RSVP` só entre parênteses"*) e
   `lib/packages.ts:47` usa exatamente assim. Qualquer opção acima precisa da
   exceção — provavelmente `\(RSVP\)` como caso permitido, não `// voz-ok:`
   linha a linha.

0. **Três violações já estão medidas e não são corrigidas aqui.** Encontradas
   ao fotografar os moldes em 25/08/2026, fora do que a auditoria previu:

   | Arquivo | Linha | Texto | Deveria ser |
   |---|---|---|---|
   | `lib/templates/editorial/sections.tsx` | 119 | `RSVP` (etiqueta no topo da capa) | `Confirmar presença` |
   | `lib/templates/editorial/sections.tsx` | 423 | `RSVP` (`<h2>` da seção) | `Confirme sua presença` ou equivalente |
   | `lib/templates/toscana/sections.tsx` | 370 | `Kindly RSVP` (`<h2>` da seção) | *(idem, e sem inglês)* |
   | `app/page.tsx` | 42 | `RSVP por família` (item de pacote na vitrine) | `Confirmação de presença por família` |

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

## Desbloqueio — 27/08/2026

**A conclusão de 25/08 estava certa sobre o que faltava e errada sobre ser
impossível.**

Ela dizia: *"um literal de string não é texto visível — o discriminador que a
spec pedia não existe no nível léxico"*. A primeira metade é verdadeira. A
segunda pulou uma alternativa: **o discriminador não precisa ser léxico. Ele é
posicional.**

Não é a palavra que decide, é onde ela está — e o compilador do TypeScript já
sabe distinguir cada caso, sem heurística:

| Ruído da primeira medição | Por que não é frase |
|---|---|
| `"use cache"`, `"use client"` | prólogo de diretiva (`ExpressionStatement`) |
| `"next/cache"` | especificador de import |
| `"preview_ready"` | operando de `===` — valor, não texto |
| `"slug"`, `"published"` | chave de objeto, `case`, tipo literal |
| `cacheTag("site-view:x")` | argumento de função técnica |
| `className="..."`, `href="..."` | atributo de JSX que não carrega texto |
| `new Error("...")` | mensagem de log; o produto nunca a mostra ao casal |

Mais uma heurística, e só uma: **uma palavra minúscula sem espaço é nome de
coisa**. Frase que alguém lê tem espaço ou começa com maiúscula.

### O resultado

**98 → 18 → 0.**

Com o filtro, sobraram **18 achados e todos eram reais**: nove `Inválido` que
não diziam o que fazer, três `template`, dois `RSVP` na vitrine, um
`experiência`, um `simplesmente`, um `slug` numa mensagem de erro.

**Corrigir os dezoito revelou mais quatro**, escondidos atrás do ruído —
incluindo os três `RSVP` que o convidado via nos moldes Editorial e Toscana
(`RSVP`, `RSVP`, `Kindly RSVP`), que a auditoria já tinha achado a olho e que
eram a pior violação de voz do produto **no ar**. Mais um `jornada` no
Editorial.

### A fuga foi usada uma vez, e é o caso que ela existia para cobrir

`app/presentes/page.tsx`: *"ou o que **render** mais risada"* — o verbo
português, não o termo técnico. É a única homógrafa do produto. **Uma exceção
escrita é o que FR-007 previa; oitenta seriam o defeito.**

A janela da fuga passou de 1 para 5 linhas acima: o motivo de uma exceção não
cabe em setenta caracteres, e num JSX o comentário vem como bloco. Exigir a
linha imediatamente acima obrigaria a escrever o motivo numa linha só, o que é
o mesmo que não escrever.

### O que isto destrava

`design-system/006` era dependência declarada de sete specs. A guarda existe,
roda na suíte, e o produto inteiro passa — texto novo fora da voz agora reprova
antes de chegar ao casal.

## Notas sobre as correções de texto

As dezoito trocas seguiram a **tabela de tradução** de `vocabulario.ts`, que é
a regra de voz já aprovada — não é copy inventada. As duas de `lib/packages.ts`
(`(RSVP)` e `A experiência completa`) mexem em descrição de pacote e são
mecânicas: nenhuma toca em preço, no que o pacote inclui, nem em promessa. O
agente `regras-de-negocio` já havia sinalizado a segunda numa consulta
anterior.

Os textos dos moldes trocaram assim: `RSVP` → `Confirme` (etiqueta) e
`Você vem?` (título), `Kindly RSVP` → `Você vem?`, e a frase de encher
linguiça *"uma jornada de amor, alegria e felicidade eterna"* virou
*"o dia em que a gente diz sim"*.

## Como cada critério foi conferido

| O quê | Medida |
|---|---|
| A varredura | `varrer(process.cwd())` devolve **0** sobre `app`, `components` e `lib` |
| A mensagem | arquivo, linha, palavra e o que escrever no lugar — um teste que só diz "falhou" manda a pessoa procurar |
| O que fica de fora | `*.test.tsx`, `app/pacotes/estilos/**` (prévias com casal fictício, SDD §4.4.1), `lib/buildPrompt.ts` e a própria `lib/voz/` |
| A fuga | `// voz-ok: <motivo>` em até 5 linhas acima; usada uma vez, com motivo escrito |
| O vocabulário | toda palavra proibida tem tradução — proibir sem dizer o que escrever transfere o trabalho para quem foi reprovado |
| `RSVP` | conferido com sensibilidade a maiúscula: a sigla é banida, mas `"rsvp"` minúsculo é `SectionKey` e bani-lo reprovaria o contrato do motor |
| Build | `build`, `lint` e `test` (58 arquivos, 681 testes) |
