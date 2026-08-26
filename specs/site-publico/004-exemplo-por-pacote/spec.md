# Spec 004 — B3: `/pacotes/exemplo/:pacote` (área: site-publico)

**Status:** Bloqueada (ver Perguntas em aberto)

## Contexto

`Enlace - B Vitrine.dc.html`, artboard **B3**, desenha
`/pacotes/exemplo/para-sempre` como uma **demo navegável**: uma faixa preta no
topo com um alvo de registro e o texto `EXEMPLO · pacote Para Sempre — este
site é só uma amostra`, mais o botão branco `Criar o meu igual →`. Abaixo dela,
o site fictício de Marina & Rafael renderizado inteiro, com barra de âncoras
(História · Presença · Presentes · Galeria).

A intenção é clara e é de venda: mostrar **o que o pacote entrega**, não o que
o estilo parece. Um casal comparando Convite × Site × Para Sempre vê as seções
que cada um tem.

`app/pacotes/exemplo/[pacote]/page.tsx` é um `redirect("/")` de duas linhas,
com o comentário: *"As demos mockadas por pacote foram substituídas pelos
templates reais em /pacotes/estilos/[estilo] (que já aceitam ?pacote=X para
abrir no pacote certo)."*

Ou seja: a capacidade **existe** e mudou de endereço.
`app/pacotes/estilos/<id>/page.tsx` aceita `?pacote=`, e o próprio
`OrderWizard.tsx:422` usa isso (`/pacotes/estilos/${modelo}?pacote=${pacote}`)
para a prévia embutida do questionário.

## Escopo

- Decidir e implementar o destino de `/pacotes/exemplo/:pacote`.
- A faixa "EXEMPLO" com o botão de conversão, se o endereço voltar a existir.

## Fora de escopo

- O conteúdo das prévias em `app/pacotes/estilos/*` (5.121 linhas), que são a
  vitrine com casal fictício preservada de propósito pelo SDD §4.4.1.
- `/pacotes` — é `specs/site-publico/003`.
- A galeria de estilos — é `specs/site-publico/005`.

## Requisitos funcionais

*Os requisitos abaixo só ficam fechados depois da decisão da pergunta em
aberto. Estão escritos para a opção A (redirecionar com o pacote), que é a
recomendação técnica; a opção B tornaria FR-002 e FR-003 desnecessários.*

- **FR-001:** `app/pacotes/exemplo/[pacote]/page.tsx` DEVE validar `:pacote`
  contra `PackageTier` (`"convite" | "site" | "para-sempre"`) e responder
  **404** para qualquer outro valor. Hoje ele redireciona qualquer coisa para
  `/`, inclusive `/pacotes/exemplo/qualquer-lixo`.
- **FR-002:** Com `:pacote` válido, a rota DEVE redirecionar (308,
  permanente) para `/pacotes/estilos/editorial?pacote=<pacote>` — o Editorial
  é "a casa" e é o estilo que a própria vitrine marca como padrão.
- **FR-003:** A faixa "EXEMPLO" do artboard B3 DEVE existir em
  `/pacotes/estilos/<id>` sempre que houver `?pacote=` **e não** houver
  `?embutido=1`. Com `embutido=1` (a prévia dentro do questionário) a faixa
  NÃO PODE aparecer: ali o casal já está comprando e a faixa roubaria altura
  do quadro.
- **FR-004:** A faixa DEVE ser: fundo `#1a1d21`, texto branco de 12px em
  mono, com o texto exato
  `EXEMPLO · pacote <nome do pacote> — este site é só uma amostra`, e à
  direita um botão branco (`background:#fff; color:#1a1d21`) escrito
  `Criar o meu igual →`.
- **FR-005:** O botão da faixa DEVE ser o `CtaPacote` (mesma razão de
  `specs/site-publico/003` FR-010: quem já tem sessão não pode cair na tela de
  criar conta).
- **FR-006:** A faixa DEVE ser `position: sticky; top: 0` e ficar **acima** da
  barra do site (`specs/site-publico/001`), com `z-index: 30`.
- **FR-007:** As seções mostradas na prévia DEVEM respeitar
  `sectionsForTier(<pacote>)` — é a razão de a rota existir. Uma prévia de
  "Convite" que mostra a lista de presentes vende o que aquele pacote não dá.

## Critérios de aceite

- **SC-001:** `curl -sI /pacotes/exemplo/inexistente` devolve `404`. Atende
  FR-001.
- **SC-002:** `curl -sI /pacotes/exemplo/para-sempre` devolve `308` com
  `location: /pacotes/estilos/editorial?pacote=para-sempre`. Atende FR-002.
- **SC-003:** `/pacotes/estilos/editorial?pacote=convite` mostra a faixa com o
  texto `EXEMPLO · pacote Convite — este site é só uma amostra`. Atende FR-003
  e FR-004.
- **SC-004:** `/pacotes/estilos/editorial?pacote=convite&embutido=1` **não**
  mostra a faixa. Atende FR-003.
- **SC-005:** `/pacotes/estilos/editorial` sem `?pacote=` não mostra a faixa.
  Atende FR-003.
- **SC-006:** Em `?pacote=convite`, a prévia não contém nenhuma seção de
  presentes, mural ou álbum. Em `?pacote=para-sempre`, contém as três. Atende
  FR-007.
- **SC-007:** A faixa fica visível ao rolar a página até o fim. Atende FR-006.
- **SC-008:** `npm run build`, `npm run lint` e `npm run test` passam.
- **SC-009:** O botão da faixa é o `CtaPacote`: com sessão aponta para `/conta/pedido/novo`, sem sessão para `/conta/criar`. Atende FR-005.

## Impacto em dados

Nenhum.

## Referências

- Protótipo: `Enlace - B Vitrine.dc.html`, artboard **B3**
  (`GET /pacotes/exemplo/:pacote`), desktop 1440 e mobile 390 — a faixa preta
  e o site fictício de Marina & Rafael.
- Versão atual: `app/pacotes/exemplo/[pacote]/page.tsx` (redirect de 2 linhas),
  `app/pacotes/estilos/<id>/page.tsx` (aceita `?pacote=` e `?embutido=1`),
  `components/account/wizard/OrderWizard.tsx:422` (quem já usa esses
  parâmetros), `lib/templates/contract.ts` (`sectionsForTier`).
- SDD do Enlace: §4.5 (gating por pacote), §4.4.1 (as prévias com casal
  fictício continuam existindo e não são tocadas).

## Dependências

- Depende de `specs/site-publico/001` (a faixa precisa saber que existe uma
  barra abaixo dela, para o `z-index` e o `top` fecharem).
- Depende de `specs/site-publico/003` — a página `/pacotes` é de onde o casal
  chega aqui.

## Perguntas em aberto

1. **`/pacotes/exemplo/:pacote` deve voltar a existir, ou o redirect é a
   resposta certa?** São duas opções, e a escolha é do dono porque é decisão
   de vitrine, não de código:

   - **Opção A — redirecionar com o pacote (o que os FRs acima descrevem).**
     A rota vira um atalho permanente para a prévia real, no pacote certo.
     Ganho: uma prévia só, sempre atualizada, sem segundo lugar para manter.
     Perda: o casal não escolhe o estilo antes de ver — cai no Editorial.
   - **Opção B — manter o `redirect("/")` e apagar a rota do desenho.** O
     artboard B3 fica registrado como divergência assumida. Ganho: zero
     trabalho. Perda: `enlace.com.br/pacotes/exemplo/para-sempre` continua
     levando à home, e a comparação por pacote (que é o que B3 vende)
     continua sem tela.

   **A recomendação é a opção A**, porque a capacidade já existe (o `?pacote=`
   funciona hoje) e o custo é a faixa mais um redirect. Mas ela decide qual
   estilo o visitante vê primeiro, e isso é posicionamento de vitrine.

2. **Se for a opção A, o estilo padrão é o Editorial?** A vitrine marca o
   Editorial como "A CASA" (`app/page.tsx`, cartão com a etiqueta), o que
   sustenta a escolha. Confirmar.
