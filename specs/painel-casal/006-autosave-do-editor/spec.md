# Spec 006 — E9: autosave do editor de convite (área: painel-casal)

**Status:** Bloqueada — retida pela decisão pendente de `painel-casal/002` (ver "Retida na execução" no fim)

## Contexto

`HANDOFF-editor-convite.md` §7:

> **Autosave:** debounce 800ms após mudança → `salvarConviteAction(doc)`.
> Indicador na TopBar: "salvando…" → "salvo há X". Salvar manual
> (Ctrl/Cmd+S) força flush.

E o artboard **E9** desenha o indicador na barra do topo:
`rascunho · salvo há 2 min`, em mono de 10,5px.

§10 acrescenta duas regras que valem tanto quanto o debounce:

> **Contrato de save:** `salvarConviteAction` recebe o `InviteDoc` inteiro
> (JSON) e devolve `{ updatedAt }`. Idempotente; last-write-wins com o
> `updatedAt` como guarda de conflito (se o servidor tiver `updatedAt` mais
> novo, avisar e recarregar em vez de sobrescrever).
>
> **Autosave offline-safe:** manter o último `doc` em
> `localStorage['invite:'+conviteId]`; ao voltar a ligação, reconciliar.

`EditorDeConvite.tsx:548` tem só `salvar()`, disparado pelo botão `:769`.
Nenhum `setTimeout` de autosave. O casal desenha vinte minutos, fecha a aba, e
perde tudo. É a mesma classe de perda que o `useHistorico` protege dentro da
sessão e nada protege fora dela.

O trabalho fica menor porque duas peças já existem: `useHistorico` sabe quando
o documento mudou (é ele quem registra os gestos), e
`specs/design-system/004-brinde` entrega a confirmação efêmera.

## Escopo

- Autosave com debounce em `EditorDeConvite`.
- O indicador de estado na barra do topo.
- `Ctrl/Cmd + S` como flush.
- Rascunho local em `localStorage` e a reconciliação ao voltar.
- Guarda de conflito por `updatedAt`.

## Fora de escopo

- Edição simultânea por duas pessoas com resolução automática. O contrato do
  handoff é **last-write-wins com aviso**, não merge.
- Autosave nas outras telas do painel (`ContentEditor` já tem o seu).
- O que acontece com o convite **publicado** quando o casal edita — hoje
  salvar já republica, e isso não muda.

## Requisitos funcionais

- **FR-001:** Toda mudança no `doc` DEVE agendar um salvamento **800ms**
  depois. Uma mudança nova dentro da janela reinicia a contagem.
- **FR-002:** Um gesto de arrasto NÃO PODE agendar um salvamento por quadro. O
  agendamento acontece no fim do gesto — o mesmo momento em que o
  `useHistorico` registra a entrada.
- **FR-003:** A barra do topo DEVE mostrar três estados, no lugar onde hoje
  está `rascunho · salvo há 2 min`:
  `salvando…` durante a requisição; `salvo há {tempo}` depois;
  `não salvo` quando houver mudança pendente e nenhuma requisição em curso.
- **FR-004:** O tempo relativo DEVE usar as mesmas faixas que `Avisos.tsx` já
  usa (`agora`, `há N min`, `há N h`, `ontem`), lido no **gesto** e não no
  render — `Date.now()` durante o render é impuro e o lint reprova.
- **FR-005:** `Ctrl/Cmd + S` DEVE cancelar o debounce e salvar na hora, e DEVE
  chamar `preventDefault` (senão o navegador abre "salvar página").
- **FR-006:** O botão `Salvar` da barra continua existindo e faz o mesmo que
  FR-005. Autosave não remove o botão: ele é o que diz ao casal que o trabalho
  dele está guardado.
- **FR-007:** A cada mudança do `doc`, o editor DEVE gravar o documento em
  `localStorage` sob a chave `invite:<conviteId>`, junto com um carimbo
  (`{ doc, em: Date.now() }`). A gravação DEVE estar em `try/catch`: modo
  privado e cota cheia lançam, e um editor que quebra por causa do rascunho é
  pior que um editor sem rascunho.
- **FR-008:** Ao abrir o editor, se houver rascunho local **mais novo** que o
  `updatedAt` do servidor, o editor DEVE mostrar um `Aviso` de tom `warn`:
  `Vocês têm mudanças que não chegaram a ser salvas.` com dois botões —
  `Recuperar` (carrega o rascunho) e `Descartar` (apaga o rascunho e segue com
  o do servidor). NÃO PODE decidir sozinho.
- **FR-009:** Um salvamento bem-sucedido DEVE apagar o rascunho local.
- **FR-010:** `salvarConviteAction` DEVE devolver `{ updatedAt }` e recusar a
  escrita quando o `updatedAt` que o cliente mandou for **mais antigo** que o
  gravado, devolvendo `{ conflito: true, updatedAt }`.
- **FR-011:** Diante de `conflito: true`, o editor DEVE parar o autosave,
  mostrar `Aviso` de tom `warn` com o texto
  `Este convite foi alterado em outro lugar. Recarregue para não perder o que
  foi salvo lá.` e um botão `Recarregar`. NÃO PODE sobrescrever em silêncio.
- **FR-012:** Uma falha de rede NÃO PODE apagar o rascunho local nem mudar o
  indicador para `salvo`. O indicador vai para `não salvo` e o autosave tenta
  de novo na próxima mudança.
- **FR-013:** O autosave DEVE parar enquanto o casal estiver **editando texto
  inline** (`editandoTexto`), e disparar ao sair. Salvar no meio da digitação
  gravaria meia palavra e faria o indicador piscar a cada letra.
- **FR-014:** O brinde (`specs/design-system/004-brinde`) NÃO deve ser
  disparado pelo autosave. Um brinde a cada 800ms de trabalho é ruído; o
  indicador da barra é o canal certo. O brinde fica só no salvamento manual
  (FR-005 e FR-006), com o texto `Convite salvo.`

## Critérios de aceite

- **SC-001:** Mover um bloco e esperar dispara **uma** chamada a
  `salvarConviteAction`, entre 800 e 1000ms depois do `pointerup`. Atende
  FR-001 e FR-002.
- **SC-002:** Mover três blocos em sequência, com menos de 800ms entre eles,
  dispara **uma** chamada. Atende FR-001.
- **SC-003:** Durante a requisição, a barra mostra `salvando…`; 3 min depois,
  `salvo há 3 min`. Atende FR-003 e FR-004.
- **SC-004:** `Ctrl+S` com mudança pendente salva imediatamente e o navegador
  não abre a caixa de salvar página. Atende FR-005.
- **SC-005:** Depois de mover um bloco,
  `JSON.parse(localStorage.getItem('invite:<id>')).doc.blocos` reflete a
  posição nova. Atende FR-007.
- **SC-006:** Com `localStorage` desabilitado (modo privado simulado), o
  editor continua funcionando e salvando no servidor. Atende FR-007.
- **SC-007:** Gravar um rascunho local, recarregar a página antes do autosave
  disparar, e o aviso de FR-008 aparece com os dois botões. `Descartar` limpa
  o `localStorage` e carrega o do servidor. Atende FR-008.
- **SC-008:** Depois de um salvamento com sucesso,
  `localStorage.getItem('invite:<id>')` é `null`. Atende FR-009.
- **SC-009:** Abrir o mesmo convite em duas abas, salvar na primeira, mexer e
  esperar o autosave na segunda: a segunda recebe `conflito: true`, para o
  autosave e mostra o aviso. O `doc` da primeira **não** é sobrescrito.
  Atende FR-010 e FR-011.
- **SC-010:** Com a rede desligada, o autosave falha, o indicador vai para
  `não salvo` e o rascunho local continua lá. Atende FR-012.
- **SC-011:** Digitar dentro de um bloco de texto não dispara autosave; clicar
  fora dispara um. Atende FR-013.
- **SC-012:** O autosave não mostra brinde; `Ctrl+S` mostra `Convite salvo.`.
  Atende FR-014.
- **SC-013:** `npm run build`, `npm run lint` e `npm run test` passam.
- **SC-014:** O botão `Salvar` continua na barra do topo e faz o mesmo que `Ctrl+S`, inclusive o brinde. Atende FR-006.

## Impacto em dados

**Nenhuma coluna nova.** `site_invites` já tem `updated_at`
(`lib/db/schema.ts`, migração 0013), que é a guarda de conflito de FR-010.
`localStorage` é do navegador.

## Referências

- Protótipo: `HANDOFF-editor-convite.md` §7 (debounce de 800ms, indicador,
  Ctrl/Cmd+S), §10 ("Contrato de save": `{ updatedAt }`, idempotente,
  last-write-wins com aviso; "Autosave offline-safe": `localStorage` por
  `conviteId`), §9 critério 2. `Enlace - E Painel.dc.html` E9, barra do topo
  do artboard `EDITOR · DESKTOP · 1560` (`rascunho · salvo há 2 min`).
- Versão atual: `components/account/convite/EditorDeConvite.tsx:548`
  (`salvar()` manual) e `:769` (o botão),
  `app/actions/invite-actions.ts` (`salvarConviteAction`),
  `lib/repositories/siteInvites.ts`,
  `components/account/manage/useHistorico.ts`,
  `components/account/manage/Avisos.tsx` (as faixas de tempo relativo).
  O autosave: **não existe — NOVO**.
- SDD do Enlace: §15.1 (o editor de convites), §12 (invalidação de cache:
  `updateTag` nas ações do casal — read-your-own-writes).

## Dependências

- **Depende de** `specs/painel-casal/002-modelo-do-convite`.
- **Depende de** `specs/design-system/004-brinde` (FR-014 usa o brinde no
  salvamento manual).
- Não bloqueia nenhuma outra spec.

## Perguntas em aberto

Nenhuma.

## Retida na execução de 26/08/2026

**Não implementada, e a razão não é técnica.** Esta spec declara, no próprio
campo Dependências, que depende da **decisão** de
`specs/painel-casal/002-modelo-do-convite` — que segue
`[CONFLITO COM DECISÃO EXISTENTE — REQUER APROVAÇÃO]`, sem decisão registrada.
O INDEX diz o mesmo com todas as letras: *"002 destrava 003 a 007"*.

Implementar agora seria escolher a **Opção A** da 002 (o modelo implementado
vence) em nome do dono. A Opção A é a recomendação escrita e custa zero — mas
recomendar não é decidir, e a regra de execução é explícita: nenhuma spec com
conflito aberto entra antes de a decisão estar registrada.

**O que destrava:** uma linha do dono escolhendo A, B ou C na spec 002. Com A
ou C, esta spec entra como está. Só a Opção B a invalidaria — e a própria 002
mostra que B cai na proibição de §13.1 (exigiria `UPDATE` em `doc` de convites
que o casal já desenhou).
