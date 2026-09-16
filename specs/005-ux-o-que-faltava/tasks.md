# Tasks: O que eu tinha deixado de fora

**Input**: [spec.md](./spec.md)

---

## Fase A — O convidado é chamado pelo nome

- [x] **T001** `lib/site/saudacao.ts` **(novo)**: `saudacaoDeConvidados` (até três nomes) e
  `pluralDoConvite` (você/vocês pelo número de lugares). — `[FR-001][FR-002]`
- [x] **T002** `lib/site/saudacao.test.ts` **(novo)**: nove casos, incluindo o corte em
  quatro nomes e o singular de um lugar. — `[FR-001][FR-002]`
- [x] **T003** `lib/repositories/groups.ts`: a consulta do RSVP passa a devolver os nomes
  dos convidados — segunda ida ao banco, não `join`. — `[FR-001]`
- [x] **T004** `components/site/ConfirmacaoDePresenca.tsx` e as duas telas públicas usam a
  saudação. O rótulo continua fora. — `[FR-001][FR-002][FR-003]`

## Fase B — Toda ação diz que aconteceu

- [x] **T005** `components/ui/prensa/AvisoPorHash.tsx` **(novo)**: lê o fragmento, escreve
  o recado e limpa o endereço. Sem estado, sem `searchParams`. — `[FR-004][FR-005]`
- [x] **T006** `signoutAction` → `/#saiu`; `cancelOrderAction` → `/conta/pedidos#cancelado`.
  — `[FR-004]`
- [x] **T007** A vitrine e a lista de pedidos mostram o recado. — `[FR-004]`

## Fase C — O WhatsApp

- [x] **T008** `lib/telefone.ts` + teste: máscara que acompanha quem digita. — `[FR-006]`
- [x] **T009** `app/conta/criar/page.tsx`: o campo formata no `onInput`. — `[FR-006]`

## Fase D — A pendência que não existia

- [x] **T010** Medir, no site no ar, a paleta dos dois sites publicados. Resultado:
  `ink:#3d4a36`, `accent:#b8985f` nos dois — **corretos**. Os sites afetados pelo
  preenchimento trocado eram só os de teste. Registrado na auditoria e no relatório.

## Fase E — Portões

- [x] **T011** `npm run lint` limpo
- [x] **T012** `npx tsc --noEmit` limpo
- [x] **T013** `npm run build` passando
- [x] **T014** `npm run test` verde
- [ ] **T015** **Verificação no navegador (E2E)** no site no ar: saudação pelos nomes no
  RSVP e no convite pessoal; "Pedido cancelado." e "Vocês saíram da conta."; máscara do
  WhatsApp. — `[SC-001][SC-002]`
- [x] **T016** Atualizar auditoria e relatório: UX-020 sai de "adiado" para resolvido, e a
  lista de "o que não foi feito" encolhe. — `[constitution · princípio II]`

## Estado final — 12/09/2026

Portões: lint limpo, `tsc --noEmit` limpo, `next build` passando, `npm run test` com
**833 testes em 74 arquivos, todos verdes**.

## Fase F — Achado do reteste de 14/09/2026

- [x] **T017** `lib/site/saudacao.ts`: `perguntaDosLugares(lugares)` — singular sem
  "dos 1 lugar"; teste em `saudacao.test.ts`. — `[UX-022]`
- [x] **T018** `components/site/ConfirmacaoDePresenca.tsx` usa a função. — `[UX-022]`
- [x] **T019** Portões + verificação no site no ar: grupo de 1 lugar mostra "Quantas
  pessoas vão?"; grupo de 2 continua "Quantos dos 2 lugares vão?". — `[UX-022]`

## Fase G — Achado do 2º reteste de 14/09/2026

- [x] **T020** `preload: false` nas 49 fontes de `lib/templates/*/fonts.ts`. — `[UX-023]`
- [x] **T021** `preload: false` nas 34 prévias de `components/account/wizard/fontPreview.ts`. — `[UX-023]`
- [x] **T022** Portões + comparar `next-font-manifest.json` antes/depois por rota. — `[UX-023]`
  Lint, `tsc` e `next build` limpos. Arquivos pré-carregados: `/rsvp` 17→6, `/conta` 17→6,
  `/s/[slug]` 44→6, `/preview` 44→6, `/conta/pedido/novo` 45→6, visual e convites 44→6.
  Sobram só Italiana, Petit Formal Script (raiz) e as três da plataforma (~103 KB).
- [x] **T023** Verificação no site no ar: arquivos de fonte baixados no RSVP, no painel e
  no site do casal; os seis moldes e o casamento real continuam com as fontes certas. — `[UX-023]`

## Fase H — Teste exploratório em produção de 15/09/2026

- [x] **T024** `ConfirmacaoDePresenca.tsx`: sucesso volta a aparecer depois de editar a
  resposta (estado reaberto em vez de booleano). — `[UX-024]`
- [x] **T025** `lib/site/saudacao.ts`: `tituloDoConvite` com maiúscula sem nomes; teste. — `[UX-025]`
- [x] **T026** `lib/telefone.ts`: `whatsappValido`; `signupAction` recusa número
  incompleto; `pattern` do campo escapado para a flag `v`; testes. — `[UX-026]`
- [x] **T027** `Campo.tsx`: `role="alert"` na mensagem de erro. — `[UX-027]`
- [x] **T028** Portões: lint, tsc e build limpos; 844 testes em 74 arquivos verdes, com a suíte rodando sozinha. — `[UX-024..027]`
- [x] **T029** Verificação no site no ar: editar resposta confirma; família sem nomes lê
  "Vocês vêm?"; cadastro recusa "(81) 9"; casamento real intacto. — `[UX-024..027]`
- [x] **T030** Contraste dos itens ausentes nos pacotes: `--c-ink-2` cheio na home e em
  `/pacotes` (2,66:1 e 3,21:1 → 6,43:1). — `[UX-028]`
- [x] **T031** AGENTS.md: `CRON_SECRET` vazio vira pendência conhecida, e a linha do
  webhook passa a dizer que ele está configurado. — `[UX-028]`
- [x] **T032** Verificação no site no ar do contraste e do erro anunciado: home e `/pacotes`
  em 6,43:1, Lighthouse da home 90 → 94, erro do login com `role="alert"`. — `[UX-027][UX-028]`
- [x] **T033** `CascaDoPainel.tsx`: recorte sai da casca e vai para a faixa de abas, para
  o painel do sino abrir inteiro. — `[UX-029]`
- [x] **T034** Migração aditiva 0026: `groups.removed_at`, com rollback escrito e ensaio
  aprovado (nenhuma contagem alterada); schema `test` sincronizado. — `[UX-030]`
- [x] **T035** Repositório: `removerFamiliaDaLista`, `atualizarFamilia`, lista esconde
  removidas, view do RSVP informa a saída, busca por nome ignora removidas. — `[UX-030]`
- [x] **T036** Ações: `editarFamiliaAction` (com guarda de pacote) e `apagarFamiliaAction`
  passa a remover sem apagar; `updateTag` do grupo nas duas. — `[UX-030]`
- [x] **T037** Tela: botões Editar/Remover na tabela e nos cartões; aviso de lugares abaixo
  do confirmado; tela do convidado avisa em vez de 404; action recusa POST direto. — `[UX-030]`
- [x] **T038** `AvisoPorHash.tsx`: o recado some em sete segundos. — `[UX-031]`
- [ ] **T039** Portões e verificação no site no ar das três correções. — `[UX-029..031]`
- [x] **T040** Pagamento: campo de WhatsApp no formulário (preenchido pela conta), validação
  na ação antes do gateway, telefone só com dígitos no cliente da API, e o motivo real da
  falha no log. Mensagens de erro sem "fale no WhatsApp". — `[UX-032]`
- [x] **T041** Testes da ação de pagamento: recusa sem telefone e com número incompleto,
  cria com o número escrito, recusa CPF inválido, e a mensagem de falha não manda para o
  WhatsApp. — `[UX-032]`
- [x] **T042** Vitrine: tela de comparação removida, rodapé limpo, volta da prévia para
  `/#estilos`, testes da galeria reescritos com o que continua existindo. — `[UX-033]`
- [ ] **T043** Portões e verificação no site no ar de tudo desta rodada. — `[UX-029..033]`
- [x] **T044** `linkDoBotaoDoConvite`: o destino `rsvp` do convite leva a `/meu-convite`;
  testes do convite atualizados. — `[UX-034]`
- [x] **T045** `SitePhoto`: véu, zoom de 5% e selo "Ampliar" no hover. — `[UX-035]`
- [x] **T046** `AcoesDaFamilia`: salvar fecha o formulário e confirma na linha. — `[UX-036]`
- [x] **T047** Recado para os noivos: migração 0027 (`guestbook_messages.privado`), o
  destino decidido pelo `tier` no servidor, rota `/s/<slug>/recado` com as guardas de
  `/s/<slug>`, botão principal nos seis moldes, passo do presente só no Para Sempre,
  aba Recados liberada no Site do Casamento sem botão de esconder, e testes dos dois
  destinos. — `[UX-037]`
- [x] **T050** "Não recebi meu link" sai por completo das seis seções de confirmação e
  da tela do recado. A rota `/s/<slug>/meu-convite` continua — é para onde o botão
  "Confirmar presença" do convite do casal leva. — `[UX-037]`
- [x] **T048** Questionário: etapas 7, 8 e 9 viram `visual`; rota `/previa-do-estilo`
  com o `SiteRenderer` de verdade e o conteúdo do casal; `TemaAoVivo` troca cor e fonte
  por `postMessage` sem recarregar; lista de fontes filtrada pelo molde
  (`lib/fonts/porMolde.ts` + teste contra o registry); testes da etapa nova. — `[UX-038]`
- [x] **T049** Vitrine: linha "Recado para os noivos" na chave `rsvp`, rótulo como
  `key` do React, e teste da escada dos pacotes atualizado. — `[UX-039]`
- [x] **T051** Botão do topo vira "Recado para os noivos" e sai da página; área de
  Convites desligada por interruptor, com `/c/<slug>` intacto e as seis portas fechadas;
  bloco de WhatsApp fora da aba Visual. — `[UX-040]`
