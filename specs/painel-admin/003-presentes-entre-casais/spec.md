# Spec 003 — G5: `/admin/presentes` entre casais (área: painel-admin)

**Status:** Pronta para implementação — com **[CONFLITO COM DECISÃO EXISTENTE
— REQUER APROVAÇÃO]** no cartão "A repassar", que fica fora dos requisitos.

## Contexto

`Enlace - G Admin.dc.html`, artboard **G5** (`GET /admin/presentes`), desenha
a tela em duas colunas:

- **Esquerda:** `Contribuições recentes` — uma tabela de cinco colunas
  (DATA · CASAL · COTA · VALOR · STATUS) **atravessando casais**: uma linha de
  Ana & João, outra de Marina & Rafael.
- **Direita:** dois cartões — `TOTAL EM PRESENTES · MÊS` (`R$ 48k`,
  `312 contribuições`) e `A REPASSAR` (`Pendente R$ 3.200` /
  `Repassado R$ 44.800`).

`app/admin/presentes/page.tsx` entrega o `GiftAdmin` com as cotas e
contribuições **de um único site** — o legado, via `getLegacySiteId()`. Não
atravessa casais, não tem totais e não tem o cartão de repasse.

**O cartão "A repassar" é um conflito direto.** `regras-de-negocio.md` §2.4:

> **100% do presente vai para o casal. O Enlace nunca fica no meio.**

Não existe repasse porque o dinheiro nunca esteve com a Enlace. `Pendente
R$ 3.200` descreve um passivo que não existe, e `Repassado R$ 44.800`
descreve um pagamento que nunca aconteceu. §7 das mesmas regras lista "taxa
sobre presente" entre as decisões descartadas — o cartão pressupõe um modelo
de intermediação que foi recusado.

O **valor** também não existe de verdade. `gift_contributions` guarda o nome
do presente e de quem deu, **nunca um centavo**. A aba Presentes do casal já
resolveu isso e documenta o porquê:

> O valor só é somado quando TODA cota escolhida tinha preço fixo. Uma cota de
> "valor livre" não tem quanto o convidado deu — e somar só as de preço fixo
> daria um número menor que o real, apresentado como se fosse o total.

E há uma terceira camada: a contribuição é **auto-declarada** pelo convidado
(`registerContributionAction`). O `STATUS` do artboard mostra `confirmado` e
`processando` — dois estados de um processamento que não existe.

## Escopo

- `app/admin/presentes/page.tsx`: a tabela de contribuições recentes
  atravessando casais.
- O cartão de total do mês, com a mesma honestidade da aba do casal.
- Manter o acesso às cotas do casamento legado.

## Fora de escopo

- **O cartão "A REPASSAR"**, registrado como conflito.
- **A coluna `STATUS`** com `confirmado`/`processando`, pelo mesmo motivo.
- `lib/pix/*`, `GiftPixModal.tsx` e `registerContributionAction`.
- `components/admin/GiftAdmin.tsx` como editor de cotas do legado, que
  continua existindo.

## Requisitos funcionais

- **FR-001:** A tela DEVE listar as contribuições **de todos os sites**, não
  só do legado. `listContributions` DEVE ganhar uma variante sem `siteId` —
  ou um `siteId` opcional — usada **exclusivamente** por esta rota de admin.
- **FR-002:** A variante de FR-001 NÃO PODE ser exportada de forma que uma
  rota pública possa chamá-la sem `siteId`. O isolamento por `siteId` é o
  corte de segurança entre clientes (SDD §5.2), e uma função global solta no
  repositório é o caminho mais curto para ele vazar. Ela DEVE se chamar
  `listContributionsParaAdmin` e ter um comentário dizendo isso.
- **FR-003:** A tabela DEVE ter quatro colunas: `DATA`, `CASAL`, `COTA` e
  `VALOR`. A quinta do artboard (`STATUS`) fica de fora — ver "Perguntas em
  aberto".
- **FR-004:** `DATA` DEVE usar o formato de dado de Voz V5
  (`19 Set · 14h`), em `t-data`.
- **FR-005:** `CASAL` DEVE mostrar `sites.slug` resolvido para
  `site_content.couple_names`, e ser um link para
  `/admin/pedidos?q=<slug>` — de onde o operador chega ao pedido.
- **FR-006:** `VALOR` DEVE mostrar o preço da cota quando ela tinha preço
  fixo, e o traço `—` quando era de valor livre. **Nunca** um valor
  estimado.
- **FR-007:** O cartão de total DEVE mostrar **duas** linhas: o número de
  contribuições do mês (`312 contribuições`) como valor principal em
  `t-display`, e o valor em reais **apenas quando toda contribuição do mês
  tiver vindo de cota com preço fixo**. Caso contrário, no lugar do valor:
  `algumas cotas são de valor livre`.
- **FR-008:** O cartão DEVE trazer, no rodapé, a frase que explica o que o
  número é: `O Pix vai direto para a conta de cada casal — a Enlace nunca
  fica no meio.` É a mesma nota que a aba do casal já mostra, e é o que
  impede alguém de ler o número como caixa.
- **FR-009:** A tela DEVE manter um caminho para as cotas do casamento
  legado (o `GiftAdmin` de hoje), como uma segunda seção ou uma aba — não
  pode sumir.
- **FR-010:** Nada nesta tela pode permitir marcar contribuição como
  "repassada", "paga" ou "processada". Criar esse gesto seria criar a operação
  que §2.4 recusa.
- **FR-011:** A tela DEVE ficar dentro do `<Suspense>` do layout do admin e
  continuar dinâmica (SDD §3.2).

## Critérios de aceite

- **SC-001:** Com contribuições em dois sites diferentes, a tabela mostra as
  duas, com o nome de cada casal. Atende FR-001 e FR-005.
- **SC-002:** `grep -rn "listContributionsParaAdmin" app/ lib/` mostra a
  função sendo importada **só** por `app/admin/presentes/page.tsx`. Atende
  FR-002.
- **SC-003:** Uma contribuição numa cota de valor livre mostra `—` na coluna
  `VALOR`. Atende FR-006.
- **SC-004:** Com uma contribuição de valor livre no mês, o cartão de total
  mostra `algumas cotas são de valor livre` e nenhum `R$`. Sem nenhuma, mostra
  o valor. Atende FR-007.
- **SC-005:** O HTML da tela contém `A Enlace nunca fica no meio.` Atende
  FR-008.
- **SC-006:** `grep -icE "repass|pendente|processando|estorn" app/admin/presentes/page.tsx`
  devolve `0`. Atende FR-010 e o conflito registrado.
- **SC-007:** As cotas do casamento legado continuam editáveis pela tela.
  Atende FR-009.
- **SC-008:** `npx vitest run lib/repositories/gifts.test.ts` passa, com o
  teste de isolamento por `siteId` intacto. Atende FR-002.
- **SC-009:** `npm run build`, `npm run lint` e `npm run test` passam.
- **SC-010:** A tabela tem 4 colunas e o cabeçalho contém `DATA`, `CASAL`, `COTA` e `VALOR`, e **não** contém `STATUS`. Atende FR-003.
- **SC-011:** Uma contribuição de 19/09/2026 às 14h05 aparece como `19 Set · 14h` em `t-data`. Atende FR-004.
- **SC-012:** `npm run build` passa sem "Uncached data was accessed outside of `<Suspense>`". Atende FR-011.

## Impacto em dados

Nenhum. Só leitura: `gift_contributions`, `gifts`, `sites`, `site_content`.

## Referências

- Protótipo: `Enlace - G Admin.dc.html`, artboard **G5**
  (`GET /admin/presentes` · `→ POST createGift · updateGift · deleteGift ·
  registerContribution`), desktop 1440 e mobile 390 — a tabela de
  contribuições recentes e os dois cartões da direita.
- Versão atual: `app/admin/presentes/page.tsx`,
  `components/admin/GiftAdmin.tsx`, `lib/repositories/gifts.ts`
  (`listGifts`, `listContributions`, `contribuicoesPorCota`),
  `app/conta/pedidos/[id]/presentes/page.tsx` (a decisão já tomada sobre valor
  em reais, com o comentário que a justifica),
  `lib/repositories/gifts.test.ts` (o teste de isolamento).
- SDD do Enlace: §5.2 (isolamento por `siteId` — *"isto não é opcional: é o
  corte de isolamento entre clientes"*), §1.2 (`listGifts()` retornava todos
  os presentes do banco — o defeito que a variante de FR-001 não pode
  ressuscitar), §3.2 (`cacheComponents`).
- Regras de negócio: §2.4 (o dinheiro do presente é do casal, sempre), §7
  (taxa sobre presente descartada), §3 (o `/admin` é exceção).

## Dependências

- Depende de `specs/design-system/001-token-ink-3`.
- Depende de `specs/painel-admin/002` só por ordem (a barra do admin muda lá).

## Perguntas em aberto

1. **[CONFLITO] O cartão "A REPASSAR" descreve um modelo de negócio que foi
   recusado.** `Pendente R$ 3.200` / `Repassado R$ 44.800` só fazem sentido
   se a Enlace receber o dinheiro do presente e repassar depois — que é
   exatamente o que `regras-de-negocio.md` §2.4 proíbe e §7 lista como
   descartado. O produto vence o desenho; o cartão não é implementado.

   **Só reabrir se o dono quiser mudar o modelo de presente**, e aí é uma
   frente inteira: conta de pagamento, split, obrigação fiscal e um passivo
   por casal. Não é um cartão de dashboard.

2. **[CONFLITO menor] A coluna `STATUS` (`confirmado` / `processando`)
   descreve estados que não existem.** A contribuição é auto-declarada pelo
   convidado num único gesto (`registerContributionAction`); não há
   processamento, não há confirmação de terceiro, não há falha observável (é o
   mesmo motivo de `specs/site-publico/007`). Mostrar "confirmado" ao lado de
   uma auto-declaração daria ao operador uma certeza que ninguém tem.

   **A alternativa honesta**, se o dono quiser uma coluna ali: `ORIGEM`,
   dizendo `o convidado confirmou` — que é a verdade do dado. Fica como
   sugestão, não como requisito.
