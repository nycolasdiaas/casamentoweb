# Spec 006 — E-mails 05 e 06: convite e lembrete para o convidado (área: site-publico)

**Status:** Rejeitada (27/08/2026) — o Enlace **não** passa a coletar e-mail de convidado; os modelos 05 e 06 viram peça de WhatsApp

## Contexto

`Enlace - Emails.dc.html` desenha seis modelos. Dois deles vão para o
**convidado**, e nenhum dos dois existe:

- **05 · Convite para o convidado** — assunto `Ana & João convidam vocês`,
  preheader `19 de setembro, São Paulo. Confirme até 05/09.`. O corpo é o
  convite tipográfico em papel, com "VOCÊ ESTÁ CONVIDADO", os nomes em serifa
  de 46px, a data em mono, o botão de tinta `Confirmar presença` e o rodapé
  `Reservamos 2 lugares no seu nome · enlace.site/ana-e-joao`. A anotação da
  prancha diz: `publicarConviteAction · o casal envia`.
- **06 · Lembrete de confirmação** — assunto
  `Faltam 7 dias para confirmar presença`, preheader
  `Leva menos de um minuto.`. Dois botões (`Sim, vamos!` / `Não posso ir`) —
  a única exceção à regra de um botão por e-mail. A anotação diz:
  `cron · 7 dias antes do prazo`.

As regras de construção da mesma prancha acrescentam que 05 e 06 *"vão para
convidados: precisam de `List-Unsubscribe` e do link no rodapé"*.

**O que trava:** o produto não tem o endereço de e-mail de nenhum convidado.
`lib/db/schema.ts:455-471` mostra a tabela `guests` com `id`, `groupId`,
`name`, `rsvpStatus`, `respondedAt`, `position`, `createdAt`. Nenhuma coluna
de contato. `groups` também não tem. Não existe tela que peça esse dado, nem
no painel do casal nem no RSVP.

E não é um esquecimento: `regras-de-negocio.md` §2.5 fixa que *"o convidado
nunca cria conta, nunca instala nada, nunca escolhe nada além de confirmar
presença e presentear"*, e o modelo de distribuição do produto inteiro é o
**link no WhatsApp** — `Enlace - Compartilhamento.dc.html` abre dizendo *"No
Brasil o casamento se espalha pelo WhatsApp"*, e a aba Compartilhar entrega
link, QR e três mensagens prontas justamente para isso.

## Escopo

*Congelado até a decisão da pergunta em aberto.* O que a spec cobriria:

- `lib/email.ts`: `sendConviteEmail` (05) e `sendLembreteRsvpEmail` (06),
  sobre a casca de `specs/design-system/007-casca-de-email`.
- `List-Unsubscribe` e o link de descadastro no rodapé dos dois.
- O gatilho de 06 (o `cron` da prancha).

## Fora de escopo

- A casca de 600px, o preheader e o botão de tinta — são
  `specs/design-system/007-casca-de-email` e **precedem** esta.
- Os e-mails 01–04, que vão para o casal — são
  `specs/painel-casal/011-emails-do-casal`.
- Qualquer mudança em `/rsvp/<slug>`, que é a rota com 23 confirmações reais
  (`regras-de-negocio.md` §2.5).

## Requisitos funcionais

*Nenhum requisito é escrito enquanto a pergunta em aberto não tiver resposta.*
Escrever `FR-001: sendConviteEmail(to, …)` agora seria fixar um `to` que não
existe em lugar nenhum do modelo de dados — e a segunda linha do requisito
seria uma coluna nova em tabela com dado de convidado real, que é exatamente o
tipo de decisão que o SDD §13.1 manda não tomar de passagem.

## Critérios de aceite

- **SC-001:** `grep -rn "email" lib/db/schema.ts` não mostra nenhuma coluna
  nova em `guests` nem em `groups` — nenhuma migração foi feita antes da
  resposta.
- **SC-002:** `grep -c "sendConviteEmail\|sendLembreteRsvpEmail" lib/email.ts`
  devolve `0` — nenhuma linha de código foi escrita para esta spec antes da
  resposta.

## Impacto em dados

**Este é o ponto.** Qualquer versão desta spec que envie e-mail para o
convidado precisa de endereço de convidado, e isso é coluna nova numa tabela
com dado de terceiro real:

- `guests.email text` (nullable) — aditivo, cabe no padrão
  **expandir → migrar → verificar → restringir** do SDD §13.1. Sem backfill:
  os 31 convidados que existem hoje ficariam com `null`, que é a verdade.
- Ou `groups.email text` (nullable) — um endereço por grupo, que é como o
  RSVP já funciona desde a 0016 (a resposta é do grupo, não da pessoa).

Nos dois casos: nada é apagado, nada é reescrito, `NOT NULL` nunca entra, e a
migração respeita a janela do §13.1 (**nunca na véspera ou semana de
16/10/2026**).

O que **não** pode acontecer: reaproveitar `guests.name` para guardar
endereço, ou qualquer `UPDATE` em coluna preexistente.

## Referências

- Protótipo: `Enlace - Emails.dc.html`, modelos **05** (`Convite para o
  convidado`, anotado `publicarConviteAction · o casal envia`) e **06**
  (`Lembrete de confirmação`, anotado `cron · 7 dias antes do prazo`), mais o
  bloco de regras: *"01–04 são transacionais (sem descadastro). 05 e 06 vão
  para convidados: precisam de `List-Unsubscribe` e do link no rodapé."*
  `Enlace - Notificacoes.dc.html` J1 tem o aviso "Enviar lembrete →", que é o
  gatilho manual do mesmo 06.
- Versão atual: `lib/email.ts` (três funções, nenhuma para convidado),
  `lib/db/schema.ts:455-471` (`guests` sem contato),
  `lib/db/schema.ts:404-430` (`groups` sem contato),
  `components/account/manage/Compartilhar.tsx` (o caminho que existe hoje: o
  casal manda o link).
- SDD do Enlace: §13.1 (expandir → migrar → verificar → restringir; proibido
  `UPDATE` em coluna preexistente), §6.2 (o banco tem casamento real a
  16/10/2026), §6.1 (o convidado é terceiro — LGPD).
- Regras de negócio: §2.5 (o convidado não cria conta nem escolhe nada além
  de confirmar e presentear), §2.3 (menor trabalho possível para o casal),
  §8 item 5 (mudar o que o convidado precisa fazer é decisão do dono).

## Dependências

- **Depende de** `specs/design-system/007-casca-de-email` — sem a casca, os
  dois modelos seriam escritos na casca antiga de 480px.
- Depende de `specs/design-system/006-voz-verificavel`.

## Perguntas em aberto

1. **O Enlace deve passar a coletar e-mail de convidado?** É decisão do dono,
   e ela custa mais do que parece:

   - **Quem digita?** Se for o casal, são dezenas de endereços a digitar num
     produto cuja primeira promessa é *"vocês não vão trabalhar"* (§2.3). Se
     for o convidado, no `/rsvp/<slug>`, muda o que ele precisa fazer para
     confirmar — o que §8 item 5 reserva ao dono.
   - **LGPD.** E-mail de convidado é dado pessoal de terceiro que nunca
     aceitou termo nenhum. O produto hoje é rigoroso nisso (§6.1: IP nunca é
     gravado, `visitor_hash` gira a cada 24h). Guardar endereço muda a
     categoria do que a base contém.
   - **Entregabilidade.** `lib/email.ts` roda hoje em **Gmail SMTP**, com
     limite de ~500 destinatários/dia e a senha de app de uma conta pessoal.
     Um único casamento com 200 convidados e um lembrete gasta 400 envios. O
     comentário do próprio arquivo já diz: *"troque por um provedor dedicado
     quando o volume crescer"*. Isto exigiria Resend com domínio verificado —
     que depende de registrar o domínio, o único item do SDD com prazo
     externo (§6).

2. **Se a resposta for não, o que acontece com os modelos 05 e 06?** Duas
   saídas honestas, e as duas fecham esta spec:

   - **Virar peça do WhatsApp.** O modelo 05 é, tirando a casca de e-mail,
     exatamente o convite que `/c/<slug>` já entrega como página, e o cartão
     de link (`specs` da área S1) já monta a versão que aparece na conversa.
     O modelo 06 vira a mensagem pronta "LEMBRAR (faltando 7 dias)" que a aba
     Compartilhar **já tem** (`Enlace - Compartilhamento.dc.html` S2). Nesse
     caso a divergência é **assumida**, não corrigida, e o produto vence o
     desenho — como já aconteceu com H5.
   - **Ficar como está e registrar.** Os dois modelos seguem no pacote de
     design como peça desenhada e não construída.

   **A recomendação é a primeira**, porque o caminho já existe inteiro e não
   pede coluna nova, provedor novo nem consentimento de terceiro.

## Decisão registrada — 27/08/2026

**Não. O produto não passa a coletar e-mail de convidado.**

Três razões, e cada uma sozinha bastaria:

- **Quem digita.** Se for o casal, são dezenas de endereços num produto cuja
  primeira promessa é *"vocês não vão trabalhar"*. Se for o convidado, no
  `/rsvp/<slug>`, muda o que ele precisa fazer para confirmar — e
  `/rsvp/<slug>` é a rota que não pode deixar de funcionar.
- **LGPD.** E-mail de convidado é dado pessoal de terceiro que nunca aceitou
  termo nenhum. O produto hoje é rigoroso: IP nunca é gravado, `visitor_hash`
  gira a cada 24h. Guardar endereço muda a categoria do que a base contém.
- **Entregabilidade.** `lib/email.ts` roda em Gmail SMTP, com ~500
  destinatários/dia e a senha de app de uma conta pessoal. **Um** casamento com
  200 convidados e um lembrete gasta 400 envios.

**Os modelos 05 e 06 viram peça de WhatsApp** — a primeira saída da pergunta 2,
e ela fecha a spec sem perda:

- o **05** (convite) é, tirando a casca de e-mail, exatamente o que
  `/c/<slug>` já entrega como página — e o cartão de link já monta a versão que
  aparece na conversa;
- o **06** (lembrete) é a mensagem "faltando 7 dias" que a aba Compartilhar
  **já tem**.

A divergência é **assumida**, não corrigida — como já aconteceu com o H5.

**O que reabre isto:** um provedor de e-mail com domínio verificado (Resend) e
uma decisão sua sobre LGPD. Nessa ordem: sem o primeiro, o segundo não tem
para onde ir.
