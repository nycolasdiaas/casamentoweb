# Relatório de correções — features 001, 002 e 003

**Data:** 11/09/2026
**Auditoria de origem:** [`AUDITORIA-E2E.md`](./AUDITORIA-E2E.md)
**Features:** `001-ux-provisionamento-e-ambiente` · `002-ux-nao-perder-o-que-foi-digitado` ·
`003-ux-fricao-celular-e-polimento`
**No ar desde:** `5920247` em `vercel-origin/main` (e em `origin`)
**Revalidação completa no ar:** [`evidencias/REVALIDACAO-FINAL.md`](./evidencias/REVALIDACAO-FINAL.md)

---

## 1. Resumo executivo — antes × depois

**Três features, dezoito achados, todos verificados no site no ar.** A 001 devolveu
o funil; a 002 parou a perda de dado; a 003 limpou a fricção que sobrou. Dos 21
achados da auditoria, **16 estão resolvidos, 2 foram retratados (não eram
defeito), 1 foi adiado com justificativa e 2 esperam decisão sua**.

**Antes.** Um casal que respondesse o questionário inteiro em
`casamentoweb-ten.vercel.app` clicava em "Criar nosso site" e recebia **HTTP
500**. O site não era criado. Quem conseguisse passar dali por outro caminho
encontrava o painel sem cerimônia, sem festa, sem traje, e com uma anotação de
bastidor publicada no lugar da história de amor. "Criar convite" derrubava a
página com um erro em inglês. O QR do casamento **que já está no ar** devolvia
500, e o cartão do link que esse casal manda no WhatsApp apontava para
`localhost`. E, na tela de Conteúdo, um dígito errado na chave Pix apagava os
onze campos preenchidos — história de amor inclusive.

**Depois.** O mesmo fluxo, feito do zero em produção com uma conta nova:
"PRÉVIA PRONTA" na hora, painel abrindo, os oito campos do questionário no
lugar certo, convite abrindo com o domínio real no rodapé, QR devolvendo
imagem, e o cartão do WhatsApp do casamento real apontando para
`https://casamentoweb-ten.vercel.app`. Errar a chave Pix agora custa uma
correção de um campo, não o formulário inteiro.

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
| Cadastro | 8,5 | **9,0** | o WhatsApp informado aparece nos dados da conta |
| Criação do casamento | 7,5 | **9,5** | o questionário entrega o que coletou, e avisa antes de deixar passar data errada |
| Navegação | 7,0 | **8,5** | a aba Início deixou de responder 500 |
| Textos | 8,0 | **9,5** | as telas em inglês saíram, inclusive a do upload |
| Organização | 8,0 | 8,0 | sem mudança |
| Feedback | 5,5 | **8,0** | "Site criado!" chega ao casal; falha tem tela com saída; o botão diz o que faz |
| Prevenção de erros | 4,0 | **8,5** | data no passado barrada na hora, limite de texto avisado, erro de Pix não custa mais o formulário |
| Recuperação de erros | 2,0 | **9,0** | tela de erro em português, "tentar de novo", e nenhum erro de validação apaga o que foi digitado |
| Consistência | 6,5 | **8,0** | endereços iguais em todo lugar; a amostra mostra o casal, não a vitrine |
| Quantidade de etapas | 8,0 | 8,0 | sem mudança |
| Pontos de abandono | 1,5 | **8,5** | o abandono estava no clique que fecha a venda; ele sumiu |

### **Nota geral: 4,2 → 8,7**

*(7,6 depois da 001; 8,0 depois da 002; 8,7 depois da 003.)*

O que segura em 8,7 e não em 10 são exatamente **dois achados, e os dois
esperam decisão sua**: as cores trocadas dos seis modelos (UX-006 🟠) e o
rótulo da família que o painel promete ser privado e o convidado lê (UX-008
🟠). Nenhum dos dois é difícil de corrigir; os dois mudam o que o produto
mostra a quem já está no ar, e isso não é escolha minha.

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
| UX-004 | 🔴 | ✅ Resolvido | 002/FR-001, FR-002, FR-003 | 002/T001–T005 | `c1ca29f` | `UX-004.png` | `RESULTADOS-002.md` |
| UX-012 | 🟡 | ✅ Resolvido | 002/FR-004, FR-005 | 002/T006–T009 | `c1ca29f` | (texto lido em produção) | `RESULTADOS-002.md` |
| UX-009 | 🟡 | ✅ Resolvido | 003/FR-001 | 003/T001 | `033feda`, `d812aac` | `UX-009.png` | `REVALIDACAO-FINAL.md` |
| UX-010 | 🟡 | ✅ Resolvido | 003/FR-002 | 003/T002 | `033feda` | `UX-010.png` | `REVALIDACAO-FINAL.md` |
| UX-011 | 🟡 | ✅ Resolvido | 003/FR-003 | 003/T004 | `033feda` | — | `REVALIDACAO-FINAL.md` |
| UX-014 | 🟡 | ✅ Resolvido | 003/FR-004 | 003/T005, T006 | `033feda` | `contexto-site-previa-desktop.png` | `REVALIDACAO-FINAL.md` |
| UX-015 | 🟡 | ✅ Resolvido | 003/FR-005 | 003/T007 | `033feda`, `5920247` | `contexto-site-mobile.png` | `REVALIDACAO-FINAL.md` |
| UX-017 | 🟢 | ✅ Resolvido | 003/FR-006 | 003/T008 | `033feda` | — | `REVALIDACAO-FINAL.md` |
| UX-018 | 🟢 | ✅ Resolvido | 003/FR-007 | 003/T009 | `033feda` | — | `REVALIDACAO-FINAL.md` |
| UX-019 | 🟢 | ✅ Resolvido | 003/FR-008 | 003/T003 | `033feda` | — | `REVALIDACAO-FINAL.md` |
| UX-020 | 🟢 | ⏭️ Adiado | 003/FR-010 | — | — | — | justificativa na spec da 003 |
| UX-006 | 🟠 | 🚫 Bloqueado | — | — | — | `UX-006.png` | espera decisão **A** |
| UX-008 | 🟠 | 🚫 Bloqueado | — | — | — | `UX-008.png` | espera decisão **B** |
| UX-007 | ~~🟠~~ | **Retratado** | — | — | — | — | não é defeito: já estava consertado no ar |
| UX-013 | ~~🟡~~ | **Retratado** | — | — | — | — | era o automatizador de teste rolando a página |

**Cobertura:** 21/21 UX-IDs com destino escrito — 16 resolvidos, 2 retratados, 1
adiado, 2 bloqueados por decisão. 31/31 FR · 16/16 SC.

---

## 4. Regressões encontradas e tratadas

| O que | Onde apareceu | Tratamento |
|---|---|---|
| O endereço da família aparecia **duas vezes** na célula da tabela | Verificação em produção, logo depois do primeiro deploy | Erro meu ao editar: a mesma substituição pegou a tabela e a lista do celular. Corrigido em `c85f436` e reverificado |
| Risco de `new URL("")` quebrar o `metadataBase` | Antevisto ao mudar `baseUrlEstatica()` | `app/layout.tsx` passa `undefined` quando não há endereço — o Next avisa no build em vez de publicar link quebrado |
| Teste antigo exigia `notes` virando história | `lib/site/provision.test.ts` | O teste codificava o bug. Reescrito para exigir o contrário, com o porquê no comentário |
| Uma rodada da suíte falhou com `ECONNRESET` | `lib/site/expirarSites.test.ts`, durante a feature 002 | Queda de conexão com o banco remoto, não defeito: o arquivo passou sozinho (37 testes) e a rodada seguinte fechou **800/800** |
| A trava de data só existia no servidor | Revalidação em produção, depois do deploy da 003 | "Continuar" é navegação do lado do cliente e não fala com o servidor: o casal atravessava nove etapas antes de ouvir falar da data. Corrigido em `d812aac` e reverificado |
| Alvo de toque em 36px/38px, abaixo do mínimo da própria spec | Medição em 390px no site no ar | A primeira tentativa somava paddings. Trocado por `min-h` explícito em `5920247`: 40px nas âncoras, 44px no confirmar presença |

**Fluxos que funcionavam e continuam funcionando**, conferidos depois do deploy:
`/rsvp/<slug>` (a rota que tem convidado real com link no WhatsApp), a busca do
convite por nome, o modal de presente com Pix copia e cola, o aviso "Já fiz o
Pix", o mural, o cancelamento de pedido e a suíte inteira — **800 testes em 69
arquivos, todos verdes** na última rodada.

---

## 5. Pendências

### O que continua aberto: dois achados, e os dois são decisão sua

**Nenhum 🔴 aberto. Nenhum 🟡 aberto. Nenhum 🟢 aberto** (o único, UX-020, foi
adiado com justificativa escrita).

| UX-ID | Sev. | Por que não foi feito |
|---|---|---|
| UX-006 | 🟠 | Alinhar rótulo e papel das cores muda o tema resolvido — e os sites já publicados usam esse tema. Decisão **A** |
| UX-008 | 🟠 | O rótulo da família aparece para o convidado, e o painel promete o contrário. Qual das duas promessas vale é decisão **B** |
| UX-020 | 🟢 | ⏭️ Adiado: exigiria `searchParams` em duas rotas cacheadas, com `cacheComponents` ligado, para confirmar duas ações que já mudam de tela. O que o reabre está escrito na spec da 003 |

**Assim que você responder A e B**, as duas viram uma feature curta: a UX-008 é
uma linha de saudação e um texto de ajuda; a UX-006 é o mapeamento de duas
cores, mais a decisão de aplicar ou não ao que já está no ar.

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
| Conta `revalidacao.final.11set@example.com` | pedido `45a4d244…`, site `bia-final-e-caio-final` (prévia, 1 foto, 1 convite, 1 família com 1 confirmação, chave Pix fictícia) |
| Sites órfãos | de 3 pedidos cancelados durante os testes |

Nada disso aparece para o público — site em prévia não é listado nem indexado.
Posso apagar quando você quiser; cancelar o pedido pela interface **não** apaga
o site (o próprio diálogo avisa), então a limpeza completa precisa de decisão
sua sobre como fazer.

---

## 6. Checklist do fluxo completo, em produção

*Refeito do zero em 11/09/2026 com a conta `revalidacao.final.11set@example.com`,
depois do deploy `5920247`. Detalhe em
[`evidencias/REVALIDACAO-FINAL.md`](./evidencias/REVALIDACAO-FINAL.md).*

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
| Data no passado barrada na etapa | ✅ (antes: passava calado) |
| Aviso do limite de 5.000 caracteres | ✅ (antes: cortava calado) |
| Botão "Salvar rascunho" com nome honesto | ✅ (antes: "Salvar e sair", que não saía) |
| Arquivo inválido com mensagem em português | ✅ (antes: em inglês) |
| Amostra de cores com os nomes do casal | ✅ (antes: "Ana & Pedro") |
| WhatsApp nos dados da conta | ✅ (antes: não aparecia) |
| Linha da capa sem número de casa | ✅ (antes: "300 — BOA VISTA, …") |
| Alvos de toque ≥ 40px (44px no confirmar) | ✅ (antes: 12px e 30px) |
| Chave Pix errada não apaga o formulário | ✅ |
| Mural da prévia diz a verdade e guarda o texto | ✅ |
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
3. **A tela de Conteúdo.** Preencha, erre a chave Pix de propósito e salve: a
   mensagem aparece e nada do que você escreveu se perde.
4. **O código.** `git show 746cfd3` (o coração está em `lib/baseUrl.ts` e
   `lib/site/provision.ts`) e `git show c1ca29f`.

**Uma coisa depende de você:** definir `NEXT_PUBLIC_SITE_URL=https://casamentoweb-ten.vercel.app`
no painel da Vercel, como combinado. O código **não precisa** mais dela — ele
descobre o domínio sozinho pelo que a Vercel informa —, mas com ela o endereço
fica explícito e sobrevive a uma eventual mudança de plataforma.

**Se algo der errado:** `git revert c1ca29f c85f436 746cfd3` devolve o estado anterior.
Nenhuma migração foi criada, nenhuma coluna mudou, nenhum dado foi reescrito —
o rollback é só de código.
