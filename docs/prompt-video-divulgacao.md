# Prompt para animação de divulgação (Claude Design)

## Como usar

1. Acesse **claude.ai/design**, no mesmo projeto "Templates Casamento" (ou
   um novo, "Divulgação").
2. Cole o prompt abaixo.
3. Quando terminar, abra a página, dê play e grava a tela (celular na
   vertical ou extensão de gravação no navegador) — isso vira o arquivo de
   vídeo pra postar no Instagram/WhatsApp Status.
4. Se quiser, me avisa que eu puxo o arquivo daqui e ajusto o que precisar.

---

## Prompt

```
Crie uma animação de divulgação (não é um site funcional, é uma peça de
marketing) para uma plataforma de sites de casamento chamada "Enlace"
[TROCAR se o nome final for outro]. Formato: vídeo vertical 1080x1920
(9:16, estilo Reels/Status do Instagram/WhatsApp), autocontido em
HTML/CSS/JS, com uma timeline de animação de ~22 segundos que roda sozinha
do início ao fim e depois faz loop suave de volta ao início. A pessoa vai
gravar a tela pra virar arquivo de vídeo, então nada pode depender de
clique — só play automático.

Identidade visual (mesma do site real, não inventar nova):
- Papel #f2efe7, verde-oliva profundo #3d4a36, dourado #b8985f, blush
  #ebefe3
- Tipografia serifada elegante para títulos (estilo Cormorant Garamond)
  + uma caligráfica fina só em detalhes (estilo Pinyon Script)
- Ornamentos discretos: linha dourada fina, pequeno ponto/círculo entre
  divisores — nada carregado, é papelaria de casamento de luxo, não app
  de tecnologia

Roteiro (siga os tempos e o texto à risca, é isso que vende):

0:00–0:03 — GANCHO
Tela escura/oliva. Tipografia cinética: a frase "Seu casamento merece
mais que um link genérico." aparece palavra por palavra, cada uma com
leve fade+subida. Sem logo ainda.

0:03–0:07 — O PROBLEMA
Mockup de um celular no centro mostrando uma tela genérica de "lista de
presentes". Um presente de R$ 400 aparece, e ao lado um contador
decrescendo com efeito de "vazamento": "R$ 400,00" → risca → "R$ 384,44"
com um selinho vermelho pequeno "-3,89% de taxa". Texto abaixo: "Outros
sites descontam da lua de mel de vocês."

0:07–0:09 — A VIRADA
Tela limpa cor de papel. Só a frase, em caligráfica dourada, cresce
suavemente: "E se cada centavo chegasse inteiro?"

0:09–0:16 — A SOLUÇÃO (mockup de celular, scroll automático)
Um frame de celular (moldura fina, cantos arredondados) com uma tela de
site de casamento rolando sozinha por 4 momentos, cada um ~1,5s, com
transição suave (não corte seco):
  1. Save the date com nomes do casal e contagem regressiva
  2. Tela de confirmação de presença com botão "Vou 💚" sendo tocado
     (simule o toque com um pulso/ripple)
  3. Card de presente com selo dourado "0% DE TAXA" e QR Code Pix
  4. Grade de fotos rotulada "Álbum da festa — pra sempre" com um cadeado
     que abre (ícone) e vira fotos
Ao lado do celular, badges dourados aparecem um a um, sincronizados com
cada tela: "RSVP em segundos" · "Pix direto, sem taxa" · "Vira álbum pra
sempre"

0:16–0:19 — OS PACOTES
Três cartões elegantes deslizam da direita, em cascata (delay de 0.15s
entre eles), cada um com nome e preço:
"Convite — R$ 9,90" · "Site do Casamento — R$ 29,90" · "Para Sempre —
R$ 99,90" (este último com uma borda dourada mais forte, é o
destaque)

0:19–0:22 — CHAMADA FINAL
Fundo verde-oliva. Nome da marca em caligráfica dourada grande, centro
da tela. Abaixo, em serifada: "Tudo pelo WhatsApp. Zero dor de cabeça."
Por fim um botão de WhatsApp (ícone + "Chama no WhatsApp") pulsa
suavemente (scale 1 → 1.04 → 1, loop) até a animação reiniciar do
0:00.

Regras de estilo:
- Sem áudio, sem depender de som pra entender (a maior parte é assistida
  mudo) — todo peso está na tipografia e no movimento.
- Easings suaves (cubic-bezier tipo ease-out), nunca linear, nunca
  bounce/elastic — é elegância, não brinquedo.
- Contraste alto o bastante pra ler em tela pequena de celular.
- Pode usar CSS keyframes + JS só para orquestrar a sequência de timing
  (setTimeout/classes), sem bibliotecas externas.
- Adicione um botão discreto de "reiniciar" no canto (só pra eu revisar
  no navegador), que não apareça na gravação se possível (ex: fora da
  área 1080x1920, ou floating com classe que dá pra esconder antes de
  gravar).

Confirme o roteiro e gere a animação.
```

## Observação

Depois de gravar a tela e ter o arquivo de vídeo, cortar em ferramenta de
edição (CapCut, InShot) pra: adicionar legenda/closed caption automático
(a maioria assiste sem som) e exportar em MP4 vertical pronto pro
Instagram/WhatsApp.

## Narração

Roteiro de narração já quebrado por trecho, pronto pra colar no
ElevenLabs: [narracao/README.md](narracao/README.md).
