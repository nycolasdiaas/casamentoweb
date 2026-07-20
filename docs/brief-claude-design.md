# Brief para o Claude Design (claude.ai/design)

## Como usar

1. Acesse **claude.ai/design** e crie um projeto de design system chamado
   **"Templates Casamento"** (precisa ser projeto de design system para eu
   conseguir puxar os arquivos de lá).
2. Cole o **prompt mestre** abaixo na primeira mensagem.
3. Depois peça um template por vez com os prompts específicos.
4. Quando terminar, me avise aqui que eu puxo os arquivos e implemento no
   código.

---

## Prompt mestre (colar primeiro)

```
Vou criar 3 templates de site de casamento premium para o mercado
brasileiro. Eles serão vendidos como serviço (eu monto para o casal), e
precisam ser visivelmente MELHORES que os concorrentes brasileiros
(casar.com, icasei) — que usam templates datados e genéricos. Quero nível
editorial: convite de luxo impresso traduzido para digital.

Regras para TODOS os templates:

- Mobile-first: o convidado abre pelo WhatsApp no celular. Desenhe primeiro
  em 390px de largura; desktop é adaptação.
- Casal fictício para o conteúdo: "Ana & Pedro", casamento em 19 de
  setembro de 2026, 16h, Espaço Jardim das Oliveiras, Fortaleza — CE.
- Todo o texto em português do Brasil, tom caloroso e elegante.
- Fotos: use blocos placeholder elegantes (indique proporção), nunca fotos
  de banco de imagem.
- Cada template precisa destas seções, nesta ordem:
  1. Capa / Save the Date (nomes, data, local, foto principal)
  2. Contagem regressiva
  3. Nossa história (texto + 3 fotos)
  4. Informações (cerimônia e festa, com botão de mapa e dress code)
  5. Confirmação de presença (formulário com lista de nomes da família e
     botões "Vou" / "Não vou")
  6. Lista de presentes (cards com nome + preço + botão "Presentear";
     modal com QR Code Pix e copia e cola)
  7. Mural de recados dos convidados
  8. Álbum pós-festa (grade de fotos que "destrava" após a data)
  9. Rodapé com hashtag do casamento
- Componentes como HTML/CSS auto-contidos (sem framework), um arquivo por
  seção, para eu traduzir para Tailwind depois.
- Capriche em: hierarquia tipográfica, espaçamento generoso, detalhes de
  borda/ornamento, estados de hover/focus, e uma assinatura visual única
  por template.

Confirme que entendeu e aguarde: vou pedir um template por vez.
```

---

## Prompt — Template 1: Clássico

```
Template "Clássico": elegância atemporal, papelaria de casamento de luxo.
Paleta: papel #f2efe7, verde-oliva profundo #3d4a36, dourado #b8985f,
blush #ebefe3. Tipografia: serifada display de alto contraste para nomes e
títulos + serifada de texto; opcional uma caligráfica fina só para
detalhes. Referências: convites gravados, monograma do casal, filetes
duplos dourados, cantos ornamentados discretos. Sensação: "recebi um
convite caro pelo correio". Crie as 9 seções.
```

## Prompt — Template 2: Moderno

```
Template "Moderno": minimalismo editorial, revista de design. Paleta:
off-white #fafafa, quase-preto #1c1c1c, um único tom de acento (terracota
ou verde-sálvia). Tipografia: sans-serif grotesca em pesos contrastantes,
nomes do casal GIGANTES quebrando linhas, números da contagem regressiva
como elemento gráfico. Layout assimétrico, fotos grandes sangrando na
tela, muito espaço em branco. Sensação: "casal descolado de São Paulo".
Crie as 9 seções.
```

## Prompt — Template 3: Romântico

```
Template "Romântico": delicadeza floral, aquarela, jardim. Paleta: rosa
pastel #fdf2f4, vinho suave #7c4a55, rosa antigo #d9a3ae, toques de verde
folha. Tipografia: caligráfica generosa para nomes e títulos + serifada
leve para texto. Ornamentos florais desenhados (SVG), molduras ovais nas
fotos, divisores com ramos. Sensação: "casamento no campo ao pôr do sol".
Crie as 9 seções.
```

---

## Depois de criar

Me diga aqui: "criei os templates no Claude Design". Eu puxo os arquivos
do projeto, traduzo para os componentes do site (Tailwind v4 + Next.js) e
ligo cada template ao sistema de pacotes.
