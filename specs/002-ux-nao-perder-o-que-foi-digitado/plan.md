# Implementation Plan: Nada do que o casal digitou se perde

**Branch**: `002-ux-nao-perder-o-que-foi-digitado` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)

## Summary

O React 19 **reinicia um formulário não-controlado depois que a action termina**
— inclusive quando ela termina em erro. Como `ContentEditor` usa `defaultValue`
para os onze campos, a recusa da chave Pix devolve a tela ao último estado
salvo, e some com tudo que o casal tinha escrito.

A correção é pequena e não transforma a tela num formulário controlado: a action
passa a devolver, junto do erro, **o que foi enviado**, e o formulário é
remontado com esses valores. Uma `key` que muda a cada recusa é o que faz os
`defaultValue` novos valerem.

O mural é o mesmo problema em escala menor, mais um texto que mente.

## Technical Context

**Stack**: igual à feature 001 — Next 16, React 19.2, Drizzle/Postgres, Tailwind 4
**Storage**: nenhuma mudança de schema
**Testing**: Vitest + verificação no navegador em desktop e celular

## Constitution Check

| Princípio | Como esta feature o respeita |
|---|---|
| I. Usuário primeiro | UX-004 e UX-012, ambos observados na interface |
| II. Rastreabilidade | cada tarefa cita UX-ID e FR; verificação E2E por história |
| III. Não quebrar o que funciona | o formulário continua não-controlado; nenhuma tela reescrita, nenhuma biblioteca nova |
| IV. Feedback explícito | FR-003: o erro aparece onde o dedo está |
| V. Sem perda de dados | é a feature inteira |
| VI. Mobile | aceite conferido em 390×844 |
| VII. Português claro | FR-004 troca uma mensagem falsa por uma verdadeira; texto pela Skill `texto-do-casal` |

**Violações a justificar**: nenhuma.

## Decisões técnicas

### D1 — Devolver o enviado, remontar o formulário

`saveSiteContentAction` ganha, no ramo de erro, `valores` (o que veio no
`FormData`) e `marca` (um carimbo que muda a cada recusa). `ContentEditor` usa
`state.valores` como `defaultValue` e põe `key={marca}` no formulário.

**Por que `key` e não só `defaultValue`**: `defaultValue` só é aplicado quando o
campo **monta**. Sem remontar, o React reinicia os campos com o valor anterior e
ignora o novo `defaultValue`. A `key` força a remontagem — é o mecanismo que o
próprio React oferece para "este formulário agora é outro".

**Por que não controlar os campos**: onze `useState` e onze `onChange` para
resolver um caso de erro seria reescrever a tela — princípio III. E formulário
controlado tem custo próprio (cada tecla re-renderiza a prévia ao lado).

### D2 — A recusa do Pix continua inteira

Nada muda em `parseContentForm`: chave inválida continua barrando o salvamento
completo, como o comentário dela documenta ("recusar é melhor que aceitar
errado"). O que muda é só o que a tela mostra depois.

### D3 — Mural: duas recusas, duas mensagens

`enviarRecadoAction` hoje usa a mesma frase para "site não existe" e "site não
publicado". Passa a distinguir, e o componente do mural preserva o que foi
digitado pelo mesmo mecanismo da D1.

### D4 — O erro sobe para junto do botão

A mensagem já existe abaixo dos botões. Passa a ficar **acima** deles, que é
onde o olho está depois de clicar em salvar.

## Arquivos que serão alterados

| Arquivo | O quê | FR |
|---|---|---|
| `app/actions/content-actions.ts` | devolver `valores` + `marca` no erro | FR-001 |
| `components/account/ContentEditor.tsx` | `key` + `defaultValue` do estado; erro acima dos botões | FR-001, FR-003 |
| `app/actions/guestbook-actions.ts` | separar "não existe" de "ainda não está no ar" | FR-004 |
| componente do mural | preservar nome e recado na recusa | FR-005 |
| testes | cobrir a devolução dos valores e as duas mensagens | FR-001, FR-002, FR-004 |

## Riscos

| Risco | Mitigação |
|---|---|
| A `key` remontar o formulário e perder o foco do campo | O foco já se perde hoje (a tela inteira volta ao estado salvo); remontar só depois de uma recusa é aceitável e raro |
| Preservar valores "ressuscitar" um campo que o casal apagou de propósito | O que é devolvido é o `FormData` enviado — campo vazio volta vazio |
| Quebrar o salvamento feliz | Teste de unidade do caminho `{saved:true}` + verificação no navegador |

## Portões

lint · type-check · `npm run build` · `npm run test` · navegador em 1440×900 e 390×844.
