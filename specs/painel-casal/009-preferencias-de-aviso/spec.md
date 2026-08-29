# Spec 009 — J2: preferências de aviso (`/conta/avisos`) (área: painel-casal)

**Status:** Rejeitada por ora (27/08/2026) — adiada até existir aviso por e-mail para o casal desligar

## Contexto

`Enlace - Notificacoes.dc.html`, artboard **J2** (`GET /conta/avisos`),
desenha uma tabela de preferências com cinco linhas de evento e duas colunas
de canal (**No sino** × **Por e-mail**):

| Evento | No sino | Por e-mail |
|---|---|---|
| Presente recebido — *"é dinheiro — avisa na hora, sempre"* | ligado, **travado** | ligado |
| Prazo de confirmação chegando — *"7 dias e 1 dia antes"* | ligado, **travado** | ligado |
| Confirmações de presença — *"agrupadas — nunca uma por uma"* | ligado | desligado |
| Recados no mural | ligado | desligado |
| Resumo da semana — *"segunda de manhã, com tudo junto"* | — | ligado |

E fecha com a regra: *"Avisos de **presente** e de **prazo** não podem ser
desligados no sino — envolvem dinheiro e data."*

O sino (J1) existe e está bem resolvido: `lib/site/avisos.ts` (334 linhas)
**deriva** os quatro tipos de aviso do banco, e `Avisos.tsx` os agrupa por
dia. O arquivo documenta por que não há lido/não-lido, e o argumento é bom:
*"'lido' preso a um aparelho é pior que ausente. O casal são DUAS pessoas,
quase sempre em dois celulares."*

**O que trava esta spec** é que ela contradiz a mesma decisão, por outro lado.
Preferência de aviso é estado do **casal**, exatamente como "lido": não sai de
nenhum fato já gravado, e guardar em `localStorage` teria o mesmo defeito
(uma pessoa desliga, a outra continua recebendo). Guardar no banco significa
coluna nova — e, das cinco linhas do desenho, **três** só teriam efeito se o
produto enviasse e-mail que hoje ele não envia.

## Escopo

*Congelado até a decisão da pergunta em aberto.*

- A rota `/conta/avisos` com a tabela de preferências.
- Onde a preferência é guardada.
- O que cada linha de fato liga e desliga.

## Fora de escopo

- O sino (J1), que existe e não muda.
- O resumo semanal (J3), que é `specs/painel-casal/010`.
- Lido/não-lido — o arquivo `Avisos.tsx` já registra a decisão de não ter, e
  o desenho J2 não a reabre.

## Requisitos funcionais

*Nenhum requisito é escrito enquanto a pergunta em aberto não tiver resposta.*
Três das cinco linhas do desenho controlam envio de e-mail que não existe;
escrever `FR: a coluna "Por e-mail" liga o envio de X` fixaria um envio que
nenhuma spec entrega ainda.

## Critérios de aceite

- **SC-001:** `grep -rn "aviso_prefs\|avisoPrefs" lib/db/schema.ts` devolve
  `0` — nenhuma coluna foi criada antes da resposta.
- **SC-002:** `/conta/avisos` continua respondendo 404 — nenhuma rota foi
  criada antes da resposta.

## Impacto em dados

**Coluna nova, aditiva.** A forma menos custosa é uma coluna `jsonb` em
`users` ou em `sites`:

```sql
alter table users add column aviso_prefs jsonb;   -- nullable, sem default
```

`null` = os padrões do desenho (que é o comportamento de hoje), e o registro
só nasce quando o casal mexe. Cabe no padrão **expandir → migrar → verificar →
restringir** do SDD §13.1: nada é apagado, nada é reescrito, `NOT NULL` nunca
entra, e não há backfill.

`users` e não `sites` porque a preferência é da pessoa, e um casal pode ter
mais de um pedido (`LIMITE_DE_PEDIDOS` em `lib/orderLimits.ts`).

## Referências

- Protótipo: `Enlace - Notificacoes.dc.html`, artboard **J2**
  (`PREFERÊNCIAS · DESKTOP · 900`, `enlace.site/conta/avisos`), a tabela de
  5×2 e o aviso de rodapé sobre presente e prazo; bloco **J3** de regras
  ("Regras — para o Claude Code"), item *"Presente e prazo avisam na hora e
  não podem ser desligados no sino"*.
- Versão atual: `lib/site/avisos.ts` (os quatro tipos derivados),
  `components/account/manage/Avisos.tsx` (o sino, com a justificativa escrita
  de por que não há estado por casal), `app/conta/pedidos/[id]/layout.tsx`
  (onde os avisos são montados). A rota `/conta/avisos`: **não existe — NOVO**.
- SDD do Enlace: §13.1 (migração aditiva), §6.2 (o banco tem casamento real).
- Regras de negócio: §2.3 (menor trabalho possível para o casal — uma tela de
  preferências é uma tela de decisões a mais).

## Dependências

- **Depende de** `specs/design-system/007-casca-de-email` e de
  `specs/painel-casal/011-emails-do-casal`: sem e-mail sendo enviado, a coluna
  "Por e-mail" da tabela não liga nem desliga nada.

## Perguntas em aberto

1. **Uma tela de preferências vale a pena num produto cuja primeira promessa é
   "vocês não vão trabalhar"?** É decisão do dono, e há um argumento de peso
   dos dois lados:

   - **A favor:** um casamento gera centenas de eventos pequenos, e a prancha
     J abre exatamente com isso — *"notificar um por um vira ruído e a pessoa
     desliga tudo"*. Dar controle é o que evita o desligamento total.
   - **Contra:** o produto **já resolve o ruído sem perguntar nada**.
     `lib/site/avisos.ts` agrupa confirmações ("12 confirmações novas desde
     ontem") em vez de notificar uma por uma, que é a regra J3 do próprio
     desenho. Das cinco linhas da tabela, três teriam a coluna "No sino"
     travada ou vazia — sobrariam duas decisões reais, e uma tela inteira
     para duas decisões é uma tela que cobra atenção sem devolver.

   **A recomendação é adiar**, até existir e-mail de aviso sendo enviado
   (`specs/painel-casal/011`). Uma tela para escolher o que **não** é enviado
   é uma tela que não faz nada.

2. **Se for feita, `users.aviso_prefs` ou uma tabela própria?** A coluna
   `jsonb` é mais simples e cabe na regra aditiva; uma tabela
   `user_notification_prefs` seria mais consultável. Como são cinco chaves
   booleanas por usuário, a coluna basta — mas a escolha muda o custo de
   mudar depois.

3. **Quando a migração pode rodar?** SDD §13.1 congela mudança de schema nas
   tabelas de RSVP a partir de outubro e proíbe migração na véspera ou semana
   do casamento (16/10/2026). `users` não é tabela de RSVP, mas a janela
   segura para qualquer migração precisa ser confirmada antes.

## Decisão registrada — 27/08/2026

**Adiada. Uma tela para escolher o que não é enviado é uma tela que não faz
nada.**

O produto **já resolve o ruído sem perguntar**: `lib/site/avisos.ts` agrupa
("12 confirmações novas desde ontem") em vez de notificar uma por uma — que é a
regra J3 do próprio desenho. Das cinco linhas da tabela, três teriam a coluna
"No sino" travada ou vazia. Sobrariam **duas decisões reais**, e uma tela
inteira para duas decisões cobra atenção sem devolver.

**E o gatilho ainda não chegou.** A recomendação era adiar até existir e-mail
de aviso sendo enviado. `painel-casal/011` entregou os dois **transacionais**
(recibo e "seu site está no ar") — e transacional **não se desliga**: é a regra
do próprio bloco de e-mails, e o FR-011 daquela spec a registra.

O que faria esta tela existir é aviso **recorrente**, e ele mora em
`painel-casal/010` (resumo semanal) e `site-publico/006` (convidado) — as duas
paradas, cada uma pelo seu motivo.

**O que reabre isto:** a `010` sair. Aí existem preferências reais a oferecer, e
a pergunta 2 (`users.aviso_prefs` em `jsonb` ou tabela própria) passa a
importar.
