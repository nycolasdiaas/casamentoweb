# Design system para o Claude Design

## Como usar

1. Acesse **claude.ai/design**, crie um projeto novo do tipo *design
   system* chamado **"Enlace — Design System"** (separado do projeto
   "Templates Casamento", que é o produto vendido ao casal — este aqui é
   a marca da plataforma em si: landing, vídeos, posts, materiais de
   venda).
2. Cole o prompt abaixo.
3. Me avise quando terminar que eu puxo os componentes daqui e comparo
   com o que já existe no site, pra manter tudo consistente.

---

## Prompt

```
Crie um design system para "Enlace" [TROCAR se o nome final for outro],
uma plataforma brasileira de sites de casamento (venda B2C: casais
compram um site pronto, com RSVP e lista de presentes via Pix sem taxa).
Este design system é da MARCA/PLATAFORMA — usado na landing de vendas,
em posts, vídeos e materiais de marketing. Não é o visual dos sites que
vendemos para os casais (esses são outro produto, mais ornamentado,
estilo papelaria de casamento).

O tom aqui é: elegante mas comercial, confiável, caloroso — pense
"marca DTC premium brasileira", não "SaaS corporativo" e não
"papelaria floral". Todo o texto do design system em português do
Brasil.

## Fundações

**Cor** — paleta já validada, use exatamente estes tons:
- `--paper` #f2efe7 (fundo neutro quente)
- `--blush` #ebefe3 (fundo alternado suave)
- `--olive` #3d4a36 (cor primária — texto, botões, fundo de seções de
  destaque)
- `--gold` #b8985f (acento — bordas, ícones, badges, links)
- `--muted` #a8a39a (texto secundário/legendas)
- Branco puro para cards e fundo padrão

Gere também os estados derivados necessários: olive com opacidade
(hover, texto secundário sobre fundo escuro), gold com opacidade (bordas
sutis tipo `gold/40`), e um estado de foco acessível (outline 2px em
gold ou olive, nunca invisível).

**Tipografia** — use "Inter" (ou equivalente grotesca humanista) para
toda a interface da marca: títulos grandes em bold com tracking
levemente negativo, corpo de texto regular. Defina uma escala clara:
display (hero, ~40–56px), heading (seção, ~28–32px), subheading,
body, caption/label (uppercase, tracking bem aberto, tamanho pequeno —
usado em badges e olhos-de-seção).

Além da Inter, documente que os SITES DOS CLIENTES (produto vendido, não
esta marca) usam 3 pares tipográficos diferentes por estilo — isso é só
referência, não construa esses componentes aqui:
- Clássico: Cormorant Garamond + Pinyon Script (script)
- Moderno: Archivo + IBM Plex Mono
- Romântico: Lora + Great Vibes (script)

**Espaçamento e forma**: cantos arredondados generosos (`rounded-xl` a
`rounded-2xl` em cards, botões sempre pill/totalmente arredondados),
respiro grande entre seções (equivalente a 80–96px de padding vertical
em desktop), bordas finas de 1px em gold com baixa opacidade como
principal forma de separar conteúdo (evite sombras pesadas — se usar
sombra, sutil, tipo `shadow-sm`).

## Componentes (crie um preview de cada, com todos os estados)

1. **Botão** — 3 variantes: primário (fundo olive, texto branco, pill),
   secundário (borda olive translúcida, texto olive, transparente),
   sobre-fundo-escuro (fundo branco, texto olive — usado quando o botão
   está sobre uma seção de fundo olive). Estados: default, hover, focus,
   disabled.

2. **Badge/pill** — texto pequeno, uppercase, tracking bem aberto.
   Variantes: outline dourado (ex: "100% personalizável"), preenchido
   dourado sobre fundo escuro (ex: "recomendado"), neutro (ex:
   "Exemplo").

3. **Cabeçalho de seção** — padrão repetido em toda a página: um "olho"
   pequeno uppercase em dourado, título grande centralizado, parágrafo
   de apoio menor e mais claro logo abaixo, tudo centralizado.

4. **Card de pacote/preço** — nome, tagline pequena, preço grande em
   destaque, descrição, lista de benefícios (cada item com um ✓
   dourado), rodapé com prazo de entrega e botão. Variante "destaque"
   (fundo olive sólido, texto branco, selo flutuante no topo) e variante
   "padrão" (fundo branco, borda dourada fina).

5. **Card de recurso/feature** — ícone/emoji no topo, título em negrito,
   descrição curta. Grid de 3 colunas em desktop, 1 em mobile.

6. **Card com moldura de navegador** — usado pra mostrar prints/prévias
   de sites: barra superior cinza-clara com 3 pontinhos (como uma janela
   de navegador), conteúdo abaixo, rodapé com título e subtítulo. É o
   componente mais reutilizado do design system — precisa ficar muito
   bem resolvido.

7. **Tabela comparativa** — cabeçalho em fundo olive sólido com texto
   branco, linhas zebradas sutis (branco / paper a 50%), coluna "nós"
   com check dourado e texto em negrito, coluna "concorrência" em texto
   mais claro/apagado.

8. **Acordeão de perguntas frequentes** — card com borda dourada fina,
   pergunta em negrito com um "+" dourado que gira 45° quando aberto,
   resposta em texto secundário.

9. **Card de depoimento** — aspas grandes decorativas em estilo
   caligráfico dourado, texto em itálico, nome do casal em negrito e
   detalhe (data/pacote) em texto secundário, separados por uma linha
   fina dourada.

10. **Cabeçalho de navegação** — fixo no topo, fundo branco translúcido
    com blur, nome da marca à esquerda, links de âncora à direita, um
    botão pill de destaque ("Fale conosco").

11. **Rodapé** — fundo olive sólido, texto branco a 60% de opacidade,
    nome da marca e frases-chave (“sem mensalidade”, “Pix sem taxa”) em
    layout simples de uma linha.

12. **Botão flutuante do WhatsApp** — círculo/pill verde WhatsApp
    (#25D366), ícone + texto, fixo no canto inferior direito, com leve
    escala no hover.

13. **Bloco de contagem regressiva** — números grandes em destaque
    (tabular nums, pra não "pular" largura), rótulo pequeno uppercase
    abaixo (dias/horas/min/seg), 4 blocos lado a lado.

Gere cada componente como uma prévia isolada e legível, com fundo claro
(a marca não tem modo escuro ainda), pensando mobile-first mas com
prévia também em largura desktop quando fizer sentido (cards de
pacote, tabela).
```
