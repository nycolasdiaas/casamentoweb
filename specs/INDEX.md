# Roteiro de implementação — Enlace × protótipo

**30 specs, em 4 áreas.** O levantamento que as gerou está em
`levantamento.md`. Cada spec tem escopo fechado, requisitos numerados e
critérios de aceite — quem implementar não deve precisar decidir nada.

**Ordem geral:** `design-system` primeiro, sempre. As outras três áreas
consomem tokens, classes de movimento e a casca de e-mail que só existem
depois dela.

---

## Como ler o status

| Status | O que fazer |
|---|---|
| **Pronta** | Implementar. Todos os requisitos estão fechados. |
| **Pronta ¹** | Implementar. Tem pergunta em aberto, mas com padrão decidido num FR — ela não trava nada. |
| **Bloqueada** | **Não escrever código.** Falta uma decisão do dono ou uma medição. A spec diz exatamente qual. |
| **CONFLITO** | O desenho contraria uma decisão fechada do SDD ou das regras de negócio. A spec registra o conflito e propõe saídas. Requer aprovação. |

---

## Ordem recomendada

### Onda 1 · Design system (base de tudo)

| # | Spec | Status | Depende de | É pré-requisito de |
|---|---|---|---|---|
| 1 | [`design-system/001-token-ink-3`](design-system/001-token-ink-3/spec.md) — o oitavo neutro da Fundação A1 | **Pronta** | — | `site-publico/003`, `painel-casal/001`, `painel-admin/001` e `002` |
| 2 | [`design-system/006-voz-verificavel`](design-system/006-voz-verificavel/spec.md) — as listas de Voz V5 viram teste | **Pronta ¹** | — | toda spec que escreve texto novo |
| 3 | [`design-system/002-push-de-rota`](design-system/002-push-de-rota/spec.md) — transição #1, com direção e sem `blur` | **Pronta ¹** | — | `003`, `004`, `005` (vocabulário de movimento) |
| 4 | [`design-system/003-dialogo`](design-system/003-dialogo/spec.md) — transição #3 | **Pronta** | `002` | `painel-casal/001` |
| 5 | [`design-system/004-brinde`](design-system/004-brinde/spec.md) — transição #4, a confirmação efêmera | **Pronta** | `002`, `003` | `painel-casal/006`, `008` |
| 6 | [`design-system/005-publicar-no-ar`](design-system/005-publicar-no-ar/spec.md) — transição #6 e o sinal `?publicado=1` | **Pronta** | `002` | `painel-casal/008` |
| 7 | [`design-system/007-casca-de-email`](design-system/007-casca-de-email/spec.md) — tabela de 600px, preheader, botão de tinta | **Pronta** | `006` | `site-publico/006`, `painel-casal/011` |

**Por que 001 e 006 vêm antes de tudo:** as duas são baratas, não dependem de
nada, e as outras 28 as usam. `006` em particular é uma **guarda**: ela
transforma as listas de palavras proibidas em teste, e a partir dela toda spec
que escreve texto novo tem como saber se errou.

---

### Onda 2 · O que o convidado vê

| # | Spec | Status | Depende de | Nota |
|---|---|---|---|---|
| 8 | [`site-publico/001-barra-do-site`](site-publico/001-barra-do-site/spec.md) — a barra fixa de F1 | **Pronta** | `design-system/006` | Corrige de passagem a âncora `#guestbook`, que hoje vaza nome interno |
| 9 | [`site-publico/003-pagina-de-pacotes`](site-publico/003-pagina-de-pacotes/spec.md) — B2, hoje um `redirect("/")` | **Pronta ¹** | `design-system/001`, `006` | A pergunta em aberto (pré-selecionar pacote) é de produto e fica adiada |
| 10 | [`site-publico/005-galeria-de-estilos`](site-publico/005-galeria-de-estilos/spec.md) — B4–B9, a porta de entrada das prévias | **Pronta** | `design-system/006` | As seis prévias existentes **não** são tocadas (SDD §4.4.1) |
| 11 | [`site-publico/004-exemplo-por-pacote`](site-publico/004-exemplo-por-pacote/spec.md) — B3 | **Bloqueada** | `site-publico/001`, `003` | Decisão: redirecionar com o pacote, ou assumir a divergência |
| 12 | [`site-publico/002-largura-do-site`](site-publico/002-largura-do-site/spec.md) — F1 em 1440 | **Bloqueada** | `site-publico/001` | **Medida em 25/08.** Nada quebra a 1440, mas trocar o número não entrega o desenho: o eixo real é cartão-com-letterbox × largura cheia. Decisão do dono |
| 13 | [`site-publico/006-emails-para-o-convidado`](site-publico/006-emails-para-o-convidado/spec.md) — modelos 05 e 06 | **Bloqueada** | `design-system/007` | O produto não guarda e-mail de convidado, e coletá-lo é decisão do dono |
| 14 | [`site-publico/007-h5-pix-nao-confirmado`](site-publico/007-h5-pix-nao-confirmado/spec.md) — H5 | **CONFLITO** | — | Registro. O Pix vai direto para o casal; a Enlace não observa a falha |

---

### Onda 3 · O painel do casal

**As specs 002 a 007 são o editor de convite** e precisam ser lidas na ordem:
`002` decide o modelo de dados, e as cinco seguintes constroem sobre ele.

| # | Spec | Status | Depende de | Nota |
|---|---|---|---|---|
| 15 | [`painel-casal/001-aba-convites`](painel-casal/001-aba-convites/spec.md) — E7, a grade vira lista de trabalho | **Pronta ¹** | `design-system/001`, `003` | A coluna `CONVIDADOS` fica de fora: não há chave ligando convite a grupo |
| 16 | [`painel-casal/002-modelo-do-convite`](painel-casal/002-modelo-do-convite/spec.md) — `InviteDoc` × handoff §2 | **CONFLITO** | — | **Destrava 003 a 007.** Recomendação: o modelo implementado vence |
| 17 | [`painel-casal/003-botao-de-confirmacao`](painel-casal/003-botao-de-confirmacao/spec.md) — o convite precisa levar ao RSVP | **Pronta** | `002`, `design-system/006` | Aditivo no `jsonb`; sem migração |
| 18 | [`painel-casal/004-snap-e-guias`](painel-casal/004-snap-e-guias/spec.md) — encaixe de 6px e guias magenta | **Pronta** | `002` | |
| 19 | [`painel-casal/005-atalhos-do-editor`](painel-casal/005-atalhos-do-editor/spec.md) — os atalhos de §7 | **Pronta** | `002`, `004` | Fazer junto com `004`: mesmo arquivo de 1.417 linhas |
| 20 | [`painel-casal/006-autosave-do-editor`](painel-casal/006-autosave-do-editor/spec.md) — debounce de 800ms + rascunho local | **Pronta** | `002`, `design-system/004` | Hoje fechar a aba perde o trabalho |
| 21 | [`painel-casal/007-painel-de-modelos`](painel-casal/007-painel-de-modelos/spec.md) — a quinta ferramenta | **Bloqueada** | `002` | Decisão: "trocar de modelo" re-tematiza ou refaz? |
| 22 | [`painel-casal/008-e10-publicar`](painel-casal/008-e10-publicar/spec.md) — E10 sem o checkout | **Pronta** + **CONFLITO** parcial | `design-system/004`, `005` | O checkout embutido foi cancelado pelo dono; o resto é implementável |
| 23 | [`painel-casal/011-emails-do-casal`](painel-casal/011-emails-do-casal/spec.md) — recibo e "seu site está no ar" | **Pronta ¹** | `design-system/006`, `007` | Hoje o casal paga, o site publica, e ninguém avisa |
| 24 | [`painel-casal/012-tela-de-geracao`](painel-casal/012-tela-de-geracao/spec.md) — transição #8 | **CONFLITO** | `design-system/006` | O piso de 2,5s do handoff é espera inventada (regras §2.2) |
| 25 | [`painel-casal/009-preferencias-de-aviso`](painel-casal/009-preferencias-de-aviso/spec.md) — J2 | **Bloqueada** | `011` | Sem e-mail sendo enviado, a tabela não liga nada |
| 26 | [`painel-casal/010-resumo-semanal`](painel-casal/010-resumo-semanal/spec.md) — J3 | **Bloqueada** | `007`, `011` | Falta agendador; e a §14 decisão 4 do SDD precisa ser reaberta |

---

### Onda 4 · O admin

| # | Spec | Status | Depende de | Nota |
|---|---|---|---|---|
| 27 | [`painel-admin/001-pedidos-como-tabela`](painel-admin/001-pedidos-como-tabela/spec.md) — G4 com filtros e busca | **Pronta ¹** | `design-system/001` | Tira da tela o prompt de LLM do fluxo antigo |
| 28 | [`painel-admin/003-presentes-entre-casais`](painel-admin/003-presentes-entre-casais/spec.md) — G5 | **Pronta** + **CONFLITO** parcial | `design-system/001` | O cartão "A repassar" contradiz regras §2.4 e fica fora |
| 29 | [`painel-admin/002-dashboard-da-operacao`](painel-admin/002-dashboard-da-operacao/spec.md) — G3, e o destino do casamento legado | **Bloqueada** | `design-system/001` | Mexer no endereço da tela que o dono usa exige janela segura (§13.1) |
| 30 | [`painel-admin/004-grupos-e-permissoes`](painel-admin/004-grupos-e-permissoes/spec.md) — G2 | **Bloqueada** | `002` | A pergunta é anterior ao código: existe mais de um operador? |

> A numeração desta coluna é a **ordem de execução**, não o número da spec. O
> número da spec é o do diretório.

---

## Registro de execução

| Quando | O quê |
|---|---|
| 25/08/2026 | **Pré-trabalho concluído.** Os 6 moldes fotografados e medidos a 1440 (`shot:template` + medição por CDP). `site-publico/002` **continua Bloqueada** — a medição respondeu a pergunta que existia e levantou uma maior. Duas descobertas novas registradas: o eixo real da largura (cartão × largura cheia) e **três violações de voz** (`RSVP` visível ao convidado em `editorial` ×2 e `toscana` ×1), que reforçaram `design-system/006` com FR-003b e FR-004b. |

---

## As 11 decisões que travam trabalho

Reunidas aqui para caberem numa conversa só. Cada linha aponta para onde a
pergunta está escrita por inteiro.

| # | Decisão | Onde | Recomendação escrita na spec |
|---|---|---|---|
| 1 | Qual modelo de dados do convite vale? | `painel-casal/002` | O implementado vence; o handoff §2 vira divergência assumida |
| 2 | "Trocar de modelo" no convite re-tematiza ou refaz? | `painel-casal/007` | Re-tematizar, preservando o que o casal escolheu à mão |
| 3 | O piso de 2,5s da tela de geração volta? | `painel-casal/012` | Não. É espera inventada, e já foi removida uma vez por crítica do dono |
| 4 | O Enlace passa a coletar e-mail de convidado? | `site-publico/006` | Não. Os dois modelos viram peça de WhatsApp, que já existe |
| 5 | O checkout do pacote vem para dentro do produto? | `painel-casal/008` | Não. Já cancelado pelo dono; o AbacatePay faz isso |
| 6 | Como fechar o buraco que H5 tentava fechar? | `site-publico/007` | Uma tela honesta, com outro texto — sem afirmar o que a Enlace não sabe |
| 7 | `/pacotes/exemplo/:pacote` volta a existir? | `site-publico/004` | Sim, como redirect para a prévia real no pacote certo |
| 8 | O site do casal cresce para 1440? | `site-publico/002` | **Medido.** Recomendação: opção C (assumir a divergência) ou B (largura cheia de verdade) — a opção "trocar o número" foi descartada pela medição |
| 9 | O casamento legado sai de `/admin` e `/admin/dashboard`? | `painel-admin/002` | Sim, para `/admin/casamento` — **fora da janela do casamento** |
| 10 | Existe mais de uma pessoa operando o Enlace? | `painel-admin/004` | Se não, adiar G2 inteiro |
| 11 | Cancelar pedido vira estado em vez de `DELETE`? | `painel-admin/001`, pergunta 1 | Sim, em spec própria — corrige de passagem o site órfão do `AGENTS.md` |

---

## Impacto em dados — o mapa completo

Nenhuma spec **Pronta** exige migração. Todas as que exigem estão
**Bloqueadas**, e todas são aditivas.

| Spec | Migração | Natureza |
|---|---|---|
| `painel-casal/003` | nenhuma | Tipo novo de bloco dentro do `jsonb` de `site_invites.doc` |
| `site-publico/006` | `guests.email` ou `groups.email` (nullable) | Aditiva, sem backfill, `NOT NULL` nunca |
| `painel-casal/009` | `users.aviso_prefs jsonb` (nullable) | Aditiva, sem default, sem backfill |
| `painel-casal/010` | `cron.schedule` **ou** rota protegida | Depende do agendador escolhido |
| `painel-admin/004` | `admin_groups` + `admins.group_id` (nullable) | Aditiva; `on delete set null`, nunca `cascade` |
| `painel-admin/001`, pergunta 1 | `ORDER_STATUSES` ganha `cancelled` | Enum aditivo; muda `deleteOrder` para `cancelOrder` |

**Regras que valem para todas** (SDD §13.1): backup completo antes
(`npm run backup:full`), ensaio em cópia (`npm run db:rehearse`), `down`
escrito no mesmo commit, contagens conferidas depois (23 grupos, 31
convidados, 21 presentes, 23 confirmações), **nunca `drizzle-kit push`**, e
**nenhuma migração na véspera ou semana de 16/10/2026**.

---

## O que ficou de fora, e por quê

| Item | Motivo |
|---|---|
| Geometria seção a seção dos 6 moldes | O protótipo desenha o site montado (F1), não cada seção de cada molde. Exige `npm run shot:template` — está em `site-publico/002`, pergunta 1 |
| Alças e ângulo de rotação do editor | Não dá para afirmar por leitura de código. Marcado como "investigação necessária" em `levantamento.md` §3.2 |
| Diferenças de 1–2px | Só entraram divergências prováveis por valor de token ou de classe |
| Multisseleção no editor (handoff §5) | Muda o modelo de seleção inteiro; merece spec própria |
| Saída da transição de rota (`translateX(-8%)`) | Exige View Transitions ou `AnimatePresence`; muda a navegação do painel — `design-system/002`, pergunta 1 |
| Auditoria e reembolso no admin | O próprio `README.md` do pacote (§5) os lista como não desenhados |
| 2FA no admin | O artboard G1 anuncia; o produto **corretamente** não anuncia porque não existe |
| Verificação de e-mail | Só existe na branch órfã `feedback-001`, que não deve ser mesclada (`AGENTS.md` §6). É frente própria — `painel-casal/011`, pergunta 1 |
