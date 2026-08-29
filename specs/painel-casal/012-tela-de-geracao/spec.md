# Spec 012 — Transição #8: a tela "gerando o site" (área: painel-casal)

**Status:** Implementada (27/08/2026) — **Opção A**: o produto vence o desenho, e o piso de 2,5s não voltou

## Contexto

`HANDOFF-motion.md` §3.1 é a especificação mais detalhada do pacote inteiro:
uma sequência de **10 fases em ~6 segundos**, com miniatura do site dentro de
uma moldura de navegador, cada seção entrando como esqueleto e depois se
preenchendo, barra de progresso em 4 paradas e status em 3 etapas
(`montando as páginas…` → `aplicando o estilo Editorial…` →
`reservando enlace.site/ana-e-joao…`).

E, no meio dela, a frase que cria o conflito:

> Duração alvo ~6s (ou até o backend responder, o que for maior — **nunca
> menor que 2,5s**, senão parece que nada foi feito).

`components/account/wizard/CelebrationScreen.tsx` faz o contrário, e o
comentário no topo do arquivo é o registro de uma decisão já tomada:

> Uma versão intermediária tinha um piso de 2,6 s para a animação ser vista
> por inteiro — e isso virou a crítica **"ter que aguardar o site"**, contra um
> concorrente que entrega em minutos. O provisionamento leva ~1 s; o resto era
> espera inventada. Se o servidor responder em 800 ms, esta tela dura 800 ms.

E `RITMO_MS = 1200` traz a mesma nota: *"Era 2600ms, e eu o havia escolhido
para a animação ser vista por inteiro. Só que o provisionamento leva ~1s: o
resto era espera que eu inventei."*

`docs/regras-de-negocio.md` §2.2 transforma isso em regra do produto:

> **Nunca prometer uma espera que não existe.** Palavras banidas do
> acompanhamento do pedido: "em breve", "logo", "nossa equipe vai", "aguarde",
> "assim que possível", "prazo de entrega".

E §1 fixa o posicionamento: *"O concorrente entrega em minutos e diz isso na
página. O Enlace entrega antes de o casal terminar de ler a frase."*

**Um piso de 2,5 segundos é espera inventada.** Não é uma diferença de gosto:
é o produto segurando o casal para mostrar uma animação, num produto cuja
proposta é não segurar.

## Escopo

Registro do conflito, e o que dá para trazer do §3.1 **sem** o piso.

## Fora de escopo

- Mudar `submitOrderAction` ou `lib/site/provision.ts`.
- O redirecionamento para `/conta/pedidos/<id>` no fim, que já funciona.
- As outras transições do handoff — `specs/design-system/002` a `005`.

## Requisitos funcionais

- **FR-001:** A tela de geração NÃO PODE ter duração mínima. Ela vive do
  clique até o servidor responder. Se o provisionamento levar 800 ms, ela dura
  800 ms.
- **FR-002:** `RITMO_MS` continua sendo **ritmo da cascata**, não tempo de
  espera: ele distribui as etapas dentro do tempo real, e nunca o alonga.
- **FR-003:** Nenhum texto da tela pode prometer prazo. Os quatro atuais
  (`Registrando o pedido de vocês`, `Criando o site com o estilo escolhido`,
  `Montando as seções do pacote`, `Preparando o link da prévia`) cumprem a
  regra e ficam.
- **FR-004:** O que **pode** vir do §3.1 sem custo de espera, e é o que a
  parte implementável desta spec entregaria:
  - **a barra de progresso** (`4% → 38% → 74% → 100%`), que hoje não existe
    na `CelebrationScreen` — o §3.1 a chama de "o único caso em que animar
    `width` é aceitável (é um medidor, não layout)";
  - **o status em 3 etapas com crossfade**, refletindo etapas **reais** do
    provisionamento e não um relógio;
  - **a marca respirando ao lado do título**, que já existe
    (`.motion-breathe`).
- **FR-005:** As etapas do status DEVEM refletir o que o servidor está de fato
  fazendo, ou nada. §3.1 já pede isso (*"Devem refletir etapas reais do
  backend quando existirem"*), e a alternativa — texto trocando por
  temporizador — é a mesma mentira do piso, em outra forma.
- **FR-006:** Se o provisionamento falhar, o esqueleto DEVE parar (sem
  varredura), a barra DEVE ir para `--c-danger` e um erro com
  `Tentar de novo` DEVE aparecer. É a regra do §3.1 e é o único ponto dele que
  o produto **não** cumpre hoje: a `CelebrationScreen` não tem estado de
  falha, e quem cai nele chega em `/conta/pedidos/<id>?provisionamento=erro`
  para descobrir o problema só na tela seguinte.
- **FR-007:** Com `prefers-reduced-motion: reduce`, a tela DEVE mostrar o site
  montado direto, com barra estática e status textual — o que §3.1 pede e o
  `globals.css` já entrega para `.motion-petal`, `.motion-breathe` e
  `.motion-skeleton`.

## Critérios de aceite

- **SC-001:** Com o provisionamento respondendo em 800 ms, medir com
  `performance.now()` entre o clique em `Gerar meu site →` e o
  `location.pathname` virar `/conta/pedidos/<id>`: o valor DEVE ficar abaixo
  de **1200 ms**. Atende FR-001 e FR-002.
- **SC-002:** `grep -nE "2500|2600|PISO|minimo|mínimo" components/account/wizard/CelebrationScreen.tsx`
  não devolve nenhum piso de duração. Atende FR-001.
- **SC-003:** `npx vitest run lib/voz/vocabulario.test.ts` passa sobre
  `CelebrationScreen.tsx`. Atende FR-003.
- **SC-004:** A barra de progresso existe e chega a 100% quando o servidor
  responde — não antes, não por temporizador. Atende FR-004 e FR-005.
- **SC-005:** Forçar `submitOrderAction` a falhar deixa a tela com a barra em
  `--c-danger`, o esqueleto parado e um botão `Tentar de novo` que reenvia.
  Atende FR-006.
- **SC-006:** Com "reduzir movimento" ligado, não há pétalas, não há
  varredura no esqueleto e a marca não respira; o conteúdo aparece por
  opacidade. Atende FR-007.
- **SC-007:** `npm run build`, `npm run lint` e `npm run test` passam.

## Impacto em dados

Nenhum.

## Referências

- Protótipo: `HANDOFF-motion.md` §3 item 8 e **§3.1 inteiro** (as 10 fases, a
  barra, o status em 3 etapas, as regras de falha e de
  `prefers-reduced-motion`). `Enlace - Movimento.dc.html`, cartão
  "Gerando o site" (`submitOrderAction · o esqueleto sendo construído`), com
  os `@keyframes secIn1..5`, `fOut1..3`, `fIn1..3`, `bar`, `st1..3` e
  `doneIn`. `Enlace - D Questionario.dc.html`, artboard
  `GERANDO · submitOrderAction · DESKTOP`.
- Versão atual: `components/account/wizard/CelebrationScreen.tsx` (181 linhas,
  com o registro escrito da decisão sobre o piso),
  `components/ui/SiteSkeleton.tsx` (a construção em GSAP),
  `components/ui/BrandLoader.tsx`, `lib/site/provision.ts`,
  `app/conta/pedidos/[id]/page.tsx:88-95` (o caminho de
  `provisionamento=erro`).
- SDD do Enlace: §7 (o provisionamento é síncrono e sub-segundo — *"Tudo
  síncrono e sub-segundo — não precisa de fila"*).
- Regras de negócio: §1 (o posicionamento contra o concorrente), §2.2 (nunca
  prometer uma espera que não existe), §2.3 (menor trabalho possível).

## Dependências

- Depende de `specs/design-system/006-voz-verificavel` (SC-003).
- Não bloqueia nenhuma outra spec.

## Perguntas em aberto

1. **[CONFLITO] O piso de 2,5 s do `HANDOFF-motion.md` §3.1 contraria uma
   decisão já tomada e já corrigida no produto.** O comentário de
   `CelebrationScreen.tsx` registra que o piso existiu (2,6 s), gerou a
   crítica *"ter que aguardar o site"* e foi removido. `regras-de-negocio.md`
   §2.2 elevou isso a regra.

   Duas saídas:

   - **Opção A — o produto vence o desenho** (o que os FRs acima descrevem).
     O §3.1 do handoff ganha uma nota registrando que o piso não foi adotado, e
     por quê. As fases da animação continuam existindo como **ritmo** dentro do
     tempo real. **Recomendação.**
   - **Opção B — restaurar o piso.** Só faz sentido se o dono decidir que ver
     a sequência inteira vale mais que a velocidade — e isso é reabrir uma
     crítica que ele mesmo fez. Se for esse o caso, a decisão precisa ser
     escrita em `regras-de-negocio.md` §2.2 como exceção nomeada, não
     implementada em silêncio no componente.

2. **FR-006 (o estado de falha) é a única parte do §3.1 que o produto deve a
   ele, e não depende da resposta acima.** Ela pode ser implementada em
   qualquer das duas opções. **Vale separar numa spec própria** se a decisão
   do conflito demorar — hoje, uma falha de provisionamento leva o casal a uma
   tela que só diz o que houve depois do redirecionamento.

## Decisão registrada — 27/08/2026

**Opção A: o produto vence o desenho.** O piso de 2,5s do handoff §3.1 **não**
foi adotado.

Quem decidiu: **Nycolas**, ao mandar seguir com as specs em conflito. E a
decisão já era dele antes: o piso existiu no produto (2,6s), gerou a crítica
*"ter que aguardar o site"* contra um concorrente que entrega em minutos, e foi
removido. As regras §2.2 elevaram isso a norma. A Opção B seria reabrir uma
crítica que ele mesmo fez.

O registro fica no cabeçalho de `CelebrationScreen.tsx`, que já contava essa
história — e agora um teste reprova se `2500`, `2600` ou qualquer `PISO`
voltarem ao arquivo.

## Notas de implementação

**Quase tudo já existia.** FR-001 a FR-004 estavam cumpridos antes desta spec:
sem piso, `RITMO_MS` como ritmo e não espera, os quatro textos sem promessa de
prazo, a barra de progresso, e a marca respirando. O que o produto devia ao
§3.1 era **um ponto só** — e é o que esta spec entregou.

### FR-006: a falha agora acontece onde a pessoa está olhando

Antes, um provisionamento que falhava **desmontava** a tela de criação. O casal
era devolvido ao formulário para descobrir sozinho o que houve — ou, pior,
chegava em `/conta/pedidos/<id>?provisionamento=erro` e lia sobre o erro uma
tela depois.

Agora a tela para de contar a história do site nascendo e passa a dizer o que
houve, sem sair do lugar:

- **a barra vira `--c-danger` ONDE PAROU.** Levá-la a 100% diria que terminou;
  zerá-la apagaria o que já andou;
- **o esqueleto para de construir.** Continuar montando um site que não vai
  nascer é a tela contando uma história que já acabou — e é justamente nesse
  momento que a pessoa precisa ler;
- **as pétalas somem.** Comemorar por cima de um erro é a tela rindo de quem
  está lendo;
- **o título troca** para `O site não ficou pronto.`, com a linha
  `Nada do que vocês responderam se perdeu.` — que é a informação que tira o
  susto;
- **`Tentar de novo` REENVIA**, e não apenas fecha. `requestSubmit(botão)` e
  não `form.submit()`: o submitter é quem carrega `intent=submit`, e sem ele a
  action gravaria rascunho em vez de enviar.

O texto do erro não promete prazo nem diz "tente mais tarde": não há prazo, há
uma falha — e o que a pessoa pode fazer agora está no botão.

### `SiteSkeleton` ganhou `parado`

Um booleano, com `dependencies: [parado]` no `useGSAP` para a linha do tempo
ser recriada quando ele muda. Sem a dependência, o `useGSAP` roda uma vez e o
esqueleto continuaria construindo depois da falha.

## Como cada critério foi conferido

| Critério | Medida |
|---|---|
| SC-001, SC-002 | nenhum `2500`, `2600`, `PISO`, `duracaoMinima` ou `tempoMinimo` no arquivo; a tela vive de `ativo`, do clique à resposta; a barra para em 92% e os 8% finais não são agendados por temporizador |
| SC-003 | as quatro etapas descrevem o que está sendo feito; nenhuma promessa de prazo na tela, nem no estado de erro |
| SC-004, SC-005 | com `erro`: barra em `var(--c-danger)`, esqueleto com `parado`, zero pétalas, `role="alert"` com a mensagem e o botão que reenvia. Sem `erro`, nada disso aparece e a barra volta à tinta do molde |
| SC-006 | movimento reduzido já era tratado em `.motion-petal`, `.motion-breathe` e no `useGSAP` do esqueleto; nada de novo foi acrescentado que animasse |
| SC-007 | `build`, `lint` e `test` (51 arquivos, 609 testes) |
