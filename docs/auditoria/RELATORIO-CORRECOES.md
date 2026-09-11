# Relatório de correções — feature 001

**Data:** 11/09/2026
**Auditoria de origem:** [`AUDITORIA-E2E.md`](./AUDITORIA-E2E.md)
**Feature:** `specs/001-ux-provisionamento-e-ambiente`
**No ar desde:** commit `c85f436` em `vercel-origin/main`

---

## 1. Resumo executivo — antes × depois

**Antes.** Um casal que respondesse o questionário inteiro em
`casamentoweb-ten.vercel.app` clicava em "Criar nosso site" e recebia **HTTP
500**. O site não era criado. Quem conseguisse passar dali por outro caminho
encontrava o painel sem cerimônia, sem festa, sem traje, e com uma anotação de
bastidor publicada no lugar da história de amor. "Criar convite" derrubava a
página com um erro em inglês. O QR do casamento **que já está no ar** devolvia
500, e o cartão do link que esse casal manda no WhatsApp apontava para
`localhost`.

**Depois.** O mesmo fluxo, feito do zero em produção com uma conta nova:
"PRÉVIA PRONTA" na hora, painel abrindo, os oito campos do questionário no
lugar certo, convite abrindo com o domínio real no rodapé, QR devolvendo
imagem, e o cartão do WhatsApp do casamento real apontando para
`https://casamentoweb-ten.vercel.app`.

**Uma causa, seis sintomas.** `getBaseUrl()` lançava exceção quando
`NEXT_PUBLIC_SITE_URL` não estava definida e o host não estava na allowlist — e
o domínio de produção tem um `-ten` que a lista não tinha. A gêmea dela,
`baseUrlEstatica()`, fazia o oposto e pior: caía calada em
`http://localhost:3000` e mandava isso para o WhatsApp da família.

**Todos os 🔴 estão resolvidos.** Nenhum ficou bloqueado.

---

## 2. Nota de UX — antes × depois

| Critério | Antes | Depois | O que mudou |
|---|---:|---:|---|
| Cadastro | 8,5 | 8,5 | não foi tocado (UX-017 segue aberto) |
| Criação do casamento | 7,5 | **9,0** | o questionário agora **entrega** o que coletou |
| Navegação | 7,0 | **8,5** | a aba Início deixou de responder 500 |
| Textos | 8,0 | **9,0** | as duas telas em inglês saíram |
| Organização | 8,0 | 8,0 | sem mudança |
| Feedback | 5,5 | **7,0** | "Site criado!" chega ao casal; falha tem tela com saída |
| Prevenção de erros | 4,0 | 4,5 | UX-009 e UX-019 seguem abertos |
| Recuperação de erros | 2,0 | **8,0** | tela de erro em português, "tentar de novo", nada se perde |
| Consistência | 6,5 | 7,0 | endereços passam a ser o mesmo em todo lugar |
| Quantidade de etapas | 8,0 | 8,0 | sem mudança |
| Pontos de abandono | 1,5 | **8,5** | o abandono estava no clique que fecha a venda; ele sumiu |

### **Nota geral: 4,2 → 7,6**

O que segura em 7,6 e não mais alto são os quatorze achados que **não** entram
nesta feature: as cores trocadas dos seis modelos (UX-006), o rótulo privado que
vaza para o convidado (UX-008), a perda de onze campos quando a chave Pix é
recusada (UX-004), os alvos de toque de 12px no celular (UX-015). Nada disso foi
tocado aqui — de propósito: a feature 001 tinha um escopo, e ele era o funil.

---

## 3. Rastreabilidade completa

| UX-ID | Sev. | Status | FR | Tasks | Commits | Evidência antes | Evidência depois |
|---|---|---|---|---|---|---|---|
| UX-001 | 🔴 | ✅ Resolvido | FR-001, FR-002, FR-003, FR-004 | T001–T010 | `746cfd3` | `UX-001.png` | `RESULTADOS-DEPOIS.md` |
| UX-002 | 🔴 | ✅ Resolvido | FR-003, FR-005, FR-008 | T002, T011–T014, T019 | `746cfd3` | `UX-002.png` | `UX-002-depois.png`, `UX-002-erro-depois.md` |
| UX-003 | 🔴 | ✅ Resolvido | FR-009, FR-010, FR-011 | T004–T007, T010 | `746cfd3` | `UX-003.png` | `UX-003-depois.png` |
| UX-005 | 🟠 | ✅ Resolvido | FR-006 | T002, T016 | `746cfd3` | `UX-005-log.md` | `RESULTADOS-DEPOIS.md` |
| UX-016 | 🟠 | ✅ Resolvido | FR-013 | T002, T015, T018 | `746cfd3`, `c85f436` | (células lidas em produção) | `RESULTADOS-DEPOIS.md` |
| UX-021 | 🟠 | ✅ Resolvido | FR-012 | T002, T017 | `746cfd3` | (og lido em produção) | `RESULTADOS-DEPOIS.md` |
| UX-007 | ~~🟠~~ | **Retratado** | — | — | — | — | não é defeito: já estava consertado no ar |

**Cobertura:** 6/6 UX-IDs desta feature · 13/13 FR · 9/9 SC. `/speckit-analyze`
fechou sem gap.

---

## 4. Regressões encontradas e tratadas

| O que | Onde apareceu | Tratamento |
|---|---|---|
| O endereço da família aparecia **duas vezes** na célula da tabela | Verificação em produção, logo depois do primeiro deploy | Erro meu ao editar: a mesma substituição pegou a tabela e a lista do celular. Corrigido em `c85f436` e reverificado |
| Risco de `new URL("")` quebrar o `metadataBase` | Antevisto ao mudar `baseUrlEstatica()` | `app/layout.tsx` passa `undefined` quando não há endereço — o Next avisa no build em vez de publicar link quebrado |
| Teste antigo exigia `notes` virando história | `lib/site/provision.test.ts` | O teste codificava o bug. Reescrito para exigir o contrário, com o porquê no comentário |

**Fluxos que funcionavam e continuam funcionando**, conferidos depois do deploy:
`/rsvp/<slug>` (a rota que tem convidado real com link no WhatsApp), a busca do
convite por nome, o modal de presente com Pix copia e cola, o aviso "Já fiz o
Pix", o mural, o cancelamento de pedido e a suíte inteira — **792 testes em 67
arquivos, todos verdes**.

---

## 5. Pendências

### Aberto — fora do escopo desta feature (14 achados)

| Prioridade | Itens |
|---|---|
| 2 · Não perder o que foi digitado | UX-004 🔴, UX-012 🟡 |
| 3 · Convidado e privacidade | UX-008 🟠 |
| 4 · Cores e legibilidade | UX-006 🟠 — **espera decisão sua** |
| 5 · Fricção | UX-009, UX-010, UX-011, UX-013 🟡 |
| 6 · Celular e capa | UX-014, UX-015 🟡 |
| 7 · Polimento | UX-017, UX-018, UX-019, UX-020 🟢 |

**Recomendação de ordem:** a feature 002 (UX-004 + UX-012) é a próxima — UX-004
é 🔴 e é perda de dado real, causada pelo erro mais provável do formulário.

### Decisões que continuam suas

- **UX-006** — alinhar rótulo e papel das cores muda o tema resolvido. Aplicar
  só a pedidos novos, ou a todos os sites, inclusive o casamento real no ar?
- **UX-008** — o rótulo da família é interno (e a tela pública passa a saudar
  pelos nomes) ou é público (e o texto que promete sigilo muda)?
- **WhatsApp na etapa 11** — a revisão do pedido termina com "Prefere combinar
  por mensagem? Chame no WhatsApp", e o `AGENTS.md` lista "a página é a proposta
  (sem funil por WhatsApp)". Não é bug; é escolha de produto.

### Dado de teste deixado em produção

| O quê | Onde |
|---|---|
| Conta `auditoria.e2e.11set@example.com` | pedido `45b47b89…`, site `ana-auditoria-e-bruno-teste` (prévia, 2 fotos, 1 família, 1 confirmação, chave Pix fictícia) |
| Conta `revalidacao.e2e.11set@example.com` | pedido `96913612…`, site `clara-revalida-e-davi-revalida` (prévia, 1 convite, 1 família) |
| Sites órfãos | de 3 pedidos cancelados durante os testes |

Nada disso aparece para o público — site em prévia não é listado nem indexado.
Posso apagar quando você quiser; cancelar o pedido pela interface **não** apaga
o site (o próprio diálogo avisa), então a limpeza completa precisa de decisão
sua sobre como fazer.

---

## 6. Checklist do fluxo completo, em produção

| Etapa | |
|---|---|
| Criar conta | ✅ |
| Login automático e painel | ✅ |
| Questionário de 11 etapas | ✅ |
| **"Criar nosso site" → site criado** | ✅ (antes: HTTP 500) |
| Pedido em "PRÉVIA PRONTA" com link | ✅ |
| Painel · Início | ✅ (antes: HTTP 500) |
| Painel · Conteúdo com os 8 campos | ✅ (antes: vazio, história trocada) |
| Painel · Fotos liberada | ✅ |
| **Criar convite** | ✅ (antes: erro em inglês) |
| Endereço do convite com domínio real | ✅ (antes: `localhost`) |
| Cadastrar família | ✅ |
| **Endereço da família visível e copiável** | ✅ (antes: um traço) |
| QR de site publicado | ✅ (antes: 500) |
| QR de site em prévia → não encontrado | ✅ |
| Cartão do WhatsApp com domínio real | ✅ (antes: `localhost`) |
| Tela de erro em português, com saída | ✅ (antes: inglês, sem saída) |
| Painel no celular (390×844) | ✅ |
| `/rsvp/<slug>` (casamento real) | ✅ sem regressão |

---

## 7. Como revisar

**Já está no ar.** Você autorizou a mesclagem, e `vercel-origin/main` está em
`c85f436`.

Para conferir com os próprios olhos, em ordem de valor:

1. **O cartão do casamento real.** Mande `https://casamentoweb-ten.vercel.app/s/isabelle-e-nycolas`
   para você mesmo no WhatsApp. Antes chegava sem foto; agora o cartão monta.
2. **O funil.** Crie uma conta qualquer, responda o questionário pulando o que
   quiser, e veja o site nascer.
3. **O código.** `git show 746cfd3` — o coração está em `lib/baseUrl.ts` e
   `lib/site/provision.ts`.

**Uma coisa depende de você:** definir `NEXT_PUBLIC_SITE_URL=https://casamentoweb-ten.vercel.app`
no painel da Vercel, como combinado. O código **não precisa** mais dela — ele
descobre o domínio sozinho pelo que a Vercel informa —, mas com ela o endereço
fica explícito e sobrevive a uma eventual mudança de plataforma.

**Se algo der errado:** `git revert 746cfd3 c85f436` devolve o estado anterior.
Nenhuma migração foi criada, nenhuma coluna mudou, nenhum dado foi reescrito —
o rollback é só de código.
