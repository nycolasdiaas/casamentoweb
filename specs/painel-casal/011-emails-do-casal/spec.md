# Spec 011 — E-mails 01 a 04: os transacionais do casal (área: painel-casal)

**Status:** Pronta para implementação — com uma pergunta em aberto no modelo
01, que não trava os modelos 03 e 04.

## Contexto

`Enlace - Emails.dc.html` desenha seis modelos. Quatro vão para o **casal**, e
o produto tem dois deles e meio:

| Modelo | Assunto do desenho | Situação |
|---|---|---|
| **01 · Confirmar conta** | `Confirme seu e-mail e comece o site` | `sendEmailVerification` existe em `lib/email.ts:161` e **nenhum arquivo a importa** |
| **02 · Redefinir senha** | `Criar uma senha nova` | existe e é usado (`password-reset-actions.ts:65`) — só a casca diverge |
| **03 · Recibo do pagamento** | `Pagamento confirmado · pedido #4821` | **não existe** |
| **04 · Seu site está no ar** | `O site de vocês está no ar 💚` | **não existe** |

Além dos quatro, o produto tem um e-mail que o protótipo **não** desenha e que
não é para apagar: `sendPreviewReadyEmail` ("a prévia do site de vocês está
pronta"), disparado por `account-actions.ts:312` no fim do provisionamento. Ele
é a peça que transforma "enviei o pedido" em "recebi meu site" (SDD §7).

Os dois que faltam fecham o funil do lado do casal. `lib/site/publish.ts`
publica o site por três caminhos (SDD §7.2) e **nenhum deles avisa ninguém**:
o casal paga, o site entra no ar, e ele só descobre se voltar ao painel. O
webhook do AbacatePay está desligado (`ABACATEPAY_WEBHOOK_SECRET` vazio), o
que torna esse silêncio ainda mais provável.

## Escopo

- `sendReciboEmail` (03) e `sendSiteNoArEmail` (04), sobre a casca de
  `specs/design-system/007-casca-de-email`.
- Ligá-los em `publishSiteForOrder`, dentro de `after()`.
- Migrar 02 e `sendPreviewReadyEmail` para a casca nova (é
  `specs/design-system/007`, e só é repetido aqui como dependência).
- Decidir o destino do modelo 01.

## Fora de escopo

- A casca de 600px, o preheader e o botão de tinta — `specs/design-system/007`.
- Os e-mails 05 e 06, que vão para o convidado —
  `specs/site-publico/006`.
- O resumo semanal — `specs/painel-casal/010`.
- Reativar a verificação de e-mail — ver "Perguntas em aberto".

## Requisitos funcionais

- **FR-001:** DEVE existir `sendReciboEmail(to, dados)` com assunto
  `Pagamento confirmado · pedido #{id curto}` e preheader
  `{valor} · {pacote}. Seu site já está no ar.`
- **FR-002:** O corpo do 03 DEVE ter, nesta ordem: rótulo
  `PAGAMENTO CONFIRMADO` em `#2f6b4f`; título `Está tudo certo`; a linha
  `Recebemos seu pagamento e o site de vocês já está no ar.`; uma tabela de
  quatro linhas (`Pedido`, `Pacote`, `Pago em`, `Total`, com o total em 16px
  `font-weight:500`); o botão `Ver meu site`; e o rodapé
  `Guarde este e-mail como comprovante. Precisa de nota fiscal? Responda esta
  mensagem.`
- **FR-003:** `Pago em` DEVE mostrar data e forma no formato de Voz V5
  (`19 Set 2026 · Pix`), com o fuso do site — nunca o do servidor.
- **FR-004:** DEVE existir `sendSiteNoArEmail(to, dados)` com assunto
  `O site de vocês está no ar` e preheader
  `{endereço} — hora de compartilhar.`
- **FR-005:** O assunto de FR-004 NÃO PODE levar emoji. O artboard traz
  `O site de vocês está no ar 💚`, mas `Enlace - Voz e Microcopy.dc.html` V5 é
  literal: *"Emoji: só em e-mail para convidado e em texto que o casal
  escreve. Nunca em rótulo, botão, estado de erro ou no admin."* Um assunto de
  e-mail transacional é rótulo. A Fundação vence a tela quando as duas
  discordam (`README.md` do pacote, §6).
- **FR-006:** O corpo do 04 DEVE ter: a foto de capa como faixa de 170px com
  os nomes sobrepostos, **com `alt` preenchido e sem informação essencial
  dentro da imagem**; o título `Está no ar!`; o endereço num bloco
  `background:#fff; border:1px solid #d8d0bf` centralizado, em mono de 15px; o
  botão `Compartilhar no WhatsApp`; e a linha
  `Ainda dá para editar tudo — fotos, textos e presentes — pelo painel, a
  qualquer momento.`
- **FR-007:** Quando o site não tiver foto de capa, a faixa de FR-006 DEVE
  cair para o cartão tipográfico em papel (`#f2efe7` com os nomes em serifa),
  nunca para um retângulo quebrado. É a mesma regra que o cartão de link já
  segue (`lib/site/ogImagem.tsx`) e que a prancha I3 escreve.
- **FR-008:** Os dois e-mails DEVEM ser disparados por `publishSiteForOrder`,
  dentro de `after()` do `next/server` — nunca no caminho síncrono. Envio de
  e-mail que falha **não pode** impedir a publicação do site.
- **FR-009:** O disparo DEVE ser **idempotente**, como `publishSiteForOrder`
  já é (SDD §7.2): webhook reenviado e tela recarregada não podem mandar o
  mesmo e-mail duas vezes. O guarda é o `published_at` do site — só dispara
  quando a chamada foi a que mudou o status.
- **FR-010:** Nenhum dos dois pode ser enviado quando `isEmailConfigured()`
  for falso. Hoje isso já é tratado assim em
  `account-actions.ts:310` e é o que mantém o provisionamento funcionando sem
  transporte configurado.
- **FR-011:** 03 e 04 são **transacionais** e NÃO PODEM ter `List-Unsubscribe`
  nem link de descadastro — é a regra do bloco final da prancha de e-mails
  (*"01–04 são transacionais (sem descadastro)"*).
- **FR-012:** O texto dos dois NÃO PODE prometer prazo
  (`regras-de-negocio.md` §2.2). "Está no ar" é resultado, não espera.

## Critérios de aceite

- **SC-001:** `sendReciboEmail` gera HTML com o rótulo
  `PAGAMENTO CONFIRMADO`, a tabela de quatro linhas e um único
  `bgcolor="#1a1d21"`. Atende FR-001, FR-002 e a casca de `design-system/007`.
- **SC-002:** Com o site em `America/Fortaleza` e o pagamento às 22h de
  19/09 (horário local), `Pago em` mostra `19 Set 2026`, não `20 Set`. Atende
  FR-003.
- **SC-003:** O assunto de `sendSiteNoArEmail` passa em
  `/^[ -ÿ]+$/` — nenhum emoji, nenhum símbolo fora do Latin-1.
  Atende FR-005.
- **SC-004:** Com foto de capa, o HTML do 04 contém `<img` com `alt`
  preenchido; sem foto, contém os nomes em serifa sobre `#f2efe7` e **nenhum**
  `<img` de capa. Atende FR-006 e FR-007.
- **SC-005:** Bloquear as imagens no cliente de e-mail deixa o 04 legível e
  com o endereço visível. Atende FR-006.
- **SC-006:** Chamar `/api/pagamento/confirmar?pedido=<id>` duas vezes envia
  **um** e-mail de cada modelo. Atende FR-009.
- **SC-007:** Fazer `send` lançar não impede o site de publicar:
  `site.status` vira `published` mesmo assim. Atende FR-008.
- **SC-008:** Com `GMAIL_APP_PASSWORD` e `RESEND_API_KEY` vazios, publicar
  funciona e nenhum envio é tentado. Atende FR-010.
- **SC-009:** Nenhum dos dois HTML contém `unsubscribe` ou
  `parar de receber`. Atende FR-011.
- **SC-010:** `npx vitest run lib/voz/vocabulario.test.ts` e
  `npx vitest run lib/site/publish.test.ts` passam. Atende FR-012 e garante
  que a idempotência de §7.2 não regrediu.
- **SC-011:** `npm run build`, `npm run lint` e `npm run test` passam.
- **SC-012:** `sendSiteNoArEmail` tem assunto exatamente `O site de vocês está no ar` e preheader terminando em `— hora de compartilhar.`. Atende FR-004.

## Impacto em dados

Nenhum. O disparo lê `orders`, `sites`, `site_content` e `site_photos`, todos
já existentes, e o guarda de idempotência é `sites.published_at`, que já é
escrito por `publishSiteForOrder`.

## Referências

- Protótipo: `Enlace - Emails.dc.html`, modelos **01** a **04**, com assunto e
  preheader de cada um, e o bloco final "Regras de construção — para o Claude
  Code". `Enlace - Voz e Microcopy.dc.html` V5 (a regra de emoji — FR-005).
  `Enlace - Primeira Vez.dc.html` I3 (a regra do cartão sem foto — FR-007).
- Versão atual: `lib/email.ts` (as três funções que existem),
  `app/actions/account-actions.ts:312` (o disparo da prévia pronta),
  `app/actions/password-reset-actions.ts:65`,
  `lib/site/publish.ts` (`publishSiteForOrder` — onde 03 e 04 entram),
  `app/api/pagamento/confirmar/route.ts`,
  `app/api/webhooks/abacatepay/route.ts`,
  `lib/site/ogImagem.tsx` (a queda para o cartão tipográfico).
- SDD do Enlace: §7 (`after()` para trabalho lento), §7.2 (os três caminhos de
  publicação e a idempotência), §15.5 (o webhook desligado).
- Regras de negócio: §2.1 (zero toque humano por venda), §2.2 (nunca prometer
  espera), §6 (tradução obrigatória).

## Dependências

- **Depende de** `specs/design-system/007-casca-de-email` — é ela que entrega
  `layout()`, `button()` e `preheader()`.
- Depende de `specs/design-system/006-voz-verificavel`.
- **Precede** `specs/painel-casal/009-preferencias-de-aviso` e
  `010-resumo-semanal`: as duas só fazem sentido depois de existir e-mail
  sendo enviado ao casal.

## Perguntas em aberto

1. **O modelo 01 (Confirmar conta) deve ser religado ou apagado?**
   `sendEmailVerification` existe em `lib/email.ts:161` e ninguém a importa.
   O `AGENTS.md` §6 explica: a verificação de e-mail inteira
   (`email-verification-actions.ts`, `repositories/emailVerification.ts`,
   `EmailVerificationBanner`, `/conta/confirmar`) só existe na branch órfã
   `feedback-001`, que **não deve ser mesclada** — ela é a arquitetura
   anterior à multi-tenancy e ressuscitaria `order_photos`. A tabela
   `email_verification_tokens` está declarada em `schema.ts`, existe em
   produção e está vazia.

   Três saídas, e a escolha é do dono:

   - **Reconstruir sobre a arquitetura de hoje** (o que o `AGENTS.md`
     recomenda: *"é feature a reconstruir sobre a arquitetura de hoje, não a
     resgatar por merge"*). É uma frente própria — tela, ação, expiração de
     token, banner — e não cabe nesta spec.
   - **Apagar `sendEmailVerification`.** Código morto que parece vivo é pior
     que ausência: quem lê `lib/email.ts` acredita que a verificação existe.
   - **Deixar como está e migrar só a casca**, que é o que
     `specs/design-system/007` faz.

   **A recomendação é a terceira agora e a primeira depois:** migrar a casca
   junto com as outras duas (custo zero, já está no escopo de `007`) e abrir
   uma frente própria para a verificação, quando o dono decidir que ela vale.
   **Nada disso trava os modelos 03 e 04**, que são o assunto desta spec.
