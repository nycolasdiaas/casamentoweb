# Rollback — migração `cancelled` em `order_status`

**Escrito ANTES de rodar a migração**, como manda a regra 4 do `AGENTS.md`.

- **Data:** 27/08/2026
- **Spec:** `specs/painel-casal/013-cancelar-vira-estado/spec.md`
- **Backup:** `backups/full-backup-2026-08-27T21-12-18-055Z.json` (2,2 MB)
- **Contagens no momento do backup:** 23 grupos, 31 convidados, 12 pedidos,
  17 sites, 4 convites, 110 presentes.

## O que a migração faz

```sql
ALTER TYPE order_status ADD VALUE 'cancelled';
```

E mais nada. Nenhuma linha é lida, escrita ou apagada. Nenhuma coluna muda de
tipo, de default ou de nulabilidade.

## O que ela NÃO faz

**Não recupera os pedidos cancelados antes dela.** Eles foram apagados por
`deleteOrder` e não voltam. A contagem de cancelados começa do zero.

## Rollback

**`ADD VALUE` de enum não é reversível no Postgres** sem recriar o tipo — e
recriar `order_status` exigiria dropar e reconstruir a coluna `orders.status`
de 12 pedidos reais, o que é muito mais perigoso que o problema que resolveria.

Então o rollback **não é desfazer a migração**. É este, em três níveis:

### Nível 1 — reverter o código, deixar o valor no enum (o caminho normal)

```bash
git revert <commit>
```

O valor `'cancelled'` continua existindo no tipo e **nenhuma linha o usa**,
porque só o código novo o escrevia. Um enum com um valor a mais e zero linhas é
inerte: nenhuma consulta muda de resultado, nenhum índice muda de tamanho.

**Este é o rollback de verdade, e ele é suficiente.**

### Nível 2 — se alguma linha já recebeu `cancelled`

```sql
-- Volta os cancelados ao estado anterior ao cancelamento.
-- `preview_ready` é o estado de onde o casal cancela na prática: o
-- provisionamento é síncrono e `submitted` dura milissegundos.
UPDATE orders SET status = 'preview_ready' WHERE status = 'cancelled';
```

Depois disso o Nível 1 se aplica. **Atenção:** isto devolve à lista do casal
pedidos que ele mandou cancelar — só faça se o Nível 1 não bastar.

### Nível 3 — restaurar do backup

Só se algo além do previsto acontecer. O backup é um JSON com todas as tabelas;
a restauração é manual e substitui o estado inteiro, então ela custa qualquer
escrita feita depois das 18:12 de 27/08.

## Verificação depois de migrar

```sql
SELECT unnest(enum_range(NULL::order_status));   -- 7 valores, 'cancelled' no fim
SELECT status, count(*) FROM orders GROUP BY status;  -- 12 pedidos, 0 cancelled
SELECT count(*) FROM groups;   -- 23
SELECT count(*) FROM guests;   -- 31
SELECT coalesce(sum(seats_confirmed),0) FROM groups;  -- 23
```

Se qualquer um destes números mudar, pare e vá ao Nível 3.

## Janela

O `AGENTS.md` congela mudanças a partir de outubro; o casamento é 16/10/2026.
Rodada em **27/08**, com cinquenta dias de folga.

A tabela `orders` **não é usada pelo casamento legado** — ele nasceu antes do
fluxo de pedidos e tem `order_id` nulo. Mesmo assim o backup e a verificação
acima cobrem as tabelas dele, porque o congelamento é sobre o banco e não sobre
a tabela.
