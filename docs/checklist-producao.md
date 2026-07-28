# Checklist de produção — novo casal

Uso interno. Rodar em ordem para cada replicação. Material vem do briefing
de WhatsApp ([briefing-whatsapp.md](briefing-whatsapp.md)) — não começar
sem tudo em mãos.

## 0. Pré-requisitos (material completo?)

- [ ] Nomes + forma de exibição
- [ ] Data, horário, locais
- [ ] História + fotos (mín. 5, boa qualidade)
- [ ] Estilo/cores escolhidos
- [ ] (Site/Para Sempre) prazo RSVP + lista de convidados por grupo
- [ ] (Para Sempre) chave Pix + titular + banco + lista de presentes com valores
- [ ] (Para Sempre) nome do endereço personalizado

## 1. Projeto novo (~15 min)

- [ ] Duplicar o repositório para `casamento-[nomes]` (repo novo, não branch)
- [ ] Decidir: remover `app/pacotes/`, `components/demo/`, `components/landing/`,
      `lib/packages.ts`, `lib/site.ts` e `docs/` do site do cliente
      (recomendado; se mantiver, no mínimo tirar link público)
- [ ] Criar banco Postgres novo (nunca reaproveitar o de outro casal)
- [ ] `.env.local`: `DATABASE_URL` novo, segredo de sessão novo, senha de admin nova
- [ ] `npm install && npm run db:migrate`

## 2. Conteúdo (~1–2 h)

- [ ] `app/layout.tsx`: `metadata` (título "Nomes | Save the Date", descrição) e
      fontes do template escolhido
- [ ] `app/globals.css`: paleta do template (Clássico/Moderno/Romântico)
- [ ] `public/save-the-date.jpeg`: arte nova do casal
      (`components/SaveTheDate.tsx`: alt + dimensões)
- [ ] `app/page.tsx`: ajustar seções conforme pacote (Convite não tem link de
      presentes nem RSVP)
- [ ] Textos: história, convite, informações de cerimônia/festa

## 3. Pix + presentes — só Para Sempre (~30 min)

- [ ] `lib/pix.ts`: `PIX_KEY`, `PIX_COPIA_E_COLA`, `PIX_RECIPIENT`,
      `PIX_INSTITUTION` do casal novo (conferir copia e cola num app de banco
      ANTES de publicar — pagar R$ 0,01 de teste)
- [ ] `public/pix-qr.png`: QR novo do casal
- [ ] Cadastrar presentes: `scripts/seed-gifts.mjs` ou painel `/admin/casamento/presentes`

## 4. RSVP — Site e Para Sempre (~30 min–1 h)

- [ ] Criar grupos/famílias no painel `/admin` com a lista do briefing
- [ ] Gerar e conferir 2–3 links de grupo (`/rsvp/[slug]`)
- [ ] Testar confirmação de ponta a ponta e ver refletir no dashboard

## 5. Deploy (~30 min)

- [ ] Projeto novo na Vercel, variáveis de ambiente configuradas
- [ ] Domínio: registrar `[nomes].com.br` (Registro.br) ou subdomínio da
      plataforma; apontar na Vercel
- [ ] Testar em produção pelo CELULAR: home, RSVP real, presente com Pix
      (copia e cola + QR), admin

## 6. Prévia e entrega

- [ ] Enviar mensagem 3 (prévia) do briefing-whatsapp.md
- [ ] Aplicar a rodada de ajustes
- [ ] Enviar mensagem 4 (entrega) com credenciais do admin
- [ ] Enviar links de RSVP de cada família
- [ ] Agendar lembrete pós-festa: pedir fotos para o álbum (Para Sempre)

## 7. Pós-festa — só Para Sempre

- [ ] Receber fotos da festa, subir no álbum
- [ ] Conferir que a seção do álbum destravou na data
- [ ] Pedir o depoimento do casal (vai para a landing de vendas)
