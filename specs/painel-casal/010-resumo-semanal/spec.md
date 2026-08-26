# Spec 010 — J3: o resumo semanal por e-mail (área: painel-casal)

**Status:** Bloqueada (ver Perguntas em aberto)

## Contexto

`Enlace - Notificacoes.dc.html`, artboard **J2/RESUMO DA SEMANA · E-MAIL 600**,
desenha um e-mail para o casal, enviado *"segunda de manhã, com tudo junto"*:

- rótulo `SEMANA DE 12 A 18 DE SETEMBRO`, título `Como foi a semana de vocês`;
- três cartões de número: `CONFIRMARAM +12`, `PRESENTES R$ 750`, `RECADOS 3`;
- um bloco `O QUE MERECE ATENÇÃO` com uma linha de destaque
  (*"48 convidados ainda não responderam e o prazo termina em 7 dias."*) e o
  botão `Enviar lembrete`;
- o fecho `Faltam 147 dias para o casamento.`;
- rodapé com `receber quinzenal` e `parar de receber`.

A regra do mesmo bloco J3: *"Resumo semanal só é enviado se houve movimento.
Semana parada não gera e-mail."*

O produto tem os três números. `lib/repositories/siteMetrics.ts` já calcula
confirmados; `lib/site/avisos.ts` já monta os quatro avisos, incluindo o de
prazo com quantos lugares seguem sem resposta; `contarRecados` já existe.

**O que trava** são três coisas, e nenhuma é de tela:

1. **Não existe agendador.** O SDD §14 decisão 4 escolhe `pg_cron`, e a §15.5
   registra que ele **não foi usado**: *"não há `cron.schedule` em migração
   nenhuma"*. A tabela `site_daily_stats` foi criada na migração 0008 e
   continua sem escritor. Um resumo semanal precisa de alguém que acorde na
   segunda de manhã.
2. **`PRESENTES R$ 750` não é um número que a Enlace tenha.**
   `regras-de-negocio.md` §2.4: o Pix vai direto para o casal, e
   `gift_contributions` guarda o nome do presente e de quem deu, **nunca um
   centavo**. A própria aba Presentes já resolveu isso mostrando *cotas
   escolhidas* em vez de reais, e explicando por quê.
3. **O e-mail sai de onde?** `lib/email.ts` roda em Gmail SMTP com a senha de
   app de uma conta pessoal e limite de ~500/dia. Um envio semanal para todos
   os casais ativos é volume recorrente, não transacional.

## Escopo

*Congelado até a decisão da pergunta em aberto.*

- O agendador semanal.
- `sendResumoSemanalEmail` sobre a casca de
  `specs/design-system/007-casca-de-email`.
- A regra de "só envia se houve movimento".
- O descadastro.

## Fora de escopo

- O sino (J1) e as preferências (J2, `specs/painel-casal/009`).
- O roll-up diário em `site_daily_stats` (SDD §6.1), que é outra pendência e
  outra spec — embora o mesmo agendador sirva os dois.

## Requisitos funcionais

*Nenhum requisito é escrito enquanto a pergunta em aberto não tiver resposta.*
O primeiro requisito honesto seria "existe um agendador", e escolher qual é
uma decisão de infraestrutura com custo mensal — não uma linha de spec.

Duas regras, no entanto, já valem para **qualquer** versão desta spec e ficam
registradas aqui para não serem redescobertas:

- **FR-001:** O cartão de presentes NÃO PODE mostrar valor em reais somado a
  partir de cotas de valor livre. Ou mostra **cotas escolhidas**, ou mostra
  reais **só quando toda cota escolhida tinha preço fixo** — que é exatamente
  o que `app/conta/pedidos/[id]/presentes/page.tsx` já faz e documenta.
  Somar só as de preço fixo e apresentar como total daria um número menor que
  o real.
- **FR-002:** O e-mail NÃO PODE ser enviado quando não houve movimento na
  semana (nenhuma confirmação nova, nenhum presente, nenhum recado). É a
  regra escrita no bloco J3 do próprio protótipo, e é o que separa um resumo
  de um lembrete de que o produto existe.

## Critérios de aceite

- **SC-001:** Um site sem nenhuma confirmação, presente ou recado na semana
  não gera envio. Atende FR-002.
- **SC-002:** Um site com uma cota de valor livre escolhida não mostra valor
  em reais no cartão de presentes. Atende FR-001.
- **SC-003:** *(os demais dependem da resposta)*

## Impacto em dados

Depende da resposta:

- **Se for `pg_cron`:** uma migração que cria o `cron.schedule`. Aditiva, sem
  tocar em tabela de dado de cliente.
- **Se for cron da Vercel:** nenhuma migração; uma rota
  `/api/cron/resumo-semanal` protegida por segredo.
- **Em qualquer caso**, o descadastro precisa de estado por usuário — a mesma
  coluna `users.aviso_prefs` (jsonb, nullable) que
  `specs/painel-casal/009` propõe. Aditiva, SDD §13.1.

## Referências

- Protótipo: `Enlace - Notificacoes.dc.html`, artboard
  `RESUMO DA SEMANA · E-MAIL 600` (dentro do bloco **J2**), e o bloco **J3**
  de regras (*"Resumo semanal só é enviado se houve movimento"*).
  `Enlace - Emails.dc.html` para a casca.
- Versão atual: `lib/site/avisos.ts` (os avisos derivados — a fonte do bloco
  "o que merece atenção"), `lib/repositories/siteMetrics.ts`,
  `lib/repositories/guestbook.ts` (`contarRecados`),
  `app/conta/pedidos/[id]/presentes/page.tsx` (a decisão sobre valor em reais),
  `lib/email.ts`. O resumo: **não existe — NOVO**.
- SDD do Enlace: §14 decisão 4 (`pg_cron` como agendador), §15.5 (*"Roll-up
  diário em `pg_cron` — **não existe**"*), §6.1 (métricas e a razão do
  roll-up), §9.2 (custo por fase).
- Regras de negócio: §2.4 (o dinheiro do presente é do casal — FR-001), §2.2
  (nunca prometer espera).

## Dependências

- **Depende de** `specs/design-system/007-casca-de-email`.
- **Depende de** `specs/painel-casal/011-emails-do-casal` — faz pouco sentido
  entregar o resumo semanal antes do recibo de pagamento e do "seu site está
  no ar", que são transacionais e mais urgentes.
- Compartilha o agendador com a pendência do roll-up diário (SDD §15.5).

## Perguntas em aberto

1. **Qual agendador?** O SDD §14 decidiu `pg_cron` e nunca o usou. Duas
   opções, e a diferença é de operação:

   - **`pg_cron`** — já instalado no banco, roda dentro do Postgres, não
     custa nada a mais. Mas SQL puro não consegue enviar e-mail: ele
     precisaria escrever numa tabela de fila e alguém consumir. Ou seja, não
     resolve sozinho.
   - **Vercel Cron** — um `GET` agendado numa rota do próprio app, com todo o
     código TypeScript disponível. Resolve sozinho. Exige o plano Pro, que o
     SDD §9.2 já lista como obrigatório ("Hobby proíbe uso comercial").

   **A recomendação é Vercel Cron**, porque o trabalho é de aplicação (montar
   e-mail, ler métricas, enviar) e não de banco. Mas isso **contraria a
   decisão 4 da §14 do SDD**, que precisa ser reaberta explicitamente pelo
   dono em vez de contornada.

2. **Qual provedor de e-mail?** Ver
   `specs/site-publico/006-emails-para-o-convidado`, pergunta 1, item
   "Entregabilidade": envio recorrente com a senha de app de uma conta Gmail
   pessoal não sustenta. Isso empurra para Resend com domínio verificado, que
   depende de registrar o domínio — o único item do SDD com prazo externo
   (§6). **Decisão do dono.**

3. **O resumo é por casal ou por pedido?** Um casal pode ter mais de um
   pedido. Mandar dois e-mails na mesma segunda seria o oposto do que a
   prancha J quer. Provavelmente um e-mail por **usuário**, com uma seção por
   site ativo — mas isso muda o desenho do artboard, que assume um site.
