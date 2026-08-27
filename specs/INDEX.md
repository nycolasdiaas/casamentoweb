# Roteiro de implementação — Enlace × protótipo

**30 specs, em 4 áreas.** O levantamento que as gerou está em
`levantamento.md`. Cada spec tem escopo fechado, requisitos numerados e
critérios de aceite — quem implementar não deve precisar decidir nada.

**Ordem geral:** `design-system` primeiro, sempre. As outras três áreas
consomem tokens, classes de movimento e a casca de e-mail que só existem
depois dela.

---

## Como ler o status

**As 30 specs estão fechadas.** Nenhuma segue "Pronta": ou o código saiu, ou a
decisão de não fazer está escrita, ou falta uma linha do dono — e nesse caso ela
está nomeada.

| Status | Quantas | O que significa |
|---|---|---|
| **Implementada** | 24 | O código saiu, os critérios foram conferidos um a um, e o "como foi conferido" está no fim da spec |
| **Resolvida** | 1 | `painel-casal/002` não pedia código: ela pedia uma decisão de modelo, e ela foi tomada |
| **Rejeitada** / **Adiada** | 4 | A resposta certa era "não construa isto". O motivo e **o que a reabre** estão escritos na spec |
| **Bloqueada** | 1 | Só a `painel-casal/010`. O agendador dela reabre a §14 do SDD, e a própria spec exige que isso seja feito pelo dono |

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
isto" está terminada quando isso está escrito. As quatro têm o que as reabre
anotado — cinco desenhos de molde (`site-publico/002`), um provedor de e-mail e
uma decisão de LGPD (`site-publico/006`), o resumo semanal sair
(`painel-casal/009`), e a primeira contratação (`painel-admin/004`).

¹² A `010` é **a única que não fechou**, e a razão está escrita nela: o
agendador que ela precisa contraria a decisão 4 da §14 do SDD, e a própria spec
exige que ela seja *"reaberta explicitamente pelo dono em vez de contornada"*.
Implementar seria contornar. Ela espera uma linha sua.

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
| 12 | [`site-publico/002-largura-do-site`](site-publico/002-largura-do-site/spec.md) — F1 em 1440 | **Rejeitada ¹¹** | `site-publico/001` | **Medida em 25/08.** Nada quebra a 1440, mas trocar o número não entrega o desenho: o eixo real é cartão-com-letterbox × largura cheia. Decisão do dono |
| 13 | [`site-publico/006-emails-para-o-convidado`](site-publico/006-emails-para-o-convidado/spec.md) — modelos 05 e 06 | **Rejeitada ¹¹** | `design-system/007` | O produto não guarda e-mail de convidado, e coletá-lo é decisão do dono |
| 14 | [`site-publico/007-h5-pix-nao-confirmado`](site-publico/007-h5-pix-nao-confirmado/spec.md) — H5 | **Implementada ⁹** | — | Registro. O Pix vai direto para o casal; a Enlace não observa a falha |

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
| 20 | [`painel-casal/006-autosave-do-editor`](painel-casal/006-autosave-do-editor/spec.md) — debounce de 800ms + rascunho local | **Implementada** | `002`, `design-system/004` | Hoje fechar a aba perde o trabalho |
| 21 | [`painel-casal/007-painel-de-modelos`](painel-casal/007-painel-de-modelos/spec.md) — a quinta ferramenta | **Implementada ⁷** | `002` | Decisão: "trocar de modelo" re-tematiza ou refaz? |
| 22 | [`painel-casal/008-e10-publicar`](painel-casal/008-e10-publicar/spec.md) — E10 sem o checkout | **Implementada ⁵** | `design-system/004`, `005` | O checkout embutido foi cancelado pelo dono; o resto é implementável |
| 23 | [`painel-casal/011-emails-do-casal`](painel-casal/011-emails-do-casal/spec.md) — recibo e "seu site está no ar" | **Implementada** | `design-system/006`, `007` | Hoje o casal paga, o site publica, e ninguém avisa |
| 24 | [`painel-casal/012-tela-de-geracao`](painel-casal/012-tela-de-geracao/spec.md) — transição #8 | **Implementada ⁶** | `design-system/006` | O piso de 2,5s do handoff é espera inventada (regras §2.2) |
| 25 | [`painel-casal/009-preferencias-de-aviso`](painel-casal/009-preferencias-de-aviso/spec.md) — J2 | **Adiada ¹¹** | `011` | Sem e-mail sendo enviado, a tabela não liga nada |
| 26 | [`painel-casal/010-resumo-semanal`](painel-casal/010-resumo-semanal/spec.md) — J3 | **Bloqueada ¹²** | `007`, `011` | Falta agendador; e a §14 decisão 4 do SDD precisa ser reaberta |

⁴ A `002` fechou na **Opção A** em 27/08/2026, por decisão de Nycolas: o
modelo implementado vence e o handoff §2 vira divergência assumida, escrita no
topo de `lib/site/inviteDoc.ts`. Com isso as quatro retidas voltaram a
`Pronta`.

---

### Onda 4 · O admin

| # | Spec | Status | Depende de | Nota |
|---|---|---|---|---|
| 27 | [`painel-admin/001-pedidos-como-tabela`](painel-admin/001-pedidos-como-tabela/spec.md) — G4 com filtros e busca | **Implementada** | `design-system/001` | Tira da tela o prompt de LLM do fluxo antigo |
| 28 | [`painel-admin/003-presentes-entre-casais`](painel-admin/003-presentes-entre-casais/spec.md) — G5 | **Implementada ⁵** | `design-system/001` | O cartão "A repassar" contradiz regras §2.4 e fica fora |
| 29 | [`painel-admin/002-dashboard-da-operacao`](painel-admin/002-dashboard-da-operacao/spec.md) — G3, e o destino do casamento legado | **Implementada ¹⁰** | `design-system/001` | Mexer no endereço da tela que o dono usa exige janela segura (§13.1) |
| 30 | [`painel-admin/004-grupos-e-permissoes`](painel-admin/004-grupos-e-permissoes/spec.md) — G2 | **Adiada ¹¹** | `002` | A pergunta é anterior ao código: existe mais de um operador? |

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
| 27/08/2026 | **`painel-casal/013` escrita** — a spec que a decisão 11 pedia e que ninguém tinha escrito: cancelar pedido vira **estado**, não `DELETE`. Corrige de passagem o site órfão que o `AGENTS.md` registra, e devolve a pílula `Cancelados` que `painel-admin/001` teve de excluir por falta do estado. É a **única migração** de todo este trabalho — aditiva, e com a janela antes de outubro. **Não implementada:** migração em banco com casamento no ar exige `backup:full` e rollback escrito, e isso é decisão de quando, não de código |

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
| 11 | Cancelar pedido vira estado em vez de `DELETE`? | **`painel-casal/013`, escrita em 27/08** | A spec própria que a recomendação pedia. Fechada e pronta; é a **única migração** de todo o trabalho, e a janela é antes de outubro |

---

## Impacto em dados — o mapa completo

**Nenhuma migração foi executada.** Das quatro specs que exigiam mudança de
schema, três foram rejeitadas ou adiadas e uma (`painel-casal/003`) resolveu-se
dentro do `jsonb`, sem tocar em coluna.

O que ficou como **pendência aditiva**, com o motivo, está na seção
"Pendências de dados abertas na execução" mais acima. Todas são
`add column` nullable — nenhuma apaga, reescreve ou torna obrigatório.

| Spec | Migração | Natureza |
|---|---|---|
| `painel-casal/003` | nenhuma — **feita** | Tipo novo de bloco dentro do `jsonb` de `site_invites.doc` |
| `site-publico/006` | ~~`guests.email`~~ — **rejeitada** | O produto não passa a coletar e-mail de convidado |
| `painel-casal/009` | ~~`users.aviso_prefs`~~ — **adiada** | Sem aviso recorrente, não há o que configurar |
| `painel-casal/010` | `cron.schedule` **ou** rota protegida | **Aberta.** Depende do agendador que o dono escolher |
| `painel-casal/013` | `ALTER TYPE order_status ADD VALUE 'cancelled'` | **Aditiva pura**, e a única migração escrita. `ADD VALUE` de enum não é reversível: o rollback é não usar o valor |
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
