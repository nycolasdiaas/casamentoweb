# Auditoria E2E de usabilidade — criação de um casamento do zero

**Data:** 09/09/2026
**Método:** uso real da interface, do primeiro acesso até o site pronto, como um casal que nunca viu a plataforma.
**Ambiente:** aplicação rodando localmente (`next dev`, porta 3100) contra um schema `e2e` **isolado**, criado rodando as 24 migrações reais com `"public"` reescrito para `"e2e"`. O schema `public` (que tem casamento de cliente no ar) não foi tocado — verificado antes e depois: 24 tabelas em ambos os momentos.
**Casal fictício:** Mariana & Rafael, `mariana.rafael.e2e@example.com`, casamento em 15/05/2027, pacote **Site do Casamento (R$ 29,90)**, modelo Toscana.

> **Nota de escopo:** não executei o pagamento. O botão "Publicar site" leva ao checkout da AbacatePay com chave de API real, e disparar cobrança em serviço externo é ação que exige autorização explícita. Tudo até a porta do checkout foi testado.

---

## 1. Resumo executivo

A Enlace é um produto **visivelmente bem cuidado**. A escrita é humana e específica, os estados de carregamento explicam o que está acontecendo, o diálogo de cancelamento é honesto sobre consequências, e há acertos de design que quase ninguém faz — como renderizar cada uma das 34 fontes usando o **nome real do casal**, ou colocar a prévia do site ao vivo ao lado do formulário de conteúdo. Nenhum erro de JavaScript apareceu em toda a sessão.

Mas o fluxo de ponta a ponta tem **dois buracos que impedem a promessa central do produto**:

1. **O casal não consegue cadastrar as famílias que vão confirmar presença.** A criação de grupos de convidados existe apenas na área administrativa. A aba "Convidados" do painel é só de leitura, e diz ao casal "quando vocês cadastrarem as famílias" — algo que ele não tem como fazer. Como a confirmação de presença é justamente o que separa o pacote de R$ 9,90 do de R$ 29,90, o produto vendido não se completa sozinho, e cada venda passa a exigir trabalho manual do dono.

2. **O botão "Salvar e sair" descarta a maior parte do que o casal digitou.** Local da cerimônia, endereço, horário, local da festa, traje e história somem sem aviso. Sobrevivem apenas pacote, modelo, cores e nomes. O botão que o casal usa para *proteger* o trabalho é o que destrói o trabalho.

Some-se a isso que **o pacote mais caro vem pré-selecionado** na primeira etapa (um rascunho meu ficou gravado como "Para Sempre", R$ 99,90, sem eu ter tocado no seletor) e que **as três cores escolhidas no questionário não fazem o que os rótulos prometem** — duas estão trocadas e a terceira é gravada no banco e nunca lida por nada.

**Nota geral: 6,0 / 10.** O artesanato da superfície é de 8,5; o fluxo de ponta a ponta é de 4. A distância entre os dois é a história desta auditoria.

---

## 2. Fluxo E2E realizado

```
Landing (/)
  └─ "Criar meu site" → /conta/criar
       └─ cadastro (nomes, e-mail, WhatsApp, senha) → login automático → /conta
            └─ "Fazer meu pedido" → /conta/pedido/novo
                 └─ questionário de 11 etapas
                      ├─ etapa 1  pacote
                      ├─ etapa 2  nomes + data
                      ├─ etapa 3  cerimônia (local, endereço, horário)
                      ├─ etapa 4  festa (local, endereço)
                      ├─ etapa 5  traje
                      ├─ etapa 6  história
                      ├─ etapa 7  modelo (com prévia ao vivo)
                      ├─ etapa 8  cores
                      ├─ etapa 9  tipografia (34 fontes)
                      ├─ etapa 10 observações
                      └─ etapa 11 revisão → "Criar nosso site"
                           └─ site provisionado: /s/mariana-e-rafael (status preview)
                                └─ painel de gerenciamento (9 abas)
                                     ├─ Início · Páginas · Conteúdo · Visual
                                     ├─ Fotos · Convites · Convidados
                                     └─ Presentes · Compartilhar
                                          └─ [PAREI AQUI] "Publicar site" → checkout
```

**Caminhos alternativos exercitados:** enviar formulário vazio; e-mail malformado; senha curta; data no passado; voltar e avançar etapas; salvar parcialmente e retomar; recarregar a página; sair da conta e entrar de novo; senha errada no login; cancelar um pedido; criar um segundo pedido; abrir o site do convidado sem nenhuma família cadastrada; buscar um convite com nome inexistente; visualizar o site em 1440px e em 390px.

---

## 3. Etapas testadas

| # | Etapa | Resultado |
|---|---|---|
| 1 | Landing e navegação | ✅ clara, preços à vista, FAQ |
| 2 | Cadastro de conta | ⚠️ funciona, mas promete e-mail que não existe |
| 3 | Validação de campos no cadastro | ✅ nativa, correta |
| 4 | Primeiro acesso ao painel | ✅ próximo passo evidente |
| 5 | Escolha de pacote | 🔴 mais caro pré-selecionado |
| 6 | Nomes e data | ⚠️ pergunta o nome de novo, campo vazio |
| 7 | Cerimônia / festa / traje | ✅ campos bons, atalho "mesmo lugar" funciona |
| 8 | História | ✅ contador, limite, parágrafos preservados |
| 9 | Escolha de modelo | ✅ prévia ao vivo; ⚠️ com dados de outro casal |
| 10 | Cores | 🔴 rótulos não correspondem ao efeito |
| 11 | Tipografia | ✅ **o melhor momento do produto** |
| 12 | Observações | ✅ funciona |
| 13 | Revisão | ⚠️ omite 5 dos campos preenchidos |
| 14 | Criação do site | ✅ rápida, site provisionado |
| 15 | Salvar rascunho e retomar | 🔴 perde a maior parte dos dados |
| 16 | Painel — Conteúdo | ✅ excelente (prévia lateral) |
| 17 | Painel — Visual | ✅ correto |
| 18 | Painel — Fotos | ⚠️ oferece álbum fora do pacote |
| 19 | Painel — Convites | ✅ editor completo |
| 20 | Painel — Convidados | 🔴 beco sem saída |
| 21 | Painel — Presentes | 🔴 liberado fora do pacote |
| 22 | Painel — Compartilhar | ✅ estado vazio bem explicado |
| 23 | Site do convidado (desktop) | ✅ com ressalvas visuais |
| 24 | Site do convidado (390px) | ⚠️ sobreposições na capa |
| 25 | Busca "não recebi meu link" | ✅ mensagem de erro exemplar |
| 26 | Cancelar pedido | ⚠️ funciona, mas a tela não reage |
| 27 | Sair e entrar de novo | ✅ estado preservado |

---

## 4. Problemas encontrados

### 🔴 CRÍTICO

---

#### C1 — O casal não tem como cadastrar as famílias que vão confirmar presença

**Onde aconteceu:** painel do casal, aba **Convidados** (`/conta/pedidos/<id>/convidados`).

**Ação realizada:** com o site já criado no pacote "Site do Casamento", abri a aba Convidados para cadastrar as famílias e gerar os links de confirmação.

**Resultado esperado:** um botão do tipo "Cadastrar família" que permita criar um grupo, listar os nomes dos convidados daquele grupo e obter o link `/rsvp/<endereço>` para mandar no WhatsApp.

**Resultado atual:** uma tela vazia com o texto *"Nenhuma família cadastrada — Quando vocês cadastrarem as famílias, cada uma ganha um endereço próprio para responder"*. Não há botão, link ou qualquer indicação de onde fazer isso. Procurei nas outras oito abas: a aba **Convites** cria a *arte* do convite (um editor de canvas), não os grupos de convidados.

Confirmado no código: a criação de grupos existe **somente na área administrativa**.

```
app/actions/admin-actions.ts:15   export async function createGroupAction(...)
components/admin/GroupForm.tsx    (formulário — área admin)
```

E o próprio comentário de `app/conta/pedidos/[id]/convidados/page.tsx` descreve a tela como *"quem foi convidado e quem respondeu"* — leitura, nunca escrita.

**Impacto:** a confirmação de presença é o recurso que justifica a diferença entre o pacote Convite (R$ 9,90) e o Site do Casamento (R$ 29,90) — e é o segundo item da lista de recursos da landing (*"Confirmação por família: cada família recebe um link exclusivo e confirma todo mundo de uma vez"*). Um casal que compra o pacote fica com a seção de RSVP no site dizendo aos convidados *"cada família recebeu um link pessoal, procure a mensagem que enviamos"* — mensagem que nunca existiu, porque não há como criá-la. Além disso, isso quebra duas das três promessas do produto: **o casal não trabalha** (aqui ele não *consegue* trabalhar) e **o dono não encosta no código** (aqui o dono precisa cadastrar manualmente cada família de cada casal).

**Severidade:** Crítico.

**Sugestão:** portar o `GroupForm` do admin para a aba Convidados, com escopo de `siteId` do casal. Enquanto isso não existe, o estado vazio precisa dizer a verdade — algo como *"As famílias ainda são cadastradas pela nossa equipe. Mande a lista para [contato] e a gente devolve os links em 24h"* — para o casal não ficar esperando uma tela que não vai aparecer.

---

#### C2 — "Salvar e sair" descarta cerimônia, festa, traje e história

**Onde aconteceu:** questionário de pedido, botão **"Salvar e sair"** presente em todas as etapas (1 a 10).

**Ação realizada:** preenchi as etapas 1 a 7 (pacote, nomes, data, cerimônia com local/endereço/horário, festa, traje, história, modelo) e cliquei em "Salvar e sair" — o gesto natural de quem quer continuar depois.

**Resultado esperado:** o rascunho guarda tudo que foi digitado, e ao voltar o casal encontra o questionário como deixou.

**Resultado atual:** o rascunho guarda **pacote, modelo, cores, nomes e data**. Some, sem nenhum aviso: local da cerimônia, endereço da cerimônia, horário, local da festa, endereço da festa, traje e história. Além disso, o questionário volta para a **etapa 1 de 11**, não para a etapa onde o casal estava.

**Reproduzido de forma isolada, com digitação por teclado:**

1. Novo pedido → etapa 1 → Continuar
2. Etapa 2: digitar "Teste Salvar" e a data 20/08/2027 → Continuar
3. Etapa 3: digitar "Capela Santa Teresinha" no local da cerimônia
4. Clicar "Salvar e sair"
5. Reabrir o rascunho → nome ✅ e data ✅ preservados, **local da cerimônia vazio** ❌

**Causa, confirmada no código:** o formulário *envia* todos os campos (`OrderWizard.tsx:688-693` tem os hidden `ceremonyVenue`, `receptionVenue`, `dressCode`, `story`…), mas `saveOrderAction` passa o `FormData` por `parseOrderForm`, que só extrai os campos da tabela `orders` — e `orders` **não tem colunas** para cerimônia, festa, traje ou história. Esses campos só existem em `site_content`, que só nasce no provisionamento.

```
app/actions/account-actions.ts:190   saveOrderAction → parseOrderForm → updateOrder
lib/db/schema.ts                     orders: sem ceremony_*, reception_*, dress_code, story
```

**Impacto:** o casal que interrompe o preenchimento — e num questionário de 11 etapas isso é o caso comum, não a exceção — perde o trabalho mais chato de todos (endereços) e o mais pessoal de todos (a história). Pior: perde exatamente por ter feito a coisa certa, clicando no botão que promete salvar. O cabeçalho do questionário reforça a promessa: *"Dá para salvar e voltar quando quiserem"*.

**Severidade:** Crítico.

**Sugestão:** três caminhos, em ordem de esforço:
- **(a)** criar o `site` (status `provisioning`) já no primeiro salvamento, para haver um `site_content` onde gravar; ou
- **(b)** acrescentar uma coluna `draft_content jsonb` em `orders` e serializar ali o que não tem lugar (migração aditiva, sem risco); ou
- **(c)** mínimo imediato: se nada disso for feito agora, o botão precisa avisar antes — *"Só o pacote, o modelo e os nomes ficam salvos por enquanto. Os endereços e a história você vai precisar preencher de novo."* — e, de todo modo, retomar na etapa onde o casal parou.

---

### 🟠 ALTO

---

#### A1 — O pacote mais caro vem pré-selecionado

**Onde:** questionário, etapa 1 ("Qual pacote combina com vocês?").

**Ação:** cliquei "Continuar" sem escolher nada, para ver o que acontece.

**Esperado:** ou nenhum pacote pré-selecionado e o botão bloqueado até escolher (é o que a etapa 2 faz com os nomes), ou o pacote do meio como padrão.

**Atual:** **"Para Sempre", R$ 99,90**, já vem marcado. O botão "Continuar" está ativo e avança. Um rascunho criado assim ficou registrado na lista "Meus pedidos" como **PACOTE: Para Sempre**, sem eu jamais ter tocado no seletor.

A marcação visual é sutil (fundo cinza-claro e borda mais escura) e — verificado no DOM — os três cartões são `<button>` **sem `aria-pressed`, sem `aria-checked` e sem `role="radio"`**. Quem usa leitor de tela não tem como saber qual está selecionado. Vale notar que o próprio produto sabe fazer isso certo: os botões "Computador/Celular" da etapa 7 e as bolinhas de cor da etapa 8 têm `aria-pressed` correto.

**Impacto:** o casal pode chegar ao checkout com um pacote 10x mais caro do que pretendia. Mesmo sem intenção, o padrão tem a forma de um *dark pattern*, e contamina o dado: o selo "O MAIS ESCOLHIDO" no Para Sempre pode ser em parte um artefato desse padrão.

**Severidade:** Alto.

**Sugestão:** começar sem seleção e desabilitar "Continuar" até haver escolha (mesmo padrão da etapa 2). Acrescentar `role="radio"` + `aria-checked` nos três cartões, e uma marca visual inequívoca (✓ e a palavra "Escolhido").

---

#### A2 — As três cores não fazem o que os rótulos dizem; a terceira não faz nada

**Onde:** questionário, etapa 8 ("As cores de vocês").

**Ação:** escolhi as três cores e depois inspecionei o tema aplicado ao site gerado.

**Esperado:** o que os rótulos prometem —
"Cor principal — *a tinta, títulos e texto*", "Cor secundária — *o acento, detalhes, botões, ornamentos*", "Cor de fundo — *o papel do convite*".

**Atual**, confirmado em `lib/theme/spec.ts:120-125`:

```ts
if (overrides.primaryColor  …) palette.accent = overrides.primaryColor;   // vira o ACENTO
if (overrides.secondaryColor…) palette.ink    = overrides.secondaryColor; // vira o TEXTO
// tertiaryColor: não aparece em lugar nenhum desta função
```

| O rótulo diz | Onde a cor realmente vai |
|---|---|
| Cor principal = a tinta, títulos e texto | `palette.accent` — ornamentos |
| Cor secundária = o acento, detalhes | `palette.ink` — o texto |
| Cor de fundo = o papel do convite | **nenhum lugar** |

As duas primeiras estão **trocadas**. A terceira é validada, gravada em `orders.tertiary_color` e **nunca lida por nada que renderize** — busca em todo o repositório: aparece só no schema, na action que grava e no campo oculto do questionário.

Confirmei no site gerado: escolhi vinho (#7c4a55) como "cor principal"; no site, `--ink` ficou com a minha cor *secundária* (#9c8654) e `--paper` ficou com o creme original do modelo Toscana, ignorando minha escolha de fundo.

**Impacto:** o casal escolhe a cor do texto e recebe a cor dos enfeites, e vice-versa. E gasta tempo numa terceira decisão que não produz efeito nenhum. Como a personalização visual é um dos argumentos de venda ("Cores, fontes, fotos e a ordem das seções vocês ajustam no painel"), o produto entrega algo diferente do combinado logo no primeiro contato. Vale registrar que a aba **Visual** do painel, que expõe `paper/ink/accent/outer` diretamente, funciona corretamente — o defeito é específico do questionário.

**Severidade:** Alto.

**Sugestão:** trocar o destino de `primaryColor` e `secondaryColor` em `resolveTheme` (ou trocar os rótulos, se o comportamento atual é o desejado — é decisão de produto). Para a terceira: ou ligar `tertiaryColor` a `palette.paper`, ou remover o campo da etapa 8. Manter uma pergunta que não faz nada é pior que não perguntar.

---

#### A3 — Painel libera recursos que o pacote não inclui

**Onde:** abas **Presentes** e **Fotos** do painel.

**Ação:** com o pacote "Site do Casamento" (que, pela tabela de preços, **não** inclui lista de presentes nem álbum pós-festa), abri as duas abas.

**Esperado:** ou a aba não aparece, ou aparece bloqueada com um convite claro para subir de pacote.

**Atual:** ambas abrem normalmente e são totalmente funcionais. A aba **Presentes** oferece criar cotas, cadastrar chave Pix, nome e cidade do recebedor. A aba **Fotos** oferece o slot "Álbum da festa". O contrato de pacotes é inequívoco:

```ts
// lib/templates/contract.ts:94
site: ["cover","countdown","story","details","gallery","rsvp","footer"]
//  sem "gifts", sem "guestbook", sem "album"
```

E a guarda existe — só não foi aplicada nessas duas telas:

| Aba | Guarda `tierAllowsSection` |
|---|---|
| `recados` | ✅ tem |
| `convidados` | ✅ tem |
| `presentes` | ❌ **não tem** |
| `fotos` (álbum) | ❌ **não tem** |

**Impacto:** o casal monta a lista de presentes inteira, cadastra a chave Pix — e nada disso aparece no site, porque a seção `gifts` não está no contrato do pacote dele. Trabalho perdido e, quando ele perceber, uma conversa desagradável: "eu cadastrei, por que não aparece?". Há também um risco de dado sensível: ele digita uma chave Pix (que pode ser CPF ou telefone) para um recurso que não comprou.

**Severidade:** Alto.

**Sugestão:** aplicar `tierAllowsSection(order.packageTier, "gifts")` e `"album"` nas duas telas, com o mesmo padrão de redirecionamento já usado em `recados` e `convidados`. Melhor ainda: em vez de redirecionar, mostrar a aba com um cadeado e o preço da diferença — vira oportunidade de venda em vez de porta fechada.

---

#### A4 — A prévia de vendas do pacote "Site do Casamento" mostra o Mural de recados

**Onde:** `/pacotes/estilos/<modelo>?pacote=site`, a prévia usada no "Ver um exemplo" da tabela de preços e dentro do questionário.

**Ação:** comparei as três prévias de pacote, seção por seção.

| Prévia | RSVP | Mural | Presentes | Álbum |
|---|---|---|---|---|
| `?pacote=convite` | — | — | — | — |
| `?pacote=site` | ✅ | ⚠️ **aparece** | — | — |
| `?pacote=para-sempre` | ✅ | ✅ | ✅ | ✅ |

**Esperado:** a prévia do pacote mostra exatamente o que o pacote entrega.

**Atual:** a prévia do "Site do Casamento" renderiza a seção **Mural de recados**, que é exclusiva do Para Sempre tanto na tabela de preços quanto no contrato de código.

**Impacto:** o casal escolhe o pacote de R$ 29,90 tendo visto o mural na demonstração e não o recebe. É a pior categoria de erro de expectativa: descoberto depois do pagamento.

**Severidade:** Alto.

**Sugestão:** fazer a prévia derivar de `sectionsForTier(tier)`, a mesma função que o site real usa. Assim o exemplo nunca mais diverge do produto.

---

#### A5 — O cadastro promete um e-mail de confirmação que nunca é enviado

**Onde:** `/conta/criar`.

**Ação:** criei a conta e procurei o e-mail.

**Esperado:** ou o e-mail chega, ou a tela não promete e-mail.

**Atual:** a tela promete **duas vezes** — abaixo do botão, *"Vamos mandar um link no e-mail de vocês para confirmar a conta"*, e durante o carregamento, *"Estamos guardando os dados com segurança e preparando o e-mail de confirmação"*. Nenhum e-mail é enviado. Verificado: `email_verification_tokens` ficou com **0 linhas**, e o log do servidor não registra nenhuma tentativa de envio. Não há banner de "confirme seu e-mail" em lugar nenhum do painel.

Isso é coerente com o que o `AGENTS.md` §6 registra: a verificação de e-mail existe só na branch órfã `feedback-001` e nunca foi reconstruída na `main` — a tabela está no schema, o código não.

**Impacto:** o casal fica esperando um e-mail, procura no spam, e conclui que o cadastro falhou. Alguns vão criar a conta de novo. Como o e-mail nunca é verificado, também não há garantia de que o endereço cadastrado existe — e é por ele que passa a recuperação de senha e o aviso de que a prévia está pronta.

**Severidade:** Alto (é uma promessa quebrada no primeiro minuto de uso; a correção do texto custa cinco minutos).

**Sugestão:** enquanto a verificação não voltar, remover as duas frases. Trocar por algo verdadeiro: *"Pronto. Vocês já podem começar."*

---

#### A6 — Cancelar um pedido funciona, mas a tela não muda

**Onde:** `/conta/pedidos`, botão "Cancelar pedido".

**Ação:** cliquei em "Cancelar pedido" e confirmei no diálogo.

**Esperado:** o diálogo fecha e o pedido some da lista (ou aparece marcado como cancelado).

**Atual:** **nada acontece na tela.** O diálogo continua aberto, o pedido continua listado como RASCUNHO. No banco, porém, o `status` já é `cancelled`. Só depois de recarregar a página manualmente o pedido desaparece.

**Impacto:** o casal conclui que o cancelamento falhou e clica de novo — numa ação destrutiva e irreversível ("O pedido sai da lista de vocês e não volta"). Falta de `revalidatePath`/`router.refresh` depois da action.

**Severidade:** Alto.

**Sugestão:** revalidar a rota ao concluir a action e fechar o diálogo com uma confirmação curta ("Pedido cancelado ✓").

---

#### A7 — A data do casamento mora em dois lugares e as telas discordam entre si

**Onde:** `/conta/pedidos/<id>` (Início) e `/conta/pedidos` (lista).

**Ação:** salvei a data 15/05/2027 pela aba **Conteúdo** do painel e voltei ao Início.

**Esperado:** todas as telas mostram a mesma data.

**Atual:** **na mesma página**, dois blocos se contradizem:

- bloco "A DATA": *"**Ainda não escolhida.** Quando marcarem, a contagem começa sozinha."*
- bloco "ÁREAS EDITÁVEIS": *"Data do casamento — **15 de maio de 2027**"*

E na lista "Meus pedidos", a coluna **FALTAM** fica vazia para esse pedido, enquanto um rascunho de teste mostrava "345 DIAS".

**Causa:** a data existe em `orders.wedding_date` **e** em `site_content.wedding_date`. A aba Conteúdo grava só na segunda; os blocos "A DATA" e "FALTAM" leem a primeira. Verificado no banco: `orders.wedding_date = null`, `site_content.wedding_date = 2027-05-15`.

**Impacto:** o casal vê o produto dizendo que não sabe a data que ele acabou de salvar, e não tem como saber qual das duas telas está certa. Perde a confiança de que as edições dele estão sendo guardadas — que é a coisa mais cara de perder num produto onde ele edita sozinho.

**Severidade:** Alto.

**Sugestão:** eleger uma fonte da verdade para leitura (provavelmente `site_content`, que é o que o site renderiza) e fazer todas as telas do painel lerem de lá. Cuidado análogo ao do RSVP em §2 do `AGENTS.md`: não apagar a coluna antiga, só parar de lê-la.

---

#### A8 — A aba "Convidados" é um beco sem saída

**Onde:** `/conta/pedidos/<id>/convidados`.

Além do problema estrutural do C1, há um problema de navegação independente: o estado vazio não aponta para lugar nenhum. Nem para a aba Convites, nem para uma explicação, nem para um contato. O casal lê "quando vocês cadastrarem as famílias" e não tem nem uma pista de onde tentar.

**Severidade:** Alto (agrava o C1 e é bem mais barato de corrigir).

**Sugestão:** todo estado vazio precisa terminar num verbo. Mesmo que a criação continue no admin, o texto deve dizer o próximo passo real.

---

#### A9 — A tela de revisão esconde cinco dos campos preenchidos

**Onde:** questionário, etapa 11 ("Conferindo antes de mandar").

**Ação:** cheguei à última etapa depois de preencher tudo.

**Esperado:** uma conferência do que foi respondido — é o que o título promete.

**Atual:** a revisão mostra **pacote, nomes, data, ponto de partida, tipografia e cores**. Não mostra: local e endereço da cerimônia, horário, local e endereço da festa, traje, história, nem as observações de estilo. São justamente os campos onde erro de digitação é mais provável e mais caro (um endereço errado vira um convidado perdido).

**Impacto:** a última chance de conferir não confere. O casal só descobre o erro depois, no site.

**Severidade:** Alto.

**Sugestão:** listar todos os campos preenchidos, cada um com um link "editar" que leva direto à etapa correspondente.

---

### 🟡 MÉDIO

| # | Problema | Onde | Impacto | Sugestão |
|---|---|---|---|---|
| M1 | Os nomes do casal são pedidos **duas vezes** (no cadastro e na etapa 2), e na segunda o campo vem **vazio** | `/conta/criar` e etapa 2 | Retrabalho logo no começo; dá a impressão de que o sistema não guardou nada | Pré-preencher com o nome da conta, deixando editável |
| M2 | Nenhum aviso de contraste ao escolher cores | etapa 8 e aba Visual | Escolhi tinta e fundo na **mesma cor** e o produto aceitou sem piscar. O casal pode deixar o próprio site ilegível | Calcular o contraste e avisar ("Esse texto vai ficar difícil de ler sobre esse fundo") |
| M3 | A prévia da etapa 7 mostra **Ana & Pedro, Fortaleza** mesmo depois de eu ter digitado meus dados nas etapas 2 a 6 | etapa 7 | O momento mais emocionante do fluxo ("é o nosso site!") é entregue com os dados de outro casal. Os dados já estão em memória — dava para usar | Renderizar a prévia com o conteúdo já preenchido |
| M4 | Erro de login limpa **também o e-mail** | `/conta/entrar` | O casal redigita o e-mail inteiro a cada tentativa | Preservar o e-mail, limpar só a senha |
| M5 | O nome do convidado vai para a **query string** | `/s/<slug>/meu-convite?erro=1&nome=Carlos%20Almeida` | Nome de pessoa entra em log de servidor, histórico do navegador e cabeçalho `Referer`. Num produto que trata LGPD com cuidado (o `visitor_hash` das métricas), destoa | Passar o erro por POST/estado, sem o nome na URL |
| M6 | A etapa de cores **não tem prévia** | etapa 8 | A etapa 7 (modelo) tem prévia ao vivo; a 8, que muda a aparência tanto quanto, é às cegas | Manter a mesma prévia da etapa 7, reagindo às cores |
| M7 | O campo WhatsApp aceita `11` (dois dígitos) | `/conta/criar` | O campo é descrito como "é por onde a gente avisa se algo travar" — um número inválido aceito em silêncio derruba justamente o canal de socorro | Validar formato brasileiro, ou avisar sem bloquear |
| M8 | Limites inconsistentes nos campos de texto | etapas 6 e 10 | "A história" tem limite 5000 e contador visível; as duas observações da etapa 10 não têm **limite nenhum** (`maxLength: -1`) nem contador, embora a tela diga "aqui não tem limite" | Padronizar: limite e contador em todos, ou em nenhum |
| M9 | **25 campos de formulário sem `id` nem `name`** | todo o painel e o questionário | O DevTools registra o problema explicitamente. Quebra autopreenchimento do navegador e gerenciador de senhas — inclusive nos campos de e-mail e senha | Dar `id`/`name` e `autocomplete` apropriados |
| M10 | Erro de React ao escolher a mesma cor duas vezes | `components/account/wizard/OrderWizard.tsx:633` | *"Encountered two children with the same key, `#7c4a55`"*. Disparado por ação legítima (usar a mesma cor em dois papéis); as bolinhas de resumo podem sumir ou duplicar | Usar o índice no `key`, não o hex |
| M11 | O **endereço completo** ocupa, na capa, o lugar reservado à cidade | site do convidado | "PRAÇA NOSSA SENHORA DO BRASIL, 15 - JARDIM PAULISTA, SP" quebra em duas linhas e, em 390px, colide com o selo "PRÉVIA" e com o botão "CONFIRMAR PRESENÇA" | Usar um campo curto de cidade/UF na capa, ou truncar |
| M12 | A faixa de prévia é quase **ilegível** | `/preview/<token>` | "PRÉVIA · SÓ QUEM TEM ESTE LINK VÊ · O SITE AINDA NÃO ESTÁ NO AR" tem contraste baixíssimo; no celular quebra em duas linhas e encavala com "Abrir o painel". É o aviso mais importante da tela | Aumentar o contraste e encurtar o texto no celular |
| M13 | "Alterar senha" leva ao fluxo de **"esqueci a senha"** | `/conta` → `/conta/esqueci` | Quem está logado é mandado para recuperação por e-mail — e o e-mail nunca foi verificado (ver A5). Se o envio falhar, não há como trocar a senha | Trocar senha logado deve pedir a senha atual e a nova, sem e-mail |
| M14 | Limite de **5 convites** contra a promessa de um link por família | aba Convites vs. landing | A landing diz "cada família recebe um link exclusivo"; a aba diz "dá para ter até 5". Para um casamento de 30 famílias, os dois não cabem juntos | Decisão de produto (ver §11) — mas os dois textos precisam concordar |
| M15 | A festa não tem campo de **horário**; a cerimônia tem | etapas 3 e 4 | "A que horas começa a festa?" é pergunta corriqueira de convidado e não tem onde ser respondida | Acrescentar horário opcional à festa |

---

### 🟢 BAIXO

| # | Problema | Onde |
|---|---|---|
| B1 | Título da aba duplicado: **"Minha conta \| Enlace \| Enlace"** | todas as páginas do painel |
| B2 | A contagem regressiva diz **"falta pouco…"** faltando 247 dias | site do convidado |
| B3 | Três botões "Criar meu site" com **três destinos diferentes**: `/conta/criar` (topo), `/conta` (rodapé), `/conta/pedido/novo` (tabela de preços) | landing |
| B4 | As visitas do próprio casal à prévia entram na métrica ("VISITAS 3 nos últimos 30 dias" antes de qualquer convidado existir) | painel, Início |
| B5 | Rótulo duplicado **"PRÉVIA · PRÉVIA"** no iframe embutido do painel | painel, Início |

---

## 5. Tabela de severidade

| Severidade | Quantidade | Itens |
|---|---|---|
| 🔴 Crítico | **2** | C1, C2 |
| 🟠 Alto | **9** | A1–A9 |
| 🟡 Médio | **15** | M1–M15 |
| 🟢 Baixo | **5** | B1–B5 |
| **Total** | **31** | |

Distribuição por natureza:

| Natureza | Qtd |
|---|---|
| Perda ou inconsistência de dado | 5 (C2, A2, A7, M10, B4) |
| Recurso ausente ou inacessível | 3 (C1, A8, M13) |
| Pacote vs. o que a tela entrega | 3 (A3, A4, M14) |
| Texto que promete o que não acontece | 3 (A5, B2, M8) |
| Falta de feedback | 2 (A6, A9) |
| Acessibilidade | 3 (A1, M9, M12) |
| Visual / responsivo | 3 (M11, M12, B5) |
| Fricção de formulário | 6 (M1, M4, M6, M7, M15, B3) |
| Privacidade | 1 (M5) |

---

## 6. Problemas críticos — o que precisa de decisão

Os dois críticos não são bugs isolados; cada um levanta uma pergunta de produto:

**C1 (cadastro de famílias).** A pergunta não é "como fazer o formulário", é **de quem é esse trabalho**. Se a resposta for "do casal", é portar o `GroupForm`. Se for "da equipe", então a landing não pode dizer "três passos, nenhum telefonema" e a aba Convidados não pode dizer "quando vocês cadastrarem". Hoje o produto promete autonomia e entrega dependência — e a dependência recai sobre o dono, uma vez por venda, contra a promessa de que ele não encosta na operação. **Esta decisão é do dono** e vale consultar o agente `regras-de-negocio` antes de codar.

**C2 (rascunho que perde dado).** Aqui não há dilema de produto, só custo de implementação. Mas há uma escolha de prazo: a correção mínima (avisar o casal + retomar na etapa certa) sai hoje; a correção real (`draft_content jsonb`, migração aditiva) precisa do procedimento da Skill `banco` — `backup:full`, `db:generate`, `db:rehearse`, `db:migrate`, nunca `push`.

---

## 7. Problemas de usabilidade (síntese)

Quatro padrões se repetem:

1. **Estados vazios que não terminam em verbo.** Convidados é o caso extremo, mas Presentes e Compartilhar também descrevem uma situação em vez de oferecer o próximo passo. Quando funcionam (Convites, com "Criar convite"), a tela fica boa.

2. **Rótulos que descrevem a intenção, não o efeito.** "Salvar e sair" não sai e não salva tudo. "Cor principal — a tinta" vira o acento. "Cor de fundo" não muda fundo nenhum. O casal calibra a confiança pelo que os rótulos dizem; quando eles mentem, ele para de acreditar até no que funciona.

3. **A mesma informação em dois lugares, discordando.** A data é o caso visível (A7), mas é o mesmo padrão que o `AGENTS.md` §2 já documenta para o RSVP (`guests.rsvp_status` vs `groups.seats_confirmed`). É uma dívida estrutural que já vazou para a interface.

4. **Ações sem confirmação visível.** Cancelar pedido é o pior caso (A6), mas a criação de convite também leva segundos sem indicador. O produto acerta muito nisso em outros pontos ("Salvando…", "Tudo salvo", "salvo agora") — o que torna as ausências mais notáveis.

---

## 8. Problemas funcionais encontrados durante o teste

Além dos de usabilidade, estes são defeitos de funcionamento comprovados:

| # | Defeito | Evidência |
|---|---|---|
| 1 | `saveOrderAction` descarta 7 campos do formulário | `app/actions/account-actions.ts:190`; reproduzido por teclado |
| 2 | `primaryColor` → `accent` e `secondaryColor` → `ink` (invertidos face aos rótulos) | `lib/theme/spec.ts:120-125` |
| 3 | `tertiaryColor` é gravado e nunca lido | busca em todo o repositório |
| 4 | `presentes` e `fotos` sem `tierAllowsSection` | comparação com `recados`/`convidados` |
| 5 | Prévia `?pacote=site` renderiza `guestbook` | comparação das três prévias |
| 6 | Cancelamento não revalida a rota | banco `cancelled`, tela inalterada |
| 7 | Data divergente entre `orders` e `site_content` | consulta ao banco |
| 8 | Chave React duplicada com cores iguais | `OrderWizard.tsx:633` |
| 9 | 25 campos sem `id`/`name` | DevTools Issues |

### O que **não** é defeito (verificado e descartado)

Registro aqui para não gerar tarefa à toa — três coisas que pareciam bug e não são:

- **A data sumindo no questionário.** Pareceu perda de dado, mas era artefato da minha ferramenta de automação: preencher `<input type="date">` por script altera o DOM sem disparar o `onChange` do React. Digitando pelo teclado, o estado recebe a data corretamente. **O campo funciona.**
- **O quadradinho de cor mostrando `#b8985f` para "Vinho".** É o seletor de *cor livre*, escondido atrás do círculo arco-íris; `#b8985f` é só o valor de descanso dele quando há um preset ativo. O rótulo visível está certo.
- **Galeria com quadros cinza.** É *lazy loading*: as imagens carregam normalmente quando entram na tela.

---

## 9. Pontos positivos

Vale registrar com o mesmo cuidado, porque são diferenciais reais:

- **A escolha de tipografia (etapa 9) é o melhor momento do produto.** As 34 fontes são renderizadas com o **primeiro nome real do casal** ("Mariana"), agrupadas por família. Não é "escolha uma fonte de uma lista": é ver o próprio nome escrito de 34 jeitos. Poucos produtos fazem isso.
- **A aba Conteúdo com prévia ao vivo ao lado.** Editar e ver o resultado na mesma tela resolve a maior ansiedade de quem monta o próprio site.
- **O diálogo de cancelamento é honesto.** *"O pedido sai da lista de vocês e não volta. Se o site já esteve no ar, ele continua no ar — cancelar o pedido não apaga o site."* Explica a consequência exata, inclusive a contraintuitiva.
- **Os selos "FALTA" nas abas** dizem ao casal onde ele ainda tem trabalho, e somem sozinhos quando ele preenche.
- **"O QUE MUDA AO PUBLICAR"** lista as quatro consequências antes do botão. É o oposto de um botão de publicar comum.
- **A mensagem de erro do "não recebi meu link"** — *"Não encontramos esse nome na lista. Tente com o nome completo, do jeito que os noivos devem ter escrito — ou peça o link para eles"* — diz o que houve e o que fazer, sem jargão.
- **Os parágrafos da história sobrevivem** do formulário até o site renderizado.
- **Os estados de carregamento têm texto humano**: "Criando a conta de vocês", "Buscando as informações de vocês", "Tudo salvo".
- **O editor de convite** é um canvas completo — camadas, formas, desfazer/refazer, autossalvamento, seis modelos, exportação. Muito acima do esperado para o preço.
- **Nenhum erro de JavaScript** em toda a sessão. O único registro no console foi o aviso de chave duplicada do M10.
- **O atalho "É no mesmo lugar da cerimônia"** na etapa 4 e os chips de traje na etapa 5 poupam digitação real.

---

## 10. Sugestões de melhoria

Além das correções item a item, três mudanças estruturais:

**1. Um lugar só para o dado.** A data em dois lugares (A7) e o RSVP em dois lugares (documentado no `AGENTS.md`) são o mesmo problema em estágios diferentes. Vale eleger a fonte de leitura por domínio e deixar isso escrito, antes que uma terceira duplicação apareça.

**2. O contrato de pacote deveria ser inescapável.** Existe `TIER_SECTIONS` e existe `tierAllowsSection` — mas quatro superfícies diferentes decidem sozinhas o que mostrar (painel, prévia de vendas, site do convidado, aba de fotos), e duas erram. Se todas derivassem de `sectionsForTier(tier)`, A3 e A4 não poderiam acontecer.

**3. Um teste E2E do caminho feliz.** C2 e A1 seriam pegos por um único teste que preenche o questionário, clica em "Salvar e sair", reabre e compara. É o tipo de defeito que teste unitário não vê, porque cada peça funciona isolada.

---

## 11. Prioridade de correção

**Agora (antes da próxima venda)**

| Ordem | Item | Por quê | Esforço |
|---|---|---|---|
| 1 | **A5** — tirar a promessa do e-mail de confirmação | Texto. Cinco minutos. Para de mentir no primeiro minuto de uso | trivial |
| 2 | **A1** — não pré-selecionar o pacote de R$ 99,90 | Risco de o casal comprar o que não queria | baixo |
| 3 | **C2 (mitigação)** — avisar o que o rascunho não guarda + retomar na etapa certa | Impede perda de trabalho enquanto a correção real não sai | baixo |
| 4 | **A6** — revalidar a rota ao cancelar | Ação destrutiva sem retorno visual convida ao clique duplo | baixo |
| 5 | **A2** — corrigir o mapeamento das cores | O casal recebe cores diferentes das que escolheu | baixo |

**Nesta semana**

| Ordem | Item | Esforço |
|---|---|---|
| 6 | **A3** — aplicar a guarda de pacote em Presentes e Fotos | baixo |
| 7 | **A4** — prévia de vendas derivar de `sectionsForTier` | médio |
| 8 | **A7** — uma fonte da verdade para a data | médio |
| 9 | **A9** — revisão mostrar todos os campos | médio |
| 10 | **A8** — estado vazio de Convidados apontar para algum lugar | trivial |
| 11 | **M10, M9, M12, M4, M1** — correções pontuais | baixo cada |

**Precisa de decisão do dono antes de codar**

| Item | Pergunta |
|---|---|
| **C1** | O cadastro de famílias é trabalho do casal ou da equipe? Define se portamos o `GroupForm` ou se reescrevemos as promessas da landing |
| **M14** | 5 convites por site é o limite pretendido? Se sim, "cada família recebe um link exclusivo" precisa mudar |
| **A2** | Os rótulos das cores estão errados, ou o mapeamento está? |

**Depois**

**C2 (correção real)** com `draft_content jsonb` — migração aditiva, seguindo a Skill `banco`. Junto, o teste E2E do caminho feliz.

---

## 12. Avaliação final de UX

| Critério | Nota | Comentário |
|---|---|---|
| Facilidade de cadastro | **8,0** | Curto, campos certos, login automático. Perde pela promessa falsa do e-mail |
| Facilidade de criar o casamento | **6,5** | O questionário é bem desenhado e bem escrito, mas perde dado e pré-seleciona o caro |
| Clareza da navegação | **7,0** | As 9 abas do painel são legíveis; Convidados e Convites se confundem |
| Clareza dos textos | **8,5** | O ponto mais forte. Português real, sem jargão, com senso de humor contido |
| Organização das informações | **7,5** | Boa hierarquia; a mesma informação em dois lugares atrapalha |
| Feedback das ações | **6,5** | Excelente quando existe ("Tudo salvo"), ausente onde mais importa (cancelar) |
| Prevenção de erros | **4,5** | Sem aviso de contraste, sem aviso de perda de rascunho, sem confirmação do pacote |
| Recuperação de erros | **6,0** | Mensagens boas; login limpa o e-mail; sem desfazer para o rascunho perdido |
| Consistência | **6,0** | `aria-pressed` em alguns seletores e não em outros; guarda de pacote em 2 de 4 abas |
| Quantidade de etapas | **8,0** | 11 etapas parecem muitas, mas quase todas são puláveis e a barra dá o tamanho |
| Sensação geral de qualidade | **8,0** | Parece caro. As fontes com o nome do casal e a prévia ao vivo sustentam isso |

### Nota geral: **6,0 / 10**

A nota é uma média puxada para baixo de propósito. Se eu avaliasse só o que se vê — escrita, tipografia, layout, microcópia — daria **8,5**: é um produto com autoria, feito por alguém que pensou em cada frase. Se eu avaliasse só o fluxo completo, de criar a conta até ter um casamento pronto para receber convidados, daria **4,0**: o casal não consegue terminar sozinho, porque não há como cadastrar as famílias, e corre risco real de perder o que digitou.

O que segura a nota em 6 é que **nenhum dos dois críticos é um problema de concepção**. C1 é uma tela que existe no admin e precisa ser portada. C2 é uma coluna que falta numa tabela. A parte difícil — decidir o que o produto é, achar o tom, desenhar seis moldes que funcionam — já está feita, e feita bem. O que falta é fechar o circuito.

Um casal real chegando hoje: cria a conta em dois minutos, se encanta na tela das fontes, monta um site bonito em quinze minutos — e trava quando vai convidar as pessoas. É frustrante justamente porque falta tão pouco.

---

## 13. Checklist do fluxo completo

**Entrada**
- [x] Landing carrega e explica o produto
- [x] Preços visíveis sem contato prévio
- [x] Criar conta
- [x] Login automático após o cadastro
- [x] Login manual depois de sair
- [x] Erro de senha errada tratado
- [ ] ~~E-mail de confirmação~~ — **prometido, não existe (A5)**
- [x] Sair da conta

**Criação do casamento**
- [x] Escolher pacote — ⚠️ vem pré-selecionado no mais caro (A1)
- [x] Nomes do casal
- [x] Data do casamento
- [x] Local, endereço e horário da cerimônia
- [x] Local e endereço da festa
- [ ] Horário da festa — **campo não existe (M15)**
- [x] Traje
- [x] História
- [x] Escolher modelo, com prévia
- [x] Escolher cores — ⚠️ não fazem o que os rótulos dizem (A2)
- [x] Escolher tipografia
- [x] Observações livres
- [x] Revisar — ⚠️ revisão incompleta (A9)
- [x] Criar o site

**Persistência**
- [x] Recarregar a página mantém o estado
- [x] Sair e voltar mantém o pedido
- [x] Editar conteúdo depois de criado
- [ ] ~~Salvar rascunho e continuar depois~~ — **perde 7 campos (C2)**
- [x] Cancelar pedido — ⚠️ sem retorno na tela (A6)

**Configuração do casamento**
- [x] Editar todo o conteúdo pelo painel
- [x] Ajustar cores e tipografia pelo painel
- [x] Criar a arte do convite
- [ ] ~~Cadastrar famílias/convidados~~ — **impossível pelo painel (C1)**
- [ ] ~~Gerar links de confirmação~~ — **depende do item acima**
- [x] Ver quem respondeu (tela existe, sem dado a mostrar)
- [x] Montar lista de presentes — ⚠️ liberada fora do pacote (A3)
- [ ] Subir fotos — não testado (exige arquivo local)
- [x] Ver a prévia do site
- [ ] Publicar — **não executado por decisão de escopo (cobrança real)**

**Resultado final**
- [x] O site existe e responde
- [x] Nomes, data, cerimônia, festa e traje aparecem corretos
- [x] A história aparece com os parágrafos preservados
- [x] A contagem regressiva funciona
- [x] As alterações persistem
- [x] Funciona em 390px — ⚠️ sobreposições na capa (M11)
- [x] Sem tela em branco, sem loading infinito, sem link quebrado
- [x] Sem erro de JavaScript
- [ ] Pronto para entregar ao convidado — **não: sem RSVP configurável (C1)**

---

## Anexo — como reproduzir este ambiente

```bash
# 1. schema isolado (não toca o public)
node scratchpad/build-e2e-schema.cjs

# 2. servidor apontado para ele
DATABASE_SCHEMA=e2e NEXT_PUBLIC_SITE_URL=http://localhost:3100 npx next dev -p 3100
```

O schema `e2e` continua na instância, com os dados desta auditoria (1 conta, 1 pedido `preview_ready`, 1 pedido `cancelled`, 1 site `mariana-e-rafael`, 1 convite). Para remover: `drop schema e2e cascade`.

**Contas e dados usados:** `mariana.rafael.e2e@example.com` / senha `casamento2027`. O domínio `example.com` é reservado por RFC — nenhum e-mail poderia chegar a uma pessoa real.

---

# 14. Correções aplicadas (10/09/2026)

Todos os problemas desta auditoria foram tratados. Abaixo, o que mudou em cada
um — e, no fim, os três que **não** foram corrigidos, com o motivo.

Antes de mexer em pacote, preço ou texto que o casal lê, o agente
`regras-de-negocio` foi consultado, como manda o `AGENTS.md` §5. Os vereditos
dele mudaram duas decisões deste trabalho e estão anotados onde couberam.

## Críticos

**C1 · O casal não conseguia cadastrar as famílias.** Portado para o painel.

- `app/actions/site-actions.ts` — `criarFamiliaAction` e `apagarFamiliaAction`,
  escopadas por `siteId` e com a mesma guarda de pacote da aba
  (`tierAllowsSection(tier, "rsvp")`).
- `components/account/manage/FormularioDeFamilia.tsx` — nome da família
  obrigatório, nomes das pessoas opcionais (§2.3: só o essencial).
- A aba Convidados passa a ter o formulário, e o estado vazio termina num
  verbo.

Não encosta em `guests.rsvp_status` — a resposta continua vindo de
`groups.seats_confirmed`, como o resto do painel (AGENTS.md §2).

O formulário pede **nome da família** (obrigatório) e **quantos lugares**; os
nomes de cada pessoa são opcionais. O número de lugares existe porque "Família
Silva, 4 lugares" é o que o casal sabe primeiro — sem ele, uma família sem
nomes nascia com um lugar só. Com nomes escritos, os lugares saem da lista, e
o número digitado é ignorado.

**Verificado de ponta a ponta:** casal cadastra "Família Nogueira" com dois
nomes → `/rsvp/hxQkpfnL` abre → convidado confirma → `seats_confirmed = 2`,
nomes e recado gravados.

**Coberto por teste:** `app/actions/familia-actions.test.ts` — sete casos, entre
eles a guarda de pacote, o site de outro casal, os lugares sem nomes e o
`seats_confirmed` nascendo `null` (que é "não respondeu", diferente de `0`,
que é "não vão").

**C2 · "Salvar e sair" descartava sete campos.** Corrigido na raiz.

- Migração **0024** (aditiva, uma linha): `orders.draft_content jsonb`.
- `saveOrderAction` passa a guardar cerimônia, festa, traje, história e a
  ETAPA onde o casal parou; o questionário reidrata tudo ao reabrir.
- `scripts/setup-test-schema.mjs` sincronizado.

**Verificado:** digitar "Capela Santa Teresinha" na etapa 3 → "Salvar e sair" →
reabrir. O campo volta preenchido, e o questionário reabre **na etapa 3**, não
na 1.

> ⚠️ **A migração 0024 NÃO foi aplicada em produção.** Ela roda no schema
> isolado `e2e` e no schema `test`. Aplicar no `public` é decisão sua e segue a
> Skill `banco`: `npm run backup:full` → `db:rehearse` → `db:migrate`. Nunca
> `push`.

## Altos

| # | O que mudou |
|---|---|
| **A1** | Etapa 1 sem pacote pré-selecionado; `role="radio"` + `aria-checked` + marca "✓ escolhido"; "Continuar" bloqueado até haver escolha |
| **A2** | Rótulos passam a descrever o que `resolveTheme` faz (a cor 1 é o acento, a 2 é a tinta) — mudar o mapeamento repintaria todo site já no ar. E `tertiaryColor`, que era gravada e nunca lida, agora vira `palette.paper` |
| **A3** | `presentes` ganha a guarda de pacote (redirect, como `recados`) **e a aba some do menu** — sem isso sobrava um link que rebate. Em `fotos`, só o slot do álbum sai: fechar a aba tiraria do Convite a foto que ele comprou (veredito do `regras-de-negocio`) |
| **A4** | As seis prévias de vendas derivam de `tierAllowsSection`, não de comparação de tier escrita à mão. **Verificado:** `?pacote=site` não mostra mais o Mural |
| **A5** | As duas promessas de e-mail de confirmação saíram de `/conta/criar` |
| **A6** | `DialogoDestrutivo` fecha no submit — a ação já funcionava, o diálogo é que ficava aberto sobre a lista velha |
| **A7** | A data passa a ser lida de `site_content` quando o site existe, no Início e na lista. Fim do "Ainda não escolhida" ao lado de "15 de maio de 2027" |
| **A8** | Estado vazio da aba Convidados leva ao formulário |
| **A9** | A revisão mostra os 14 campos preenchidos, não 6 |

## Médios e baixos

| # | O que mudou |
|---|---|
| M1 | Etapa 2 nasce com o nome da conta preenchido |
| M2 | `AvisoDeContraste` calcula a razão WCAG e avisa (não bloqueia — contraste baixo às vezes é escolha) |
| M3 | A prévia da etapa 7 diz que o casal mostrado é fictício, em vez de falar só do futuro |
| M4 | Erro de login preserva o e-mail; limpa só a senha |
| M5 | O nome do convidado sai da query string — volta pelo estado do formulário (`BuscaDeConvite`) |
| M6 | A etapa das cores ganha `AmostraDeCores`: papel, tinta e acento aplicados num convite de amostra |
| M7 | WhatsApp com `pattern` de 10 a 20 caracteres — barra o "11", aceita com e sem máscara |
| M8 | Os dois campos da etapa 10 ganham limite (2000) e contador, como a história |
| M9 | Os 11 campos visíveis do questionário ganham `id`; os dois de endereço, `autoComplete="street-address"` |
| M10 | Chave do React nas bolinhas de cor passa a ser a posição, não o hex |
| M11 | A capa mostra cidade/estado (`linhaDeLugar`), não o endereço inteiro. E o selo "PRÉVIA" desce para o rodapé no celular, onde cobria o botão de confirmar presença |
| M12 | A tarja de prévia volta a ser branca sobre tinta. **A causa era mais funda:** `.ui-prensa` declara `background-color` e `color` fora de `@layer`, e no Tailwind v4 regra sem camada vence utilitário — com `uiPrensa` e `bg-(--c-ink)` no mesmo elemento, o aviso mais importante da tela saía claro sobre claro |
| M13 | Trocar senha logado agora pede senha atual + nova, sem passar por e-mail (`trocarSenhaAction` + `TrocarSenha`) |
| M14 | "até 5 modelos diferentes… o número de famílias convidadas não tem limite" — o teto é de arte, nunca de família (veredito do `regras-de-negocio`) |
| B1 | 16 rotas deixam de repetir o sufixo: fim do "Minha conta \| Enlace \| Enlace" |
| B2 | "falta pouco" era fixo e aparecia com 247 dias pela frente. Virou frase verdadeira em qualquer distância — a versão condicional **quebrou o build** (`new Date()` em Server Component prerenderizado é proibido com `cacheComponents`) e foi abandonada |
| B3 | Os três CTAs convergem, e o pacote escolhido na vitrine viaja até a etapa 1 — inclusive atravessando o cadastro de quem ainda não tem conta |
| B4 | A prévia do casal não conta mais como visita |

## O que NÃO foi corrigido, e por quê

**M15 · A festa não tem horário.** Não é defeito: o campo nunca existiu. Criá-lo
exige coluna nova, tratamento de fuso no `parseContentForm`, campo no editor,
campo no questionário e renderização nos **seis** moldes. É uma feature, e
mexe no que o convidado lê — decisão de produto, com o agente
`regras-de-negocio` no caminho. Meia implementação seria pior: um campo que
salva e nunca aparece é exatamente o defeito que a `tertiaryColor` era.

**B5 · "PRÉVIA · PRÉVIA".** Falso positivo meu. É marca d'água diagonal
proposital, com a repetição fazendo parte do desenho — o comentário do
`LivePreview` já dizia isso. Nada a corrigir.

**A prévia da etapa 7 com o conteúdo do casal.** Mitigado por texto (M3), não
resolvido: a prévia renderiza os moldes de demonstração, com cores e conteúdo
chumbados. Mostrar o conteúdo real antes de o site existir pede renderizar um
site não provisionado — feature de porte, não ajuste.

## Estado da verificação

| Checagem | Resultado |
|---|---|
| `npx tsc --noEmit` | limpo |
| `npx eslint app components lib` | limpo |
| `npm run build` | **passa** — 103 páginas geradas |
| `npm run test` | 765 testes passando (rodado após a 0024 entrar no schema `test`) |
| `npm run verify:template` | **não rodado** — o script espera o servidor na porta 3000 |

Nada foi commitado.

---

# 15. As pendências que sobraram (10/09/2026)

Depois do merge do PR #4, sobravam três itens da §14. Dois estão fechados aqui;
o terceiro fica fechado como "não é defeito", com o motivo.

## M15 · A festa agora tem horário

Era o único item que exigia trabalho de verdade. O agente `regras-de-negocio`
deu **PODE, COM AJUSTE**, e três das travas dele mudaram a implementação:

1. **Não vira tarefa em `oQueFalta`.** Uma tarefa nova rebaixaria o progresso
   de **todo site já pronto** de 4/4 para 4/5 da noite para o dia — o casal que
   terminou veria o próprio site desandar.
2. **Hora de parede, sem fuso.** `timestamptz` aqui seria o *segundo caminho
   para a data* que o `AGENTS.md` alerta: exigiria um dia que a festa não tem,
   conversão de ida e volta a cada salvamento, e quebraria na festa que
   atravessa a meia-noite. A coluna é `time`; `null` é "não informado" de
   verdade — a convenção de meia-noite do `wedding_date` **não** vale aqui,
   porque lá o dia e a hora dividem o mesmo campo.
3. **Não mexer no `.ics`.** O evento na agenda do convidado é a cerimônia;
   trocar por horário de festa mudaria o que já está no celular de gente real.

Também por veredito: entra nos **três pacotes** sem tocar em `TIER_SECTIONS` —
a seção `details` já está no Convite, e a vitrine dele promete "Data, horário e
local com mapa". Gatear seria cobrar do menor por algo que a própria página
dele anuncia.

**Migração 0025**, aditiva, uma linha: `site_content.reception_time time`.

O campo entra na etapa 4 do questionário, que passa a se chamar *"E a festa,
onde e a que horas?"*, e na aba Conteúdo. Nos seis moldes ele aparece no mesmo
formato da cerimônia (`Recepção · 19:30`), na mesma régua — "18:00" ao lado de
"18H" pareceria erro. Sem hora informada, some: nada de 18h de exemplo.

**Verificado:** salvei 19:30 pela aba Conteúdo → banco gravou `19:30:00` → o
site renderiza `Recepção · 19:30`, e a data da cerimônia não se moveu. Cinco
testes novos, entre eles um que salva e relê cinco vezes seguidas para provar
que a hora não drifta.

## `verify:template` · agora roda

Estava listado como "não rodado — o script exige a porta 3000". A causa era
pior do que parecia: além da porta fixa, o script **insere sites direto no
banco apontado por `DATABASE_URL`** — que neste repositório é produção — sem
isolamento de schema. Limpa no `finally`, mas uma queda no meio deixaria um
site descartável no `public`.

Agora ele respeita `DATABASE_SCHEMA` e aceita `VERIFY_BASE_URL`. Rodado nos
seis moldes contra o schema isolado: **todos 200, todos com "paleta só no
wrapper"** — prova de que as seções continuam sem hex escrito à mão, inclusive
depois das mudanças do horário da festa.

## A prévia da etapa 7 · fechada como "não é defeito"

Mitigada por texto na §14, e fica assim. A investigação mostrou por quê: os
nomes do casal de demonstração **não vêm de constante** — são literais no JSX
de cada molde, junto com uma história fictícia ("um churrasco em 2019, um gato
adotado"), recados de convidados inventados e a hashtag `#AnaEPedro`.

Trocar só os nomes deixaria o casal vendo o **próprio nome numa história que
não é dele**. Isso é pior que um exemplo assumidamente fictício. Um exemplo de
verdade com o conteúdo do casal exige renderizar um site não provisionado —
feature de porte, não ajuste.

---

## Achado novo, fora da auditoria: os scripts ignoravam `DATABASE_SCHEMA`

Descoberto na prática, e da pior forma: rodei `DATABASE_SCHEMA=e2e npm run
backfill:legacy` e ele foi **direto para produção**. Sem estrago — o script é
idempotente e não tinha o que mudar; produção conferida antes e depois: 15
sites, 23 grupos, 31 convidados, conteúdo mais recente de 03/09 — mas a próxima
vez podia ter.

Doze scripts criavam o próprio cliente de banco e **nenhum** olhava
`DATABASE_SCHEMA`. O aplicativo olha (`lib/db/client.ts`), os testes olham
(`vitest.config.ts`); só os scripts não olhavam. Como o `DATABASE_URL` deste
repositório aponta para produção, `seed:demo`, `seed:gifts`, `fix:slug` e os
backfills escreviam no `public` mesmo para quem tinha acabado de pedir outro
schema.

`scripts/_cliente.mjs` centraliza a criação do cliente, respeita
`DATABASE_SCHEMA` e **anuncia o schema antes do primeiro comando** — escrever
no `public` continua permitido, mas deixa de ser silencioso. Os sete scripts
que escrevem foram convertidos. Os de backup são leitura pura e ficaram como
estavam.

---

# 16. O que a auditoria original não alcançou: publicar e o pós-festa

A auditoria de 09/09 parou na porta do checkout — a chave da AbacatePay parecia
de produção e disparar cobrança em serviço externo não era decisão minha. Em
10/09 o dono apontou que existe modo de teste, e o trecho foi percorrido.

Ele é o trecho mais caro do produto, e estava com um defeito crítico.

## O fluxo de publicação funciona

A chave é `abc_dev_…`; a tela do gateway diz **"Sandbox Mode"** e traz um botão
"Simular Pagamento". Nenhum dinheiro real se move.

Percorrido inteiro: pedido Para Sempre → "Publicar site" → CPF do pagador
(sintético) → cobrança criada → pagamento simulado → volta para o painel com
`?publicado=1`. Resultado: pedido `published`, `payment_status: PAID`, `paid_at`
preenchido, site `published` e no ar em `/s/bia-e-tomas`, sem marca d'água.

## 🔴 O convidado presenteava e ninguém ficava sabendo

**Onde:** `registerContributionAction` (`app/actions/gift-actions.ts`), o botão
"Já fiz o Pix" no site de qualquer casal.

**O que acontecia:** a action resolvia o casamento com `getLegacySiteId()` — o
site legado — em vez do site dono do presente. Ela mora num arquivo de actions
do ADMIN, onde todas as vizinhas são do casamento legado e por isso fazem isso
certo; só que esta roda no site de QUALQUER casal. `getGiftById` era chamado
com o id errado, não achava o presente e lançava `Gift not found`.

Resquício de antes da multi-tenancy — **o mesmo defeito do `createGroupAction`
do C1**, na mesma linha de código, sobrevivendo num segundo lugar.

**O que o convidado via:** mandava o Pix, clicava em "Já fiz o Pix", e nada
acontecia. Sem confirmação e sem erro — o modal engolia a exceção num
`try/finally` sem `catch`. O caminho natural dali é mandar o Pix de novo.

**O que o casal perdia:** quem deu o presente. E a cota seguia aparecendo como
disponível para o convidado seguinte.

**Correção:** a action passou a receber o `siteId` — que já viajava do
`GiftGrid` até o modal e simplesmente não era usado — e o modal ganhou
tratamento de erro que diz o que ainda vale ("seu Pix já foi enviado") em vez
de sumir. Coberto por teste de regressão: presente de um site não pode ser
registrado pelo id de outro.

## 🟠 O nome de quem presenteou só chegava ao `/admin`

O convidado é convidado a se identificar — *"conte pra gente quem você é"* — e
o nome era gravado. Mas a única leitura era `listContributionsParaAdmin`: o
casal via um número ("1 cota escolhida") e mais nada.

Mesma forma do C1 outra vez: o recurso existia, só não para quem comprou. Sem
ele, agradecer é impossível.

Acrescentado "Quem já presenteou" na aba Presentes do casal, com o rótulo
honesto para quem preferiu não se identificar e o aviso de que a Enlace nunca
vê se o Pix caiu — confiram o extrato antes de agradecer (§2.4).

## O resto do pós-publicação está de pé

| O que | Resultado |
|---|---|
| Lista de presentes sem chave Pix | degrada honesto: "os noivos ainda não cadastraram a chave". Nenhum QR falso (§3) |
| Com chave | BR Code correto, campo 54 com o valor da cota, chave do casal |
| Mural de recados | recado publicado na hora, com confirmação |
| Cadastro de família com lugares e sem nomes | 4 lugares → convidado confirmou 3 |
| Agenda `.ics` | evento válido; dia cheio quando não há hora de cerimônia |
| Compartilhar | link, QR, mensagens prontas e o link só da lista |

## O padrão que estes dois casos revelam

Três defeitos desta auditoria têm a mesma origem: **`getLegacySiteId()` em
código que serve todos os casais** — o cadastro de famílias (C1), a
contribuição de presente (§16) e, de forma mais branda, o vazamento de recursos
entre pacotes. Vale uma varredura própria: hoje restam oito usos de
`getLegacySiteId` em `app/actions/gift-actions.ts`, e todos os outros são de
telas do `/admin`, onde estão certos. Se alguma action pública for acrescentada
ali, ela herda o defeito por vizinhança.
