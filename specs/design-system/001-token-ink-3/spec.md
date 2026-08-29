# Spec 001 — O oitavo neutro da Fundação (`--c-ink-3`) (área: design-system)

**Status:** Implementada (26/08/2026)

## Contexto

A prancha A1 de `Enlace - Fundacao.dc.html` fixa **oito** neutros como "a
espinha do produto", cada um com nome de token. Sete deles existem em
`app/globals.css` sob `.ui-prensa`; o oitavo — `--ink-3`, `#8b9099`,
descrito como "terciário / placeholder" — nunca virou token. O valor circula
como hex literal.

A regra que a prancha A1 escreve ao lado da paleta é literal: *"use só os
tokens. nenhuma cor solta."* Um valor de sistema repetido à mão é o mesmo
defeito que a `.trilho` corrigiu para a largura — a mesma decisão tomada
várias vezes sem olhar.

Toca o SDD §4.2 apenas por vizinhança: `--c-*` são tokens da **plataforma**,
não do `ThemeSpec` do casal, e nada aqui pode alcançar `lib/templates/*`.

## Escopo

- Declarar `--c-ink-3` no bloco `.ui-prensa` de `app/globals.css`.
- Declarar o valor correspondente no bloco do tema escuro
  (`.ui-prensa.admin`, `.ui-prensa .admin`, `.ui-prensa.tema-escuro`,
  `.ui-prensa .tema-escuro`).
- Substituir as ocorrências do hex literal `#8b9099` dentro de
  `app/globals.css` pelo token.

## Fora de escopo

- Substituir `#8b9099` em arquivos `.tsx`. Cada ocorrência precisa ser lida no
  contexto para saber se é terciário ou outra coisa; entra numa passada
  própria depois que o token existir.
- Qualquer alteração em `lib/theme/spec.ts` ou em `lib/templates/*` — a paleta
  do casal é outro contrato.
- Criar tokens que a Fundação não lista (`--ink-4`, `--rule-2` etc.).

## Requisitos funcionais

- **FR-001:** `app/globals.css` DEVE declarar `--c-ink-3: #8b9099;` dentro da
  primeira regra `.ui-prensa` (a que já declara `--c-base` … `--c-mark`).
- **FR-002:** O bloco de tokens do tema escuro DEVE declarar
  `--c-ink-3: #6b7178;` — o valor que o próprio protótipo usa como terciário
  sobre `#16181b` (`Enlace - G Admin.dc.html`, `<span class="aMeta"
  style="color:#6b7178;">admin</span>` na barra de G2/G3/G4/G5, e
  `"SESSÃO PROTEGIDA"` em G1).
- **FR-003:** As três ocorrências do literal `#8b9099` em `app/globals.css`
  — linha 1031 (`.ui-prensa .btn-ink:disabled, .ui-prensa
  .btn-ink[aria-disabled="true"]`), linha 1093 (`.ui-prensa
  .campo::placeholder`) e linha 1114 (`.ui-prensa .campo:disabled`) — DEVEM
  passar a usar `var(--c-ink-3)`.
- **FR-004:** Nenhum valor calculado pode mudar no tema claro: o resultado
  computado de `color` nas três regras de FR-003 DEVE continuar sendo
  `rgb(139, 144, 153)`.
- **FR-005:** O token NÃO pode ser declarado em `:root` nem fora de
  `.ui-prensa`. Fora do escopo ele alcançaria `/rsvp/<slug>`, `/s/<slug>` e o
  site legado, que seguem na paleta antiga (`--color-paper`/`--color-olive`),
  e alcançaria `lib/templates/*`, onde `npm run verify:template` reprova cor
  que não venha do `ThemeSpec` do casal.

## Critérios de aceite

- **SC-001:** `grep -c "8b9099" app/globals.css` devolve `1` (só a declaração
  do token). Atende FR-001 e FR-003.
- **SC-002:** `grep -c "\-\-c-ink-3" app/globals.css` devolve no mínimo `5`
  (duas declarações + três usos). Atende FR-001, FR-002 e FR-003.
- **SC-003:** Num navegador em `/conta`, `getComputedStyle` de um
  `input.campo` vazio devolve `color: rgb(139, 144, 153)` para o
  `::placeholder`. Atende FR-004.
- **SC-004:** Num navegador em `/admin/pedidos`, `getComputedStyle` do
  elemento com classe `ui-prensa admin` devolve
  `--c-ink-3` = `#6b7178`. Atende FR-002.
- **SC-005:** `grep -n "\-\-c-ink-3" app/globals.css` não devolve nenhuma
  linha dentro do bloco `:root` (linhas 3–43). Atende FR-005.
- **SC-006:** `npm run build`, `npm run lint` e `npm run verify:template`
  passam.

## Impacto em dados

Nenhum.

## Referências

- Protótipo: `Enlace - Fundacao.dc.html`, prancha **A1**, bloco "Neutros — a
  espinha do produto", oitavo cartão (`#8b9099` · `--ink-3` · "terciário /
  placeholder").
- Versão atual: `app/globals.css:565-572` (bloco `.ui-prensa`),
  `app/globals.css:1310-1325` (bloco do tema escuro).
- SDD do Enlace: §4.2 (o `ThemeSpec` é outro contrato — este token é da
  plataforma e não pode alcançar `lib/templates/*`).

## Dependências

Nenhuma. É a spec de menor risco da área e **deve ser a primeira**: as demais
specs de design-system e as de painel podem referenciar `var(--c-ink-3)`
depois que ela existir.

## Perguntas em aberto

Nenhuma.
