---
name: movimento
description: Animação e transição — GSAP ScrollTrigger no site do convidado, Motion (motion.dev) no painel, durações e curvas, prefers-reduced-motion, telas de espera. Use ao animar qualquer coisa, ao mexer em ScrollChoreography, SplitReveal, MotionProvider ou useDelayedFlag, e para conferir que a animação de fato roda.
---

# Movimento

Duas bibliotecas, cada uma onde paga:

- **GSAP ScrollTrigger** — coreografia de rolagem do site do convidado.
- **Motion** (motion.dev) — transição de tela e esqueleto no painel.

Vocabulário de durações e curvas em `app/globals.css`.

## O erro já cometido duas vezes: animação tímida demais

**Animação que roda e ninguém percebe é o mesmo que animação ausente.**

A primeira versão usava 320 ms e 12 px de percurso, com um comentário no
código dizendo "sobe 12px, nunca mais". O navegador confirmava a animação em
`running` a cada navegação — e o dono do produto descreveu como "troca de tela
crua".

Hoje: `--t-base: 440ms`, percurso de 20 px, e a transição de tela usa escala e
desfoque além do deslocamento. **Abaixo de ~400 ms uma entrada suave não é
lida como movimento, é lida como "a tela apareceu".**

Mesmo erro nas telas de espera: atrasavam o *aparecer* em 180 ms sem tempo
mínimo, então numa resposta rápida **nunca eram vistas** — "criei o pedido e
não aconteceu nada". Hoje `useDelayedFlag` segura ~700 ms. Tela de espera que
ninguém vê não é otimização, é ausência.

## Regras

- **A coreografia de rolagem usa `gsap.from`, nunca opacity 0 no CSS.** Com
  `from`, o estado natural do HTML já é o final: se o JS não carregar, o
  convidado vê o site inteiro, só sem animação. Segurança estrutural, não
  remendo — a versão em CSS precisava de `@supports` para não deixar seção
  invisível.
- **GSAP entra por import dinâmico dentro do efeito.** Não vai no bundle
  inicial nem bloqueia a hidratação. Medido: 194 KB gzip na primeira carga do
  site do convidado, com o GSAP num chunk separado de 44 KB que chega depois.
- **Motion só via `LazyMotion` + o componente `m`** (`MotionProvider`). ~4,6 KB
  em vez de 34. `domAnimation`, não `domMax` — nada aqui usa layout animation
  nem drag.
- **`ScrollChoreography` mora no `SiteRenderer`**, não nos moldes: alcança os 6
  de uma vez e molde novo herda sem saber que existe.
- **A capa (índice 0) nunca é revelada na rolagem.** Já está na tela quando o
  convidado abre o link; animar o que já está visível faz piscar. A capa tem
  entrada própria (`SplitReveal` / `.motion-word`).

## `prefers-reduced-motion: reduce` não desliga tudo

Continua: o que **confirma ação** (botão cedendo ao toque, "Copiado!") — é
informação.

Sai: deslocamento, escala, laço infinito.

**O Motion não respeita isso sozinho** — precisa de `useReducedMotion()`. O
GSAP verifica antes de importar, então quem pediu menos movimento nem paga o
download.

## Conferir que a animação ACONTECE

"O componente está importado" não é "a animação rodou". Dois scripts perguntam
ao navegador:

```
node scripts/verificar-animacao.mjs <url>
node scripts/verificar-transicao.mjs
```

O primeiro conta seções marcadas pelo GSAP, confere que nada fica preso em
opacity 0, e testa o caminho de movimento reduzido. O segundo navega de
verdade entre telas e lista `document.getAnimations()` no instante da troca.
