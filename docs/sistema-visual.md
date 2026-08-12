# Sistema visual do Enlace — Passada 1 (tokens)

Escrito em 10/08/2026. **Documento de aprovação: nenhuma tela foi tocada.**

Segue o formato que o item 2 de
[plano-analise-concorrencia.md](plano-analise-concorrencia.md) exige — o que
muda, em qual das duas telas, o que NÃO muda, e como saber que ficou pronto —
porque essa regra nasceu de "widescreen" ter sido entendido como site do
convidado e quase virar 5 a 8 dias na coisa errada.

---

## 0. O diagnóstico, conferido na fonte

Não é opinião. Está no código:

| Achado | Onde |
|---|---|
| `--color-paper: #f2efe7`, `--color-olive: #3d4a36`, `--color-gold: #b8985f` | [globals.css:4-7](../app/globals.css#L4-L7) |
| Display serifada de **um peso só** (Italiana 400) + script de casamento (Petit Formal Script) | [layout.tsx:5-15](../app/layout.tsx#L5-L15) |
| Corpo do painel é **Inter** — a fonte padrão de todo painel gerado | [AccountShell.tsx:6](../components/account/AccountShell.tsx#L6) |

Isso é o primeiro agrupamento catalogado pelo skill: **fundo creme com
serifada**. O sócio não está reagindo à paleta por gosto — está reconhecendo
um padrão.

### "Centralizada demais, encurtada e desalinhada" tem causa exata

Achei o defeito, e ele é medível, não estético:

```
header:  max-w-3xl  mx-auto   →   768px     AccountShell.tsx:29
main:    max-w-7xl  mx-auto   →  1280px     AccountShell.tsx:56
```

**O cabeçalho e o conteúdo estão em trilhos diferentes, ambos centralizados.**
Em 1440px a marca "Enlace" começa em x≈336 e o conteúdo começa em x≈80 — 256px
de desencontro entre o logo e o título da página logo abaixo dele. Não existe
uma aresta esquerda comum na tela inteira. É literalmente "desalinhado", e
nenhuma paleta nova conserta isso.

O resto do "vazio e sem vida", também no código:

- **Um `gap-8` para tudo** ([AccountShell.tsx:56](../components/account/AccountShell.tsx#L56)).
  Espaçamento uniforme entre todos os blocos = nenhuma hierarquia. O olho não
  recebe a informação de que uma coisa pertence à outra.
- **Todo card é o mesmo card**: `rounded-2xl border bg-white p-5/p-6` repetido
  em destaque, atalho e pedido. Sem peso, tudo é secundário.
- **`h1` em `text-2xl`** (24px) num trilho de 1280px
  ([page.tsx:73](../app/conta/page.tsx#L73)). Título de página com corpo de
  subtítulo — daí "encurtada".
- **Emoji como ícone** (💚 💍 📦 🎨 💬). É um dos tells mais fortes de
  interface gerada.

---

## a) COR — duas direções opostas

A âncora não é "o que combina com casamento". É o **material**: o que existe
numa gráfica de papelaria fina e numa festa de fim de tarde.

### Direção A — "Prensa" (papel de algodão, tinta ferrogálica, selo)

O mundo da tipografia impressa: papel de algodão prensado, tinta que oxidou
para um preto azulado, e a **única** cor saturada da mesa — o vermelho da
marca de registro e do lacre.

| Papel | Token | Hex | Onde |
|---|---|---|---|
| Fundo | `--c-base` | `#EFEFEC` | fundo da aplicação — **cinza-neutro, sem amarelo** |
| Superfície | `--c-surface` | `#FFFFFF` | cards |
| Sulco | `--c-sunken` | `#E5E5E0` | campos, trilhos, deboss |
| Tinta | `--c-ink` | `#1A1D21` | texto principal (**14.8:1** sobre base) |
| Tinta fraca | `--c-ink-2` | `#5A5F66` | secundário (**6.4:1**) |
| Fio | `--c-rule` | `#C9C9C2` | bordas de 1px |
| Acento | `--c-mark` | `#B8412C` | vermelhão de registro — **usado uma vez por tela** |

**O que comunica:** ofício, precisão, "uma gráfica de verdade fez isto".
Editorial e contido. O contraste altíssimo (14.8:1) é o oposto do creme com
oliva, que vive em 7:1 e por isso parece lavado.

**O risco:** contenção demais vira frio. O calor tem que vir da tipografia e
da fotografia do casal, não da paleta.

### Direção B — "Anoitecer" (o tecido e a luz da festa)

O oposto pelo eixo quente/atmosférico: linho tingido, índigo, garança
(*madder*), e a luz de vela. **Não é dark mode com acento ácido** — esse é o
segundo agrupamento catalogado, e ele se reconhece pelo neon. Aqui o claro é
âmbar de chama, nunca saturado.

| Papel | Token | Hex | Onde |
|---|---|---|---|
| Fundo | `--c-base` | `#F2EDE8` | linho cru, quente mas **sem o verde do creme atual** |
| Superfície | `--c-surface` | `#FFFFFF` | cards |
| Sulco | `--c-sunken` | `#E8DFD7` | campos |
| Tinta | `--c-ink` | `#232B3D` | índigo profundo (**12.9:1**) — azul, não oliva |
| Tinta fraca | `--c-ink-2` | `#5C6478` | secundário (**5.8:1**) |
| Fio | `--c-rule` | `#D6CCC3` | bordas |
| Acento | `--c-mark` | `#A8563C` | garança / terracota |
| Luz | `--c-glow` | `#E8C79A` | vela — **só em fundo, nunca em texto** |

**O que comunica:** a noite da festa, intimidade, ocasião. Mais acolhedor,
mais fotográfico.

**O risco:** é o mais próximo de onde estamos. Índigo+terracota ainda pode ser
lido como "paleta de casamento". Se o objetivo é o sócio olhar e não
reconhecer, **a Direção A distancia mais**.

> **Minha recomendação: A.** O diagnóstico é "parece o mesmo de sempre", e o
> salto de creme-quente-oliva para cinza-frio-tinta-vermelhão é o maior
> disponível sem cair no segundo clichê. A B é a escolha segura; e o skill diz
> que não arriscar também é risco.

---

## b) TIPOGRAFIA — pares com motivo

Hoje: **Italiana 400** (um único peso — hierarquia por peso é impossível),
**Petit Formal Script** (a fonte de convite de casamento), e **Inter** no
painel. Serifada de ocasião para tudo + o sans padrão do mundo.

O painel é **80% formulário e tabela**. Display e corpo têm trabalhos
diferentes e por isso não podem ser a mesma família.

### Par para a Direção A

| Papel | Fonte | Por que existe |
|---|---|---|
| Display | **Instrument Serif** | Serifada de alto contraste, editorial. Tem presença em 44px e não é a serifada de casamento — lê como revista, não como convite. |
| Corpo | **IBM Plex Sans** | Sans industrial com letras levemente estranhas (o `a`, o `g`). Lê como *desenhada*, não como padrão. Peso real de 400 a 600 para hierarquia. |
| Dado | **IBM Plex Mono** | Número de pedido, data, valor, slug. É a marca de registro da gráfica aplicada à interface — e resolve o alinhamento de coluna em tabela, que a proporcional nunca resolve. |

### Par para a Direção B

| Papel | Fonte | Por que existe |
|---|---|---|
| Display | **Fraunces** | Variável, com eixos ópticos e de "wonk". Quente e humanista, com pesos de verdade — o oposto de Italiana travada em 400. |
| Corpo | **Karla** | Grotesca de terminações levemente irregulares. Neutra o bastante para formulário, com personalidade suficiente para não ser Inter. |
| Dado | **Fraunces** em tabular | Mantém uma família a menos no bundle. |

### Restrições de implementação (de AGENTS.md, não negociáveis)

- Cada fonte vai para um **`const` no escopo do módulo**. Dentro de objeto
  literal falha o build com *"Font loaders must be called and assigned to a
  const in the module scope"*.
- **`vitest.setup.ts` mocka `next/font/google` com uma lista explícita de
  nomes.** Fonte nova sem o loader adicionado lá derruba a suíte.
- Declarar N fontes num módulo embarca o CSS das N. As do painel ficam num
  módulo do painel, **fora** de `lib/templates/<id>/fonts.ts`.
- **Não entram no catálogo dos moldes.** `clampThemeFonts` recorta a escolha
  do casal ao catálogo do molde; fonte de painel vazando para lá é uma Amatic
  SC destruindo o Clássico.

---

## c) DENSIDADE E RITMO

"Vazio" não se resolve com enfeite. Se resolve com **um trilho só, hierarquia
de escala e espaçamento que varia conforme a relação entre os blocos.**

### 1. Um trilho, com aresta esquerda de verdade

O conserto de maior retorno da refatoração inteira:

```
hoje    header 768px centralizado  ·  main 1280px centralizado
depois  header e main no MESMO trilho de 1200px, mesma aresta esquerda
```

E o conteúdo deixa de ser pilha centralizada: **grade de 12 colunas**, com o
principal em 1–8 e o metadado em 9–12. É isso que mata "centralizada demais" —
hoje literalmente tudo é `mx-auto` sobre pilha vertical.

### 2. Escala de espaçamento (base 4px)

```
--s-1: 4    --s-2: 8    --s-3: 12   --s-4: 16
--s-6: 24   --s-8: 32   --s-12: 48  --s-16: 64  --s-24: 96
```

A escala importa menos que **a regra de uso**, que é o que falta hoje:

| Relação | Espaço |
|---|---|
| Dentro de um componente | `--s-2` a `--s-4` (8–16) |
| Entre blocos irmãos | `--s-6` a `--s-8` (24–32) |
| **Entre seções da página** | `--s-16` a `--s-24` (64–96) |

Hoje é `gap-8` (32px) para os três casos. Um espaço só para todas as relações
é exatamente o que faz uma tela parecer "lista de cards" em vez de página
desenhada — e, por não separar seção de seção, faz parecer vazia e apertada ao
mesmo tempo.

### 3. Escala tipográfica (1440 / 390)

| Papel | Desktop | Celular | Entrelinha |
|---|---|---|---|
| Display | 44px | 32px | 1.05 |
| Título de página | 30px | 24px | 1.15 |
| Título de seção | 20px | 18px | 1.3 |
| Corpo | 16px | 16px | 1.55 |
| Meta / rótulo | 12.5px | 12.5px | 1.4, tracking 0.06em |

O `h1` sai de 24px para 30px no desktop. Corpo **não encolhe** no celular —
restrição 4 diz que 390px não pode piorar, e 16px também evita o zoom
automático do iOS em campo de formulário.

### 4. Peso, para nem tudo ser secundário

Três níveis de superfície, em vez do card único de hoje: **elevado** (a ação
principal — superfície branca sobre o fundo, com o deboss da assinatura),
**plano** (o conteúdo comum — só fio de 1px, sem fundo) e **sulcado** (campo e
trilho). Hoje os três são `rounded-2xl border bg-white`.

---

## d) ASSINATURA — a prova de impressão

**Uma coisa só, num lugar só.** O painel trata cada pedido como uma **prova de
gráfica**.

O gasto de ousadia fica em **um** elemento: o estado do pedido em
`/conta/pedidos/<id>` deixa de ser a pílula colorida de sempre e vira um
**carimbo de prova sobreimpresso** — rotacionado alguns graus, no vermelhão
`--c-mark`, com contorno vazado e a data por baixo, como o carimbo de
aprovação que um revisor bate numa folha. `PROVA APROVADA · 10.08.2026`.

Por que este e não outro:

- **É do assunto.** Sai do vocabulário da gráfica, que é o mundo do produto —
  papelaria de casamento — e não de "dashboard".
- **Ninguém faz.** Todo painel tem badge de status arredondado. O carimbo é
  imediatamente não-genérico e não pede biblioteca nova: é `border`,
  `transform: rotate()` e a fonte mono.
- **Cai no lugar de maior atenção.** É a tela que o casal reabre para ver se
  saiu do forno.
- **Sobrevive às duas direções de cor** e ao `prefers-reduced-motion` (é
  estático).
- **Não conflita com nada.** É pintura sobre um dado que já existe
  (`STATUS_META` em [lib/orderStatus.ts](../lib/orderStatus.ts)).

O resto da interface fica **contido** — fio de 1px, sem sombra colorida, sem
gradiente, sem segundo acento. É essa contenção que faz o carimbo funcionar.

---

## O que NÃO muda

1. **O site do convidado (`/s/<slug>`) não entra.** Cor e fonte vêm do
   `ThemeSpec` do casal; `npm run verify:template` reprova hex escrito na
   seção. Nenhum token deste documento chega em `lib/templates/*`.
2. **As animações não são refeitas.** `--t-rapido/base/lento`, as curvas, os
   keyframes e o bloco `prefers-reduced-motion` de
   [globals.css:22-41](../app/globals.css#L22-L41) e
   [300-337](../app/globals.css#L300-L337) ficam intactos. Trocar token de cor
   não os afeta — `.motion-skeleton` já deriva de `currentColor` de propósito.
3. **`npx shadcn init` não roda.** Ele reescreveria `app/globals.css` com as
   variáveis dele e apagaria justamente os tokens de movimento acima. O MCP do
   shadcn é para **consultar** e copiar o que servir.
4. **O celular não piora.** 390px é o desenho de origem.
5. **Nada de banco.** Sem migração, sem `drizzle-kit push`. Esta passada é CSS
   e marcação.
6. **`main` não recebe commit.** Branch própria.

---

## ⚠️ Dois conflitos que preciso apontar, não decidir sozinho

### 1. As fontes da plataforma são as mesmas do site do convidado

`app/layout.tsx` declara `--font-serif` (Italiana) e `--font-script` no
**root**, e o root embrulha tudo. Grep: **33 arquivos** dependem dessas
variáveis, e entre eles estão

- `lib/templates/{classico,toscana,romantico,moderno,film}/sections.tsx`
- `lib/theme/css.ts`
- `app/rsvp/[slug]/not-found.tsx` e `components/RsvpCard.tsx`

**Trocar a fonte do painel removendo as declarações do root quebraria o site do
convidado e a rota `/rsvp/<slug>`** — que é a restrição nº 1 e tem 22
confirmações de gente real e links já no WhatsApp.

**Como resolvo, se você aprovar:** as fontes do painel entram **de forma
aditiva** — consts e variáveis CSS novas (`--f-ui-display`, `--f-ui-body`,
`--f-ui-mono`), aplicadas no `AccountShell` e na landing. `--font-serif` e
`--font-script` **continuam declaradas e intocadas**. Nada é removido nesta
passada; limpeza, se couber, é depois e com o site do convidado verificado.

### 2. Os emoji são conteúdo, não só ícone

💚 💍 📦 🎨 💬 aparecem em texto que o casal lê ("Olá, Anderson 💚", "Vamos
montar o site de casamento de vocês? 💍"). Trocá-los por ícone desenhado
muda o **tom de voz**, não só o visual — e o tom caloroso pode ser proposital.

Minha leitura: emoji como **ícone de card** (📦 🎨 💬) sai, porque é tell de
interface gerada; emoji **no meio da frase** (💚 💍) é decisão sua, não minha.
Digo o que acho e faço o que você escolher.

### 3. Menor, mas vale registrar

`app/layout.tsx:18` tem `title: "Isabelle & Nycolas | Save the Date"` no
metadata **do root da plataforma** — o casal legado dando título a todas as
telas da plataforma, painel incluso. É pré-existente e fora do escopo desta
passada. Só não quero que passe batido.

---

## Como saber que a Passada 2 ficou pronta

- Contraste medido com o chrome-devtools **nas telas logadas** (casal.teste@enlace.com), nada abaixo de **4.5:1** — confirmando a URL antes de confiar no número, porque uma auditoria anterior caiu de volta no login e auditou a própria tela de login.
- `npm run build`, `npx tsc --noEmit`, `npx eslint` limpos.
- `npm run test` em **293/293**, uma suíte por vez.
- `npm run verify:template` nos **6 moldes** passando — a prova de que nada vazou para o site do convidado.
- Capturas em **1440px e 390px** de cada tela alterada, antes e depois.
- Servidor reiniciado após cada `npm run build` (pela porta: `Get-NetTCPConnection -LocalPort 3000 | Stop-Process -Force`).

## Ordem da Passada 2

`/conta` (início) → `/conta/pedidos` → `/conta/pedidos/<id>` → landing.
Captura e retorno depois de **cada** uma. Sem avançar sem resposta.

---

## Decisões que preciso de você

1. **Direção A (Prensa) ou B (Anoitecer)?** Recomendo A.
2. **Emoji no meio da frase: ficam ou saem?**
3. **A assinatura (carimbo de prova) está aprovada?** Se não, a ousadia vai
   para outro lugar — mas vai para **um** lugar.

---

# Passada 2 — APLICADA (11/08/2026)

Branch `refactor/sistema-visual-passada-2`. Decisões do Anderson:
**Direção A (Prensa)** · **todos os emoji saem, inclusive os do meio da frase**
· **carimbo de prova aprovado**.

## O que entrou

| Peça | Onde |
|---|---|
| Tokens da Prensa + escala de espaçamento + 3 superfícies | `app/globals.css`, tudo sob `.ui-prensa` |
| Instrument Serif · IBM Plex Sans · IBM Plex Mono | `lib/fonts/ui.ts` (novo) |
| Trilho único de 1200px | `components/account/AccountShell.tsx` |
| O carimbo | `components/account/ProofStamp.tsx` (novo) |
| 4 telas | `/conta`, `/conta/pedidos`, `/conta/pedidos/<id>`, landing |

## Medido, não achado

| | antes | depois |
|---|---|---|
| Aresta marca ↔ `h1` em 1440px | **256px** | **0px** |
| `h1` no desktop | 24px | 30px |
| Contraste, pior caso nas telas logadas | — | **5.48:1** (0 abaixo de 4.5) |
| Contraste, pior caso na landing | 1.98:1 (WhatsApp) | 0 reprovados |
| Emoji nas 4 telas | 24 | **0** |
| Estouro horizontal em 390px | 0 | 0 |

`npm run build` ✓ · `tsc` ✓ · `eslint` ✓ · `npm run test` **293/293** ·
`verify:template` nos 6 moldes ✓ (`paleta só no wrapper — ink=2x accent=2x`,
prova de que nenhum hex da Prensa chegou aos moldes).

## Decisões tomadas durante a aplicação

- **A miniatura do hero (`HeroPreview`) NÃO foi convertida.** Ela desenha o
  PRODUTO — um site de casal, com creme, oliva e a script. Passá-la para os
  tokens da Prensa faria a demonstração de um site de casamento parecer um
  painel administrativo. Só o contraste do texto de 8–10px subiu (era 2.4:1).
- **`STATUS_META[].icon` continua existindo.** O emoji sumiu de onde o casal
  lê, mas o campo alimenta `components/admin/OrderCard.tsx`, que está fora
  desta passada.
- **O ✓ e o ✦ ficaram.** São glifos tipográficos, não emoji: o ✓ carrega
  informação e o ✦ é ornamento de separação.
- **`FloatingWhatsApp` foi de `#25D366` para `#075E54`** — o teal escuro
  oficial da marca. O verde-claro com texto branco dava 1.98:1.

## Duas regressões que a medição pegou (e o método que as pegou)

1. **Cinza-escuro sobre quase-preto no cartão do comparativo.** O remapeamento
   de `--color-gold` foi cego ao papel: ali o dourado era TEXTO sobre oliva, e
   virou `--c-ink-2` sobre `--c-ink` — 2.63:1. O mesmo aconteceu com o ✓ do
   pacote em destaque, cujo cartão é escuro.
2. **`.meta` declarava `color`.** Com especificidade (0,2,0) ele engolia o
   utilitário `text-(--c-mark)` (0,1,0) do Tailwind, e o único acento da tela
   simplesmente não aparecia. **Papel de tipografia não é dono da cor.**

As duas passaram no olho e só caíram na conta de contraste. Fica a regra:
**medir com o navegador, não olhar a captura.**

> Cuidado ao medir: o Tailwind v4 devolve `bg-white/90` como `oklab(...)`. Um
> parser que só entenda `rgb()` lê os números do oklab como se fossem RGB e
> inventa reprovações — perdi uma rodada com "links de nav em 1.24:1" que na
> verdade estavam em 15:1. O script tem de converter oklab e compor alfa.

## O que continua fora

O site do convidado segue intocado: `/s/ana-e-pedro` mantém o fundo
`#f2efe7`, não tem `.ui-prensa` e **zero** tokens `--c-*` resolvíveis na raiz.
`--font-serif` e `--font-script` continuam declaradas em `app/layout.tsx`.

## Telas do painel ainda NÃO convertidas

Herdaram a casca nova (trilho, fundo, fontes) mas mantêm classes oliva/dourado
próprias: `/conta/entrar`, `/conta/criar`, `/conta/esqueci`, `/conta/redefinir`,
o questionário (`/conta/pedido/*`) e as 5 telas de gerenciamento além do início
(`paginas`, `conteudo`, `visual`, `fotos`, `presentes`). Nada quebrado — mas o
"ENLACE" da tela de login está em **2.38:1**, e é o próximo alvo óbvio.
