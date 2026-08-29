# Rollback da 0022 — `admin_notices`

Escrito **antes** de gerar a migração, como manda o procedimento da skill
`banco`. O `drizzle-kit` só gera o `up`.

## O que a 0022 faz

Cria **uma tabela nova**, `admin_notices`, e nada mais. Nenhuma coluna
existente é alterada, nenhuma tabela é tocada, nenhum dado é reescrito. É
aditiva no sentido estrito: antes da migração o banco funciona; depois dela,
também, porque nada que existia mudou de forma.

```
admin_notices
  id            uuid pk default gen_random_uuid()
  order_id      uuid not null → orders(id) on delete cascade
  admin_id      uuid          → admins(id) on delete set null
  admin_name    text not null
  title         text not null
  body          text not null
  read_at       timestamptz
  email_sent_at timestamptz
  created_at    timestamptz not null default now()
  index idx_admin_notices_order_id (order_id)
```

Em particular, ela **não** mexe em `orders.admin_message`. A coluna antiga
continua exatamente como está, com o dado que já tem, e a tela de
acompanhamento continua lendo dela. A aposentadoria de `admin_message` é um
passo posterior e separado — expandir → migrar → verificar → restringir.

## O rollback

```sql
DROP TABLE IF EXISTS admin_notices;
```

E remover a linha da 0022 de `drizzle.__drizzle_migrations` para o journal
voltar a bater com o banco:

```sql
DELETE FROM drizzle.__drizzle_migrations
WHERE hash = (
  SELECT hash FROM drizzle.__drizzle_migrations ORDER BY created_at DESC LIMIT 1
);
```

## O que este rollback APAGA

**Todos os recados que o time tiver mandado para os casais**, com o histórico
de leitura e de envio de e-mail. Não há como reconstruir: o recado é texto
escrito à mão por uma pessoa, não é derivado de nada.

O que **não** se perde:

- Nenhum pedido, site, convidado, confirmação, foto ou presente. A tabela não
  é referenciada por ninguém — as chaves apontam para fora dela, não para
  dentro.
- Os recados antigos de `orders.admin_message`, que nunca estiveram aqui.
- Os e-mails já enviados. Eles saíram; `email_sent_at` é só o registro de que
  saíram.

Se houver recado a preservar antes do rollback:

```sql
CREATE TABLE admin_notices_resgate AS SELECT * FROM admin_notices;
```

## Por que o risco é baixo

Tabela nova e isolada. Nenhuma consulta existente a menciona, então o código
anterior à 0022 roda com ela presente sem saber que existe — o que significa
que **reverter o código não exige reverter o banco**. Na prática, o rollback
de schema só é necessário se a tabela precisar sumir de vez; para desligar a
funcionalidade basta voltar o código.
