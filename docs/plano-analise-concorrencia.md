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
| 3 | Refatoração visual e de usabilidade, usando o concorrente como referência | Claude | ⬜ |
| 4 | Revisar e melhorar a landing | Claude | ⬜ |
| 5 | Consertar a lista de presentes | Claude | 🔴 **já diagnosticado** |

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

## Item 5 — lista de presentes: o diagnóstico já existe

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
