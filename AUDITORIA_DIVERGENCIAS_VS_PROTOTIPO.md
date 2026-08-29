# Auditoria — versão atual × protótipo Enlace

> **Este arquivo não implementa nada.** Ele é o guia completo para a próxima
> sessão implementar. Cada divergência traz localização, situação atual,
> situação esperada, alteração necessária, impacto técnico, critério de aceite
> e prioridade.

**Data da auditoria:** 24/08/2026
**Referência (protótipo):** pacote de design em `C:\Users\fande\Downloads\` —
15 arquivos `.dc.html` + `HANDOFF-motion.md` + `HANDOFF-editor-convite.md` +
`README.md`.
**Auditado (versão atual):** `c:\Users\fande\Downloads\marriage_web-site\marriage_web-site`,
branch `main`, Next 16 com Cache Components.

**Regra de precedência usada nesta auditoria** (do próprio `README.md` do
pacote e do `AGENTS.md` §5):

1. `Enlace - Fundacao.dc.html` vence qualquer tela quando as duas discordam.
2. Quando o **desenho** e a **regra de produto** (`docs/regras-de-negocio.md`,
   agente `regras-de-negocio`) discordam, **o produto vence** — e a divergência
   fica registrada aqui como decisão consciente, não como bug a corrigir.
3. `/rsvp/<slug>` tem 22 confirmações de gente real e links já no WhatsApp
   (`AGENTS.md` §2). Nenhuma correção pode quebrá-la; onde esta auditoria pede
   mudança nessa rota, o item está marcado **RISCO ALTO**.

---

> ## ⚑ Estado da execução — Levas 0, 1, 5 e a Crítica da 2 · 25/08/2026
>
> `npm run build` ✓ · `npm run test` **347 testes** ✓ · `npm run lint` ✓ ·
> `verify:template` ✓. Invariantes do banco conferidas: **23 confirmações
> reais intactas** nos dois modelos, 103 cotas preservadas.
>
> **Migração `0017_hot_wrecker`** — uma coluna nullable (`gifts.quantity`),
> ensaiada e aplicada, rollback escrito. Sem backfill: toda cota existente
> continua sem teto, que é como ela se comportava antes.
>
> ### Leva 0 · Fundação e limpeza — completa
>
> | Item | O que mudou |
> |---|---|
> | `ARQ-01` `ARQ-02` | Classe `.trilho` (1504 / margem 48–24) aplicada em 10 arquivos; o admin saiu de 672–768px |
> | `ARQ-03` | `--e-suave` virou `cubic-bezier(.65,0,.35,1)` (era a curva do Material Design) |
> | `ARQ-04` | Stagger 55→60ms **e** o teto de 8 irmãos, que não existia |
> | `ARQ-06` | `<title>` raiz deixou de anunciar o casamento de um casal |
> | `ARQ-07` | Raio 3px mora nas `.surface-*`; `rounded-xl` (12px) do LivePreview corrigido |
> | `IC-01` `IC-02` | Biblioteca de 22 → **63 ícones**, com `<rect rx>` — e o ícone de foto ganhou a lente que faltava |
> | `VOZ-01` `VOZ-03` `VOZ-05` | "PIX"→"Pix", `...`→`…`, emoji fora de rótulo de botão |
> | `E10-04` `VOZ-02` | "Efetuar pagamento" → **"Pagar e publicar"**, com `Botao` + rodinha e ícone de escudo |
> | `EXTRA-01` | `/diagnostico` apagada (rota de depuração pública) |
>
> ### Leva 1 · Compartilhamento — completa
>
> A prancha inteira não existia. Agora:
>
> - **`S-01`** — `og:title`, `og:description`, `og:image`, `og:url` e
>   `twitter:card` em `/s/:slug` e `/c/:slug`. Site não publicado **não** emite
>   nada: publicar pelo cartão de link seria publicar pela porta dos fundos.
> - **`S-02`** — imagem 1200×630 nas duas variantes do desenho (com foto e
>   tipográfica em papel), com `?v=` derivado do conteúdo — sem isso o WhatsApp
>   mostra a capa antiga por dias, que é a regra explícita da prancha.
> - **`S-03`** — QR em SVG e PNG 300dpi, correção H, margem de 4 módulos.
> - **`NAV-04` `S-04`** — a aba **Compartilhar**, com link, botão de WhatsApp
>   (`navigator.share` com queda para `wa.me`), as três mensagens prontas de S2,
>   a prévia do cartão e o card de visitas.
>
> **Quatro defeitos reais encontrados ao provar o cartão**, todos consertados e
> documentados no código: o Satori não resolve `inset: 0` (o texto saía no
> canto), não lê o atalho `background` para gradiente (o texto branco sumia na
> foto clara), não decodifica WebP (a foto sumia sem erro visível), e
> `ImageResponse` só emite PNG — o cartão com foto saía com **1,7 MB** contra o
> limite de 300 KB da prancha. Convertido para JPEG via `sharp` (agora
> dependência declarada): **94 KB**.
>
> ### Leva 2 · a última divergência Crítica — feita
>
> **`E6-01`** — `criarCotaAction`, `editarCotaAction` e `apagarCotaAction`
> existiam, estavam corretas e **nenhum arquivo as importava**. A aba mandava o
> casal montar a lista e pedir pelo WhatsApp — quebrando "o casal não trabalha"
> e "o dono não encosta" ao mesmo tempo. Agora: CRUD completo com edição
> inline, diálogo destrutivo, as duas colunas do desenho, a chave Pix na
> própria aba, e barra de progresso por cota (a coluna `quantity` da 0017).
> 10 testes novos, incluindo isolamento entre casais.
>
> **O card "arrecadado" não mostra valor cheio de propósito.** Só soma quando
> toda cota escolhida tinha preço fixo — uma cota de valor livre não tem quanto
> o convidado deu, e somar só as de preço fixo daria um número menor que o real
> apresentado como total.
>
> ### O que continua pendente
>
> `E10-01` foi **cancelado pelo dono** (o checkout é do AbacatePay).
> Seguem abertas: Levas 3 (editor de convite), 4 (e-mails e publicação),
> 6 (admin), 7 (vitrine, notificações, movimento), e `F1-01`/`F1-02` da Leva 5.
>
> ---
>
> ## ⚑ Estado da execução — Leva 5 concluída em 24/08/2026
>
> A **Leva 5 (Convidado)** foi implementada. `npm run build` ✓ ·
> `npm run test` 337 testes ✓ · `npm run verify:template` ✓ nos 6 moldes.
>
> **Migração `0016_tiresome_millenium_guard`** — aditiva, ensaiada
> (`db:rehearse`) e aplicada. Rollback escrito em
> `lib/db/migrations/down/0016_*.sql`. Backup em
> `backups/full-backup-2026-08-24T23-25-42-252Z.json`.
> Nada foi apagado: **as 23 confirmações reais estão intactas nos dois
> modelos** (23 em `guests.rsvp_status`, 23 em `groups.seats_confirmed`).
>
> | Item | Estado |
> |---|---|
> | `F4-01` RSVP com contador de lugares, nomes, recado e tela de sucesso | ✅ feito |
> | `F4-02` prazo de confirmação (H3), travado também no servidor | ✅ feito |
> | `M-04` check desenhado da confirmação | ✅ feito |
> | `F2-01` página pessoal do convidado | ✅ feito |
> | `E2-02` site com senha (3 estados na aba Páginas) | ✅ feito |
> | `H-03` tela de senha, erro sob o campo, limite por IP | ✅ feito |
> | `H-01` convite despublicado com cartão do casamento | ✅ feito (status 200, não 410 — ver a nota no código) |
> | `H-02` `noindex` nas telas de falha | ✅ feito |
> | `F5-01` selo PRÉVIA sobre o hero | ✅ feito |
> | `H-04` Pix de presente não confirmado | ❌ **não implementável** — ver abaixo |
> | `F1-01` barra fixa do site publicado | ⬜ não feito |
> | `F1-02` largura do site publicado | ⬜ não feito |
>
> **Decisões do dono aplicadas nesta leva:** modelo de RSVP por contador de
> lugares (o modelo por nome permanece no banco, intocado); campo de recado
> sim, restrição alimentar não; site com senha liberado em **todos** os
> pacotes; migração aplicada de verdade.
>
> **`H-04` não é implementável como desenhado.** O Pix de presente é
> auto-declarado pelo convidado (`GiftPixModal` → `registerContributionAction`):
> não há código de cobrança, não há expiração e não há retorno de status,
> porque **o dinheiro vai direto para o casal e nunca passa pela Enlace**
> (regras §2.4). O produto não tem como saber que um Pix falhou. Pior: a linha
> do desenho sobre `ajuda@enlace.site` resolver "em até 1 dia útil" promete um
> estorno que a Enlace não pode fazer. Vai para a §5.3 como divergência
> assumida — o produto vence o desenho.
>
> **Coisas novas construídas que o protótipo não previa, e por quê:**
> - `app/api/agenda/[slug]/route.ts` — o `.ics` que faz "Adicionar à agenda"
>   ser um botão de verdade. Quando o casal não informou a hora, o evento vira
>   de **dia inteiro** em vez de cair à meia-noite na agenda do convidado.
> - `lib/site/prazoRsvp.ts` — a comparação de prazo num lugar só, com fuso do
>   casamento e o dia contando inteiro.
> - `lib/site/acessoDoSite.ts` — o crachá assinado com HMAC. Trocar a senha
>   invalida todos os crachás, de graça.
> - `scripts/backfill-rsvp-grupo.mjs` — idempotente, com `--dry`.
> - `app/actions/site-access.test.ts` — 8 testes de controle de acesso.
>
> **Um defeito de multi-tenancy corrigido de passagem:** `/rsvp/<slug>` abria
> com `<SaveTheDate />`, um JPEG chumbado de UM casal (`/save-the-date.jpeg`,
> com "Isabelle e Nycolas" até no `alt`). Qualquer convidado de qualquer outro
> casamento veria a capa do casamento errado. Hoje ninguém era atingido — os 23
> grupos são do site legado — e era por isso mesmo que a hora de tirar era
> antes do segundo casal.

## 1. Resumo executivo

**Total de divergências catalogadas: 113.**

| Prioridade | Qtd. | Leitura |
|---|---|---|
| **Crítica** | 6 | Fluxo inteiro do protótipo não existe, ou existe contradizendo uma promessa do produto |
| **Alta** | 28 | Tela existe, mas com estrutura, componente ou comportamento substancialmente diferente |
| **Média** | 53 | Diferença visível de layout, componente, cor, tipografia, copy ou estado |
| **Baixa** | 26 | Ajuste fino: valor de token, rótulo, ícone, espaçamento |

As seis **Críticas** são: `E6-01` (cotas sem interface), `E9-01` (convite sem
botão de RSVP), `E10-01` (checkout fora do produto), `F4-01` (`/rsvp` sem o
formulário desenhado), `S-01` e `S-02` (nenhum cartão de link).

### Principais áreas afetadas, em ordem de gravidade

1. **Faixa G · Admin** — as quatro telas internas (`/admin`, `/admin/dashboard`,
   `/admin/pedidos`, `/admin/presentes`) foram redesenhadas no protótipo e
   nenhuma foi portada. Só `/admin/login` e a barra de navegação seguem o
   desenho. Todas usam trilho estreito (`max-w-3xl` / `max-w-2xl`), contra a
   regra de largura cheia da Fundação A3.
2. **Faixa F · Site do convidado** — `/rsvp/<slug>` (a tela que a prancha marca
   com "⚠ gente real usando") não tem quase nada do desenho F4: sem prazo, sem
   contador de lugares, sem nomes de quem vai, sem restrição alimentar, sem
   recado e sem tela de sucesso. `/s/<slug>/meu-convite` (F2) é uma busca por
   nome, não a página pessoal do convidado.
3. **Compartilhamento** — a prancha inteira (cartão OG, WhatsApp, QR, aba
   Compartilhar) não existe. Nenhuma rota pública emite `og:image`, `og:title`
   ou `twitter:card`.
4. **E6 Presentes (painel do casal)** — `criarCotaAction`, `editarCotaAction` e
   `apagarCotaAction` existem em `app/actions/couple-gift-actions.ts` e **não
   são chamadas por nenhuma tela**; a aba manda o casal pedir as cotas pelo
   WhatsApp. Contradiz diretamente "o casal não trabalha" e "sem trabalho
   manual por venda".
5. **E-mails** — 3 dos 6 modelos existem; a casca é `div` de 480px com Inter e
   botão-pílula verde, contra a especificação de tabela de 600px em papel com
   botão de tinta. Nenhum tem preheader. `sendEmailVerification` é código morto.
6. **E10 Publicar / checkout** — não existe tela de checkout (QR Pix, copia e
   cola, resumo, "aguardando pagamento"), nem tela de sucesso "Seu site está no
   ar!", nem a marca d'água PRÉVIA sobre a miniatura.
7. **Faixa J · Notificações** — o sino existe (bem-feito e documentado), mas
   `/conta/avisos` (preferências) e o resumo semanal por e-mail não existem, e
   não há estado lido/não-lido.
8. **Movimento** — 4 dos 10 itens do catálogo `HANDOFF-motion.md` §3 não foram
   implementados (toast, push de rota com direção, sucesso RSVP com check
   desenhado, publicar→no ar). A transição de rota usa `blur()`, que o handoff
   proíbe explicitamente.
9. **Ícones** — 22 dos ~63 ícones da biblioteca existem, e vários dos que
   existem têm geometria diferente da prancha (retângulos sem `rx`, ícone de
   foto sem a lente).
10. **Vitrine** — `/pacotes` e `/pacotes/exemplo/:pacote` são `redirect("/")`;
    a galeria de estilos B4–B9 não existe como página.

### O que já está fiel — não gera tarefa

Registrado para a próxima sessão não refazer trabalho pronto:

- Sistema Prensa em `app/globals.css` (A1 paleta, A2 escala, A4 botões, campos,
  etiquetas, aviso, trilha, abas, tema escuro do admin) — completo e correto.
- `components/ui/prensa/*` — a biblioteca A4 existe, com porta única (`index.ts`).
- Faixa C (Auth) — as cinco telas seguem o desenho, inclusive a foto trocando de
  lado entre `/conta/entrar` e `/conta/criar`.
- Faixa D — o questionário tem as **11 etapas** do desenho, trilha de segmentos
  e transição de etapa com direção.
- G1 `/admin/login` — fiel, com um desvio documentado e correto (não anuncia
  "2FA ativo", porque não existe 2FA).
- H1, H2 e o estado "site oculto" de H4 — `BecoComSaida` aplica as três regras
  da prancha H.
- Faixa I (Primeira vez) — `PrimeiraVez` substitui a régua de números no minuto
  zero, exatamente como a prancha manda.
- E9 — o editor visual de convite existe, funciona e é substancial (2.686
  linhas), embora divirja do `HANDOFF-editor-convite.md` nos pontos listados
  adiante.

---

## 2. Escopo auditado

### Rotas e arquivos da versão atual efetivamente lidos

| Rota / arquivo | Auditado contra |
|---|---|
| `app/layout.tsx` | Fundação A2 (fontes) + metadata |
| `app/globals.css` (1.239 linhas) | Fundação A1/A2/A3/A4 + HANDOFF-motion §1/§2 |
| `lib/fonts/ui.ts` | Fundação A2 |
| `app/page.tsx` (696 linhas) | B1 |
| `components/landing/{Pacotes,AccountNav,CtaPacote,HeroPreview}.tsx` | B1/B2 |
| `app/pacotes/page.tsx` | B2 |
| `app/pacotes/exemplo/[pacote]/page.tsx` | B3 |
| `app/pacotes/estilos/{classico,editorial,toscana,romantico,moderno,film}/page.tsx` | B4–B9 |
| `app/conta/{entrar,criar,esqueci,redefinir}/page.tsx`, `app/conta/page.tsx` | C1–C5 |
| `components/account/{CascaDeConta,AccountShell}.tsx` | C, casca da conta |
| `lib/wizard/etapas.ts`, `components/account/wizard/*` | D2/D3 |
| `app/conta/pedidos/page.tsx` | D1 / I3 |
| `app/conta/pedidos/[id]/layout.tsx` + `manage/CascaDoPainel.tsx` | E (as 7 abas) |
| `app/conta/pedidos/[id]/page.tsx` + `ReguaDeNumeros`/`OQueFalta`/`FaixaDoCasamento` | E1 |
| `.../paginas/page.tsx` + `SiteControls.tsx` | E2 |
| `.../conteudo/page.tsx` + `ContentEditor.tsx` | E3 |
| `.../visual/page.tsx` + `ThemeEditor`/`TemplatePicker`/`PhotoOrder` | E4 |
| `.../fotos/page.tsx` + `PhotoManager.tsx` | E5 |
| `.../presentes/page.tsx` | E6 |
| `.../convites/page.tsx` + `MiniConvite.tsx` | E7 |
| `.../recados/page.tsx` + `manage/Recados.tsx` | (fora do protótipo) |
| `app/conta/convites/[conviteId]/page.tsx` + `components/account/convite/*` (2.686 linhas) | E8/E9 + HANDOFF-editor-convite |
| `components/account/{OrderStatusTracker,PaymentButton,LivePreview,ProofStamp}.tsx` | E10 |
| `app/s/[slug]/page.tsx` | F1 / H4 |
| `app/s/[slug]/meu-convite/page.tsx` | F2 |
| `app/c/[slug]/page.tsx` + `components/site/ConviteVisual.tsx` | F3 |
| `app/rsvp/[slug]/page.tsx` + `RsvpCard`/`RsvpGuestRow`/`SaveTheDate` | F4 |
| `app/preview/[token]/page.tsx` | F5 |
| `app/admin/layout.tsx` + `components/admin/AdminNav.tsx` | G (casca) |
| `app/admin/login/page.tsx` | G1 |
| `app/admin/page.tsx` + `GroupForm`/`GroupList` | G2 |
| `app/admin/dashboard/page.tsx` + `RsvpDashboard` | G3 |
| `app/admin/pedidos/page.tsx` + `OrderCard`/`AdminOrderControls` | G4 |
| `app/admin/presentes/page.tsx` + `GiftAdmin` | G5 |
| `app/{s,c,rsvp}/[slug]/not-found.tsx` + `components/site/BecoComSaida.tsx` | H1–H5 |
| `components/account/manage/PrimeiraVez.tsx` | I1 |
| `components/account/manage/Avisos.tsx`, `lib/site/avisos.ts` | J1 |
| `lib/email.ts` (199 linhas) | Emails 01–06 |
| `components/ui/prensa/*` (11 componentes) | Fundação A4 |
| `components/ui/prensa/Icone.tsx` | Ícones |
| `components/ui/{PageTransition,SiteSkeleton,BrandLoader,EsperaDoPainel,MotionProvider}.tsx` | HANDOFF-motion |
| `app/actions/*` (11 arquivos, 33 actions) | mapa de actions das pranchas |
| `app/diagnostico`, `app/isabelle-e-nycolas`, `app/presentes`, `app/conta/pedido` | (fora do protótipo) |

### Pranchas do protótipo comparadas

`Fundacao` (A1–A5) · `Voz e Microcopy` (V1–V5) · `B Vitrine` (B1–B9) ·
`C Auth` (C1–C5) · `D Questionario` (D1–D3) · `E Painel` (E1–E10) ·
`F Site Casamento` (F1–F5) · `G Admin` (G1–G5) · `Falhas Convidado` (H1–H5) ·
`Primeira Vez` (I1–I3) · `Notificacoes` (J1–J3) · `Emails` (01–06) ·
`Compartilhamento` (S1–S4) · `Icones` · `Movimento` (#1–#10) ·
`HANDOFF-motion.md` · `HANDOFF-editor-convite.md`.

### O que NÃO foi auditado, e por quê

- **Renderização interna dos 6 moldes** (`lib/templates/*/sections.tsx`): o
  protótipo não desenha os moldes seção a seção — ele desenha o **site montado**
  (F1) e a **galeria de estilos** (B4–B9). Comparar seção a seção exigiria
  captura visual (`npm run shot:template`) e não dá para afirmar lendo código.
  **Necessita investigação na implementação.**
- **Medidas em pixel renderizadas.** As divergências de espaçamento registradas
  aqui são as que dá para provar pelo código (valor de classe ou de token).
  Diferenças de 1–2px visíveis só em captura não foram inventadas.

---

## 3. Inventário completo de divergências

### 3.1 · Visão geral e arquitetura visual (Fundação A1–A5)

---

#### [ARQ-01] — Trilho de conteúdo é de 1152–1400px; a Fundação exige 1504 com margem 48

**Localização**
- Página: todas as telas da plataforma (vitrine, conta, painel, admin)
- Seção: contêiner central de cada página
- Componente: `AccountShell`, `AdminNav`, `Pacotes`, `app/page.tsx`
- Arquivos: `components/account/AccountShell.tsx:47` e `:78`;
  `components/admin/AdminNav.tsx:50`; `components/landing/Pacotes.tsx:45`;
  `app/page.tsx` (9 ocorrências de `max-w-6xl`), `app/page.tsx:559`
  (`max-w-[1200px]`); `app/preview/[token]/page.tsx:63`

**Situação atual**
Três trilhos diferentes convivem: `max-w-6xl` (1152px) na home,
`max-w-[1200px]` na casca da conta e em `Pacotes`, `max-w-[1400px]` na barra do
admin. O padding lateral é `px-6 lg:px-8` (24/32px).

**Situação esperada no protótipo**
Fundação A3, prancha "Grid · viewport 1600 · margem 48 · 12 colunas · gutter 24
· máx 1504". A prancha nomeia o defeito explicitamente: *"Antes · coluna ~1120
no centro, fundo sobrando"* marcado em `--danger`, contra *"Agora · colunas de
verdade — lista + detalhe, tela inteira"* em `--ok`. O `README.md` §4 repete:
*"Largura cheia obrigatória. Nada de coluna estreita de ~1120px centralizada
com fundo sobrando."*

**Divergência identificada**
O produto inteiro está no trilho que a Fundação marca como o erro a corrigir.
1152px em uma janela de 1600px deixa 224px de fundo de cada lado.

**Alteração necessária**
1. Criar um token/classe único de trilho em `app/globals.css`, sob `.ui-prensa`:
   `.trilho { width: 100%; max-width: 1504px; margin-inline: auto;
   padding-inline: 48px; }` com `padding-inline: 24px` abaixo de 768px.
2. Substituir `max-w-6xl mx-auto w-full px-6`, `max-w-[1200px] mx-auto w-full
   px-6 lg:px-8` e `max-w-[1400px] mx-auto w-full px-6 lg:px-8` por `trilho` em
   todos os arquivos listados.
3. Manter a exceção já documentada e correta do hero da home (`app/page.tsx`,
   seção `relative isolate overflow-hidden`), em que a foto sangra até a borda
   direita: ali o trilho vale só para a coluna de texto.

**Impacto técnico**
- Arquivos: `app/globals.css`, `app/page.tsx`, `components/account/AccountShell.tsx`,
  `components/admin/AdminNav.tsx`, `components/landing/Pacotes.tsx`,
  `app/preview/[token]/page.tsx`
- Dependência: **ARQ-02** (páginas do admin) precisa ser feito junto, senão a
  barra fica em 1504 e o conteúdo em 768 — pior que o estado atual.
- Risco: telas que assumem duas colunas em 1200px (E1, E3, E4) ganham espaço; é
  preciso reconferir os `grid-template-columns` de cada uma depois.

**Critério de aceite**
Em viewport de 1600px, o `x` da aresta esquerda do logotipo, do `<h1>` e do
primeiro card de qualquer tela da plataforma é **48px**, e o conteúdo termina em
`x = 1552`. Medir com o inspetor em `/`, `/conta`, `/conta/pedidos/<id>` e
`/admin/pedidos`.

**Prioridade:** Alta

---

#### [ARQ-02] — Páginas do admin em `max-w-3xl` / `max-w-2xl` (768/672px)

**Localização**
- Página: `/admin`, `/admin/dashboard`, `/admin/pedidos`, `/admin/presentes`
- Seção: `<main>` de cada página
- Arquivos: `app/admin/page.tsx:12`, `app/admin/dashboard/page.tsx:11`,
  `app/admin/pedidos/page.tsx:66`, `app/admin/presentes/page.tsx:15`

**Situação atual**
`<main className="flex-1 flex flex-col gap-8 px-6 py-12 max-w-3xl mx-auto w-full">`
(672px em `/admin`, 768px nas outras três), enquanto a barra `AdminNav` roda em
`max-w-[1400px]`.

**Situação esperada no protótipo**
G2/G3/G4/G5 são todas desenhadas em **1440px de largura**, com tabelas de 5 a 7
colunas que só cabem nessa medida (ex.: G4 usa
`grid-template-columns:110px 1.4fr 1.2fr 1fr 120px 130px 80px`).

**Divergência identificada**
O conteúdo do admin ocupa metade da largura da própria barra de navegação, e
nenhuma das tabelas do desenho cabe. É a mesma classe de erro que o comentário
de `AccountShell.tsx` descreve ter consertado no painel do casal — mas no admin
ele continua.

**Alteração necessária**
Trocar `max-w-3xl` / `max-w-2xl` pela classe `trilho` de **ARQ-01** nas quatro
páginas. Feito isso, as tabelas de **G3-01**, **G4-01** e **G5-01** passam a
caber.

**Impacto técnico**
- Arquivos: os quatro `app/admin/*/page.tsx`
- Componentes afetados pela largura nova: `RsvpDashboard`, `OrderCard`,
  `GiftAdmin`, `GroupList` — todos assumem coluna estreita hoje.
- Dependência: fazer **antes** de G3-01/G4-01/G5-01.

**Critério de aceite**
Em 1440px, a aresta esquerda do `<h1>` de `/admin/pedidos` alinha com a aresta
esquerda do logotipo na barra. Nenhuma das quatro páginas tem fundo sobrando dos
dois lados.

**Prioridade:** Alta

---

#### [ARQ-03] — `--e-suave` usa curva diferente de `--ease-inout` do handoff

**Localização**
- Arquivo: `app/globals.css:36`

**Situação atual**
```css
--e-suave: cubic-bezier(0.4, 0, 0.2, 1);
```

**Situação esperada no protótipo**
`HANDOFF-motion.md` §1:
```css
--ease-inout: cubic-bezier(.65,0,.35,1); /* movimentos simétricos */
```

**Divergência identificada**
`cubic-bezier(0.4,0,0.2,1)` é a curva `standard` do Material Design, não a do
sistema Enlace. A diferença aparece em toda transição simétrica (hover de campo,
troca de estado de aba, `motion-breathe`).

**Alteração necessária**
Trocar o valor de `--e-suave` para `cubic-bezier(0.65, 0, 0.35, 1)` em
`app/globals.css:36`. Não renomear a variável — 20+ usos dependem do nome.

**Impacto técnico**
- Arquivo: `app/globals.css` (uma linha)
- Afeta: `.campo` (transição de foco), `.aba`, `.motion-breathe`, e todas as
  regras de `prefers-reduced-motion` que usam `--e-suave`.

**Critério de aceite**
`app/globals.css` declara `--e-suave: cubic-bezier(0.65, 0, 0.35, 1)`.

**Prioridade:** Baixa

---

#### [ARQ-04] — Escalonamento (stagger) usa 55ms; o handoff especifica 60ms

**Localização**
- Arquivo: `app/globals.css:227` e `:326`

**Situação atual**
```css
animation-delay: calc(var(--motion-delay, 0ms) + var(--i, 0) * 55ms);
```

**Situação esperada no protótipo**
`HANDOFF-motion.md` §1: *"Stagger: 60ms entre irmãos; no máx. ~8 itens, depois
entra tudo junto."* A Fundação A3 repete: *"escalonando 60ms entre irmãos"*.

**Divergência identificada**
Duas diferenças: (a) 55ms em vez de 60ms; (b) **não existe o teto de ~8 itens** —
uma lista de 20 cards escalona os 20, e o vigésimo entra 1,1s depois do primeiro.

**Alteração necessária**
1. Trocar `55ms` por `60ms` nas duas ocorrências.
2. Acrescentar o teto: `.motion-stagger > *:nth-child(n+9) { animation-delay:
   calc(var(--motion-delay, 0ms) + 8 * 60ms); }` (e a mesma regra dentro do
   bloco `prefers-reduced-motion`).

**Impacto técnico**
- Arquivo: `app/globals.css`
- Afeta: hero da home, listas do painel, grade de fotos.

**Critério de aceite**
O nono item e os seguintes de uma lista escalonada entram todos no mesmo instante
(`8 × 60ms = 480ms` de atraso), e o intervalo entre irmãos é de 60ms.

**Prioridade:** Baixa

---

#### [ARQ-05] — Fonte de assinatura no root é Petit Formal Script, não Pinyon Script

**Localização**
- Arquivo: `app/layout.tsx:11-15`

**Situação atual**
```ts
const script = Petit_Formal_Script({ variable: "--font-script", ... });
```
`--font-serif` no root é `Italiana`.

**Situação esperada no protótipo**
Fundação A2 declara quatro papéis: Display **Instrument Serif**, Corpo **IBM
Plex Sans**, Dado **IBM Plex Mono**, Assinatura **Pinyon Script**. Toda prancha
do pacote carrega `family=Pinyon+Script` no `<helmet>`.

**Divergência identificada**
A plataforma tem os três primeiros corretos em `lib/fonts/ui.ts`, mas a
Assinatura é outra fonte, e ela é usada fora dos moldes: `app/page.tsx:264`
(`font-script` no selo "FEITO À mão" do hero) e `app/page.tsx:377` (iniciais
"I & N"). A Fundação diz que Assinatura vale *"só na vitrine e nos modelos de
site — nunca no painel"*, então o uso na vitrine é legítimo; a **fonte** é que
está errada.

**Alteração necessária**
Não mexer no `--font-script` do root (`app/layout.tsx`) — 33 arquivos e
`/rsvp/<slug>` dependem dele (**RISCO ALTO**). Em vez disso, acrescentar em
`lib/fonts/ui.ts` uma quarta constante:
```ts
const assinatura = Pinyon_Script({ variable: "--f-ui-script", subsets: ["latin"], weight: "400", display: "swap" });
```
incluí-la em `uiPrensa`, declarar `.ui-prensa .t-assinatura { font-family:
var(--f-ui-script), cursive; }` em `globals.css`, e trocar `font-script` por
`t-assinatura` em `app/page.tsx:264` e `:377`.

**Impacto técnico**
- Arquivos: `lib/fonts/ui.ts`, `app/globals.css`, `app/page.tsx`
- Custo: uma família a mais no bundle das telas da plataforma. O comentário de
  `lib/fonts/ui.ts` mede 34 fontes = 83,6 KB; uma família a mais é ~2,5 KB.
- **Não tocar** em `app/layout.tsx` nem em `lib/templates/*/fonts.ts`.

**Critério de aceite**
O selo "FEITO À mão" do hero da home renderiza em Pinyon Script; `/rsvp/<slug>`
continua renderizando exatamente como hoje.

**Prioridade:** Média

---

#### [ARQ-06] — `<title>` global do site é "Isabelle & Nycolas | Save the Date"

**Localização**
- Arquivo: `app/layout.tsx:18-21`

**Situação atual**
```ts
export const metadata: Metadata = {
  title: "Isabelle & Nycolas | Save the Date",
  description: "Confirme sua presença no nosso casamento",
};
```

**Situação esperada no protótipo**
O produto é a **Enlace**, plataforma multi-tenant. O metadata raiz é o
_fallback_ de toda rota que não declara o próprio — inclusive `/diagnostico`,
`/conta/pedido`, `/pacotes` e qualquer 404 de rota nova.

**Divergência identificada**
Resquício do site único anterior à multi-tenancy. Qualquer rota sem `metadata`
próprio anuncia o casamento de um casal específico na aba do navegador e no
cartão de link.

**Alteração necessária**
Trocar por:
```ts
export const metadata: Metadata = {
  title: { default: `${SITE_NAME} · ${SITE_TAGLINE}`, template: `%s | ${SITE_NAME}` },
  description: "Convite digital, confirmação de presença e lista de presentes com Pix sem taxa.",
};
```
importando `SITE_NAME` e `SITE_TAGLINE` de `lib/site.ts`. O `template` faz as
páginas que já declaram `title: "Fotos | Enlace"` poderem passar a declarar só
`title: "Fotos"` — mas isso é limpeza opcional, não requisito.

**Impacto técnico**
- Arquivo: `app/layout.tsx`
- Conferir depois: `app/isabelle-e-nycolas/page.tsx` e `app/presentes/page.tsx`
  devem passar a declarar o próprio `metadata` com o nome do casal, senão perdem
  o título correto (ver **EXTRA-02**).

**Critério de aceite**
Abrir `/` e `/diagnostico`: a aba mostra "Enlace · Sites de casamento" (ou o
título próprio da rota), nunca "Isabelle & Nycolas".

**Prioridade:** Média

---

#### [ARQ-07] — Nenhum token de raio de canto; cada tela escreve `rounded-[3px]` à mão

**Localização**
- Arquivo: `app/globals.css` (seção `.ui-prensa`); usado em ~40 arquivos

**Situação atual**
`.surface-raised`, `.surface-flat` e `.surface-sunken` **não declaram**
`border-radius`. As telas escrevem `rounded-[3px]` ao lado da classe de
superfície. Em `app/page.tsx` convivem `rounded-[3px]`, `rounded-[2px]` e
`rounded-full`; em `components/account/LivePreview.tsx` há `rounded-xl` (12px).

**Situação esperada no protótipo**
Fundação A1: *"Raio 2–3px. Três níveis, só três."* Os botões usam 2px e as
superfícies 2–3px, em todas as pranchas.

**Divergência identificada**
O raio é decisão de sistema mas está distribuído em 40 arquivos, e já divergiu:
`rounded-xl` (12px) em `LivePreview` está fora da faixa 2–3px.

**Alteração necessária**
1. Declarar `border-radius: 3px` nas três classes `.surface-*` em
   `app/globals.css`.
2. Remover `rounded-[3px]` dos usos que já vêm acompanhados de `surface-*`.
3. Trocar `rounded-xl` de `components/account/LivePreview.tsx` por `rounded-[3px]`.

**Impacto técnico**
- Arquivos: `app/globals.css`, `components/account/LivePreview.tsx`, e os ~40
  arquivos com `surface-* rounded-[3px]` (remoção mecânica, sem efeito visual).
- Sem impacto em `lib/templates/*` — as classes da Prensa não alcançam os moldes.

**Critério de aceite**
Nenhum arquivo em `app/` ou `components/` (fora de `lib/templates/`) usa raio
maior que 3px, e as superfícies têm raio mesmo sem classe utilitária ao lado.

**Prioridade:** Baixa

---

#### [ARQ-08] — Fundo global do `body` continua no creme antigo fora do escopo `.ui-prensa`

**Localização**
- Arquivo: `app/globals.css:48-51` e `:473-475`

**Situação atual**
```css
body { background: var(--color-paper); /* #f2efe7 */ }
body:has(.ui-prensa) { background-color: #efefec; }
```

**Situação esperada no protótipo**
Fundação A1 separa `--paper` (`#efefec`, "fundo do painel") de `--paper-warm`
(`#f2efe7`, "fundo da vitrine"). Toda tela da plataforma é uma das duas.

**Divergência identificada**
Rotas que não montam `.ui-prensa` — `/pacotes/estilos/*`, `/presentes`,
`/isabelle-e-nycolas`, `/rsvp/<slug>`, `/diagnostico`, `/conta/pedido` — ficam
com o creme e fora do sistema de cor. Para `/rsvp` e o site legado isso é
**correto e proposital** (ver o comentário em `globals.css:462-467`). Para
`/diagnostico` e `/pacotes/estilos/*` é resquício.

**Alteração necessária**
Não mexer na regra global (**RISCO ALTO** para `/rsvp`). Em vez disso, aplicar
`uiPrensa` no contêiner raiz de `/diagnostico`; para `/pacotes/estilos/*` ver
**B-05**, que trata a moldura dessas páginas.

**Impacto técnico**
- Arquivos: `app/diagnostico/page.tsx`
- **Não tocar** em `app/globals.css:48-51`.

**Critério de aceite**
`/rsvp/<slug>` e `/isabelle-e-nycolas` renderizam exatamente como hoje;
`/diagnostico` usa o fundo `#efefec`.

**Prioridade:** Baixa

---

### 3.2 · Navegação e mapa de rotas

---

#### [NAV-01] — `/pacotes` é `redirect("/")`; o protótipo B2 é uma página inteira

**Localização**
- Página: `/pacotes`
- Arquivo: `app/pacotes/page.tsx` (7 linhas)

**Situação atual**
```ts
export default function PacotesRedirect() { redirect("/"); }
```
O conteúdo de B2 vive como **seção** da home (`components/landing/Pacotes.tsx`,
âncora `#pacotes`).

**Situação esperada no protótipo**
B2 é `GET /pacotes` com barra de navegação própria (item "Pacotes" sublinhado),
cabeçalho centralizado ("PAGAMENTO ÚNICO · SEM MENSALIDADE" em `--mark` +
"Escolha uma vez." em 52px), três cards de 34px de padding com lista de
features `✓`/`–`, e a seção "Dúvidas comuns" com três perguntas em acordeão.

**Divergência identificada**
A rota existe mas não entrega tela. Quem chega por link direto ou por busca cai
na home inteira e precisa rolar. A navegação da home aponta para `#pacotes`
(âncora), então o item "Pacotes" nunca marca estado ativo.

**Alteração necessária**
Decidir entre duas saídas e implementar UMA:
- **(a) Restaurar a página** — criar `app/pacotes/page.tsx` como página real,
  reusando `<Pacotes />` mais o cabeçalho e o acordeão de dúvidas; manter a
  seção na home e apontar o item de menu para `/pacotes`.
- **(b) Manter o redirect** — então remover o item "Pacotes" da navegação como
  link separado e registrar no `AGENTS.md` que B2 vive na home.

**Recomendação:** (a). O `README.md` §2 lista `/pacotes` como rota da faixa B, e
uma landing de 700 linhas com o preço no meio é pior de compartilhar que uma URL
de preço.

**Impacto técnico**
- Arquivos: `app/pacotes/page.tsx`, `app/page.tsx` (item de menu),
  `components/landing/Pacotes.tsx` (extrair cabeçalho para prop)
- Cache: rota nova precisa respeitar `cacheComponents` — ver Skill `cache-e-build`.

**Critério de aceite**
`GET /pacotes` devolve 200 com os três cards, o cabeçalho e o acordeão, e o item
"Pacotes" da barra fica sublinhado nessa rota.

**Prioridade:** Alta

---

#### [NAV-02] — `/pacotes/exemplo/:pacote` é `redirect("/")`; B3 é uma demo navegável

**Localização**
- Página: `/pacotes/exemplo/:pacote`
- Arquivo: `app/pacotes/exemplo/[pacote]/page.tsx` (8 linhas)

**Situação atual**
Redirect para `/`. O comentário explica que as demos foram substituídas por
`/pacotes/estilos/[estilo]?pacote=X`.

**Situação esperada no protótipo**
B3 é uma demo com **fita preta no topo**: círculo de registro em `--mark` +
`"EXEMPLO · pacote Para Sempre — este site é só uma amostra"` em mono 12px, e à
direita o botão branco "Criar o meu igual →". Abaixo, o site de exemplo
(hero em Pinyon 92px, barra de 4 âncoras, história em duas colunas, contagem em
oliva).

**Divergência identificada**
A rota da prancha não entrega tela, e a rota substituta (`/pacotes/estilos/*`)
**não tem a fita de exemplo** — o visitante abre um site de casamento fictício
sem nada dizendo que é amostra.

**Alteração necessária**
1. Fazer `/pacotes/exemplo/:pacote` redirecionar para
   `/pacotes/estilos/editorial?pacote=<pacote>` (redirect útil, não para a home).
2. Acrescentar a fita de exemplo em `components/templates/TemplateChrome.tsx`
   (ver **B-06**), lendo o pacote de `usePackageTier`.

**Impacto técnico**
- Arquivos: `app/pacotes/exemplo/[pacote]/page.tsx`,
  `components/templates/TemplateChrome.tsx`
- Validar: `pacote` inválido na URL não pode gerar 500.

**Critério de aceite**
`/pacotes/exemplo/para-sempre` abre um estilo com a fita "EXEMPLO · pacote Para
Sempre" no topo e o botão "Criar o meu igual →".

**Prioridade:** Média

---

#### [NAV-03] — Não existe índice `/pacotes/estilos` (a galeria de seis estilos)

**Localização**
- Página: `/pacotes/estilos` (ausente)
- Arquivos existentes: `app/pacotes/estilos/{6 estilos}/page.tsx`

**Situação atual**
As seis rotas de estilo existem, cada uma com uma demo completa. Não há índice:
`/pacotes/estilos` devolve 404. A galeria vive como seção `#estilos` da home.

**Situação esperada no protótipo**
B4–B9 mostram uma **galeria** — cabeçalho "SEIS ESTILOS / O mesmo amor, seis
vestidos." e grade 3×2 de cards de 200px de altura, cada um com o hero do
estilo renderizado na fonte e na cor do estilo, rodapé com nome + descrição de
três palavras + "Ver →". O Editorial recebe a tarja "A CASA" em `--mark`. Ao
lado, o painel de **detalhe** (760px) com Títulos/Texto/Paleta e o botão "Usar
este estilo".

**Divergência identificada**
Falta o índice e falta o painel de detalhe. A grade da home tem os cards mas
não tem: a altura de 200px do desenho, o rodapé com descrição de três palavras,
nem o painel de detalhe.

**Alteração necessária**
1. Criar `app/pacotes/estilos/page.tsx` com a galeria (reusando `TEMPLATE_STYLES`
   de `lib/templates`).
2. Acrescentar em cada rota de estilo o painel de detalhe do desenho (Títulos /
   Texto / Paleta + "Usar este estilo" → `/conta/criar`), ou colocá-lo no índice
   como painel lateral.

**Impacto técnico**
- Arquivos novos: `app/pacotes/estilos/page.tsx`
- Reuso: `lib/templates/index.ts` (`TEMPLATE_STYLES` já tem `name`,
  `description`, `swatches`)
- Precisa de `generateStaticParams`? Não — rota estática.

**Critério de aceite**
`GET /pacotes/estilos` devolve 200 com seis cards; o Editorial traz a tarja "A
CASA"; cada card leva à rota do estilo.

**Prioridade:** Média

---

#### [NAV-04] — Aba "Compartilhar" do painel não existe

**Localização**
- Página: `/conta/pedidos/:id/*`
- Componente: `CascaDoPainel` / lista `abas`
- Arquivo: `app/conta/pedidos/[id]/layout.tsx:78-118`

**Situação atual**
Sete abas: Início, Páginas, Conteúdo, Visual, Fotos, Convites, Presentes (+
Recados quando o pacote libera). Não há Compartilhar.

**Situação esperada no protótipo**
`Enlace - Compartilhamento.dc.html` S4 desenha
`GET /conta/pedidos/:id/compartilhar` com a aba "Compartilhar" ativa na barra, e
o conteúdo em duas colunas (ver **S-04**).

**Divergência identificada**
Rota e aba ausentes. Hoje o casal copia o link por um botão dentro do card
"Endereço do site" no Início, e não há QR, nem mensagens prontas, nem prévia do
cartão do WhatsApp.

**Alteração necessária**
Acrescentar a aba em `layout.tsx` e criar
`app/conta/pedidos/[id]/compartilhar/page.tsx` — ver **S-04** para o conteúdo.

**Impacto técnico**
- Arquivos: `app/conta/pedidos/[id]/layout.tsx`, rota nova
- Dependência: **S-01** (OG) e **S-03** (QR) precisam existir para a tela ter o
  que mostrar.

**Critério de aceite**
A barra do painel mostra oito abas e `/conta/pedidos/<id>/compartilhar` abre.

**Prioridade:** Alta

---

#### [NAV-05] — `/conta/avisos` (preferências de notificação) não existe

**Localização**
- Página: `/conta/avisos` (ausente)

**Situação atual**
`components/account/manage/Avisos.tsx:203` — o sino não tem o rodapé "Ajustar o
que quero receber" e a rota não existe.

**Situação esperada no protótipo**
J2 desenha `enlace.site/conta/avisos` com cabeçalho "AVISOS / O que vocês querem
saber", uma tabela de 5 linhas × 3 colunas (Evento / No sino / Por e-mail) com
interruptores, e a faixa final: *"Avisos de presente e de prazo não podem ser
desligados no sino — envolvem dinheiro e data."*

**Divergência identificada**
Rota inteira ausente. Ver **J-02** para o detalhamento.

**Alteração necessária**
Ver **J-02**.

**Prioridade:** Média

---

#### [NAV-06] — Rota do editor visual é `/conta/convites/:id`; o handoff especifica `/conta/convites/:id/editor`, e E8 não existe

**Localização**
- Página: `/conta/convites/:conviteId`
- Arquivo: `app/conta/convites/[conviteId]/page.tsx`

**Situação atual**
`/conta/convites/:conviteId` **é** o editor visual em tela cheia (tema escuro).
Não existe `/conta/convites/:conviteId/editor`.

**Situação esperada no protótipo**
Duas telas distintas:
- **E8** `GET /conta/convites/:conviteId` → formulário clássico: nome interno do
  convite, endereço do link, prazo de resposta, mensagem do topo, **lista de
  convidados** (nome + lugares + estado da resposta + remover) e prévia do
  convite à direita.
- **E9** `GET /conta/convites/:conviteId/editor` → o editor visual.

**Divergência identificada**
O produto tem só E9, na URL de E8. Toda a gestão de **convidados por convite**
(que é o conteúdo de E8) não existe nessa tela: hoje os convidados vivem em
`/admin` (grupos do site legado), não no painel do casal.

**Alteração necessária**
1. Mover o editor visual para `/conta/convites/[conviteId]/editor/page.tsx`.
2. Criar `/conta/convites/[conviteId]/page.tsx` como E8 (formulário clássico +
   lista de convidados + prévia), com link para o editor visual.
3. Ajustar as origens do link: `app/conta/pedidos/[id]/convites/page.tsx:57`
   aponta para `/conta/convites/${c.id}`.

**Impacto técnico**
- Arquivos: rota movida, rota nova, `app/conta/pedidos/[id]/convites/page.tsx`
- Banco: E8 exige convidados vinculados ao convite. Hoje `groups`/`guests` são
  do site e `site_invites` é a peça desenhada — **são coisas diferentes**.
  Ligar as duas é migração aditiva (Skill `banco`) e precisa de consulta ao
  agente `regras-de-negocio` antes: muda o que o casal faz.
- **Necessita investigação na implementação** para decidir o modelo de dados.

**Critério de aceite**
`/conta/convites/<id>` abre o formulário com a lista de convidados;
`/conta/convites/<id>/editor` abre o editor visual; ambos navegam entre si.

**Prioridade:** Alta

---

#### [NAV-07] — Item "Convidados" na barra do admin; o protótipo diz "Grupos"

**Localização**
- Componente: `AdminNav`
- Arquivo: `components/admin/AdminNav.tsx:29-34`

**Situação atual**
```ts
const ITENS = [
  { href: "/admin/dashboard", rotulo: "Dashboard" },
  { href: "/admin/pedidos", rotulo: "Pedidos" },
  { href: "/admin/presentes", rotulo: "Presentes" },
  { href: "/admin", rotulo: "Convidados" },
];
```

**Situação esperada no protótipo**
G2/G3/G4/G5 mostram, na mesma ordem: **Dashboard · Pedidos · Presentes ·
Grupos**, onde "Grupos" é `/admin` e significa **grupos de acesso da equipe**
(Equipe Enlace / Suporte / Financeiro), com membros e permissões.

**Divergência identificada**
Mesma posição, mesma rota, **significado diferente**: hoje `/admin` gerencia
grupos de **convidados** do site legado. Ver **G2-01**.

**Alteração necessária**
Depende da decisão de **G2-01**. Se G2 for portado, `/admin` passa a ser
"Grupos" e a gestão de convidados legada muda de rota (`/admin/convidados`).

**Impacto técnico**
- Arquivo: `components/admin/AdminNav.tsx` + a decisão de **G2-01**

**Critério de aceite**
O rótulo da barra descreve o que a tela faz.

**Prioridade:** Média

---

#### [NAV-08] — Barra do admin tem link "Sair" em texto; o protótipo não desenha esse controle

**Localização**
- Arquivo: `components/admin/AdminNav.tsx:87-95`

**Situação atual**
Entre a navegação e o círculo de iniciais há um `<button>Sair</button>` de 13px.

**Situação esperada no protótipo**
G2/G3/G4/G5 mostram, à direita: **só o círculo de iniciais** (`EQ`). O logout é
citado no cabeçalho da prancha (`→ POST loginAction · logoutAction`) mas não
tem controle desenhado — o padrão implícito é menu no avatar.

**Divergência identificada**
Um controle a mais no chrome, e ele é destrutivo (encerra sessão) ao lado dos
itens de navegação.

**Alteração necessária**
Transformar o círculo de iniciais num botão que abre um menu com "Sair". Se
isso for custo demais agora, manter o link mas registrar aqui a decisão — não é
um bug grave.

**Impacto técnico**
- Arquivo: `components/admin/AdminNav.tsx`

**Critério de aceite**
A barra do admin tem, à direita, apenas o círculo de iniciais; "Sair" fica a um
clique dele.

**Prioridade:** Baixa

---

### 3.3 · Faixa B · Vitrine (público)

---

#### [B-01] — Home tem seis seções que o protótipo B1 não desenha

**Localização**
- Página: `/`
- Arquivo: `app/page.tsx`

**Situação atual**
A home tem, em ordem: nav, hero, **faixa de garantias** (`:269`), **"Vocês só se
preocupam com o casamento"** (`:290`), estilos, **recursos** (`:437`),
**comparativo "Mas tem site grátis por aí…"** (`:468`), **depoimentos**
(`:526`, hoje oculto porque `TESTIMONIALS` está vazio), Pacotes, "Como
funciona", FAQ, **contato** (`:625`), rodapé.

**Situação esperada no protótipo**
B1 tem cinco blocos: nav → hero → "COMO FUNCIONA" (3 colunas) → "Seis estilos,
um clique" → "Um preço, para sempre" (3 cards) → rodapé oliva.

**Divergência identificada**
Seis seções a mais e uma ordem diferente: no desenho "Como funciona" vem
**logo depois do hero**; no produto ele vem depois de Pacotes, quase no fim.

**Alteração necessária**
Isto é decisão de produto, não de código. **Consultar o agente
`regras-de-negocio` antes de remover qualquer seção** — o comparativo de taxa e
a faixa de garantias são argumento de venda, e "a página é a proposta" é uma
das três promessas do produto. A correção mínima e segura é **reordenar**:
mover a seção "Como funciona" (`app/page.tsx:558-604`) para logo depois do hero,
antes da faixa de garantias.

**Impacto técnico**
- Arquivo: `app/page.tsx` (movimentação de bloco JSX)
- Conferir: `RevealOnScroll` escalona por ordem no DOM; mover a seção muda a
  ordem de entrada, o que é o efeito desejado.

**Critério de aceite**
Ao abrir `/`, a primeira seção depois do hero é "Três passos, nenhum
telefonema."

**Prioridade:** Média

---

#### [B-02] — Números do hero: "0% de taxa" no lugar de "10 min do zero ao ar"

**Localização**
- Página: `/`, hero
- Arquivo: `app/page.tsx:216-222`

**Situação atual**
```
6 estilos prontos | 0% de taxa no presente | R$ 0 de mensalidade
```

**Situação esperada no protótipo**
B1: `6 estilos prontos` · `10 min do zero ao ar` · `R$ 0 mensalidade`.

**Divergência identificada**
O segundo número foi trocado. Os outros dois batem (o rótulo do terceiro é "de
mensalidade" contra "mensalidade" — irrelevante).

**Alteração necessária**
**Consultar o agente `regras-de-negocio` antes de trocar.** "10 min do zero ao
ar" é promessa de prazo, e a Skill `texto-do-casal` proíbe promessa de espera; o
produto atual promete "o site é criado no mesmo instante" (FAQ da home). Se a
regra confirmar, manter o número atual e **registrar a divergência como
decisão** neste arquivo; se não, trocar o texto em `app/page.tsx:219`.

**Impacto técnico**
- Arquivo: `app/page.tsx`

**Critério de aceite**
Ou o hero mostra os três números do desenho, ou existe uma linha em
`docs/regras-de-negocio.md` explicando por que não.

**Prioridade:** Baixa

---

#### [B-03] — Botão da barra diz "Começar agora"; o protótipo diz "Criar meu site"

**Localização**
- Página: `/` (e toda tela que monte a barra da vitrine)
- Componente: `AccountNav` / `LoggedOutLinks`
- Arquivo: `components/landing/AccountNav.tsx:44-48`

**Situação atual**
`Entrar` + botão de tinta `Começar agora`.

**Situação esperada no protótipo**
B1 e B2: `Estilos · Pacotes · Dúvidas · Entrar` + botão de tinta **"Criar meu
site"**. A prancha Voz e Microcopy V3 lista "Criar meu site" na coluna "assim
sim".

**Divergência identificada**
O rótulo do CTA principal da vitrine não é o do sistema de voz. "Começar agora"
não diz o que acontece — é exatamente o defeito que V4/BOTÃO descreve ("o botão
descreve a ação, não o conceito").

**Alteração necessária**
Trocar o texto do `<Link href="/conta/criar">` em
`components/landing/AccountNav.tsx:47` para `Criar meu site`. O botão do hero
(`app/page.tsx:207`) já diz isso corretamente — vão ficar iguais, que é o certo.

**Impacto técnico**
- Arquivo: `components/landing/AccountNav.tsx`
- Nenhuma dependência.

**Critério de aceite**
O botão da barra e o do hero têm o mesmo rótulo: "Criar meu site".

**Prioridade:** Média

---

#### [B-04] — Botão do CTA final vai para `/conta` em vez de `/conta/criar`

**Localização**
- Página: `/`, seção "Contato"
- Arquivo: `app/page.tsx:637`

**Situação atual**
```tsx
<a href="/conta" className="...">Criar meu site</a>
```

**Situação esperada no protótipo**
O CTA da vitrine leva quem não tem conta ao cadastro. `/conta` é o hub da conta
e redireciona para `/conta/entrar` quem não está logado — ou seja, o botão
"Criar meu site" leva à tela de **entrar**, não à de **criar**.

**Divergência identificada**
Destino errado para o rótulo. Quem clica em "Criar meu site" cai numa tela que
pede e-mail e senha de uma conta que ele não tem.

**Alteração necessária**
Trocar `href="/conta"` por `href="/conta/criar"` em `app/page.tsx:637`.

**Impacto técnico**
- Arquivo: `app/page.tsx` (uma linha)

**Critério de aceite**
Deslogado, clicar em "Criar meu site" no fim da home abre `/conta/criar`.

**Prioridade:** Alta

---

#### [B-05] — Rotas de estilo não usam o sistema Prensa nem a moldura da vitrine

**Localização**
- Páginas: `/pacotes/estilos/{classico,editorial,toscana,romantico,moderno,film}`
- Arquivos: as seis `page.tsx` + `components/templates/TemplateChrome.tsx`

**Situação atual**
Cada rota é `"use client"`, declara as próprias fontes (`Archivo`,
`Cormorant_Garamond`, `Lora`, `Pinyon_Script`, `IBM_Plex_Mono`) e as próprias
cores em constantes locais (`INK`, `PAPER`, `DEEP`, `GIFTBG`, `GREY`). Não há
`uiPrensa`, nem a barra da vitrine, nem o rodapé oliva.

**Situação esperada no protótipo**
B4–B9 são páginas da **vitrine**: barra da Enlace no topo (com "Estilos"
sublinhado), cabeçalho da galeria, e o hero do estilo dentro de um card com
rodapé de metadados. O site de exemplo em si é conteúdo, mas a moldura é da
plataforma.

**Divergência identificada**
As seis rotas são demos de tela cheia sem nenhuma moldura de plataforma. O
visitante perde a navegação e não tem como voltar aos pacotes sem o botão do
navegador. Além disso, cada rota carrega 2–3 fontes próprias — cinco famílias a
mais no total.

**Alteração necessária**
1. Envolver cada rota em uma casca comum com `uiPrensa` + a barra da vitrine
   (extrair a `<header>` de `app/page.tsx:117-146` para
   `components/landing/BarraDaVitrine.tsx` e reusar).
2. Acrescentar a fita de exemplo (**NAV-02**) em `TemplateChrome`.
3. Manter as fontes locais — elas são do **estilo**, não da plataforma, e a
   prancha exige que cada estilo apareça na própria tipografia.

**Impacto técnico**
- Arquivos: `components/landing/BarraDaVitrine.tsx` (novo), `app/page.tsx`,
  as seis `app/pacotes/estilos/*/page.tsx`, `components/templates/TemplateChrome.tsx`
- Atenção: as seis páginas são client components; a barra usa `AccountNav`, que é
  server. Colocar a barra no **layout** da pasta (`app/pacotes/estilos/layout.tsx`)
  resolve sem transformar a barra em cliente.

**Critério de aceite**
Abrir `/pacotes/estilos/toscana`: a barra da Enlace aparece no topo com
"Estilos" sublinhado, e existe a fita de exemplo.

**Prioridade:** Média

---

#### [B-06] — Demos de estilo não avisam que são exemplo

**Localização**
- Componente: `TemplateChrome`
- Arquivo: `components/templates/TemplateChrome.tsx`

**Situação atual**
A moldura recebe `styleId`, `styleName`, `outerBg`, `cardBg`, `ink` e desenha o
card do site. Não há fita de aviso.

**Situação esperada no protótipo**
B3: fita preta (`#1a1d21`) de altura 12px de padding, com círculo de registro em
`--mark`, texto mono 12px "EXEMPLO · pacote Para Sempre — este site é só uma
amostra", e o botão branco "Criar o meu igual →" à direita. No mobile a fita
encolhe para "EXEMPLO · PARA SEMPRE" + botão "Criar o meu".

**Divergência identificada**
Um visitante pode confundir a demo com um site real de casal — inclusive porque
`GUESTS`, `GIFTS` e `SEED_MESSAGES` são dados fictícios com nomes de gente.

**Alteração necessária**
Acrescentar a fita no topo de `TemplateChrome`, lendo o pacote de
`usePackageTier()` e formatando com `getPackage(tier).name`. Botão leva a
`/conta/criar`.

**Impacto técnico**
- Arquivos: `components/templates/TemplateChrome.tsx`
- Reuso: `lib/packages.ts` (`getPackage`), `components/ui/prensa/Icone.tsx`
- Depende de **B-05** para o `uiPrensa` estar em escopo (a fita usa `.meta` e
  `--c-mark`).

**Critério de aceite**
Toda rota `/pacotes/estilos/*` abre com a fita de exemplo no topo, e o rótulo do
pacote muda ao trocar `?pacote=`.

**Prioridade:** Média

---

#### [B-07] — Cards de estilo na home não têm a altura nem o rodapé do desenho

**Localização**
- Página: `/`, seção `#estilos`
- Arquivo: `app/page.tsx:379-425`

**Situação atual**
Card com uma faixa de `h-28` (112px) pintada com `style.swatches[0]`, o nome do
casal "Ana & Pedro" em 24px, e abaixo: nome do estilo + 3 bolinhas de swatch +
descrição + "Ver este estilo →".

**Situação esperada no protótipo**
B4–B9: faixa de **200px** de altura com o hero completo do estilo — sobrancelha
em mono/tracking, os nomes em 40–46px na fonte do estilo, e (no Clássico) o fio
de 44px. Rodapé em uma linha: nome do estilo em Instrument Serif 19px à esquerda
com a descrição de três palavras em Meta logo abaixo, e "Ver →" à direita.

**Divergência identificada**
Cinco diferenças: altura (112 vs 200), ausência da sobrancelha, nome do casal em
24px vs 40–46px, swatches como bolinhas (não existem no desenho), e o rodapé em
duas linhas em vez do par nome/descrição.

**Alteração necessária**
Refazer o card conforme o desenho: `h-[200px]`, sobrancelha em `.meta` na cor de
acento do estilo, nomes em `style.swatches[1]` na fonte do estilo em 40px, e
rodapé `flex justify-between items-center` com bloco nome+descrição à esquerda e
"Ver →" à direita. Remover as bolinhas de swatch.

**Impacto técnico**
- Arquivo: `app/page.tsx`
- Dados: `TEMPLATE_STYLES` já tem `name`, `description`, `swatches`. Falta a
  **sobrancelha por estilo** ("VAMOS NOS CASAR", "SÃO PAULO · 2026", "TOSCANA ·
  ITÁLIA", "COM AMOR", "… REC · 16MM …") — acrescentar campo em
  `lib/templates/index.ts`.

**Critério de aceite**
Os seis cards têm 200px de altura de hero e o rodapé em uma linha; a descrição
de três palavras aparece em Meta.

**Prioridade:** Média

---

#### [B-08] — Link "Isabelle & Nycolas" exposto na vitrine pública

**Localização**
- Página: `/`, seção `#estilos`
- Arquivo: `app/page.tsx:369-397`

**Situação atual**
Um card destacado, acima da grade de estilos, com as iniciais "I & N" e o texto
*"Não é exemplo: o site real de um casal, no ar agora"*, linkando para
`/isabelle-e-nycolas`.

**Situação esperada no protótipo**
Nada disso existe em B1. A prancha Voz e Microcopy V2 é explícita: no site do
convidado *"a Enlace desaparece"* — e o inverso também vale: a vitrine não expõe
o casamento de um casal como material de venda.

**Divergência identificada**
Elemento fora do protótipo, e que publica o site de clientes reais como prova
social sem que a prancha preveja isso.

**Alteração necessária**
**Consultar o agente `regras-de-negocio`.** Se o casal autorizou, o lugar disso é
a seção de depoimentos (que já existe e está vazia); se não autorizou, o card
sai. Em nenhum caso ele fica onde está, misturado à galeria de estilos.

**Impacto técnico**
- Arquivo: `app/page.tsx`
- Ver também **EXTRA-02** (a rota `/isabelle-e-nycolas`).

**Critério de aceite**
A galeria de estilos tem só os seis estilos; o site de um casal real só aparece
com autorização registrada, e na seção de depoimentos.

**Prioridade:** Média

---

### 3.4 · Faixa C · Auth / Conta

---

#### [C-01] — `/conta/criar` tem um campo a mais (WhatsApp) e o rótulo de nome é diferente

**Localização**
- Página: `/conta/criar`
- Arquivo: `app/conta/criar/page.tsx:63-90`

**Situação atual**
Quatro campos: `Nomes de vocês` (placeholder "Ana & Pedro"), `E-mail`,
`WhatsApp` (opcional), `Senha` (mín. 8, com ajuda). Sem medidor de força.

**Situação esperada no protótipo**
C2 desenha três campos — `Seu nome` ("Ana Beatriz"), `E-mail`, `Senha` — e
**abaixo da senha um medidor de força em 4 segmentos** (3 verdes, 1 cinza).
Também traz, sob o botão: *"Ao criar, você concorda com os Termos e a
Privacidade."*

**Divergência identificada**
Três diferenças: (a) campo WhatsApp a mais; (b) rótulo "Nomes de vocês" com
placeholder do casal, em vez de "Seu nome" individual; (c) medidor de força de
senha e linha de Termos ausentes.

**Alteração necessária**
- (a) **Manter o WhatsApp** — o texto de ajuda ("é por onde a gente avisa se
  algo travar") é regra de produto e o campo é opcional. Registrar como desvio
  consciente.
- (b) **Manter "Nomes de vocês"** — o produto é para casal, e a prancha usa nome
  individual por herança do formulário genérico. Registrar como desvio.
- (c) **Implementar**: acrescentar o medidor de 4 segmentos abaixo da senha e a
  linha de Termos. O medidor é visual puro (comprimento + classes de caractere),
  sem dependência.

**Impacto técnico**
- Arquivos: `app/conta/criar/page.tsx`, `components/ui/prensa/Campo.tsx`
  (acrescentar prop `medidor?: React.ReactNode` abaixo do campo)
- A linha de Termos precisa de páginas de Termos e Privacidade — **se não
  existirem, não linkar para o nada**. Verificar antes; **necessita investigação
  na implementação**.

**Critério de aceite**
`/conta/criar` mostra o medidor de força em 4 segmentos que reage à digitação, e
a linha de Termos sob o botão.

**Prioridade:** Média

---

#### [C-02] — `/conta` (C5) não tem a linha "Sessão iniciada em… " nem o card de site ativo do desenho

**Localização**
- Página: `/conta`
- Arquivo: `app/conta/page.tsx`

**Situação atual**
`AccountShell` + cabeçalho + atalhos em linhas com fio (`Atalho`), sem o card
oliva de site ativo e sem o rodapé de sessão.

**Situação esperada no protótipo**
C5 tem duas colunas: à esquerda o card "Dados da conta" (Nome / E-mail / Senha
com "Alterar senha"), à direita o card **oliva** com "SITE ATIVO", nomes do
casal em 26px, endereço em mono, fio, "Plano · Para Sempre" e o botão claro
"Gerenciar site →". Abaixo, separado por fio: `SESSÃO INICIADA EM 12 AGO 2026 ·
SÃO PAULO` à esquerda e o botão de perigo "Sair da conta" à direita.

**Divergência identificada**
Falta o card oliva de site ativo, falta o card de dados da conta em formato de
lista rotulada, e falta o rodapé de sessão + "Sair da conta" em botão de perigo.

**Alteração necessária**
Refazer `/conta` em duas colunas conforme C5:
1. Coluna esquerda: card `surface-raised` com cabeçalho "DADOS DA CONTA" +
   "Editar", e três linhas com fio (Nome, E-mail, Senha→"Alterar senha").
2. Coluna direita: card `bg-(--c-olive)` com o site mais recente
   (`orders[0]`) — nomes, endereço, plano, botão "Gerenciar site →".
3. Rodapé: `border-t` + Meta da sessão + `Botao variante="perigo"` com
   `signoutAction`.
4. A linha de sessão exige `createdAt` da sessão e cidade — **a cidade não
   existe no produto e não deve ser inventada**; mostrar só a data.

**Impacto técnico**
- Arquivos: `app/conta/page.tsx`
- Dados: `listOrdersByUserId` já é chamado; `getPackage(order.packageTier).name`
  dá o plano; falta a data de início da sessão — **necessita investigação na
  implementação** (`lib/auth/userSession.ts`).

**Critério de aceite**
`/conta` mostra as duas colunas, o card oliva com o site ativo e o botão de
perigo "Sair da conta" no rodapé.

**Prioridade:** Média

---

#### [C-03] — Botão "Enviar link" de `/conta/esqueci` está alinhado à esquerda sem largura cheia; o desenho usa a mesma medida

**Localização**
- Página: `/conta/esqueci`
- Arquivo: `app/conta/esqueci/page.tsx:64`

**Situação atual**
`<Botao type="submit" className="self-start">` — botão do tamanho do texto,
encostado à esquerda.

**Situação esperada no protótipo**
C3 desenha `padding:13px 28px; align-self:flex-start` — ou seja, **o desenho
também alinha à esquerda**, mas com o tamanho G (15px/14px de padding
vertical), não o M.

**Divergência identificada**
Só o tamanho: M contra G.

**Alteração necessária**
Acrescentar `tamanho="g"` em `app/conta/esqueci/page.tsx:64`.

**Impacto técnico**
- Arquivo: `app/conta/esqueci/page.tsx`

**Critério de aceite**
O botão "Enviar link" tem 15px de fonte e 14×26 de padding.

**Prioridade:** Baixa

---

### 3.5 · Faixa D · Questionário (pedido)

---

#### [D-01] — Lista de pedidos é uma tabela; o protótipo D1 usa cards com miniatura

**Localização**
- Página: `/conta/pedidos`
- Arquivo: `app/conta/pedidos/page.tsx:64-140`

**Situação atual**
Cabeçalho de colunas (`O site · Pacote · Registro · Faltam`) e linhas em grade de
12 colunas. Cada linha traz: nomes + etiqueta, nome do pacote, `#ABCD1234` em
mono, contagem de dias, botões.

**Situação esperada no protótipo**
D1 desenha **cards em linha** de 20×24 de padding, cada um com:
1. **Miniatura de 88×64** do site (foto de capa), com fio;
2. nomes do casal em Instrument Serif 24px + etiqueta de status ao lado;
3. linha Meta: `enlace.site/ana-e-joao · Para Sempre · 19 Set 2026`;
4. bloco à direita: contagem em display 30px + "dias" em Meta;
5. botão `Gerenciar` (contorno) — e, quando o pedido está em prévia, também
   `Pagar e publicar` (tinta) **antes** dele;
6. o rascunho é um card de **borda tracejada**, com uma caixa `88×64` tracejada
   mostrando `45%` em mono no lugar da foto, a linha
   *"questionário na etapa 5 de 11 · salvo há 2 dias"*, e o botão
   `Continuar questionário →`.

**Divergência identificada**
Seis elementos do desenho não existem: miniatura, endereço do site na linha
Meta, botão "Pagar e publicar" na própria lista, percentual de progresso do
rascunho, etapa em que o rascunho parou, e "salvo há X". O `#ABCD1234` (coluna
"Registro") não existe no desenho.

**Alteração necessária**
Refazer a lista como cards conforme D1:
1. Miniatura: usar a foto de slot `cover` via `/f/<id>`; sem foto, cair no cartão
   tipográfico cinza descrito em I3 (ver **I-02**), nunca num retângulo quebrado.
2. Linha Meta: `endereço · pacote · data por extenso curta` (`dataPorExtenso` de
   `lib/site/dataLegivel.ts` já existe).
3. Acrescentar `Pagar e publicar` quando `status === "preview_ready"` e o
   pagamento não estiver confirmado.
4. Rascunho: calcular o percentual a partir de `lib/wizard/etapas.ts`
   (`etapaAtual / ETAPAS.length`) e mostrar "etapa X de 11"; "salvo há X" a
   partir de `order.updatedAt`.
5. Remover a coluna "Registro".

**Impacto técnico**
- Arquivos: `app/conta/pedidos/page.tsx`
- Dados: precisa da foto de capa por pedido — hoje a página não busca fotos.
  Acrescentar uma consulta em lote (`listSitePhotosFresh` por site, ou uma
  consulta nova que devolva só o `cover` de cada site do usuário) para não fazer
  N+1.
- Precisa do passo salvo do rascunho — verificar se `orders` guarda isso;
  **necessita investigação na implementação** (`lib/db/schema.ts`, tabela
  `orders`).
- Componentes: `EtiquetaDoPedido`, `ContagemDaLinha` continuam servindo.

**Critério de aceite**
Com um pedido publicado, um em prévia e um rascunho, a lista mostra três cards
distintos, com miniatura, endereço e — no de prévia — o botão "Pagar e
publicar".

**Prioridade:** Alta

---

#### [D-02] — Cabeçalho de `/conta/pedidos` diverge do desenho em três pontos

**Localização**
- Página: `/conta/pedidos`
- Arquivo: `app/conta/pedidos/page.tsx:28-41`

**Situação atual**
`meta text-(--c-ink-2)` "Pedidos" · `<h1>` "Meus pedidos" em
`text-2xl md:text-[30px]` · botão `btn-ink btn-sm` "Novo pedido".

**Situação esperada no protótipo**
D1: sobrancelha `MEUS PEDIDOS` em **`--mark`**; título "Seus sites" em
Instrument Serif **40/44**; botão **G** (`font-size:15px; padding:14px 22px`)
com o rótulo **"+ Novo site"**.

**Divergência identificada**
Cor da sobrancelha, texto e tamanho do título, e tamanho e rótulo do botão.

**Alteração necessária**
Em `app/conta/pedidos/page.tsx`:
- `meta text-(--c-mark)` e texto "Meus pedidos";
- `<h1 className="t-d1">` com o texto "Seus sites";
- `<Link className="btn btn-ink btn-g">+ Novo site</Link>`.

**Impacto técnico**
- Arquivo: `app/conta/pedidos/page.tsx`
- Atenção à regra A1: `--mark` **uma vez por tela**. Se a sobrancelha virar
  `--mark`, conferir se nenhuma etiqueta ou link da mesma tela já usa a cor.

**Critério de aceite**
O cabeçalho lê "MEUS PEDIDOS / Seus sites" com o botão "+ Novo site" em tamanho G.

**Prioridade:** Média

---

#### [D-03] — `/conta/pedido/novo` não tem a etapa 0 (boas-vindas) do desenho

**Localização**
- Página: `/conta/pedido/novo`
- Arquivo: `app/conta/pedido/novo/page.tsx:46-60`

**Situação atual**
Cabeçalho de três linhas (`Novo site` / `Vamos criar o site de vocês` /
parágrafo) e, logo abaixo, o `OrderWizard` já na etapa 1.

**Situação esperada no protótipo**
D2 · "ETAPA 0 · BOAS-VINDAS": tela de **duas colunas em 480px de altura mínima**
— à esquerda, sobre `#efefec`, a sobrancelha `NOVO SITE · 11 ETAPAS · ~5 MIN` em
`--mark`, o título em 44/46, o parágrafo, o botão G "Começar →" e a linha Meta
"Rascunho salvo automaticamente"; à direita, a foto `aneis.png` sangrando.

**Divergência identificada**
A tela de boas-vindas não existe: o casal cai direto na primeira pergunta. Some
com ela a informação de quantas etapas são e de quanto tempo leva — que é
justamente o que decide se a pessoa começa (o mesmo argumento que a Fundação usa
para a trilha de segmentos).

**Alteração necessária**
Acrescentar um passo 0 no `OrderWizard` (ou, mais simples, renderizar a tela de
boas-vindas em `app/conta/pedido/novo/page.tsx` e só montar o `OrderWizard`
depois de um clique, com estado local). A sobrancelha deve calcular as etapas de
`ETAPAS.length`, nunca escrever "11" à mão.

**Impacto técnico**
- Arquivos: `app/conta/pedido/novo/page.tsx`, `components/account/wizard/OrderWizard.tsx`
- Cuidado: `/conta/pedido/:id` (rascunho retomado) **não** pode passar pela tela
  de boas-vindas — quem volta já começou.
- "~5 MIN" é promessa de tempo: **consultar `regras-de-negocio`** antes de
  escrever.

**Critério de aceite**
`/conta/pedido/novo` abre na tela de boas-vindas com foto à direita; clicar em
"Começar" leva à etapa 1. `/conta/pedido/<id>` abre direto na etapa salva.

**Prioridade:** Média

---

#### [D-04] — Rótulos do rodapé da última etapa divergem do desenho

**Localização**
- Componente: `OrderWizard`
- Arquivos: `components/account/wizard/OrderWizard.tsx:719`, `lib/wizard/etapas.ts:131`

**Situação atual**
Botão final: `Criar nosso site`. Título da etapa 11: `Conferindo antes de mandar`.

**Situação esperada no protótipo**
D3: título **"Confira antes de gerar"**, sobrancelha `REVISÃO`, botão
**"Gerar meu site →"** em tamanho G.

**Divergência identificada**
Dois rótulos e a sobrancelha.

**Alteração necessária**
**Consultar a Skill `texto-do-casal` antes de trocar** — os textos atuais falam
na primeira pessoa do plural ("nosso", "vocês"), que é a voz do produto para o
casal, enquanto o desenho usa "meu". Se a Skill confirmar a voz atual, manter e
registrar; se não, trocar para os rótulos do desenho. O que **não** é opcional é
a sobrancelha `REVISÃO`, que hoje não existe.

**Impacto técnico**
- Arquivos: `lib/wizard/etapas.ts`, `components/account/wizard/OrderWizard.tsx`

**Critério de aceite**
A etapa 11 tem a sobrancelha "REVISÃO" em Meta acima do título.

**Prioridade:** Baixa

---

#### [D-05] — A etapa de revisão não é a lista de quatro linhas com "Editar" do desenho

**Localização**
- Componente: `OrderWizard`, etapa `revisao`
- Arquivo: `components/account/wizard/OrderWizard.tsx`

**Situação atual**
**Necessita investigação na implementação** — o conteúdo da etapa não foi lido
linha a linha nesta auditoria.

**Situação esperada no protótipo**
D3 desenha um card com fio e **quatro linhas**, cada uma `justify-between`:
`CASAL` / `DATA E LOCAL` / `ENDEREÇO` (em mono) / `ESTILO E PACOTE`, com o valor
em 16px abaixo do rótulo Meta e um link "Editar" à direita que volta à etapa
correspondente.

**Alteração necessária**
Conferir a etapa atual contra essa estrutura e, se divergir, refazê-la: quatro
linhas com fio, rótulo Meta, valor 16px, "Editar" navegando para a etapa certa.

**Impacto técnico**
- Arquivo: `components/account/wizard/OrderWizard.tsx`

**Critério de aceite**
A revisão mostra as quatro linhas e cada "Editar" volta à etapa correta.

**Prioridade:** Média

---

### 3.6 · Faixa E · Painel do casal

---

#### [E1-01] — A régua de números mostra "Visitas"; o desenho mostra "Fotos", e o número é mono, não display

**Localização**
- Página: `/conta/pedidos/:id`
- Componente: `ReguaDeNumeros`
- Arquivo: `components/account/manage/ReguaDeNumeros.tsx:28-49` e `:66-68`

**Situação atual**
Três blocos: `Confirmados` / `Presentes` (contagem de cotas escolhidas) /
`Visitas` (30 dias). O número usa `t-data` (IBM Plex Mono) em **28px**.

**Situação esperada no protótipo**
E1: três cards `surface-raised` de 20px de padding, com o número em
**Instrument Serif 44px** e uma nota colorida embaixo:
`CONFIRMADOS 138 / +12 esta semana` (verde) · `PRESENTES R$ 2.1k / de R$ 3.000` ·
`FOTOS 24 / em 3 álbuns`. A Fundação A2 é explícita: *"Número que importa
(dias, R$ arrecadado, confirmados) é display grande, não corpo em negrito."*

**Divergência identificada**
Três diferenças: (a) fonte e tamanho do número (mono 28 vs display 44);
(b) a terceira métrica é Visitas em vez de Fotos; (c) Presentes mostra
contagem de cotas em vez de valor em R$.

**Alteração necessária**
- (a) **Corrigir**: trocar `t-data text-[28px]` por `t-display text-[44px]` em
  `ReguaDeNumeros.tsx:66`.
- (b) **Decidir**: Visitas é dado real (`/api/track`) e Fotos é trivial de
  obter. O desenho pede Fotos; Visitas é informação melhor depois de publicado.
  Recomendação: mostrar **quatro** blocos quando houver visitas (Confirmados,
  Presentes, Fotos, Visitas), e três antes de publicar.
- (c) **Manter contagem** e registrar: o comentário de
  `lib/repositories/siteMetrics.ts` explica que o valor em R$ não existe porque o
  Pix nunca passa pela Enlace. É a regra 2 da precedência — o produto vence.

**Impacto técnico**
- Arquivos: `components/account/manage/ReguaDeNumeros.tsx`,
  `lib/repositories/siteMetrics.ts` (acrescentar contagem de fotos),
  `app/conta/pedidos/[id]/page.tsx` (já busca `countSitePhotos`)

**Critério de aceite**
Os números da régua saem em Instrument Serif 44px, e há um bloco de Fotos.

**Prioridade:** Média

---

#### [E1-02] — "O que falta" tem barra de progresso que o desenho não tem, e não é o checklist de 6 itens

**Localização**
- Página: `/conta/pedidos/:id`
- Componente: `OQueFalta`
- Arquivo: `components/account/manage/OQueFalta.tsx:37-52`

**Situação atual**
Card com título "O que falta", contador "X de Y", **barra de progresso de 3px** e
lista de tarefas com check/círculo, texto riscado quando feito e link em `--mark`
na tarefa pendente. O card some inteiro quando tudo está feito.

**Situação esperada no protótipo**
E1 · "CHECKLIST DO SITE": cabeçalho Meta + `4 de 6 prontos` (texto, não Meta), e
**seis linhas fixas** com círculo de 18px — verde preenchido quando feito,
contorno `--warn` quando é a pendência ativa, contorno `--rule` quando ainda não
chegou a vez. A linha pendente traz o link "Resolver" à direita. **Não há barra
de progresso** e **não há texto riscado**.

**Divergência identificada**
Quatro diferenças: barra de progresso a mais, texto riscado a mais, o círculo do
item pendente não usa `--warn`, e o card some quando completo (o desenho não diz
o que acontece, mas a faixa I diz que a troca para os cartões de métrica é
definitiva — o que sugere que o checklist realmente some; **manter**).

**Alteração necessária**
1. Remover a barra de progresso (`OQueFalta.tsx:40-52`).
2. Remover `line-through` do item feito (`:75`).
3. Acrescentar o estado intermediário: o **primeiro** item não feito recebe
   círculo com `border-color: var(--c-warn)`; os demais, `--c-rule`.
4. Trocar o contador de `meta` para texto de 13px, como no desenho.

**Impacto técnico**
- Arquivo: `components/account/manage/OQueFalta.tsx`
- `lib/site/oQueFalta.ts` já devolve `tarefas` com `feita`, então o estado
  intermediário sai de um `findIndex`.

**Critério de aceite**
O checklist não tem barra de progresso, não risca texto, e o próximo item
pendente tem o círculo em `--warn`.

**Prioridade:** Média

---

#### [E1-03] — O aviso "Falta a chave Pix" não aparece no topo do Início

**Localização**
- Página: `/conta/pedidos/:id`
- Arquivos: `app/conta/pedidos/[id]/page.tsx`, `app/conta/pedidos/[id]/presentes/page.tsx:52-68`

**Situação atual**
O aviso existe, mas **só na aba Presentes**. No Início ele aparece apenas como
item do checklist e como aviso dentro do sino.

**Situação esperada no protótipo**
E1 abre com a faixa de aviso **acima da grade de métricas**: fio de 1px, traço
de 3px em `--warn` à esquerda, ponto, o texto *"Falta a chave Pix — sem ela os
convidados veem a lista de presentes, mas não conseguem presentear."* e o link
"Adicionar agora →" à direita.

**Divergência identificada**
O estado mais grave do painel (site enganando o convidado em silêncio) não é
visível na primeira tela.

**Alteração necessária**
Renderizar `<Aviso tom="warn">` no topo de `app/conta/pedidos/[id]/page.tsx`,
com a mesma condição já usada em `layout.tsx:68` (`presentesSemPix`), e o link
para `.../conteudo`. Reusar o componente `components/ui/prensa/Aviso.tsx`.

**Impacto técnico**
- Arquivos: `app/conta/pedidos/[id]/page.tsx`
- A condição `presentesSemPix` já é calculada no layout; extrair para
  `lib/site/avisos.ts` ou recalcular na página (a página já busca `conteudo`).
- Cuidado com a regra A1: se o aviso usar `--warn` e a sobrancelha usar
  `--c-ink-2`, não há conflito com `--mark`.

**Critério de aceite**
Com lista de presentes ligada e sem chave Pix, o Início abre com a faixa de
aviso acima dos números.

**Prioridade:** Alta

---

#### [E1-04] — Cabeçalho do Início diz "Nosso pedido / O site de vocês"; o desenho não tem esse bloco

**Localização**
- Página: `/conta/pedidos/:id`
- Arquivo: `app/conta/pedidos/[id]/page.tsx:139-158`

**Situação atual**
Um `<header>` com sobrancelha "Nosso pedido", `<h1>` "O site de vocês", um
parágrafo e o `ProofStamp` à direita.

**Situação esperada no protótipo**
E1 **não tem** cabeçalho de página: a barra do site (nomes + etiqueta) já
identifica a tela, e logo abaixo das abas vem o aviso e as métricas.

**Divergência identificada**
Um bloco a mais que repete a informação da barra logo acima (o nome do casal já
está na barra, e "O site de vocês" não acrescenta nada).

**Alteração necessária**
Remover o `<header>` e manter o `ProofStamp` — realocando-o para o lado direito
da primeira faixa de conteúdo, ou dentro da barra do painel, ao lado da etiqueta
de status. O carimbo é a assinatura do produto e **não** pode sair.

**Impacto técnico**
- Arquivos: `app/conta/pedidos/[id]/page.tsx`, possivelmente
  `components/account/manage/CascaDoPainel.tsx`
- A animação `stamp-bater` continua funcionando em qualquer posição.

**Critério de aceite**
O Início do painel começa no aviso/métricas; o carimbo continua visível e ainda
"bate" ao entrar na tela.

**Prioridade:** Baixa

---

#### [E2-01] — Reordenar seções usa setas ↑↓; o desenho usa arrasto com alça

**Localização**
- Página: `/conta/pedidos/:id/paginas`
- Componente: `SiteControls`
- Arquivo: `components/account/SiteControls.tsx:37-71`

**Situação atual**
Dois formulários por linha, com botões `↑` e `↓` chamando `moveSectionAction`.

**Situação esperada no protótipo**
E2 mostra, em cada linha: **alça de arrasto** (ícone de seis pontos, `cursor:
grab`, cor `--rule`), rótulo, e o interruptor à direita. O cabeçalho da lista traz
`arraste para reordenar` em Meta. A linha em movimento ganha
`border: 1.5px solid #b8412c`, `box-shadow: 0 8px 20px`, `transform:
rotate(-.4deg)` e o texto `movendo…` em `--mark`.

**Divergência identificada**
Mecânica diferente (setas vs arrasto) e nenhum dos estados visuais do arrasto.
O texto "arraste para reordenar" já está na tela (`paginas/page.tsx`), o que hoje
é **mentira de interface**: não dá para arrastar.

**Alteração necessária**
Duas saídas:
- **(a) Implementar o arrasto** com `pointer*` (o mesmo padrão já usado e
  documentado em `components/account/convite/EditorDeConvite.tsx`), mantendo as
  setas como caminho acessível por teclado.
- **(b) Corrigir o texto** para "use as setas para reordenar" e acrescentar a
  alça só como afordância visual desabilitada — não recomendado.

**Recomendação:** (a), com as setas preservadas — a prancha A4 pede área de toque
mínima de 44px e navegação por teclado, e arrasto puro não atende.

**Impacto técnico**
- Arquivos: `components/account/SiteControls.tsx`,
  `app/conta/pedidos/[id]/paginas/page.tsx`
- Action: `moveSectionAction` recebe `direcao: "up"|"down"` — o arrasto precisa
  de reordenação por índice. **Ou** a action ganha uma variante que aceita
  posição, **ou** o arrasto é traduzido em N chamadas de `up`/`down`. Preferir a
  primeira; é migração de assinatura de action, não de banco.
- Ícone: `arrastar` já existe em `Icone.tsx` (os seis círculos).

**Critério de aceite**
Arrastar uma seção pela alça reordena a lista, mostra o estado inclinado com
"movendo…", e as setas continuam funcionando por teclado.

**Prioridade:** Média

---

#### [E2-02] — Visibilidade tem dois estados; o desenho tem três (falta "Só com senha")

**Localização**
- Página: `/conta/pedidos/:id/paginas`
- Componente: `SiteControls`
- Arquivo: `components/account/SiteControls.tsx:208-240`; action em
  `app/actions/site-actions.ts:121-149`

**Situação atual**
Publicar / despublicar. O comentário no código já registra a ausência do terceiro
estado e a razão.

**Situação esperada no protótipo**
E2 desenha três opções de rádio em cards com fio: **Público** (*"Qualquer pessoa
com o link vê o site."*), **Só com senha** (*"Convidados digitam uma senha para
entrar."*), **Oculto** (*"Fora do ar. Só você enxerga a prévia."*). H4 desenha a
tela de senha correspondente.

**Divergência identificada**
Falta o estado "Só com senha" e a tela H4 que ele exige.

**Alteração necessária**
Isto é **funcionalidade nova, não ajuste visual**:
1. Migração **aditiva** em `sites`: `access_mode` (`public|password|hidden`) e
   `access_password_hash`. Seguir a Skill `banco` — `backup:full`, `db:generate`,
   `db:rehearse`, `db:migrate`. **Nunca `drizzle-kit push`.**
2. `setSiteVisibilityAction` passa a aceitar os três modos + a senha.
3. Tela H4 "com senha" em `/s/<slug>` — ver **H-03**.
4. Rate limit por IP nas tentativas (a prancha H exige: *"Limitar tentativas por
   IP"*). `lib/rateLimit.ts` já existe.
5. **Consultar `regras-de-negocio` antes**: site com senha pode ser recurso de
   pacote, e isso muda a vitrine.

**Impacto técnico**
- Arquivos: `lib/db/schema.ts`, migração nova, `lib/repositories/sites.ts`,
  `app/actions/site-actions.ts`, `components/account/SiteControls.tsx`,
  `app/s/[slug]/page.tsx`, `lib/rateLimit.ts`
- **Risco de banco**: tabela `sites` é a raiz do tenant. Migração aditiva, backup
  antes, rollback escrito antes.

**Critério de aceite**
As três opções aparecem; escolher "Só com senha" e definir uma senha faz
`/s/<slug>` pedir a senha; errar mostra o erro abaixo do campo sem recarregar.

**Prioridade:** Alta

---

#### [E3-01] — Aba Conteúdo não tem as sobrancelhas de grupo (CAPA / HISTÓRIA / EVENTO)

**Localização**
- Página: `/conta/pedidos/:id/conteudo`
- Componente: `ContentEditor`
- Arquivo: `components/account/ContentEditor.tsx`

**Situação atual**
**Necessita investigação na implementação** para o detalhe campo a campo; o que
dá para afirmar é que a página envolve o `ContentEditor` inteiro num único
`surface-raised` (`conteudo/page.tsx:53`).

**Situação esperada no protótipo**
E3 divide o formulário em **três grupos separados por fio**, cada um com
sobrancelha em `--mark`: `CAPA` (Frase de topo / Nomes / Data e cidade),
`HISTÓRIA` (Título / Texto), `EVENTO` (Cerimônia | Festa em duas colunas). A
barra do site na aba Conteúdo ganha, à direita, `salvo automaticamente` em
`--ok` + o botão de tinta "Salvar alterações".

**Divergência identificada**
Agrupamento e sobrancelhas ausentes; indicador de autosave na barra ausente.

**Alteração necessária**
1. Agrupar os campos do `ContentEditor` em três blocos com `border-t` entre eles
   e sobrancelha `meta text-(--c-mark)` — **atenção à regra A1**: `--mark` uma
   vez por tela. Com três sobrancelhas em `--mark` a regra é violada. Usar
   `--c-ink-2` nas sobrancelhas e reservar `--mark` para uma só.
2. Acrescentar o par "salvo automaticamente" + botão na barra do painel quando a
   aba ativa for Conteúdo.

**Impacto técnico**
- Arquivos: `components/account/ContentEditor.tsx`,
  `app/conta/pedidos/[id]/conteudo/page.tsx`,
  `components/account/manage/CascaDoPainel.tsx` (slot de ação por aba)

**Critério de aceite**
A aba Conteúdo mostra três grupos rotulados, separados por fio, e a barra do
painel mostra o estado de salvamento.

**Prioridade:** Média

---

#### [E4-01] — A grade de estilos da aba Visual é 2×3; o desenho mostra cada estilo na própria tipografia

**Localização**
- Página: `/conta/pedidos/:id/visual`
- Componente: `TemplatePicker`
- Arquivo: `components/account/TemplatePicker.tsx`

**Situação atual**
**Necessita investigação na implementação** para confirmar o desenho de cada
miniatura.

**Situação esperada no protótipo**
E4: grade 2 colunas × 3 linhas, cada miniatura com **70px de altura**, pintada
com o papel do estilo e o nome do estilo escrito **na fonte do estilo**
(`Cormorant Garamond` no Clássico, `Pinyon Script` no Romântico, etc.). O
selecionado tem `border: 1.5px solid #1a1d21` e um disco de check de 14px no
canto superior direito.

**Alteração necessária**
Conferir e, se divergir, aplicar: altura 70px, fundo do estilo, nome na fonte do
estilo, e o disco de check no selecionado.

**Impacto técnico**
- Arquivos: `components/account/TemplatePicker.tsx`
- Fontes: carregar 6 famílias só para as miniaturas é caro. A página já monta
  `fontClassNames` com as fontes **do molde atual**; para as miniaturas dos
  outros estilos, usar fallback genérico (serif/sans/script) em vez de importar
  as seis — e registrar isso como desvio consciente de custo.

**Critério de aceite**
As seis miniaturas têm 70px, o fundo do estilo e o check no selecionado.

**Prioridade:** Baixa

---

#### [E5-01] — A grade de fotos não tem a célula de envio nem o overlay de ações do desenho

**Localização**
- Página: `/conta/pedidos/:id/fotos`
- Componente: `PhotoManager`
- Arquivo: `components/account/PhotoManager.tsx`

**Situação atual**
Fotos agrupadas por slot, com seletor de categoria só no álbum. Envio por slot.

**Situação esperada no protótipo**
E5: **uma grade única de 6 colunas** com `gap:14px`, em que:
- a **primeira célula** é a área de envio: `border: 2px dashed`, `aspect-ratio:1`,
  `+` em mono 24px e "Arraste ou clique" em 11.5px;
- a foto de capa traz a tarja `CAPA` em `#1a1d21` no canto superior esquerdo;
- ao passar o mouse, a foto ganha overlay `rgba(26,29,33,.42)` com a **alça de
  arrasto** (canto inferior esquerdo, branca) e o **botão de apagar** (disco
  branco de 24px com `×` em `--danger`, canto inferior direito);
- acima da grade, chips de filtro: `Todas · 24` (tinta) / `Capa · 1` /
  `História · 6` / `Galeria · 17` (contorno).

**Divergência identificada**
Célula de envio, tarja CAPA, overlay de ações e chips de filtro por categoria:
nenhum existe na forma desenhada.

**Alteração necessária**
Refazer `PhotoManager` para a grade única com chips de filtro, célula de envio
como primeira posição, tarja de capa e overlay no hover. Manter o suporte a
`slot` — os chips são o filtro sobre ele.

**Impacto técnico**
- Arquivos: `components/account/PhotoManager.tsx`
- Actions existentes cobrem tudo: `requestPhotoUploadAction`,
  `confirmPhotoUploadAction`, `setPhotoCategoryAction`, `deletePhotoAction`,
  `movePhotoAction`.
- Ver a Skill `fotos` antes de mexer em upload/EXIF.
- O apagar precisa do diálogo destrutivo (`DialogoDestrutivo` já existe) com o
  texto de V3: *"Apagar esta foto? Ela sai do site na hora."*

**Critério de aceite**
A aba Fotos abre com os chips de filtro, a célula de envio na primeira posição,
a tarja CAPA na foto de capa e o overlay de ações no hover.

**Prioridade:** Alta

---

#### [E5-02] — O estado vazio de Fotos não tem o ícone tracejado de 64px

**Localização**
- Componente: `EstadoVazio`
- Arquivo: `components/ui/prensa/EstadoVazio.tsx:29-46`

**Situação atual**
Caixa tracejada com título em display 24px, parágrafo, ação e restrição. **Sem
ícone.**

**Situação esperada no protótipo**
I2 desenha, acima do título, um quadrado de **64×64 com `border: 2px dashed
#c9c9c2`** contendo o ícone de 26px em `#8b9099` (foto, envelope ou presente,
conforme a aba).

**Divergência identificada**
O ícone tracejado não existe no componente.

**Alteração necessária**
Acrescentar prop `icone?: NomeDoIcone` em `EstadoVazio` e renderizar o quadrado
tracejado de 64px acima do título quando ela vier. Usar nas três abas: `foto`,
`envelope` (ver **IC-01**, o ícone não existe ainda) e `presente`.

**Impacto técnico**
- Arquivos: `components/ui/prensa/EstadoVazio.tsx`,
  `components/ui/prensa/Icone.tsx` (ícone `envelope`),
  e as abas Fotos / Convites / Presentes
- Depende de **IC-01**.

**Critério de aceite**
Os três estados vazios mostram o quadrado tracejado com o ícone certo.

**Prioridade:** Média

---

#### [E6-01] — Aba Presentes não deixa o casal criar, editar ou apagar cotas — e as actions existem sem uso

**Localização**
- Página: `/conta/pedidos/:id/presentes`
- Arquivo: `app/conta/pedidos/[id]/presentes/page.tsx:113-166`
- Actions órfãs: `app/actions/couple-gift-actions.ts:91`, `:106`, `:127`

**Situação atual**
A aba lista as cotas em texto (nome, categoria, valor) e fecha com:
> *"Montar e editar as cotas ainda é feito pela nossa equipe. Mandem a lista de
> vocês **pelo WhatsApp** que a gente cadastra — e em breve isso vem para cá."*

`criarCotaAction`, `editarCotaAction` e `apagarCotaAction` estão implementadas e
**não são importadas por nenhum arquivo** (verificado por grep em `app/`,
`components/` e `lib/`).

**Situação esperada no protótipo**
E6 desenha, em duas colunas:
- **Esquerda**: aviso de chave Pix, título "Cotas de presente", e uma lista de
  cards de 16×20 de padding, cada um com **miniatura 64×64**, nome em 15.5px,
  Meta "12 de 20 compradas", **barra de progresso de 6px**, valor em mono 16px +
  "por cota", e os links `Editar` / `Apagar` (este em `--danger`). Fecha com uma
  linha tracejada "+ Adicionar cota de presente".
- **Direita**: card **oliva** "ARRECADADO / R$ 2.100 / de R$ 3.000 · 17
  presentes" com barra clara; e card branco "CHAVE PIX" com o estado, o campo
  ("e-mail, telefone ou CPF") e o botão "Salvar chave".
- Barra do painel: botão de tinta "+ Nova cota".

**Divergência identificada**
A tela inteira do desenho não existe. E o produto entrega **menos** que o próprio
código já tem: as três actions estão prontas e não têm interface.

Isto contraria duas das três promessas do produto: **"o casal não trabalha"** (ele
tem que montar uma lista e mandar por WhatsApp) e **"o dono não encosta"** (alguém
da equipe cadastra cota por cota, trabalho manual por venda).

**Alteração necessária**
1. Ligar as três actions à interface: formulário de criar cota (nome, categoria,
   valor, foto opcional), edição inline ou em diálogo, e apagar com
   `DialogoDestrutivo`.
2. Montar as duas colunas do desenho, com a barra de progresso por cota e o card
   oliva de arrecadado.
3. Mover o campo de chave Pix para esta aba (hoje ele vive em Conteúdo e a aba
   Presentes só linka para lá) — é onde o desenho o coloca.
4. **Remover o parágrafo do WhatsApp** depois que o CRUD estiver no ar.
5. **Consultar `regras-de-negocio` antes**: cota é regra de produto (o que conta
   como cota, se há limite por pacote, se o valor tem piso).

**Impacto técnico**
- Arquivos: `app/conta/pedidos/[id]/presentes/page.tsx`, componente novo
  (`components/account/manage/Cotas.tsx`), `app/actions/couple-gift-actions.ts`
  (conferir validação e `updateTag`)
- Cache: salvar chave Pix exige `updateTag(sitePixTag(siteId))` — **regra §3 do
  `AGENTS.md`**.
- Fotos de cota: reusar o fluxo de `photo-actions.ts` (Skill `fotos`).
- Pix: **nunca** introduzir chave de fallback (`AGENTS.md` §3); `getSitePix`
  devolve `null` sem chave do casal.

**Critério de aceite**
O casal cria, edita e apaga uma cota sem sair do painel; a lista mostra a barra
de progresso por cota; o card oliva soma o arrecadado; nenhuma tela pede que ele
mande a lista por WhatsApp.

**Prioridade:** Crítica

---

#### [E7-01] — Aba Convites é uma grade de miniaturas; o desenho é uma tabela com métricas

**Localização**
- Página: `/conta/pedidos/:id/convites`
- Arquivo: `app/conta/pedidos/[id]/convites/page.tsx`

**Situação atual**
Três cartões de resumo não existem; a tela mostra o cabeçalho e uma grade
`grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` de miniaturas do convite
(`MiniConvite`) com o nome abaixo, mais uma célula tracejada "Novo convite".

**Situação esperada no protótipo**
E7 mostra:
1. Três cartões de resumo lado a lado: `CONVITES 4` · `CONVIDADOS 186` ·
   `CONFIRMARAM 138` (este em `--ok`), números em display 32px.
2. Uma **tabela** com fio, colunas `CONVITE · LINK · CONVIDADOS · STATUS · (ações)`
   em grade `1.6fr 1fr 1fr 130px 120px`. Cada linha: nome em 15px, slug em mono
   12.5px, `64 · 58 ok`, etiqueta `Publicado` (sólida verde) ou `Rascunho`
   (contorno), e as ações `Abrir` / `×` (em `--danger`) — ou `Publicar` no
   rascunho.
3. Barra do painel: botão de tinta "+ Novo convite".

**Divergência identificada**
Modelo mental diferente: o desenho trata convite como **grupo de convidados com
link**; o produto trata convite como **peça gráfica**. Nenhuma métrica de
convidado aparece, não há coluna de status nem ação de publicar na lista.

**Alteração necessária**
Isto é a mesma decisão de **NAV-06**: se o convite passar a carregar convidados,
E7 vira a tabela do desenho. Enquanto não houver essa ligação:
1. Acrescentar os três cartões de resumo com os dados que **existem hoje**
   (nº de convites, e — quando houver ligação site↔grupos — convidados e
   confirmados).
2. Acrescentar a coluna de status por convite (`publishedAt` já existe em
   `site_invites`) e as ações `Abrir` (link `/c/<slug>`) e `Publicar` /
   `Despublicar` (`publicarConviteAction` / `despublicarConviteAction`, ambas já
   implementadas e hoje só acessíveis de dentro do editor).
3. Mover o botão "+ Novo convite" para a barra do painel.
4. **Consultar `regras-de-negocio`** antes de mudar o modelo de convite.

**Impacto técnico**
- Arquivos: `app/conta/pedidos/[id]/convites/page.tsx`,
  `components/account/manage/CascaDoPainel.tsx` (slot de ação por aba)
- Repositórios: `listInvites` já devolve `publishedAt` e `slug`.
- **Necessita investigação na implementação** para a ligação com `groups`/`guests`.

**Critério de aceite**
A aba Convites mostra os cartões de resumo e uma lista com status e ação de
publicar por convite, sem entrar no editor.

**Prioridade:** Alta

---

#### [E9-01] — Modelo de dados do convite não tem `ButtonEl` (o botão de RSVP)

**Localização**
- Arquivo: `lib/site/inviteDoc.ts:66-133`

**Situação atual**
Quatro tipos de bloco: `texto`, `foto`, `linha`, `forma`. O texto tem um campo
`link` opcional que aceita `http`, `https`, `mailto`, `tel` e caminho relativo.

**Situação esperada no protótipo**
`HANDOFF-editor-convite.md` §2 define cinco tipos, e o quinto é:
```ts
type ButtonEl = Base & { kind:'button'; label:string; bg:string; color:string;
                         radius:number; font:FontToken; size:number };
```
§6 diz: *"Botão: rótulo (fixo — sempre leva ao RSVP `/rsvp/:slug`, não editável
como link)"*. E §7 exige, na validação de publicar: *"existe ≥1 `ButtonEl`
apontando ao RSVP"*.

**Divergência identificada**
Não existe bloco de botão. O casal pode fazer um texto com link, mas:
(a) não tem a aparência de botão do desenho (fundo, cor de texto, raio);
(b) a validação de publicar não pode exigir o que não existe;
(c) o convite pode ser publicado **sem nenhum caminho para o RSVP**, que é o
propósito do convite.

**Alteração necessária**
1. Acrescentar `BlocoBotao` em `lib/site/inviteDoc.ts`, com `rotulo`, `fundo`,
   `cor`, `raio`, `fonte`, `tamanho`, e destino **fixo** em `/rsvp/<slug>`.
2. Parser (`parseBloco`) e render (`BlocoVisual`) tratando o novo tipo, em modo
   editor (div) e em modo público (`<a>`, ver §8 do handoff).
3. Botão "Adicionar botão de confirmação" no painel de ferramentas.
4. Validação em `publicarConviteAction` — ver **E9-06**.

**Impacto técnico**
- Arquivos: `lib/site/inviteDoc.ts`, `components/account/convite/BlocoVisual.tsx`,
  `components/account/convite/EditorDeConvite.tsx`,
  `components/site/ConviteVisual.tsx`, `app/actions/invite-actions.ts`
- Banco: nenhuma migração — a coluna é `jsonb` e o parser descarta o que não
  conhece. Convites antigos continuam válidos.
- Exportação: o PNG/PDF precisa desenhar o novo bloco — conferir o gerador.

**Critério de aceite**
Dá para inserir um botão "Confirmar presença" no convite; no `/c/<slug>` ele é um
`<a href="/rsvp/...">` real e clicável.

**Prioridade:** Crítica

---

#### [E9-02] — Fontes do editor são três genéricas; o handoff especifica cinco tokens nomeados

**Localização**
- Arquivos: `components/account/convite/controles.tsx:12-16`, `lib/site/inviteDoc.ts:79`

**Situação atual**
```ts
export const FONTES = [
  { id: "serif", rotulo: "Serifada" },
  { id: "sans", rotulo: "Sem serifa" },
  { id: "script", rotulo: "Manuscrita" },
] as const;
```

**Situação esperada no protótipo**
```ts
type FontToken = 'Instrument Serif'|'IBM Plex Sans'|'IBM Plex Mono'|'Pinyon Script'|'Cormorant Garamond';
```
E: *"Fontes permitidas = só os 5 tokens acima (o seletor de fonte lista
exatamente esses)."* A barra flutuante do desenho E9 mostra o nome da fonte por
extenso ("Instrument Serif") num dropdown.

**Divergência identificada**
Faltam duas fontes (mono e Cormorant Garamond) e o seletor mostra categoria em
vez do nome da fonte — o casal não sabe qual fonte está escolhendo.

**Alteração necessária**
Trocar `FONTES` pelos cinco tokens nomeados; mapear cada um para a família CSS
correspondente em `BlocoVisual`; carregar as cinco famílias na rota do editor e
na rota pública `/c/<slug>`.

**Impacto técnico**
- Arquivos: `components/account/convite/controles.tsx`, `lib/site/inviteDoc.ts`
  (o `umDe` valida o conjunto), `components/account/convite/BlocoVisual.tsx`,
  `app/conta/convites/[conviteId]/page.tsx`, `app/c/[slug]/page.tsx`
- **Compatibilidade**: convites gravados hoje têm `fonte: "serif"|"sans"|"script"`.
  O parser precisa **mapear os valores antigos** para os novos (serif→Instrument
  Serif, sans→IBM Plex Sans, script→Pinyon Script) e não descartá-los, senão
  convites existentes trocam de fonte sozinhos.
- Custo: 5 famílias em duas rotas. Aceitável — as duas são de tela cheia.

**Critério de aceite**
O seletor lista as cinco fontes pelo nome; um convite salvo antes da mudança abre
com a mesma aparência de antes.

**Prioridade:** Alta

---

#### [E9-03] — Não há snap nem guias magenta ao mover

**Localização**
- Componente: `EditorDeConvite` / `BlocoNaTela`
- Arquivos: `components/account/convite/EditorDeConvite.tsx`,
  `components/account/convite/BlocoNaTela.tsx`

**Situação atual**
Grep por `snap`, `guia`, `encaix`, `tolerancia`, `alinhar` na pasta
`components/account/convite/` não encontra implementação. O bloco segue o
ponteiro livremente, com `prenderNaTela` só impedindo que ele suma.

**Situação esperada no protótipo**
`HANDOFF-editor-convite.md` §5: *"**Snap** a: centro-H/centro-V do artboard,
bordas, e às guias de outros elementos (tolerância 6px em coords de tela).
Mostrar **guias magenta `--mark`** enquanto encaixa."* E o critério de aceite §9.1
lista o snap como obrigatório. O catálogo de movimento #10 diz: *"guias de snap
aparecem/somem em `--fast`; sem transição durante o arrasto"*.

**Divergência identificada**
Nem o encaixe nem as guias existem. Centralizar um título é feito no olho.

**Alteração necessária**
1. Durante o arrasto, calcular candidatos de alinhamento: centro-H e centro-V do
   convite, as quatro bordas, e as arestas/centros dos outros blocos.
2. Se a distância em **coordenadas de tela** for ≤ 6px, prender e desenhar uma
   linha de 1px em `--c-mark` atravessando o convite naquele eixo.
3. As guias aparecem/somem em `--t-rapido`; o bloco não ganha transição durante o
   arrasto.
4. Respeitar `prefers-reduced-motion` (§8 do handoff: *"sem animação de snap"*).

**Impacto técnico**
- Arquivos: `components/account/convite/EditorDeConvite.tsx` (cálculo no
  `pointermove`), `components/account/convite/BlocoNaTela.tsx` ou uma camada nova
  `GuiasDeSnap.tsx`
- Atenção: as coordenadas do documento são fração 0..1; a tolerância é em px de
  tela, então precisa dividir por `zoom` antes de comparar.

**Critério de aceite**
Arrastar um título até perto do centro horizontal prende no centro exato e mostra
uma linha vertical em `--mark` enquanto encaixa.

**Prioridade:** Alta

---

#### [E9-04] — Sem autosave: o salvamento é só manual

**Localização**
- Componente: `EditorDeConvite`
- Arquivo: `components/account/convite/EditorDeConvite.tsx` (o comentário do topo
  declara a decisão: *"O salvamento é explícito"*)

**Situação atual**
Botão "Salvar". Estado `salvo` local. Sem debounce, sem `localStorage`, sem
indicador "salvo há X".

**Situação esperada no protótipo**
§7: *"**Autosave:** debounce 800ms após mudança → `salvarConviteAction(doc)`.
Indicador na TopBar: 'salvando…' → 'salvo há X'. Salvar manual (Ctrl/Cmd+S)
força flush."* §10: *"**Autosave offline-safe:** manter o último `doc` em
`localStorage['invite:'+conviteId]`; ao voltar a ligação, reconciliar."* E o
desenho E9 mostra `rascunho · salvo há 2 min` na barra do topo.

**Divergência identificada**
O casal pode perder trabalho fechando a aba. A barra do topo não diz quando foi
o último salvamento.

**Alteração necessária**
1. Autosave com debounce de 800ms chamando `salvarConviteAction`.
2. Indicador na barra: `salvando…` / `salvo há X` / `não salvo`.
3. `Ctrl/Cmd+S` força o flush.
4. Espelho em `localStorage['invite:'+conviteId]`, reconciliado ao voltar.
5. Guarda de conflito por `updatedAt` — §10 do handoff: *"se o servidor tiver
   `updatedAt` mais novo, avisar e recarregar em vez de sobrescrever"*.

**Impacto técnico**
- Arquivos: `components/account/convite/EditorDeConvite.tsx`,
  `app/actions/invite-actions.ts` (devolver `{ updatedAt }`)
- O comentário atual do arquivo justifica o salvamento explícito por causa do
  ruído de gravar cada frame do arrasto — o **debounce de 800ms resolve isso**, e
  o handoff já previa (`1 entrada por gesto, não por frame`). Atualizar o
  comentário junto.

**Critério de aceite**
Mover um bloco e esperar 1s grava sozinho; a barra mostra "salvo há alguns
segundos"; fechar e reabrir a aba traz o desenho salvo.

**Prioridade:** Alta

---

#### [E9-05] — Atalhos de teclado: só Delete e Esc

**Localização**
- Arquivo: `components/account/convite/EditorDeConvite.tsx:372-393`

**Situação atual**
`Delete`/`Backspace` apaga o bloco (com `confirm()` nativo); `Escape` deseleciona.

**Situação esperada no protótipo**
§7: *"Ctrl/Cmd Z / Shift+Z, C/V/D, Delete, setas, `[`/`]` z-order, `+`/`-` zoom,
`0` = ajustar à tela, Espaço+arrasto = pan."* §5: *"Setas do teclado movem 1px
(Shift = 10px)"* e *"Ctrl/Cmd+C/V, Ctrl/Cmd+D (cola deslocado 12px)"*.

**Divergência identificada**
Faltam: desfazer/refazer por teclado, copiar/colar/duplicar, setas de
movimentação fina, z-order, zoom por teclado, ajustar à tela, pan com espaço.

**Alteração necessária**
Acrescentar os atalhos no mesmo `useEffect` de `keydown`, respeitando a guarda de
"está digitando" que já existe. `useHistorico` já expõe `desfazer`/`refazer`; o
zoom e o pan já são estado local.

**Impacto técnico**
- Arquivo: `components/account/convite/EditorDeConvite.tsx`
- `Ctrl/Cmd+D` precisa de `preventDefault` (é o atalho de favoritos).
- `confirm()` nativo do Delete deve virar `DialogoDestrutivo` (ver **VOZ-04**).

**Critério de aceite**
As setas movem o bloco selecionado 1px (10px com Shift); Ctrl/Cmd+Z desfaz;
Ctrl/Cmd+D duplica deslocado 12px; `0` ajusta o convite à tela.

**Prioridade:** Média

---

#### [E9-06] — `publicarConviteAction` não valida o que o handoff exige

**Localização**
- Arquivo: `app/actions/invite-actions.ts:147`

**Situação atual**
**Necessita investigação na implementação** — a assinatura existe, mas o corpo
não foi lido linha a linha nesta auditoria.

**Situação esperada no protótipo**
§7: *"**Publicar:** valida (nomes, data, botão RSVP presente) →
`publicarConviteAction`. Bloquear publicação com aviso `--warn` se faltar campo
essencial."* §10: *"**Validação de publicar** (server + client): nomes não
vazios, data válida, existe ≥1 `ButtonEl` apontando ao RSVP, slug único."*

**Alteração necessária**
Implementar a validação nos dois lados (cliente para o aviso imediato, servidor
como trava), com aviso em `--warn` listando o que falta.

**Impacto técnico**
- Arquivos: `app/actions/invite-actions.ts`,
  `components/account/convite/PublicarConvite.tsx`
- Depende de **E9-01** (o `ButtonEl` precisa existir para ser exigido).

**Critério de aceite**
Tentar publicar um convite sem botão de confirmação mostra um aviso `--warn`
dizendo exatamente o que falta, e a publicação não acontece.

**Prioridade:** Alta

---

#### [E9-07] — Faltam multisseleção, menu de contexto, bloquear e ocultar

**Localização**
- Arquivos: `components/account/convite/EditorDeConvite.tsx`, `Camadas.tsx`

**Situação atual**
Seleção de um bloco por vez (`selecionado: string | null`). Sem
`onContextMenu`, sem `locked`, sem `hidden` no modelo de dados.

**Situação esperada no protótipo**
§5: *"Shift+clique = multiseleção (bounding box combinada). Elemento `locked` não
seleciona por clique (só pela lista de Camadas)."* e *"Botão direito → Duplicar,
Bloquear, Ocultar, Apagar, Trazer p/ frente, Enviar p/ trás."* §2 define
`locked?: boolean; hidden?: boolean` em `Base`.

**Divergência identificada**
Três recursos ausentes; dois campos do modelo de dados ausentes.

**Alteração necessária**
1. Acrescentar `bloqueado?: boolean` e `oculto?: boolean` em `BlocoBase` (e no
   parser).
2. Menu de contexto com as seis ações.
3. Multisseleção com Shift+clique e caixa combinada.

**Impacto técnico**
- Arquivos: `lib/site/inviteDoc.ts`, `EditorDeConvite.tsx`, `BlocoNaTela.tsx`,
  `Camadas.tsx`
- Sem migração de banco (`jsonb`).
- Multisseleção é a parte cara: mover N blocos exige aplicar o delta em todos.

**Critério de aceite**
Botão direito num bloco abre o menu com as seis ações; um bloco bloqueado não
seleciona por clique mas seleciona pela lista de Camadas.

**Prioridade:** Média

---

#### [E9-08] — Editor não tem réguas nem barra de zoom com dimensões

**Localização**
- Arquivo: `components/account/convite/EditorDeConvite.tsx`

**Situação atual**
Zoom existe (roda do mouse + estado `zoom`), pan existe. Sem réguas e sem a barra
inferior.

**Situação esperada no protótipo**
E9 desenha: **réguas de 22px** em `#26281f` no topo e à esquerda do espaço de
trabalho, e uma **`<ZoomBar>` de 40px** no rodapé (`#1f2226`) com
`Convite · 105 × 148 mm · retrato` à esquerda e `− [slider] + 68%` à direita.

**Divergência identificada**
Réguas e barra de zoom com as dimensões do convite não existem.

**Alteração necessária**
Acrescentar as réguas (decorativas, `aria-hidden`) e a barra de zoom com as
dimensões lidas de `doc.largura`/`doc.altura` e a orientação derivada.

**Impacto técnico**
- Arquivos: `components/account/convite/EditorDeConvite.tsx`,
  `components/account/convite/FormatoDoConvite.tsx` (já sabe os formatos)

**Critério de aceite**
O rodapé do editor mostra as dimensões do convite e o percentual de zoom, com
controle deslizante.

**Prioridade:** Baixa

---

#### [E10-01] — ~~Não existe tela de checkout com QR Pix, copia e cola e resumo~~ · **CANCELADO pelo dono (24/08/2026)**

> **Não implementar.** O checkout é do **AbacatePay** — ele já entrega a tela de
> pagamento, o QR e o copia-e-cola, e refazer isso dentro do produto seria
> manter uma segunda tela de pagamento em paralelo com a do provedor, com dois
> lugares para o BR Code divergir.
>
> `startPaymentAction` continua levando ao checkout do provedor, e a volta
> continua sendo confirmada por `/api/pagamento/confirmar` + webhook.
>
> **O que NÃO foi cancelado junto:** `E10-02` (tela de sucesso "Seu site está
> no ar!"), `E10-03` (marca d'água PRÉVIA e "o que muda ao publicar") e
> `E10-04` (rótulo "Pagar e publicar"). Essas três são do produto, não do
> provedor, e seguem valendo.

<details>
<summary>Registro original da divergência</summary>

#### [E10-01] — Não existe tela de checkout com QR Pix, copia e cola e resumo

**Localização**
- Página: `/conta/pedidos/:id` (o pagamento)
- Componente: `PaymentButton`
- Arquivo: `components/account/PaymentButton.tsx`

**Situação atual**
Um formulário com campo de CPF e um botão que chama `startPaymentAction`, que
redireciona para o checkout externo do AbacatePay. Nada acontece dentro do
produto.

**Situação esperada no protótipo**
E10.2 desenha uma tela de **760px** dentro do produto:
- migalha `← Voltar / Publicar o site`;
- abas de método: **Pix** (selecionada, fio de 1.5px) e **Cartão**;
- card com fio: **QR de 150×150** à esquerda; à direita "Aponte a câmera do
  banco", o parágrafo *"A confirmação é automática — o site publica assim que o
  Pix cair."*, o rótulo `PIX COPIA E COLA`, o campo sulcado com o código truncado
  e o botão de copiar;
- abaixo: rodinha em `--warn` + *"Aguardando pagamento… a página atualiza
  sozinha."*;
- coluna direita: card `RESUMO` com pacote, endereço, `Total` em display 28px e
  `pagamento único` em Meta.
- Mobile (390): mesma tela empilhada, QR de 130px e botão "Copiar Pix copia e
  cola".

**Divergência identificada**
Toda a tela de checkout está fora do produto. O casal sai da Enlace no momento
mais sensível do fluxo, e volta sem saber se deu certo (é o que o comentário de
`app/conta/pedidos/[id]/page.tsx:53-70` conserta *depois*, consultando a API).

**Alteração necessária**
1. Criar a tela de checkout no produto, com QR e copia-e-cola.
2. A rodinha "aguardando pagamento" com _polling_ do estado, sem promessa de
   prazo (Skill `texto-do-casal`).
3. **Consultar `regras-de-negocio`**: método de pagamento, quem gera o QR, se
   cartão existe.
4. **Atenção**: o QR aqui é da **Enlace cobrando o casal** — é diferente do Pix
   de presente, que é do casal e nunca tem chave de fallback (`AGENTS.md` §3).
   Não misturar os dois caminhos.
5. `ABACATEPAY_WEBHOOK_SECRET` vazio deixa o webhook em 503 (pendência conhecida
   do `AGENTS.md`); a tela de espera não pode depender só dele.

**Impacto técnico**
- Arquivos: rota nova ou seção em `app/conta/pedidos/[id]/page.tsx`,
  `components/account/PaymentButton.tsx`, `app/actions/payment-actions.ts`,
  `lib/payments/abacatepay.ts`
- `qrcode` já é dependência do projeto.
- **Necessita investigação na implementação**: a API do AbacatePay devolve o
  BR Code para renderizar dentro do produto? Se não, a tela não é possível como
  desenhada.

**Critério de aceite**
Clicar em "Pagar e publicar" abre a tela de checkout dentro da Enlace, com QR e
copia-e-cola, e a tela reage sozinha quando o pagamento cai.

**Prioridade:** ~~Crítica~~ — cancelado

</details>

---

#### [E10-02] — Não existe a tela de sucesso "Seu site está no ar!"

**Localização**
- Página: `/conta/pedidos/:id` depois do pagamento

**Situação atual**
Depois do pagamento, `app/conta/pedidos/[id]/page.tsx:89-97` redireciona para
`/api/pagamento/confirmar` e volta ao painel comum. Não há tela de celebração.

**Situação esperada no protótipo**
E10.2 (560px): disco verde de 56px com o check, `Seu site está no ar!` em 36px,
o parágrafo com o endereço em mono, a **etiqueta sólida verde "No ar"**, e dois
botões: `Copiar link do site` (tinta) + `Enviar convites` (contorno).
`HANDOFF-motion.md` #6 detalha o movimento: marca d'água PRÉVIA em fade-out
(`--slow`) e o selo verde com `pop` (`scale .8→1.08→1`) aos 700ms.

**Divergência identificada**
O momento de recompensa do produto inteiro não existe. O casal paga e volta para
a mesma tela de antes.

**Alteração necessária**
Renderizar a tela de sucesso quando o painel abrir logo após a confirmação
(usar o `?publicacao=ok` que a rota `/api/pagamento/confirmar` pode passar, ou
comparar `publishedAt` com "agora"). Aplicar o movimento #6.

**Impacto técnico**
- Arquivos: `app/conta/pedidos/[id]/page.tsx`, `app/api/pagamento/confirmar/route.ts`,
  componente novo
- Critério do handoff §6.6: *"A sequência 'publicar → no ar' só dispara após
  confirmação real do pagamento."* Não disparar otimista.

**Critério de aceite**
Depois de o pagamento cair, o painel abre com a tela de sucesso, o selo "No ar"
faz `pop`, e os dois botões funcionam.

**Prioridade:** Alta

---

#### [E10-03] — Falta o card "O QUE MUDA AO PUBLICAR" e a marca d'água PRÉVIA na miniatura

**Localização**
- Página: `/conta/pedidos/:id`, estado "prévia pronta, não pago"
- Arquivos: `app/conta/pedidos/[id]/page.tsx`, `components/account/LivePreview.tsx`

**Situação atual**
A prévia aparece em `LivePreview` sem marca d'água. Não há card explicando o que
o pagamento muda. A faixa "Seu site está pronto — e ainda invisível para os
convidados" não existe.

**Situação esperada no protótipo**
E10.1 desenha três peças que faltam:
1. **Faixa de aviso** com fio + traço de 3px em tinta à esquerda: disco com
   ícone de cadeado, *"Seu site está pronto — e ainda invisível para os
   convidados."* + subtexto com o endereço em mono, e o botão de tinta
   "Publicar site →" à direita.
2. **Marca d'água** sobre a miniatura: `PRÉVIA · PRÉVIA` em mono 34px,
   `letter-spacing: .4em`, `color: rgba(184,65,44,.16)`, `rotate(-18deg)`,
   `pointer-events: none`.
3. **Card "O QUE MUDA AO PUBLICAR"** com quatro linhas: três com check verde
   (endereço no ar / marca d'água some / convites e RSVP ativam) e uma com
   bullet cinza (*"Você pode continuar editando depois de publicar"*).

**Divergência identificada**
As três peças não existem. Sem a marca d'água, o casal abre a prévia e conclui
que já publicou — o mesmo defeito que o comentário de
`app/preview/[token]/page.tsx:55-60` descreve ter consertado na faixa da prévia.

**Alteração necessária**
Implementar as três peças em `app/conta/pedidos/[id]/page.tsx`, condicionadas a
`site.status !== "published"`. A marca d'água entra como sobreposição em
`LivePreview` via prop (`marcaDagua?: boolean`).

**Impacto técnico**
- Arquivos: `app/conta/pedidos/[id]/page.tsx`, `components/account/LivePreview.tsx`
- Ícone `cadeado` já existe em `Icone.tsx`.
- A marca d'água **não pode** ir para o site renderizado, só para a miniatura no
  painel.

**Critério de aceite**
Com o pedido em prévia, o painel mostra a faixa de aviso, a miniatura com a marca
d'água diagonal e o card "O que muda ao publicar".

**Prioridade:** Alta

---

#### [E10-04] — Rótulo e copy do botão de pagamento fora do sistema de voz

**Localização**
- Componente: `PaymentButton`
- Arquivo: `components/account/PaymentButton.tsx:22`, `:37`, `:40`

**Situação atual**
- rótulo do campo: `CPF do pagador (exigido pelo PIX)`
- botão: `Efetuar pagamento · R$ 29,90` / `Abrindo pagamento...`
- rodapé: `Pagamento por PIX · ambiente seguro`

**Situação esperada no protótipo**
- botão: **"Pagar e publicar"** (V3 lista exatamente esse par: "Pagar e
  publicar" ✓ / "Finalizar" ✗)
- rodapé: **"Pix ou cartão · pagamento seguro"** com o ícone de escudo
- V5 grafa a marca como **"Pix"**, nunca "PIX" em caixa alta.

**Divergência identificada**
Quatro coisas: (a) "Efetuar" é vocabulário de cartório, contra o princípio V1.1
("Fale como gente"); (b) o botão não diz que publica; (c) "PIX" em caixa alta;
(d) falta o ícone de escudo.

**Alteração necessária**
- rótulo do campo → `CPF de quem paga` + ajuda `O Pix exige o CPF do pagador.`
- botão → `Pagar e publicar` (o valor vai no card acima, como em E10)
- carregando → manter o rótulo e mostrar `btn-rodinha` (o `Botao` da Prensa já
  faz isso; hoje o `PaymentButton` usa `<button>` cru — trocar por `Botao`)
- rodapé → `Pix ou cartão · pagamento seguro` com `<Icone nome="escudo" />`
  (ícone a criar, ver **IC-01**)
- trocar `PIX` por `Pix` em todo o arquivo.

**Impacto técnico**
- Arquivos: `components/account/PaymentButton.tsx`,
  `components/ui/prensa/Icone.tsx`
- "Pix ou cartão" só pode ser escrito se cartão existir — **consultar
  `regras-de-negocio`**.

**Critério de aceite**
O botão diz "Pagar e publicar", usa `Botao` com rodinha, e nenhuma string da tela
escreve "PIX" em caixa alta.

**Prioridade:** Média

---

### 3.7 · Faixa F · Site do casamento (convidado)

---

#### [F4-01] — `/rsvp/:slug` não tem quase nada do formulário desenhado — **RISCO ALTO**

**Localização**
- Página: `/rsvp/:slug`
- Componentes: `RsvpCard`, `RsvpGuestRow`, `SaveTheDate`
- Arquivos: `app/rsvp/[slug]/page.tsx`, `components/RsvpCard.tsx`,
  `components/RsvpGuestRow.tsx`

**Situação atual**
`SaveTheDate` (a capa do casal legado) seguido de um card `bg-(--color-blush)` de
`max-w-sm` com a pergunta *"Vocês confirmam presença?"* e uma linha por
convidado, cada uma com confirmar/recusar. Sem prazo, sem contagem de lugares,
sem nomes livres, sem restrição alimentar, sem recado, sem tela de sucesso.

**Situação esperada no protótipo**
F4 — a única prancha marcada com `⚠` e a nota *"gente real usando"* — desenha
uma tela de 720px com:
1. cabeçalho centralizado: nomes do casal em 22px, `CONFIRME ATÉ 05 SET 2026` em
   Meta/`--mark`, e a pergunta em display 42/44 (`Família Costa, vocês vêm?`);
2. **dois cards de escolha** lado a lado, de 88px de altura mínima:
   `Sim, vamos!` (tinta, com o subtexto "mal podemos esperar") e `Não posso`
   (branco com fio, "vamos sentir sua falta");
3. um card `surface-raised` com quatro campos:
   - **stepper** "Quantos dos 2 lugares vão?" com `−` / número em display 32px /
     `+` (botões de 44×44) e o Meta "de 2 reservados";
   - **"Nomes de quem vai"** — campo de texto;
   - **"Alguma restrição alimentar?"** — chips (Nenhuma / Vegetariano / Vegano /
     Sem glúten), o ativo com fio de 1.5px;
   - **"Recado para o casal (opcional)"** — área de texto com placeholder
     "Deixe um carinho…";
   - botão de tinta de largura cheia, 16px, "Enviar confirmação".
4. **Estado de sucesso**: disco verde de 56px com o check, `Presença
   confirmada!` em 38px, o parágrafo com o nome do grupo e o nº de lugares, os
   botões `Adicionar à agenda` e `Ver o site`, e o link
   `Precisa mudar algo? Editar resposta`.

**Divergência identificada**
De nove elementos do desenho, existem dois (a pergunta e a escolha sim/não, em
outra forma). Faltam: prazo, stepper de lugares, nomes, restrição alimentar,
recado, botão de envio único, tela de sucesso, agenda e edição da resposta.

**Alteração necessária — atenção ao risco**
Esta rota tem **22 confirmações de gente real** e links já distribuídos no
WhatsApp (`AGENTS.md` §2). Sequência obrigatória:
1. `npm run backup:full` e rollback escrito antes de qualquer migração.
2. Migração **aditiva** para os dados novos: `guests.dietary` (texto),
   `groups.message` / `guest_messages` (recado), e o uso de
   `site_content.rsvp_deadline` que **já existe** no schema
   (`lib/db/schema.ts:248`) e hoje não é lido por `/rsvp`.
3. Reescrever a tela **preservando o comportamento atual como caminho**: quem já
   confirmou continua confirmado; o slug não muda; a rota nunca pode devolver
   erro por campo novo faltando.
4. Testes primeiro: `app/actions/rsvp-actions.test.ts` já existe — estender
   antes de mexer na tela. Ver Skill `testes` (nunca duas suítes ao mesmo tempo).
5. **Consultar `regras-de-negocio`**: o que o convidado responde é regra de
   produto, e restrição alimentar é dado pessoal (LGPD).

**Impacto técnico**
- Arquivos: `app/rsvp/[slug]/page.tsx`, `components/RsvpCard.tsx`,
  `components/RsvpGuestRow.tsx`, `app/actions/rsvp-actions.ts`,
  `lib/db/schema.ts` + migração, `lib/repositories/groups.ts`
- Testes: `components/RsvpCard.test.tsx`, `app/actions/rsvp-actions.test.ts`
- Movimento: a tela de sucesso é a transição #7 do handoff (ver **M-04**).
- **Não** tocar em `getGroupBySlug` (global de propósito, §6.2 do SDD).

**Critério de aceite**
Um `/rsvp/<slug>` existente continua abrindo e confirmando como antes; a tela
nova mostra prazo, stepper, nomes, restrição e recado; enviar leva à tela de
sucesso com o check desenhado; `npm run test` passa.

**Prioridade:** Crítica

---

#### [F4-02] — `/rsvp/:slug` não respeita o prazo de confirmação (H3 não existe)

**Localização**
- Página: `/rsvp/:slug`
- Arquivos: `app/rsvp/[slug]/page.tsx`, `app/actions/rsvp-actions.ts`

**Situação atual**
`site_content.rsvp_deadline` existe no schema e é lido **só** por
`lib/site/avisos.ts` (para o aviso do sino no painel do casal). A rota `/rsvp`
não consulta o prazo; passado o prazo, o convidado continua confirmando.

**Situação esperada no protótipo**
H3 desenha a tela de prazo vencido: nomes do casal, fio de 44px, `PRAZO
ENCERRADO EM 05 DE SETEMBRO` em Meta/`--warn`, título `As confirmações já
fecharam` (44/48), o parágrafo *"Os noivos precisaram fechar a lista para
acertar o buffet…"*, os botões `Falar com os noivos` (tinta) e `Ver o site do
casamento` (contorno), e o rodapé com data/hora/local em Meta.
A prancha H fixa o status HTTP: **H3 = 200**.

**Divergência identificada**
A regra de prazo existe no banco e no painel, mas não no lugar onde ela vale.

**Alteração necessária**
1. Ler `rsvpDeadline` do site na rota `/rsvp/<slug>`.
2. Se hoje > prazo, renderizar a tela H3 (usando `BecoComSaida` com o `codigo`
   em `--warn` e o cartão de rodapé), com **HTTP 200** e `noindex`.
3. Travar também `submitRsvpAction` no servidor — a tela sozinha não impede um
   POST direto.
4. "Falar com os noivos" precisa de um destino: hoje não há contato do casal
   exposto ao convidado. **Necessita investigação na implementação** —
   provavelmente o WhatsApp do casal, que é dado da conta e não deve vazar sem
   decisão de produto. **Consultar `regras-de-negocio`.**

**Impacto técnico**
- Arquivos: `app/rsvp/[slug]/page.tsx`, `app/actions/rsvp-actions.ts`,
  `components/site/BecoComSaida.tsx` (aceitar `tom` para o código em `--warn`)
- **RISCO ALTO**: um erro de fuso aqui fecha a lista antes da hora para gente
  real. Usar `T12:00:00` como já faz `lib/site/avisos.ts:314`.

**Critério de aceite**
Com prazo no passado, `/rsvp/<slug>` devolve 200 com a tela H3 e o POST é
recusado; com prazo no futuro ou sem prazo, tudo funciona como hoje.

**Prioridade:** Alta

---

#### [F2-01] — `/s/:slug/meu-convite` é uma busca por nome; o desenho é a página pessoal do convidado

**Localização**
- Página: `/s/:slug/meu-convite`
- Arquivo: `app/s/[slug]/meu-convite/page.tsx`

**Situação atual**
Tela centralizada de 440px com um campo "Seu nome completo" e o botão "Encontrar
meu convite", que faz `findGroupByGuestName` e redireciona para `/rsvp/<slug>`.

**Situação esperada no protótipo**
F2 desenha uma página de 1100px em duas colunas (`1fr 360px`):
- barra do site (nomes do casal + "Voltar ao site");
- **esquerda**: `SEU CONVITE PESSOAL` em Meta/`--mark`, `Olá, Família Costa` em
  44/46, o parágrafo com **"Reservamos 2 lugares no seu nome"** em negrito, e o
  card branco `SUA RESPOSTA` com a etiqueta verde `Confirmado`, o número de
  lugares em display 34px, a restrição alimentar, e o link `Alterar minha
  resposta`;
- **direita**: card **oliva** `O DIA` com data em 24px e as linhas
  Cerimônia / Festa, mais o botão claro `Ver no mapa`.

**Divergência identificada**
São telas diferentes: o produto tem a **porta de entrada** (busca) e o desenho
tem a **página do convidado já identificado**. A busca do produto é útil e não
existe no protótipo; a página do desenho não existe no produto.

**Alteração necessária**
Manter as duas: a busca vira o estado "não identificado" da mesma rota, e depois
de encontrar o grupo a rota mostra a página pessoal em vez de redirecionar para
`/rsvp`. Isso exige um jeito de o convidado ficar identificado — cookie de sessão
leve por grupo, ou `?grupo=<slug>` na URL.

**Impacto técnico**
- Arquivos: `app/s/[slug]/meu-convite/page.tsx`, `lib/repositories/groups.ts`
- Depende de **F4-01** (a resposta com lugares e restrição precisa existir para
  ser mostrada aqui).
- **LGPD**: identificar por nome digitado e devolver dados de outra pessoa é um
  vazamento. A busca atual já tem esse risco e hoje ele é pequeno porque só
  redireciona; mostrar a resposta completa aumenta o risco. **Consultar
  `regras-de-negocio` e a Skill `banco` antes.**

**Critério de aceite**
Depois de encontrar o convite, a rota mostra a página pessoal com lugares,
resposta e o card oliva do dia; "Voltar ao site" leva a `/s/<slug>`.

**Prioridade:** Alta

---

#### [F5-01] — A prévia não tem a marca d'água circular PRÉVIA sobre o hero

**Localização**
- Página: `/preview/:token`
- Arquivo: `app/preview/[token]/page.tsx`

**Situação atual**
A faixa preta do topo está correta e completa (círculo de registro, texto mono,
"Abrir o painel →"). Abaixo dela, o site renderiza sem nenhuma marcação.

**Situação esperada no protótipo**
F5 desenha, além da faixa, um **selo circular** sobre o hero: 92×92,
`border: 1.5px solid rgba(255,255,255,.8)`, `PRÉVIA` em mono 11px com
`letter-spacing: .14em`, `transform: rotate(-8deg)`, no canto superior direito
(24px do topo, 28px da direita). No mobile: 64×64, 14px das bordas, fonte 9px.

**Divergência identificada**
O selo não existe. A faixa some ao rolar (não é `sticky`), então a partir do
segundo scroll a prévia é indistinguível do site publicado.

**Alteração necessária**
Acrescentar o selo circular como sobreposição no topo do `SiteFromView` quando a
renderização vier de `/preview/<token>` (prop `previa?: boolean`), com
`pointer-events: none` e `aria-hidden`.

**Impacto técnico**
- Arquivos: `app/preview/[token]/page.tsx`, `components/site/SiteFromView.tsx`
- **Cuidado**: `SiteFromView` é compartilhado com `/s/<slug>`. O selo **nunca**
  pode aparecer no site publicado.
- A cor branca do selo assume hero com foto escura; sobre hero claro fica
  invisível. Usar `mix-blend-mode: difference` ou uma segunda variante — 
  **necessita investigação na implementação**.

**Critério de aceite**
`/preview/<token>` mostra o selo circular sobre o hero; `/s/<slug>` publicado não
mostra nada.

**Prioridade:** Média

---

#### [F1-01] — O site publicado não tem a barra de navegação fixa do desenho

**Localização**
- Página: `/s/:slug`
- Componente: `SiteFromView` / `SiteRenderer`
- Arquivos: `components/site/SiteFromView.tsx`, `components/site/SiteRenderer.tsx`

**Situação atual**
**Necessita investigação na implementação** para confirmar seção a seção; o que
dá para afirmar é que `SiteRenderer` monta as seções em `max-w-[1120px]` e não há
grep de barra `sticky` no componente.

**Situação esperada no protótipo**
F1 desenha `.enSiteNav`: `position: sticky; top: 0;
background: rgba(242,239,231,.92); border-bottom: 1px solid #d8d0bf`, com os
nomes do casal em 22px à esquerda e, à direita, as âncoras `História · O dia ·
Presentes · Galeria` + o botão de tinta `Confirmar presença` (9×16 de padding).

**Alteração necessária**
Conferir e, se ausente, acrescentar a barra fixa ao site publicado, com as
âncoras derivadas das **seções ligadas** (não fixas — um site sem galeria não
pode ter a âncora Galeria). O botão só aparece se a seção `rsvp` estiver ligada.

**Impacto técnico**
- Arquivos: `components/site/SiteFromView.tsx`, `lib/templates/*/sections.tsx`
- **Atenção à Skill `molde`**: cor e fonte da barra têm de vir do `ThemeSpec` do
  casal; `npm run verify:template` reprova cor fora do token.
- `lib/site/ancoras.ts` já existe (`linkDaSecao`) e serve de base.

**Critério de aceite**
`/s/<slug>` publicado tem barra fixa com as âncoras das seções ligadas e o botão
de confirmar presença; `npm run verify:template` continua passando.

**Prioridade:** Média

---

#### [F1-02] — O site publicado tem largura máxima de 1120px

**Localização**
- Arquivos: `components/site/SiteRenderer.tsx`, `components/site/SiteFromView.tsx`

**Situação atual**
`max-w-[1120px]` com `shadow-2xl` — o site é renderizado como um **cartão
centralizado** sobre o fundo da página.

**Situação esperada no protótipo**
F1 desenha o site **em 1440px, de borda a borda**: hero de 560px full-bleed,
história em duas colunas edge-to-edge, contagem em faixa oliva de largura total,
galeria em 4 colunas na largura toda.

**Divergência identificada**
O site do casal está dentro do "card de ~1120px centralizado" que a Fundação A3
nomeia como o erro. Além disso, `shadow-2xl` faz o site parecer uma prévia
mesmo depois de publicado.

**Alteração necessária**
Remover o teto de 1120px e a sombra no modo publicado; deixar as seções irem de
borda a borda, com o texto corrido limitado a 6 colunas por dentro (regra A3).
Manter o enquadramento de cartão **apenas** dentro do `LivePreview` do painel.

**Impacto técnico**
- Arquivos: `components/site/SiteRenderer.tsx`, `components/site/SiteFromView.tsx`,
  possivelmente `lib/templates/*/sections.tsx`
- **Risco de molde**: mudar a largura afeta os 6 moldes. Rodar
  `npm run shot:template <pasta> <ids>` antes e depois e comparar (Skill `molde`).
- Afeta o casamento que já está no ar.

**Critério de aceite**
Em 1440px, o hero de `/s/<slug>` ocupa a largura da janela; as capturas dos 6
moldes continuam coerentes.

**Prioridade:** Média

---

### 3.8 · Faixa G · Admin (dono)

---

#### [G2-01] — `/admin` gerencia convidados; o desenho G2 é "Grupos e permissões" da equipe

**Localização**
- Página: `/admin`
- Arquivo: `app/admin/page.tsx`

**Situação atual**
`Gerenciar convidados` — `GroupForm` + `GroupList` sobre
`listGroupsWithGuests(getLegacySiteId())`, ou seja, os grupos de convidados **do
site legado**, em `max-w-2xl`.

**Situação esperada no protótipo**
G2 · `GET /admin` → `createGroupAction · deleteGroupAction`: cabeçalho
`ACESSOS / Grupos e permissões` (36px), à direita um campo "Nome do novo grupo…"
+ botão `+ Criar grupo`. Abaixo, grade de **3 cards** (`#1f2226`, fio `#32363c`,
22px de padding), cada um com: nome em Instrument Serif 22px, subtítulo em Meta
("acesso total", "pedidos e convidados", "presentes e repasses"), um disco de
status (verde/amarelo) no canto, **avatares sobrepostos** dos membros (30px,
`margin-left:-8px`, fio de 2px na cor do card), e rodapé com fio: `3 membros` +
`Gerenciar` (ou `Apagar` em `--danger` quando 1 membro).

**Divergência identificada**
A tela do desenho — controle de acesso da **equipe** — não existe. A tela que
ocupa a rota é a gestão de convidados de **um** site (o legado), que em produto
multi-tenant não deveria estar no admin global.

**Alteração necessária**
1. **Consultar `regras-de-negocio`**: G2 é funcionalidade nova (grupos de acesso,
   permissões, membros) e implica decisão de operação.
2. Se aprovada: migração aditiva (`admin_groups`, `admin_group_members`,
   `admin_group_permissions`), tela G2 em `/admin`, e mover a gestão de
   convidados legada para `/admin/convidados`.
3. Se **não** aprovada agora: manter a tela atual, mas renomear o item da barra
   para "Convidados" **e registrar aqui** que G2 fica pendente — o que já é o
   estado, então a divergência vira débito conhecido em vez de bug.

**Impacto técnico**
- Arquivos: `app/admin/page.tsx`, `components/admin/AdminNav.tsx`,
  `lib/db/schema.ts` + migração, `lib/auth/requireAdmin.ts`
- **Risco de banco**: alto. Backup + `db:rehearse` obrigatórios.

**Critério de aceite**
Ou `/admin` mostra os cards de grupos de acesso, ou o item da barra e o `<h1>`
dizem "Convidados" e existe registro da pendência.

**Prioridade:** Média

---

#### [G3-01] — `/admin/dashboard` mostra confirmações do site legado; o desenho é o painel da operação

**Localização**
- Página: `/admin/dashboard`
- Arquivo: `app/admin/dashboard/page.tsx`

**Situação atual**
`<h1>Confirmações</h1>` + `RsvpDashboard` com os grupos do site legado, em
`max-w-3xl`.

**Situação esperada no protótipo**
G3 · 1440px:
1. Cabeçalho: `Setembro 2026` em display 34px + `atualizado agora` em Meta à
   direita.
2. **Quatro cartões** em grade de 4 colunas (`#1f2226`, fio, 20px): rótulo Meta +
   número em Instrument Serif **42px** + variação:
   `PEDIDOS · MÊS 312 / +18% vs. ago` (verde) · `RECEITA R$ 21k / +12% vs. ago` ·
   `SITES NO AR 1.284 / acumulado` · `CONVERSÃO 63% / −2% vs. ago` (em `--danger`).
3. Abaixo, grade `1.5fr 1fr`: **gráfico de barras** "PEDIDOS POR DIA · ÚLTIMOS 14"
   (14 barras de 150px de altura, `#454b52`, as duas maiores em `--mark`); e
   **"POR PACOTE"** com três barras de 6px (Para Sempre 58% em `--mark`, Site do
   Casamento 31%, Convite 11%).
4. Mobile 390: 2 cartões + gráfico de 7 barras.

**Divergência identificada**
A tela é outra: métrica de RSVP de um casamento no lugar do painel de operação da
plataforma. Nenhum dos quatro KPIs nem os dois gráficos existem.

**Alteração necessária**
1. Criar as consultas de operação: pedidos do mês, receita do mês, sites
   publicados (acumulado), conversão (pedidos enviados ÷ pedidos pagos), série de
   14 dias, distribuição por pacote. Base:
   `lib/repositories/orders.ts` e `lib/repositories/sites.ts`.
2. Montar a tela G3 com os quatro cartões e os dois gráficos (barras em CSS puro,
   como no desenho — sem biblioteca).
3. Mover `RsvpDashboard` para `/admin/convidados` junto com G2-01, ou mantê-lo
   numa aba do casal (ele já duplica o que o painel do casal mostra).
4. Aplicar **ARQ-02** (largura) antes.

**Impacto técnico**
- Arquivos: `app/admin/dashboard/page.tsx`, componentes novos,
  `lib/repositories/orders.ts`, `lib/repositories/sites.ts`,
  `lib/metrics.ts`
- Cache: consultas de agregação precisam de `use cache` + `cacheLife` — ver Skill
  `cache-e-build`.
- Se `dataviz` for necessário para o gráfico, o desenho já resolve com `div`s de
  altura percentual; **não** introduzir biblioteca.

**Critério de aceite**
`/admin/dashboard` abre com os quatro KPIs em display 42px e os dois gráficos, em
largura cheia.

**Prioridade:** Alta

---

#### [G4-01] — `/admin/pedidos` é uma pilha de cards com prompt de IA; o desenho é uma tabela filtrável

**Localização**
- Página: `/admin/pedidos`
- Arquivos: `app/admin/pedidos/page.tsx`, `components/admin/OrderCard.tsx`

**Situação atual**
`max-w-3xl`, `<h1>Pedidos de sites</h1>`, um `<details>` explicando como
**copiar um prompt** para gerar o site num modelo de IA, e três seções (`Em
andamento` / `No ar` / `Rascunhos`) com `OrderCard` empilhados.

**Situação esperada no protótipo**
G4 · 1440px:
1. Linha de controles: **chips de filtro** `Todos · 312` (tinta em `--mark`) /
   `No ar` / `Prévia` / `Cancelados` (contorno), e à direita o campo de busca
   `Buscar por casal, e-mail, #pedido…` (260px).
2. **Tabela** com fio, cabeçalho `#1f2226`, grade
   `110px 1.4fr 1.2fr 1fr 120px 130px 80px`, colunas:
   `PEDIDO · CASAL · E-MAIL · PACOTE · VALOR · STATUS · (Editar)`.
   Linhas alternadas (`#16181b` / transparente), número do pedido e valor em
   mono, e-mail truncado com `…`, status como etiqueta (sólida verde para "No
   ar", contorno para os demais), e o link `Editar` alinhado à direita.
3. Mobile 390: campo de busca + cards de 14px com nome, etiqueta e a linha
   `#4821 · Para Sempre · R$ 99,90`.

**Divergência identificada**
Estrutura completamente diferente. Faltam: filtros, busca, e a tabela com as
sete colunas. Sobra: o bloco de "copiar prompt + pedido", que não existe no
protótipo e cujo próprio texto descreve **trabalho manual por venda** — o que
contraria a promessa "o dono não encosta no código".

**Alteração necessária**
1. Aplicar **ARQ-02** (largura).
2. Substituir a pilha de seções pela tabela do desenho, com os chips de filtro e
   a busca.
3. Manter `OrderCard`/`AdminOrderControls` como o **detalhe** de um pedido
   (expandir a linha ou rota `/admin/pedidos/<id>`), não como a listagem.
4. **Consultar `regras-de-negocio` sobre o bloco de prompt.** Se o site já é
   provisionado automaticamente por `submitOrderAction` (e é — ver
   `app/actions/account-actions.ts:222`), o prompt é resíduo de um fluxo
   anterior e deve sair.

**Impacto técnico**
- Arquivos: `app/admin/pedidos/page.tsx`, `components/admin/OrderCard.tsx`,
  `components/admin/AdminOrderControls.tsx`, possivelmente rota nova
- Dados: `listOrdersWithUsers` já traz casal, e-mail, pacote, valor e status.
- `lib/buildPrompt.ts` e `docs/prompt-gerar-site.md` viram código morto se o
  bloco sair — remover junto.

**Critério de aceite**
`/admin/pedidos` abre em largura cheia com os chips de filtro, a busca e a tabela
de sete colunas; filtrar por "Prévia" reduz a lista.

**Prioridade:** Alta

---

#### [G5-01] — `/admin/presentes` mostra os presentes do site legado; o desenho é a operação financeira

**Localização**
- Página: `/admin/presentes`
- Arquivos: `app/admin/presentes/page.tsx`, `components/admin/GiftAdmin.tsx`

**Situação atual**
`max-w-3xl`, `<h1>Lista de presentes</h1>`, `GiftAdmin` com os presentes e
contribuições de `getLegacySiteId()` — um site só.

**Situação esperada no protótipo**
G5 · 1440px, em duas colunas (`1fr 320px`):
- **Esquerda**: `Contribuições recentes` em 30px, e uma tabela de 5 colunas
  (`130px 1.4fr 1.4fr 120px 110px`): `DATA · CASAL · COTA · VALOR · STATUS`,
  com data em mono ("19 Set · 14h"), casal, cota ("Lua de mel · 1 cota"), valor em
  mono e status em 11px (`confirmado` em `--ok`, `processando` em `--warn`).
- **Direita**: card `TOTAL EM PRESENTES · MÊS` com `R$ 48k` em display 40px e
  "312 contribuições" em `--ok`; e card `A REPASSAR` com duas linhas separadas
  por fio: `Pendente R$ 3.200` e `Repassado R$ 44.800`.
- Barra do admin: botão de tinta `+ Registrar contribuição`.

**Divergência identificada**
A tela é de **um site**, não da operação. Faltam: a coluna do casal, o total do
mês, o bloco "A repassar" e o botão de registrar contribuição na barra.

**Alteração necessária**
1. Aplicar **ARQ-02**.
2. Trocar a fonte de dados: `listContributions` de **todos** os sites, com o
   nome do casal por junção.
3. Montar as duas colunas do desenho.
4. `registerContributionAction` já existe (`app/actions/gift-actions.ts:71`) —
   ligar ao botão da barra.
5. **"A repassar" é conceito que não existe no produto**: o Pix vai direto para o
   casal e nunca passa pela Enlace (`AGENTS.md` §3). Um bloco dizendo "R$ 3.200 a
   repassar" seria informação falsa. **Não implementar esse card**; registrar
   como divergência assumida do protótipo contra a regra de produto.

**Impacto técnico**
- Arquivos: `app/admin/presentes/page.tsx`, `components/admin/GiftAdmin.tsx`,
  `lib/repositories/gifts.ts` (consulta multi-site)
- Precedência: regra 2 — o produto vence no ponto do repasse.

**Critério de aceite**
`/admin/presentes` lista contribuições de todos os casais com a coluna do casal,
em largura cheia, com o total do mês; nenhum bloco fala em repasse.

**Prioridade:** Alta

---

#### [G-06] — Nenhuma tela do admin mostra o cabeçalho de página do desenho

**Localização**
- Páginas: as quatro do `/admin`

**Situação atual**
Cada página abre com um `<h1 className="t-display text-[26px]">` solto.

**Situação esperada no protótipo**
G2: sobrancelha Meta em `--mark` (`ACESSOS`) acima do título em 36px, com os
controles da tela (`campo + botão`) alinhados à direita na mesma linha.
G3: título em 34px + `atualizado agora` em Meta à direita.
G5: título em 30px.

**Divergência identificada**
Falta a sobrancelha, o título é menor que o desenho, e os controles não ficam na
linha do título.

**Alteração necessária**
Padronizar o cabeçalho das quatro páginas: `flex justify-between items-end`, com
sobrancelha + título à esquerda e os controles à direita.

**Impacto técnico**
- Arquivos: os quatro `app/admin/*/page.tsx`; considerar extrair
  `components/admin/CabecalhoDoAdmin.tsx`.

**Critério de aceite**
As quatro telas do admin têm sobrancelha Meta, título no tamanho do desenho e
controles na mesma linha.

**Prioridade:** Baixa

---

### 3.9 · Faixa H · Estados de falha (convidado)

---

#### [H-01] — H1/H2 não têm a saída secundária desenhada

**Localização**
- Arquivos: `app/s/[slug]/not-found.tsx`, `app/c/[slug]/not-found.tsx`,
  `app/rsvp/[slug]/not-found.tsx`

**Situação atual**
Só `saidaPrincipal` ("Ir para a Enlace"). O componente `BecoComSaida` aceita
`saidaSecundaria` e `cartao`, mas nenhuma das três telas usa.

**Situação esperada no protótipo**
- H1: dois botões — `Procurar por nome` (contorno) + `Ir para a Enlace` (tinta).
- H2: além dos botões, o **cartão branco** `O CASAMENTO` com os nomes do casal em
  26px, a data/cidade em 14px, e o botão de largura cheia `Ir para o site do
  casamento`.

**Divergência identificada**
Falta a saída secundária em H1 e o cartão em H2. O comentário de
`app/c/[slug]/not-found.tsx:12-16` explica por que o cartão não existe: o
`not-found` não recebe os parâmetros da rota que o disparou.

**Alteração necessária**
1. **H1**: acrescentar `saidaSecundaria={{ rotulo: "Procurar por nome", href: "/" }}`
   — mas isso exige uma busca de casamento por nome, que não existe. Ou criar a
   busca, ou trocar o rótulo para algo que exista. **Necessita investigação na
   implementação.**
2. **H2**: em vez do `not-found.tsx` (que perde os params), tratar o convite
   despublicado **dentro** de `app/c/[slug]/page.tsx` — ali o slug está
   disponível e dá para achar o site do casal e montar o cartão. Reservar o
   `not-found` só para slug que nunca existiu.

**Impacto técnico**
- Arquivos: `app/c/[slug]/page.tsx`, `app/c/[slug]/not-found.tsx`,
  `lib/repositories/siteInvites.ts` (uma consulta que distinga "não existe" de
  "existe e está despublicado")
- Status HTTP: a prancha fixa **H2 = 410**, não 404. Hoje é 404.

**Critério de aceite**
Abrir um `/c/<slug>` despublicado devolve **410** com o cartão do casamento e o
botão para `/s/<slug>`.

**Prioridade:** Média

---

#### [H-02] — Nenhuma tela de falha declara `noindex`

**Localização**
- Arquivos: `app/{s,c,rsvp}/[slug]/not-found.tsx`, `components/site/BecoComSaida.tsx`

**Situação atual**
Nenhum dos três `not-found.tsx` exporta `metadata`. `app/s/[slug]/page.tsx`
declara `robots: { index: false }` no caminho de site não publicado, mas o
`not-found` não.

**Situação esperada no protótipo**
Regra explícita da prancha H: *"Status HTTP corretos: H1 404, H2 410, H3 200, H4
401/403, H5 200. **Nenhuma delas indexável (`noindex`)**."*

**Divergência identificada**
As telas de falha podem ser indexadas.

**Alteração necessária**
Exportar `export const metadata: Metadata = { robots: { index: false, follow:
false } }` nos três `not-found.tsx` e em toda tela renderizada por
`BecoComSaida`.

**Impacto técnico**
- Arquivos: os três `not-found.tsx`, `app/s/[slug]/page.tsx` (o caminho H4)

**Critério de aceite**
`curl` em uma rota de falha traz `<meta name="robots" content="noindex,nofollow">`.

**Prioridade:** Média

---

#### [H-03] — Tela H4 "site com senha" não existe

**Localização**
- Página: `/s/:slug`
- Arquivo: `app/s/[slug]/page.tsx:76-92`

**Situação atual**
Só o estado "oculto" existe, e está correto.

**Situação esperada no protótipo**
H4 · "COM SENHA" (720px): duas colunas — foto (`aneis.png`) com gradiente à
esquerda, e à direita `SITE PRIVADO` em Meta, os nomes em 34/38, o parágrafo
*"Os noivos protegeram este site. Digite a senha que veio no convite."*, o campo
de senha com `letter-spacing:.2em` e o anel `--mark`, o botão de tinta `Entrar`,
e a linha *"Não tem a senha? Peça para quem te convidou."* Mobile: foto de 190px
no topo. Status HTTP **401/403**. Regra: *"errar a senha não recarrega a página;
mostra erro embaixo do campo. Limitar tentativas por IP."*

**Divergência identificada**
Tela e funcionalidade ausentes.

**Alteração necessária**
Depende de **E2-02** (o modo `password` no banco). Depois:
1. Renderizar a tela H4 quando `access_mode === "password"` e não houver cookie
   de acesso válido.
2. Verificação por action, com erro abaixo do campo (nunca alerta no topo — V4).
3. `lib/rateLimit.ts` por IP.
4. Cookie de acesso por site, curto, `httpOnly`.

**Impacto técnico**
- Arquivos: `app/s/[slug]/page.tsx`, action nova, `lib/rateLimit.ts`,
  `components/site/BecoComSaida.tsx` (ou componente próprio, porque H4 tem
  formulário e foto — não é um beco)
- Depende de **E2-02**.

**Critério de aceite**
Com o site em "só com senha", `/s/<slug>` devolve 401 com o formulário; senha
certa dá acesso; senha errada mostra o erro abaixo do campo sem recarregar; 10
tentativas do mesmo IP são barradas.

**Prioridade:** Média

---

#### [H-04] — Tela H5 "o Pix não foi confirmado" não existe

**Localização**
- Fluxo: presente por Pix (convidado)
- Arquivos: `components/gifts/GiftPixModal.tsx`, `app/api/pagamento/confirmar/route.ts`

**Situação atual**
`GiftPixModal` mostra o QR e o copia-e-cola. Não há tela para o caso de o código
expirar ou o pagamento não cair.

**Situação esperada no protótipo**
H5 (900px): disco de 52px com fio em `--danger` e o ícone de alerta,
`PAGAMENTO NÃO CONCLUÍDO` em Meta/`--danger`, `O Pix não foi confirmado` em
42/46, o parágrafo com **"Nada foi cobrado de você."** em negrito, o card branco
com a cota e o valor (`Lua de mel · 1 cota` / `R$ 250`), os botões
`Gerar novo código Pix` (tinta) + `Escolher outro presente` (contorno), e a
linha final sobre `ajuda@enlace.site` com prazo de 1 dia útil.
Regra da prancha: *"Em falha de dinheiro, dizer explicitamente que nada foi
cobrado — é a primeira dúvida de quem paga."* Status **200**.

**Divergência identificada**
A tela inteira não existe, e com ela some a frase que a prancha marca como
obrigatória.

**Alteração necessária**
1. Detectar o Pix não confirmado (expiração do código / retorno negativo) e
   renderizar H5.
2. **Atenção**: o Pix de presente é do **casal** e a Enlace não intermedia
   (`AGENTS.md` §3). A frase "Nada foi cobrado de você" é verdadeira; a frase
   sobre `ajuda@enlace.site` com prazo de resolução **promete um estorno que a
   Enlace não pode fazer** — o dinheiro foi direto para o casal.
   **Consultar `regras-de-negocio` antes de escrever esse texto.**
3. `CONTACT.email` (`lib/site.ts`) só é mostrado quando existe — respeitar.

**Impacto técnico**
- Arquivos: `components/gifts/GiftPixModal.tsx`, rota ou estado novo,
  `lib/pix/*`
- **Necessita investigação na implementação**: hoje o produto sabe quando um Pix
  de presente falha? Se o Pix é direto para o casal, provavelmente **não** — e
  então H5 só é possível na forma "o código expirou, gere outro".

**Critério de aceite**
Um código Pix de presente expirado leva a uma tela que diz explicitamente que
nada foi cobrado e oferece gerar outro código.

**Prioridade:** Média

---

### 3.10 · Faixa I · Primeira vez

---

#### [I-01] — O checklist de primeira vez não destaca "só o próximo passo em tinta"

**Localização**
- Componente: `PrimeiraVez`
- Arquivo: `components/account/manage/PrimeiraVez.tsx`

**Situação atual**
**Necessita investigação na implementação** para confirmar o estado de cada
linha; o componente existe e é acionado quando `semMovimento` é verdadeiro
(`app/conta/pedidos/[id]/page.tsx:118-122`), o que já corresponde à regra da
prancha.

**Situação esperada no protótipo**
I1 desenha três passos + um já feito:
- passo concluído: disco verde de 26px com o check;
- **passo ativo**: fundo `#faf9f6`, disco com fio `#1a1d21` e o número, e o botão
  **em tinta** à direita;
- passos futuros: disco com fio `#c9c9c2`, número em `#8b9099`, botão **em
  contorno** ou sem botão.
Regra explícita de I3: *"Um passo por vez em destaque: só o próximo tem botão em
tinta. Os demais ficam em contorno ou sem botão."*

**Alteração necessária**
Conferir e, se divergir, aplicar os três estados de linha e a regra do botão
único em tinta.

**Impacto técnico**
- Arquivo: `components/account/manage/PrimeiraVez.tsx`

**Critério de aceite**
No minuto zero, só o próximo passo pendente tem botão de tinta; ele ganha o fundo
`#faf9f6`.

**Prioridade:** Média

---

#### [I-02] — Sem foto de capa, a prévia não usa o cartão tipográfico com o aviso do desenho

**Localização**
- Componente: `LivePreview` (e a miniatura de D1, ver **D-01**)
- Arquivo: `components/account/LivePreview.tsx`

**Situação atual**
`LivePreview` renderiza a prévia real num `<iframe>`. Não há um estado
específico para "site sem foto de capa".

**Situação esperada no protótipo**
I1 desenha o card `SUA PRÉVIA` com uma área de 150px em `#e5e5e0` contendo o
**cartão tipográfico**: `VAMOS NOS CASAR` em mono 8px com tracking .3em, os nomes
em Instrument Serif 26px em `#5a5f66`, a data em mono 10px, e — em `--danger`
(`#a3302a`), mono 11px, tracking .06em — o aviso **`SEM FOTO DE CAPA AINDA`**.
Regra explícita de I3: *"Prévia sem foto usa o cartão tipográfico em cinza com o
aviso SEM FOTO DE CAPA AINDA — nunca um retângulo quebrado."*

**Divergência identificada**
O estado não existe. Como a prévia é um `<iframe>` do site real, o casal sem foto
vê o placeholder do molde — que não avisa nada.

**Alteração necessária**
Quando `countSitePhotos(site.id) === 0`, substituir o `<iframe>` pelo cartão
tipográfico com o aviso, no painel e na miniatura da lista de pedidos.

**Impacto técnico**
- Arquivos: `components/account/LivePreview.tsx`,
  `app/conta/pedidos/[id]/page.tsx`, `app/conta/pedidos/page.tsx`
- Componente novo compartilhado: `components/account/CartaoSemFoto.tsx`.

**Critério de aceite**
Um site sem nenhuma foto mostra o cartão tipográfico com "SEM FOTO DE CAPA AINDA"
em `--danger`, no painel e na lista de pedidos.

**Prioridade:** Média

---

#### [I-03] — A lista de pedidos vazia não é a tela I3 de duas colunas

**Localização**
- Página: `/conta/pedidos`, estado vazio
- Arquivo: `app/conta/pedidos/page.tsx:46-57`

**Situação atual**
Card `surface-raised` com "Nenhum pedido ainda" em Meta/`--mark`, "Vamos montar o
primeiro?" em 26px e o botão "Montar meu pedido".

**Situação esperada no protótipo**
I3 desenha a rota inteira em **duas colunas de altura mínima 400px**: à esquerda,
sobre papel, `MEUS PEDIDOS` em `--mark`, `Vamos criar o site de vocês` em 36/40,
o parágrafo de 40ch (*"A gente pergunta o essencial… Leva cerca de cinco minutos
e dá para salvar e voltar depois."*), o botão **G** `Começar meu site`
(15px/15×26) e a linha Meta `Sem cartão para experimentar`; à direita, a foto
`noiva.png` sangrando com `filter: saturate(.92) sepia(.05)`.

**Divergência identificada**
Um card centralizado no lugar de uma tela de duas colunas com foto. Some também a
linha "Sem cartão para experimentar", que é o argumento que tira o medo de
começar.

**Alteração necessária**
Refazer o estado vazio de `/conta/pedidos` conforme I3, com a foto
`/enlace/noiva.png` (já está em `public/enlace/`).

**Impacto técnico**
- Arquivo: `app/conta/pedidos/page.tsx`
- "Leva cerca de cinco minutos" é promessa de tempo — **consultar
  `regras-de-negocio`/Skill `texto-do-casal`** antes de escrever.

**Critério de aceite**
Uma conta sem pedidos abre `/conta/pedidos` em duas colunas, com foto à direita e
o botão G "Começar meu site".

**Prioridade:** Média

---

### 3.11 · Faixa J · Notificações

---

#### [J-01] — O sino não tem estado lido/não-lido nem "marcar tudo como lido"

**Localização**
- Componente: `Avisos`
- Arquivo: `components/account/manage/Avisos.tsx:12-35` (a decisão está
  documentada no próprio arquivo)

**Situação atual**
O contador conta **avisos dos últimos sete dias**, calculado no servidor. Não há
estado de leitura, nem ponto em `--mark` por linha, nem "marcar tudo como lido".

**Situação esperada no protótipo**
J1: linhas não lidas com fundo `#faf9f6` e ponto de 7px em `--mark` à esquerda;
link `Marcar tudo como lido` no cabeçalho do painel; e a regra J3: *"Abrir o sino
marca como lido depois de 2s, não no clique"* e *"O contador do sino conta
avisos, não eventos: as 12 confirmações contam como 1."*

**Divergência identificada**
Estado de leitura ausente. A regra "conta avisos, não eventos" **já é respeitada**
(`lib/site/avisos.ts` agrupa confirmações por dia) — essa parte está certa.

**Alteração necessária**
O comentário do componente argumenta bem contra `localStorage` (o casal são duas
pessoas em dois aparelhos). A saída correta é **servidor**:
1. Migração aditiva: `aviso_lido (user_id, aviso_id, lido_em)` — `aviso_id` é o
   id determinístico que `lib/site/avisos.ts` já gera (`presente:<id>`,
   `confirmacoes:<dia>`, …).
2. Marcar como lido 2s depois de abrir o painel do sino.
3. `Marcar tudo como lido` grava todos os ids visíveis.
4. Fundo `#faf9f6` + ponto `--mark` nos não lidos.
5. **Consultar `regras-de-negocio`** — decide se "lido" é por usuário ou por
   conta (o casal são dois logins?).

**Impacto técnico**
- Arquivos: `lib/db/schema.ts` + migração, `lib/site/avisos.ts`,
  `components/account/manage/Avisos.tsx`, `app/conta/pedidos/[id]/layout.tsx`
- Skill `banco` obrigatória.

**Critério de aceite**
Abrir o sino e esperar 2s zera o badge; reabrir noutro aparelho com o mesmo login
já mostra as linhas como lidas.

**Prioridade:** Média

---

#### [J-02] — `/conta/avisos` (preferências) não existe

**Localização**
- Página: `/conta/avisos` (ausente)

**Situação atual**
Rota inexistente; o sino não tem o rodapé "Ajustar o que quero receber".

**Situação esperada no protótipo**
J2 desenha a tela: cabeçalho `AVISOS / O que vocês querem saber` (32/36) + o
parágrafo *"Tudo aparece no sino do painel. Aqui vocês escolhem o que também
chega por e-mail."*, e uma tabela `1fr 96px 96px` com cabeçalho
`Evento · No sino · Por e-mail` e **cinco linhas**:

| Evento | No sino | Por e-mail |
|---|---|---|
| Presente recebido — *"é dinheiro — avisa na hora, sempre"* | ligado, **travado** (opacidade .45) | ligado |
| Prazo de confirmação chegando — *"7 dias e 1 dia antes"* | ligado, **travado** | ligado |
| Confirmações de presença — *"agrupadas — nunca uma por uma"* | ligado | desligado |
| Recados no mural | ligado | desligado |
| Resumo da semana — *"segunda de manhã, com tudo junto"* | `—` | ligado |

E a faixa final: *"Avisos de presente e de prazo não podem ser desligados no sino
— envolvem dinheiro e data."*

**Divergência identificada**
Rota, tela e as preferências não existem.

**Alteração necessária**
1. Migração aditiva: `notification_prefs (user_id, evento, sino, email)`.
2. Rota `/conta/avisos` dentro de `AccountShell`, com a tabela e os
   interruptores; presente e prazo travados no sino.
3. Link "Ajustar o que quero receber" no rodapé do painel do sino.
4. As preferências só têm efeito depois de existirem os e-mails de aviso — ver
   **EM-05**.

**Impacto técnico**
- Arquivos: rota nova, `lib/db/schema.ts` + migração,
  `components/account/manage/Avisos.tsx`, `lib/email.ts`
- Skill `banco`; Skill `texto-do-casal` para os rótulos.

**Critério de aceite**
`/conta/avisos` abre com as cinco linhas; os interruptores de presente e prazo no
sino estão desabilitados; salvar persiste.

**Prioridade:** Média

---

#### [J-03] — Falta o tipo de aviso "recado no mural"

**Localização**
- Arquivo: `lib/site/avisos.ts:43`

**Situação atual**
```ts
tipo: "presente" | "confirmacoes" | "prazo" | "no-ar";
```

**Situação esperada no protótipo**
J1 desenha cinco tipos, e o quinto é o recado:
*"**Marina Alves** deixou um recado no mural"*, com o ícone de lista, sem ponto
de não lido (é de ontem).

**Divergência identificada**
O mural **existe** no produto (`components/site/Mural.tsx`,
`app/actions/guestbook-actions.ts`, `lib/repositories/guestbook.ts`,
aba `/recados`) e não gera aviso.

**Alteração necessária**
Acrescentar `"recado"` ao union de `tipo`, uma função `avisosDeRecado` em
`lib/site/avisos.ts` (agrupada, como as confirmações — J3: *"Confirmações e
recados viram um aviso só por período"*), e o ícone correspondente em
`components/account/manage/Avisos.tsx:39-44`.

**Impacto técnico**
- Arquivos: `lib/site/avisos.ts`, `components/account/manage/Avisos.tsx`,
  `lib/repositories/guestbook.ts` (consulta por período)
- Ícone: `lista` (não existe ainda — ver **IC-01**).

**Critério de aceite**
Um recado novo aparece no sino, agrupado por dia, com ícone próprio.

**Prioridade:** Baixa

---

#### [J-04] — Todo aviso acionável deve carregar o link da ação; nem todos carregam

**Localização**
- Arquivo: `lib/site/avisos.ts`

**Situação atual**
**Necessita investigação na implementação** — os avisos têm `base` para montar
links, mas não foi verificado se todos os quatro tipos trazem ação.

**Situação esperada no protótipo**
J3: *"Todo aviso acionável carrega o link da ação ('Enviar lembrete →'). Aviso sem
próximo passo vira só ansiedade."* No desenho: presente sem link, confirmações
com "Ver quem confirmou →", prazo com "Enviar lembrete →".

**Alteração necessária**
Conferir os quatro tipos e garantir que confirmações e prazo tenham link. "Enviar
lembrete" exige o e-mail 06 (**EM-06**) — enquanto ele não existir, o link deve
levar à lista de convidados, não prometer envio.

**Impacto técnico**
- Arquivos: `lib/site/avisos.ts`

**Critério de aceite**
Todo aviso que tem próximo passo mostra o link para ele.

**Prioridade:** Baixa

---

### 3.12 · Compartilhamento (prancha S)

---

#### [S-01] — Nenhuma rota pública emite metatags Open Graph

**Localização**
- Páginas: `/s/:slug`, `/c/:slug`, `/rsvp/:slug`, `/preview/:token`
- Arquivos: `app/s/[slug]/page.tsx:31-56`, `app/c/[slug]/page.tsx:33-59`

**Situação atual**
`generateMetadata` devolve só `title`, `description` e `robots`. Grep por
`openGraph`, `opengraph` e `twitter` em `app/` e `lib/` não retorna nada.

**Situação esperada no protótipo**
S1 especifica, literalmente, o que o servidor precisa emitir:
```html
<meta property="og:title"       content="Ana & João · 19 de setembro de 2026">
<meta property="og:description" content="Confirme sua presença e veja a lista de presentes.">
<meta property="og:image"       content="https://enlace.site/f/og-4821.png">  <!-- 1200×630, < 300kb, PNG -->
<meta property="og:url"         content="https://enlace.site/ana-e-joao">
<meta name="twitter:card"       content="summary_large_image">
```

**Divergência identificada**
Um link de casamento colado no WhatsApp aparece **sem cartão**. A prancha é
explícita sobre por que isso importa: *"O que decide se a pessoa abre não é o
site — é o cartão que aparece na conversa."*

**Alteração necessária**
1. Acrescentar `openGraph` e `twitter` em `generateMetadata` de `/s/[slug]` e
   `/c/[slug]`.
2. `og:url` precisa da URL absoluta — `lib/baseUrl.ts` (`getBaseUrl`) já existe.
3. `og:image` depende de **S-02**.
4. Para o site **não publicado** e para `/preview`, **não** emitir OG — publicar
   pelo cartão de link é publicar (o mesmo argumento já registrado em
   `app/s/[slug]/page.tsx:38-45`).

**Impacto técnico**
- Arquivos: `app/s/[slug]/page.tsx`, `app/c/[slug]/page.tsx`, `lib/baseUrl.ts`
- Cache: `generateMetadata` sob `cacheComponents` — ver Skill `cache-e-build`.

**Critério de aceite**
`curl` num `/s/<slug>` publicado traz as cinco metatags com valores reais do
casal; um site não publicado não traz nenhuma.

**Prioridade:** Crítica

---

#### [S-02] — Não existe geração da imagem de cartão (1200×630)

**Localização**
- Rota de imagem: ausente
- Referência: `app/f/[id]/route.ts` (entrega de fotos)

**Situação atual**
Nenhuma rota gera imagem de compartilhamento.

**Situação esperada no protótipo**
S1 desenha **dois** cartões de 1200×630 (mostrados a 50%):
- **Site do casamento**: foto de capa em `object-position: center 26%` com o
  filtro quente do produto, gradiente
  `rgba(26,29,33,.2) → transparent 40% → rgba(26,29,33,.62)`, e centralizado:
  `VAMOS NOS CASAR` em mono 11px/tracking .36em, os nomes em Instrument Serif
  62px/`line-height:.96`, e `19 . 09 . 2026 — SÃO PAULO` em mono 13px/tracking
  .1em. Logo da Enlace em branco a 85% no canto inferior esquerdo (24px, 20px).
- **Convite**: sem foto, cai no **cartão tipográfico em papel** (`#f2efe7`):
  `VOCÊ ESTÁ CONVIDADO` em `--mark`, os nomes em 54px com o `&` em `--mark`, fio
  de 56px, data em mono 13px. Nota do desenho: *"sem foto: cai para o cartão
  tipográfico em papel — nunca um cartão vazio."*
- Área segura de 60px nas bordas; nada essencial fora do centro.

**Divergência identificada**
A imagem não existe.

**Alteração necessária**
1. Criar `app/s/[slug]/opengraph-image.tsx` e `app/c/[slug]/opengraph-image.tsx`
   usando a `ImageResponse` do Next 16 (ler
   `node_modules/next/dist/docs/` antes — **`AGENTS.md` §1**).
2. Implementar as duas variantes (com foto / tipográfica).
3. **Invalidação de cache do WhatsApp**: a prancha exige que trocar a foto de
   capa **regere a imagem com nome novo** (`og-4821-v2.png`), senão os
   convidados continuam vendo a antiga por dias. Anexar um hash/versão ao
   caminho da imagem.
4. Teto de 300 KB.

**Impacto técnico**
- Arquivos novos: dois `opengraph-image.tsx`; `lib/site/ogVersao.ts`
- Fontes: `ImageResponse` precisa dos arquivos de fonte carregados
  explicitamente — Instrument Serif e IBM Plex Mono.
- Depende de **S-01**.

**Critério de aceite**
Colar `enlace.site/s/<slug>` num validador de OG mostra o cartão com a foto e os
nomes; um site sem foto mostra o cartão tipográfico; trocar a foto de capa muda o
cartão em um novo endereço.

**Prioridade:** Crítica

---

#### [S-03] — Não existe geração de QR code do site

**Localização**
- Referência: `qrcode` já é dependência (`package.json`), usada em
  `app/api/pix/qr/route.ts` para o Pix

**Situação atual**
QR só existe para pagamento Pix. Não há QR do endereço do site.

**Situação esperada no protótipo**
S3 especifica: correção de erro **H (30%)**, tamanho mínimo **25 × 25 mm**,
margem branca de **4 módulos**, cores `#1a1d21` sobre `#fff`, logo no centro com
**no máximo 20% da área**, formatos **SVG e PNG 300dpi**. E as regras:
*"Nunca aplicar o QR sobre foto, em papel escuro ou em cor da marca… Sempre
imprimir o endereço em texto embaixo."* Também desenha a **plaquinha de mesa**
pronta (105 × 148 mm) para baixar em PDF.

**Divergência identificada**
Nada disso existe.

**Alteração necessária**
1. Rota `app/api/qr/[slug]/route.ts` gerando SVG e PNG com os parâmetros acima.
2. Logo no centro com o quadrado de fundo em papel (como no desenho).
3. Plaquinha em PDF — reusar o gerador de export do convite, se houver.

**Impacto técnico**
- Arquivos: rota nova, `lib/site/qr.ts`
- `qrcode` já está instalado.
- O PDF da plaquinha é trabalho extra; pode ficar para uma segunda leva.

**Critério de aceite**
`/api/qr/<slug>.svg` devolve um QR legível com correção H, margem de 4 módulos e
o logo ocupando ≤20% da área.

**Prioridade:** Alta

---

#### [S-04] — A aba "Compartilhar" do painel não existe

**Localização**
- Página: `/conta/pedidos/:id/compartilhar` (ausente)

**Situação atual**
O casal copia o link por um botão dentro do card "Endereço do site" no Início.

**Situação esperada no protótipo**
S4 desenha a aba em duas colunas (`1.35fr 1fr`):
- **Esquerda**:
  - card `O LINK DO SITE`: campo sulcado em mono 15px com o endereço + botão
    `Copiar`; abaixo, `Enviar pelo WhatsApp` (tinta) e `Escolher mensagem
    pronta` (contorno) lado a lado;
  - card `COMO APARECE NO WHATSAPP` com a **prévia do cartão OG** (340px de
    largura, imagem de 120px + faixa `#f4f2ee` com título e descrição) e o link
    `Trocar foto de capa`.
- **Direita**:
  - card `QR CODE` centralizado, com o QR de 120px em área de silêncio, os
    botões `PNG` / `SVG` e o link `Baixar plaquinha pronta (PDF)`;
  - card **oliva** `VISITAS NO SITE` com o número em display 38px e a linha
    *"desde que foi publicado · 138 confirmaram"*.
- E as **três mensagens prontas** (S2): CONVIDAR, LEMBRAR (faltando 7 dias) e
  PRESENTES, cada uma com o texto e o endereço em mono.
- Regras do link (S2): compartilhar **sem** `https://` e sem `www`; usar
  `navigator.share()` quando existir, senão `wa.me/?text=`; cada convite tem link
  próprio e nunca se manda o link de um grupo para outro.

**Divergência identificada**
Aba inteira ausente.

**Alteração necessária**
Criar a rota e a aba (**NAV-04**) com as peças acima. As mensagens prontas
precisam passar pela Skill `texto-do-casal` e pelo agente `regras-de-negocio`
(são textos que o casal manda em nome dele).

**Impacto técnico**
- Arquivos: rota nova, `app/conta/pedidos/[id]/layout.tsx`,
  componente `components/account/manage/Compartilhar.tsx`
- Depende de **S-02** (prévia do cartão) e **S-03** (QR).
- `metricasDoSite` já dá visitas e confirmados.
- `CopiarLink` já existe em `components/ui/prensa/`.

**Critério de aceite**
`/conta/pedidos/<id>/compartilhar` mostra link + copiar, botão de WhatsApp com
mensagem pronta, prévia do cartão, QR com PNG/SVG e o card oliva de visitas.

**Prioridade:** Alta

---

### 3.13 · E-mails transacionais

---

#### [EM-01] — A casca dos e-mails não segue nenhuma das regras de construção

**Localização**
- Arquivo: `lib/email.ts:60-73`

**Situação atual**
```html
<div style="font-family:Inter,Arial,sans-serif;color:#3d4a36;max-width:480px;
            margin:0 auto;padding:24px">
  <p style="letter-spacing:.25em;...;color:#b8985f">Enlace</p>
  <h1 style="font-size:20px;...">${title}</h1>
  ...
</div>
```
Botão: `<a>` com `background:#2f3a29; border-radius:9999px; font-weight:600`.

**Situação esperada no protótipo**
A prancha `Emails` fixa oito regras, e a casca atual quebra sete:

| Regra da prancha | Estado |
|---|---|
| HTML de e-mail é **tabela**, não flex/div | ✗ é `div` |
| Corpo de **600px** numa tabela centralizada, largura em atributo **e** em `style` | ✗ é 480px |
| Botão é **célula de tabela** com fundo sólido (VML para Outlook), nunca `<a>` solto; área de toque ≥44px | ✗ é `<a>` |
| Fontes do sistema com fallback: serifa → `Georgia, serif`; sans → `Helvetica, Arial`; mono → `Courier New` | ✗ é `Inter, Arial` |
| A mensagem funciona com imagens bloqueadas | parcial (não há imagem) |
| Um **único** botão primário por e-mail | ✓ |
| **Sempre repetir o link em texto puro** abaixo do botão | parcial (só em 2 dos 3) |
| Preheader é `<div>` escondida no topo + espaços invisíveis | ✗ não existe |

Além disso, a paleta está errada: o desenho usa papel `#f2efe7`, fio `#c9c9c2`,
texto `#1a1d21`/`#5a5f66`, botão de tinta `#1a1d21` com raio **2px**, cabeçalho
com o **logo** e rodapé `Enlace · sites de casamento / enlace.site`. O atual usa
oliva `#3d4a36`, dourado `#b8985f` e botão-pílula verde.

**Divergência identificada**
A casca inteira é de outro sistema visual e de outra técnica de e-mail.

**Alteração necessária**
Reescrever `layout()` e `button()` em `lib/email.ts`:
1. Tabela externa de 100% com `bgcolor="#e2e2dc"`, tabela interna de 600px
   (`width="600"` **e** `style="width:600px"`), fundo `#f2efe7`, fio `#c9c9c2`.
2. Cabeçalho: linha com o logo (`<img>` com `alt="Enlace"`), fio embaixo.
3. Corpo: `padding:40px`, título em `Georgia, serif` 32/36, texto em
   `Helvetica, Arial` 15/24 em `#5a5f66`.
4. Botão: `<table><tr><td bgcolor="#1a1d21" style="border-radius:2px">` com
   `<a>` de `padding:15px 28px`, e o comentário condicional VML para Outlook.
5. Rodapé: fio + `Enlace · sites de casamento` / `enlace.site` em
   `Courier New` 11px `#8b9099`.
6. `layout()` passa a receber **preheader** e o injeta como `<div
   style="display:none;max-height:0;overflow:hidden">` seguido de
   `&#847;&zwnj;&nbsp;` repetido.
7. Link em texto puro abaixo do botão em **todos**.

**Impacto técnico**
- Arquivos: `lib/email.ts`
- Os três e-mails existentes precisam passar `preheader`.
- Testar em Gmail e Apple Mail, e no modo escuro (a prancha pede).
- `scripts/test-email.mjs` já existe (`npm run email:test`).

**Critério de aceite**
Os três e-mails chegam em 600px, com o logo, o botão de tinta retangular e o
preheader visível na caixa de entrada; nenhum usa `border-radius:9999px`.

**Prioridade:** Alta

---

#### [EM-02] — E-mail 01 "Confirmar conta" não é enviado (código morto)

**Localização**
- Arquivo: `lib/email.ts:179` (`sendEmailVerification`)
- Ausência: `app/actions/account-actions.ts` (`signupAction` não chama)

**Situação atual**
`sendEmailVerification` existe e **não é importada por nenhum arquivo**
(verificado por grep). `signupAction` cria a conta e não dispara verificação.
`AGENTS.md` §6 registra o mesmo: a tabela `email_verification_tokens` existe em
produção e não há código na `main` que a use.

**Situação esperada no protótipo**
E-mail 01 — assunto **"Confirme seu e-mail e comece o site"**, preheader *"Um
clique e sua conta está pronta."*, título "Boas-vindas, Ana", botão "Confirmar
meu e-mail", e a linha *"O link vale por 24 horas. Se não foi você quem criou a
conta, ignore esta mensagem."*
E a tela C2 já promete: *"Vamos mandar um link no e-mail de vocês para confirmar
a conta."* (`app/conta/criar/page.tsx:94-96`) — **promessa que o produto não
cumpre hoje.**

**Divergência identificada**
Funcionalidade prometida na interface e não entregue.

**Alteração necessária**
1. Reconstruir a verificação sobre a arquitetura atual (não mesclar a branch
   `feedback-001` — `AGENTS.md` §6 é explícito).
2. Repositório `lib/repositories/emailVerification.ts`, action de verificação,
   rota `/conta/confirmar`, e a chamada em `signupAction`.
3. A tabela `email_verification_tokens` **já existe** — conferir o schema antes
   de gerar migração.
4. Ajustar o assunto/preheader ao desenho.

**Impacto técnico**
- Arquivos: `lib/email.ts`, `app/actions/account-actions.ts`,
  `lib/repositories/emailVerification.ts` (novo), rota `/conta/confirmar` (nova),
  `lib/db/schema.ts` (conferência)
- Skill `banco` para conferir o schema existente.
- Depende de **EM-01** (casca).

**Critério de aceite**
Criar uma conta dispara o e-mail 01; clicar no link marca o e-mail como
confirmado; o link expira em 24h.

**Prioridade:** Alta

---

#### [EM-03] — E-mail 03 "Recibo do pagamento" não existe

**Localização**
- Ausente em `lib/email.ts`
- Gatilho esperado: `app/api/webhooks/abacatepay/route.ts` /
  `app/api/pagamento/confirmar/route.ts`

**Situação atual**
Nenhum e-mail é enviado quando o pagamento é confirmado.

**Situação esperada no protótipo**
E-mail 03 — assunto **"Pagamento confirmado · pedido #4821"**, preheader
*"R$ 99,90 · Para Sempre. Seu site já está no ar."*; corpo com
`PAGAMENTO CONFIRMADO` em Meta/`--ok`, título "Está tudo certo", e uma **tabela
de recibo** com quatro linhas (Pedido / Pacote / Pago em / **Total** em 16px), o
botão "Ver meu site" e a linha *"Guarde este e-mail como comprovante. Precisa de
nota fiscal? Responda esta mensagem."*

**Divergência identificada**
Ausente. O casal paga e não recebe comprovante.

**Alteração necessária**
Criar `sendReceiptEmail` em `lib/email.ts` e dispará-la nos dois caminhos de
confirmação (webhook e retorno do checkout), com guarda de idempotência para não
mandar duas vezes.

**Impacto técnico**
- Arquivos: `lib/email.ts`, `app/api/webhooks/abacatepay/route.ts`,
  `app/api/pagamento/confirmar/route.ts`, `lib/repositories/orders.ts` (marcar
  "recibo enviado")
- **Pendência conhecida**: `ABACATEPAY_WEBHOOK_SECRET` vazio deixa o webhook em
  503. O disparo pelo retorno do checkout cobre isso.
- "Nota fiscal" é regra de produto — **consultar `regras-de-negocio`**.

**Critério de aceite**
Pagamento confirmado dispara um e-mail com a tabela de recibo, uma vez só.

**Prioridade:** Alta

---

#### [EM-04] — E-mail 04 "Seu site está no ar" não existe

**Localização**
- Ausente em `lib/email.ts`

**Situação atual**
Existe `sendPreviewReadyEmail` (a prévia está pronta), que **não está no
protótipo**. O e-mail de publicação, que está, não existe.

**Situação esperada no protótipo**
E-mail 04 — assunto **"O site de vocês está no ar 🎉"**, preheader
*"enlace.site/ana-e-joao — hora de compartilhar."*; **cabeçalho com foto de
170px** (hero do casal com gradiente e os nomes por cima), título "Está no ar!",
o endereço num card branco centralizado em mono 15px, o botão **"Compartilhar no
WhatsApp"**, e a linha *"Ainda dá para editar tudo — fotos, textos e presentes —
pelo painel, a qualquer momento."*

**Divergência identificada**
Ausente. O momento em que o site vai ao ar não gera nenhum aviso por e-mail.

**Alteração necessária**
Criar `sendSiteLiveEmail` e disparar junto com a publicação. A foto do
cabeçalho precisa da imagem OG (**S-02**) — a mensagem tem de funcionar com
imagens bloqueadas (regra da prancha), então os nomes e o endereço vão em texto.

**Impacto técnico**
- Arquivos: `lib/email.ts`, `app/api/pagamento/confirmar/route.ts`
- Depende de **EM-01** e, para a foto, de **S-02**.
- **Manter** `sendPreviewReadyEmail`: ele não está no protótipo mas resolve um
  problema real (o casal descobrir que a prévia existe). Registrar como adição
  consciente.

**Critério de aceite**
Publicar um site dispara o e-mail 04 com o endereço em texto e o botão de
compartilhar.

**Prioridade:** Alta

---

#### [EM-05] — E-mail 05 "Convite para o convidado" não existe

**Localização**
- Ausente em `lib/email.ts`
- Gatilho esperado: `publicarConviteAction`

**Situação atual**
O convite é distribuído só por link copiado à mão. Não há envio por e-mail.

**Situação esperada no protótipo**
E-mail 05 — assunto **"Ana & João convidam vocês"**, preheader *"19 de setembro,
São Paulo. Confirme até 05/09."*; corpo centralizado em papel: `VOCÊ ESTÁ
CONVIDADO` em `--mark`/tracking .32em, a linha em Pinyon *"com alegria
convidamos você para o casamento de"*, os nomes em 46px com o `&` em `--mark`,
fio de 56px, data em mono 14px, local, o botão "Confirmar presença", e
`RESPONDA ATÉ 05 DE SETEMBRO` em Meta. Rodapé: *"Reservamos 2 lugares no seu
nome · enlace.site/ana-e-joao"*.
Regra: 05 e 06 vão para convidados e precisam de `List-Unsubscribe` e do link no
rodapé.

**Divergência identificada**
Ausente — e depende de o produto ter **e-mail dos convidados**, que hoje não tem
(`groups`/`guests` guardam nome e status).

**Alteração necessária**
1. **Consultar `regras-de-negocio` primeiro**: enviar e-mail em nome do casal
   para terceiros é decisão de produto e de LGPD.
2. Se aprovado: migração aditiva `guests.email`, campo na tela do convite, e o
   envio com `List-Unsubscribe`.
3. Enquanto isso, o convite continua viajando por link — o que é coerente com a
   prancha `Compartilhamento`, que trata o WhatsApp como o canal principal.

**Impacto técnico**
- Arquivos: `lib/email.ts`, `lib/db/schema.ts` + migração,
  `app/actions/invite-actions.ts`
- Skill `banco`; LGPD.

**Critério de aceite**
Ou o e-mail 05 existe com opt-out, ou há registro de que a distribuição é por
link, por decisão de produto.

**Prioridade:** Média

---

#### [EM-06] — E-mail 06 "Lembrete de confirmação" não existe

**Localização**
- Ausente em `lib/email.ts`
- Gatilho esperado: cron, 7 dias antes do prazo

**Situação atual**
O aviso de prazo existe **só no sino** do painel (`lib/site/avisos.ts:301-330`),
e ele avisa o **casal**, não os convidados. O link "Enviar lembrete →" do desenho
J1 não tem para onde levar.

**Situação esperada no protótipo**
E-mail 06 — assunto **"Faltam 7 dias para confirmar presença"**, preheader *"Leva
menos de um minuto."*; título "Vocês vêm?", o parágrafo com **"7 dias"** em
negrito, **dois botões** lado a lado (`Sim, vamos!` em tinta e `Não posso ir` em
contorno — a exceção documentada à regra de um botão só), o card `O DIA` com data
e local, e o rodapé *"Enviado por Ana & João pela Enlace · não quero mais
lembretes"*.

**Divergência identificada**
Ausente. Depende de **EM-05** (e-mail dos convidados).

**Alteração necessária**
Depois de **EM-05**: cron 7 dias e 1 dia antes do prazo, para quem está
`pending`. `npm run schedule` / rota de cron — **necessita investigação na
implementação** (o projeto não tem cron hoje).

**Impacto técnico**
- Arquivos: `lib/email.ts`, rota de cron nova, `lib/repositories/groups.ts`
- Depende de **EM-05** e de **F4-02** (o prazo precisa valer).

**Critério de aceite**
Ou o lembrete é enviado nos dois marcos, ou o link "Enviar lembrete →" do sino
leva a algo que existe.

**Prioridade:** Média

---

#### [EM-07] — Assuntos e preheaders divergem dos do protótipo

**Localização**
- Arquivo: `lib/email.ts:129`, `:158`, `:185`

**Situação atual**
| Atual | Protótipo |
|---|---|
| `Redefinir sua senha — Enlace` | `Criar uma senha nova` |
| `Confirmem o e-mail de vocês — Enlace` | `Confirme seu e-mail e comece o site` |
| `A prévia do site de vocês está pronta 💚` | *(e-mail não previsto)* |

Nenhum tem preheader.

**Divergência identificada**
Assuntos diferentes, sufixo "— Enlace" redundante (o remetente já diz), e o
emoji 💚 num e-mail para o **casal** — a prancha Voz e Microcopy V5 restringe:
*"Emoji: só em e-mail para convidado e em texto que o casal escreve."*

> **Inconsistência do próprio protótipo, registrada:** o e-mail 04 do desenho
> tem assunto "O site de vocês está no ar 🎉", que é um e-mail para o casal com
> emoji — contradizendo V5. Ao implementar **EM-04**, seguir V5 e deixar o
> assunto sem emoji, ou levar a decisão ao agente `regras-de-negocio`.

**Alteração necessária**
1. Trocar os assuntos pelos do desenho e remover o sufixo "— Enlace".
2. Acrescentar preheader em todos (depende de **EM-01**).
3. Remover o 💚 do assunto do e-mail de prévia.

**Impacto técnico**
- Arquivo: `lib/email.ts`

**Critério de aceite**
Nenhum assunto de e-mail para o casal tem emoji; todos têm preheader.

**Prioridade:** Baixa

---

### 3.14 · Biblioteca de ícones

---

#### [IC-01] — 22 dos ~63 ícones da prancha existem

**Localização**
- Arquivo: `components/ui/prensa/Icone.tsx:20-43`

**Situação atual**
`CAMINHOS` tem 22 entradas: `check, x, mais, menos, chevronBaixo,
chevronDireita, setaDireita, setaEsquerda, copiar, linkExterno, alerta, cadeado,
compartilhar, lixeira, foto, presente, pessoas, calendario, local, relogio,
sino, arrastar`.

**Situação esperada no protótipo**
`Enlace - Icones.dc.html` organiza a biblioteca em quatro grupos:
- **Navegação e estrutura** (16): home, layout, menu, chevron-right,
  chevron-down, arrow-left, arrow-right, search, trash, plus, x, more, settings,
  external-link, copy, list
- **Ações e domínio do casamento** (16): check, heart, envelope-open, calendar,
  clock, map-pin, gift, users, user, message, bell, share, credit-card/pix,
  currency, download, upload
- **Status e feedback** (15): check-circle, alert-triangle, alert-circle, info,
  refresh/loading, eye, eye-off, lock, unlock, shield, star, bookmark,
  minus-circle, check-badge, venue
- **Editor de convite** (16): templates, text, image, shapes, background,
  layers, undo, redo, align-center, align-left, rotate, resize, zoom-in,
  crop/frame, edit/pencil, save

**Divergência identificada**
Faltam ~41 ícones. Os mais citados pelas telas desta auditoria e que precisam
existir: `escudo` (E10-04), `envelope` (E5-02, J-03), `lista` (J-03),
`baixar` (S-04), `olho`/`olho-fechado`, `informacao`, `alerta-triangulo`,
`atualizar`, `usuario`, `mensagem`, `coracao`, e o conjunto do editor
(`modelos`, `texto`, `imagem`, `formas`, `fundo`, `camadas`, `desfazer`,
`refazer`, `girar`, `redimensionar`, `zoom`, `recortar`, `lapis`, `salvar`).

**Alteração necessária**
Acrescentar os `d` que faltam, copiados da prancha (ela traz o SVG inteiro de
cada um). Nomear em português, como os existentes. Não instalar `lucide-react` —
o comentário do arquivo já explica por quê e a razão continua válida.

**Impacto técnico**
- Arquivo: `components/ui/prensa/Icone.tsx`
- Vários ícones usam `<rect>` e `<circle>`, e o componente só sabe `path` +
  `circle`. Precisa aceitar `rect` também (ver **IC-02**).

**Critério de aceite**
`NomeDoIcone` cobre os quatro grupos da prancha; nenhuma tela desenha SVG solto
fora de `Icone`.

**Prioridade:** Média

---

#### [IC-02] — Ícones com retângulo são desenhados como `path` sem canto arredondado

**Localização**
- Arquivo: `components/ui/prensa/Icone.tsx:34-40`

**Situação atual**
```ts
foto:        "M3 4h18v16H3zM21 16l-5-5L5 20",
calendario:  "M3 4h18v17H3zM3 9h18M8 2v4M16 2v4",
cadeado:     "M5 11h14v10H5zM8 11V8a4 4 0 0 1 8 0v3",
presente:    "M3 8h18v13H3zM3 12h18M12 8v13M...",
```

**Situação esperada no protótipo**
A prancha usa `<rect rx="1.5">` em todos:
```html
<!-- image -->  <rect x="3" y="4" width="18" height="16" rx="1.5"/><circle cx="8.5" cy="9" r="1.5"/><path d="m21 16-5-5L5 20"/>
<!-- calendar --><rect x="3" y="4" width="18" height="17" rx="1.5"/><path d="M3 9h18M8 2v4M16 2v4"/>
<!-- lock -->    <rect x="5" y="11" width="14" height="10" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>
<!-- gift -->    <rect x="3" y="8" width="18" height="13" rx="1.5"/><path d="M3 12h18M12 8v13M..."/>
```

**Divergência identificada**
Duas: (a) cantos vivos onde a prancha usa raio de 1.5; (b) o ícone de foto
**perdeu a lente** (`<circle cx="8.5" cy="9" r="1.5">`) — sem ela o desenho é uma
moldura com uma montanha, não uma foto.

**Alteração necessária**
Acrescentar suporte a `rect` no componente (`RETANGULOS: Partial<Record<...,
[x,y,w,h,rx][]>>`, no mesmo padrão de `CIRCULOS`), e reescrever os quatro ícones
acima com `rect` + os `circle` que faltam.

**Impacto técnico**
- Arquivo: `components/ui/prensa/Icone.tsx`
- Sem impacto em quem usa — a API (`nome`, `tamanho`) não muda.

**Critério de aceite**
O ícone de foto tem a lente; os quatro ícones com moldura têm `rx="1.5"`.

**Prioridade:** Baixa

---

### 3.15 · Movimento (`HANDOFF-motion.md`)

---

#### [M-01] — Transição de rota usa `blur()`, `translateY` e `scale`; o handoff especifica `translateX` com direção

**Localização**
- Componente: `PageTransition`
- Arquivo: `components/ui/PageTransition.tsx:31-32`, `:56-63`

**Situação atual**
```ts
const PERCURSO = 22;
const DURACAO = 520;
// ...
{ opacity: 0, transform: `translateY(22px) scale(0.985)`, filter: "blur(4px)" }
```
Sem animação de saída e sem direção.

**Situação esperada no protótipo**
`HANDOFF-motion.md` #1 (Push de rota): *"sai: `opacity→0, translateX(-8%)`;
entra: `translateX(22px)→0, fade`, atraso 120ms"*, token **`--slow` (620ms)**, e
*"Direção do X segue avanço/voltar (avança = entra da direita; volta = da
esquerda)."*
E §1 é explícito: *"Nada de `blur`, gradientes animados, parallax, bounce
exagerado."* §6.3 repete: *"Nenhuma animação de `width/height/top/left`; só
`transform`/`opacity`"* — `filter` não está na lista de permitidos.

**Divergência identificada**
Cinco: eixo errado (Y em vez de X), `scale` a mais, `blur` **proibido**, duração
520 em vez de 620, e sem saída nem direção.

**Alteração necessária**
1. Remover `filter: blur` e `scale`.
2. Trocar para `translateX(22px) → 0`, duração **620ms**, atraso **120ms**.
3. Implementar a saída (`opacity→0, translateX(-8%)`) — exige guardar o pathname
   anterior e animar antes de trocar, ou usar a View Transitions API com
   fallback (o handoff §4 cita as duas saídas).
4. Direção: comparar a posição do caminho novo com a do anterior (nas abas do
   painel, a ordem da barra dá a direção).

**Impacto técnico**
- Arquivos: `components/ui/PageTransition.tsx`, `app/conta/template.tsx`,
  `app/admin/template.tsx`
- A saída é a parte difícil no App Router; se a View Transitions API não estiver
  viável, entregar só a entrada corrigida e registrar a saída como pendente.

**Critério de aceite**
Navegar entre abas do painel entra da direita ao avançar e da esquerda ao voltar,
em 620ms, sem desfoque.

**Prioridade:** Média

---

#### [M-02] — Transição de etapa do questionário usa 28px e `--base`; o handoff pede 22px e `--slow`

**Localização**
- Arquivo: `app/globals.css:191-220`

**Situação atual**
```css
@keyframes motion-step-next { from { transform: translateX(28px); } }
.motion-step-next { animation: motion-step-next var(--t-base) var(--e-saida) both; }
```

**Situação esperada no protótipo**
#1 do catálogo cobre "questionário (etapa→etapa)": `translateX(22px)`, token
`--slow` (620ms), atraso 120ms.

**Alteração necessária**
Trocar `28px` por `22px` e `var(--t-base)` por `var(--t-lento)` nas duas
animações, e acrescentar `animation-delay: 120ms`.

**Impacto técnico**
- Arquivo: `app/globals.css`

**Critério de aceite**
A troca de etapa desliza 22px em 620ms.

**Prioridade:** Baixa

---

#### [M-03] — Não existe sistema de toast

**Localização**
- Ausente em todo o projeto (grep por `toast`/`brinde` só encontra a palavra em
  textos de conteúdo)

**Situação atual**
As confirmações de ação aparecem como texto de estado dentro da própria tela
(ex.: "salvo automaticamente", mensagens de `useActionState`).

**Situação esperada no protótipo**
Catálogo #4: *"**Toast** — 'fotos no site', 'link copiado', autosave — entra
`translateY(24px)→0 + fade`; auto-dismiss 4s com fade reverso; `--base` in /
`--fast` out"*, e §4: *"Toast com fila (máx 3) e timer de 4s."*
A Fundação A4 desenha a peça: fundo `#1a1d21`, raio 3px, `padding:14px 16px`,
disco verde de 8px, texto branco 13.5px, `box-shadow: 0 8px 24px
rgba(26,29,33,.22)`, com um `×` cinza à direita.
A Voz V4 fixa a fórmula: *"resultado no passado · com ponto final"* — "Suas fotos
estão no site.", não "Upload realizado com sucesso!".

**Divergência identificada**
A peça e o comportamento não existem.

**Alteração necessária**
1. `components/ui/prensa/Toast.tsx` + um provedor com fila (máx 3, 4s cada).
2. Ligar aos gestos que o handoff nomeia: fotos enviadas, link copiado, autosave
   do editor, salvamento de conteúdo/tema.
3. Respeitar `prefers-reduced-motion` (fade sem deslocamento).
4. `role="status"` + `aria-live="polite"`.

**Impacto técnico**
- Arquivos: componente novo, `components/ui/prensa/index.ts`, e os pontos de
  chamada (`PhotoManager`, `CopiarLink`, `ContentEditor`, `ThemeEditor`,
  `EditorDeConvite`)
- `CopiarLink` hoje provavelmente troca o próprio rótulo — conferir e migrar.

**Critério de aceite**
Copiar o link do site mostra um toast escuro com "Link copiado." que some sozinho
em 4s; três ações seguidas empilham no máximo três toasts.

**Prioridade:** Média

---

#### [M-04] — A confirmação de presença não tem o check desenhado (transição #7)

**Localização**
- Fluxo: `/rsvp/:slug` → sucesso
- Arquivos: `components/RsvpGuestRow.tsx`, `components/RsvpCard.tsx`

**Situação atual**
Não há tela de sucesso (**F4-01**), logo não há a animação.

**Situação esperada no protótipo**
#7: *"anel `scale .96→1`; check desenhado via `stroke-dashoffset 26→0` @550ms;
texto sobe"*, token `--base`, e o desenho mostra o disco verde de 56px com o
check em `stroke-width 2.4`.

**Alteração necessária**
Implementar junto com **F4-01**. É SVG com `pathLength` e `stroke-dashoffset` —
sem biblioteca, como o handoff §4 registra.

**Impacto técnico**
- Depende de **F4-01**.
- Já existe o `@keyframes draw` equivalente na prancha `Movimento`; o produto não
  tem nada parecido em `globals.css`.

**Critério de aceite**
Enviar a confirmação desenha o check em ~550ms e sobe o texto.

**Prioridade:** Média

---

#### [M-05] — A sequência "publicar → no ar" (transição #6) não existe

**Localização**
- Fluxo: pagamento confirmado

**Situação atual**
Sem tela de sucesso (**E10-02**) e sem marca d'água (**E10-03**), não há o que
animar.

**Situação esperada no protótipo**
#6: *"marca d'água PRÉVIA `fade-out` (`--slow`); selo verde 'No ar' `pop`
(`scale .8→1.08→1`) @700ms"*, e o critério §6.6: *"A sequência 'publicar → no
ar' só dispara após confirmação real do pagamento."*

**Alteração necessária**
Implementar junto com **E10-02** e **E10-03**.

**Prioridade:** Média

---

#### [M-06] — A tela "gerando o site" diverge do §3.1 do handoff

**Localização**
- Componentes: `CelebrationScreen`, `SiteSkeleton`
- Arquivos: `components/account/wizard/CelebrationScreen.tsx`,
  `components/ui/SiteSkeleton.tsx`

**Situação atual**
Fundo em gradiente derivado da cor do molde, **14 pétalas caindo**, o esqueleto
do site (GSAP) ao lado de um bloco de texto com quatro etapas e uma barra que
sobe até 92%. Ritmo de 1200ms, dimensionado pelo tempo real do provisionamento
(decisão documentada e correta: o handoff pede ~6s, o produto entrega ~1s porque
o provisionamento é rápido, e a crítica do dono foi contra espera inventada).

**Situação esperada no protótipo**
§3.1 detalha um palco diferente: *"miniatura do site dentro de uma **moldura de
navegador**, ao lado do status"*; fundo `#e9e9e3`; **cinco seções entrando de
cima para baixo** (nav → hero → história → contagem → galeria) com stagger de
480ms, cada uma trocando esqueleto→conteúdo em cascata; **barra de progresso**
4% → 38% → 74% → 100%; **três status em mono trocando por crossfade**
(`montando as páginas…` → `aplicando o estilo Editorial…` → `reservando
enlace.site/ana-e-joao…`); a **marca respirando** ao lado do título; e ao fim o
selo `Prévia pronta` fazendo `pop` (`scale .85→1.08→1`).

**Divergência identificada**
Seis: sem moldura de navegador; fundo em gradiente em vez de `#e9e9e3`; pétalas
que não estão no handoff (e §1 proíbe decoração: *"movimento discreto,
editorial… nunca decora"*); quatro etapas genéricas em vez dos três status
específicos com o nome do estilo e o endereço; sem o selo "Prévia pronta"; sem a
marca respirando.

**Alteração necessária**
1. **Remover as pétalas** — são decoração pura, contra §1.
2. Trocar o fundo por `#e9e9e3` liso.
3. Envolver o esqueleto numa moldura de navegador (barra com três discos e um
   campo de endereço), como o desenho.
4. Trocar as quatro etapas pelos três status do handoff, com os dados reais
   (nome do estilo escolhido e o endereço reservado).
5. Acrescentar o selo `Prévia pronta` com o `pop` ao fim.
6. Acrescentar a marca respirando ao lado do título (a classe
   `.motion-breathe` já existe).
7. **Manter** a duração amarrada ao tempo real — a decisão atual está certa e
   documentada; registrar como desvio consciente do "~6s" do handoff.
8. Tratar a **falha**: §3.1 exige que o esqueleto pare (sem shimmer), a barra vá
   para `--danger` e apareça "Tentar de novo". Hoje não há esse estado.

**Impacto técnico**
- Arquivos: `components/account/wizard/CelebrationScreen.tsx`,
  `components/ui/SiteSkeleton.tsx`, `app/globals.css` (o `@keyframes
  motion-petal` fica órfão — remover)
- Dados: o nome do estilo e o slug reservado precisam chegar ao componente.

**Critério de aceite**
Enviar o pedido mostra a miniatura numa moldura de navegador sobre `#e9e9e3`, com
os três status em mono e o selo "Prévia pronta" ao fim; não há pétalas; uma falha
de provisionamento para o shimmer e mostra "Tentar de novo".

**Prioridade:** Média

---

#### [M-07] — Não há hook `useReducedMotion()` centralizado; a checagem é repetida à mão

**Localização**
- Arquivos: `components/ui/SiteSkeleton.tsx:71-74`,
  `components/ui/PageTransition.tsx:47`, `app/globals.css` (12 blocos
  `html:not([data-movimento="ligado"])`)

**Situação atual**
Cada componente repete
`window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
document.documentElement.dataset.movimento !== "ligado"`.

**Situação esperada no protótipo**
`HANDOFF-motion.md` §2: *"Implementar via um hook `useReducedMotion()` que também
desliga o stagger e o desenho do check."*

**Divergência identificada**
A regra existe e funciona, mas duplicada. Cada componente novo pode esquecer o
`data-movimento`, e aí o interruptor do rodapé deixa de valer para ele.

**Alteração necessária**
Criar `lib/ui/useMovimentoReduzido.ts` com a lógica única (incluindo o listener
de mudança de preferência) e trocar as chamadas manuais.

**Impacto técnico**
- Arquivos: hook novo, `components/ui/SiteSkeleton.tsx`,
  `components/ui/PageTransition.tsx`, `components/ui/MotionProvider.tsx`
- O CSS continua como está — ele já cobre o caso sem JS.

**Critério de aceite**
Nenhum componente repete a expressão de `matchMedia`; o interruptor do rodapé
continua funcionando.

**Prioridade:** Baixa

---

### 3.16 · Voz e microcopy

---

#### [VOZ-01] — "PIX" em caixa alta em várias telas

**Localização**
- Arquivos: `components/account/PaymentButton.tsx:22`, `:40`; conferir também
  `components/gifts/GiftPixModal.tsx` e `app/conta/pedidos/[id]/presentes/page.tsx`

**Situação atual**
`(exigido pelo PIX)`, `Pagamento por PIX · ambiente seguro`.

**Situação esperada no protótipo**
V5 e todas as pranchas grafam **"Pix"**. O desenho E10 escreve
"Pix ou cartão · pagamento seguro" e "PIX COPIA E COLA" (esta em Meta, que é
caixa alta por CSS — não no texto).

**Alteração necessária**
Trocar `PIX` por `Pix` em todo texto de interface. Rótulos em Meta viram caixa
alta pelo `text-transform`, nunca escritos assim no código.

**Impacto técnico**
- Arquivos acima; grep por `"PIX"` em `app/` e `components/`.

**Critério de aceite**
Nenhuma string de interface contém `PIX` em caixa alta.

**Prioridade:** Baixa

---

#### [VOZ-02] — "Efetuar pagamento" e "Abrindo pagamento..." fora do sistema de voz

**Localização**
- Arquivo: `components/account/PaymentButton.tsx:37`

**Situação atual**
`Efetuar pagamento · R$ 29,90` / `Abrindo pagamento...`

**Situação esperada no protótipo**
V1.1 (*"Fale como gente. 'Confirme sua presença', não 'Efetue a confirmação de
comparecimento'"*) e V4/BOTÃO (*"verbo + objeto · 1 a 3 palavras · sem ponto
final"*). O rótulo do desenho é **"Pagar e publicar"**.
Além disso, V4 diz que o botão em carregamento **mantém o rótulo** e ganha a
rodinha — trocar o texto faz a pessoa achar que clicou errado (o próprio
`components/ui/prensa/Botao.tsx:73-77` documenta isso).

**Alteração necessária**
Ver **E10-04**.

**Prioridade:** Média

---

#### [VOZ-03] — Reticências com três pontos em vez de `…`

**Localização**
- Arquivos: `components/account/PaymentButton.tsx:37`
  (`"Abrindo pagamento..."`), e conferir os demais por grep

**Situação atual**
Convivem `...` e `…` no produto (`"Salvando…"` em `OrderWizard.tsx:694` está
certo).

**Situação esperada no protótipo**
Todas as pranchas usam o caractere `…` (`montando as páginas…`,
`Buscar por casal, e-mail, #pedido…`, `salvo há…`).

**Alteração necessária**
Grep por `\.\.\.` em strings de interface em `app/` e `components/`, e trocar por
`…`.

**Impacto técnico**
- Vários arquivos; troca mecânica. Não tocar em código (spread, etc.).

**Critério de aceite**
Nenhuma string de interface usa três pontos seguidos.

**Prioridade:** Baixa

---

#### [VOZ-04] — `confirm()` nativo no editor de convite

**Localização**
- Arquivo: `components/account/convite/EditorDeConvite.tsx:365`

**Situação atual**
```ts
if (!confirm("Remover este bloco do convite?")) return;
```

**Situação esperada no protótipo**
V4/DIÁLOGO DESTRUTIVO: *"pergunta + consequência + reversibilidade"*, com o botão
repetindo o verbo perigoso ("Apagar", nunca "OK") e a saída segura vindo primeiro
na leitura. O desenho é o card branco com fio e sombra, título em display 19–20px,
parágrafo, e os dois botões à direita (`Manter` sublinhado + `Apagar` em contorno
`--danger`).
O componente `components/ui/prensa/DialogoDestrutivo.tsx` **já existe**.

**Divergência identificada**
O `confirm()` do navegador não tem nenhuma dessas propriedades: os botões são "OK"
e "Cancelar", não há consequência escrita, e o visual é do sistema operacional.

**Alteração necessária**
Trocar por `DialogoDestrutivo`, com o texto no formato de V4:
*"Apagar este bloco? Ele sai do convite na hora. Dá para desfazer com Ctrl+Z."*

**Impacto técnico**
- Arquivo: `components/account/convite/EditorDeConvite.tsx`
- Grep por `confirm(` em `app/` e `components/` para achar outros casos.

**Critério de aceite**
Nenhum `window.confirm` em código de interface; o diálogo de apagar bloco usa
`DialogoDestrutivo` com o verbo repetido no botão.

**Prioridade:** Média

---

#### [VOZ-05] — Emojis em rótulo de interface

**Localização**
- Arquivos: `app/isabelle-e-nycolas/page.tsx:14` (`Lista de Presentes 🎁`),
  `lib/email.ts:158` (`💚` no assunto), `app/page.tsx:632`
  (conferir), `components/landing/*` (conferir)

**Situação atual**
`Lista de Presentes 🎁` num botão; `💚` num assunto de e-mail para o casal.

**Situação esperada no protótipo**
V5: *"Emoji: só em e-mail para convidado e em texto que o casal escreve. Nunca em
rótulo, botão, estado de erro ou no admin."*

**Alteração necessária**
Remover o `🎁` do botão e o `💚` do assunto (ver **EM-07**).

**Impacto técnico**
- Arquivos: `app/isabelle-e-nycolas/page.tsx`, `lib/email.ts`
- Grep por emoji em `app/` e `components/`.

**Critério de aceite**
Nenhum rótulo de botão do produto tem emoji.

**Prioridade:** Baixa

---

#### [VOZ-06] — Vocabulário: "pedido" e "site" usados de forma inconsistente

**Localização**
- Arquivos: `app/conta/pedidos/page.tsx` ("Meus pedidos" / "Novo pedido"),
  `app/conta/pedido/novo/page.tsx` ("Novo pedido" no `<title>`)

**Situação atual**
A interface fala em "pedido" onde o protótipo fala em "site": `Meus pedidos`,
`Novo pedido`, `Nosso pedido`.

**Situação esperada no protótipo**
D1 usa `MEUS PEDIDOS` (sobrancelha) mas o título é **"Seus sites"**, e o botão é
**"+ Novo site"**. V5 lista **site** como o termo oficial (*"site — não
'página'"*). "Pedido" é o termo de **operação** (o admin), não o do casal.

**Divergência identificada**
O casal lê o vocabulário da operação. Ele não comprou um pedido; ele está fazendo
um site.

**Alteração necessária**
No painel do casal: "site" no título e nos botões; "pedido" só onde é literalmente
o registro comercial (número, status, cancelar). Ver **D-02**.
**Consultar a Skill `texto-do-casal`** antes de fazer a varredura.

**Impacto técnico**
- Arquivos: `app/conta/pedidos/page.tsx`, `app/conta/pedido/novo/page.tsx`,
  `app/conta/pedidos/[id]/page.tsx`, `components/account/AccountShell.tsx`
  (o link "Meus pedidos" da barra)

**Critério de aceite**
As telas do casal falam em "site" onde o protótipo fala em site; "pedido"
sobrevive só no registro comercial.

**Prioridade:** Média

---

### 3.17 · Responsividade

---

#### [RESP-01] — Não há breakpoint de tablet — igual ao protótipo, registrado

**Localização**
- Todo o projeto

**Situação atual**
Tailwind `sm/md/lg` são usados, mas nenhuma tela foi desenhada para 768–1024.

**Situação esperada no protótipo**
`README.md` §5, "O que ainda não existe": *"**Breakpoint de tablet (768–1024)** —
só desktop e mobile foram desenhados."*

**Divergência identificada**
**Nenhuma.** Registrado aqui para a próxima sessão não tratar isso como bug e não
inventar um desenho de tablet que o pacote não tem.

**Alteração necessária**
Nenhuma. Se aparecer um defeito em 768–1024, ele é bug de implementação
(quebra de layout), não divergência de protótipo — corrigir caso a caso.

**Prioridade:** Baixa

---

#### [RESP-02] — Barra de abas do painel no mobile mostra só quatro abas, sem indicação de que há mais

**Localização**
- Componente: `Abas`
- Arquivo: `components/ui/prensa/Abas.tsx`

**Situação atual**
**Necessita investigação na implementação** — o componente aplica `overflow` para
rolagem horizontal, mas não foi verificado se há afordância de que existem mais
abas.

**Situação esperada no protótipo**
E1 mobile (390) mostra quatro abas — `Início · Páginas · Conteúdo · Visual` — com
`overflow:hidden` e a quarta em cinza mais claro (`#8b9099`), sinalizando que a
faixa continua. E1/E5/E7 mobile mostram conjuntos diferentes de quatro, sempre
com a última esmaecida.

**Alteração necessária**
Conferir e, se necessário, aplicar: rolagem horizontal com a última aba visível
esmaecida, ou máscara de gradiente na borda direita. `.no-scrollbar` já existe em
`globals.css`.

**Impacto técnico**
- Arquivo: `components/ui/prensa/Abas.tsx`

**Critério de aceite**
Em 390px, dá para perceber que a barra de abas continua para a direita.

**Prioridade:** Baixa

---

#### [RESP-03] — Área de toque mínima de 44px não é garantida nos controles pequenos

**Localização**
- Arquivos: `components/account/SiteControls.tsx` (setas ↑↓),
  `components/account/manage/Avisos.tsx`, `components/ui/prensa/Botao.tsx`
  (`btn-sm` = 8px de padding vertical + 13px de fonte ≈ 34px de altura)

**Situação atual**
`btn-sm` tem ~34px de altura. Alguns links já usam `min-h-11` (44px) —
`OQueFalta.tsx:84` faz isso corretamente.

**Situação esperada no protótipo**
`README.md` §4, Estados: *"Foco visível sempre, anel `--mark`. Área de toque
mínima 44px."* O desenho F4 usa botões de `44×44` no stepper.

**Divergência identificada**
A regra vale para todo controle e não é aplicada de forma consistente.

**Alteração necessária**
Acrescentar `min-height: 44px` (ou `min-h-11` + `inline-flex items-center`) em
`.btn-sm` e nos links de ação da Prensa. Em telas densas (a tabela do admin),
usar padding lateral menor para compensar.

**Impacto técnico**
- Arquivos: `app/globals.css` (`.ui-prensa .btn-sm.*`), `components/ui/prensa/*`
- Cuidado: aumentar a altura do `btn-sm` muda a densidade das listas — conferir
  `/conta/pedidos` e `/admin/pedidos`.

**Critério de aceite**
Nenhum controle interativo do produto tem menos de 44px na menor dimensão de
toque.

**Prioridade:** Média

---

### 3.18 · Elementos fora do protótipo

---

#### [EXTRA-01] — `/diagnostico` é rota de depuração exposta em produção

**Localização**
- Página: `/diagnostico`
- Arquivo: `app/diagnostico/page.tsx`

**Situação atual**
Rota pública, sem autenticação, com `DiagnosticoMovimento` e `DiagnosticoTelas`.
O próprio comentário diz: *"Não é rota de produto — pode ser apagada quando o
assunto fechar."*

**Situação esperada no protótipo**
Não existe.

**Alteração necessária**
Apagar a rota e os dois componentes, **ou** protegê-la atrás de `requireAdmin()`.
Recomendação: apagar — o assunto de movimento está fechado o bastante para o
diagnóstico não valer uma rota pública.

**Impacto técnico**
- Arquivos: `app/diagnostico/page.tsx`,
  `components/ui/DiagnosticoMovimento.tsx`, `components/ui/DiagnosticoTelas.tsx`

**Critério de aceite**
`/diagnostico` devolve 404 em produção, ou exige sessão de admin.

**Prioridade:** Média

---

#### [EXTRA-02] — `/isabelle-e-nycolas` e `/presentes` são o site legado na raiz

**Localização**
- Páginas: `/isabelle-e-nycolas`, `/presentes`
- Arquivos: `app/isabelle-e-nycolas/page.tsx`, `app/presentes/page.tsx`

**Situação atual**
Duas rotas na raiz servindo **um** casal (`getLegacySiteId()`), fora do sistema
Prensa, com `metadata` do casal e emoji em botão.

**Situação esperada no protótipo**
O produto é multi-tenant: o site de um casal vive em `/s/<slug>` e os presentes
dentro dele.

**Divergência identificada**
Rotas de raiz reservadas por um casal, e a lista de presentes dele acessível em
`/presentes` — um endereço que, num produto multi-tenant, deveria ser da
plataforma.

**Alteração necessária**
1. **Não apagar nada sem migrar**: são links possivelmente já distribuídos.
2. Migrar o casal legado para `/s/<slug>` (o backfill existe:
   `npm run backfill:legacy`), e transformar as duas rotas em `redirect`
   permanente para `/s/<slug>` e `/s/<slug>#presentes`.
3. **Consultar `regras-de-negocio`** antes — é o casamento que está no ar.

**Impacto técnico**
- Arquivos: `app/isabelle-e-nycolas/page.tsx`, `app/presentes/page.tsx`,
  `scripts/backfill-legacy-site.mjs`
- **RISCO ALTO**: mexe no site que está no ar.

**Critério de aceite**
`/isabelle-e-nycolas` e `/presentes` redirecionam para o site do casal em
`/s/<slug>`, sem perder nenhum link.

**Prioridade:** Média

---

#### [EXTRA-03] — Aba "Recados" do painel não está no protótipo

**Localização**
- Página: `/conta/pedidos/:id/recados`
- Arquivos: `app/conta/pedidos/[id]/recados/page.tsx`,
  `components/account/manage/Recados.tsx`

**Situação atual**
Oitava aba, condicionada a `tierAllowsSection(order.packageTier, "guestbook")`.

**Situação esperada no protótipo**
E desenha sete abas. O mural aparece na lista de seções de E2 ("Mural de
recados") mas não tem aba própria.

**Divergência identificada**
Uma aba a mais. **Não é defeito**: o mural existe no produto (contrariando o que
`AGENTS.md` ainda registra como não implementado) e moderar recados precisa de
uma tela.

**Alteração necessária**
Nenhuma no produto. **Atualizar o `AGENTS.md`**, cuja seção "Pendências
conhecidas" diz que o mural é *"a única seção do contrato sem implementação"* —
está desatualizado e pode induzir a próxima sessão ao erro.

**Impacto técnico**
- Arquivo: `AGENTS.md`

**Critério de aceite**
`AGENTS.md` não afirma mais que o mural não existe.

**Prioridade:** Baixa

---

#### [EXTRA-04] — `AGENTS.md` afirma que o questionário tem 7 etapas; ele tem 11

**Localização**
- Arquivo: `AGENTS.md` (tabela de Skills, linha da Skill `painel`)

**Situação atual**
A descrição da Skill `painel` diz *"questionário de 7 etapas (OrderWizard)"*.
`lib/wizard/etapas.ts` tem **11** etapas, que é exatamente o que o protótipo D
pede.

**Divergência identificada**
Documentação desatualizada — o **código está certo** e o documento errado.

**Alteração necessária**
Corrigir a descrição para 11 etapas.

**Impacto técnico**
- Arquivos: `AGENTS.md`, e a Skill `painel` em `.claude/skills/`

**Critério de aceite**
A documentação diz 11 etapas.

**Prioridade:** Baixa

---

#### [EXTRA-05] — `lib/buildPrompt.ts` descreve um fluxo manual que o produto já automatizou

**Localização**
- Arquivos: `lib/buildPrompt.ts`, `app/admin/pedidos/page.tsx:73-99`,
  `docs/prompt-gerar-site.md`

**Situação atual**
O admin mostra um bloco explicando como copiar um prompt e colar num gerador de
código para produzir o site — trabalho manual por pedido.

**Situação esperada no protótipo**
Nada disso existe. `submitOrderAction` **já provisiona o site no mesmo request**
(`app/actions/account-actions.ts:222`), e o `AGENTS.md` registra isso como a
arquitetura atual.

**Divergência identificada**
Resíduo de um fluxo anterior, exposto na interface da operação, contradizendo a
promessa "o dono não encosta no código".

**Alteração necessária**
Ver **G4-01**. Depois de remover o bloco, apagar `lib/buildPrompt.ts` e
`docs/prompt-gerar-site.md` se nada mais os usar.

**Impacto técnico**
- Arquivos: `app/admin/pedidos/page.tsx`, `lib/buildPrompt.ts`,
  `docs/prompt-gerar-site.md`
- Grep antes de apagar.

**Critério de aceite**
`/admin/pedidos` não oferece copiar prompt; nada importa `lib/buildPrompt.ts`.

**Prioridade:** Média

---

#### [EXTRA-06] — `sendPreviewReadyEmail` não está no protótipo, mas resolve um problema real

**Localização**
- Arquivo: `lib/email.ts:150`

**Situação atual**
E-mail "A prévia do site de vocês está pronta", disparado em
`submitOrderAction`.

**Situação esperada no protótipo**
Os seis e-mails do desenho não incluem este.

**Divergência identificada**
Adição ao protótipo. **Manter** — sem ele o casal só descobre a prévia voltando à
tela por conta própria, e o desenho não previu o caso.

**Alteração necessária**
Nenhuma além de **EM-01** (a casca) e **EM-07** (o emoji do assunto). Registrar
como sétimo e-mail do sistema.

**Prioridade:** Baixa

---

## 4. Funcionalidades ausentes

Tudo que o protótipo entrega e a versão atual não. Cada item aponta a
divergência que o detalha.

### 4.1 · Telas e rotas inteiras

| O que falta | Prancha | Divergência |
|---|---|---|
| `/pacotes` como página | B2 | **NAV-01** |
| `/pacotes/exemplo/:pacote` como demo com fita | B3 | **NAV-02** |
| `/pacotes/estilos` (índice/galeria) + painel de detalhe do estilo | B4–B9 | **NAV-03** |
| `/conta/pedidos/:id/compartilhar` | S4 | **NAV-04**, **S-04** |
| `/conta/avisos` (preferências de notificação) | J2 | **NAV-05**, **J-02** |
| `/conta/convites/:id` como formulário clássico (E8) | E8 | **NAV-06** |
| Etapa 0 do questionário (boas-vindas com foto) | D2 | **D-03** |
| Checkout dentro do produto (QR Pix, copia e cola, resumo) | E10.2 | **E10-01** |
| Tela de sucesso "Seu site está no ar!" | E10.2 | **E10-02** |
| Página pessoal do convidado (`/s/:slug/meu-convite` identificado) | F2 | **F2-01** |
| Tela H3 — prazo de confirmação vencido | H3 | **F4-02** |
| Tela H4 — site protegido por senha | H4 | **H-03** |
| Tela H5 — Pix de presente não confirmado | H5 | **H-04** |
| G2 — grupos e permissões da equipe | G2 | **G2-01** |
| G3 — painel de operação (4 KPIs + 2 gráficos) | G3 | **G3-01** |
| Rota `/conta/confirmar` (verificação de e-mail) | Email 01 | **EM-02** |

### 4.2 · Funcionalidades de produto

| O que falta | Prancha | Divergência |
|---|---|---|
| Casal criar / editar / apagar cotas de presente | E6 | **E6-01** |
| Bloco "botão de confirmar presença" no convite | HANDOFF §2 | **E9-01** |
| Snap e guias magenta no editor | HANDOFF §5 | **E9-03** |
| Autosave do convite (debounce 800ms + localStorage + guarda de conflito) | HANDOFF §7/§10 | **E9-04** |
| Atalhos de teclado do editor (undo, copiar, colar, duplicar, setas, z-order, zoom, pan) | HANDOFF §7 | **E9-05** |
| Multisseleção, menu de contexto, bloquear e ocultar bloco | HANDOFF §5 | **E9-07** |
| Validação de publicar convite (nomes, data, botão RSVP, slug) | HANDOFF §7/§10 | **E9-06** |
| Site com senha (`access_mode`) | E2/H4 | **E2-02**, **H-03** |
| RSVP: prazo, lugares, nomes, restrição alimentar, recado | F4 | **F4-01** |
| RSVP: tela de sucesso, adicionar à agenda, editar resposta | F4 | **F4-01** |
| Estado lido/não-lido dos avisos | J1/J3 | **J-01** |
| Preferências de notificação | J2 | **J-02** |
| Aviso de recado no mural | J1 | **J-03** |
| Filtro e busca de pedidos no admin | G4 | **G4-01** |
| Contribuições multi-site no admin | G5 | **G5-01** |
| Arrasto para reordenar seções | E2 | **E2-01** |
| Marca d'água PRÉVIA na miniatura do painel e selo na prévia | E10.1/F5 | **E10-03**, **F5-01** |

### 4.3 · Compartilhamento — a prancha inteira

| O que falta | Divergência |
|---|---|
| Metatags Open Graph em `/s/:slug` e `/c/:slug` | **S-01** |
| Geração da imagem 1200×630 (com foto e tipográfica) | **S-02** |
| Invalidação do cache do WhatsApp ao trocar a foto de capa | **S-02** |
| QR code do site (SVG + PNG 300dpi, correção H, logo ≤20%) | **S-03** |
| Plaquinha de mesa em PDF | **S-03** |
| Aba Compartilhar com link, WhatsApp, mensagens prontas e prévia do cartão | **S-04** |

### 4.4 · E-mails

| O que falta | Divergência |
|---|---|
| Casca em tabela de 600px, com logo, botão de tinta e rodapé | **EM-01** |
| Preheader em todos os e-mails | **EM-01** |
| E-mail 01 · Confirmar conta (código existe, nunca é chamado) | **EM-02** |
| E-mail 03 · Recibo do pagamento | **EM-03** |
| E-mail 04 · Seu site está no ar | **EM-04** |
| E-mail 05 · Convite para o convidado | **EM-05** |
| E-mail 06 · Lembrete de confirmação | **EM-06** |
| `List-Unsubscribe` nos e-mails de convidado | **EM-05** |

### 4.5 · Sistema (Fundação, ícones, movimento)

| O que falta | Divergência |
|---|---|
| Trilho de 1504px com margem 48 | **ARQ-01**, **ARQ-02** |
| Fonte de assinatura Pinyon Script na plataforma | **ARQ-05** |
| ~41 ícones da biblioteca | **IC-01** |
| Sistema de toast com fila | **M-03** |
| Push de rota com direção e saída | **M-01** |
| Check desenhado da confirmação (#7) | **M-04** |
| Sequência publicar → no ar (#6) | **M-05** |
| Hook `useReducedMotion()` único | **M-07** |
| Ícone tracejado nos estados vazios | **E5-02** |
| Medidor de força de senha | **C-01** |
| Cartão tipográfico "SEM FOTO DE CAPA AINDA" | **I-02** |

---

## 5. Elementos indevidos ou divergentes

Tudo que existe hoje e não deveria, ou existe em desacordo com o protótipo.

### 5.1 · Existe e não deveria existir

| Elemento | Onde | Divergência | O que fazer |
|---|---|---|---|
| Rota `/diagnostico` pública | `app/diagnostico/page.tsx` | **EXTRA-01** | Apagar ou proteger com `requireAdmin()` |
| Bloco "copiar prompt + pedido" no admin | `app/admin/pedidos/page.tsx:73-99` | **EXTRA-05**, **G4-01** | Remover; o provisionamento já é automático |
| `lib/buildPrompt.ts` + `docs/prompt-gerar-site.md` | — | **EXTRA-05** | Apagar depois de remover o bloco |
| Card "Isabelle & Nycolas" na galeria de estilos | `app/page.tsx:369-397` | **B-08** | Mover para depoimentos, com autorização, ou remover |
| Rotas `/isabelle-e-nycolas` e `/presentes` na raiz | — | **EXTRA-02** | Redirecionar para `/s/<slug>` |
| Pétalas caindo na tela de geração | `CelebrationScreen.tsx:41-49` | **M-06** | Remover — decoração, contra HANDOFF §1 |
| `blur()` na transição de rota | `PageTransition.tsx:60` | **M-01** | Remover — proibido em HANDOFF §1 |
| `window.confirm()` no editor | `EditorDeConvite.tsx:365` | **VOZ-04** | Trocar por `DialogoDestrutivo` |
| Emoji 🎁 em botão | `app/isabelle-e-nycolas/page.tsx:14` | **VOZ-05** | Remover |
| Emoji 💚 em assunto de e-mail ao casal | `lib/email.ts:158` | **EM-07**, **VOZ-05** | Remover |
| Barra de progresso no "O que falta" | `OQueFalta.tsx:40-52` | **E1-02** | Remover |
| Texto riscado no item feito | `OQueFalta.tsx:75` | **E1-02** | Remover |
| Bolinhas de swatch nos cards de estilo | `app/page.tsx:405-413` | **B-07** | Remover |
| Coluna "Registro" (`#ABCD1234`) na lista de pedidos | `app/conta/pedidos/page.tsx:105-109` | **D-01** | Remover |
| Cabeçalho "Nosso pedido / O site de vocês" no Início | `app/conta/pedidos/[id]/page.tsx:139-158` | **E1-04** | Remover, preservando o carimbo |
| Link "Sair" em texto na barra do admin | `AdminNav.tsx:87-95` | **NAV-08** | Mover para menu do avatar |
| Aviso "mandem a lista pelo WhatsApp" em Presentes | `presentes/page.tsx:155-166` | **E6-01** | Remover depois do CRUD |

### 5.2 · Existe e está em desacordo

| Elemento | Divergência |
|---|---|
| Trilho 1152/1200/1400 em vez de 1504 | **ARQ-01** |
| Páginas do admin em 672/768px | **ARQ-02** |
| `--e-suave` com a curva do Material Design | **ARQ-03** |
| Stagger de 55ms, sem teto de 8 itens | **ARQ-04** |
| Fonte de assinatura Petit Formal Script | **ARQ-05** |
| `<title>` global do casal legado | **ARQ-06** |
| `rounded-xl` (12px) no `LivePreview` | **ARQ-07** |
| "Convidados" onde o desenho diz "Grupos" | **NAV-07** |
| Botão "Começar agora" onde o desenho diz "Criar meu site" | **B-03** |
| "Criar meu site" apontando para `/conta` | **B-04** |
| Demos de estilo sem moldura de plataforma nem fita de exemplo | **B-05**, **B-06** |
| Cards de estilo com hero de 112px | **B-07** |
| Lista de pedidos em tabela sem miniatura | **D-01** |
| Números da régua em mono 28px | **E1-01** |
| Métrica "Visitas" no lugar de "Fotos" | **E1-01** |
| Reordenar por setas com o texto "arraste para reordenar" | **E2-01** |
| Visibilidade com 2 estados | **E2-02** |
| Grade de fotos sem célula de envio, tarja e overlay | **E5-01** |
| Aba Convites como grade de miniaturas | **E7-01** |
| Fontes do editor como 3 categorias genéricas | **E9-02** |
| Editor sem réguas e sem barra de zoom | **E9-08** |
| "Efetuar pagamento" / "PIX" / "..." | **VOZ-01**, **VOZ-02**, **VOZ-03** |
| Site publicado dentro de card de 1120px com sombra | **F1-02** |
| `/s/:slug/meu-convite` como busca por nome | **F2-01** |
| `/rsvp/:slug` sem o formulário desenhado | **F4-01** |
| Telas de falha sem `noindex` e com status HTTP errado (H2) | **H-01**, **H-02** |
| Casca de e-mail em `div` de 480px com botão-pílula verde | **EM-01** |
| Ícones com retângulo sem `rx` e ícone de foto sem lente | **IC-02** |

### 5.3 · Divergências assumidas — não corrigir

Decisões em que **o produto vence o desenho** (regra 2 da precedência). Estão
aqui para a próxima sessão não "consertar" o que está certo.

| Desenho | Produto | Por quê |
|---|---|---|
| G1 anuncia "Sessão protegida · 2FA ativo" | não anuncia | Não existe 2FA; anunciar proteção inexistente num painel com todos os pedidos é pior que não ter | 
| G5 tem o card "A REPASSAR" | não terá | O Pix de presente vai direto ao casal e nunca passa pela Enlace (`AGENTS.md` §3) — o número seria falso |
| B2 lista RSVP no pacote Convite e mural no pacote Site | derivado de `tierAllowsSection` | A vitrine não pode prometer seção que o molde não mostra (documentado em `Pacotes.tsx`) |
| E1 mostra "Presentes R$ 2.1k" | mostra contagem de cotas | O valor não existe: o Pix não passa por nós (`siteMetrics.ts`) |
| §3.1 do handoff pede ~6s de animação de geração | dura o tempo real (~1s) | Espera inventada foi crítica explícita do dono; o handoff também diz "ou até o backend responder" |
| C2 pede "Seu nome" individual e não tem WhatsApp | "Nomes de vocês" + WhatsApp opcional | O produto é para casal; o WhatsApp é o canal de suporte |
| Emails: o desenho não prevê "prévia pronta" | existe | Sem ele o casal não descobre a prévia (**EXTRA-06**) |
| E não prevê a aba Recados | existe | O mural foi implementado e precisa de moderação (**EXTRA-03**) |
| README §5: sem breakpoint de tablet | idem | Decisão consciente do pacote (**RESP-01**) |

---

## 6. Plano consolidado de implementação

Sete levas. Cada uma é entregável sozinha; as dependências entre levas estão
explícitas. **Antes de qualquer leva que toque banco: `npm run backup:full` e
rollback escrito** (`AGENTS.md` §2, Skill `banco`).

### Leva 0 · Fundação e limpeza — sem dependências, desbloqueia tudo

Pode ser feita inteira em paralelo, por ser mecânica e de baixo risco.

1. **ARQ-01** — classe `trilho` (1504/48) e aplicação na vitrine e na conta
2. **ARQ-02** — trilho nas quatro páginas do admin *(depende de ARQ-01)*
3. **ARQ-03**, **ARQ-04**, **ARQ-07** — tokens de curva, stagger e raio
4. **ARQ-06** — `<title>` global
5. **IC-01**, **IC-02** — completar a biblioteca de ícones *(desbloqueia E5-02,
   E10-04, J-03, S-04)*
6. **VOZ-01**, **VOZ-03**, **VOZ-05** — varredura de "PIX", `...` e emoji
7. **EXTRA-01** — apagar/proteger `/diagnostico`
8. **EXTRA-04** — corrigir `AGENTS.md` (11 etapas)
9. **EXTRA-03** — corrigir `AGENTS.md` (mural existe)

> **Validar depois:** `npm run build` (o `next build` é a verdade — `AGENTS.md`
> §4) e uma passada visual em `/`, `/conta`, `/conta/pedidos/<id>`, `/admin/pedidos`.

### Leva 1 · Compartilhamento — a maior lacuna de valor por esforço

Depende da Leva 0 (ícones). Não toca banco.

1. **S-02** — imagem OG 1200×630 (duas variantes) + versionamento
2. **S-01** — metatags OG/Twitter em `/s` e `/c` *(depende de S-02)*
3. **S-03** — QR do site (SVG/PNG)
4. **NAV-04** + **S-04** — aba Compartilhar *(depende de S-01, S-02, S-03)*

> **Validar:** colar o link num validador de OG e no próprio WhatsApp; conferir
> que site não publicado **não** emite OG.

### Leva 2 · O casal manda no próprio site

Depende da Leva 0. **E6-01 é a divergência Crítica de maior impacto de produto.**

1. **E6-01** — CRUD de cotas na aba Presentes *(consultar `regras-de-negocio`
   antes)*
2. **E5-01**, **E5-02** — grade de fotos do desenho
3. **E1-03** — aviso de chave Pix no Início
4. **E1-01**, **E1-02**, **E1-04** — régua de números, checklist, cabeçalho
5. **I-01**, **I-02**, **I-03** — estados de primeira vez
6. **D-01**, **D-02** — lista de pedidos em cards *(depende de I-02 para o
   cartão sem foto)*
7. **D-03** — etapa 0 do questionário
8. **VOZ-06** — vocabulário "site" no painel do casal

> **Validar:** criar uma conta nova, passar pelo questionário inteiro, chegar ao
> painel no minuto zero, subir uma foto, criar uma cota. Nenhuma tela pode pedir
> WhatsApp.

### Leva 3 · Editor de convite

Depende da Leva 0. `E9-01` é Crítica e desbloqueia `E9-06`.

1. **E9-01** — bloco de botão de RSVP
2. **E9-02** — as cinco fontes nomeadas *(com mapeamento dos valores antigos)*
3. **E9-06** — validação de publicar *(depende de E9-01)*
4. **E9-03** — snap e guias
5. **E9-04** — autosave + guarda de conflito
6. **E9-05**, **VOZ-04** — atalhos e diálogo destrutivo
7. **E9-07** — multisseleção, menu de contexto, bloquear/ocultar
8. **E9-08** — réguas e barra de zoom
9. **NAV-06** — separar E8 de E9 *(decidir o modelo de convidados antes;
   consultar `regras-de-negocio`)*
10. **E7-01** — aba Convites com status e ações *(depende de NAV-06)*

> **Validar:** abrir um convite salvo **antes** da mudança e conferir que ele
> renderiza igual; publicar um convite sem botão de RSVP tem de ser recusado.

### Leva 4 · Pagamento e publicação

Depende da Leva 0. **E10-01 precisa de investigação técnica antes de estimar.**

1. **E10-03** — faixa de aviso, marca d'água e "o que muda ao publicar"
2. **E10-04**, **VOZ-02** — copy e componente do botão
3. **E10-01** — checkout no produto *(investigar antes se o AbacatePay devolve o
   BR Code)*
4. **E10-02** + **M-05** — tela de sucesso com a sequência #6
5. **EM-01** — casca dos e-mails *(pré-requisito dos demais)*
6. **EM-03**, **EM-04** — recibo e site no ar *(dependem de EM-01)*
7. **EM-02** — verificação de e-mail *(depende de EM-01; toca banco)*
8. **EM-07** — assuntos e preheaders

> **Validar:** um pagamento de ponta a ponta em ambiente de teste; conferir que o
> recibo é enviado **uma vez só** mesmo com webhook e retorno do checkout.

### Leva 5 · Convidado — **a leva de maior risco**

Depende das Levas 0 e 1. **Toda ela mexe em rota com gente real.**

Ordem obrigatória:
1. `npm run backup:full` + rollback escrito
2. Estender `app/actions/rsvp-actions.test.ts` e `components/RsvpCard.test.tsx`
   **antes** de mexer na tela
3. **F4-02** — prazo de confirmação (menor mudança, valida o caminho)
4. **F4-01** + **M-04** — o formulário e a tela de sucesso *(migração aditiva)*
5. **F2-01** — página pessoal do convidado *(depende de F4-01)*
6. **H-01**, **H-02** — saídas e `noindex` nas telas de falha
7. **E2-02** + **H-03** — site com senha *(migração aditiva; consultar
   `regras-de-negocio`)*
8. **H-04** — Pix de presente não confirmado *(investigar se o produto sabe)*
9. **F5-01** — selo PRÉVIA
10. **F1-01**, **F1-02** — barra fixa e largura do site publicado *(rodar
    `npm run shot:template` antes e depois — Skill `molde`)*

> **Validar:** abrir um `/rsvp/<slug>` real (em cópia de banco de teste), conferir
> que as 22 confirmações existentes continuam válidas; `npm run test` verde;
> `npm run verify:template` verde.

### Leva 6 · Operação (admin)

Depende de ARQ-02.

1. **G3-01** — painel de operação
2. **G4-01** + **EXTRA-05** — tabela de pedidos, filtros, busca; remover o prompt
3. **G5-01** — contribuições multi-site
4. **G2-01** + **NAV-07** — decidir e implementar grupos de acesso *(consultar
   `regras-de-negocio`; toca banco)*
5. **G-06**, **NAV-08** — cabeçalhos e menu do avatar

### Leva 7 · Vitrine, notificações e polimento

1. **NAV-01**, **NAV-02**, **NAV-03** — rotas da vitrine
2. **B-01**, **B-03**, **B-04**, **B-05**, **B-06**, **B-07**, **B-08** — home e
   demos
3. **B-02** — números do hero *(consultar `regras-de-negocio`)*
4. **C-01**, **C-02**, **C-03** — telas de conta
5. **E2-01** — arrasto de seções
6. **E3-01**, **E4-01** — abas Conteúdo e Visual
7. **J-01**, **J-02**, **NAV-05**, **J-03**, **J-04** — notificações *(J-01 e
   J-02 tocam banco)*
8. **EM-05**, **EM-06** — e-mails de convidado *(dependem de decisão de produto
   e migração)*
9. **M-01**, **M-02**, **M-03**, **M-06**, **M-07** — movimento
10. **RESP-02**, **RESP-03** — abas no mobile e área de toque
11. **ARQ-05**, **ARQ-08** — fonte de assinatura e escopo de fundo
12. **D-04**, **D-05** — revisão do questionário
13. **EXTRA-02** — migrar as rotas do casal legado *(RISCO ALTO)*

### 6.1 · Alterações que podem ser feitas juntas

- Leva 0 inteira, num commit por grupo (tokens / ícones / copy / limpeza).
- **S-01 + S-02** — a metatag não vale nada sem a imagem.
- **E10-02 + M-05** — a tela e o movimento dela são a mesma entrega.
- **F4-01 + M-04** — idem.
- **E1-01 + E1-02 + E1-04** — todas na mesma tela.
- **VOZ-01 + VOZ-03 + VOZ-05** — uma varredura só.
- **G3-01 + G4-01 + G5-01** — depois de ARQ-02, compartilham o cabeçalho.

### 6.2 · Alterações que exigem validação depois de implementar

| Alteração | Como validar |
|---|---|
| **ARQ-01/ARQ-02** (largura) | Medir o `x` das arestas em 1600px em 4 telas |
| **F1-02** (largura do site) | `npm run shot:template` antes/depois nos 6 moldes |
| **F1-01** (barra do site) | `npm run verify:template` — cor tem de vir do ThemeSpec |
| **F4-01/F4-02** (RSVP) | `npm run test` + conferir as confirmações existentes |
| **E2-02, EM-02, J-01, J-02, G2-01, EM-05** (migrações) | `db:rehearse` antes de `db:migrate`; backup antes |
| **E9-02** (fontes do convite) | Abrir convites salvos antes da mudança |
| **E6-01** (cotas) | `updateTag(sitePixTag(siteId))` ao salvar — `AGENTS.md` §3 |
| **S-02** (imagem OG) | Validador de OG + WhatsApp real; peso < 300 KB |
| **EM-01** (casca) | `npm run email:test` em Gmail e Apple Mail, claro e escuro |
| Qualquer rota nova | `npm run build` — o `next dev` é permissivo, o build é estrito |

### 6.3 · Decisões que precisam do dono antes de codar

Levar ao agente **`regras-de-negocio`**, agrupadas:

1. **E6-01** — o que é uma cota, limite por pacote, piso de valor.
2. **E10-01** — métodos de pagamento (existe cartão?), quem gera o QR.
3. **E2-02 / H-03** — site com senha é recurso de pacote?
4. **F4-01** — o que o convidado responde (restrição alimentar é dado pessoal).
5. **F4-02** — quem é "os noivos" no botão "Falar com os noivos"?
6. **EM-05 / EM-06** — enviar e-mail a convidados em nome do casal (LGPD).
7. **G2-01** — grupos de acesso e permissões da equipe.
8. **B-02 / D-03 / I-03** — promessas de tempo ("10 min", "~5 min", "cinco
   minutos").
9. **B-08 / EXTRA-02** — expor o casamento de um casal real na vitrine.
10. **H-04** — o que a Enlace pode prometer quando um Pix de presente falha.

---

## 7. Checklist final para implementação

Uma tarefa por divergência, agrupadas pelas levas da §6. Marcar conforme
concluir.

**Duas divergências não têm tarefa, de propósito:** `RESP-01` (breakpoint de
tablet) e `EXTRA-06` (e-mail de prévia pronta) são registros de decisão — a
conclusão da auditoria é que **não há o que alterar** neles. Estão na §3 para a
próxima sessão não tratá-los como pendência.

### Leva 0 · Fundação e limpeza

- [ ] **ARQ-01** Criar a classe `trilho` (max 1504, margem 48/24) e aplicá-la em `app/page.tsx`, `AccountShell`, `Pacotes`, `AdminNav`, `preview/[token]`
- [ ] **ARQ-02** Trocar `max-w-3xl`/`max-w-2xl` por `trilho` nas quatro páginas de `app/admin/`
- [ ] **ARQ-03** Trocar `--e-suave` para `cubic-bezier(0.65, 0, 0.35, 1)`
- [ ] **ARQ-04** Trocar o stagger de 55ms para 60ms e acrescentar o teto de 8 itens
- [ ] **ARQ-06** Trocar o `<title>` global por `Enlace · Sites de casamento` com `template`
- [ ] **ARQ-07** Declarar `border-radius: 3px` nas `.surface-*`; trocar `rounded-xl` do `LivePreview`
- [ ] **IC-01** Acrescentar os ~41 ícones que faltam em `Icone.tsx`
- [ ] **IC-02** Suportar `<rect rx>` no `Icone` e corrigir foto/calendário/cadeado/presente
- [ ] **VOZ-01** Trocar `PIX` por `Pix` em toda string de interface
- [ ] **VOZ-03** Trocar `...` por `…` em toda string de interface
- [ ] **VOZ-05** Remover emoji de rótulos de botão e de assunto de e-mail ao casal
- [ ] **EXTRA-01** Apagar `/diagnostico` (ou proteger com `requireAdmin`)
- [ ] **EXTRA-03** Corrigir o `AGENTS.md`: o mural de recados existe
- [ ] **EXTRA-04** Corrigir o `AGENTS.md`: o questionário tem 11 etapas

### Leva 1 · Compartilhamento

- [ ] **S-02** Criar `opengraph-image.tsx` para `/s/[slug]` e `/c/[slug]` (variante com foto e variante tipográfica)
- [ ] **S-02** Versionar a imagem para invalidar o cache do WhatsApp ao trocar a capa
- [ ] **S-01** Emitir `og:title`, `og:description`, `og:image`, `og:url`, `twitter:card`
- [ ] **S-01** Garantir que site não publicado e `/preview` **não** emitem OG
- [ ] **S-03** Criar a rota de QR (SVG + PNG 300dpi, correção H, margem 4 módulos, logo ≤20%)
- [ ] **S-03** Gerar a plaquinha de mesa em PDF
- [ ] **NAV-04** Acrescentar a aba "Compartilhar" em `app/conta/pedidos/[id]/layout.tsx`
- [ ] **S-04** Criar `/conta/pedidos/[id]/compartilhar` com link, WhatsApp, mensagens prontas, prévia do cartão, QR e visitas

### Leva 2 · O casal manda no próprio site

- [ ] **E6-01** Ligar `criarCotaAction`/`editarCotaAction`/`apagarCotaAction` à interface da aba Presentes
- [ ] **E6-01** Montar as duas colunas de E6 (cards com barra de progresso + card oliva de arrecadado + card de chave Pix)
- [ ] **E6-01** Remover o texto que manda o casal pedir cotas pelo WhatsApp
- [ ] **E5-01** Refazer a grade de fotos: chips de filtro, célula de envio, tarja CAPA, overlay de ações
- [ ] **E5-02** Acrescentar o ícone tracejado de 64px em `EstadoVazio`
- [ ] **E1-03** Mostrar o aviso de chave Pix no topo do Início
- [ ] **E1-01** Números da régua em Instrument Serif 44px; acrescentar o bloco de Fotos
- [ ] **E1-02** Remover a barra de progresso e o texto riscado do checklist; marcar o próximo item em `--warn`
- [ ] **E1-04** Remover o cabeçalho "Nosso pedido / O site de vocês", preservando o carimbo
- [ ] **I-01** Aplicar os três estados de linha em `PrimeiraVez` (só o próximo em tinta)
- [ ] **I-02** Criar o cartão tipográfico "SEM FOTO DE CAPA AINDA"
- [ ] **I-03** Refazer o estado vazio de `/conta/pedidos` em duas colunas com foto
- [ ] **D-01** Refazer a lista de pedidos como cards (miniatura, endereço, "Pagar e publicar", % do rascunho)
- [ ] **D-02** Corrigir o cabeçalho de `/conta/pedidos` (sobrancelha em `--mark`, "Seus sites", botão G "+ Novo site")
- [ ] **D-03** Criar a etapa 0 (boas-vindas) de `/conta/pedido/novo`
- [ ] **VOZ-06** Trocar "pedido" por "site" nas telas do casal

### Leva 3 · Editor de convite

- [ ] **E9-01** Acrescentar `BlocoBotao` (RSVP) ao modelo, ao parser, ao render e ao export
- [ ] **E9-02** Trocar as 3 categorias de fonte pelos 5 tokens nomeados, com mapeamento dos valores antigos
- [ ] **E9-06** Implementar a validação de publicar (nomes, data, botão RSVP, slug) no cliente e no servidor
- [ ] **E9-03** Implementar snap (6px) e guias magenta
- [ ] **E9-04** Implementar autosave (debounce 800ms), indicador "salvo há X", `localStorage` e guarda por `updatedAt`
- [ ] **E9-05** Acrescentar os atalhos de teclado do handoff §7
- [ ] **VOZ-04** Trocar o `confirm()` por `DialogoDestrutivo`
- [ ] **E9-07** Implementar multisseleção, menu de contexto, bloquear e ocultar
- [ ] **E9-08** Acrescentar réguas e barra de zoom com as dimensões
- [ ] **NAV-06** Mover o editor para `/conta/convites/[id]/editor` e criar E8 em `/conta/convites/[id]`
- [ ] **E7-01** Refazer a aba Convites com cartões de resumo, status e ação de publicar

### Leva 4 · Pagamento e publicação

- [ ] **E10-03** Acrescentar a faixa "Seu site está pronto — e ainda invisível", a marca d'água PRÉVIA e o card "O que muda ao publicar"
- [ ] **E10-04 / VOZ-02** Trocar o botão para "Pagar e publicar" com `Botao` + rodinha e o rodapé com escudo
- [ ] **E10-01** Investigar se o AbacatePay devolve o BR Code; se sim, criar a tela de checkout com QR e copia e cola
- [ ] **E10-02 / M-05** Criar a tela "Seu site está no ar!" com o `pop` do selo e o fade da marca d'água
- [ ] **EM-01** Reescrever a casca dos e-mails: tabela 600px, logo, botão de tinta, rodapé, preheader, link em texto puro
- [ ] **EM-03** Criar o e-mail de recibo, idempotente
- [ ] **EM-04** Criar o e-mail "seu site está no ar"
- [ ] **EM-02** Reconstruir a verificação de e-mail (repositório, action, `/conta/confirmar`, chamada em `signupAction`)
- [ ] **EM-07** Corrigir assuntos e acrescentar preheaders

### Leva 5 · Convidado (RISCO ALTO)

- [ ] **Pré** `npm run backup:full` + rollback escrito
- [ ] **Pré** Estender `rsvp-actions.test.ts` e `RsvpCard.test.tsx` antes de mexer na tela
- [ ] **F4-02** Ler `rsvpDeadline` em `/rsvp/[slug]`, renderizar H3 com HTTP 200 e travar a action
- [ ] **F4-01** Migração aditiva para restrição alimentar e recado
- [ ] **F4-01** Refazer `/rsvp/[slug]`: prazo, dois cards de escolha, stepper de lugares, nomes, chips de restrição, recado, botão único
- [ ] **F4-01 / M-04** Criar a tela de sucesso com o check desenhado, "Adicionar à agenda" e "Editar resposta"
- [ ] **F2-01** Transformar `/s/[slug]/meu-convite` na página pessoal (mantendo a busca como estado inicial)
- [ ] **H-01** Tratar convite despublicado dentro de `/c/[slug]` com HTTP 410 e o cartão do casamento
- [ ] **H-02** Declarar `noindex` em todas as telas de falha
- [ ] **E2-02** Migração aditiva `access_mode` + `access_password_hash`; três opções na aba Páginas
- [ ] **H-03** Criar a tela de senha em `/s/[slug]` com erro abaixo do campo e limite por IP
- [ ] **H-04** Investigar se o produto detecta Pix de presente não confirmado; se sim, criar H5
- [ ] **F5-01** Acrescentar o selo circular PRÉVIA em `/preview/[token]`
- [ ] **F1-01** Acrescentar a barra fixa ao site publicado, com âncoras das seções ligadas
- [ ] **F1-02** Remover o teto de 1120px e a sombra do site publicado
- [ ] **Pós** `npm run test` + `npm run verify:template` + `npm run shot:template`

### Leva 6 · Operação (admin)

- [ ] **G3-01** Criar as consultas de operação e a tela G3 (4 KPIs + gráfico de 14 dias + por pacote)
- [ ] **G4-01** Refazer `/admin/pedidos` como tabela de 7 colunas com chips de filtro e busca
- [ ] **EXTRA-05** Remover o bloco de prompt e apagar `lib/buildPrompt.ts` e `docs/prompt-gerar-site.md`
- [ ] **G5-01** Trocar `/admin/presentes` para contribuições multi-site com a coluna do casal e o total do mês
- [ ] **G2-01** Decidir e implementar (ou registrar como pendente) os grupos de acesso da equipe
- [ ] **NAV-07** Ajustar o rótulo da barra conforme a decisão de G2-01
- [ ] **G-06** Padronizar os cabeçalhos das quatro páginas do admin
- [ ] **NAV-08** Mover "Sair" para um menu no avatar

### Leva 7 · Vitrine, notificações e polimento

- [ ] **NAV-01** Restaurar `/pacotes` como página (ou remover o item de menu)
- [ ] **NAV-02** Redirecionar `/pacotes/exemplo/:pacote` para o estilo com o pacote
- [ ] **NAV-03** Criar o índice `/pacotes/estilos` com a galeria e o painel de detalhe
- [ ] **B-01** Mover "Como funciona" para logo depois do hero
- [ ] **B-02** Decidir o segundo número do hero
- [ ] **B-03** Trocar "Começar agora" por "Criar meu site"
- [ ] **B-04** Apontar o CTA final para `/conta/criar`
- [ ] **B-05** Envolver as rotas de estilo na casca da vitrine (layout com a barra)
- [ ] **B-06** Acrescentar a fita de exemplo em `TemplateChrome`
- [ ] **B-07** Refazer os cards de estilo (hero de 200px, sobrancelha, rodapé em uma linha, sem bolinhas)
- [ ] **B-08** Mover ou remover o card "Isabelle & Nycolas" da galeria
- [ ] **C-01** Acrescentar o medidor de força de senha e a linha de Termos
- [ ] **C-02** Refazer `/conta` em duas colunas com o card oliva e o rodapé de sessão
- [ ] **C-03** Botão "Enviar link" no tamanho G
- [ ] **E2-01** Implementar arrasto para reordenar (mantendo as setas)
- [ ] **E3-01** Agrupar o `ContentEditor` em CAPA / HISTÓRIA / EVENTO e mostrar o estado de salvamento na barra
- [ ] **E4-01** Conferir e ajustar as miniaturas de estilo (70px, fundo e fonte do estilo, check)
- [ ] **J-01** Migração de estado lido/não-lido + marcação após 2s + "marcar tudo como lido"
- [ ] **NAV-05 / J-02** Criar `/conta/avisos` com a tabela de preferências
- [ ] **J-03** Acrescentar o aviso de recado no mural
- [ ] **J-04** Garantir link de ação em todo aviso acionável
- [ ] **EM-05** Decidir e (se aprovado) implementar o e-mail de convite com `List-Unsubscribe`
- [ ] **EM-06** Implementar o lembrete de confirmação por cron
- [ ] **M-01** Corrigir o push de rota (translateX 22px, 620ms, sem blur, com direção e saída)
- [ ] **M-02** Corrigir a transição de etapa (22px, `--t-lento`, atraso 120ms)
- [ ] **M-03** Criar o sistema de toast com fila (máx 3, 4s)
- [ ] **M-06** Refazer a tela de geração (moldura de navegador, fundo `#e9e9e3`, 3 status, selo, sem pétalas, estado de falha)
- [ ] **M-07** Criar `useMovimentoReduzido()` e remover as checagens duplicadas
- [ ] **RESP-02** Sinalizar que a barra de abas continua no mobile
- [ ] **RESP-03** Garantir 44px de área de toque em todo controle
- [ ] **ARQ-05** Acrescentar Pinyon Script como `--f-ui-script` e usá-la na vitrine
- [ ] **ARQ-08** Aplicar `uiPrensa` em `/diagnostico` (se a rota sobreviver)
- [ ] **D-04** Acrescentar a sobrancelha "REVISÃO" à última etapa
- [ ] **D-05** Conferir/refazer a etapa de revisão como quatro linhas com "Editar"
- [ ] **EXTRA-02** Migrar `/isabelle-e-nycolas` e `/presentes` para `redirect` a `/s/<slug>`

---

## Apêndice · Como usar este arquivo

1. Escolha uma leva da §6. Não pule a Leva 0 — ela desbloqueia as outras.
2. Para cada item, leia a divergência completa na §3 pelo ID.
3. Execute a **Alteração necessária**; consulte as Skills citadas
   (`banco`, `cache-e-build`, `molde`, `fotos`, `movimento`, `painel`,
   `texto-do-casal`, `testes`) e o agente `regras-de-negocio` onde indicado.
4. Valide pelo **Critério de aceite** do item e pela §6.2 da leva.
5. Rode `npm run build` antes de confiar em qualquer rota nova — `next dev` é
   permissivo, `next build` é estrito (`AGENTS.md` §4).

**Três coisas que nenhuma leva pode quebrar** (`AGENTS.md` §2 e §3):

1. `/rsvp/<slug>` continua funcionando, e slug de grupo existente é imutável.
2. Migração é aditiva; nunca `drizzle-kit push`; `backup:full` antes.
3. Não existe chave Pix de fallback — `getSitePix` devolve `null` sem a chave do
   casal, e `lib/pix/sem-chave-global.test.ts` reprova se a constante voltar.

