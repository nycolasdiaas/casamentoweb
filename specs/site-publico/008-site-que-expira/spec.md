# Spec 008 — O site de Convite e Site do Casamento expira (área: site-publico)

**Status:** Implementada (28/08/2026) — migração `0020` aplicada em produção.
**Entregue INERTE**: `PRAZO_ANUNCIADO_EM` é `null`, nenhum site tem prazo, e o
cron não tem o que arquivar. Cinco requisitos mudaram durante a execução, por
parecer do agente `regras-de-negocio` — ver "O que mudou na execução".

## Contexto

Esta spec não veio do protótipo. Veio da **decisão (b) de 28/08/2026**: os
pacotes **Convite** (R$ 9,90) e **Site do Casamento** (R$ 29,90) ficam no ar
*"até alguns meses depois do casamento"*, e o **Para Sempre** (R$ 99,90) fica
para sempre — que é o que o nome dele vende.

Hoje o produto **não faz nada disso**. Não há coluna de expiração no schema,
não há nada que tire um site do ar por tempo, e não há aviso. Na prática
**todo site fica no ar para sempre**, e os três pacotes se comportam igual.

Isso corrói o pacote mais caro por um caminho invisível: o "Para Sempre" cobra
dez vezes o Convite e uma de suas seis promessas é justamente a permanência.
Se o Convite também é permanente, a promessa é falsa por omissão.

**A vitrine hoje está calada, e isso é o certo enquanto o código não cumprir.**
Ela não promete prazo nenhum para Convite e Site. Escrever o prazo antes de a
expiração existir seria prometer o que o código não faz — pior que o silêncio
atual.

### O que já existe e não precisa ser inventado

- **`site_status` já tem `archived`** — *"fora do ar por decisão manual"*.
- **`lib/repositories/siteView.ts` filtra `status = 'published'`**, então site
  arquivado já responde 404 ao convidado, com **nada apagado**: conteúdo,
  fotos, presentes e confirmações continuam no banco.
- **`lib/site/visibility.ts`** já sabe arquivar e desarquivar.
- **`vercel.json` já tem um cron** (`/api/cron/resumo-semanal`, segunda 8h).

Expirar, portanto, **não é um mecanismo novo**: é arquivar por um motivo novo.

## O problema que essa reutilização cria, e que é o coração da spec

O comentário de `lib/site/visibility.ts` diz, sobre a publicação automática:

> *"recusa republicar site arquivado de propósito: arquivar é decisão humana,
> e um webhook atrasado não pode desfazê-la."*

A expiração inverte isso: ela é o **primeiro arquivamento que não é humano**.
E as duas voltas são opostas:

| Arquivado por | Quem pode desarquivar | Por quê |
|---|---|---|
| **O casal** (tirou do ar) | O próprio casal, de graça | Ele já pagou; esconder e mostrar é dele |
| **Expiração** | **Ninguém, sem upgrade** | Desarquivar de graça é desfazer o que a expiração vende |

Se `unarchiveSite` não souber a diferença, o casal cujo site expirou clica
"colocar de volta no ar" e **o produto devolve de graça o que acabou de
expirar**. O prazo vira decoração.

## Escopo

- Uma coluna: `sites.expires_at`, nullable, **sem backfill**.
- A data é calculada **na publicação**, não na compra.
- Um cron diário que arquiva o que venceu.
- Dois avisos por e-mail antes de vencer, e um depois.
- `unarchiveSite` passa a recusar site expirado.
- **A vitrine não muda nesta spec** — ver FR-011.

## Fora de escopo

- **O fluxo de upgrade para o Para Sempre.** É a saída natural do casal cujo
  site expirou, não existe hoje, e merece spec própria. Esta spec entrega o
  aviso que aponta para o WhatsApp, como o resto do produto já faz.
- **Apagar dado de site expirado.** Nunca, e não por ora: por decisão. Ver
  FR-004.
- **Mudar o Para Sempre.** `expires_at` nasce e permanece `null` nele.

## Requisitos

### FR-001 — `sites.expires_at`, nullable, sem backfill

`timestamptz`, nullable, sem default. **`null` significa "nunca expira"**, e é
o que os 17 sites de hoje continuam sendo — **inclusive o casamento real de
16/10/2026, que esta spec não pode tocar de jeito nenhum**.

Migração aditiva pura: um `add column`, zero `DROP`, zero `DELETE`, zero
`UPDATE`. Procedimento do `AGENTS.md` (backup, rollback escrito antes, ensaio,
contagens conferidas).

`null` como "nunca" e não uma data no ano 9999: o Para Sempre **não tem** data
de expiração, e escrever uma seria guardar uma mentira que algum relatório
futuro leria como verdade.

### FR-002 — A data é calculada na PUBLICAÇÃO, com base na data do casamento

Quando um site de tier `convite` ou `site` é publicado, `expires_at` recebe
**`site_content.wedding_date` + 12 meses**.

Doze meses porque o valor precisa cobrir o que o casal ainda faz depois da
festa: agradecer, compartilhar as fotos, mostrar para quem não foi. Um prazo
curto transforma o produto barato em pegadinha.

**Na publicação e não na compra**, porque é a publicação que põe o site diante
de convidado — e é dela que o casal conta o tempo. Um site comprado em janeiro
e publicado em agosto não pode ter queimado sete meses de prazo na gaveta.

**Sem data de casamento, `expires_at` fica `null`.** Não expira. É a única
escolha segura: a alternativa seria contar da publicação e tirar do ar o site
de um casal cuja festa ainda não aconteceu.

### FR-003 — Um cron diário arquiva o que venceu

Rota nova, `/api/cron/expirar-sites`, protegida pelo **mesmo `CRON_SECRET`** e
com a mesma postura da `/api/cron/resumo-semanal`: **sem o segredo, responde
503 e não faz nada**.

Ela arquiva todo site com `status = 'published'` e `expires_at < now()`.

Diária e não horária porque a diferença entre expirar às 3h e às 15h não
existe para ninguém, e um cron a mais por hora é 24× mais chance de acidente.

### FR-004 — Expirar TIRA DO AR, nunca apaga

O site vira `archived`. Conteúdo, fotos, presentes, grupos e confirmações
continuam no banco, intactos.

Isto não é cautela de implementação, é a regra 6 da §14 do SDD e a mesma razão
pela qual apagar a conta do casal **não** apaga o site do casamento: o
casamento aconteceu, e o registro dele não some porque um prazo comercial
venceu. Se o casal voltar em dois anos e pagar o Para Sempre, tudo tem que
estar lá.

### FR-005 — `unarchiveSite` recusa site expirado

Se `expires_at` está no passado, `unarchiveSite` devolve `ok: false` com um
texto que diz o que aconteceu e o que fazer — **sem culpar o casal e sem
prometer o que não existe**.

Este é o requisito que impede a expiração de virar decoração (ver "O problema
que essa reutilização cria").

### FR-006 — O casal continua podendo arquivar e desarquivar por vontade dele

Site **não** expirado segue exatamente como hoje. A expiração não pode
sequestrar o botão que já existe.

### FR-007 — Dois avisos antes, um depois

Pelo mesmo cron da FR-003, e **sem descadastro** — ver "O que mudou na
execução", item 3.

| Quando | O quê |
|---|---|
| **30 dias antes** | "O site de vocês sai do ar em 30 dias" + como manter |
| **7 dias antes** | O mesmo, com a data exata |
| **No dia em que sai** | "Saiu do ar, e **nada foi apagado**" |

O terceiro existe porque é o que separa "expirou" de "sumiu". Sem ele, o casal
descobre por um convidado dizendo que o link quebrou.

**Cada aviso é enviado uma vez.** Ver FR-008.

### FR-008 — Um aviso enviado não é reenviado

O cron roda todo dia; sem memória, o aviso de 30 dias sairia 23 vezes.

Registrar em `sites` uma coluna por aviso seria três colunas para uma pergunta
só. A saída é derivar da data: o aviso de 30 dias só sai no dia em que
`expires_at - hoje` é **exatamente** 30. Sem coluna nova, sem estado.

O custo assumido: um dia em que o cron não roda é um aviso perdido. Aceitável
porque são três avisos redundantes entre si e o último é o que importa.

### FR-009 — O painel do casal mostra a data

**No sino (`lib/site/avisos.ts`), não em `SiteNoAr`** — ver "O que mudou na
execução", item 4.

Um prazo que só existe no e-mail é um prazo que o casal não consegue conferir.

### FR-010 — O admin vê e pode estender — **ADIADA**, ver item 5

`sites.expires_at` visível na tela do site no admin, e editável.

Existe porque a primeira venda com expiração vai gerar um pedido de exceção
("meu casamento adiou"), e a alternativa a um campo editável é um `UPDATE`
escrito à mão no banco de produção — que é exatamente o que o `AGENTS.md`
existe para evitar.

### FR-011 — A vitrine só muda DEPOIS, e em spec própria

Nada em `lib/packages.ts` muda aqui.

A ordem é deliberada: **construir, depois prometer.** Quando FR-001 a FR-010
estiverem no ar, a linha da vitrine vira mudança de texto — e aí passa pelo
agente `regras-de-negocio`, como o `AGENTS.md` §5 exige.

## Critérios de aceite

| # | Critério |
|---|---|
| **SC-001** | Os 17 sites existentes ficam com `expires_at = null` depois da migração. As contagens do casamento real não mudam: 23 grupos, 31 convidados, 23 lugares confirmados |
| **SC-002** | Publicar um site `para-sempre` deixa `expires_at` em `null` |
| **SC-003** | Publicar um `convite` ou `site` com data de casamento grava data do casamento + 12 meses |
| **SC-004** | Publicar sem data de casamento deixa `null` |
| **SC-005** | O cron arquiva site vencido e **não** toca em site com `expires_at` nulo ou futuro |
| **SC-006** | Depois de arquivado por expiração, o conteúdo, as fotos, os grupos e as confirmações continuam no banco |
| **SC-007** | `unarchiveSite` recusa site expirado e aceita site arquivado à mão |
| **SC-008** | O aviso de 30 dias sai no dia 30 e **não sai** no 31 nem no 29 |
| **SC-009** | Quem tem `weekly_digest_opt_out` **continua recebendo** estes três avisos, e o site é arquivado mesmo quando não há ninguém para avisar |
| **SC-010** | Sem `CRON_SECRET`, a rota responde 503 e não arquiva nada |
| **SC-011** | `lib/packages.ts` não muda nesta spec |

## Impacto em dados

**Uma migração aditiva:** `alter table sites add column expires_at timestamptz`.

Sem default, sem backfill, sem `NOT NULL`. Nenhum site existente muda de
comportamento. Rollback: `drop column` — reversível de verdade, ao contrário
da `0018`, enquanto nenhuma data tiver sido gravada.

**Janela:** não pode ser feita na véspera nem na semana de **16/10/2026**.

## O que mudou na execução

Seis coisas, e cinco vieram do parecer do agente `regras-de-negocio`
(consultado por exigência do `AGENTS.md` §5, porque são textos que o casal lê).

### 1. A trava do anúncio — o achado que mais importa

**A FR-001 não bastava.** Ela protege quem já publicou (sem backfill, `null` =
nunca sai), mas sobrava uma porta dos fundos: **a publicação tardia**. A FR-002
calcula na publicação, então um pedido pago hoje — lendo uma vitrine que não
promete prazo nenhum — publicado depois desta spec subir, ganharia um prazo que
ninguém mostrou a ele.

O parecer foi **NÃO PODE**, e a regra que sustenta é *"o preço está na tela e é
o preço"*: o que foi vendido é o que a tela dizia no momento da compra.

**A saída:** `PRAZO_ANUNCIADO_EM` em `lib/site/expiracao.ts`, hoje `null`.
Enquanto for `null`, `calcularExpiracao` devolve `null` para todo mundo — a
maquinaria fica montada, testada e **inerte**. Quando a vitrine ganhar a linha
do prazo (FR-011), a constante recebe a data, e **só pedidos feitos a partir
dali** expiram. A conta é sobre `orders.created_at`, não sobre o site: o que
vale é quando o casal leu a proposta.

### 2. "Expirar" é palavra de sistema

Não aparece em nenhum texto que o casal lê. O par que o produto já usa é
**"colocar no ar" / "sair do ar"**, e é ele que vale. `expires_at` fica no
código; o dono não é o casal.

### 3. Os três avisos NÃO têm descadastro — a FR-007 foi invertida

A spec dizia que eles respeitavam `weekly_digest_opt_out`. O parecer reprovou
com o caso concreto: quem se descadastrou do resumo semanal **descobriria que o
site saiu do ar por um convidado dizendo que o link quebrou**.

A diferença é de natureza. O resumo semanal sai porque é segunda-feira — é
cortesia, e cortesia se recusa. Estes saem porque **o serviço que o casal pagou
está mudando de estado**, como o recibo e o "está no ar", que a prancha de
e-mails classifica como transacionais.

### 4. A FR-009 apontava o componente errado

Ela mandava pôr a data em `SiteNoAr`. Ao abrir o arquivo, ele diz de si mesmo:
*"é comemoração de um momento, não estado da tela"* — aparece uma vez, no
primeiro carregamento depois de publicar, e some. Um prazo escrito ali seria
visto por quem acabou de publicar e por mais ninguém.

Foi para o **sino**, que já é onde o painel conta o que muda com o tempo e já
tem um aviso de prazo com a mesma forma. Custou uma função e nenhum componente
novo. Nos **mesmos dias do e-mail** (30 e 7): se a tela avisasse todo dia e o
e-mail só em dois, o casal veria dois produtos discordando sobre a urgência da
mesma coisa.

### 5. A FR-010 foi adiada, e a razão é honesta

**Não existe tela de site no admin** — `app/admin/` tem pedidos, presentes,
dashboard e o casamento legado, e nenhuma tela por site. Entregá-la exigiria
construir uma tela inteira para editar um campo que **hoje nenhum site tem**.

A necessidade que a FR-010 atende ("meu casamento adiou") só nasce quando
sites passarem a ter prazo — ou seja, junto com a FR-011. Ela vai para a mesma
spec que anunciar o prazo na vitrine, e é **condição de a FR-011 poder subir**.

### 6. O preço vai escrito no e-mail

"Fale com a gente" sem valor vira *"consulte valores"* — a linha que a promessa
*"a página é a proposta"* proíbe. Com **R$ 99,90** na mensagem, a proposta
continua sendo a página mesmo quando o atendimento é humano.

## Como cada critério foi conferido

40 testes novos: 22 em `lib/site/expiracao.test.ts` (funções puras), 15 em
`lib/site/expirarSites.test.ts` (contra o banco) e 3 em
`lib/site/publish.test.ts`.

| Critério | Medida |
|---|---|
| **SC-001** | Migração `0020`: `add column` nullable, sem default, sem backfill. Conferido depois: **0 datas gravadas**, 23 grupos, 31 lugares, 23 confirmados, 18 sites, 5 usuários, 13 pedidos — idênticos ao backup de 28/08 |
| **SC-002** | `para-sempre` devolve `null` mesmo com anúncio e data de casamento |
| **SC-003** | `convite` e `site` recebem data do casamento + 12 meses — **só com o anúncio injetado no teste**; em produção, `null` |
| **SC-004** | Sem data de casamento, `null` |
| **SC-005** | `expires_at` nulo nunca entra na consulta; prazo futuro não gera tarefa; site em prévia e arquivado ficam de fora |
| **SC-006** | Depois de arquivar: grupos, convidados, recados e conteúdo continuam no banco, conferidos um a um |
| **SC-007** | Arquivado à mão volta; arquivado por prazo **não** volta, e a mensagem contém "Nada foi apagado" |
| **SC-008** | O aviso de 30 sai no dia 30 e não no 31 nem no 29; o de saída vale para tudo que já venceu; a hora do dia não muda o resultado |
| **SC-009** | Quem tem opt-out **continua** sendo avisado; site sem dono é arquivado mesmo sem ninguém para avisar |
| **SC-010** | A rota responde 503 sem `CRON_SECRET` |
| **SC-011** | `lib/packages.ts` não mudou |
| **A trava** | Publicar não grava `expires_at`, nem para o tier expirável; republicar não apaga data posta à mão |

## Perguntas em aberto

1. ~~**12 meses é o número certo?**~~ **CONFIRMADO por Anderson em
   28/08/2026.** `MESES_APOS_O_CASAMENTO = 12` é a regra, não mais uma
   recomendação minha.
2. **Por quanto tempo a Enlace guarda um site fora do ar?** *(DECISÃO DO DONO,
   pelo parecer.* **Anderson, em 28/08/2026: "não sei ainda" — segue aberta, e
   o produto está no estado seguro enquanto estiver.)* Os textos dizem **"nada foi apagado"** — fato, no passado —
   e **não prometem prazo nenhum**, nem "para sempre" nem "por N meses". Um
   prazo escrito criaria a obrigação de apagar dado de casamento, que colide
   com a FR-004. Sugestão do parecer para `docs/regras-de-negocio.md`:
   *"Política de retenção de site fora do ar: em aberto. Nenhum texto ao casal
   promete prazo de guarda."*
3. **O que o casal faz quando o site sai do ar?** A resposta natural é mudar
   para o Para Sempre, e esse fluxo não existe. Decisão do dono em 28/08/2026:
   por ora o aviso aponta para o WhatsApp, com o preço escrito. **É um toque
   humano por venda**, contra a promessa "o dono não encosta no código" — o
   parecer registrou a dívida, e ela vence quando isso deixar de ser caso
   raro.
