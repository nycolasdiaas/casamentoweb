# Prompt para gerar novos templates de site de casamento

Cole este prompt no **claude.ai/design** (para desenhar visualmente) ou num
gerador de código. Depois é só portar para `app/pacotes/estilos/<novo>` e
registrar em `lib/templates.ts` (novo id + swatches + rota).

Troque o bloco **[TEMA]** por uma das sementes (ou uma sua) antes de enviar.

---

## Prompt

```
Você é diretor de arte e desenvolvedor de uma plataforma que entrega sites de
casamento prontos (marca "Enlace"). Crie UM novo template de site de casamento,
completo e distinto dos que já existem (Clássico serifado, Moderno sem serifa,
Romântico caligráfico). O template é escolhido pelo casal como ponto de partida
visual, então ele precisa ter uma identidade forte e memorável.

TEMA DESTE TEMPLATE:
[TEMA]

STACK E REGRAS TÉCNICAS:
- Next.js (App Router) + Tailwind v4. Mobile-first: a maioria dos convidados
  abre pelo celular, vindo de um link no WhatsApp.
- Use variáveis de cor (design tokens) para a paleta, não hex soltos no meio do
  código. Defina a paleta uma vez no topo.
- Tipografia via Google Fonts (next/font). Escolha um par: uma fonte de títulos
  com personalidade + uma fonte de corpo legível.
- Tudo self-contained, sem dependências externas de UI. Animações sutis (fade,
  parallax leve) são bem-vindas, nada exagerado.
- Acessível: contraste bom, textos alternativos, navegação por teclado.

IDENTIDADE (defina e mostre no topo do resultado):
- Nome do template (ex: "Marinho", "Jardim", "Litoral").
- Paleta: 4 a 6 cores com HEX e o papel de cada uma (fundo, texto, destaque,
  ornamento).
- Par tipográfico (nomes das fontes) e por que combinam com o tema.
- Uma frase de "mood" descrevendo a sensação do template.

SEÇÕES (o site completo tem estas 9, na ordem — desenhe todas):
1. Capa / Save the Date: nomes do casal em destaque, data e um convite curto.
2. Contagem regressiva para o grande dia.
3. História do casal: texto + fotos, com um ritmo de leitura agradável.
4. Informações: data, horário, local, com mapa e botão "como chegar".
5. Confirmação de presença (RSVP): formulário simples por convidado/família.
6. Lista de presentes: cards de presentes com preço, com modal de Pix
   (QR Code + copia e cola) — sem taxa, tudo do casal.
7. Mural de recados: convidados deixam mensagens que aparecem numa parede.
8. Álbum pós-festa: galeria que "se abre" depois da data do casamento
   (mostre o estado bloqueado e o desbloqueado).
9. Rodapé: nomes, data, um agradecimento e a marca discreta da plataforma.

Use como conteúdo de exemplo o casal fictício "Ana & Pedro", casamento em
19/09/2026, no "Espaço Jardim das Oliveiras", Fortaleza-CE.

ENTREGUE:
- A identidade (nome, paleta com HEX, par de fontes, mood).
- O design/código das 9 seções, mobile-first, coerente com o tema do início ao
  fim.
- Se for código, um único arquivo de página pronto para colar; se for design,
  telas de cada seção.
```

---

## Sementes de tema (escolha uma e cole em [TEMA])

- **Marinho / gala noturna:** azul-marinho profundo (#1f2a44) + off-white +
  dourado champanhe. Clima de festa à noite, elegante e formal.
- **Jardim / botânico:** verde-folha, terracota suave e creme, com ilustrações
  botânicas delicadas. Casamento de dia, ao ar livre.
- **Litoral / boho praia:** areia, azul-petróleo e coral desbotado, tipografia
  manuscrita, sensação de leveza e pé na areia.
- **Minimal / moderno editorial:** preto, branco e um único tom de destaque,
  muito espaço em branco, tipografia de alto contraste, ar de revista.
- **Toscana / rústico chique:** tons de vinho, oliva e dourado envelhecido,
  serifas clássicas, clima de vinícola.
- **Lavanda / provençal:** lavanda, sálvia e off-white, aquarela suave,
  romântico e delicado.

---

## Depois de gerar

1. Crie a rota `app/pacotes/estilos/<id>/page.tsx` (copie a estrutura de um
   template existente e troque paleta/fontes/seções).
2. Registre em `lib/templates.ts`: `{ id, name, swatches: [hex, hex, hex] }`.
3. O novo template aparece automaticamente no pedido (passo "Ponto de partida")
   e no seletor das páginas de estilo.
```
