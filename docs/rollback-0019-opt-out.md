# Rollback — `users.weekly_digest_opt_out`

**Escrito ANTES de rodar a migração**, como manda a regra 4 do `AGENTS.md`.

- **Data:** 27/08/2026
- **Spec:** `specs/painel-casal/010-resumo-semanal/spec.md`
- **Backup:** `backups/full-backup-2026-08-27T21-59-09-224Z.json` (2,2 MB)
- **Contagens no momento:** 5 usuários, 23 grupos, 31 convidados, 17 sites.

## O que a migração faz

```sql
ALTER TABLE "users" ADD COLUMN "weekly_digest_opt_out" timestamp with time zone;
```

Coluna nova, **nullable, sem default, sem backfill**. Os 5 usuários existentes
ficam com `null`, que significa "recebe" — exatamente o comportamento de antes
de a coluna existir.

## Por que ela é obrigatória, e não um extra

O resumo semanal é o **primeiro e-mail não transacional** do produto. Um e-mail
recorrente sem descadastro que funcione não é um detalhe de acabamento: é o que
transforma reclamação em denúncia de spam, e denúncia de spam custa o domínio
inteiro — o mesmo domínio que manda o recibo e o "seu site está no ar".

## Rollback

Diferente da `0018`, esta é **reversível de verdade**:

```sql
ALTER TABLE "users" DROP COLUMN "weekly_digest_opt_out";
```

Mas só faça isso junto com o `git revert` do código, e **só se ninguém tiver
usado o link ainda**:

```sql
SELECT count(*) FROM users WHERE weekly_digest_opt_out IS NOT NULL;
```

Se o número for maior que zero, dropar a coluna **apaga o pedido de alguém para
parar de receber** — e o próximo envio volta a alcançar quem pediu para sair.
Nesse caso o rollback é só o código: `git revert`, coluna fica. Uma coluna sem
leitor é inerte.

## Verificação depois de migrar

```sql
SELECT column_name FROM information_schema.columns
 WHERE table_name = 'users' ORDER BY ordinal_position;   -- 8 colunas
SELECT count(*) FROM users WHERE weekly_digest_opt_out IS NOT NULL;  -- 0
SELECT count(*) FROM users;    -- 5
SELECT count(*) FROM groups;   -- 23
SELECT count(*) FROM guests;   -- 31
```

## Estado da entrega

A rota `/api/cron/resumo-semanal` responde **503 sem `CRON_SECRET`**, e ele não
está configurado. **Nada é enviado até alguém configurar** — mesma postura do
`ABACATEPAY_WEBHOOK_SECRET`. Desligada é o padrão seguro.
