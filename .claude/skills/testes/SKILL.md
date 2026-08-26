---
name: testes
description: Rodar e escrever testes (vitest). Use antes de `npm run test`, ao ver falha estranha ou intermitente, timeout, ou `column "x" does not exist`. Cobre o schema `test` compartilhado, por que não se roda duas suítes ao mesmo tempo, e o limite de tempo de 20s.
---

# Testes

Rodam no schema `test` da mesma instância do banco de produção
(`DATABASE_SCHEMA=test`). Isolado por schema, mas é a mesma instância.

Eles **apagam tabelas inteiras** entre casos — por isso o schema separado.

## Nunca rode duas suítes ao mesmo tempo

`npm run test` limpa as tabelas do schema `test` entre casos. Duas rodadas em
paralelo — inclusive uma em segundo plano e outra em primeiro — apagam os dados
uma da outra e produzem falhas que **não existem**.

Custou duas investigações de falso positivo. Espere a primeira terminar.

## Coluna ou tabela nova? `scripts/setup-test-schema.mjs`

O schema `test` é mantido à mão e **não recebe migração**. Esquecer de
atualizar o script derruba dezenas de casos com `column "x" does not exist`.
Aconteceu na 0010 e na 0011.

`npm run test:setup` sincroniza.

## O limite de tempo é 20s, não 5s — de propósito

Banco remoto: **uma ida custa 171 ms medidos**. O padrão do vitest (5s) dá ~29
idas. Só a limpeza entre casos gasta ~1s, e o provisionamento é transação
longa.

Os testes de `provision` e `publish` não eram lentos por defeito — a rede é que
é. `lib/db/testCleanup.ts` faz a limpeza numa ida só (era 1707 ms em dez idas,
agora 1101 ms).

Não baixe o timeout para "consertar" lentidão.

## Mocks globais em `vitest.setup.ts`

- `next/font/google` — é transformação de build; fora do Next os loaders nem
  são funções. Lista de nomes explícita (vitest recusa Proxy). Fonte nova no
  catálogo = loader novo lá.
- `cacheTag` e `cacheLife` — só existem no runtime do Next. Teste com
  `vi.mock("next/cache")` local precisa incluir **os dois**, senão sobrescreve
  o mock global.

## Testes estruturais que existem por um bug, não por lógica

- `lib/pix/sem-chave-global.test.ts` — reprova se a constante de chave Pix
  voltar. O bug não era de lógica; era de **onde o dado vinha**.
- `lib/templates/registry.test.ts` — invariantes de todo molde do registry.
- Escopo por `siteId`: há testes que falham se alguma consulta vazar entre
  casais.
