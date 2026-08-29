# Rollback da migração 0021 — `orders.paid_at`

**Escrito ANTES de a migração rodar**, como o `AGENTS.md` §2 exige.

Origem: pendência aberta na execução da spec `painel-casal/011`, registrada em
`specs/INDEX.md`. Decisão de Anderson em 28/08/2026.

## O que a migração faz

```sql
ALTER TABLE "orders" ADD COLUMN "paid_at" timestamp with time zone;
```

Uma linha. Nullable, **sem default**, **sem backfill**, sem `NOT NULL`.

Zero `DROP`, zero `DELETE`, zero `UPDATE`. Nenhuma linha existente é tocada.

## Por que ela não muda nada hoje

O recibo já mostra a hora do pagamento, e continua mostrando: quando `paid_at`
é `null` — que é o caso dos 13 pedidos existentes — ele cai em `updated_at`,
exatamente como fazia antes.

O que muda é o pedido **novo**: a partir daqui `markOrderPaid` grava `paid_at`,
e o recibo passa a ler a coluna certa.

### O defeito que isso conserta

`updated_at` é escrito por qualquer alteração no pedido. Ele só funcionava como
hora de pagamento por um acidente de ordem: o recibo é montado **antes** da
transação que publica. Bastava alguém acrescentar uma escrita em `orders` entre
a confirmação e o envio — ou reenviar um recibo depois — para o casal receber um
comprovante com a hora errada.

## O rollback

Reversível de verdade, como a `0020`.

```sql
ALTER TABLE "orders" DROP COLUMN "paid_at";
```

Seguido de remover a linha em `lib/db/migrations/meta/_journal.json` e o
arquivo `0021_*.sql`.

### A janela em que o rollback é gratuito

Enquanto nenhum pedido tiver sido pago depois do deploy. Confira:

```sql
SELECT count(*) FROM orders WHERE paid_at IS NOT NULL;
```

- **Zero** → o `DROP COLUMN` não perde nada.
- **Maior que zero** → o `DROP` apaga a hora real de pagamentos que já
  aconteceram, e ela **não é reconstituível** (`updated_at` já terá sido
  sobrescrito pela publicação). Nesse caso, prefira reverter só o código, que
  volta a ler `updated_at`, e deixe a coluna onde está.

## Contagens a conferir depois

Do `backup:full` de 28/08/2026, feito imediatamente antes:

| Tabela | Antes |
|---|---|
| `orders` | 13 |
| `sites` | 18 |
| `groups` | 23 |
| `guests` | 31 |
| `users` | 5 |
| `site_content` | 18 |

E o casamento real:

```sql
SELECT coalesce(sum(seats_confirmed),0) FROM groups;  -- 23
```

## Se algo der errado no meio

Uma instrução só: ou aplicou, ou não aplicou. Confira com

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'orders' AND column_name = 'paid_at';
```

Sem linha = não aplicou, nada a desfazer.
