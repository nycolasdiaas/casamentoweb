# Implementation Plan: O casal termina o questionário e recebe o site

**Branch**: `001-ux-provisionamento-e-ambiente` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/001-ux-provisionamento-e-ambiente/spec.md` — FR-001 a FR-012, resolvendo
UX-001, UX-002, UX-003, UX-005 e UX-021.

## Summary

Uma função — `getBaseUrl()` — **lança exceção** quando não consegue descobrir o endereço
público do produto, e o produto inteiro está pendurado nela: provisionar o site, abrir o
painel, criar convite, gerar QR. A gêmea dela, `baseUrlEstatica()`, faz o oposto e é pior:
**mente baixinho**, devolvendo `http://localhost:3000` para o cartão que vai para o
WhatsApp da família.

O plano tem quatro movimentos, do mais profundo para o mais superficial:

1. **Ensinar as duas funções a se virarem.** Descoberta em cascata: endereço configurado →
   endereço que a plataforma de hospedagem informa → host da requisição, se confiável →
   `localhost` **apenas em desenvolvimento**. Isso sozinho resolve UX-001, UX-002, UX-005
   e UX-021 no ambiente de hoje e em qualquer domínio futuro.
2. **Tirar o endereço do caminho crítico.** Provisionar o site e salvar o conteúdo do
   casal não podem depender de montar um link. Hoje dependem, porque `await getBaseUrl()`
   é a primeira linha do bloco que faz as duas coisas.
3. **Fazer a rede de segurança entregar o mesmo que o envio.** Quem chega ao site pela
   rota de resgate recebe cerimônia, festa, traje e a história certa — não três colunas e
   uma anotação trocada.
4. **Dar ao produto uma tela de erro em português.**

Nenhuma migração. Nenhuma biblioteca nova. Nenhuma tela redesenhada.

## Technical Context

**Language/Version**: TypeScript 5, React 19.2, Node 24

**Primary Dependencies**: Next 16.2 (App Router, `cacheComponents: true`, `proxy.ts`),
Drizzle ORM 0.45 + Postgres (Supabase), Tailwind 4

**Storage**: Postgres. **Esta feature não toca o schema.**

**Testing**: Vitest 4 (`npm run test`) + verificação manual no navegador, em desktop e
celular, exigida pela constitution

**Target Platform**: Vercel (produção em `casamentoweb-ten.vercel.app`)

**Project Type**: aplicação web Next.js multi-tenant

**Performance Goals**: nenhuma mudança — a descoberta de endereço é leitura de variável de
ambiente e de cabeçalho, sem ida ao banco

**Constraints**: o banco tem casamento real no ar; `/rsvp/[slug]` não pode quebrar; a
proteção contra `Host` forjado não pode ser afrouxada

**Scale/Scope**: 3 arquivos de lógica + 4 chamadores + 1 tela de erro + testes

## Constitution Check

*GATE: verificado antes de escrever tarefas.*

| Princípio | Como esta feature o respeita |
|---|---|
| **I. Usuário primeiro** | Todo item do plano nasce de UX-001, UX-002, UX-003, UX-005 ou UX-021 — todos observados na interface. A UX-021 foi registrada na auditoria antes de entrar aqui, como manda o princípio. |
| **II. Rastreabilidade total** | Cada tarefa cita o UX-ID e o FR que atende; `/speckit-analyze` roda antes do implement. |
| **III. Não quebrar o que funciona** | Nenhuma biblioteca nova, nenhuma tela reescrita, nenhum molde tocado. A mudança é dentro de `lib/baseUrl.ts` e nos pontos que a chamam. |
| **IV. Feedback explícito** | FR-004 e FR-008 existem só por causa deste princípio: falha vira tela em português com caminho, não 500. |
| **V. Sem perda de dados** | FR-009 e FR-011 são a aplicação direta dele: o conteúdo do casal não pode ser descartado porque um link não pôde ser montado. Nenhuma migração; nada apagado. |
| **VI. Mobile é o cenário principal** | O aceite de cada história é conferido em 390×844 além de 1440×900. A UX-021 é, na prática, um defeito de celular: o cartão quebrado aparece no WhatsApp. |
| **VII. Português claro** | FR-008 troca a tela de erro em inglês por uma na voz da Enlace; o texto passa pela Skill `texto-do-casal`. |

**Restrições da plataforma respeitadas**: sem `drizzle-kit push`, sem migração, sem tocar
em Pix, sem gravar IP. `next build` roda como portão antes de fechar a feature.

**Violações a justificar**: nenhuma.

## Decisões técnicas

### D1 — Cascata de descoberta do endereço

```
1. NEXT_PUBLIC_SITE_URL            (continua sendo o caminho preferencial)
2. VERCEL_PROJECT_PRODUCTION_URL   (domínio de produção; a Vercel define sozinha)
3. VERCEL_URL                      (a publicação atual — cobre preview deploys)
4. Host da requisição              (só getBaseUrl, e só se estiver na allowlist)
5. http://localhost:3000           (SÓ quando NODE_ENV !== "production")
```

**Por que 2 e 3 no meio, e não só a allowlist.** Uma allowlist é uma lista que alguém
precisa lembrar de atualizar — e a prova de que ela falha é esta auditoria: o domínio de
produção tem um `-ten` que ninguém anotou. As variáveis da plataforma são informadas pela
própria hospedagem, mudam junto com o domínio e não dependem de memória humana.

**Por que a allowlist continua existindo.** Ela protege contra `Host` forjado (FR-007), e
nada nesta feature pede para afrouxar isso. O passo 4 segue igual, só ganha o domínio
atual na lista.

**Por que `localhost` sai de produção.** É o defeito da UX-021 inteiro: um fallback mudo
que produz um link errado é pior que um erro — ninguém vê, e o convidado recebe um cartão
quebrado. Em produção, sem endereço descoberto, `baseUrlEstatica()` devolve string vazia e
quem usa decide o que fazer (FR-003), em vez de inventar um endereço falso.

### D2 — `getBaseUrl()` deixa de ser obrigatória para provisionar

`provisionSiteForOrder` recebe `baseUrl` só para montar `previewUrl`. Passa a aceitar
ausência: sem endereço, o site nasce igual e `previewUrl` fica nulo — a tela do painel já
sabe montar o link a partir do slug. Assim, FR-011: **o conteúdo do casal nunca é refém de
um link**.

Em `submitOrderAction`, `await getBaseUrl()` sai de dentro do bloco de provisionamento
para um `try/catch` próprio, antes dele.

### D3 — A rede de segurança entrega o mesmo que o envio

`provisionSiteForOrder` passa a copiar todos os campos do pedido para `site_content`
(`weddingTime`, `ceremonyVenue`, `ceremonyAddress`, `receptionVenue`, `receptionAddress`,
`receptionTime`, `dressCode`) e a usar `order.story` na história. `order.notes` deixa de
ser publicado como história do casal.

**Cuidado com o que já existe**: a função só grava no `INSERT` do site novo. Site já
criado não é tocado — nada é reescrito, nada é apagado (constitution V).

### D4 — Tela de erro em português

Um `app/error.tsx` (e um `app/global-error.tsx` para o caso extremo) na voz da Enlace, com
um botão de tentar de novo e um caminho de volta para `/conta/pedidos`. Substitui o
*"This page couldn't load"* da UX-002.

### D5 — O que NÃO entra

- Alertar o dono quando um provisionamento falha (observabilidade) — é sugestão da
  auditoria, não é UX-ID. Fica para depois, com decisão do dono.
- Corrigir `previewUrl` já gravado errado em pedidos existentes. Reescrever dado gravado
  contraria o princípio V sem necessidade: a tela monta o link pelo slug quando o campo
  está ausente.

## Arquivos que serão alterados

| Arquivo | O quê | FR |
|---|---|---|
| `lib/baseUrl.ts` | Cascata de descoberta em `getBaseUrl()` e `baseUrlEstatica()`; `localhost` só fora de produção; domínio atual na allowlist | FR-002, FR-007, FR-012 |
| `lib/baseUrl.test.ts` **(novo)** | Testa a cascata, a recusa de host forjado, a barra no fim e a ausência de `localhost` em produção | FR-002, FR-007, FR-012 |
| `lib/site/provision.ts` | `baseUrl` opcional; copiar todos os campos do pedido; `order.story` na história | FR-009, FR-010, FR-011 |
| `lib/site/provision.test.ts` **(novo ou estendido)** | Garante que os campos copiados chegam e que `notes` não vira história | FR-009, FR-010 |
| `app/actions/account-actions.ts` | `getBaseUrl()` sai do caminho crítico do provisionamento | FR-001, FR-011 |
| `app/api/pedido/provisionar/route.ts` | Não falhar por ausência de endereço; devolver ao painel com aviso tratável | FR-001, FR-003, FR-004 |
| `app/conta/pedidos/[id]/page.tsx` | Mensagem em português quando `provisionamento=erro`; endereço do site sem `localhost` | FR-004, FR-012 |
| `app/actions/invite-actions.ts` | Tolerar ausência de endereço ao criar/publicar convite | FR-003, FR-005 |
| `app/conta/convites/[conviteId]/page.tsx` | Idem, na tela do editor | FR-003, FR-005 |
| `app/conta/pedidos/[id]/compartilhar/page.tsx` | Idem | FR-003 |
| `app/error.tsx` **(novo)** | Tela de erro em português | FR-008 |
| `app/global-error.tsx` **(novo)** | Rede de segurança da anterior | FR-008 |

`app/api/qr/[slug]/route.ts` **não muda**: ela já 404 corretamente e volta a funcionar
assim que `getBaseUrl()` parar de lançar (FR-006).

## Riscos

| Risco | Mitigação |
|---|---|
| Mexer em `baseUrl` afeta **todo** link do produto, inclusive e-mail e pagamento | Teste unitário cobrindo a cascata inteira antes de mudar os chamadores; `npm run build` e `npm run test` como portão; verificação no navegador do link de pagamento **sem** disparar cobrança |
| Afrouxar a proteção contra `Host` forjado sem perceber | FR-007 vira caso de teste explícito: host fora da lista não pode virar link |
| `VERCEL_PROJECT_PRODUCTION_URL` não existir no runtime | A cascata cai para o passo seguinte; nenhum passo é obrigatório. O teste cobre os cinco cenários |
| Copiar campos no provisionamento sobrescrever conteúdo de site existente | A cópia acontece **só no INSERT** de site novo; site existente retorna cedo, como já retorna hoje |
| `/rsvp/[slug]` quebrar por tabela | Nenhum arquivo de RSVP é tocado; suíte de testes roda antes de fechar |

## Portões antes de fechar a feature

1. `npm run lint` limpo
2. `npx tsc --noEmit` limpo
3. `npm run build` passando
4. `npm run test` verde
5. Cada critério de aceite conferido no navegador, em 1440×900 e 390×844, com evidência em
   `docs/auditoria/evidencias/`

## Complexity Tracking

Nenhuma violação da constitution a justificar.
