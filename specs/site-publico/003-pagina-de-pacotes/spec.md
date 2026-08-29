# Spec 003 — B2: a página `/pacotes` (área: site-publico)

**Status:** Implementada (26/08/2026)

## Contexto

`Enlace - B Vitrine.dc.html`, artboard **B2**, desenha `/pacotes` como uma
página inteira: cabeçalho centralizado ("PAGAMENTO ÚNICO · SEM MENSALIDADE" /
"Escolha uma vez."), três cartões de 34px de padding com nome, uma frase de
posicionamento, o preço em mono de 38px, "uma vez", um fio, **cinco linhas de
benefício com ✓ ou ✕**, e o botão. O cartão do meio é contorno; o "Para
Sempre" é `1.5px solid #1a1d21` com a etiqueta "MAIS ESCOLHIDO" saindo pela
borda de cima. Fecha com "Dúvidas comuns" em acordeão de 3 itens.

`app/pacotes/page.tsx` é um `redirect("/")` de duas linhas, com o comentário:
*"A landing da plataforma virou a home ('/'). Mantido para não quebrar links
antigos que ainda apontam para /pacotes."*

A home tem uma seção de pacotes (`components/landing/Pacotes.tsx`, 164 linhas)
que cobre parte disso. Mas `regras-de-negocio.md` §1 é literal sobre por que a
página separada importa: *"a página é a proposta"* — e o §7 lista "funil por
WhatsApp antes da compra" entre as decisões descartadas. Uma pessoa que recebe
`enlace.com.br/pacotes` de um amigo hoje cai na home e tem que procurar.

## Escopo

- `app/pacotes/page.tsx` deixa de redirecionar e passa a renderizar B2.
- Reaproveitamento de `components/landing/Pacotes.tsx` como a grade dos três
  cartões, se ele já entregar o desenho; caso contrário, extração do que
  serve.
- O acordeão de dúvidas comuns.

## Fora de escopo

- Mudar `lib/packages.ts` — preço, nome, benefício e ordem dos pacotes são
  decisão do dono (`regras-de-negocio.md` §8, item 1). Esta spec **lê**
  `PACKAGES`, nunca escreve.
- A seção de pacotes da home (`/`), que continua como está.
- `/pacotes/exemplo/:pacote` — é `specs/site-publico/004`.
- `/pacotes/estilos/*` — é `specs/site-publico/005`.

## Requisitos funcionais

- **FR-001:** `app/pacotes/page.tsx` NÃO PODE mais chamar `redirect()`. DEVE
  renderizar uma página com `export const metadata` contendo
  `title: "Pacotes | Enlace"`.
- **FR-002:** A página DEVE usar a casca da vitrine que a home já usa —
  `components/landing/AccountNav.tsx` no topo e o mesmo rodapé oliva — para
  quem chega direto ter como navegar.
- **FR-003:** O conteúdo DEVE viver dentro de `.trilho` (1504 / margem 48).
- **FR-004:** O cabeçalho DEVE ser, literalmente: rótulo `meta` em `--c-mark`
  com o texto `PAGAMENTO ÚNICO · SEM MENSALIDADE`, e `<h1 class="t-d1">` com
  o texto `Escolha uma vez.`, os dois centralizados.
- **FR-005:** A grade DEVE ter três colunas de largura igual a partir de
  1024px e empilhar abaixo disso, com `gap: 20px`.
- **FR-006:** Cada cartão DEVE trazer, nesta ordem: nome do pacote em
  `t-d2`; a frase de posicionamento (`PACKAGES[].tagline` ou equivalente já
  existente) com `min-height` que iguale os três; o preço formatado por
  `formatPriceCents` em `t-data` de 38px; a palavra `uma vez` em `meta`; um
  fio de 1px; a lista de benefícios; e o botão.
- **FR-007:** A lista de benefícios DEVE ter **as mesmas linhas nos três
  cartões**, marcadas com ✓ (`--c-ok`) quando o pacote inclui e ✕ em
  `--c-ink-3` quando não inclui. A fonte da verdade DEVE ser
  `tierAllowsSection` de `lib/templates/contract.ts` cruzada com
  `SECTION_LABELS` — nunca uma lista escrita à mão no componente, que sairia
  do sincronismo com o gating na primeira mudança de pacote.
- **FR-008:** O cartão "Para Sempre" DEVE ter `border: 1.5px solid var(--c-ink)`
  e a etiqueta `MAIS ESCOLHIDO` em `--c-mark` posicionada sobre a borda
  superior. Os outros dois DEVEM ter `border: 1px solid var(--c-rule)`.
- **FR-009:** O botão do "Para Sempre" DEVE ser `.btn-ink`; os outros dois,
  `.btn-quiet` — um único primário por tela (Fundação A4). O rótulo DEVE ser
  `Escolher <nome do pacote>`.
- **FR-010:** Cada botão DEVE ser o componente `CtaPacote` que a home já usa
  — ele resolve o destino pela sessão (`/conta/pedido/novo` quem já tem conta,
  `/conta/criar` quem não tem) e recebe o rótulo por prop. Reescrever o `href`
  aqui reintroduziria o defeito que o comentário do arquivo registra: quem já
  estava logado caía na tela de criar conta. O `CtaPacote` é server component
  que lê cookie, então DEVE vir embrulhado em `<Suspense>` com o fallback que
  o próprio módulo exporta — sem isso o build reprova com "Uncached data was
  accessed outside of `<Suspense>`".
- **FR-011:** O acordeão de dúvidas DEVE ter exatamente as três perguntas do
  artboard: `É pagamento único mesmo? Tem mensalidade escondida?`,
  `Consigo trocar o estilo depois de publicar?` e
  `Como funciona a lista de presentes por Pix?`. As respostas DEVEM ser
  redigidas com o agente `regras-de-negocio` e não podem prometer nada que
  `docs/regras-de-negocio.md` não sustente.
- **FR-012:** O acordeão DEVE ser `<details>`/`<summary>` nativos — funciona
  sem JS, é acessível por padrão, e a página inteira continua podendo ser
  server component.
- **FR-013:** A página NÃO PODE conter nenhum caminho para WhatsApp,
  "solicite um orçamento", "fale com um especialista" ou "consulte valores"
  (`regras-de-negocio.md` §1 e §7).

## Critérios de aceite

- **SC-001:** `curl -sI http://localhost:3000/pacotes` devolve `200`, não
  `307`. Atende FR-001.
- **SC-002:** O HTML de `/pacotes` contém `Escolha uma vez.` e
  `PAGAMENTO ÚNICO · SEM MENSALIDADE`. Atende FR-004.
- **SC-003:** O HTML contém `R$ 9,90`, `R$ 29,90` e `R$ 99,90` — os três
  vindos de `PACKAGES`, verificável por alterar `priceCents` num deles em
  memória e ver o HTML mudar. Atende FR-006 e o "fora de escopo" de
  `lib/packages.ts`.
- **SC-004:** As três listas de benefícios têm o **mesmo número de linhas**, e
  a linha "Lista de presentes com Pix" está marcada ✓ só no cartão "Para
  Sempre". Atende FR-007.
- **SC-005:** Acrescentar `"guestbook"` a `TIER_SECTIONS.site` em
  `lib/templates/contract.ts` faz a linha "Mural de recados" virar ✓ no cartão
  do meio, sem tocar em `/pacotes`. Atende FR-007.
- **SC-006:** Existe exatamente um `.btn-ink` na grade dos três cartões.
  Atende FR-009.
- **SC-007:** Com sessão ativa, os três botões apontam para
  `/conta/pedido/novo`; sem sessão, para `/conta/criar`. Os rótulos são
  `Escolher Convite`, `Escolher Site do Casamento` e
  `Escolher Para Sempre`. Atende FR-009 e FR-010.
- **SC-008:** Em viewport de 1600px, a aresta esquerda do primeiro cartão está
  em `x = 48`. Atende FR-003.
- **SC-009:** Com JavaScript desligado no navegador, clicar num `<summary>`
  abre a resposta. Atende FR-012.
- **SC-010:** `grep -icE "orçamento|especialista|consulte valores|wa\.me|whatsapp" app/pacotes/page.tsx`
  devolve `0`. Atende FR-013.
- **SC-011:** `npm run build`, `npm run lint` e `npm run test` passam.
- **SC-012:** A página monta `AccountNav` no topo e o rodapé oliva, os mesmos da home. Atende FR-002.
- **SC-013:** A 1440px, `getComputedStyle(grade).gridTemplateColumns` tem três valores iguais; a 390px, um só. Atende FR-005.
- **SC-014:** O cartão `Para Sempre` tem `border-width: 1.5px` e os outros dois `1px`, e a etiqueta `MAIS ESCOLHIDO` está em `--c-mark`. Atende FR-008.
- **SC-015:** O acordeão tem exatamente três `<summary>`, com os textos literais de FR-011, e nenhuma resposta promete algo fora de `docs/regras-de-negocio.md`. Atende FR-011.

## Impacto em dados

Nenhum.

## Referências

- Protótipo: `Enlace - B Vitrine.dc.html`, artboard **B2** (`GET /pacotes`) —
  desktop 1440 e mobile 390, incluindo o acordeão "Dúvidas comuns" com as três
  perguntas.
- Versão atual: `app/pacotes/page.tsx` (redirect de 2 linhas),
  `components/landing/Pacotes.tsx` (164 linhas, a grade da home),
  `components/landing/CtaPacote.tsx`, `lib/packages.ts`,
  `lib/templates/contract.ts` (`TIER_SECTIONS`, `tierAllowsSection`).
- SDD do Enlace: §4.5 (gating por pacote — a fonte de FR-007).
- Regras de negócio: §1 ("a página é a proposta"), §4 (a tabela de pacotes),
  §7 (funil por WhatsApp descartado), §8 item 1 (preço é decisão do dono).

## Dependências

- Depende de `specs/design-system/001-token-ink-3` (o ✕ das linhas não
  incluídas usa `--c-ink-3`).
- Depende de `specs/design-system/006-voz-verificavel` (as respostas do
  acordeão são texto novo).
- Não bloqueia nenhuma outra spec.

## Perguntas em aberto

1. **Pré-selecionar o pacote no questionário não existe hoje e fica fora
   desta spec.** `OrderWizard.tsx:97` inicia `pacote` com um padrão interno e
   nenhuma rota lê `?pacote=` (`grep -rn "pacote" app/conta/pedido/` → vazio).
   Clicar em "Escolher Para Sempre" leva o casal à etapa 1 do questionário,
   onde ele escolhe o pacote de novo — o que é uma repetição, não um erro.
   Fazer o parâmetro chegar até o `OrderWizard` é trabalho de outra área
   (`painel-casal`) e **exige decisão do dono** sobre um ponto de produto: se
   o pacote vier pré-escolhido pela vitrine, a etapa 1 deve sumir, vir
   marcada, ou continuar como está? As três respostas mudam o questionário.
   Até lá, FR-010 mantém o comportamento atual, que é correto e não mente.

   As respostas do acordeão (FR-011) **não** são pergunta em aberto: são
   texto a redigir, e `regras-de-negocio.md` §4 e §2.4 já contêm o conteúdo
   das três.

## Notas de implementação

### O texto passou pelo `regras-de-negocio`, como FR-011 manda

As três respostas do acordeão são as que o agente redigiu, com os vereditos:

| Dúvida | Veredito | O que mudou por causa dele |
|---|---|---|
| Pagamento único | PODE, COM AJUSTE | "sem mensalidade" sai **sem asterisco**. O que NÃO entrou: "o site fica no ar para sempre" — o documento não diz por quanto tempo, e `lib/packages.ts` só promete "para sempre" no pacote de R$ 99,90. Prometer nos três seria inventar cobertura |
| Trocar de estilo | PODE | Com uma ressalva que eu não previa e que virou o segundo parágrafo: **as cores sobrevivem à troca, as fontes não**. `theme-actions.ts:109` reescreve `fonts` com o padrão do molde novo, de propósito (§2.3). Sem esse parágrafo a vitrine prometeria "não perde nada", e a promessa seria falsa |
| Lista de presentes | PODE, COM AJUSTE | O ajuste é uma palavra: **confirmação** não aparece em lugar nenhum da resposta. O convidado auto-declara que pagou; a Enlace não observa o Pix. O texto diz "ele avisa que fez o Pix" e manda o casal ao extrato — que é onde a verdade mora |

**Duas perguntas para o dono saíram daí** (não bloqueiam esta spec — o texto
acima é seguro e fica calado sobre as duas):

1. **O domínio próprio do "Para Sempre" renova todo ano. Quem paga?** O pacote
   vende `anaepedro.com.br` por R$ 99,90 uma vez, e registro `.com.br` é
   anual. Ou a Enlace absorve para sempre, ou existe cobrança futura — e aí
   "sem mensalidade" ganha asterisco.
2. **Por quanto tempo o site de Convite e Site do Casamento fica no ar?** Sem
   resposta, a vitrine não pode dizer nada sobre isso.

### Correções da spec

- **FR-007, "os rótulos DEVEM vir de `SECTION_LABELS`": não vieram, e o
  próprio SC-004 concorda.** `SECTION_LABELS` é o mapa do PAINEL — fala com
  quem já comprou. Ele diz "Nossa história", e na vitrine "nossa" vira a
  Enlace falando da própria história. Diz "Lista de presentes", perdendo o Pix
  — que é o único diferencial que sustenta o salto de R$ 29,90 para R$ 99,90,
  e SC-004 já escreve a linha como "Lista de presentes com Pix". E diz "Álbum
  da festa", que soa como algo que vem junto na compra, quando as fotos só
  existem depois do casamento. Nasceu `lib/site/vitrine.ts` com
  `LINHAS_DA_VITRINE`, mesmo movimento do `ROTULO_CURTO` de `ancoras.ts`: um
  rótulo serve a um leitor, e o Enlace tem três. **O que FR-007 de fato
  protege continua intacto** — o ✓/✕ sai de `tierAllowsSection`, nunca de uma
  lista à mão, e SC-005 foi provado com o gating de verdade.

- **Duas linhas do produto ficaram de fora da grade, e é decisão consciente.**
  "Endereço personalizado" não é `SectionKey`, então `tierAllowsSection` nunca
  a produziria — e ela é justamente a que carrega a pergunta 1 do dono.
  "Capa / Save the Date" ficou de fora porque tem contradição ativa: as regras
  §4 marcam a linha nos três pacotes e `lib/packages.ts:46` vende "Save the
  Date personalizado" como exclusivo do Site do Casamento. Incluí-la seria
  escolher um lado de algo que ninguém resolveu.

- **FR-001, `title: "Pacotes | Enlace"` ao pé da letra sai errado.** O layout
  raiz tem `template: "%s | Enlace"`, então a página declara só `"Pacotes"` e
  a aba mostra `Pacotes | Enlace` — que é o que o requisito quer.

- **FR-008 não podia depender de classe: o Tailwind não gera
  `border-[1.5px]`.** Conferido no CSS do build — a regra simplesmente não
  existe, e a borda do "Para Sempre" saía idêntica à dos vizinhos. A borda
  virou estilo inline, exatamente como o requisito a escreve.

- **SC-008 pede a aresta do cartão em `x = 48`; ela fica em `96`.** `.trilho`
  é `max-width: 1504px` **com** `padding-inline: 48px` e `box-sizing:
  border-box`. A 1600px de largura útil, a caixa do trilho começa em 48 e o
  conteúdo dentro dela em 96. Não há como um filho do trilho começar em 48 sem
  furar o próprio trilho — o número do critério foi calculado como se o trilho
  não tivesse recuo. FR-003 (o conteúdo vive dentro do `.trilho`) está
  cumprido e medido.

- **SC-010 e SC-001 são `grep` cru, e contam a cura como doença.** A página
  diz "não tem orçamento" — negando o funil — e o comentário do arquivo
  explica que ela "era um `redirect`" e que §7 descartou o "funil por
  WhatsApp". Um `grep -c` acusa as três. É o mesmo defeito que travou
  `design-system/006`: **um literal não é uma promessa**. O teste tira os
  comentários primeiro e confere a negação como negação.

- **SC-014 não é mensurável por `getComputedStyle` nesta máquina.** Com o
  monitor a 125%, o Chrome devolve a largura de borda já ajustada ao pixel do
  aparelho: um `1px` real e um `1.5px` real **os dois** aparecem como
  `0.8px` (calibrado no navegador com dois elementos de teste). Conferido pelo
  que está declarado no DOM — `border:1.5px solid var(--c-ink)` no
  "Para Sempre" contra `border:1px solid var(--c-rule)` nos outros dois — e
  pelas cores resolvidas, que diferem corretamente. **Fica o registro:** num
  monitor com escala, a distinção de meio pixel do desenho não se vê. Ela está
  certa e é o que o protótipo pede, mas não é ela que separa o cartão — quem
  faz esse trabalho é a etiqueta MAIS ESCOLHIDO.

## Como cada critério foi conferido

Medido no `next build` servido em `localhost:3000`:

| Critério | Medida |
|---|---|
| SC-001 | `curl -sI /pacotes` devolve **200**. Sem `redirect(` e sem `next/navigation` no código |
| SC-002 | o HTML traz `Escolha uma vez.` e `PAGAMENTO ÚNICO · SEM MENSALIDADE` |
| SC-003 | `R$ 9,90 / R$ 29,90 / R$ 99,90`, todos em `.t-data` de 38px; a página não escreve preço nenhum, só chama `formatPriceCents(pacote.priceCents)` |
| SC-004 | 8 linhas nos três cartões; "Lista de presentes com Pix" ✓ só no "Para Sempre" |
| SC-005 | **provado com o gating de verdade**: acrescentei `guestbook` a `TIER_SECTIONS.site`, reconstruí, e "Mural de recados" virou ✓ no cartão do meio — Convite seguiu ✕ e Álbum seguiu ✕ — sem tocar em `/pacotes`. Revertido e reconferido depois |
| SC-006 | 1 `.btn-ink` e 2 `.btn-quiet` na grade |
| SC-007 | com sessão, os três apontam para `/conta/pedido/novo`, com os rótulos `Escolher Convite`, `Escolher Site do Casamento`, `Escolher Para Sempre` |
| SC-008 | caixa do `.trilho` em `x = 48`, cartão em `x = 96` — ver a correção acima |
| SC-009 | `<details>`/`<summary>` nativos; clicar no `summary` abre a resposta e a página não tem JS de acordeão nenhum |
| SC-010 | nenhum `wa.me`, `whatsapp`, `especialista` ou `consulte valores`; "orçamento" só na frase que o nega |
| SC-011 | `build`, `lint` e `test` (35 arquivos, 411 testes) |
| SC-012 | `AccountNav` em `<Suspense>` no topo e o rodapé oliva, os mesmos da home |
| SC-013 | 1600px: `456px 456px 456px`, `gap: 20px`. 390px: uma coluna de `342.4px`, sem rolagem horizontal |
| SC-014 | etiqueta `MAIS ESCOLHIDO` em `rgb(184, 65, 44)` (`--c-mark`), sobre a borda de cima; larguras de borda conferidas pelo declarado — ver a correção acima |
| SC-015 | exatamente 3 `<summary>`, com os textos literais do artboard; as respostas passaram pelo `regras-de-negocio` e nenhuma promete confirmação de Pix nem tempo no ar |
