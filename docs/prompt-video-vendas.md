# Prompt de vídeo de VENDAS (Claude Design)

Diferente do `prompt-video-divulgacao.md` (institucional): este é anúncio
de conversão — gancho de preço nos 3 primeiros segundos, prova rápida,
comparação com concorrente e CTA em dois pontos. Estrutura baseada no
framework Hook–Body–CTA: só 15–20% dos espectadores passam dos 3
primeiros segundos, mas 65% de quem passa dos 3s assiste pelo menos 10s
— o gancho é tudo. CTA em camadas (deixa no meio + fecho direto)
converte mais que apostar só no final.

## Como usar

1. claude.ai/design → mesmo projeto ou um novo ("Vídeo Vendas").
2. Cole o prompt abaixo. Grave a tela depois (vertical), edite no
   CapCut com legenda automática.
3. Narração: adapte os arquivos de `narracao/` ou gere novos no
   ElevenLabs com as falas do roteiro abaixo.

---

## Prompt

```
Crie uma animação de ANÚNCIO DE VENDAS (peça de marketing, não site
funcional) para a "Enlace" [TROCAR se o nome final for outro],
plataforma brasileira que entrega sites de casamento prontos. Formato:
vídeo vertical 1080x1920 (9:16, Reels/TikTok/Status), autocontido em
HTML/CSS/JS, timeline de ~28 segundos que roda sozinha e faz loop
suave. Vai virar vídeo por gravação de tela — nada pode depender de
clique, só play automático.

Identidade visual (usar exatamente):
- Papel #f2efe7, verde-oliva #3d4a36, dourado #b8985f, blush #ebefe3
- Serifada display elegante (estilo Cormorant Garamond) para títulos,
  caligráfica fina (estilo Pinyon Script) só em detalhes
- Elegante mas com energia de anúncio: cortes rápidos, números grandes

ROTEIRO (tempos e textos exatos — cada cena é um "cartão" que entra com
movimento e sai rápido; ritmo de anúncio, não de institucional):

0:00–0:03 — GANCHO DE PREÇO (o frame 1 já precisa parar o dedo)
Fundo oliva. Número GIGANTE dourado estala na tela com um scale-in
seco: "R$ 9,90". Abaixo, em serifada branca, surge: "É. Um site de
casamento. Por isso." Nada de logo ainda — logo no início mata anúncio.

0:03–0:08 — PROVA IMEDIATA (mostrar > falar)
Mockup de celular desliza pra tela mostrando um site de casamento
lindo rolando sozinho rápido: nomes em caligráfica, contagem
regressiva girando, botão "Confirmar presença", card de presente com
QR Pix. Selos dourados pipocam ao lado, um por segundo:
"Pronto em até 3 dias" · "Feito POR NÓS, não por você" · "Zero parte
técnica"

0:08–0:13 — DOR DO CONCORRENTE (comparação direta)
Tela divide em duas colunas com linha dourada no meio.
Esquerda (apagada, cinza): "Outros sites" — "Você monta sozinho" /
"Taxa de ~4% nos presentes" / "R$ 389 perdidos a cada R$ 10 mil"
(este número em vermelho, riscando).
Direita (viva, cor de papel): "Enlace" — "A gente monta tudo" /
"Pix direto na sua conta, 0% de taxa" / "R$ 0 perdidos" (em dourado,
com um check).

0:13–0:16 — ZERO DOR DE CABEÇA (o diferencial emocional)
Fundo blush. Mockup de conversa de WhatsApp com 3 balões entrando em
sequência (som visual de "enviado"):
1. "Oi! Quero um site de casamento" (balão verde, do casal)
2. "Me mandem as fotos e a história de vocês 😊" (resposta)
3. [miniatura do site pronto] "Prontinho, prévia de vocês 💚"
Texto abaixo, grande: "Vocês mandam mensagem. A gente faz TUDO."

0:16–0:19 — CTA INTERMEDIÁRIO (deixa comportamental)
Cartão rápido, fundo papel: "Guarda esse vídeo pra mostrar pro seu
amor 💍" — pisca 1 vez e sai. (Deixa de salvamento/compartilhamento
aumenta alcance orgânico.)

0:19–0:23 — OFERTA COMPLETA (âncora de preço)
Três cartões sobem em cascata:
"Convite — R$ 9,90" · "Site do Casamento — R$ 29,90" ·
"Para Sempre — R$ 99,90" (o terceiro maior, borda dourada, com
sub-selo: "com lista de presentes SEM TAXA + álbum eterno")
Acima, pequeno: "Pagamento único. Sem mensalidade. Nunca."

0:23–0:28 — CTA FINAL (urgência suave + instrução única)
Fundo oliva. Nome da marca em caligráfica dourada. Frase em serifada
branca: "A data de vocês não espera."
Botão WhatsApp verde (#25D366) grande, pulsando devagar
(scale 1→1.05→1): "👉 Chama no WhatsApp AGORA"
Micro-texto abaixo: "resposta no mesmo dia · prévia antes de pagar
tudo" [CONFIRMAR se essa condição de pagamento vale — se não, trocar
por "resposta no mesmo dia"]
Segura 2s e reinicia o loop.

REGRAS DE EXECUÇÃO:
- Mudo-first: TODA informação legível sem som; texto grande, contraste
  alto pra tela de celular.
- Cada cena entra com movimento (slide/scale com ease-out forte,
  cubic-bezier(0.16, 1, 0.3, 1)), sai rápido. Nunca linear, nunca
  bounce.
- Números de preço sempre os elementos MAIORES da cena — são o gancho
  e a oferta.
- CSS keyframes + JS só pra orquestrar timing. Sem bibliotecas
  externas.
- Botão discreto "reiniciar" fora da área visível de 1080x1920 (só pra
  revisão, não pode aparecer na gravação).

Confirme o roteiro e gere a animação.
```

## Falas de narração (opcional, ElevenLabs — uma por cena)

1. "Nove e noventa. É, um site de casamento por isso."
2. "Pronto em até três dias, feito pela gente — vocês não encostam em
   nada técnico."
3. "Outros sites cobram até quatro por cento dos seus presentes. Aqui,
   zero. Cada centavo é de vocês."
4. "A personalização inteira? Uma conversa de WhatsApp."
5. (sem fala — cartão de salvar)
6. "Três pacotes, pagamento único, sem mensalidade. Nunca."
7. "A data de vocês não espera. Chama a gente no WhatsApp agora."
