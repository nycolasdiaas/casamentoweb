# Spec 007 — E9: o painel de Modelos do editor de convite (área: painel-casal)

**Status:** Implementada (27/08/2026) — **Opção A**: re-tematizar sem trocar o desenho

## Contexto

`Enlace - E Painel.dc.html`, artboard **E9**, abre o editor com a trilha de
ferramentas à esquerda — **Modelos · Texto · Fotos · Formas · Fundo** — e o
item **Modelos** selecionado, mostrando no painel ao lado uma grade 2×3 com
seis miniaturas de convite, uma por estilo, a primeira contornada em
`--mark`.

`HANDOFF-editor-convite.md` §4:

> **Modelos:** grid 2-col de thumbs dos 6 estilos. Clicar troca
> `doc.template` e re-tematiza os elementos padrão (mapeia fontes/cores do
> estilo). Confirmar antes se houver edições manuais.

O editor de hoje tem as outras quatro ferramentas (texto, fotos, formas,
fundo) e a lista de camadas. Não tem Modelos, e o `InviteDoc` não tem
`template` (`specs/painel-casal/002`).

O convite nasce tematizado — `conviteInicial(dados, cores)` recebe
`ThemeCoresLocal` do tema do site — mas a partir daí é peça avulsa: mudar o
estilo do site na aba **Visual** não mexe no convite já desenhado, e é assim
de propósito (SDD §15.1: *"o convite é peça avulsa, não molde reaproveitado
entre casais"*).

## Escopo

*Congelado até a decisão da pergunta em aberto.*

- A ferramenta **Modelos** na trilha e o painel com as seis miniaturas.
- O que "trocar de modelo" faz com o convite já desenhado.

## Fora de escopo

- As outras quatro ferramentas do painel, que existem e funcionam.
- Trocar o estilo do **site** (aba Visual), que é outra tela e outro dado.
- O modelo de dados — `specs/painel-casal/002`.

## Requisitos funcionais

*Escritos para a Opção A da pergunta em aberto (re-tematizar sem trocar o
desenho), que é a recomendação. A Opção B tornaria FR-004 e FR-005
irrelevantes.*

- **FR-001:** A trilha de ferramentas DEVE ganhar um item **Modelos**, em
  primeiro lugar, com o ícone `modelos` que `Icone.tsx` já tem.
- **FR-002:** O painel DEVE mostrar uma grade de 2 colunas com **seis**
  miniaturas em proporção 3:4, uma por entrada de `TEMPLATE_STYLES`, cada uma
  pintada com o `defaultTheme.palette` daquele molde e com os nomes do casal
  na `defaultTheme.fonts.display` — a mesma regra da galeria de estilos
  (`specs/site-publico/005` FR-006): cor e fonte vêm do preset, nunca de hex.
- **FR-003:** A miniatura do estilo **atual do site** DEVE vir contornada em
  `var(--c-mark)`, com `aria-current="true"`.
- **FR-004:** Clicar numa miniatura DEVE re-tematizar o convite: para cada
  bloco, trocar `cor` e `fundo` que **ainda estiverem nos valores do tema
  anterior** pelos correspondentes do tema novo. Cor que o casal escolheu à
  mão **não é tocada**.
- **FR-005:** Antes de aplicar, DEVE aparecer um `DialogoDestrutivo` (a peça
  já existe) com título `Trocar o modelo do convite?`, consequência
  `As cores e as fontes mudam para as do estilo novo. O texto e a posição dos
  blocos ficam como estão.` e botão `Trocar modelo`. A saída segura recebe o
  foco.
- **FR-006:** A troca DEVE gerar **uma** entrada de desfazer.
- **FR-007:** A troca NÃO PODE mexer em `doc.largura`/`doc.altura` nem na
  posição de bloco nenhum. Re-tematizar é cor e fonte; mexer em posição seria
  refazer o convite do casal.
- **FR-008:** O painel de Modelos NÃO PODE trocar o estilo do **site**. As
  duas escolhas são independentes desde `inviteSeed`, e ligá-las agora faria
  o casal mudar o site sem saber, a partir de uma tela de convite.

## Critérios de aceite

- **SC-001:** A trilha tem cinco ferramentas, com **Modelos** em primeiro
  lugar. Atende FR-001.
- **SC-002:** O painel mostra seis miniaturas, e a do Toscana tem `background`
  igual a `getTemplate("toscana").defaultTheme.palette.paper`. Atende FR-002.
- **SC-003:** Num site com `templateId = "film"`, a miniatura do Film tem
  contorno `--c-mark` e `aria-current="true"`. Atende FR-003.
- **SC-004:** Num convite recém-criado (todas as cores vindas do tema),
  trocar para o Romântico muda a cor de todos os blocos para o preset do
  Romântico. Atende FR-004.
- **SC-005:** Trocar a cor de um bloco à mão para `#123456` e depois trocar de
  modelo: aquele bloco continua `#123456`. Atende FR-004.
- **SC-006:** Clicar numa miniatura abre o diálogo antes de mudar qualquer
  coisa; `Manter` não altera o `doc`. Atende FR-005.
- **SC-007:** Depois de trocar, um `Ctrl+Z` volta o convite inteiro ao estado
  anterior. Atende FR-006.
- **SC-008:** `doc.largura`, `doc.altura` e todo `x`/`y`/`w` são idênticos
  antes e depois. Atende FR-007.
- **SC-009:** `sites.template_id` não muda ao trocar o modelo do convite.
  Atende FR-008.
- **SC-010:** `npm run build`, `npm run lint` e `npm run test` passam.

## Impacto em dados

**Depende da resposta.** Na Opção A: nenhum — a re-tematização escreve nos
mesmos campos `cor`/`fundo` do `doc`, e o convite não precisa lembrar de qual
modelo veio. Na Opção B (guardar `doc.template`): é chave nova dentro do
`jsonb`, aditiva, sem migração.

## Referências

- Protótipo: `Enlace - E Painel.dc.html` E9, artboard `EDITOR · DESKTOP ·
  1560` — a trilha `Modelos · Texto · Fotos · Formas · Fundo` e o painel
  `Modelos de convite` com a grade 2×3; artboard `EDITOR · MOBILE · 390` — as
  mesmas cinco abas no rodapé. `HANDOFF-editor-convite.md` §3 (árvore de
  componentes), §4 (o que cada painel faz), §9 critério 4 (*"Trocar de modelo
  re-tematiza sem perder o conteúdo textual"*).
- Versão atual: `components/account/convite/EditorDeConvite.tsx` (as quatro
  ferramentas existentes), `components/account/convite/controles.tsx`,
  `lib/site/inviteSeed.ts` (`conviteInicial(dados, cores)`),
  `lib/templates/registry.ts` (`getTemplate`), `lib/templates.ts`
  (`TEMPLATE_STYLES`). O painel de Modelos: **não existe — NOVO**.
- SDD do Enlace: §15.1 (o convite é peça avulsa), §4.2 (`ThemeSpec` e
  `defaultTheme` por molde).

## Dependências

- **Depende de** `specs/painel-casal/002-modelo-do-convite`.
- Compartilha a lógica de miniatura por preset com
  `specs/site-publico/005-galeria-de-estilos` — vale fazer as duas na mesma
  passada e extrair o componente uma vez só.

## Perguntas em aberto

1. **"Trocar de modelo" no convite significa o quê, exatamente?** O handoff
   §4 diz "troca `doc.template` e re-tematiza os elementos padrão", mas
   "elementos padrão" é ambíguo num convite que o casal já mexeu. Três
   leituras, e a escolha é do dono porque decide se o trabalho do casal
   sobrevive a um clique:

   - **Opção A — só cor e fonte, preservando o que foi escolhido à mão** (o
     que os FRs acima descrevem). Nada se perde. O casal que trocou uma cor
     de propósito continua com ela. **Recomendação.**
   - **Opção B — refazer o convite com o seed do estilo novo.** É o que
     "modelo" sugere num editor tipo Canva: a miniatura mostra um desenho, e
     clicar entrega aquele desenho. Mas isso apaga posições e blocos que o
     casal criou — e o handoff §9 critério 4 exige o contrário
     (*"sem perder o conteúdo textual"*). Só faria sentido com um seed por
     estilo, que hoje **não existe**: `conviteInicial` tem **um** layout, que
     recebe cores diferentes.
   - **Opção C — não fazer a ferramenta.** O convite já nasce com o tema do
     site; trocar depois é caso raro. Custo zero, e a divergência fica
     registrada.

2. **Se for a Opção B, quem desenha os seis convites?** Ela pressupõe seis
   layouts de convite desenhados, um por estilo — e o protótipo **não os
   desenha**: as seis miniaturas do artboard E9 são o mesmo cartão com cores e
   fontes trocadas, exatamente como a Opção A produziria. Isso é evidência
   forte a favor de A, mas a decisão continua sendo do dono.

## Decisão registrada — 27/08/2026

**Opção A: trocar de modelo é cor e fonte, nunca o desenho.**

Quem decidiu: **Nycolas**, ao mandar seguir com as specs em conflito. A Opção A
era a recomendação, e a evidência a favor dela estava no próprio protótipo: as
seis miniaturas do artboard E9 são **o mesmo cartão com cores trocadas** —
exatamente o que a Opção A produz. A Opção B pressupõe seis layouts de convite
desenhados, um por estilo, que não existem: `conviteInicial` tem um layout só.

E a Opção B apagaria posições e blocos que o casal criou, contra o critério 4
do próprio handoff (*"sem perder o conteúdo textual"*).

**A pergunta 2 caiu junto:** ela só existia se fosse a Opção B.

## Notas de implementação

### FR-001 partiu de uma premissa errada: não existe "trilha de ferramentas"

A spec pede um item **Modelos** "em primeiro lugar na trilha", e SC-001 fala em
"cinco ferramentas". O painel do editor não é uma trilha de ferramentas — é uma
pilha de seções (`Camadas`, `Acrescentar`, `Formas`, `Fundo`…). Não há o que
numerar.

O que foi feito é o que o requisito queria: a seção **Modelos** entra **em
primeiro lugar na pilha**. É a escolha que muda a tela inteira, e quem vai
trocar de estilo faz isso antes de posicionar bloco.

### A regra que protege a escolha do casal

`retematizarConvite` só troca a cor que **ainda é a do tema anterior**. Um
vermelho escolhido à mão não corresponde a nenhum papel do tema antigo, então
nenhuma troca o alcança. É o que separa "re-tematizar" de "sobrescrever" — e
sobrescrever seria a ferramenta discutindo com quem já tinha decidido.

A comparação ignora maiúsculas: o `<input type="color">` devolve minúsculas,
mas os presets e um `doc` gravado por versão antiga podem trazer `#B8985F`. Sem
isso, a mesma cor em caixa diferente sobreviveria à troca por engano.

### A paleta de referência avança a cada troca

`paletaAtual` é um `useRef` que começa na paleta do site e é atualizado a cada
troca. A segunda troca precisa comparar contra a paleta **atual**, não contra a
do site — que ficou para trás na primeira. Sem isso, trocar duas vezes deixaria
de reconhecer as cores e a segunda troca não mudaria nada.

### As paletas são extraídas no SERVIDOR

Primeira tentativa importou o `registry` dentro do painel, que é client
component. O build reprovou com *"It is not allowed to define inline `use cache`
annotated functions in Client Components"*: os seis moldes arrastam as seções,
e as seções carregam consultas com `"use cache"`. Nasceu
`lib/templates/modelos.ts`, que roda no servidor e entrega seis objetos de
quatro cores. A regra de §4.4.1 continua valendo — a cor vem do `defaultTheme`,
nunca de hex escrito na tela, e um teste reprova qualquer hex no componente.

## Como cada critério foi conferido

| Critério | Medida |
|---|---|
| SC-001 | **corrigido**: não há trilha; a seção Modelos entra em primeiro lugar na pilha do painel |
| SC-002 | uma miniatura por modelo, com o `paper` do preset como fundo (`#f3eddd` no Toscana); zero hex no componente |
| SC-003 | com o site em `film`, a miniatura do Film tem `aria-current="true"` e borda `--c-mark`; as outras, `--c-rule`. Sem estilo definido, nenhuma marcada |
| SC-004 | convite semeado troca inteiro: `ink`, `paper`, `accent` e o fundo do documento |
| SC-005 | bloco em `#123456` atravessa intacto, e o resto troca normalmente. Preenchimento vazio continua vazio |
| SC-006 | clicar abre o `DialogoDestrutivo` com o texto literal e **não** troca nada; o foco vai para `Manter`; `Trocar modelo` entrega a paleta daquele modelo |
| SC-007 | `mudar` seguido de `registrar(antes)` — o mesmo par do arrasto, uma entrada de desfazer |
| SC-008 | `largura`, `altura` e todo `x`/`y`/`w`/`rotacao` idênticos antes e depois; ordem das camadas idêntica; foto atravessa intacta; trocar de volta devolve o convite original |
| SC-009 | o painel não menciona `templateId` nem nenhuma action de tema; a troca não toca no site |
| SC-010 | `build`, `lint` e `test` (53 arquivos, 629 testes) |
