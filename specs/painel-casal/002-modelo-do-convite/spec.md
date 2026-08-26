# Spec 002 — E9: o modelo de dados do convite × `HANDOFF-editor-convite.md` §2 (área: painel-casal)

**Status:** Bloqueada — **[CONFLITO COM DECISÃO EXISTENTE — REQUER APROVAÇÃO]**

## Contexto

`HANDOFF-editor-convite.md` §2 prescreve um modelo de dados completo para o
convite:

```ts
type InviteDoc = {
  id, slug, template: 'editorial'|'classico'|…,
  canvas: { w, h, bg: BgFill },   // mm→px @96dpi; padrão 105×148mm
  elements: Element[],            // ordem = z-index
  updatedAt,
};
type Base = { id, x, y, w, h, rot, opacity, locked?, hidden? };  // px
type Element = TextEl | ImageEl | ShapeEl | ButtonEl;
```

O que existe em `lib/site/inviteDoc.ts` é outro modelo, e ele está gravado em
`site_invites.doc` (jsonb) de convites que o casal já desenhou:

```ts
type InviteDoc = { versao: 1; fundo: string; largura: number; altura: number;
                   blocos: Bloco[] };
type BlocoBase = { id, x, y, w, rotacao };   // x/y/w em FRAÇÃO (0–1)
type Bloco = BlocoTexto | BlocoFoto | BlocoLinha | BlocoForma;
```

As diferenças que importam, e por que cada uma foi decidida como foi:

| Handoff §2 | Implementado | O motivo escrito no código |
|---|---|---|
| `x/y/w/h` em px | `x/y/w` em **fração** (0–1) | *"O editor roda numa área que muda de tamanho… Com pixels, o convite ficaria certo na tela em que foi feito e torto em todas as outras."* |
| `canvas` em mm @96dpi | `largura`/`altura` em px, padrão 1080×1350 | O convite viaja por WhatsApp e Instagram, não pela gráfica. 4:5 é o retrato que os dois não cortam. |
| `h` explícito em todo elemento | `proporcao` nas formas e fotos; texto reflui | Altura fixa em texto quebra ao trocar de fonte ou de formato. |
| `ButtonEl` como tipo | não existe | ver `specs/painel-casal/003` |
| `locked` / `hidden` | não existem | — |
| `opacity` em `Base` | só em `BlocoForma` | — |
| `template` no documento | não existe | O convite nasce do tema do site (`inviteSeed.ts` recebe `ThemeCoresLocal`) e depois é peça avulsa. |

O SDD §15.1 registra a natureza da exceção: *"O `doc` em `jsonb` é a única
estrutura do projeto que guarda **desenho** em vez de conteúdo. É uma exceção
consciente ao modelo de tokens da §4."*

**O conflito:** adotar o modelo do handoff exigiria reescrever `doc` de todos
os convites existentes — um `UPDATE` em coluna preexistente, que o SDD §13.1
proíbe nominalmente. E o modelo implementado não é pior: ele resolve um
problema (o editor de tamanho variável) que o do handoff não resolve.

## Escopo

Nenhum código. Esta spec registra o conflito e decide **qual modelo vale**
antes de qualquer uma das specs 003–007 tocar no editor.

## Fora de escopo

- O `ButtonEl`, que é um acréscimo **aditivo** e cabe no modelo atual sem
  reescrever nada — é `specs/painel-casal/003`.
- Snap, atalhos, autosave e painel de modelos — 004 a 007.

## Requisitos funcionais

- **FR-001:** Nenhuma migração pode reescrever `site_invites.doc` de convite
  existente. `UPDATE` em coluna preexistente é proibido (SDD §13.1) e o `doc`
  é o trabalho de desenho do casal, que ninguém reconstrói.
- **FR-002:** Qualquer campo novo no `InviteDoc` DEVE ser **opcional na
  leitura**, com `parseInviteDoc` devolvendo o padrão quando ele faltar —
  é o comportamento que o módulo já tem e documenta (*"descarta o bloco
  inválido em vez de recusar o convite inteiro"*).
- **FR-003:** O sistema de coordenadas DEVE continuar em **fração**. Trocar
  para px quebraria todo convite já desenhado e reintroduziria o defeito que a
  fração resolve.
- **FR-004:** `versao: 1` DEVE virar `versao: 1 | 2` se e quando um campo novo
  mudar a interpretação de campo existente. Acrescentar campo que só soma
  (como `ButtonEl`) **não** muda a versão.
- **FR-005:** `lib/site/inviteDoc.test.ts` DEVE ganhar um caso que carregue um
  `doc` no formato de hoje e prove que ele continua renderizando idêntico
  depois de qualquer mudança das specs 003–007.

## Critérios de aceite

- **SC-001:** `grep -rn "UPDATE.*site_invites.*doc\|update(siteInvites)"
  lib/db/migrations/` devolve `0`. Atende FR-001.
- **SC-002:** `parseInviteDoc` aplicado a um `doc` gravado antes das specs
  003–007 devolve um documento com os mesmos blocos, nas mesmas posições.
  Atende FR-002 e FR-005.
- **SC-003:** `grep -c "fração\|fracao" lib/site/inviteDoc.ts` continua > 0 e
  `BlocoBase` continua sem `h`. Atende FR-003.
- **SC-004:** `npx vitest run lib/site/inviteDoc.test.ts` passa.
- **SC-005:** Um `doc` que ganhe apenas campo novo (como o `BlocoBotao` de `specs/painel-casal/003`) continua com `versao: 1`; nenhum campo existente muda de significado. Atende FR-004.

## Impacto em dados

**Nenhum, e é esse o requisito.** `site_invites.doc` não é migrado, não é
reescrito, não é convertido.

## Referências

- Protótipo: `HANDOFF-editor-convite.md` §2 (o modelo `InviteDoc` completo),
  §1 (*"o artboard é DOM absoluto"* — cumprido), §9 item 3 (*"o convite
  renderizado em `/c/:slug` é pixel-idêntico ao artboard (mesmo componente
  `InviteCanvas`)"* — cumprido por `BlocoVisual`, com outro nome).
- Versão atual: `lib/site/inviteDoc.ts` (316 linhas, com o porquê de cada
  decisão nos comentários), `lib/site/inviteDoc.test.ts`,
  `lib/repositories/siteInvites.ts`, `lib/db/schema.ts` (`site_invites`),
  migrações 0013 e 0014.
- SDD do Enlace: §15.1 (o editor de convites e a exceção consciente do
  `doc` em jsonb), §13.1 (proibido `UPDATE` em coluna preexistente),
  §5.1 (o que foi construído divergiu do esboço, e por quê).

## Dependências

Nenhuma. **Precede** `specs/painel-casal/003` a `007` — nenhuma delas pode
começar antes desta decisão.

## Perguntas em aberto

1. **Qual modelo vale daqui para frente?** Três saídas, e a escolha é do dono
   porque decide se o trabalho de desenho já feito sobrevive:

   - **Opção A — o modelo implementado vence, e o handoff §2 vira divergência
     assumida.** O `HANDOFF-editor-convite.md` ganha uma nota dizendo que §2
     descreve um modelo que não foi adotado, e o porquê. As specs 003–007
     constroem sobre o que existe. **Custo: zero. É a recomendação.**
   - **Opção B — migrar para o modelo do handoff.** Exigiria conversão de
     fração para px, de `blocos` para `elements`, e um `UPDATE` em `doc`. Cai
     direto na proibição de §13.1. Só faria sentido se o modelo do handoff
     desbloqueasse algo — e, lendo os dois, ele não desbloqueia: tudo que
     §5, §6 e §7 do handoff pedem (snap, inspetor, undo, autosave) funciona
     igual em fração.
   - **Opção C — modelo novo só para convites novos, `versao: 2`.** Dois
     formatos convivendo no mesmo jsonb, com `parseInviteDoc` decidindo por
     `versao`. Não viola §13.1, mas dobra a superfície do editor para sempre.

2. **`locked` e `hidden` (handoff §2 e §5) entram?** São os únicos dois campos
   do modelo do handoff que o editor de hoje não tem equivalente nenhum e que
   o casal pediria — travar o fundo para não arrastá-lo sem querer é o caso
   clássico. Os dois são **aditivos** e cabem na Opção A sem tocar em nada.
   **Vale a pena agora?** — decisão do dono, e não bloqueia esta spec.
