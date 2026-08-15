# Plano de melhoria a partir da concorrência

Aberto em 28/07/2026. Este documento é o **item 7** do fluxo combinado, e o
lugar onde os itens 1, 6 e 2 aterrissam antes de virar código.

---

## O fluxo, na ordem

| # | Passo | De quem | Estado |
|---|---|---|---|
| 1 | Análise humana dos concorrentes (features, UX, funcionalidade) | **Anderson** | ⬜ |
| 6 | Mandar os links e referências no WhatsApp | **Anderson** | ⬜ |
| 7 | Plano estruturado a partir dos achados | Claude, com 1 e 6 | ⬜ bloqueado |
| 2 | Escrever os requisitos ANTES de pedir implementação | os dois | ⬜ |
| 3 | Refatoração visual e de usabilidade, usando o concorrente como referência | Claude | 🟡 movimento e carregamento entregues (01/08); o resto espera 1 e 6 |
| 4 | Revisar e melhorar a landing | Claude | ⬜ |
| 5 | Consertar a lista de presentes | Claude | ✅ **entregue 01/08/2026** |

### Item 3 — a fatia que não dependia da análise

Movimento e telas de carregamento são ortogonais ao que os concorrentes fazem,
então andaram antes dos links chegarem. O que **continua bloqueado** é a
decisão de rumo (rolagem única × as 13 páginas separadas do iCasei) — essa é
estrutural e passa pelo Nycolas, que escreveu os moldes.

Estado da base antes, medido: **0** arquivos `loading.tsx` em 28 páginas,
**0** ocorrências de `prefers-reduced-motion`, **1** declaração de `transition`
(o `.btn`), 2 `<div animate-pulse>`. Nada nascia — cada tela aparecia pronta ou
congelava. É essa a assinatura de interface gerada, não a paleta.

Referências escolhidas pelo Anderson: [reactbits.dev](https://reactbits.dev),
[21st.dev](https://21st.dev), [uiverse.io](https://uiverse.io). O uiverse é
MIT e CSS puro; o reactbits é copy-paste, mas as animações de texto dele vêm
com framer-motion/GSAP. **Decisão: a técnica sim, a dependência não** — o
efeito "BlurText" do reactbits está em `components/site/SplitReveal.tsx` +
`.motion-word`, em CSS puro. Ele roda na capa do site do convidado, que é
primeira dobra no celular com meta de LCP de 2,5 s: 30 KB de JS ali não se
pagam.

**A análise (1) é humana de propósito** — está escrito "not AI/automated". Eu
consigo renderizar e medir a estrutura de um site concorrente, mas não consigo
julgar se a experiência é boa, o que incomoda no meio do caminho, nem o que
faz um casal desistir. Isso vem de alguém usando.

---

## Item 2 — a regra que existe por causa de hoje

> Escrever os requisitos com clareza antes de pedir implementação, para evitar
> retrabalho.

Esta regra nasceu de dois retrabalhos reais na sessão de 28/07:

- **Entendi "widescreen" como o site do convidado**, e cheguei a propor
  reescrever os 6 moldes — 5 a 8 dias na coisa errada. O pedido era sobre o
  painel do casal. Ver
  [proximo-passo-painel-de-montagem.md](proximo-passo-painel-de-montagem.md).
- **Coloquei a prévia só na tela de acompanhamento**, quando o pedido dizia
  "na hora de criar o pedido" também. Refeito no commit seguinte.

Os dois teriam sido evitados por um parágrafo escrito antes.

**Como aplicar:** antes de cada item de 3 a 5, escrever aqui neste documento:
o que muda, em qual das duas telas (painel do casal × site do convidado), o
que NÃO muda, e como saber que ficou pronto. Só depois eu começo.

---

## Item 5 — RESOLVIDO em 01/08/2026

`lib/pix.ts` **não existe mais**. O Pix é dado do tenant (colunas em
`site_content`, migração 0010) e o casal o configura pelo painel.

O que entrou, e a razão de cada peça:

| Peça | Por quê |
|---|---|
| `lib/pix/resolve.ts` | `getSitePix(siteId)` → `SitePix \| null`. **Não existe chave de fallback**: não há valor padrão seguro para "para onde vai o dinheiro". |
| `lib/pix/brcode.ts` | BR Code EMV gerado com o **valor da cota** no campo 54 — o que a string estática nunca permitiu. O convidado não digita mais o preço à mão. |
| `lib/site/giftSection.ts` | Uma porta só para lista + Pix. Antes, o Pix vinha de constante global e nenhum molde precisava passá-lo — era essa "facilidade" que causava o defeito. |
| `/api/pix/qr` | QR gerado do payload. Uma imagem estática serviria a uma cota só, e a anterior servia à chave de uma pessoa só. |
| `lib/pix/sem-chave-global.test.ts` | Teste **estrutural**: falha se `lib/pix.ts` voltar, se o QR estático voltar a `public/`, ou se um componente escrever chave no código. O bug não era de lógica — era de onde o dado vinha. |
| `scripts/backfill-legacy-pix.mjs` | A chave era do casal legado de verdade. Foi para o banco antes de sair do código, senão apagar a constante quebraria a lista de presentes de um casamento real. |

**Verificado em build de produção**: a chave do casal legado aparece 0 vezes
no HTML de `ana-e-pedro` e `teste-e-enlace` (que têm presentes e não têm Pix),
e 1 vez em `/presentes`, que é a página dele. `/api/pix/qr` devolve 200 com o
payload da cota para quem tem Pix e **404 para quem não tem**.

Decisão tomada para "casal sem Pix": a lista **aparece** com o recado, e o
modal diz para falar com os noivos. Sumir com a seção seria trocar um susto por
outro. A contrapartida é um aviso em `/conta/pedidos/<id>` quando a lista está
ligada, com presentes, e sem chave: a trava protege o convidado, o aviso
protege o casal.

---

## Item 5 — o diagnóstico original

Não precisa esperar a análise da concorrência. O problema é grave e já está
medido:

`lib/pix.ts` tem uma **chave Pix pessoal chumbada no código**, e o caminho
`molde → GiftGrid → GiftPixModal` a lê direto. Qualquer casal com a lista de
presentes ligada mostra aos convidados **o QR e a chave de outra pessoa**. O
convidado paga achando que presenteia o casal, e o dinheiro vai para a conta
errada.

É o mesmo vazamento entre clientes que a Fase 0 corrigiu em
`groups`/`guests`/`gifts` (§1.2 do SDD), só que passou porque Pix não é
tabela, é constante — e o efeito é pior: não vaza dado, desvia dinheiro.

Estado: a validação da chave digitada já existe e está testada
(`lib/pix/key.ts`, 14 testes). Falta:

1. **A trava** — sem Pix próprio, a seção de presentes não mostra chave
   nenhuma. Vale mais que o resto e não depende de migração.
2. Colunas de Pix em `site_content` (chave, recebedor, cidade, instituição).
3. BR Code (EMV do Banco Central) gerado a partir da chave, **com o valor da
   cota embutido** — o que a string estática nunca permitiu.
4. Editor para o casal, com aviso de que a chave é pública.
5. QR: gerar do payload (precisa de dependência) ou o casal subir a imagem do
   banco. Decisão pendente.

---

## REQUISITO — o questionário passa a coletar o conteúdo (decidido 02/08/2026)

Escrito ANTES de implementar, como manda o item 2 acima.

### O problema que isto resolve

Hoje são duas fases desconectadas: o questionário coleta pacote, nomes, data
e estilo → o site nasce **vazio** → o casal vai preencher o conteúdo de
verdade em outro lugar. A crítica do Nycolas foi exata:

> "Por conta da dependência da criação do site não é possível aparecer
> conteúdo editável e preenchível nas demais opções do menu lateral. Como se
> cria um site sem seu conteúdo? O que vem primeiro?"

Ele está certo. O casal responde 7 perguntas e recebe uma casca.

### O que muda

**Só o PAINEL** (`/conta/pedido/*`). O site do convidado não muda nada.

O questionário cresce de 7 para ~12 etapas, mas **continua uma pergunta por
tela** — é isso que o faz parecer leve mesmo com mais perguntas, e é o que o
iCasei faz. As etapas novas coletam o que hoje só existe no painel:

| Nova etapa | Alimenta |
|---|---|
| Onde e quando é a cerimônia | `ceremonyVenue`, `ceremonyAddress`, `ceremonyMapUrl` |
| Onde é a festa | `receptionVenue`, `receptionAddress` |
| Traje | `dressCode` |
| A história de vocês | `story` |
| Fotos (a capa, pelo menos) | `site_photos` |

Ao enviar, `provisionSiteForOrder` grava tudo em `site_content` de uma vez —
o site nasce **preenchido**, não vazio.

### O que NÃO muda

- Os pacotes (Convite / Site / Para Sempre).
- As 6 telas de gerenciamento continuam existindo: elas viram **edição**, não
  preenchimento inicial.
- Nenhuma etapa vira obrigatória. Cada seção do molde já degrada sozinha
  quando falta dado (§4.4 do SDD) — pular "história" continua sendo um estado
  válido, não um erro.
- O site continua sendo criado no MESMO request. Nada de espera.

### Como saber que ficou pronto

1. Um casal novo termina o questionário e a prévia já mostra nomes, data,
   locais, traje e história — sem passar pelo painel.
2. `/conta/pedidos/<id>/conteudo` abre com os campos **preenchidos**, não em
   branco.
3. Nenhuma etapa bloqueia o avanço por campo vazio, exceto as que já
   bloqueiam hoje (pacote e nomes).
4. `npm run test` continua em 293/293 — em especial `contentInput.test.ts`,
   que protege o fuso horário da data.

### Armadilha conhecida

`parseContentForm` grava hora em UTC e o formulário lê de volta no fuso do
site. Se as etapas novas mandarem data/hora por um caminho diferente do
`contentInput.ts`, a cerimônia das 16h vira 19h e cada salvamento empurra
mais três horas. Reusar `parseContentForm` não é opcional.

---

## Onde anotar os achados (itens 1 e 6)

Quando os links chegarem, colar aqui embaixo. Para cada concorrente:

```
## <nome> — <url>

**O que faz melhor que a gente:**
**O que faz pior:**
**O que copiar, e por quê:**
**O que NÃO copiar, e por quê:**
```

Referências já levantadas em 28/07 (estrutura medida, não julgada):

- **iCasei** — [site real de casal](https://sites.icasei.com.br/nycolaseisa/pages/38284216).
  Widescreen (1440px), menu no topo com **13 páginas separadas** (Nossa
  história, Fornecedores, Cerimônia, Festa, Chá Bar, Padrinhos, Presentes,
  Cotas de lua de mel, Confirmar presença…), presentes em grid de 4 colunas.
  Arquitetura de **múltiplas páginas**, não rolagem única.
- **Squarespace Bleecker** — widescreen, nav no topo, hero grande, serifada
  editorial. Traz o alternador computador/celular que já implementamos.

Nossa diferença estrutural hoje: o site do convidado é uma **rolagem única num
cartão de 480px**, mobile-first de propósito (o convidado abre pelo WhatsApp).
Se a análise disser que múltiplas páginas ganham, isso é decisão de rumo — e
passa pelo Nycolas, que escreveu os moldes.

---

# FEEDBACK 2 — registro e plano (12/08/2026)

Pontos trazidos pelo Anderson, um a um. A coluna de estado foi apurada
CONFERINDO O CÓDIGO, não de memória — três dos sete já estavam resolvidos, e
as capturas que os acompanhavam eram de builds anteriores ao que está no ar.

| # | Ponto | Estado |
|---|---|---|
| 1 | Cara de IA · centralizada, encurtada, desalinhada · fonte branca invisível | ✅ Passada 2 |
| 2 | "Aguardar o site" | ✅ `fadd055` |
| 2.1 | Questionário não coleta conteúdo | 🔴 aberto |
| 4a | Landing: exposição do conteúdo | 🟡 depende de referência |
| 4b | E-mail pessoal na landing | ✅ `638ded2` |
| 5a | Site do convidado curto no desktop | 🟡 depende de referência |
| 5b | Imagens do álbum não abrem | 🔴 aberto |
| 5c | Álbum sem categorização | 🔴 aberto |
| 6 | Prévia visível na tela do pedido, e sempre pronta | 🔴 aberto |
| 7 | WhatsApp só em último caso | 🔴 aberto |

O ponto 3 não foi enviado.

## Por que o 1, o 2 e o 4b aparecem como resolvidos

Não é discordância do feedback — é que ele foi escrito contra uma versão
anterior. A prova de cada um:

- **1**: o botão invisível da captura é `bg-(--color-olive) text-white`, e a
  custom property não resolve em produção. Hoje é `.btn-quiet` com hex
  literal. O trilho era 768px/1280px em trilhos diferentes; hoje é 1200px nos
  dois, com desencontro medido em 0px.
- **2**: a frase "nossa equipe vai começar a montar em breve" saiu em
  `fadd055`, e `lib/orderStatus.ts` carrega uma trava contra reintroduzi-la.
- **4b**: `grep` por `andersondiass018` não retorna nada.

## A ordem de ataque, e o critério

Por **impacto no que o casal recebe**, não por esforço. O 2.1 vem primeiro
porque é o único que muda o produto, e porque ficou dois dias parado enquanto
cor e animação avançavam.

### 1º — 2.1: o questionário coleta o conteúdo

O requisito já está escrito acima (seção de 02/08) e não mudou. O que barateou
foi a implementação: a lista de etapas virou dado em `lib/wizard/etapas.ts`,
então acrescentar etapa é editar uma lista.

Restrições que continuam valendo:
- Nenhuma etapa vira obrigatória — pular é estado válido, e cada seção do
  molde degrada sozinha quando falta dado.
- **Reusar `parseContentForm` não é opcional.** Ele grava hora em UTC e o
  formulário lê no fuso do site; um caminho paralelo faz a cerimônia das 16h
  virar 19h e ganhar três horas a cada salvamento.

### 2º — 6: a prévia sempre pronta e visível

Duas metades, e a primeira pode ser defeito:
- **Sempre pronta.** A captura do Anderson mostra o pedido parado em "Pedido
  recebido", não em "Prévia pronta". Se `provisionSiteForOrder` falhar, o
  `catch` engole o erro e o pedido fica em `submitted` sem prévia — o casal vê
  um site que nunca chega. REPRODUZIR antes de mexer.
- **Visível.** Hoje o painel "Como está ficando" fica abaixo do acompanhamento.
  Sobe para o topo da tela.

### 3º — 5b: as imagens do álbum não abrem

Reproduzir primeiro. Há um `PhotoLightbox` que depende de `.site-canvas`; se o
seletor não casar, o clique não faz nada. Suspeita, não conclusão.

### 4º — 7: WhatsApp em último caso

Tirar o convite de WhatsApp do rodapé do questionário e dos lugares onde ele
aparece como saída natural. Ele permanece no contato da landing e como último
recurso, não como primeira opção — hoje ele é oferecido antes de a pessoa ter
qualquer problema.

### 5º — 5c: categorias do álbum

Funcionalidade nova, e a maior do lote: precisa de coluna nova em
`site_photos`, migração (aditiva, com backup e ensaio), interface de
categorização e renderização por seção no molde. Categorias, na ordem pedida:

1. Pre wedding
2. Noivado
3. O casamento — entrada dos noivos · entrada das madrinhas e padrinhos ·
   familiares & amigos (protocolares) · entrega das alianças (damas e pajens) ·
   os votos / troca de alianças · saída dos recém-casados · decoração e
   detalhes · making-of da noiva

### BLOQUEADOS por referência: 4a e 5a

O Anderson pediu explicitamente para **parar de propor e passar a trabalhar
sobre referência escolhida**. "Melhorar a exposição" sem referência é propor de
novo. Estes dois só entram depois que ele escolher os sites de referência.

## O que NÃO muda em nenhum destes

- A rota `/rsvp/<slug>` e os slugs existentes.
- Nada de `drizzle-kit push`; a migração do 5c é aditiva, com
  `npm run backup:full` e `npm run db:rehearse` antes.
- O site do convidado continua sem three.js: 194 KB de primeira carga medidos
  e meta de LCP de 2,5 s no celular de quem abre pelo WhatsApp.

## Estado ao fim da sessão de 12/08

Entregues e em produção: **2.1** (questionário coleta conteúdo), **6** (prévia
abre a tela do pedido), **7** (WhatsApp só na revisão), mais um defeito achado
no caminho — as fotos eram servidas em 480px e esticadas no desktop.

### 5c — categorias do álbum: PARADO ANTES DA MIGRAÇÃO, de propósito

As categorias já existem como fonte única da verdade em
`lib/site/albumCategories.ts`, na ordem do evento que o Anderson ditou. O que
falta é tudo que toca o banco, e é aí que eu paro:

1. `category text` (ANULÁVEL) em `site_photos`.
2. `npm run backup:full` **antes**.
3. `npm run db:generate` — nunca `push`. O `push` proporia dropar quatro
   tabelas que existem em produção e não vieram por migração, incluindo os
   snapshots de convidados dos últimos 30 dias.
4. O `down` escrito **à mão** em `lib/db/migrations/down/` — o drizzle-kit só
   gera o `up`.
5. `npm run db:rehearse` — aplica numa transação contra o banco real e dá
   ROLLBACK. Reprova sozinho se a migração derrubar tabela ou mexer em
   contagem existente.
6. `scripts/setup-test-schema.mjs` atualizado. O schema `test` NÃO recebe
   migração; esquecer isso derrubou dezenas de casos na 0010 e na 0011.
7. Só então: interface de organização e renderização por categoria nos moldes.

**Por que parar aqui:** este banco tem um casamento no ar com 22 confirmações
e links de `/rsvp/<slug>` já no WhatsApp dos convidados. Migração é a única
coisa desta lista que não dá para desfazer com um `git revert`. O passo 4 —
o `down` à mão — é o que o Anderson pediu para revisar antes de aplicar, e a
regra do próprio repositório é "backup antes, rollback escrito antes".

### 5b — o clique na foto: PENDENTE por falta de evidência

Lendo o código, o lightbox não parece bloqueado: não há `<a>` em volta da
foto, o anel decorativo tem `pointer-events-none`, e o filtro de tamanho não
excluiria as fotos. **Não subi conserto especulativo.** Precisa de navegador
para reproduzir — o MCP do Chrome caiu nesta sessão.

Hipótese que vale testar primeiro: o que foi visto como "não abrem" pode ter
sido a foto borrada de 480px, já corrigida.

### 2.1b — etapa de fotos no questionário: PENDENTE

O requisito prevê, e ficou de fora: o upload precisa de um `siteId` que só
existe DEPOIS do provisionamento. Ou o questionário guarda os arquivos em
memória e sobe no fim, ou o site nasce antes da última etapa. É decisão de
arquitetura, não puxadinho.

### 4a e 5a — BLOQUEADOS por referência

O Anderson pediu explicitamente para parar de propor e passar a trabalhar
sobre referência escolhida. "Melhorar a exposição" sem referência é propor de
novo, e por isso estes dois não avançam até ele escolher os sites.

## Referências do Anderson, confrontadas com o que temos (15/08)

Ele escolheu duas, e são eixos diferentes de propósito:

- **iCasei** — profundidade de EDIÇÃO, principalmente na página gerencial.
- **Squarespace** — o DESENHO dos templates.

### O que as páginas de fato entregaram

Pouco. As duas são páginas de venda. A do Squarespace **não descreve
composição, tipografia, espaçamento nem os blocos** — julgar template de lá
exige olhar os templates, não a página do produto.

A do iCasei rendeu uma coisa concreta e verificável: **a lista de seções**.

### Seções: iCasei × Enlace

| iCasei | Enlace |
|---|---|
| Introdução | `cover` |
| Save the date | `cover` |
| Convite digital | `cover` |
| Confirmação de presença | `rsvp` |
| Lista de presentes | `gifts` |
| Mapa do local | `details` |
| Álbum de fotos | `gallery` + `album` |
| **Dicas de estilo** | — (temos `dressCode` como texto, não seção) |
| — | `countdown`, `story`, `guestbook` |

**A leitura honesta: não há lacuna de funcionalidade.** Temos tudo que eles
listam, mais contagem regressiva, história e mural. A única diferença real é
que o traje deles é uma SEÇÃO ("dicas de estilo", com referência visual) e o
nosso é uma linha de texto.

Ou seja: o incômodo do Anderson com o iCasei **não é de recurso, é de
edição** — o que bate com a frase dele ("dá para editar muita coisa,
principalmente na página gerencial"). Isso é o item 4a, e é sobre o painel.

### O que NÃO dá para fazer sem o Anderson

Comparar a profundidade de edição exige entrar no painel do iCasei, que é
autenticado. E julgar os templates do Squarespace exige olhá-los.

Propor "melhorar a exposição" sem isso é exatamente o que ele pediu para
parar: *"o Claude sempre segue o mesmo padrão, tu precisa guiar ele e não
deixar ele propor"*.

**O que destrava:** capturas do painel do iCasei nas telas que ele achou boas,
e 2 ou 3 templates do Squarespace que ele gostou — com uma frase do porquê. A
frase vale mais que o link: ela diz o que copiar e o que ignorar.
