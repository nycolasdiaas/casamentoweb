# Roteiro de implementação — Enlace × protótipo

**32 specs, em 4 áreas.** (30 da auditoria + duas escritas durante a execução:
a `painel-casal/013`, porque a recomendação de outra spec pedia uma spec
própria, e a `site-publico/008`, porque a decisão (b) de 28/08 pediu uma
feature que não existia.) O levantamento que as gerou está em
`levantamento.md`. Cada spec tem escopo fechado, requisitos numerados e
critérios de aceite — quem implementar não deve precisar decidir nada.

**Ordem geral:** `design-system` primeiro, sempre. As outras três áreas
consomem tokens, classes de movimento e a casca de e-mail que só existem
depois dela.

---

## Como ler o status

**As 32 specs estão fechadas, e nenhuma está bloqueada.** Ou o código saiu, ou
a decisão de não fazer está escrita. Nada aqui espera por você para *fechar* —
o que espera por você está em "O que falta do dono", no fim deste arquivo.

| Status | Quantas | O que significa |
|---|---|---|
| **Implementada** | 28 | O código saiu, os critérios foram conferidos um a um, e o "como foi conferido" está no fim da spec |
| **Resolvida** | 1 | `painel-casal/002` não pedia código: ela pedia uma decisão de modelo, e ela foi tomada |
| **Rejeitada** / **Adiada** | 3 | A resposta certa era "não construa isto". O motivo e **o que a reabre** estão escritos na spec |
| **Bloqueada** | 0 | A `painel-casal/010` foi a última a sair do estado, em 27/08: o agendador dela reabria a §14 do SDD, e a reabertura foi feita **explicitamente**, escrita no próprio SDD, em vez de contornada |

**Uma spec já foi reaberta, e isso é o mecanismo funcionando.** A
`site-publico/002` fechou como Rejeitada em 27/08 anotando o que a reabriria —
cinco desenhos de molde. Eles chegaram no dia seguinte, e ela reabriu e fechou
na Opção B. É para isso que a linha "o que reabre" existe em cada spec
rejeitada.

Os status originais da auditoria (`Pronta`, `Pronta ¹`, `CONFLITO`) sobrevivem
só no registro de execução abaixo, que conta como cada uma chegou onde chegou.

---

## Ordem recomendada

### Onda 1 · Design system (base de tudo)

| # | Spec | Status | Depende de | É pré-requisito de |
|---|---|---|---|---|
| 1 | [`design-system/001-token-ink-3`](design-system/001-token-ink-3/spec.md) — o oitavo neutro da Fundação A1 | **Implementada** | — | `site-publico/003`, `painel-casal/001`, `painel-admin/001` e `002` |
| 2 | [`design-system/006-voz-verificavel`](design-system/006-voz-verificavel/spec.md) — as listas de Voz V5 viram teste | **Implementada** | — | toda spec que escreve texto novo |
| 3 | [`design-system/002-push-de-rota`](design-system/002-push-de-rota/spec.md) — transição #1, com direção e sem `blur` | **Implementada** | — | `003`, `004`, `005` (vocabulário de movimento) |
| 4 | [`design-system/003-dialogo`](design-system/003-dialogo/spec.md) — transição #3 | **Implementada** | `002` | `painel-casal/001` |
| 5 | [`design-system/004-brinde`](design-system/004-brinde/spec.md) — transição #4, a confirmação efêmera | **Implementada** | `002`, `003` | `painel-casal/006`, `008` |
| 6 | [`design-system/005-publicar-no-ar`](design-system/005-publicar-no-ar/spec.md) — transição #6 e o sinal `?publicado=1` | **Implementada** | `002` | `painel-casal/008` |
| 7 | [`design-system/007-casca-de-email`](design-system/007-casca-de-email/spec.md) — tabela de 600px, preheader, botão de tinta | **Implementada** | `006` | `site-publico/006`, `painel-casal/011` |

¹¹ **Rejeitada / Adiada** não é "não deu tempo": é a decisão registrada, com
o motivo, dentro da própria spec. Uma spec cuja resposta certa é "não construa
isto" está terminada quando isso está escrito. As três têm o que as reabre
anotado — um provedor de e-mail e uma decisão de LGPD (`site-publico/006`), o
resumo semanal sair de verdade (`painel-casal/009`), e a primeira contratação
(`painel-admin/004`). A quarta, `site-publico/002`, **já reabriu**: o gatilho
dela eram cinco desenhos de molde, e eles chegaram em 28/08.

¹² A `010` fechou em 27/08/2026 com **Vercel Cron**, e a §14 decisão 4 do SDD
foi **reaberta explicitamente** — a reabertura está escrita no próprio SDD, com
a razão. Ela é entregue **desligada**: sem `CRON_SECRET` a rota responde 503 e
nada é enviado. Para ligar faltam duas coisas do dono — o segredo configurado e
um provedor de e-mail com domínio verificado.

¹⁰ A `002` fechou na **Opção A** em 27/08/2026: o casamento legado foi
**movido** (não reescrito) para `/admin/casamento`, e o dashboard ocupou
`/admin/dashboard`. A janela de congelamento do SDD §13.1 começa em outubro e o
casamento é 16/10 — cinquenta dias de folga. As contagens do banco foram
conferidas depois da mudança: 23 grupos, 31 convidados, 23 confirmações,
intactas.

⁹ A `007` fechou na **Opção B** em 27/08/2026: o H5 do artboard continua
recusado (ele afirma que o pagamento "não foi confirmado", e a Enlace não
observa o Pix), mas a necessidade dele era real e ganhou uma tela que só diz o
que é verdade. O texto foi aprovado pelo agente `regras-de-negocio`, com três
trocas de palavra, e a lista de palavras proibidas virou teste.

⁸ A `004` fechou na **Opção A** em 27/08/2026: a rota vira atalho permanente
para a prévia real. Nasceu `/comecar` de passagem — a decisão de destino pela
sessão virou rota, porque `CtaPacote` é server component e as prévias são
client de ponta a ponta.

² A `006` foi **desbloqueada em 27/08/2026**. A conclusão de 25/08 ("um
literal de string não é texto visível") estava certa sobre o que faltava e
errada sobre ser impossível: o discriminador não é léxico, é **posicional** —
import é import, diretiva é diretiva, argumento de `cacheTag` é etiqueta de
cache, e o compilador distingue cada um. **98 → 18 → 0**, e os 18 eram todos
reais. Corrigi-los revelou mais quatro, incluindo os três `RSVP` que o
convidado via nos moldes.

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
| 11 | [`site-publico/004-exemplo-por-pacote`](site-publico/004-exemplo-por-pacote/spec.md) — B3 | **Implementada ⁸** | `site-publico/001`, `003` | Decisão: redirecionar com o pacote, ou assumir a divergência |
| 12 | [`site-publico/002-largura-do-site`](site-publico/002-largura-do-site/spec.md) — F1 em largura cheia | **Implementada ¹³** | `site-publico/001` | Fechou duas vezes: Opção C em 27/08, e **Opção B em 28/08** quando os cinco desenhos que faltavam chegaram |
| 13 | [`site-publico/006-emails-para-o-convidado`](site-publico/006-emails-para-o-convidado/spec.md) — modelos 05 e 06 | **Rejeitada ¹¹** | `design-system/007` | O produto não guarda e-mail de convidado, e coletá-lo é decisão do dono |
| 14 | [`site-publico/007-h5-pix-nao-confirmado`](site-publico/007-h5-pix-nao-confirmado/spec.md) — H5 | **Implementada ⁹** | — | Registro. O Pix vai direto para o casal; a Enlace não observa a falha |
| 15 | [`site-publico/008-site-que-expira`](site-publico/008-site-que-expira/spec.md) — o prazo de Convite e Site | **Implementada ¹⁴** | `painel-casal/011` | **Não veio do protótipo:** veio da decisão (b) de 28/08. Entregue **inerte** |

¹³ A `002` fechou na **Opção B** em 28/08/2026. A condição que a decisão de
27/08 escreveu — *"no dia em que existir F1 para os seis moldes, a Opção B
volta à mesa"* — foi cumprida por `Enlace - Estilos Completos.dc.html` (os seis
moldes inteiros a 1920) e `Enlace - Estilos 1920.dc.html`. O cartão passou de
`lg:max-w-[1120px]` para `lg:max-w-[1920px]`, e **o corte é `xl` (1280), não
`lg`** — a capa de duas colunas do Editorial estoura a 1024 e rolaria a página
na horizontal, reprovando o SC-004 da própria spec. O teto é 1920 e não `none`
de propósito: é a largura em que os seis foram desenhados. O celular não mudou.

¹⁴ A `008` é a única spec do pacote que **não veio do protótipo**. Ela é
entregue **INERTE**: `PRAZO_ANUNCIADO_EM` é `null`, nenhum site tem prazo, e o
cron não tem o que arquivar. A trava existe porque a data é calculada na
publicação — sem ela, um pedido pago hoje, lendo uma vitrine que não promete
prazo nenhum, ganharia um prazo que ninguém mostrou a ele. Ver "O que falta do
dono", item 2b.

---

### Onda 3 · O painel do casal

**As specs 002 a 007 são o editor de convite** e precisam ser lidas na ordem:
`002` decide o modelo de dados, e as cinco seguintes constroem sobre ele.

| # | Spec | Status | Depende de | Nota |
|---|---|---|---|---|
| 16 | [`painel-casal/001-aba-convites`](painel-casal/001-aba-convites/spec.md) — E7, a grade vira lista de trabalho | **Implementada** | `design-system/001`, `003` | A coluna `CONVIDADOS` fica de fora: não há chave ligando convite a grupo |
| 17 | [`painel-casal/002-modelo-do-convite`](painel-casal/002-modelo-do-convite/spec.md) — `InviteDoc` × handoff §2 | **Resolvida** | — | **Opção A, decidida em 27/08.** Destravou 003 a 006 |
| 18 | [`painel-casal/003-botao-de-confirmacao`](painel-casal/003-botao-de-confirmacao/spec.md) — o convite precisa levar ao RSVP | **Implementada** | `002`, `design-system/006` | Aditivo no `jsonb`; sem migração |
| 19 | [`painel-casal/004-snap-e-guias`](painel-casal/004-snap-e-guias/spec.md) — encaixe de 6px e guias magenta | **Implementada** | `002` | |
| 20 | [`painel-casal/005-atalhos-do-editor`](painel-casal/005-atalhos-do-editor/spec.md) — os atalhos de §7 | **Implementada** | `002`, `004` | Fazer junto com `004`: mesmo arquivo de 1.417 linhas |
| 21 | [`painel-casal/006-autosave-do-editor`](painel-casal/006-autosave-do-editor/spec.md) — debounce de 800ms + rascunho local | **Implementada** | `002`, `design-system/004` | Hoje fechar a aba perde o trabalho |
| 22 | [`painel-casal/007-painel-de-modelos`](painel-casal/007-painel-de-modelos/spec.md) — a quinta ferramenta | **Implementada ⁷** | `002` | Decisão: "trocar de modelo" re-tematiza ou refaz? |
| 23 | [`painel-casal/008-e10-publicar`](painel-casal/008-e10-publicar/spec.md) — E10 sem o checkout | **Implementada ⁵** | `design-system/004`, `005` | O checkout embutido foi cancelado pelo dono; o resto é implementável |
| 24 | [`painel-casal/011-emails-do-casal`](painel-casal/011-emails-do-casal/spec.md) — recibo e "seu site está no ar" | **Implementada** | `design-system/006`, `007` | Hoje o casal paga, o site publica, e ninguém avisa |
| 25 | [`painel-casal/012-tela-de-geracao`](painel-casal/012-tela-de-geracao/spec.md) — transição #8 | **Implementada ⁶** | `design-system/006` | O piso de 2,5s do handoff é espera inventada (regras §2.2) |
| 26 | [`painel-casal/009-preferencias-de-aviso`](painel-casal/009-preferencias-de-aviso/spec.md) — J2 | **Adiada ¹¹** | `011` | Sem e-mail sendo enviado, a tabela não liga nada |
| 27 | [`painel-casal/010-resumo-semanal`](painel-casal/010-resumo-semanal/spec.md) — J3 | **Implementada ¹²** | `007`, `011` | Falta agendador; e a §14 decisão 4 do SDD precisa ser reaberta |
| 28 | [`painel-casal/013-cancelar-vira-estado`](painel-casal/013-cancelar-vira-estado/spec.md) — cancelar vira estado, não `DELETE` | **Implementada ¹⁵** | `painel-admin/001` | **Não veio do protótipo:** veio da decisão 11. É a **única migração irreversível** do trabalho |

⁴ A `002` fechou na **Opção A** em 27/08/2026, por decisão de Nycolas: o
modelo implementado vence e o handoff §2 vira divergência assumida, escrita no
topo de `lib/site/inviteDoc.ts`. Com isso as quatro retidas voltaram a
`Pronta`.

¹⁵ A `013` foi escrita **durante** a execução, em 27/08: a pergunta 1 da
`painel-admin/001` mostrou que a pílula `Cancelados` não tinha o que mostrar
porque `deleteOrder` apagava a linha do pedido. Ela corrige de passagem o site
órfão que o `AGENTS.md` registra, e devolve a pílula que a `painel-admin/001`
teve de excluir. Vem **depois** da `painel-admin/001` na ordem, mas é a única
da onda 3 que depende da onda 4.

---

### Onda 4 · O admin

| # | Spec | Status | Depende de | Nota |
|---|---|---|---|---|
| 29 | [`painel-admin/001-pedidos-como-tabela`](painel-admin/001-pedidos-como-tabela/spec.md) — G4 com filtros e busca | **Implementada** | `design-system/001` | Tira da tela o prompt de LLM do fluxo antigo |
| 30 | [`painel-admin/003-presentes-entre-casais`](painel-admin/003-presentes-entre-casais/spec.md) — G5 | **Implementada ⁵** | `design-system/001` | O cartão "A repassar" contradiz regras §2.4 e fica fora |
| 31 | [`painel-admin/002-dashboard-da-operacao`](painel-admin/002-dashboard-da-operacao/spec.md) — G3, e o destino do casamento legado | **Implementada ¹⁰** | `design-system/001` | Mexer no endereço da tela que o dono usa exige janela segura (§13.1) |
| 32 | [`painel-admin/004-grupos-e-permissoes`](painel-admin/004-grupos-e-permissoes/spec.md) — G2 | **Adiada ¹¹** | `002` | A pergunta é anterior ao código: existe mais de um operador? |

⁷ A `007` fechou na **Opção A** em 27/08/2026: trocar de modelo é cor e fonte,
nunca o desenho. A evidência estava no próprio protótipo — as seis miniaturas do
artboard E9 são o mesmo cartão com cores trocadas.

⁶ A `012` fechou na **Opção A** em 27/08/2026: o piso de 2,5s do handoff não
volta. Ele já existiu no produto, gerou a crítica "ter que aguardar o site" e
foi removido — restaurá-lo seria reabrir uma crítica do próprio dono. Um teste
reprova se os números voltarem ao arquivo.

⁵ Os dois `[CONFLITO]` da `003` nunca foram pergunta em aberto: a spec já os
resolvia excluindo o cartão "A repassar" e a coluna `STATUS` dos requisitos.
Implementar a spec **é** deixá-los de fora, e agora um teste reprova se as
palavras voltarem.

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
| 27/08/2026 | **`painel-casal/006` implementada** — autosave com debounce de 800ms, rascunho em `localStorage` e guarda de conflito por `updatedAt`. Antes, fechar a aba perdia o trabalho. Três recusas do lint viraram três módulos melhores: `useAgora`, `useRascunhoLocal` e `quando()` extraído de `Avisos.tsx` — duas faixas de tempo escritas separadamente divergiriam. 23 testes novos, 6 contra o banco. **As quatro que a `002` destravou estão fechadas.** |
| 27/08/2026 | **`painel-admin/003` implementada** — `/admin/presentes` passa a mostrar as contribuições de TODOS os casais, e não só as do casamento legado. A consulta global é a única sem `siteId` no arquivo, e um teste varre `app/`, `lib/` e `components/` para garantir que só o admin a importe. O cartão "A repassar" e a coluna `STATUS` ficaram de fora, como a spec determinava, e viraram guarda: um teste reprova se as palavras voltarem. 10 testes novos |
| 27/08/2026 | **`painel-casal/008` implementada** — E10, sem o checkout embutido que o dono cancelou. A prévia do painel era boa demais: o casal via o site montado e concluía que já estava no ar. Agora diz três vezes que não — faixa, marca d'água sobre a miniatura e cartão do que muda ao publicar — e comemora uma vez quando publica. O ícone saiu com 16px e não os 17 do artboard: a escala da Prensa é fechada em tipo. 14 testes novos |
| 27/08/2026 | **`painel-casal/012` implementada (Opção A)** — o piso de espera não volta, e agora um teste reprova se os números voltarem ao arquivo. O que o produto devia ao handoff era um ponto só: **a falha do provisionamento passa a acontecer onde a pessoa está olhando** — barra em vermelho onde parou, esqueleto parado, pétalas fora, e um `Tentar de novo` que REENVIA. Antes, a tela sumia e o casal descobria o erro na tela seguinte. 14 testes novos |
| 27/08/2026 | **`painel-casal/007` implementada (Opção A)** — o painel de Modelos do editor de convite. Trocar de modelo troca cor e fonte; a cor que o casal escolheu à mão atravessa intacta, que é o que separa re-tematizar de sobrescrever. Correção registrada: **FR-001 partiu de premissa errada** — não existe "trilha de ferramentas", o painel é uma pilha de seções. As paletas são extraídas no servidor: importar o registry num client component reprova o build por causa do `use cache`. 20 testes novos |
| 27/08/2026 | **`site-publico/004` implementada (Opção A)** — `/pacotes/exemplo/:pacote` deixa de engolir qualquer coisa: pacote inválido é 404 e válido é 308 para a prévia real, com a faixa EXEMPLO no topo. Nasceu `/comecar`, a rota que decide o destino pela sessão — `CtaPacote` é server component e as prévias são client de ponta a ponta. 9 testes novos |
| 27/08/2026 | **`site-publico/007` implementada (Opção B)** — o convidado que abre o QR e fecha sem avisar deixa de ficar sem saber o que aconteceu. A tela diz para onde o dinheiro vai, que a Enlace não consegue ver, e que desistir não deixou nada pendurado no nome dele. Texto aprovado pelo `regras-de-negocio` com três trocas de palavra; doze palavras proibidas viraram teste. 12 testes novos |
| 27/08/2026 | **`painel-admin/002` implementada (Opção A)** — o dono passa a ter número sobre o próprio negócio: pedidos, receita, sites no ar e conversão, com 14 dias de barras e a divisão por pacote. Receita é o valor dos PACOTES e só — presente é dinheiro do casal, e um teste reprova se ele entrar. O casamento legado foi movido para `/admin/casamento` sem uma linha reescrita, e as contagens do banco foram conferidas depois: 23/31/23/23, intactas. 26 testes novos, 15 contra o banco |
| 27/08/2026 | **`design-system/006` desbloqueada e implementada** — o bloqueio era técnico e caiu: o discriminador de "texto visível" não é léxico, é posicional, e o compilador já sabia distinguir. **98 achados → 18 → 0**, com os 18 todos reais. Corrigi-los revelou mais quatro escondidos atrás do ruído, incluindo os três `RSVP` que o convidado via nos moldes Editorial e Toscana — a pior violação de voz que o produto tinha no ar. A guarda está na suíte. 5 testes novos |
| 27/08/2026 | **As cinco últimas fechadas por decisão, não por código.** `site-publico/002` (Opção C: o cartão fica — a Opção B é redesenho de 6 moldes e o protótipo desenha um), `site-publico/006` (não: LGPD, quem digita, e o Gmail SMTP não sustenta 400 envios por casamento), `painel-casal/009` (adiada: transacional não se desliga, e aviso recorrente ainda não existe), `painel-admin/004` (adiada: um operador só — e foi isso que destravou o dashboard). **`painel-casal/010` é a única aberta**: o agendador dela reabre a §14 do SDD, e isso é seu |
| 27/08/2026 | **`painel-casal/013` escrita e implementada** — a spec que a decisão 11 pedia e que ninguém tinha escrito: cancelar pedido vira **estado**, não `DELETE`. Corrige de passagem o site órfão que o `AGENTS.md` registra, e devolve a pílula `Cancelados` que `painel-admin/001` teve de excluir por falta do estado. É a **única migração** de todo este trabalho — aditiva, e com a janela antes de outubro. **Migração `0018` aplicada em produção** em 27/08, com `backup:full`, rollback escrito antes e `db:rehearse` aprovado. Enum com 7 valores, zero linhas `cancelled`, e as contagens do casamento idênticas ao backup |
| 27/08/2026 | **`painel-casal/010` implementada — a última.** Vercel Cron, com a **§14 decisão 4 do SDD reaberta explicitamente** e a reabertura escrita no próprio documento. Entregue **desligada**: sem `CRON_SECRET` a rota responde 503. O descadastro entrou junto (segunda migração aditiva) porque e-mail recorrente com link morto vira denúncia de spam — e isso custa o domínio que manda o recibo. 13 testes novos, todos contra o banco |
| 28/08/2026 | **Anderson respondeu as três perguntas abertas**, e duas delas não eram perguntas de texto. (a) O casal paga só o plano, nada do domínio — mas **não existe código de domínio próprio**, e sobra decidir se o endereço prometido é um `.com.br` de verdade ou o subdomínio da Fase 2. (b) Convite e Site ficam no ar até alguns meses depois do casamento — **isto é feature, não texto**, e virou a `site-publico/008`. (c) Um convite é um MODELO, não é de um grupo: `MAX_CONVITES = 5` está certo e a coluna `CONVIDADOS` sai de escopo de vez |
| 28/08/2026 | **`orders.paid_at` aplicada** (migração `0021`). O recibo passa a ler a hora real do pagamento em vez de `updated_at`. Os 13 pedidos anteriores ficam com `null` e continuam caindo em `updated_at`, como antes: a hora real deles não é reconstituível, então **não houve backfill**. Era a última pendência de dados aberta |
| 28/08/2026 | **`site-publico/002` reaberta e fechada na Opção B.** Os cinco desenhos que a decisão de 27/08 nomeou como gatilho chegaram — `Enlace - Estilos Completos.dc.html` traz os seis moldes inteiros a 1920, com paleta e fonte conferidas contra `TEMPLATE_STYLES`. O cartão foi para `lg:max-w-[1920px]`, e a composição de largura cheia entra em **`xl` e não `lg`**: a capa de duas colunas do Editorial estoura a 1024 e rolaria a página na horizontal. O celular não mudou — tudo atrás de `xl:`. Três coisas dos desenhos **não** foram portadas por não existirem no banco, e a lavagem clara do Toscana foi recusada com motivo (ela pressupõe a foto do mockup; aqui a foto é a que o casal subir) |
| 28/08/2026 | **`site-publico/008` escrita e implementada** — a expiração que a decisão (b) pedia. Migração `0020` (`sites.expires_at` nullable, **0 datas gravadas**). Entregue **INERTE**: `PRAZO_ANUNCIADO_EM` é `null`, e enquanto for, nenhum site ganha prazo. A trava saiu de um parecer **NÃO PODE** do `regras-de-negocio`: um pedido pago hoje, lendo uma vitrine que não promete prazo nenhum, não pode ganhar prazo depois. Cinco requisitos mudaram na execução pelo mesmo parecer — os três avisos perderam o descadastro (são transacionais), a data foi do `SiteNoAr` para o sino, e a FR-010 (admin estende o prazo) foi adiada e virou condição de a vitrine poder prometer. 40 testes novos |

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
| ~~`orders.paid_at` nullable~~ — **APLICADA (migração `0021`, 28/08/2026)** | `painel-casal/011` | O recibo precisa da hora do pagamento e o banco não guarda. Hoje usa `updated_at` lido antes da transação de publicar, que no caminho do pagamento é o instante certo. Migração aditiva; a spec declarava "Impacto em dados: Nenhum" |
| ~~Quem paga a renovação do domínio~~ — **DECIDIDO 28/08/2026** | `site-publico/003` | **O casal paga só o plano, nada do domínio.** Decisão de Anderson. Segue uma pergunta menor, escrita em "O que falta do dono": se o endereço prometido é um `.com.br` de verdade (custa ~R$ 40/ano por casal, para sempre) ou o subdomínio `ana-e-pedro.enlace.com.br` que a Fase 2 já planeja (custa zero) |
| ~~Por quanto tempo o site de Convite e Site fica no ar~~ — **DECIDIDO 28/08/2026** | `site-publico/003` | **Até alguns meses depois do casamento.** Decisão de Anderson. **Não é mudança de texto: é feature que não existe.** Não há coluna de expiração no schema, nem nada que tire um site do ar, nem aviso antes de vencer. Enquanto não for construída, a vitrine não pode prometer o prazo — prometer o que o código não cumpre é pior que ficar calado |
| ~~`site_invites.group_id` nullable~~ — **NÃO SERÁ FEITA (28/08/2026)** | `painel-casal/001` | **Um convite é um MODELO, não é de um grupo.** Decisão de Anderson. `MAX_CONVITES = 5` está certo como está: o casal faz duas ou três versões e manda para os 23 grupos. Sem vínculo a grupo, a coluna CONVIDADOS da tabela de convites não tem o que mostrar e sai de escopo |

**As quatro acima estão fechadas. Uma nova nasceu em 28/08, e ela é de
conteúdo, não de operação:**

| O quê | Onde apareceu | Situação |
|---|---|---|
| A **segunda dupla da história** — uma linha do tempo com citações datadas ("2019 — o começo", "2025 — o pedido") | `site-publico/002`, ao portar os desenhos de 1920 | **Aberta, não decidida.** `site_content.story` é **um** campo de texto livre; os desenhos compõem duas citações com data. É o **único campo de conteúdo que os desenhos pedem e o banco não tem** — o Clássico já registrava a mesma omissão em comentário desde o porte original. Migração aditiva (§13.1), não decidida aqui |

---

## As 11 decisões que travavam trabalho — todas tomadas

**Nenhuma delas trava mais nada.** Cada uma foi fechada seguindo a recomendação
escrita na própria spec, e a decisão está registrada no fim da spec com a razão.

Elas continuam aqui porque **todas são revogáveis**: se você discordar de
alguma, a linha da direita é exatamente o que foi decidido no seu lugar, e a
spec diz o que muda ao reverter.

| # | Decisão | Onde | O que foi decidido (= a recomendação da spec) |
|---|---|---|---|
| 1 | Qual modelo de dados do convite vale? | `painel-casal/002` | O implementado vence; o handoff §2 vira divergência assumida |
| 2 | "Trocar de modelo" no convite re-tematiza ou refaz? | `painel-casal/007` | Re-tematizar, preservando o que o casal escolheu à mão |
| 3 | O piso de 2,5s da tela de geração volta? | `painel-casal/012` | Não. É espera inventada, e já foi removida uma vez por crítica do dono |
| 4 | O Enlace passa a coletar e-mail de convidado? | `site-publico/006` | Não. Os dois modelos viram peça de WhatsApp, que já existe |
| 5 | O checkout do pacote vem para dentro do produto? | `painel-casal/008` | Não. Já cancelado pelo dono; o AbacatePay faz isso |
| 6 | Como fechar o buraco que H5 tentava fechar? | `site-publico/007` | Uma tela honesta, com outro texto — sem afirmar o que a Enlace não sabe |
| 7 | `/pacotes/exemplo/:pacote` volta a existir? | `site-publico/004` | Sim, como redirect para a prévia real no pacote certo |
| 8 | O site do casal cresce para 1440? | `site-publico/002` | **Já revista, e é a única.** Opção C em 27/08 (assumir a divergência), **Opção B em 28/08** quando os cinco desenhos chegaram: largura cheia de verdade, com teto em **1920** e corte em `xl`. Decisão de Anderson |
| 9 | O casamento legado sai de `/admin` e `/admin/dashboard`? | `painel-admin/002` | Sim, para `/admin/casamento` — **fora da janela do casamento** |
| 10 | Existe mais de uma pessoa operando o Enlace? | `painel-admin/004` | Se não, adiar G2 inteiro |
| 11 | Cancelar pedido vira estado em vez de `DELETE`? | **`painel-casal/013`, escrita em 27/08** | A spec própria que a recomendação pedia. Fechada e pronta; é a **única migração** de todo o trabalho, e a janela é antes de outubro |

---

## Impacto em dados — o mapa completo

**Quatro migrações foram executadas em produção**, todas aditivas puras, cada
uma com backup novo, rollback escrito ANTES, ensaio aprovado e contagens
conferidas depois: a `0018` (`order_status` ganha `cancelled`), a `0019`
(`users.weekly_digest_opt_out`), a `0020` (`sites.expires_at`) e a `0021`
(`orders.paid_at`). As contagens do casamento real ficaram idênticas nas
quatro: **23 grupos, 31 convidados, 23 lugares confirmados**.

**Só a `0018` não é reversível** — `ADD VALUE` de enum não volta atrás no
Postgres. As outras três são `add column` nullable, e um `drop column` as
desfaz enquanto nada tiver sido gravado (a `0020` tem **0 datas** e a `0019`
**0 opt-out**).

Das outras specs que exigiam schema, duas foram rejeitadas ou adiadas e uma
(`painel-casal/003`) resolveu-se dentro do `jsonb`, sem tocar em coluna.

O que ficou como **pendência aditiva**, com o motivo, está na seção
"Pendências de dados abertas na execução" mais acima. Todas são
`add column` nullable — nenhuma apaga, reescreve ou torna obrigatório.

| Spec | Migração | Natureza |
|---|---|---|
| `painel-casal/003` | nenhuma — **feita** | Tipo novo de bloco dentro do `jsonb` de `site_invites.doc` |
| `site-publico/006` | ~~`guests.email`~~ — **rejeitada** | O produto não passa a coletar e-mail de convidado |
| `painel-casal/009` | ~~`users.aviso_prefs`~~ — **adiada** | Sem aviso recorrente, não há o que configurar |
| `painel-casal/010` | `users.weekly_digest_opt_out` (nullable) — **APLICADA** | Aditiva, sem default e sem backfill. O descadastro não era extra: e-mail recorrente com link morto vira denúncia de spam, e isso custa o domínio |
| `painel-casal/013` | `ALTER TYPE order_status ADD VALUE 'cancelled'` (`0018`) — **APLICADA** | **Aditiva pura**, e a única **irreversível** do trabalho. `ADD VALUE` de enum não volta: o rollback é não usar o valor, e está escrito em `docs/rollback-0017-cancelled.md` |
| `site-publico/008` | `sites.expires_at timestamptz` (nullable) (`0020`) — **APLICADA** | Aditiva, sem default e sem backfill. `null` = "nunca expira", que é o que os 17 sites de então continuam sendo — **inclusive o casamento de 16/10/2026**. Reversível por `drop column` enquanto nenhuma data for gravada, e nenhuma foi |
| `painel-casal/011` | `orders.paid_at timestamptz` (nullable) (`0021`) — **APLICADA** | Aditiva. Os 13 pedidos anteriores ficam `null` e caem em `updated_at`, como antes: a hora real deles não é reconstituível |
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
| ~~Geometria seção a seção dos 6 moldes~~ — **CHEGOU EM 28/08/2026** | Era a lacuna que a `site-publico/002` nomeava: *"o protótipo desenha F1 num estilo só"*. `Enlace - Estilos Completos.dc.html` desenhou os seis inteiros a 1920, com os sete blocos de cada um — e foi o que permitiu fechar a Opção B |
| Alças e ângulo de rotação do editor | Não dá para afirmar por leitura de código. Marcado como "investigação necessária" em `levantamento.md` §3.2 |
| Diferenças de 1–2px | Só entraram divergências prováveis por valor de token ou de classe |
| Multisseleção no editor (handoff §5) | Muda o modelo de seleção inteiro; merece spec própria |
| Saída da transição de rota (`translateX(-8%)`) | Exige View Transitions ou `AnimatePresence`; muda a navegação do painel — `design-system/002`, pergunta 1 |
| Auditoria e reembolso no admin | O próprio `README.md` do pacote (§5) os lista como não desenhados |
| 2FA no admin | O artboard G1 anuncia; o produto **corretamente** não anuncia porque não existe |
| Verificação de e-mail | Só existe na branch órfã `feedback-001`, que não deve ser mesclada (`AGENTS.md` §6). É frente própria — `painel-casal/011`, pergunta 1 |

---

## O que falta do dono — e como fazer

Nada aqui bloqueia o código que já saiu. É tudo coisa que **liga** o que está
entregue desligado, ou que responde uma pergunta que só você pode responder.

Em ordem de quanto custa deixar como está.

### 1. O `CRON_SECRET` · custa duas features paradas

**São duas rotas desligadas pelo mesmo segredo**, e ligar uma liga a outra:
`/api/cron/resumo-semanal` (`painel-casal/010`) e `/api/cron/expirar-sites`
(`site-publico/008`). As duas respondem **503 sem `CRON_SECRET`**, de propósito:
uma rota pública que dispara e-mail para todos os casais ativos é um canhão de
spam com URL.

O agendamento do resumo já está no repo — `vercel.json` chama
`/api/cron/resumo-semanal` toda **segunda às 8h de Brasília**. Faltam três
coisas, todas fora do código:

1. **Plano Pro na Vercel.** O Cron não existe no Hobby. A §9.2 do SDD já o
   listava como obrigatório.
2. **`CRON_SECRET`.** Gere um valor aleatório e ponha em *Settings →
   Environment Variables* do projeto na Vercel. A Vercel manda esse valor
   sozinha no cabeçalho `Authorization` — você não configura nada do outro
   lado. Ponha o mesmo valor no seu `.env.local` para poder testar local.
3. **Um provedor de e-mail com domínio verificado** (`RESEND_API_KEY` e
   `RESET_EMAIL_FROM`, hoje vazias). O Gmail SMTP com senha de app tem
   ~500 destinatários/dia — serve para o recibo, não para envio recorrente.

**Enquanto os três não existirem, nada quebra.** As rotas respondem 503,
ninguém recebe, e o resto do produto não sabe que elas existem. O cron de
expiração tem uma **segunda** trava, independente desta — ver 2b.

### 2. As três decisões de 28/08/2026 — tomadas, com consequência

Anderson respondeu as três. Duas delas **não eram perguntas de texto**: elas
esbarram em coisa que o código não tem.

**a) O casal paga só o plano, nada do domínio.** Decidido.

Falta uma distinção que muda o custo de "zero" para "para sempre": a vitrine
promete *"Endereço personalizado (ex: `anaepedro.com.br`)"*, e **não existe
nenhum código de domínio próprio** — nem coluna no schema, nem registro, nada.
O que o `lib/siteSlug.ts` planeja para a Fase 2 é `ana-e-pedro.enlace.com.br`,
um subdomínio, que **não custa nada e não renova**. Um `.com.br` de verdade
custa ~R$ 40/ano por casal, para sempre, contra R$ 99,90 cobrados uma vez.

Se a intenção era o subdomínio, a decisão sai de graça e o **exemplo da vitrine
está errado** — precisa virar `ana-e-pedro.enlace.com.br`.

**b) O site de Convite e Site do Casamento fica no ar até alguns meses depois
do casamento.** Decidido — e **isto era feature, não texto. Ela foi construída
em 28/08**, na `site-publico/008`, com `MESES_APOS_O_CASAMENTO = 12` que você
confirmou.

**Está entregue INERTE, e é aqui que falta você.** `PRAZO_ANUNCIADO_EM` em
`lib/site/expiracao.ts` é `null`, e enquanto for, `calcularExpiracao` devolve
`null` para todo mundo: **nenhum site tem prazo, e o cron não tem o que
arquivar**. A maquinaria está montada, testada (40 testes) e parada.

A trava veio de um parecer **NÃO PODE** do agente `regras-de-negocio`, e a
regra que a sustenta é *"o preço está na tela e é o preço"*: como a data é
calculada **na publicação**, um pedido pago hoje — lendo uma vitrine que não
promete prazo nenhum — ganharia um prazo que ninguém mostrou a ele.

**A ordem é construir, depois prometer, e falta o último passo:**

1. a **FR-010** (o admin ver e estender o prazo) foi **adiada** porque não
   existe tela de site no admin. Ela é **condição** de a vitrine poder
   prometer: a primeira venda com prazo gera um pedido de exceção ("meu
   casamento adiou"), e a alternativa a um campo editável é um `UPDATE` escrito
   à mão no banco de produção;
2. só então `lib/packages.ts` ganha a linha do prazo (passando pelo
   `regras-de-negocio`, como o `AGENTS.md` §5 exige);
3. e **`PRAZO_ANUNCIADO_EM` recebe a data desse dia** — a partir dali, só
   pedidos novos expiram. A conta é sobre `orders.created_at`, não sobre o
   site: vale quando o casal leu a proposta.

**Segue aberta, e é sua:** por quanto tempo a Enlace guarda um site fora do ar.
Você respondeu *"não sei ainda"* em 28/08, e o produto está no estado seguro
enquanto estiver — os textos dizem **"nada foi apagado"** (fato, no passado) e
não prometem prazo nenhum de guarda.

**c) Um convite é um MODELO, não é de um grupo.** Decidido, e este fecha de
graça: `MAX_CONVITES = 5` está certo, **nenhuma migração é necessária**, e a
coluna CONVIDADOS da tabela de convites sai de escopo por não ter o que mostrar.

### 3. As colunas · as antigas fecharam, uma nova apareceu

A `site_invites.group_id` morreu na decisão (c), e a última pendente saiu:

- ~~**`orders.paid_at`**~~ — **FEITA em 28/08/2026**, migração `0021`. O
  recibo passa a ler a hora real do pagamento. Os 13 pedidos anteriores ficam
  com `null` e continuam caindo em `updated_at`, como antes: a hora real deles
  não é reconstituível, então não houve backfill.

**Nenhuma pendência de operação continua aberta.** Mas o porte dos desenhos de
1920 levantou uma de **conteúdo**, e ela é decisão sua:

- **A segunda dupla da história.** Os seis desenhos compõem a história como uma
  linha do tempo de duas citações datadas ("2019 — o começo", "2025 — o
  pedido"), e `site_content.story` é **um** campo de texto livre. É o único
  campo de conteúdo que os desenhos pedem e o banco não tem — o Clássico já
  registrava a mesma omissão em comentário desde o porte original. Migração
  aditiva, e ela **muda o questionário**: passa a haver duas perguntas onde
  havia uma, num produto cuja promessa é "vocês não vão trabalhar". Por isso
  não foi tomada de passagem.

### 4. Dois textos para você ler · 10 minutos

- **Os seis preheaders de e-mail** (a linha que aparece na caixa de entrada
  antes de abrir). Estão em `lib/email.ts`, e são a única parte do e-mail que a
  pessoa lê sem decidir ler.
- **A linha sugerida para `docs/regras-de-negocio.md` §2.4**, que registra por
  escrito que a Enlace nunca vê o dinheiro do presente. Ela está escrita na
  `site-publico/007`; hoje a regra existe no código e nos testes, mas não no
  documento que decide.

### 5. As 11 decisões que tomei no seu lugar · revogáveis

Estão na tabela acima. Cada uma seguiu a recomendação escrita na própria spec,
e nenhuma é irreversível — **com uma exceção que vale saber**: a migração `0018`
acrescentou `cancelled` ao enum `order_status`, e `ADD VALUE` de enum não
volta atrás no Postgres. O rollback é não usar o valor, e está escrito em
`docs/rollback-0017-cancelled.md`. Como nenhum pedido foi cancelado ainda, o
custo real de reverter hoje é zero.

**Uma delas você já reviu, e o mecanismo funcionou.** A decisão 8 (a largura do
site) fechou em 27/08 na Opção C anotando o gatilho de reabertura — cinco
desenhos de molde. Eles chegaram em 28/08, ela reabriu, e você fechou na Opção
B. É exatamente para isso que cada spec rejeitada carrega a linha "o que
reabre": a decisão não é uma porta fechada, é uma condição escrita.

### 6. Pendências que já existiam antes deste trabalho

Não vieram das specs; estavam no `AGENTS.md`. Ficam registradas para não se
perderem:

- **Verificação de e-mail** — existe só na branch órfã `feedback-001`, que não
  deve ser mesclada. É frente própria, a reconstruir sobre a arquitetura de
  hoje.
- **`ABACATEPAY_WEBHOOK_SECRET`** — o `AGENTS.md` a lista como vazia, mas ela
  **está preenchida** no `.env.local`. Vale conferir se está também na Vercel;
  se estiver, essa pendência morreu e a linha pode sair do documento.
- **Um site descartável `shot-classico-*`** sobrou de uma sessão de fotos de
  molde.

---

> **Nota de procedência, 13/09/2026.** A revisão acima (31 → 32 specs, a
> `site-publico/008` e a reabertura da `site-publico/002`) é trabalho do dono,
> e estava na árvore sem commit quando a auditoria E2E começou. Ela foi
> commitada por engano junto com `f9e2c7f`, que é um commit sobre a auditoria —
> a mensagem daquele commit não fala dela, e não dá para separar sem reescrever
> histórico já publicado. Fica registrado aqui: o conteúdo é dele, a mistura
> foi minha.
