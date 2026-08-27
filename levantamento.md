# Levantamento — versão atual × protótipo Enlace

**Fase 1 do trabalho de SDD. Não prescreve solução: só constata fatos.**
As correções fechadas estão em `specs/`, indexadas em `specs/INDEX.md`.

> ## ⚠ Este documento é um RETRATO de 25/08/2026, não o estado de hoje
>
> Ele descreve o repositório **antes** da execução das specs. Os "divergente" e
> "NOVO" abaixo eram verdade no commit `f10a528`; **25 deles deixaram de ser**
> entre 26 e 27/08/2026.
>
> Ele fica como está de propósito: reescrevê-lo apagaria a linha de base contra
> a qual cada spec foi escrita, e é ela que explica por que cada requisito
> existe. Quem quer o estado ATUAL lê `specs/INDEX.md`, que carrega o registro
> de execução e o status real de cada uma das 30.
>
> **Onde os dois discordam, o INDEX vence.**

- **Versão atual auditada:** este repositório, branch `main`, commit `f10a528`,
  em 25/08/2026. Next 16 com `cacheComponents: true`.
- **Protótipo de referência:** `C:\Users\fande\Downloads\enlace\` — 15 arquivos
  `.dc.html`, `HANDOFF-motion.md`, `HANDOFF-editor-convite.md`, `README.md`.
- **Decisões que não podem ser contrariadas em silêncio:**
  `docs/sdd-geracao-automatica.md` (lido por inteiro antes desta auditoria) e
  `docs/regras-de-negocio.md`, que vence quando os dois discordam.

---

## 0. Como as quatro áreas foram recortadas

O protótipo cobre o produto inteiro; as quatro áreas pedidas cobrem quatro
contratos diferentes. Nem toda prancha cai numa delas por definição própria
(vitrine, auth, questionário, e-mails e notificações não têm contrato nomeado
no SDD), então o eixo usado foi **quem está do outro lado da tela**:

| Área | Diretório de specs | O que entra | Contrato que precisa respeitar |
|---|---|---|---|
| **A · Sistema de marca** | `specs/design-system/` | Fundação A1–A5, Voz V1–V5, Ícones, Movimento #1–#10, `HANDOFF-motion.md` | `ThemeSpec` (§4.2), fontes por molde (§4.3) |
| **B · Público (sem sessão)** | `specs/site-publico/` | Faixa F (site do casal, convite, RSVP, prévia), Faixa H (falhas), Compartilhamento S1–S3, vitrine B1–B9, e-mails 05–06 (vão para o convidado) | `SectionKey`/`TemplateModule` (§4.4), gating por pacote (§4.5), §2.5 das regras |
| **C · Casal autenticado** | `specs/painel-casal/` | Faixa E (E1–E10) + `HANDOFF-editor-convite.md`, Faixa C (auth), Faixa D (questionário), Faixa I (primeira vez), Faixa J (avisos), S4 (aba Compartilhar), e-mails 01–04 | 8 abas de `/conta/pedidos/<id>/` (§15.3), §2.1–§2.3 das regras |
| **D · Admin** | `specs/painel-admin/` | Faixa G (G1–G5) | `/admin` é exceção, nunca operação (§3 das regras) |

A vitrine ficou em **B** por ser rota pública sem sessão, não por ser parte do
site do casal. Auth e questionário ficaram em **C** por serem a porta e a
primeira tela da conta.

**Legenda de status usada nas tabelas:**

| Status | Significa |
|---|---|
| `sem divergência` | O que existe cumpre o desenho. Não gera spec. |
| `divergente` | Existe equivalente, mas com estrutura, comportamento ou valor diferente. |
| `NOVO` | O protótipo define e não há equivalente na versão atual. |
| `FORA DO ESCOPO DO PROTÓTIPO` | Existe hoje e o protótipo não desenha. Sinalizado, não removido. |
| `[CONFLITO COM DECISÃO EXISTENTE]` | O desenho contraria o SDD ou as regras de negócio. Vai para a spec com marca de aprovação necessária. |

---

## 1. Área A — Sistema de marca e design tokens

Arquivos do protótipo: `Enlace - Fundacao.dc.html` (A1–A5),
`Enlace - Voz e Microcopy.dc.html` (V1–V5), `Enlace - Icones.dc.html`,
`Enlace - Movimento.dc.html` (8 transições em loop), `HANDOFF-motion.md`.

Arquivos da versão atual: `app/globals.css` (1.364 linhas),
`components/ui/prensa/*` (12 arquivos), `components/ui/prensa/Icone.tsx`,
`lib/fonts/ui.ts`, `lib/theme/spec.ts`, `components/ui/PageTransition.tsx`,
`components/ui/{MotionProvider,SiteSkeleton,BrandLoader,RevealOnScroll}.tsx`.

| Prancha / arquivo do protótipo | Equivalente na versão atual | Status |
|---|---|---|
| A1 · 8 neutros (`--paper` … `--rule`) | `app/globals.css:565-572` — 7 dos 8 declarados sob `.ui-prensa` | **divergente** — `--ink-3` (`#8b9099`) não é token; aparece como hex literal 3× no próprio `globals.css` |
| A1 · acentos `--mark` / `--olive` / `--gold` | `globals.css:571`, `:865-867` | sem divergência |
| A1 · semânticos `--ok` / `--warn` / `--danger` | `globals.css:871-873` | sem divergência |
| A1 · admin escuro (5 tokens) | `globals.css:1310-1325` (`.ui-prensa.admin`, `.tema-escuro`) | sem divergência |
| A1 · 3 superfícies, raio 2–3px | `.surface-raised` / `.surface-flat` / `.surface-sunken`, raio 3px | sem divergência |
| A2 · 4 papéis tipográficos | `.t-display` `.t-data` `.meta` + `--f-ui-*` em `lib/fonts/ui.ts` | sem divergência |
| A2 · escala de 8 degraus | `.t-hero` `.t-d1` `.t-d2` `.t-d3` `.t-corpo-g` `.t-corpo` `.t-corpo-p` `.meta` | sem divergência |
| A2 · máx. 65 caracteres por linha | `.medida { max-width: 65ch }` | sem divergência |
| A3 · grid 1504 / margem 48 / gutter 24 | `.trilho` (`globals.css:620-631`) aplicada na vitrine, conta e admin | sem divergência |
| A3 · espaçamento base 4 | `--s-1`…`--s-24` sob `.ui-prensa` | sem divergência |
| A3 · movimento: 140/440/620ms + duas curvas | `--t-rapido` `--t-base` `--t-lento` `--e-saida` `--e-suave` | sem divergência |
| A4 · botões (4 variantes × 3 medidas × 6 estados) | `.btn-ink` `.btn-quiet` `.btn-texto` `.btn-perigo` + `.btn-g`/`.btn-sm` + `Botao.tsx` | sem divergência |
| A4 · campos (vazio/preenchido/foco/erro/desabilitado) | `.campo`, `.rotulo`, `.erro-do-campo` + `Campo.tsx` | sem divergência |
| A4 · etiquetas de status (6 tons, só "no ar" sólida) | `.etiqueta*` + `Etiqueta.tsx` | sem divergência |
| A4 · aviso com traço de 3px | `.aviso` + `Aviso.tsx` | sem divergência |
| A4 · trilha de segmentos | `.trilha` + `Trilha.tsx` | sem divergência |
| A4 · abas com sublinhado de 2px | `.aba` + `Abas.tsx` | sem divergência |
| A4 · esqueleto com varredura | `.motion-skeleton` | sem divergência |
| A4 · estado vazio | `EstadoVazio.tsx` | sem divergência |
| A4 · diálogo de confirmação | `DialogoDestrutivo.tsx` | sem divergência (estrutura) |
| A5 · logotipo, selo, direção de fotografia | `/logo-enlace.png` + `.stamp` (`ProofStamp.tsx`) | sem divergência |
| Ícones · biblioteca Lucide monoline 1.5 | `Icone.tsx` — 93 entradas, 3 primitivas (`path`/`circle`/`rect`) | sem divergência |
| V1–V5 · voz, fórmulas, formatos, vocabulário, palavras banidas | Nenhum arquivo de verificação. As regras estão em `docs/regras-de-negocio.md` §6 e são cumpridas à mão | **divergente** — sem teste que reprove "Ops!", "Sucesso!", "inválido", "template", "preview", "upload" em string visível |
| V5 · *"'RSVP' pode aparecer na rota e no admin; para o convidado é sempre **confirmar presença**"* | `lib/templates/editorial/sections.tsx:119` e `:423`, `lib/templates/toscana/sections.tsx:370` — **`RSVP` e `Kindly RSVP` como texto que o convidado lê** | **divergente** — achado ao fotografar os moldes em 25/08/2026; não estava na primeira passada, que leu código e não renderizou |
| Movimento #1 · push de rota | `components/ui/PageTransition.tsx` — `translateY(22px) scale(.985) blur(4px)`, 520ms, sem direção | **divergente** — `HANDOFF-motion.md` §1 proíbe `blur` e §3 pede `translateX(22px)` de entrada, `translateX(-8%)` de saída, `--slow` (620ms) e atraso de 120ms |
| Movimento #2 · entrada escalonada | `.motion-stagger` + teto de 8 irmãos | sem divergência |
| Movimento #3 · diálogo | `DialogoDestrutivo.tsx` usa `.motion-rise-in` (translateY 20px); o scrim entra sem transição | **divergente** — handoff pede `scale(.96)→1 + translateY(8px)→0` na caixa e `fade` no scrim |
| Movimento #4 · brinde (toast) | Nenhum componente. `CopiarLink.tsx` troca o rótulo para "Copiado!" no lugar | **NOVO** |
| Movimento #5 · esqueleto → conteúdo | `SiteSkeleton.tsx` (GSAP), `.motion-skeleton` | sem divergência |
| Movimento #6 · publicar → no ar | Marca d'água `PRÉVIA` existe (`SiteFromView.tsx:131`); nada anima a saída dela nem o selo "No ar" | **NOVO** |
| Movimento #7 · sucesso do RSVP | `.rsvp-anel` + `.rsvp-check` (`stroke-dashoffset` 26→0, 550ms, atraso 240ms) | sem divergência |
| Movimento #8 · gerando o site (§3.1: ~6s, piso de 2,5s, 10 fases) | `CelebrationScreen.tsx` + `SiteSkeleton.tsx` — 4 etapas, `RITMO_MS = 1200`, **sem piso**, dura o tempo real do provisionamento (~1s) | **[CONFLITO COM DECISÃO EXISTENTE]** — o piso de 2,5s é espera inventada, proibida por `regras-de-negocio.md` §2.2; o comentário do arquivo registra que ele já foi removido depois de crítica do dono |
| Movimento #9 · hover / press / foco | `.btn:active { scale(.975) }`, `.btn-ink:active { inset shadow }`, anel de foco `--mark` | sem divergência |
| Movimento #10 · editor de convite | Seleção e alças existem; guias de encaixe não | coberto na Área C (§3.2) |
| `prefers-reduced-motion` | `globals.css:377-440` + `InterruptorDeMovimento.tsx` | sem divergência |

---

## 2. Área B — Público (site do casal, convidado e vitrine)

### 2.1 · Faixa F — o site do casamento

Arquivos do protótipo: `Enlace - F Site Casamento.dc.html` (F1–F5).
Arquivos da versão atual: `app/s/[slug]/page.tsx`,
`components/site/{SiteRenderer,SiteFromView}.tsx`, `lib/templates/*/sections.tsx`,
`app/c/[slug]/page.tsx`, `app/rsvp/[slug]/page.tsx`,
`app/s/[slug]/meu-convite/page.tsx`, `app/preview/[token]/page.tsx`.

| Tela do protótipo | Equivalente na versão atual | Status |
|---|---|---|
| F1 · `/s/:slug` — seções capa, história, o dia, contagem, galeria, CTA de presença, rodapé | `SiteRenderer` monta `template.order` filtrado por `sectionsForTier`; as 10 `SectionKey` existem nos 6 moldes | sem divergência (conteúdo das seções) |
| F1 · barra fixa no topo (`.enSiteNav`: nomes + História/O dia/Presentes/Galeria + botão "Confirmar presença") | Nenhum molde declara `<nav>` nem `sticky` (`grep -rln "sticky\|<nav" lib/templates/*/sections.tsx` → vazio) | **NOVO** |
| F1 · desktop desenhado em 1440 de largura cheia | `SiteRenderer.tsx:70` — `max-w-[480px] lg:max-w-[1120px]` | **divergente** — e a medição de 25/08/2026 mostrou que o eixo é outro: o produto renderiza um **cartão centralizado** sobre `--outer`, o artboard não tem faixa nenhuma. Ver `specs/site-publico/002` |
| F2 · `/s/:slug/meu-convite` — página pessoal com lugares reservados e resposta atual | `app/s/[slug]/meu-convite/page.tsx` (419 linhas), dois estados: busca por nome e `?grupo=` | sem divergência |
| F3 · `/c/:slug` — convite como página, com botão de confirmar presença | `app/c/[slug]/page.tsx` + `ConviteVisual.tsx` — bloco com link vira `<a>` real | **divergente** — o convite semeado (`lib/site/inviteSeed.ts:116-135`) aponta para o endereço do site, não para `/rsvp`; não existe bloco do tipo "botão" |
| F4 · `/rsvp/:slug` — prazo, contador de lugares, nomes, recado, tela de sucesso | `app/rsvp/[slug]/page.tsx` + `ConfirmacaoDePresenca.tsx` (422 linhas) | sem divergência |
| F4 · restrição alimentar (Nenhuma/Vegetariano/Vegano/Sem glúten) | Não existe | **[CONFLITO COM DECISÃO EXISTENTE]** — decisão do dono já aplicada: campo de recado sim, restrição alimentar não |
| F5 · `/preview/:token` com selo PRÉVIA sobre o hero | `app/preview/[token]/page.tsx` + `SiteFromView.tsx:131` | sem divergência |
| — | `AlbumPorCategoria.tsx`, `Mural.tsx`, `PhotoLightbox.tsx`, `SplitReveal.tsx`, `RevealOnScroll.tsx` | **FORA DO ESCOPO DO PROTÓTIPO** |

### 2.2 · Faixa H — falhas do convidado

| Tela do protótipo | Equivalente na versão atual | Status |
|---|---|---|
| H1 · 404 de endereço inexistente | `app/s/[slug]/not-found.tsx` + `BecoComSaida.tsx` | sem divergência |
| H2 · convite indisponível, com cartão do casamento | `app/c/[slug]/not-found.tsx` | sem divergência (status 200 e não 410 — desvio documentado no código) |
| H3 · prazo de confirmação vencido | `lib/site/prazoRsvp.ts` + `app/rsvp/[slug]/page.tsx` | sem divergência |
| H4 · site com senha / site oculto | `SenhaDoSite.tsx`, `lib/site/acessoDoSite.ts`, `app/s/[slug]/page.tsx:105-140` | sem divergência |
| H5 · Pix de presente não confirmado, com "nada foi cobrado" e resolução em 1 dia útil | Não existe e **não é observável**: `registerContributionAction` é auto-declaração do convidado; o dinheiro nunca passa pela Enlace | **[CONFLITO COM DECISÃO EXISTENTE]** — `regras-de-negocio.md` §2.4; o texto do desenho promete um acerto que a Enlace não pode fazer |

### 2.3 · Compartilhamento (S1–S3, o que as rotas públicas emitem)

| Prancha | Equivalente na versão atual | Status |
|---|---|---|
| S1 · `og:title` / `og:description` / `og:image` / `og:url` / `twitter:card` | `app/s/[slug]/page.tsx:70-101`, `app/c/[slug]/page.tsx` | sem divergência |
| S1 · cartão 1200×630 nas duas variantes (com foto e tipográfica em papel) | `app/s/[slug]/opengraph-image.tsx`, `app/c/[slug]/opengraph-image.tsx`, `lib/site/ogImagem.tsx` | sem divergência |
| S1 · endereço novo a cada troca de capa | `versaoDoCartao` em `lib/site/cartaoDeLink.ts` → `?v=` | sem divergência |
| S2 · mensagens prontas de WhatsApp | `components/account/manage/Compartilhar.tsx` (área C) | sem divergência |
| S3 · QR correção H, margem 4 módulos, SVG + PNG 300dpi | `app/api/qr/[slug]/route.ts`, `lib/site/qrDoSite.ts` | sem divergência |

### 2.4 · Vitrine (B1–B9)

| Rota do protótipo | Equivalente na versão atual | Status |
|---|---|---|
| B1 · `/` — hero, como funciona, faixa de estilos, pacotes, rodapé | `app/page.tsx` (696 linhas), `components/landing/*` | sem divergência |
| B2 · `/pacotes` — três cartões com lista de benefícios e dúvidas comuns | `app/pacotes/page.tsx` → `redirect("/")` | **divergente** (a rota existe e não entrega a tela) |
| B3 · `/pacotes/exemplo/:pacote` — demo navegável com faixa "EXEMPLO" | `app/pacotes/exemplo/[pacote]/page.tsx` → `redirect("/")` | **divergente** |
| B4–B9 · `/pacotes/estilos/{...}` — galeria dos 6 estilos + painel de detalhe | As 6 rotas existem, mas cada uma é a **prévia inteira** de um site fictício (5.121 linhas somadas), não a galeria | **divergente** — e a prévia com casal fictício é preservada de propósito pelo SDD §4.4.1 |

### 2.5 · E-mails que vão para o convidado

| Modelo do protótipo | Equivalente na versão atual | Status |
|---|---|---|
| 05 · Convite para o convidado | Não existe | **NOVO** |
| 06 · Lembrete de confirmação (cron, 7 dias antes do prazo) | Não existe | **NOVO** |
| Casca: tabela de 600px, papel `#f2efe7`, botão de tinta, preheader, `List-Unsubscribe` | `lib/email.ts:62-70` — `<div>` de 480px, Inter, botão-pílula verde `#2f3a29`, sem preheader | **divergente** |

---

## 3. Área C — Painel do casal (e a jornada autenticada)

### 3.1 · Faixa E — as abas de `/conta/pedidos/:id`

Arquivos do protótipo: `Enlace - E Painel.dc.html` (E1–E10),
`HANDOFF-editor-convite.md`, `Enlace - Compartilhamento.dc.html` (S4),
`Enlace - Primeira Vez.dc.html` (I1–I3), `Enlace - Notificacoes.dc.html` (J1–J3).

Arquivos da versão atual: `app/conta/pedidos/[id]/{layout,page}.tsx` e as 8
subrotas, `components/account/**`, `components/account/convite/**` (2.686 linhas).

| Tela do protótipo | Equivalente na versão atual | Status |
|---|---|---|
| Casca E · barra do site + 7 abas | `layout.tsx:82-140` + `CascaDoPainel.tsx` — 8 abas (as 7 + **Compartilhar**), mais **Recados** quando o pacote inclui mural | sem divergência (Recados é adição) |
| E1 · início com régua de números, checklist e coluna de consulta | `page.tsx` + `ReguaDeNumeros`, `OQueFalta`, `FaixaDoCasamento`, `LivePreview`, `AreasEditaveis`, `ProofStamp` | sem divergência |
| E2 · páginas (ligar/desligar/reordenar) + visibilidade em 3 estados | `paginas/page.tsx` + `SiteControls.tsx` (375 linhas) | sem divergência |
| E3 · conteúdo em duas colunas com prévia ao vivo | `conteudo/page.tsx` + `ContentEditor.tsx` | sem divergência |
| E4 · visual: 6 estilos, cor de destaque, tipografia, prévia | `visual/page.tsx` + `ThemeEditor`/`TemplatePicker`/`PhotoOrder` | sem divergência |
| E5 · fotos: filtros por categoria, grade, capa marcada | `fotos/page.tsx` + `PhotoManager.tsx` | sem divergência |
| E6 · presentes: CRUD de cotas, arrecadado, chave Pix na aba | `presentes/page.tsx` + `Cotas.tsx` (324 linhas) | sem divergência |
| E7 · convites: **3 cartões de número** (convites / convidados / confirmaram) e **tabela** com CONVITE, LINK, CONVIDADOS, STATUS, Abrir/Publicar/apagar | `convites/page.tsx` — grade de miniaturas (`MiniConvite`) com o nome embaixo; sem números, sem link, sem status, sem ação de publicar na listagem | **divergente** |
| E8 · editor clássico do convite (nome interno, link, prazo, mensagem, lista de convidados) | `app/conta/convites/[conviteId]/page.tsx` abre direto o editor visual | **divergente** — a tela de formulário E8 não existe como tela separada |
| E9 · editor visual | `components/account/convite/*` | ver §3.2 |
| E10 · prévia com marca d'água + card de preço + "o que muda ao publicar" + checkout Pix + tela "Seu site está no ar!" | `PaymentButton.tsx`, `OrderStatusTracker.tsx`, `LivePreview.tsx`; a marca d'água PRÉVIA existe só dentro do site renderizado (`SiteFromView`), não sobre a miniatura do painel | **divergente**; o checkout embutido é **[CONFLITO COM DECISÃO EXISTENTE]** — cancelado pelo dono, o checkout é do AbacatePay |
| I1 · painel no minuto zero (3 passos no lugar da régua) | `PrimeiraVez.tsx` (174 linhas), acionado por `semMovimento` | sem divergência |
| I2 · estados vazios das abas | `EstadoVazio.tsx` usado nas abas | sem divergência |
| I3 · `/conta/pedidos` vazio | `app/conta/pedidos/page.tsx` | sem divergência |
| J1 · sino com avisos agrupados por dia | `Avisos.tsx` + `lib/site/avisos.ts` — 4 tipos (`presente`, `confirmacoes`, `prazo`, `no-ar`), agrupados por dia, com link de ação | **divergente** — sem estado lido/não-lido (ausência documentada e justificada no arquivo), sem "marcar tudo como lido", sem tipo `recado` |
| J2 · `/conta/avisos` — preferências por evento (sino × e-mail) | Não existe | **NOVO** |
| J3 · resumo semanal por e-mail | Não existe | **NOVO** |
| S4 · aba Compartilhar (link, WhatsApp, mensagens prontas, cartão, QR, visitas) | `compartilhar/page.tsx` + `Compartilhar.tsx` (248 linhas) | sem divergência |
| — | aba **Recados** (`recados/page.tsx` + `Recados.tsx`, com `esconderRecadoAction`) | **FORA DO ESCOPO DO PROTÓTIPO** |

### 3.2 · E9 — o editor visual de convite × `HANDOFF-editor-convite.md`

| Item do handoff | Situação na versão atual | Status |
|---|---|---|
| §1 · DOM absoluto, sem lib de canvas | `BlocoNaTela.tsx` / `BlocoVisual.tsx` — DOM absoluto, sem Fabric/Konva | sem divergência |
| §1 · um render, dois modos | `BlocoVisual` é compartilhado entre editor, `MiniConvite` e `ConviteVisual` (público) | sem divergência |
| §1 · tema escuro do editor | `.tema-escuro` em `globals.css:1310` | sem divergência |
| §2 · modelo `InviteDoc` com `TextEl`/`ImageEl`/`ShapeEl`/`ButtonEl`, canvas em mm, campo `template` | `lib/site/inviteDoc.ts` — `texto`/`foto`/`linha`/`forma`, coordenadas em **fração**, `largura`/`altura` em px, sem `template` e **sem tipo botão** | **divergente** — trocar o modelo reescreveria `site_invites.doc` (jsonb) de convites já gravados |
| §4 · painel Modelos (6 estilos, re-tematiza) | Não existe painel de modelos | **NOVO** |
| §5 · snap em centro/bordas/guias de outros elementos, guias magenta, tolerância 6px | `grep -rn "snap\|encaix\|guia" components/account/convite/` → vazio | **NOVO** |
| §5 · setas do teclado movem 1px (Shift = 10px) | `EditorDeConvite.tsx:374-393` — só `Delete`/`Backspace` e `Escape` | **NOVO** |
| §5 · 8 alças (4 cantos + 4 meios) | `BarraDoBloco.tsx` — alças nas bordas | investigação necessária na implementação (não dá para afirmar por leitura de código) |
| §5 · rotação com trava de 15° no Shift e ângulo perto do cursor | Rotação existe (`rotacao` em `BlocoBase`) | investigação necessária na implementação |
| §5 · duplo-clique entra em edição inline | `editandoTexto` no editor | sem divergência |
| §5 · barra de contexto flutuante | `BarraDoBloco.tsx` (329 linhas), segue o bloco | sem divergência |
| §5 · Ctrl/Cmd C/V/D, `[`/`]`, `+`/`-`, `0`, Espaço+arrasto | Nenhum. Pan é arrastando o fundo; zoom é a roda do mouse | **NOVO** |
| §6 · inspetor por tipo | Controles por tipo em `controles.tsx` | sem divergência |
| §7 · undo/redo com limite ~50, 1 entrada por gesto | `useHistorico.ts` (130 linhas) | sem divergência |
| §7 · autosave com debounce de 800ms + indicador "salvo há X" | Só `salvar()` manual (`EditorDeConvite.tsx:548`); nenhum `setTimeout` de autosave | **NOVO** |
| §7 · publicar valida nomes, data e **botão de RSVP presente** | `PublicarConvite.tsx` publica sem validar botão de RSVP | **divergente** |
| §10 · rota `/conta/convites/:conviteId/editor` | `/conta/convites/:conviteId` abre o editor direto | **divergente** (endereço, não comportamento) |

### 3.3 · Faixas C e D — auth e questionário

| Tela do protótipo | Equivalente na versão atual | Status |
|---|---|---|
| C1–C5 · entrar, criar, esqueci, redefinir, `/conta` | `app/conta/{entrar,criar,esqueci,redefinir}/page.tsx`, `app/conta/page.tsx` | sem divergência |
| D1 · `/conta/pedidos` | `app/conta/pedidos/page.tsx` | sem divergência |
| D2/D3 · questionário de 11 etapas com trilha de segmentos | `lib/wizard/etapas.ts` — 11 ids (`pacote`…`revisao`), `OrderWizard.tsx` (773 linhas), `.trilha` | sem divergência |
| D · tela "gerando o site" | `CelebrationScreen.tsx` | ver o conflito da Área A (Movimento #8) |

### 3.4 · E-mails que vão para o casal

| Modelo do protótipo | Equivalente na versão atual | Status |
|---|---|---|
| 01 · Confirmar conta | `sendEmailVerification` existe em `lib/email.ts:161` e **nenhum arquivo a importa** | **divergente** (código morto — a verificação de e-mail só existe na branch órfã, `AGENTS.md` §6) |
| 02 · Redefinir senha | `sendPasswordResetEmail` → `app/actions/password-reset-actions.ts:65` | sem divergência de conteúdo (a casca diverge) |
| 03 · Recibo do pagamento | Não existe | **NOVO** |
| 04 · Seu site está no ar | Não existe | **NOVO** |
| — | `sendPreviewReadyEmail` ("a prévia está pronta") | **FORA DO ESCOPO DO PROTÓTIPO** |

---

## 4. Área D — Painel do admin

Arquivo do protótipo: `Enlace - G Admin.dc.html` (G1–G5).
Arquivos da versão atual: `app/admin/{layout,page}.tsx`,
`app/admin/{login,dashboard,pedidos,presentes}/page.tsx`, `components/admin/*`.

| Tela do protótipo | Equivalente na versão atual | Status |
|---|---|---|
| G1 · `/admin/login` | `app/admin/login/page.tsx` | sem divergência (não anuncia "2FA ativo" porque não há 2FA — desvio correto) |
| Casca G · barra escura, 4 itens, iniciais | `AdminNav.tsx` + `app/admin/layout.tsx` (`.ui-prensa admin`) | sem divergência |
| G2 · `/admin` — **Grupos e permissões da equipe** (cartões com membros, criar grupo, apagar) | `app/admin/page.tsx` — "Gerenciar convidados": grupos de **convidados do casamento legado** (`getLegacySiteId()`) | **NOVO** (a tela do desenho não existe) + a tela atual fica **FORA DO ESCOPO DO PROTÓTIPO** ocupando o mesmo endereço |
| G3 · `/admin/dashboard` — operação (pedidos/mês, receita, sites no ar, conversão, barras de 14 dias, por pacote) | `app/admin/dashboard/page.tsx` — `RsvpDashboard`: confirmações do casamento legado | **NOVO** + a tela atual fica **FORA DO ESCOPO DO PROTÓTIPO** no mesmo endereço |
| G4 · `/admin/pedidos` — filtros (Todos/No ar/Prévia/Cancelados), busca, tabela de 7 colunas | `app/admin/pedidos/page.tsx` — cartões (`OrderCard`) agrupados em 3 seções, sem filtros, sem busca, sem tabela; mais um `<details>` com o prompt de LLM | **divergente** |
| G5 · `/admin/presentes` — tabela de contribuições recentes **entre casais** + total do mês + card "A REPASSAR" (pendente / repassado) | `app/admin/presentes/page.tsx` — `GiftAdmin` com cotas e contribuições do casamento legado | **divergente**; o card "A repassar" é **[CONFLITO COM DECISÃO EXISTENTE]** — `regras-de-negocio.md` §2.4: o Pix vai direto para o casal e a Enlace nunca fica no meio, logo não há repasse pendente |
| G · largura 1440 (tabelas de 5–7 colunas) | `.trilho` (1504) nas quatro páginas | sem divergência |

---

## 5. Verificação de cobertura

Todo arquivo do protótipo aparece acima. Mapa arquivo → seção deste
levantamento:

| Arquivo do protótipo | Onde foi comparado |
|---|---|
| `Enlace - Fundacao.dc.html` | §1 |
| `Enlace - Voz e Microcopy.dc.html` | §1 |
| `Enlace - Icones.dc.html` | §1 |
| `Enlace - Movimento.dc.html` | §1 |
| `HANDOFF-motion.md` | §1 |
| `Enlace - F Site Casamento.dc.html` | §2.1 |
| `Enlace - Falhas Convidado.dc.html` | §2.2 |
| `Enlace - Compartilhamento.dc.html` | §2.3 (S1–S3) e §3.1 (S4) |
| `Enlace - B Vitrine.dc.html` | §2.4 |
| `Enlace - Emails.dc.html` | §2.5 (05–06) e §3.4 (01–04) |
| `Enlace - E Painel.dc.html` | §3.1 e §3.2 |
| `HANDOFF-editor-convite.md` | §3.2 |
| `Enlace - Primeira Vez.dc.html` | §3.1 (I1–I3) |
| `Enlace - Notificacoes.dc.html` | §3.1 (J1–J3) |
| `Enlace - C Auth.dc.html` | §3.3 |
| `Enlace - D Questionario.dc.html` | §3.3 |
| `Enlace - G Admin.dc.html` | §4 |
| `README.md` (do pacote) | §0 (recorte das áreas) e §1 (largura cheia, precedência da Fundação) |
| `support.js` | runtime do Claude Design para abrir os `.dc.html` no navegador — **não é peça do produto**, não gera comparação |
| `casal.png`, `noiva.png`, `noivo.png`, `buque.png`, `aneis.png` | fotos de composição das pranchas; a direção de fotografia está em §1 (A5) |
| `1629812846669.pdf`, `francisco.pdf`, `ingresso.pdf`, `joao.pdf`, `miranda.pdf`, `naju.pdf`, `nycolas.pdf`, `sara.pdf`, `ygor.pdf`, `skill.md` | arquivos alheios ao pacote de design, guardados na mesma pasta — fora do escopo desta auditoria |

**O que não foi possível auditar por leitura de código**, e por isso não gerou
requisito nenhum:

- ~~**Geometria renderizada seção a seção dos 6 moldes.**~~ **Medido em
  25/08/2026** (`npm run shot:template` + medição por CDP nos seis, a 1440,
  com e sem o cartão forçado). Os números e o que eles mostraram estão em
  `specs/site-publico/002`, seção "A medição". Foi essa passada que revelou as
  três violações de `RSVP` da §1 — a leitura de código sozinha não as pegou.
- **Alças e ângulo de rotação do editor de convite** (§3.2) — marcados como
  "investigação necessária na implementação" na própria tabela.
- **Medidas de 1–2px.** Só entraram divergências que dão para provar por valor
  de token ou de classe no código.
