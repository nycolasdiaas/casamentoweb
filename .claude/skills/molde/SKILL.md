---
name: molde
description: Portar, criar ou mexer em molde/template de site (classico, editorial, toscana, romantico, moderno, film). Cobre tokens de tema, fontes por molde (next/font), variantes `lg:` do widescreen, ornamento SVG, e os scripts verify:template e shot:template. Use ao tocar em qualquer coisa dentro de lib/templates/.
---

# Molde

Molde = componentes de seção que consomem tokens. Dado do casal entra, site
sai. Corrigir o molde corrige **todos** os sites que o usam.

6 portados: Clássico, Editorial, Toscana, Romântico, Moderno, Film.
Registry é `Partial` de propósito: estilo novo que entre no catálogo antes de
ser portado cai em "estamos preparando", não quebra.

Contrato em `lib/templates/contract.ts`. Um molde não sabe de banco, de pedido
nem de pacote: recebe conteúdo resolvido e tokens, devolve JSX.

## As quatro regras que denunciam molde mal portado

### 1. Desenho vem de token, nunca de hex

Ornamento SVG deriva de `var(--accent)` e `color-mix` com a tinta. Um ramo
rosa num site azul-marinho é o detalhe que entrega tudo.

`npm run verify:template <id>` (servidor de pé) monta site descartável com
tema FORA da paleta padrão do molde. Hex escrito na marcação aparece ali. O
teste automatizado não pega isso.

### 2. Não invente dado que o banco não tem

As prévias em `app/pacotes/estilos/` têm cronograma do dia, legenda de foto e
frase de casal fictício escritos no código.

**Portar é omitir o que não existe, não transplantar o texto.** Senão o site
de um casal real anuncia um coquetel que não vai ter.

### 3. Cada molde declara só as fontes que combinam com ele

`clampThemeFonts` recorta a escolha do casal ao catálogo do molde. **Não
oferecer** é o que impede uma Amatic SC de destruir o Clássico. Curadoria, não
limitação.

Fontes vivem em `lib/templates/<id>/fonts.ts`.

### 4. Variantes `lg:` — o molde precisa crescer

`site-canvas` vai de 480px a 1120px em `lg` (1024px). Antes de `lg` não cresce:
tablet em retrato ainda lê melhor em coluna.

O cartão de 480px é o desenho do **celular** — de onde o convidado abre o link
do WhatsApp. Num monitor, sem `lg:`, vira telefone encalhado no meio da tela.

- As seções acompanham por variantes `lg:` **na marcação de cada molde**, não
  por CSS global sobrescrevendo o Tailwind — isso viraria guerra de
  especificidade a cada seção nova. São 238 variantes.
- **Travão de largura precisa de `lg:` também.** O ajuste mecânico pegou
  espaçamento, tipografia e grade, mas `max-w-[250px]` numa foto de capa
  continuou valendo no desktop e a imagem sumia no cartão de 1120px. Confira
  `w-[…]` e `max-w-[…]` em volta de foto.
- Duas regras globais em `.site-canvas` cobrem o que a marcação não resolve:
  `p { max-width: 70ch }` (a 1120px um parágrafo passa de 200 caracteres por
  linha) e `[class*="aspect-"] { max-height: 74vh }` (um `aspect-[3/4]` a
  1120px pediria 1493px de altura).

## next/font

- **Cada fonte vai para um `const` no escopo do módulo.** Dentro de objeto
  literal falha com *"Font loaders must be called and assigned to a const in
  the module scope"*.
- **Declarar N fontes num módulo embarca o CSS das N** em qualquer página que
  o importe. Medido: 34 fontes = 83,6 KB de CSS, 61% desperdiçado. Por isso
  cada molde declara as suas.
- **Cada fonte tem a própria variável** (`--f-<id>`), não uma por papel. Se
  duas declarassem `--font-display`, usar a mesma em dois papéis colidiria. O
  wrapper mapeia papel → fonte.
- **Nos testes, `next/font/google` é mockado** em `vitest.setup.ts` — é
  transformação de build, não biblioteca, e fora do Next os loaders nem são
  funções. A lista de nomes é explícita porque o vitest recusa Proxy. Ao
  oferecer fonte nova no catálogo, acrescente o loader lá.

## Como conferir de verdade

`verify:template` confere token, **não confere largura nem escala**.

```
npm run verify:template <ids>     # tokens, com servidor de pé
npm run shot:template <pasta> <ids>  # fotografa em 1440px e 390px
node scripts/medir-overflow.mjs <url> [largura]   # diagnosticar estouro
```

`shot:template` cria site descartável por molde (tema padrão, conteúdo real) e
apaga tudo no `finally`.

### Quatro armadilhas de captura

- **`--window-size=390` NÃO funciona no Windows.** O Chrome tem largura mínima
  de janela (~480px) e ignora o pedido; o `--screenshot` recorta para 390 e o
  resultado é captura cheia de texto cortado que **não existe no layout**.
  Custou uma caçada a um bug imaginário. Por isso `shot:template` fala CDP e usa
  `Emulation.setDeviceMetricsOverride`, além de MEDIR `scrollWidth` — captura
  sozinha não distingue "cortado pelo layout" de "recortado pela ferramenta".
- **`--headless` (o antigo) captura antes do CSS carregar** e devolve HTML cru.
  Use `--headless=new` com `--virtual-time-budget`.
- **Servidor velho na porta 3000** serve o build anterior. Ver skill
  `cache-e-build`.
- **Não troque `template_id` direto no banco para testar molde** — o `theme`
  fica com fontes de outro catálogo e o site cai em "estamos preparando".

## Invariantes automatizadas

`lib/templates/registry.test.ts` roda para todo molde do registry: papel de
fonte sem fonte declarada, seção que o pacote libera e o molde não implementa,
ordem repetida.

`ScrollChoreography` mora no `SiteRenderer`, não nos moldes — alcança os 6 de
uma vez e molde novo herda sem saber que existe. Ver skill `movimento`.

O que cada pacote libera é regra de produto: agente `regras-de-negocio`.
