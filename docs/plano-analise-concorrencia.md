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
