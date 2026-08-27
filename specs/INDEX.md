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
| 1 | [`design-system/001-token-ink-3`](design-system/001-token-ink-3/spec.md) — o oitavo neutro da Fundação A1 | **Implementada** | — | `site-publico/003`, `painel-casal/001`, `painel-admin/001` e `002` |
| 2 | [`design-system/006-voz-verificavel`](design-system/006-voz-verificavel/spec.md) — as listas de Voz V5 viram teste | **Bloqueada ²** | — | toda spec que escreve texto novo |
| 3 | [`design-system/002-push-de-rota`](design-system/002-push-de-rota/spec.md) — transição #1, com direção e sem `blur` | **Implementada** | — | `003`, `004`, `005` (vocabulário de movimento) |
| 4 | [`design-system/003-dialogo`](design-system/003-dialogo/spec.md) — transição #3 | **Implementada** | `002` | `painel-casal/001` |
| 5 | [`design-system/004-brinde`](design-system/004-brinde/spec.md) — transição #4, a confirmação efêmera | **Implementada** | `002`, `003` | `painel-casal/006`, `008` |
| 6 | [`design-system/005-publicar-no-ar`](design-system/005-publicar-no-ar/spec.md) — transição #6 e o sinal `?publicado=1` | **Implementada** | `002` | `painel-casal/008` |
| 7 | [`design-system/007-casca-de-email`](design-system/007-casca-de-email/spec.md) — tabela de 600px, preheader, botão de tinta | **Implementada** | `006` | `site-publico/006`, `painel-casal/011` |

² `006` foi implementada até onde dava e **parou**: o varredor existe
(`lib/voz/`), roda, e acusou 98 ocorrências das quais cerca de 80 são ruído —
literal de string não é texto visível (`"use cache"` é diretiva, `"preview_ready"`
é valor de banco, `"rota"` é português comum). Ligar isso à suíte hoje
reprovaria o repositório por motivo errado. Está desligado de propósito, com a
medição escrita no cabeçalho do arquivo. Ver as Perguntas em aberto da spec.

**Por que 001 e 006 vêm antes de tudo:** as duas são baratas, não dependem de
nada, e as outras 28 as usam. `006` em particular é uma **guarda**: ela
transforma as listas de palavras proibidas em teste, e a partir dela toda spec
que escreve texto novo tem como saber se errou.

---

### Onda 2 · O que o convidado vê

| # | Spec | Status | Depende de | Nota |
|---|---|---|---|---|
| 8 | [`site-publico/001-barra-do-site`](site-publico/001-barra-do-site/spec.md) — a barra fixa de F1 | **Implementada** | `design-system/006` | Corrige de passagem a âncora `#guestbook`, que hoje vaza nome interno |
| 9 | [`site-publico/003-pagina-de-pacotes`](site-publico/003-pagina-de-pacotes/spec.md) — B2, hoje um `redirect("/")` | **Implementada** | `design-system/001`, `006` | A pergunta em aberto (pré-selecionar pacote) é de produto e fica adiada |
| 10 | [`site-publico/005-galeria-de-estilos`](site-publico/005-galeria-de-estilos/spec.md) — B4–B9, a porta de entrada das prévias | **Implementada** | `design-system/006` | As seis prévias existentes **não** são tocadas (SDD §4.4.1) |
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
| 15 | [`painel-casal/001-aba-convites`](painel-casal/001-aba-convites/spec.md) — E7, a grade vira lista de trabalho | **Implementada** | `design-system/001`, `003` | A coluna `CONVIDADOS` fica de fora: não há chave ligando convite a grupo |
| 16 | [`painel-casal/002-modelo-do-convite`](painel-casal/002-modelo-do-convite/spec.md) — `InviteDoc` × handoff §2 | **Resolvida** | — | **Opção A, decidida em 27/08.** Destravou 003 a 006 |
| 17 | [`painel-casal/003-botao-de-confirmacao`](painel-casal/003-botao-de-confirmacao/spec.md) — o convite precisa levar ao RSVP | **Implementada** | `002`, `design-system/006` | Aditivo no `jsonb`; sem migração |
| 18 | [`painel-casal/004-snap-e-guias`](painel-casal/004-snap-e-guias/spec.md) — encaixe de 6px e guias magenta | **Implementada** | `002` | |
| 19 | [`painel-casal/005-atalhos-do-editor`](painel-casal/005-atalhos-do-editor/spec.md) — os atalhos de §7 | **Implementada** | `002`, `004` | Fazer junto com `004`: mesmo arquivo de 1.417 linhas |
| 20 | [`painel-casal/006-autosave-do-editor`](painel-casal/006-autosave-do-editor/spec.md) — debounce de 800ms + rascunho local | **Pronta** | `002`, `design-system/004` | Hoje fechar a aba perde o trabalho |
| 21 | [`painel-casal/007-painel-de-modelos`](painel-casal/007-painel-de-modelos/spec.md) — a quinta ferramenta | **Bloqueada** | `002` | Decisão: "trocar de modelo" re-tematiza ou refaz? |
| 22 | [`painel-casal/008-e10-publicar`](painel-casal/008-e10-publicar/spec.md) — E10 sem o checkout | **Pronta** + **CONFLITO** parcial | `design-system/004`, `005` | O checkout embutido foi cancelado pelo dono; o resto é implementável |
| 23 | [`painel-casal/011-emails-do-casal`](painel-casal/011-emails-do-casal/spec.md) — recibo e "seu site está no ar" | **Implementada** | `design-system/006`, `007` | Hoje o casal paga, o site publica, e ninguém avisa |
| 24 | [`painel-casal/012-tela-de-geracao`](painel-casal/012-tela-de-geracao/spec.md) — transição #8 | **CONFLITO** | `design-system/006` | O piso de 2,5s do handoff é espera inventada (regras §2.2) |
| 25 | [`painel-casal/009-preferencias-de-aviso`](painel-casal/009-preferencias-de-aviso/spec.md) — J2 | **Bloqueada** | `011` | Sem e-mail sendo enviado, a tabela não liga nada |
| 26 | [`painel-casal/010-resumo-semanal`](painel-casal/010-resumo-semanal/spec.md) — J3 | **Bloqueada** | `007`, `011` | Falta agendador; e a §14 decisão 4 do SDD precisa ser reaberta |

⁴ A `002` fechou na **Opção A** em 27/08/2026, por decisão de Nycolas: o
modelo implementado vence e o handoff §2 vira divergência assumida, escrita no
topo de `lib/site/inviteDoc.ts`. Com isso as quatro retidas voltaram a
`Pronta`.

---

### Onda 4 · O admin

| # | Spec | Status | Depende de | Nota |
|---|---|---|---|---|
| 27 | [`painel-admin/001-pedidos-como-tabela`](painel-admin/001-pedidos-como-tabela/spec.md) — G4 com filtros e busca | **Implementada** | `design-system/001` | Tira da tela o prompt de LLM do fluxo antigo |
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
| 26/08/2026 | **`design-system/005` implementada** (`selo-pop`, `.previa-saindo`, o sinal `?publicado=1`). Duas correções registradas na spec: o sinal sai só de `/api/pagamento/confirmar` (a ação do admin roda no navegador da equipe, não no do casal), e quem lê o parâmetro é `CascaDoPainel.tsx` e não a `page.tsx` — o selo mora num *layout*, e layout não recebe `searchParams`. 9 testes novos. |
| 26/08/2026 | **`design-system/007` implementada** — a casca de e-mail vira tabela de 600px, com preheader, cabeçalho, rodapé e um botão de tinta por mensagem. Correção registrada: FR-005 (link repetido em texto) e SC-008 (texto intacto) colidiam no e-mail da prévia; FR-005 venceu e SC-008 passou a ser conferido frase a frase. Os três preheaders repetem frase já aprovada do corpo — vale revisão do dono, não bloqueia. 12 testes novos. **Onda 1 fechada.** |
| 26/08/2026 | **`site-publico/001` implementada** — a barra fixa do site, server component, montada pelo `SiteRenderer` para alcançar os 6 moldes de uma vez. Corrige de passagem o `#guestbook`, que vazava nome interno no endereço do convidado. Correções registradas: o botão conta como item em FR-009; "classes de botão do molde" não existem (os 6 estilizam inline); o corte é container query, não media query. A medição a 390px pegou um defeito que o código não mostrava: os nomes comiam a faixa e sobravam 49px de âncoras — agora 96px. 14 testes novos. |
| 26/08/2026 | **`site-publico/003` implementada** — `/pacotes` deixa de redirecionar e vira a proposta que as regras §1 pedem. O ✓/✕ sai de `tierAllowsSection`, provado mudando o gating de verdade e vendo a vitrine mudar sozinha. As três respostas do acordeão passaram pelo agente `regras-de-negocio`. Correções registradas: os rótulos da vitrine não podem vir de `SECTION_LABELS` (é a voz do painel); o Tailwind não gera `border-[1.5px]`; SC-008, SC-010 e SC-014 medem por métodos que não resolvem o que perguntam. 14 testes novos. **Duas perguntas novas para o dono** (renovação do domínio do Para Sempre; tempo no ar dos outros dois) |
| 26/08/2026 | **`site-publico/005` implementada** — a galeria dos seis estilos, com cor e fonte de cada cartão saindo do `defaultTheme` do molde (trocar o preset muda o cartão sozinho). Corrige o `← Pacotes` do `TemplateChrome`, que apontava para `/` e mentia sobre o destino. Correção registrada: **FR-012 partiu de premissa errada** — o link "Ver todos os estilos" não existe na home, que já mostra os seis; a porta nova foi rotulada pelo que a galeria acrescenta. Fica anotado que a faixa da home ainda pinta por `swatches` escritos à mão — segunda verdade, candidata a spec própria. 14 testes novos. **Onda 2 fechada.** |
| 26/08/2026 | **`painel-casal/001` implementada** — a aba Convites deixa de ser grade de miniaturas e vira lista de trabalho, com publicar/despublicar/apagar fora do editor (antes, saber o estado de cinco convites custava abrir cinco). Nasceu `contagemDeConvidados`: uma consulta em vez das cinco de `metricasDoSite`. SC-002 provado contra o banco de teste — mexer em `guests.rsvp_status` não muda o número, que sai de `groups.seats_confirmed`. A coluna CONVIDADOS segue fora: não há chave ligando convite a grupo. 22 testes novos |
| 26/08/2026 | **`painel-casal/011` implementada** — os e-mails 03 (recibo) e 04 ("seu site está no ar") passam a sair de `publishSiteForOrder`, dentro de `after()` e só quando aquela chamada publicou. Antes: o casal pagava, o site entrava no ar e ninguém avisava. **Lacuna nova achada:** `orders` não guarda `paid_at` — o recibo usa `updated_at` lido antes da transação, e o recibo só sai com pagamento confirmado. Coluna `paid_at` nullable é migração aditiva pendente do dono. Dois defeitos corrigidos de passagem: o nome do casal ia cru para dentro do HTML, e `toPlainText` não decodificava entidade. 16 testes novos. **Onda 3 fechada.** |
| 26/08/2026 | **`painel-admin/001` implementada** — `/admin/pedidos` vira tabela com filtro e busca no banco, e o `<details>` com o prompt de LLM sai da tela (ensinava o operador a montar site à mão, contra o SDD §3 e §7). Acento é achatado por `translate` e não por `unaccent`, para não depender de extensão do Postgres. 26 testes novos, 12 contra o banco. **Onda 4 fechada — e com ela as quatro ondas.** |
| 27/08/2026 | **`painel-casal/002` decidida (Opção A)** e **`003` implementada** — o convite ganha um tipo de bloco `botao`, aditivo no `jsonb`, e passa a terminar num botão que leva à confirmação em vez de um texto que levava à capa. Publicar recusa convite sem saída, no servidor. O endereço é resolvido no render: trocar o slug do site muda o botão sem tocar no `doc`. 23 testes novos |
| 27/08/2026 | **`painel-casal/004` e `005` implementadas** na mesma passada, como o INDEX recomendava. O encaixe virou módulo puro (`lib/site/inviteSnap.ts`) com 20 testes sem navegador — a parte que erra em silêncio saiu das 1.400 linhas de `PointerEvent`. Treze atalhos, com legenda alcançável na barra de zoom que escreve Cmd ou Ctrl conforme a plataforma. 34 testes novos |

---

## Um achado transversal da execução

**Critério escrito como `grep` cru não distingue o uso da citação.** Aconteceu
cinco vezes, em cinco specs de três áreas diferentes:

| Spec | O critério proibia | O que o arquivo dizia |
|---|---|---|
| `design-system/006` | palavra de fora do vocabulário | `"use cache"` é diretiva, `"preview_ready"` é valor de banco |
| `site-publico/003` | `orçamento`, `redirect(` | a página diz "**não tem** orçamento" e o comentário conta que ela "**era** um redirect" |
| `site-publico/005` | `Usar este estilo`, `← Pacotes` | o arquivo cita os dois para explicar por que não os usa |
| `painel-casal/001` | `listGroupsWithGuests` | a página cita a função para dizer por que **não** a chama |
| `painel-admin/001` | `Cancelados` | a página cita a pílula para explicar por que ela não existe |

Nas quatro últimas o teste tira os comentários antes de conferir e a spec
passa. Na `006` isso não bastou — lá o ruído está em literal de código, não em
comentário, e é por isso que ela segue Bloqueada. **Para specs futuras: um
critério de ausência precisa dizer sobre QUE parte do arquivo ele fala.**

---

## Pendências de dados abertas na execução

| O quê | Onde apareceu | Por que não entrou |
|---|---|---|
| `orders.paid_at` nullable | `painel-casal/011` | O recibo precisa da hora do pagamento e o banco não guarda. Hoje usa `updated_at` lido antes da transação de publicar, que no caminho do pagamento é o instante certo. Migração aditiva; a spec declarava "Impacto em dados: Nenhum" |
| Quem paga a renovação do domínio do "Para Sempre" | `site-publico/003` | O pacote vende `anaepedro.com.br` por R$ 99,90 uma vez, e registro `.com.br` é anual. Se o casal pagar, "sem mensalidade" ganha asterisco |
| Por quanto tempo o site de Convite e Site do Casamento fica no ar | `site-publico/003` | Sem resposta, a vitrine fica calada — que é o que ela faz hoje |
| `site_invites.group_id` nullable | `painel-casal/001` | A coluna CONVIDADOS da tabela de convites depende disso. É migração aditiva **e** decisão de produto: "um convite serve um grupo" muda o sentido de `MAX_CONVITES = 5` num casamento com 23 grupos |

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
