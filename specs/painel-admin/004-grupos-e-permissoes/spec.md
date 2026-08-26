# Spec 004 — G2: grupos e permissões da equipe (área: painel-admin)

**Status:** Bloqueada (ver Perguntas em aberto)

## Contexto

`Enlace - G Admin.dc.html`, artboard **G2** (`GET /admin` ·
`→ POST createGroupAction · deleteGroupAction`), desenha uma tela de
**controle de acesso da equipe**:

- cabeçalho `ACESSOS` / `Grupos e permissões`, com um campo
  `Nome do novo grupo…` e o botão `+ Criar grupo`;
- três cartões de grupo: **Equipe Enlace** (*acesso total*, 3 membros, ponto
  verde), **Suporte** (*pedidos e convidados*, 2 membros), **Financeiro**
  (*presentes e repasses*, 1 membro, ponto âmbar);
- em cada cartão, avatares sobrepostos com as iniciais dos membros, a
  contagem, e `Gerenciar` (ou `Apagar`, em `--danger`, no terceiro).

**Nada disso existe.** `lib/db/schema.ts:41-49` mostra a tabela `admins` com
`id`, `name`, `email`, `password_hash`, `created_at`. Não há papel, não há
grupo, não há permissão — todo admin autenticado vê tudo. `requireAdmin()`
(`lib/auth/requireAdmin.ts`) é uma porta binária: entrou, entrou.

E o endereço `/admin` está ocupado: ele serve hoje a tela de convidados do
casamento legado (`specs/painel-admin/002`).

O que o desenho pressupõe, e o produto não tem:

| Pressuposto de G2 | Situação |
|---|---|
| Grupos de acesso | tabela não existe |
| Papéis com escopo ("pedidos e convidados", "presentes e repasses") | conceito não existe |
| Múltiplos admins gerenciados por outro admin | não há tela de convidar/remover admin |
| Um grupo "Financeiro" com escopo de **repasses** | repasse não existe (`regras-de-negocio.md` §2.4 — ver `specs/painel-admin/003`) |

## Escopo

*Congelado até a decisão da pergunta em aberto.*

- Um modelo de papéis para `admins`.
- A tela de gestão.
- Onde ela mora, se `/admin` for liberado por
  `specs/painel-admin/002`.

## Fora de escopo

- Autenticação e sessão de admin (`proxy.ts`, `lib/auth/*`), que funcionam e
  o SDD §2 declara fora de reescrita.
- 2FA. O artboard G1 anuncia "2FA ativo" e a implementação **corretamente**
  não anuncia, porque não existe. Acrescentar 2FA é outra frente.
- Auditoria de quem mexeu no quê — o `README.md` do pacote §5 registra que
  ela **não foi desenhada** no protótipo (*"Admin: auditoria e reembolso"*
  entre "o que ainda não existe"). Há um começo em `order_audit_log`.

## Requisitos funcionais

*Nenhum requisito é escrito enquanto a pergunta em aberto não tiver resposta.*
Um modelo de permissão é a decisão mais cara desta auditoria inteira: ela
define uma superfície de segurança nova, e escrever `FR-001: existe uma
tabela admin_groups` antes de saber **se há mais de um operador** seria
projetar para um problema que talvez não exista.

Duas regras já valem para qualquer versão:

- **FR-001:** Nenhum papel pode dar acesso a dado de convidado (`guests`,
  `groups`, `guestbook_messages`) que hoje o admin não tenha. Ampliar acesso a
  dado de terceiro exige justificativa própria (SDD §6.1, LGPD).
- **FR-002:** Nenhum papel pode se chamar "Financeiro · presentes e repasses".
  Repasse não existe (`regras-de-negocio.md` §2.4), e nomear um papel por uma
  operação inexistente cria a expectativa de que ela exista.

## Critérios de aceite

O primeiro é o único que vale hoje; os outros dois só entram em vigor se a
pergunta em aberto for respondida com "sim".

- **SC-001:** `grep -rn 'admin_groups\|adminGroups' lib/db/ ` devolve `0` — nenhuma tabela foi criada antes da resposta.
- **SC-002:** Se e quando o modelo entrar: nenhum escopo declarado em `scopes` dá leitura de `guests`, `groups` ou `guestbook_messages` a quem não tinha. Atende FR-001.
- **SC-003:** Se e quando o modelo entrar: nenhum nome de grupo semeado contém a palavra `repasse`. Atende FR-002.

## Impacto em dados

**Duas tabelas novas, aditivas** — se a resposta for sim:

```sql
create table admin_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  scopes text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table admins add column group_id uuid references admin_groups(id)
  on delete set null;   -- nullable: admin sem grupo = acesso total, o de hoje
```

`admins.group_id` nullable e sem backfill é o que faz a migração ser
**reversível e sem mudança de comportamento**: enquanto ninguém for atribuído
a um grupo, todo admin continua vendo tudo, exatamente como hoje. É o padrão
**expandir → migrar → verificar → restringir** do SDD §13.1, com o passo 4
(`NOT NULL`) provavelmente nunca acontecendo.

`on delete set null` e não `cascade`: apagar um grupo **nunca** pode apagar a
conta de quem opera o produto.

## Referências

- Protótipo: `Enlace - G Admin.dc.html`, artboard **G2**
  (`GET /admin` · `→ POST createGroupAction · deleteGroupAction`), desktop
  1440 e mobile 390. `README.md` do pacote, §5 (*"Admin: auditoria e reembolso
  — o histórico de quem mexeu no quê e o fluxo de estorno"* entre o que ainda
  não existe **no próprio protótipo**).
- Versão atual: `lib/db/schema.ts:41-49` (`admins`, sem papel),
  `lib/auth/requireAdmin.ts`, `app/admin/layout.tsx`,
  `app/admin/page.tsx` (o endereço, hoje ocupado pelo casamento legado),
  `lib/db/schema.ts:53-70` (`order_audit_log`, o começo de auditoria que já
  existe). A tela G2: **não existe — NOVO**.
- SDD do Enlace: §2 (não-objetivo: *"auth, pagamento, pedidos e auditoria
  ficam como estão"*), §13.1 (migração aditiva), §14 decisão 8 (RLS adiado —
  o escopo é feito na aplicação), §11 (a tabela de segurança).
- Regras de negócio: §3 (*"o `/admin` existe para exceção, não para
  operação"*), §2.4 (não há repasse — FR-002), §8 (o que exige decisão do
  dono).

## Dependências

- **Depende de** `specs/painel-admin/002-dashboard-da-operacao` — enquanto o
  casamento legado ocupar `/admin`, G2 não tem endereço.
- Depende de `specs/painel-admin/003` só para a nomenclatura: o papel
  "Financeiro" do artboard nasce do cartão de repasse, que aquela spec recusa.

## Perguntas em aberto

1. **Existe mais de uma pessoa operando o Enlace?** Esta é a pergunta, e ela
   decide a spec inteira. `regras-de-negocio.md` descreve **um** papel de
   operação — *"O dono (Anderson)"* — e a promessa que sustenta o produto é
   *"eu não encosto no código"*, não "minha equipe opera o painel". O artboard
   G2 desenha três grupos e seis membros.

   - **Se hoje é uma pessoa só:** um modelo de permissão é infraestrutura de
     segurança para um problema que não existe, e ela tem custo permanente —
     toda tela nova de admin passa a precisar decidir quem vê. **A
     recomendação é adiar**, e registrar G2 como desenhado para um futuro que
     ainda não chegou.
   - **Se já há (ou vai haver) suporte ou financeiro:** o modelo é
     necessário **antes** do dashboard de `specs/painel-admin/002`, porque
     receita e conversão não deveriam ser visíveis a quem só responde
     suporte.

2. **Quais escopos, se for feito?** O artboard sugere três, mas um deles
   ("presentes e repasses") não existe. Os escopos que o produto de fato tem
   hoje são quatro, correspondendo às quatro telas: `pedidos`, `presentes`,
   `casamento` (o legado) e `metricas`. Confirmar a lista **antes** de criar a
   coluna `scopes text[]`, porque mudar a lista depois é mexer em dado.

3. **Quem pode criar e apagar grupo?** O artboard mostra `Apagar` num cartão
   de grupo sem nenhuma confirmação. Se o modelo entrar, apagar grupo DEVE
   passar pelo `DialogoDestrutivo`, e o grupo do próprio operador logado NÃO
   PODE ser apagável — um admin que se tranca fora do painel é um incidente
   que só o banco resolve.
