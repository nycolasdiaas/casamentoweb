# Prompt — refresh dos templates (Claude Design)

Aplica o feedback da Isabela: cores mais vivas/tendência, aquarela de
verdade, azul marinho, fontes legíveis. Colar no MESMO projeto
"Templates Casamento" do claude.ai/design (os templates existentes
estão lá — este prompt pede refinamento, não recomeço).

---

## Prompt

```
Vamos refinar os 3 templates de casamento deste projeto (Clássico,
Moderno, Romântico) e criar um 4º. Feedback real de uma noiva que
avaliou: as cores estão apagadas demais, o Romântico não parece
aquarela de verdade, e falta uma opção com azul marinho. Referência de
mercado: os convites digitais que estão vendendo hoje no Brasil usam
paletas de tendência 2026 — terracota, verde-sálvia, lavanda, azul
marinho, rosê queimado — com mais saturação e contraste do que temos.

Mantenha em TODOS: estrutura de 9 seções já existente, mobile-first
390px, textos em português, casal fictício Ana & Pedro (19/09/2026,
Fortaleza). Não mexa na lógica/interações — só visual.

1. CLÁSSICO — refinar, não recriar
- Tipografia de corpo: trocar para Lora (a atual é fina demais, noiva
  reclamou de legibilidade). Títulos seguem Cormorant Garamond.
- Subir meio tom a saturação do dourado e do verde-oliva: hoje parece
  desbotado em tela de celular. O dourado precisa brilhar como folha
  de ouro, não bege.
- Molduras e filetes mais presentes (peso 1.5px, não 1px).

2. MODERNO — acento mais vivo
- Trocar o acento terracota atual por uma versão mais viva e quente
  (#c65a2e ou próximo) e oferecer variação em verde-sálvia saturado.
- Aumentar o contraste dos blocos: o quase-preto pode ir a #141414.
- Os números gigantes (contagem, datas) podem ganhar um leve efeito de
  preenchimento parcial/outline pra parecer editorial de revista.

3. ROMÂNTICO — aquarela DE VERDADE
- Hoje é pastel chapado + line-art. Quero textura de aquarela real:
  manchas com bordas irregulares e transparência variável (SVG com
  turbulence/blur ou PNGs desenhados), pinceladas visíveis nos fundos
  das seções, flores com aparência pintada à mão (não vetor limpo).
- Paleta mais viva: rosa antigo mais profundo, verde folha presente,
  toques de lavanda. O fundo pode ter lavagens de cor suaves em vez de
  cor sólida.
- Molduras das fotos com borda de mancha de tinta, não linha perfeita.

4. NOVO TEMPLATE: "MARINHO" (o pedido da noiva)
- Azul marinho profundo #1f2a44 como base, off-white quente #faf7f0,
  dourado champanhe #c9a96a como acento.
- Clima: casamento noturno elegante, céu estrelado sutil (pontos
  dourados discretos no fundo da capa), papelaria de gala.
- Tipografia: serifada de alto contraste para títulos (estilo Playfair
  Display) + Lora no corpo. Caligráfica só no nome do casal.
- Mesmas 9 seções dos outros. Contagem regressiva pode ser o momento
  "wow": números dourados grandes sobre o marinho.

Para cada template, gere as seções como componentes atualizados no
projeto. Comece me mostrando a capa (seção 1) dos 4 pra eu aprovar a
direção antes de aplicar nas demais seções.
```

---

## Depois de rodar

Me avisa aqui ("atualizei os templates no Claude Design") que eu puxo
via DesignSync e porto pro código — incluindo criar a rota
`/pacotes/estilos/marinho` e registrar o estilo novo em
`lib/templates.ts`.
