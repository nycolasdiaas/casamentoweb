# SDD — Geração automática de sites de casamento

**Status:** proposta (não implementado)
**Autor:** levantamento técnico sobre o código em `main` (commit `3c09cac`)
**Data:** 2026-07-27

---

## 1. Contexto: o que existe hoje

A plataforma já tem, funcionando:

- Contas de casal (`users`) e de admin (`admins`), sessão por cookie HMAC assinado em [proxy.ts](../proxy.ts).
- Fluxo comercial completo: pedido (`orders`), esteira de status, cobrança PIX via AbacatePay, webhook, auditoria (`order_audit_log`), rate limiting, reset de senha.
- 6 templates visuais em [app/pacotes/estilos/](../app/pacotes/estilos/) — **5.121 linhas de JSX**, com conteúdo do casal fictício "Ana & Pedro" escrito à mão dentro do JSX.
- RSVP e lista de presentes funcionando — **para um único casamento**.

### 1.1 O gargalo real

O pedido do casal termina em [lib/buildPrompt.ts](../lib/buildPrompt.ts): o admin abre `/admin/pedidos`, copia um prompt + JSON, cola num LLM, **recebe o código de um site novo, hospeda em algum lugar à mão e cola a URL de volta** em `previewUrl`/`siteUrl` ([admin-order-actions.ts](../app/actions/admin-order-actions.ts)).

Ou seja: **cada site vendido é um projeto artesanal**. Isso não escala, não é editável pelo casal, não é revisável, e cada correção de bug num template não chega nos sites já entregues.

### 1.2 O bloqueio técnico que ninguém vê

`groups`, `guests`, `gifts` e `gift_contributions` **não têm coluna de dono**. `listGifts()` em [lib/repositories/gifts.ts:36](../lib/repositories/gifts.ts#L36) retorna *todos* os presentes do banco; `getGroupBySlug()` busca em escopo global.

> O banco de hoje comporta exatamente **um** casamento. O segundo casal veria a lista de presentes do primeiro. Isto é um vazamento de dados entre clientes, não só uma limitação — e é o primeiro item a corrigir.

---

## 2. Objetivos e não-objetivos

### Objetivos

1. Pedido enviado → site no ar **sem toque humano**, em segundos.
2. Um template é um **molde**: dados do casal entram, site sai. Corrigir o molde corrige todos os sites.
3. O casal edita o próprio conteúdo e vê o resultado na hora.
4. Isolamento total entre casais.
5. Custo marginal por site publicado ≈ R$ 0.

### Não-objetivos (explicitamente fora)

- Editor "arrasta-e-solta" tipo Wix. Escolha guiada + edição de conteúdo, não layout livre.
- LLM gerando **código** por casal (ver §4.1 — rejeitado).
- Microserviços, Kubernetes, backend separado. Ver §9.
- Reescrever o que já funciona: auth, pagamento, pedidos e auditoria ficam como estão.

---

## 3. A decisão central

> **O site do casal é renderizado a partir de dados, em tempo de requisição, com cache — não é código gerado e publicado por casal.**

Um único código-fonte. Uma rota. `N` casais. O que muda entre eles é uma linha no banco.

### 3.1 Alternativas consideradas

| Abordagem | Veredito |
|---|---|
| **LLM gera código por casal** (fluxo atual) | ❌ Rejeitado. Código não revisado em produção, impossível de manter, quebra a cada update do Next, casal não consegue editar, sem correção retroativa, custo e latência por pedido. |
| **Gerar arquivos + deploy por casal** (static export por site) | ❌ Rejeitado agora. Precisa de pipeline de build/deploy, storage e domínio por site; edição vira rebuild. Complexidade de plataforma sem ganho real nesta escala. |
| **Renderização dirigida por dados + `use cache`** | ✅ **Escolhido.** Um deploy, edição instantânea, correção global, performance de site estático via PPR. |

### 3.2 Por que isso funciona bem no Next 16

Confirmado em `node_modules/next/dist/docs/` (o `AGENTS.md` deste repo manda ler de lá — e com razão, o Next 16 mudou bastante):

- **`cacheComponents: true`** ([config/next-config-js/cacheComponents.md](../node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/cacheComponents.md)) — flag estável (não é mais `experimental.ppr`/`dynamicIO`). Liga `use cache` e torna **PPR o comportamento padrão**.
- **`use cache` + `cacheLife` + `cacheTag`** — a página do casal fica em cache com tag `site:<id>`; publicar/editar chama `updateTag` e o site atualiza na hora.
- **PPR**: shell estático servido imediatamente, partes dinâmicas (RSVP, contador de presentes) chegam via stream. O convidado no 4G abre rápido.
- **`'use cache: remote'`** — cache durável compartilhado entre instâncias serverless, se/quando o cache em memória se mostrar insuficiente.
- **`proxy.ts`** (o antigo `middleware.ts`) já existe no projeto e é onde o roteamento por domínio vai entrar.

**Ação necessária:** ligar `cacheComponents: true` em [next.config.ts](../next.config.ts) — hoje está desligado. Isso muda o modelo de renderização do app inteiro, então entra numa fase própria (§10, Fase 1) com revisão de cada rota existente.

---

## 4. Arquitetura de renderização

### 4.1 As quatro camadas

```
  Preferências do casal (pedido)
            ↓
  [1] ThemeSpec ......... tokens: paleta, fontes, ornamento, densidade
            ↓
  [2] Template (molde) .. componentes de seção que consomem tokens
            ↓
  [3] Conteúdo .......... dados reais do casal, vindos do banco
            ↓
  [4] Gating por pacote . quais seções existem (convite/site/para-sempre)
            ↓
        Site renderizado
```

### 4.2 `ThemeSpec` — o contrato de estilo

```ts
// lib/theme/spec.ts
export type ThemeSpec = {
  version: 1;
  palette: {
    paper: string;   // fundo do cartão
    ink: string;     // texto principal
    accent: string;  // dourado, terracota...
    outer: string;   // fundo letterbox
    muted: string;
  };
  fonts: {
    display: FontStyleId;          // títulos
    body: FontStyleId;             // corpo
    script?: FontStyleId;          // caligráfica (opcional)
  };
  ornament: "none" | "frame" | "floral" | "geometric";
  radius: "sharp" | "soft" | "round";
  density: "compact" | "regular" | "airy";
};
```

Resolução: `ThemeSpec = preset do template  ←  overrides do casal (primaryColor, fontStyle...)`.
Validado com **Zod** na escrita (dependência nova — hoje o projeto não tem validação de schema).

Os tokens viram **CSS custom properties** num wrapper, e os templates passam a usar `var(--ink)` no lugar dos hex fixos:

```tsx
<div style={{ "--paper": t.palette.paper, "--ink": t.palette.ink, ... }}>
```

Isso torna a migração dos 6 templates quase mecânica: hoje eles já usam `#3d4a36` literal em todo canto, é um find-and-replace guiado.

### 4.3 Fontes — restrição importante

`next/font/google` **não aceita chamada dinâmica**: precisa de chamadas literais em escopo de módulo. Já existe a prova de que o padrão funciona — [OrderForm.tsx](../components/account/OrderForm.tsx#L57) instancia as 34 fontes estaticamente.

Solução: `lib/fonts/registry.ts` central, `FontStyleId → { variable, className }`, importado pelo renderer.

**Risco de performance — MEDIDO na Fase 1 (era hipótese, agora é número):**

Medido no build de produção, na página `/s/ana-e-pedro` (molde Clássico, que usa 3 fontes):

| | |
|---|---|
| Chunk CSS carregado pela página | **83,6 KB** (render-blocking) |
| Regras `@font-face` | 243, em 68 famílias (34 fontes × pesos/estilos + fallbacks) |
| Bytes das 3 fontes de fato usadas | 25,2 KB |
| **Desperdício** | **51,1 KB — 61% do chunk** |

Nuance importante: os arquivos `.woff2` das fontes não usadas **não** são baixados (o browser só busca a fonte que algum elemento aplica). O custo é de **CSS**, não de download de fonte. Mas são 51 KB de CSS bloqueante num convite que o convidado abre no 4G — material o suficiente para agir.

**Causa:** o registry referencia as 34 estaticamente (obrigatório, `next/font` não aceita chamada dinâmica), então o chunk de qualquer página que importe o registry carrega o CSS das 34.

**DECIDIDO E IMPLEMENTADO: fontes por molde.** Cada template declara as suas no próprio módulo (`lib/templates/<id>/fonts.ts`); a rota importa só o molde que renderiza. O Clássico oferece 8, curadas para o desenho.

Resultado medido no mesmo cenário:

| | Antes (34 num registry) | Depois (8 por molde) |
|---|---|---|
| Chunk de fontes | 83,6 KB | **36,2 KB** (−57%) |
| CSS total da página | 140,1 KB | **92,7 KB** (−34%) |
| Regras `@font-face` | 243 | 99 |

**Ganho de produto junto:** uma Amatic SC ou Caveat destruiria o Clássico. Não oferecer é curadoria, não limitação.

**Desperdício residual, sendo honesto:** sobram 5 fontes que o molde oferece e este casal não escolheu. Zerar isso exigiria emitir só as 3 escolhidas — impossível com declaração estática, já que a escolha é dado de runtime. **Per-molde é o piso prático** enquanto usarmos `next/font/google`. Se um dia doer, o caminho é auto-hospedar com `next/font/local` e gerar o `@font-face` só das escolhidas.

**Armadilha do `next/font` (custou um build):** cada fonte precisa ser atribuída a um `const` no escopo do módulo. Declarar direto dentro do objeto (`{ cormorant: Cormorant_Garamond({...}) }`) falha com *"Font loaders must be called and assigned to a const in the module scope"*.

Como o catálogo virou por molde, o tema gravado no banco pode conter uma fonte que o template atual não oferece (o casal trocou de template depois de escolher). `clampThemeFonts` resolve silenciosamente para o padrão do molde — sem isso, a página renderizaria sem `@font-face` e cairia na fonte do sistema.

### 4.4 Contrato de template

```ts
// lib/templates/registry.ts
export type SectionKey =
  | "cover" | "countdown" | "story" | "details" | "gallery"
  | "rsvp" | "gifts" | "guestbook" | "album" | "footer";

export type TemplateModule = {
  id: TemplateStyleId;
  meta: TemplateStyle;              // já existe em lib/templates.ts
  defaultTheme: ThemeSpec;
  sections: Partial<Record<SectionKey, ComponentType<SectionProps>>>;
};

export const TEMPLATE_REGISTRY: Record<TemplateStyleId, TemplateModule> = {...};
```

Cada seção recebe `{ content, theme, tier }` e devolve JSX. O comportamento compartilhado (contagem regressiva, modal de presente, mural) já está isolado em [useWeddingDemoState.ts](../components/templates/useWeddingDemoState.ts) — vira o hook de produção, trocando `localStorage` por server actions.

### 4.5 Gating por pacote

Já existe `tierIncludes()` em [lib/packages.ts:85](../lib/packages.ts#L85). Formaliza-se como tabela:

| Seção | convite | site | para-sempre |
|---|:--:|:--:|:--:|
| cover, countdown, story, details, gallery, footer | ✅ | ✅ | ✅ |
| save-the-date, **rsvp** | — | ✅ | ✅ |
| **gifts** (PIX), **guestbook**, **album** | — | — | ✅ |
| domínio próprio | — | — | ✅ |

---

## 5. Modelo de dados

### 5.1 Tenant raiz (novo)

```sql
create type site_status as enum
  ('provisioning','preview','published','archived');

create table sites (
  id             uuid primary key default gen_random_uuid(),
  -- NULL de propósito: o casamento real que já está no banco nasceu antes do
  -- fluxo de pedidos e não tem order. Também permite site criado pelo admin.
  order_id       uuid unique references orders(id) on delete set null,
  user_id        uuid references users(id) on delete set null,
  slug           text not null unique,              -- ana-e-pedro
  template_id    text not null,
  theme          jsonb not null,                    -- ThemeSpec validado
  tier           package_tier not null,
  status         site_status not null default 'provisioning',
  preview_token  text not null unique,              -- prévia privada
  published_at   timestamptz,
  last_seen_at   timestamptz,                       -- última visita (§6.1)
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table site_content (
  site_id        uuid primary key references sites(id) on delete cascade,
  couple_names   text, partner_a text, partner_b text,
  wedding_date   timestamptz, timezone text default 'America/Fortaleza',
  ceremony_venue text, ceremony_address text, ceremony_map_url text,
  reception_venue text, reception_address text,
  story text, dress_code text, gift_message text,
  rsvp_deadline  date,
  updated_at     timestamptz not null default now()
);

create table site_sections (
  site_id uuid references sites(id) on delete cascade,
  section_key text not null,
  position smallint not null default 0,
  enabled boolean not null default true,
  config jsonb,
  primary key (site_id, section_key)
);

create table photos (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  slot text not null,                    -- hero | story | gallery
  storage_path text not null,
  width int, height int, blur_data_url text, alt text,
  position smallint not null default 0,
  created_at timestamptz not null default now()
);

create table guestbook_messages (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  guest_name text, body text not null,
  approved boolean not null default false,   -- moderação: escrita pública
  created_at timestamptz not null default now()
);

-- ─── Métricas de acesso (§6.1) ───────────────────────────────────────────
-- Evento bruto, append-only. NUNCA guarda IP: visitor_hash é HMAC do
-- IP+UA com sal que gira todo dia (LGPD — o convidado é terceiro).
create table site_events (
  id           bigserial primary key,
  site_id      uuid not null references sites(id) on delete cascade,
  kind         text not null,          -- view | rsvp_open | rsvp_submit
                                       -- gift_open | pix_copy | gift_confirm
  path         text,
  section      text,                   -- seção onde o evento ocorreu
  referrer_host text,                  -- só o host: "whatsapp.com"
  device       text,                   -- mobile | tablet | desktop
  country      text, region text,      -- headers de geo, sem IP
  visitor_hash text,                   -- anônimo, não reversível, gira diário
  is_returning boolean,
  created_at   timestamptz not null default now()
);

create index idx_site_events_site_created on site_events (site_id, created_at desc);
create index idx_site_events_kind on site_events (site_id, kind, created_at desc);

-- Roll-up diário (pg_cron). Fica para sempre; é o que responde as perguntas
-- de produto sem varrer a tabela bruta.
create table site_daily_stats (
  site_id        uuid not null references sites(id) on delete cascade,
  day            date not null,
  views          int not null default 0,
  unique_visitors int not null default 0,
  rsvp_opens     int not null default 0,
  rsvp_submits   int not null default 0,
  gift_opens     int not null default 0,
  pix_copies     int not null default 0,
  gift_confirms  int not null default 0,
  primary key (site_id, day)
);
```

### 5.2 Migração das tabelas existentes (crítico)

**Regra desta migração: só adiciona, nunca remove.** Nada de `DROP`, `DELETE` ou reescrita de valor existente (§15).

```sql
-- PASSO 1 — expandir (aditivo, reversível, sem NOT NULL ainda).
-- on delete restrict de propósito: apagar um site NUNCA pode cascatear
-- para dentro de dados de convidado real.
alter table groups add column site_id uuid references sites(id) on delete restrict;
alter table gifts  add column site_id uuid references sites(id) on delete restrict;

create index idx_groups_site on groups (site_id);
create index idx_gifts_site  on gifts  (site_id);

-- PASSO 2 — backfill: tudo que já existe pertence ao site do casamento real.
update groups set site_id = :site_do_casamento_real where site_id is null;
update gifts  set site_id = :site_do_casamento_real where site_id is null;

-- PASSO 3 — NOT NULL só numa migração POSTERIOR, depois de verificar em
-- produção que não sobrou linha órfã. Separado de propósito: se o backfill
-- falhar parcialmente, o passo 1 continua válido e reversível.
-- alter table groups alter column site_id set not null;
```

**O `groups_slug_unique` global fica como está.** A tentação era trocar por "único por site", mas manter a unicidade global é melhor por dois motivos:

1. É **não-destrutivo** — não mexe em constraint de tabela com dado vivo.
2. Faz a rota legada `/rsvp/[slug]` (§6.2) continuar funcionando **para sempre** com busca global, sem ambiguidade e sem precisar saber o site.

Os slugs são nanoids aleatórios de 8 caracteres ([lib/slug.ts](../lib/slug.ts)); colisão global é irrelevante na prática. Ganhamos segurança e simplicidade de graça.

`guests` e `gift_contributions` herdam o escopo via FK, mas **toda query** em `lib/repositories/` precisa passar a receber e filtrar por `siteId`. Isto não é opcional: é o corte de isolamento entre clientes.

**Defesa em profundidade:** avaliar RLS no Postgres além do filtro na aplicação. Como o app usa a connection string de serviço, RLS exige `set local` por request — decidido para depois (§14).

---

## 6. Roteamento e multi-tenancy

**Decidido:** o endereço do casal é sempre um **subdomínio nosso** — sem domínio próprio, sem custo de registro por casal, sem verificação de propriedade, sem provisionamento de SSL individual.

| Fase | Formato | Como |
|---|---|---|
| 1 | `enlace.com.br/ana-e-pedro` | rota `app/(site)/[slug]/page.tsx` |
| 2 | `ana-e-pedro.enlace.com.br` | `proxy.ts` lê `Host`, reescreve para `/[slug]` |

As duas leem a **mesma coluna `slug`** — a Fase 2 é só o proxy reescrevendo, sem migração de dados. Por isso a Fase 1 sai pelo caminho (`/slug`), que funciona no primeiro dia sem nenhum trabalho de DNS.

**Pré-requisito de infra para a Fase 2:** DNS curinga `*.enlace.com.br` + certificado curinga. Na Vercel é um domínio curinga no projeto, com SSL automático — **mas exige um domínio próprio**.

> ⚠️ **O subdomínio não dá para simular no deploy atual.** A Vercel não permite anexar curinga em `*.vercel.app` (domínios `.vercel.app` não são delegáveis), então `*.casamentoweb-ten.vercel.app` não é uma opção. Enquanto não houver domínio registrado:
>
> - O que **dá** para validar hoje em `casamentoweb-ten.vercel.app`: todo o roteamento por **caminho** (`/ana-e-pedro`), que é o formato da Fase 1 e usa a mesma coluna `slug`.
> - O que **fica para depois**: só a reescrita `Host → slug` no `proxy.ts` — testável localmente via `hosts` file, e a lógica em si é coberta por teste unitário sem DNS nenhum.
>
> Ou seja: **a falta de domínio não bloqueia nada até a Fase 2.** Registrar `enlace.com.br` (ou o nome escolhido) é o único item de infra com prazo externo — vale fazer cedo, mas em paralelo.

O `proxy.ts` atual só trata `/admin` e `/conta` (matcher restrito). Passa a resolver host → tenant. A resolução de domínio precisa ser **rápida e cacheada** — a doc do Next é explícita: *"Proxy is not intended for slow data fetching"*. Logo: mapa domínio→slug em cache (`use cache` num route handler dedicado, ou KV), nunca um SELECT por request no proxy.

**Rotas do site público:**

```
app/(site)/[slug]/page.tsx              → site (cacheado, tag site:<id>)
app/(site)/[slug]/rsvp/[groupSlug]/     → RSVP do grupo (dinâmico)
app/(site)/[slug]/presentes/            → lista (tag gifts:<id>)
app/preview/[token]/page.tsx            → prévia do casal, noindex, sem cache
app/rsvp/[slug]/page.tsx                → LEGADO, mantido para sempre (§6.2)
```

Cuidado com colisão de slug: `/admin`, `/conta`, `/pacotes`, `/api`, `/presentes`, `/rsvp` já existem na raiz. Precisa de **lista de slugs reservados** na geração ([lib/slug.ts](../lib/slug.ts) já tem `generateUniqueSlug`, ganha o bloqueio). Com subdomínio a lista cresce: `www`, `app`, `admin`, `api`, `mail`, `smtp`, `ftp`, `cdn`, `static`, `blog`, `status`, `enlace`.

### 6.1 Disponibilidade e métricas de acesso

**Decidido: o site fica no ar, direto, sem hibernação.** Nenhuma pausa automática, nenhum estado de reativação, nenhuma página de "site pausado". Publicou, fica.

Em vez de criar uma política agora, **medimos primeiro**. A pergunta "vale pausar sites esquecidos?" só tem resposta boa com dados reais — e hoje não temos nenhum. Em 6 meses de coleta, ela se responde sozinha.

Isso também **remove complexidade da entrega**: sem job de pausa, sem fluxo de reativação, sem e-mails de aviso, sem um estado a mais no ciclo de vida. O `pg_cron` continua disponível, agora só para o roll-up diário.

#### O que capturamos

Eventos (`site_events`, §5.1), todos disparados pelo cliente:

| Evento | Responde |
|---|---|
| `view` | quantas visitas, quando, de onde, em que aparelho |
| `rsvp_open` → `rsvp_submit` | funil de confirmação: quantos abrem vs. confirmam |
| `gift_open` → `pix_copy` → `gift_confirm` | funil de presente — onde o convidado desiste |

Dimensões: `referrer_host` (o convite veio do WhatsApp? Instagram?), `device`, `country`/`region` (headers de geo da Vercel), `section`, `is_returning`.

Derivados que interessam ao produto:

- **Curva de decaimento pós-casamento** — a que responde a pergunta da hibernação.
- **Formato da rajada** do compartilhamento no WhatsApp (dimensionar cache e infra).
- **Tempo entre publicar e a primeira visita.**
- **Qual template converte melhor** em RSVP e em presente.

#### Privacidade (LGPD — não é detalhe)

O convidado é **terceiro**: não tem conta, não aceitou termo nenhum. Por isso:

- **IP nunca é armazenado.** `visitor_hash = HMAC(ip + user_agent, sal_do_dia)`, com sal que gira a cada 24h. Dá contagem de visitantes únicos por dia sem guardar dado pessoal e sem permitir rastrear a mesma pessoa entre dias.
- Só o **host** do referrer, nunca a URL completa.
- Geo vem de header (`x-vercel-ip-country`), derivado do IP mas sem persistir o IP.
- Sem cookie de rastreamento, sem terceiros — logo, sem banner de consentimento.

#### Mecânica

Com `use cache`, a visita **não toca no banco** — nada é gravado no caminho de render. A coleta é um beacon do cliente para `POST /api/track`, fora do caminho crítico, com falha silenciosa (métrica nunca pode quebrar o site do casal).

`sites.last_seen_at` é atualizado no mesmo endpoint, no máximo 1×/dia por site.

Roll-up diário em `pg_cron` agregando `site_events` → `site_daily_stats`. Os agregados ficam para sempre; retenção do evento bruto fica em aberto (§14).

> **Oportunidade:** o casamento real já está no ar com 22 confirmações. Instrumentar as páginas atuais (`/isabelle-e-nycolas`, `/rsvp/[slug]`, `/presentes`) **já na Fase 0** faz a coleta começar meses antes de o renderer existir — os dados estarão prontos quando as decisões precisarem deles. É barato e não muda nada visível para o convidado.

> **Nota honesta sobre o benefício:** nesta arquitetura, um site que ninguém visita já custa quase nada (sem visita, sem compute; o custo é só o storage das fotos, ~10 MB). Hibernar **não reduz storage**. O ganho real da hibernação é de produto, não de infra: limita a promessa de "para sempre", cria um ponto de reengajamento com o casal, e abre caminho para arquivar mídia de sites hibernados há muito tempo. Vale implementar — é barato — desde que ninguém espere economia de servidor.

### 6.2 Restrição inegociável: o casamento que já está no ar

O banco de produção **não é um ambiente de testes**:

- **23 grupos, 31 convidados, 22 já confirmaram presença.**
- 21 presentes cadastrados, 1 contribuição registrada.
- Casamento em **16/10/2026** — daqui a ~3 meses.

Os links `/rsvp/<slug>` (`O5gigPXj`, `2dmSwt1n`, …) **já estão no WhatsApp dos convidados**. Portanto:

1. A rota `/rsvp/[slug]` atual **não pode deixar de funcionar, nunca** — vira alias permanente que resolve o grupo e redireciona (ou renderiza) o novo caminho.
2. Os slugs de grupo existentes são **imutáveis** na migração.
3. O backfill roda com backup antes (`npm run backup:guests`, que já existe) e é ensaiado numa cópia do banco.

Isso rebaixa a Fase 0 de "migração de schema" para **"migração de schema em banco vivo com dados de terceiros"** — mesma tarefa, outro nível de cuidado.

---

## 7. Pipeline automático: pedido → site

Hoje `submitOrderAction` só muda o status para `submitted` e espera um humano. Passa a provisionar:

```
submitOrderAction()
  ├─ valida briefing mínimo (nomes, data, pacote)
  ├─ transação:
  │    ├─ slug único a partir dos nomes (+ reservados)
  │    ├─ ThemeSpec = preset(template) ← overrides(cor, fonte)   [Zod]
  │    ├─ insert sites + site_content (do briefing)
  │    ├─ seed site_sections conforme tier
  │    └─ seed gifts padrão (reaproveita scripts/seed-gifts.mjs)
  ├─ status = 'preview_ready', preview_token gerado
  ├─ after(): e-mail/WhatsApp "sua prévia está pronta"
  └─ updateTag(`site:${id}`)
```

Tudo síncrono e sub-segundo — **não precisa de fila**. Trabalho lento (e-mail, processamento de imagem) vai em `after()` do `next/server`.

Impacto na esteira de status ([lib/orderStatus.ts](../lib/orderStatus.ts)):

- `submitted` → `preview_ready` vira automático (segundos, não dias).
- `in_production` deixa de ser etapa normal e passa a ser **exceção** (falha no provisionamento, ou casal pediu ajuda humana).
- `paid` → `published` automático pelo webhook do AbacatePay: publica, gera domínio, `updateTag`.

O admin deixa de ser produtor e vira **operador de exceção + moderação**. Os textos de `STATUS_META` precisam ser reescritos ("Estamos montando o site de vocês" deixa de ser verdade).

### 7.1 IA no lugar certo (Fase 6, opcional)

O investimento em `buildPrompt.ts` não se perde — **muda de alvo**. Em vez de gerar código, o LLM gera um `ThemeSpec` + sugestões de texto a partir do `styleNotes` livre do casal, com saída **validada por Zod** e descartada se inválida.

Ganha-se a "mágica" da personalização sem colocar código não revisado em produção. Custo: centavos por pedido.

---

## 8. Fotos — implementado (Fase 3, 2/2)

Antes disto, `photosLink` era uma URL de pasta compartilhada que **um humano
abria e baixava**, e `PhotoSlot` sorteava fotos de casamentos do Unsplash. Um
casal que pedisse o site recebia **fotos de estranhos**.

O que existe hoje:

- **`site_photos`, escopada por site** — não por pedido. `order_photos` (que
  existia vazia de um push antigo) ficou onde estava. A razão: quem consome a
  foto é o renderer, que só conhece `siteId`; o casamento legado tem site sem
  pedido; e o casal troca foto depois de publicado, quando o pedido já não é o
  objeto relevante.
- **Bucket privado** no Supabase Storage, criado por `npm run setup:storage`.
  Foto de casamento tem convidado dentro — dado pessoal de terceiro, o mesmo
  princípio que já vale para as métricas (§6.1). Nada é público.
- **Upload assinado direto do browser**: o arquivo não passa pelo servidor
  Next. Comprimido no cliente (alvo ≤ 500 KB, maior lado 1600px), com
  `width`/`height`/`blur_data_url` guardados para não haver layout shift.
- **Entrega por `/f/<id>`**, uma rota nossa que lê do bucket e repassa os
  bytes (§8.1).
- Limites por tier: convite 5 · site 15 · para-sempre 40.
- Slots: `cover` (1), `story` (1), `gallery` (12). O `album` — fotos da festa —
  continua sem upload: só existe depois do casamento.

### 8.1 Por que a foto sai por uma rota nossa, e não do Storage

Três caminhos foram considerados:

| | Prós | Contras |
|---|---|---|
| Bucket público, caminho não adivinhável | simples, zero salto | quem pegou a URL vê para sempre, mesmo depois de o casal apagar; prévia não paga fica exposta |
| URL assinada embutida no HTML | sem salto extra | **colide com o cache**: o site fica em `cacheLife("days")` e a assinatura expira dentro dele — o convidado veria foto quebrada |
| **Rota `/f/<id>` que lê do bucket e repassa os bytes** | URL estável (convive com o cache), revogável, dá para checar o status do site, `remotePatterns` continua vazio | os bytes passam pelo servidor |

Escolhido o terceiro.

**Armadilha que custou uma volta:** a primeira versão da rota assinava e
devolvia um **307** para o Storage, apoiada em `image.md` ("maximumRedirects"),
que diz que o otimizador segue redirects sem precisar de `remotePatterns`.
Isso vale para imagens **remotas**. `/f/<id>` é caminho local: a busca do
otimizador é interna, **não segue o redirect**, e a resposta é

```
"url" parameter is valid but internal response is invalid
```

ou seja, com redirect **nenhuma foto renderiza**. Medido contra o app rodando,
não deduzido. A rota passou a repassar os bytes.

O custo é pequeno: quem busca `/f/<id>` é o otimizador, uma vez por foto e
tamanho — o convidado recebe a versão já otimizada e cacheada, nunca toca
nesta rota. E como a URL é da nossa própria origem, `images.remotePatterns`
continua vazio: o domínio do Storage nunca vira superfície aberta na
configuração.

A rota também não assina mais nada: quem lê é o nosso servidor, que já tem a
chave de serviço. Assinar seria uma ida a mais ao Storage por foto.

Apagar a foto tira a linha do banco, e `/f/<id>` passa a devolver 404 na hora.
O objeto sai do bucket em seguida; se essa segunda parte falhar, sobra lixo
invisível no bucket — de propósito, porque o inverso (objeto apagado com linha
viva) deixaria foto quebrada no site do casal.

### 8.2 O `content-type` do browser não vale como prova

Quem envia está com uma URL assinada na mão, então o cabeçalho que ele declara
é palavra dele. A confirmação lê os **primeiros bytes do objeto** e confere a
assinatura do arquivo (JPEG/PNG/WebP); o que não passa é apagado e recusado. O
bucket ainda reforça com `allowed_mime_types` e `file_size_limit`.

---

## 9. Infraestrutura e escala

### 9.1 Perfil de carga real

Isto **não** é um app de tráfego constante. O padrão é: o casal compartilha o link no grupo do WhatsApp e chegam ~300–900 acessos em uma hora, quase todos **leitura**, quase todos **mobile**, e depois cai para quase nada até a semana do casamento.

Ou seja: **leitura pesada, escrita rara, em rajadas previsíveis**. Cache resolve praticamente tudo; o banco não é gargalo.

### 9.2 Recomendação por fase

| Fase | Escala | Stack | Custo/mês |
|---|---|---|---|
| **1** | 0–100 sites | Vercel Pro + Supabase Pro + Resend free | ~US$ 45 (~R$ 250) |
| **2** | 100–1.000 | + `use cache: remote`, rate limit, Sentry | ~US$ 70 (~R$ 390) |
| **3** | 1.000+ | + domínios via API, réplica de leitura, OTel | ~US$ 150+ |

Notas:

- **Vercel Pro (US$ 20)** é obrigatório: Hobby proíbe uso comercial.
- **Supabase Pro (US$ 25)** é obrigatório em produção: o Free **pausa o projeto após 7 dias de inatividade** — inaceitável para sites que ficam meses no ar entre acessos. Também traz backup diário (PITR).
- Conexões: o projeto já usa o **pooler na porta 6543** com `prepare: false` em [lib/db/client.ts](../lib/db/client.ts#L15) — correto e necessário para o modo transaction do pgBouncer.
- Storage: ~10 MB/site após compressão → 100 GB do plano Pro comportam ~10.000 sites.

### 9.3 "Quanta robustez é necessária?"

Resposta honesta: **muito menos do que parece, mas em pontos específicos e inegociáveis.**

**Necessário agora (não é over-engineering):**

1. Isolamento multi-tenant (§5.2) — é vazamento de dados.
2. Rate limit + moderação nas escritas públicas (RSVP, presentes, mural são **anônimos**) — hoje `lib/rateLimit.ts` só cobre login.
3. Idempotência e verificação de assinatura no webhook de pagamento — **`ABACATEPAY_WEBHOOK_SECRET` está vazio no `.env`**.
4. Backup automático (vem com Supabase Pro) — são dados de casamento, não dá para perder.
5. Observabilidade mínima: Sentry + log estruturado. Sem isso, ninguém descobre que o provisionamento falhou.

**Não necessário (resistir):**

- Fila de mensagens, microserviços, K8s, réplicas, multi-região, event sourcing. O volume não justifica nada disso, e cada um adiciona modos de falha novos. `after()` + uma tabela de jobs cobre o assíncrono por muito tempo.

---

## 10. Plano de execução

| Fase | Entrega | Esforço |
|---|---|---|
| **0. Fundação** | Dump + ensaio da migração em cópia local; `sites`/`site_content`/`site_sections`; **métricas (`site_events`, `site_daily_stats`) + beacon já no site que está no ar**; backfill aditivo **preservando os slugs de RSVP já distribuídos**; `siteId` em todos os repositories + teste de isolamento; slugs reservados; down migrations escritas | 5–7 d |
| **1. Fatia vertical** | `cacheComponents: true` + revisão das rotas atuais; `ThemeSpec`+Zod; registry de fontes; **1 template (Clássico)** portado ponta a ponta; rota `/[slug]` cacheada | 5–7 d |
| **2. Moldes** | Portar os 5 templates restantes para o contrato de seções | 5–8 d |
| **3. Provisionamento** | `submitOrderAction` cria o site; upload de fotos; prévia por token; e-mail automático | 4–6 d |
| **4. Autonomia do casal** | Editor de conteúdo em `/conta`; publicar/despublicar; `updateTag`; RSVP e presentes multi-tenant reais | 4–6 d |
| **5. Robustez** | Rate limit público + moderação; webhook idempotente + assinatura; Sentry; subdomínio | 4–6 d |
| **6. Opcional** | Domínio próprio; IA de estilo/copy | 3–5 d |

**Total: ~28–43 dias** de trabalho focado. A Fase 1 é a que decide tudo — ela prova (ou derruba) o contrato de template antes de investir nas outras cinco.

---

## 11. Segurança

| Item | Situação | Ação |
|---|---|---|
| Isolamento entre casais | ❌ inexistente | §5.2 — bloqueador |
| Escritas públicas anônimas | ❌ sem limite | Rate limit por IP+site, Turnstile, moderação no mural |
| Webhook AbacatePay | ⚠️ `WEBHOOK_SECRET` vazio | Verificar assinatura + idempotência por `paymentId` |
| Domínio próprio | ✅ eliminado | Subdomínio nosso (§6) — sem risco de takeover, sem SSL por casal |
| Rota `/rsvp/[slug]` legada | ⚠️ links já distribuídos | Alias permanente (§6.2) — quebrar é perder confirmações reais |
| `DATABASE_URL_TEST` | ⚠️ aponta para o **mesmo banco** de produção | Isolado por schema `test`, mas um erro de config apaga dados reais. Separar instância. |
| Headers/CSP | ✅ bom | Rever `frame-ancestors` se houver prévia embutida |

> **Nota sobre credenciais:** as chaves reais (Supabase, AbacatePay, senha de app do Gmail) estão em `.env` — corretamente fora do git — mas foram compartilhadas em texto plano nesta sessão. Se o histórico não for privado, vale **rotacionar** as três.

---

## 12. Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| Ligar `cacheComponents` quebra rotas existentes | Alto | Fase própria; o Next acusa `Uncached data outside <Suspense>` em dev/build, então falha cedo e visível |
| 34 fontes inflam o CSS | Médio | **Medir na Fase 1**; reduzir catálogo ou auto-hospedar variáveis |
| Portar 5.121 linhas de template | Alto (prazo) | Fatia vertical primeiro; contrato validado antes de escalar |
| Backfill do casamento real | Alto | Backup antes (`npm run backup:guests` já existe); migração idempotente; ensaiar em cópia |
| Invalidação de cache errada | Médio | `updateTag` (não `revalidateTag`) nas ações do casal — read-your-own-writes; prévia sem cache |
| Perda da distinção artesanal | Negócio | Manter tier premium com curadoria humana |

### 12.1 Passivo do "Para Sempre" — resolvido

O risco original era: R$ 99,90 uma vez contra custo permanente de domínio (~R$ 40/ano/casal) + storage, sem receita recorrente. Com 1.000 vendas, só os domínios passariam de R$ 40 mil/ano.

**O custo de domínio foi eliminado** pela decisão de subdomínio próprio (§6): um registro + curinga serve todos os casais, custo marginal zero.

Sobra apenas o **storage das fotos** (~10 MB/site após compressão). Os 100 GB do Supabase Pro cobrem ~10.000 sites — ou seja, o passivo só vira assunto num cenário de sucesso que hoje está longe.

**Decisão: não criar política agora, medir.** Sem hibernação, sem expiração, sem arquivamento automático. O site fica no ar. Quando (e se) o storage apertar, os dados de §6.1 vão dizer exatamente quantos sites ainda recebem visita depois do casamento — e aí a política se escreve sozinha, com número em vez de palpite.

Gatilho para revisitar: storage acima de 50 GB, **ou** 2.000 sites publicados — o que vier primeiro.

### 12.2 Novo risco: migração em banco vivo

Ver §6.2. A Fase 0 mexe em tabelas com dados de convidados reais de um casamento a 3 meses de distância, com 22 confirmações já registradas e links já distribuídos. Um erro aqui não é um bug — é um casamento com a lista de presença perdida.

Mitigação: backup antes, ensaio em cópia, migração idempotente, rota legada preservada, e nenhuma alteração de slug existente.

---

## 13. Métricas de sucesso

| Métrica | Hoje | Meta |
|---|---|---|
| Pedido → prévia | dias | < 60 s |
| Toque humano por pedido | ~100% | < 10% |
| Custo marginal por site | horas de trabalho | ≈ R$ 0 |
| LCP mobile p75 (site publicado) | — | < 2,5 s |
| Correção de template chega aos sites entregues | nunca | todos, no deploy |

---

## 13.1 Backup e rollback (requisito, não recomendação)

**Regra do projeto:** nenhum dado de cliente é apagado ou reescrito. Toda migração tem backup verificado antes e plano de volta escrito antes de rodar.

### Padrão obrigatório: expandir → migrar → verificar → (muito depois) restringir

Nunca fazer schema novo e restrição na mesma migração. Cada passo é reversível sozinho:

| Passo | Faz | Reverte com |
|---|---|---|
| 1. Expandir | `add column` nullable, tabelas novas, índices | `drop column` (coluna vazia, sem perda) |
| 2. Migrar | `update ... where site_id is null` | coluna volta a null; original intacto |
| 3. Verificar | conferir contagens: 23 grupos, 31 convidados, 21 presentes, 22 confirmações | — |
| 4. Restringir | `set not null` — **migração separada, dias depois** | `drop not null` |

O passo 2 só escreve em **coluna nova**. Nenhum `UPDATE` toca coluna que já existia.

### Antes de qualquer migração

1. **Dump lógico completo** (`pg_dump` do schema `public`), guardado fora do Supabase, com data no nome. O `npm run backup:guests` que já existe cobre só convidados — não substitui o dump.
2. **Ensaio em cópia**: restaurar o dump num Postgres local (Docker) e rodar a migração inteira lá primeiro. Só depois em produção.
3. **Contagens registradas** antes e depois (números de §6.2 como referência).
4. **Down migration escrita e testada** — o `drizzle-kit generate` só produz o `up`; o `down` é escrito à mão no mesmo commit.

### Proibido nesta base

- `DELETE` em `groups`, `guests`, `gifts`, `gift_contributions`, `users`, `orders`.
- `DROP` de coluna, constraint ou índice que já tenha dado de cliente.
- `UPDATE` em coluna preexistente.
- Alterar qualquer `slug` de grupo já emitido.
- Migração destrutiva rodada direto em produção sem ensaio.

### Janela

Migrar fora do horário de pico e **nunca na véspera/semana do casamento** (16/10/2026). A partir de outubro, congelar mudanças de schema nas tabelas de RSVP.

---

## 14. Decisões

### Fechadas

| # | Decisão | Resultado |
|---|---|---|
| 1 | Endereço do casal | **Subdomínio nosso** (`ana-e-pedro.enlace.com.br`). Sem domínio próprio, sem custo por casal. Fase 1 entrega por caminho (`/slug`), mesma coluna. |
| 2 | "Para Sempre" | **Sem hibernação — o site fica no ar, direto.** Em vez de política, coleta de métricas de acesso para decidir com dado depois. §6.1 |
| 3 | `sites.order_id` | **Nullable** — o casamento real do banco nasceu antes do fluxo de pedidos. |
| 4 | Agendador | **`pg_cron`** (já instalado no banco), agora só para o roll-up diário de métricas. |
| 5 | O que conta como acesso | **Visita ao site.** Login do casal não conta. |
| 6 | Integridade dos dados | **Nada é apagado ou reescrito.** Toda migração é aditiva, com backup e rollback. §13.1 |
| 7 | `groups_slug_unique` | **Mantido global** — não-destrutivo e faz a rota legada seguir funcionando. §5.2 |

### Assumidas por padrão (avise se discordar — nenhuma bloqueia a Fase 0)

| # | Assunto | Padrão adotado |
|---|---|---|
| 8 | RLS no Postgres | **Não agora.** Escopo por `siteId` no repository + teste automatizado que falha se alguma query pública não filtrar por site. RLS entra depois, se quisermos rede dupla. |
| 9 | Catálogo de fontes | ~~Medir na Fase 1~~ → medido (51 KB desperdiçados) → **RESOLVIDO: fontes por molde.** CSS da página caiu 34%; o chunk de fontes, 57%. §4.3 |
| 10 | Fluxo artesanal | Continua existindo como exceção operacional (`in_production`), não como produto. |
| 11 | Pedidos de teste no banco | ~~Limpar~~ → **não apagar** (decisão 6). Os 3 pedidos com dados fake (`casal: "11"`, data `1222-12-12`) ganham só uma flag `is_test` para sumirem das telas. Dado preservado. |
| 12 | Upgrade de pacote | Altera `tier` no mesmo pedido e no mesmo site — não cria site novo. |
| 13 | Retenção de `site_events` bruto | Agregados (`site_daily_stats`) para sempre. Bruto: manter **12 meses** e revisitar — o volume é pequeno (uma rajada de casamento ≈ 2.000 eventos). |
| 14 | Instrumentar o site que já está no ar | **Sim, na Fase 0** — começa a coletar meses antes do renderer existir. §6.1 |
