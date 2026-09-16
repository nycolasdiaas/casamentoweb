# Auditoria E2E de usabilidade — Enlace (casamentoweb-ten.vercel.app)

**Data:** 11/09/2026
**Auditor:** Claude Opus 5 (Claude Code), navegando com chrome-devtools MCP
**Método:** uso real da interface, como um casal que nunca viu o produto. Nenhuma
consulta ao código antes do teste — o código só foi aberto **depois** de cada
sintoma aparecer na tela, para explicar a causa.

---

## 1. Resumo executivo

A Enlace é um produto **bem escrito e bem desenhado**. O questionário de 11 etapas é
fluido, guarda o que foi digitado a cada volta, recarga e saída; a escrita é humana e
específica; o site do convidado não emite **um único erro de console**; a confirmação
de presença funciona, inclusive a edição da resposta, e passa limpa no celular. Há
acertos que quase ninguém faz — as 34 fontes renderizadas com o nome real do casal, o
botão "É no mesmo lugar da cerimônia", o diálogo de cancelamento que diz a verdade
sobre a consequência.

E, hoje, **em produção, um casal novo não consegue terminar.**

Ao clicar em "Criar nosso site" no fim do questionário, o site **não é criado**. O
pedido fica em "PEDIDO RECEBIDO", a aba Fotos diz "o site ainda está sendo montado" —
e a tela Início do painel responde **HTTP 500**. Reproduzido em dois pedidos
independentes, do zero. A causa é uma só e está em `lib/baseUrl.ts`: `getBaseUrl()`
**lança exceção** quando `NEXT_PUBLIC_SITE_URL` não está definida e o host não está na
allowlist — e `casamentoweb-ten.vercel.app` **não está na allowlist** (a lista tem
`casamentoweb.vercel.app`, sem o `-ten`). Tudo que depende dessa função cai junto:
provisionar o site, a tela Início, criar convite (tela de erro **em inglês**) e o QR do
site publicado — este último atingindo **o casamento real que já está no ar**.

Confirmado por eliminação: o mesmo fluxo, rodando em `localhost` contra o **mesmo banco
de produção**, provisiona o site e cria o convite sem erro. O que muda entre os dois é a
variável de ambiente.

Debaixo desse bloqueio há dois problemas que existiriam mesmo com o ambiente correto:

- **O pedido resgatado pela rede de segurança nasce sem o conteúdo do questionário.**
  Quando o envio falha e o site é criado depois pela rota de reprovisionamento — que é o
  caminho de **todos** os pedidos enviados em produção desde que o ambiente quebrou —,
  local, endereço e horário da cerimônia, local, endereço e horário da festa e o traje
  **não chegam ao site**, e a "história de vocês" é substituída pela resposta de "mais
  alguma coisa que a gente precisa saber?". No nosso teste, o site anunciava "A avó
  Antônia faz o bolo" como a história de amor do casal.
- **Um erro de validação apaga tudo.** Salvar o Conteúdo com uma chave Pix inválida
  devolve uma mensagem correta sobre o Pix — e zera os **onze** campos preenchidos,
  história inteira inclusive.

**Nota geral: 4,2 / 10.** O artesanato da superfície vale 8,5. O caminho de ponta a
ponta, que é o que o casal compra, vale 2. Quase tudo que separa os dois é conserto de
poucas linhas.

---

## 2. Ambiente testado

| | |
|---|---|
| **URL principal** | https://casamentoweb-ten.vercel.app (produção) |
| **URL de apoio** | http://localhost:3100 (`next dev`, **mesmo banco** de produção) |
| **Navegador** | Chrome 142 via chrome-devtools MCP |
| **Viewports** | 1440×900 (desktop) e 390×844 (celular, com emulação de toque) |
| **Conta de teste** | `auditoria.e2e.11set@example.com` — "Ana Auditoria & Bruno Teste" |
| **Pedido 1** | `45b47b89-386b-4cc0-a7be-26185a8bfab8` · pacote Para Sempre · site `ana-auditoria-e-bruno-teste` |
| **Pedido 2** | `34ccaf41-11e4-48cd-8fc5-f8344a2eec69` · pacote Convite · criado para reproduzir o 🔴 e **cancelado** ao fim |
| **Pedidos 3 e 4** | `f04a995b…` e `0a4d18ea…` · criados **em ambiente sadio** para isolar a causa da UX-003, e **cancelados** ao fim |
| **Casamento fictício** | 15/08/2027, modelo Toscana, fonte Great Vibes |

**Por que o localhost entrou.** O bloqueio da UX-001 impede provisionar o site em
produção. Para auditar o resto do produto (painel, convites, RSVP, presentes, mural) foi
preciso destravar o pedido — e o caminho honesto foi rodar a **mesma rota de
reprovisionamento** a partir de um servidor local apontado para o mesmo banco. Nenhum
SQL, nenhuma escrita fora da interface. **Um casal real não tem esse atalho.**

**Duas contaminações que este atalho deixou — e que NÃO são defeito do produto:**

1. O `previewUrl` gravado no pedido 1 ficou `http://localhost:3000/...`, porque foi o
   servidor local que provisionou e ele lê `NEXT_PUBLIC_SITE_URL` do `.env.local`. Por
   isso o link "Ver o site" e o endereço mostrado na tela de publicar aparecem como
   `localhost:3000`. Em produção sadia seria o domínio real.
2. A prévia embutida no painel (o quadro "Como está ficando") aponta para esse mesmo
   endereço local e por isso aparece vazia quando aberta em produção.

**Um erro de método, e o que ele custou.** Durante a Fase 3 descobri que o checkout local
estava **sete commits atrás** de `vercel-origin/main`, que é a branch que a Vercel publica.
Os achados observados **em produção** não são afetados — produção sempre rodou o código
novo. Mas seis achados eu havia exercitado no servidor local: UX-003, UX-007, UX-008,
UX-012, UX-015 e UX-016. Todos foram **refeitos em produção** antes de qualquer correção.
Resultado: **UX-007 caiu** (já estava consertado no código publicado) e **UX-016 piorou**
(em produção a função some por inteiro). Os outros quatro se confirmaram. O checkout foi
atualizado para `9a33c77` antes de escrever qualquer linha de código.

**O que NÃO foi testado, e por quê:** o pagamento. O botão "Pagar e publicar · R$ 99,90"
leva ao checkout da AbacatePay com chave real; disparar cobrança exige autorização
explícita do dono. Tudo até a porta do checkout foi exercitado. Por consequência, o site
nunca foi publicado, e o que só existe depois da publicação (mural gravando recado,
endereço público, QR do próprio site) foi verificado pelo comportamento das rotas, não
pelo uso.

---

## 3. Fluxo E2E realizado

```
Home (/)  ─ desktop e celular
  └─ "Criar meu site" → /conta/criar
       ├─ enviar vazio → validação nativa em PT-BR ✅
       ├─ e-mail sem "@" e senha de 3 letras → barrado ✅
       └─ cadastro válido → login automático → /conta
            ├─ "Sair da conta" → volta para a home ✅
            ├─ login com senha errada → "E-mail ou senha incorretos.",
            │   e-mail preservado, senha limpa ✅
            └─ login correto → /conta
                 └─ "Fazer meu pedido" → questionário de 11 etapas
                      ├─ 1 pacote (nada pré-selecionado ✅) → Para Sempre
                      ├─ 2 nomes + data ── data 01/01/2020 ACEITA ❌ UX-009
                      ├─ 3 cerimônia (local, endereço, 16:30)
                      ├─ 4 festa — atalho "É no mesmo lugar" ✅ → depois trocado
                      ├─ 5 traje — atalho "Esporte fino" ✅
                      ├─ 6 história (acentos, emoji, parágrafos)
                      ├─ 7 modelo + prévia ao vivo ── a prévia sai da tela ❌ UX-013
                      ├─ 8 cores ── chega com aviso de contraste ❌ UX-006
                      ├─ 9 tipografia (34 fontes com o nome do casal ✅)
                      ├─ 10 observações ── "Salvar e sair" não sai ❌ UX-011
                      │     └─ recarregar a página: tudo preservado ✅
                      └─ 11 revisão (tudo correto na tela ✅)
                           └─ "Criar nosso site"
                                ├─ pedido = "PEDIDO RECEBIDO", site NÃO criado ❌
                                └─ Início do painel → HTTP 500 ❌❌ UX-001
                                     (repetido do zero num 2º pedido: idêntico)

  [destravado por reprovisionamento via servidor local]

  Painel do casal (10 abas)
    ├─ Conteúdo ── 7 respostas vazias e história trocada, porque o pedido
    │    │            veio pelo resgate e não pelo envio ❌❌ UX-003
    │    ├─ Pix inválido → mensagem certa, mas apaga os 11 campos ❌❌ UX-004
    │    └─ Pix válido → "Salvo ✓ — o site já está com o conteúdo novo." ✅
    ├─ Fotos ── arquivo não suportado → erro em inglês ❌ UX-010
    │    └─ 2 fotos enviadas, entram no site na hora ✅
    ├─ Convites ── "Criar convite" → tela de erro em inglês, 500 ❌❌ UX-002
    │    └─ (no local: editor de convite completo, funciona ✅)
    ├─ Convidados ── família cadastrada ✅, mas sem link para enviar ❌ UX-016
    ├─ Presentes ── 7 cotas + chave Pix cadastrada ✅
    ├─ Visual ── troca de estilo/cor/fonte, com o mesmo aviso de contraste ❌ UX-006
    ├─ Páginas ── ligar/desligar/ordenar seções ✅
    ├─ Recados ── vazio (o mural só grava com o site no ar) ✅
    ├─ Compartilhar ── explica que o link só existe depois de publicar ✅
    └─ Início ── "Publicar site" → "Pagar e publicar · R$ 99,90"  [PAREI AQUI]

  Visão do convidado
    ├─ /s/<slug>/meu-convite ── busca por nome
    │    ├─ nome inexistente → mensagem gentil e certeira ✅
    │    └─ "Antônia Souza" → convite pessoal …
    │         └─ … que exibe o rótulo PRIVADO da família ❌ UX-008
    ├─ /rsvp/<slug> ── "Sim, vamos!", 2 de 2, nomes, recado → confirmado ✅
    │    ├─ aparece no painel do casal com nomes e recado ✅
    │    ├─ "Adicionar à agenda" → .ics 200 ✅
    │    └─ em PRODUÇÃO, e no celular: funciona ✅
    ├─ Presentes → modal com Pix copia e cola e QR, valor da cota no código ✅
    │    └─ "Já fiz o Pix" → "Muito obrigado!" e a cota aparece no painel ✅
    ├─ Mural → erro "Não achamos esse casamento" e apaga o recado ❌ UX-012
    └─ Console do navegador: zero erros ✅
```

**Caminhos alternativos exercitados:** formulário vazio; e-mail malformado; senha curta;
senha errada no login; data no passado; história com 5.200 caracteres; emoji, acentos e
parágrafos; voltar e avançar etapas; salvar parcialmente e retomar; recarregar no meio do
preenchimento; sair da conta e voltar; editar conteúdo já salvo; chave Pix inválida;
arquivo não suportado no upload; nome inexistente na busca do convite; cancelar o
cancelamento ("Manter o pedido"); cancelar o pedido de verdade; criar um segundo pedido;
pular todas as etapas opcionais; desktop e celular.

---

## 4. Checklist das etapas testadas

| Etapa | Situação |
|---|---|
| Home entende-se em 5 segundos | ✅ |
| Home no celular | ✅ |
| Criar conta | ✅ |
| Validação de campos do cadastro | ✅ |
| Login / logout / login de novo | ✅ |
| Senha errada | ✅ |
| Esqueci a senha | ➖ não exercitado (não recebo e-mail) |
| Verificação de e-mail | ➖ não existe no produto hoje |
| Orientação do que fazer primeiro | ✅ |
| Questionário — pacote | ✅ |
| Questionário — nomes e data | ⚠️ UX-009 (data no passado aceita) |
| Questionário — cerimônia / festa / traje | ✅ na tela, ❌ no destino (UX-003) |
| Questionário — história | ⚠️ UX-019 (corte silencioso em 5.000) |
| Questionário — modelo com prévia | ⚠️ UX-013 |
| Questionário — cores | ⚠️ UX-006 |
| Questionário — tipografia | ✅ |
| Questionário — revisão | ✅ |
| Voltar uma etapa e avançar | ✅ |
| Recarregar no meio | ✅ |
| Salvar e sair / retomar | ⚠️ UX-011 (salva, mas não sai nem confirma) |
| **Enviar o pedido e receber o site** | ❌ **UX-001 — bloqueado em produção** |
| Painel — Início | ❌ UX-001 (HTTP 500) |
| Painel — Conteúdo | ❌ UX-003, UX-004 |
| Painel — Visual | ⚠️ UX-006, UX-018 |
| Painel — Páginas | ✅ |
| Painel — Fotos | ⚠️ UX-010 |
| Painel — Convites | ❌ UX-002 (500 em produção) |
| Painel — Convidados | ❌ UX-016 · ⚠️ UX-008 |
| Painel — Presentes | ✅ |
| Painel — Recados | ✅ |
| Painel — Compartilhar | ✅ |
| Painel no celular | ✅ |
| Cancelar pedido (com confirmação honesta) | ✅ |
| Site do convidado — desktop | ⚠️ UX-014 |
| Site do convidado — celular | ⚠️ UX-015 |
| Convidado acha o convite pelo nome | ✅ |
| Confirmação de presença (RSVP) | ✅ |
| RSVP em produção e no celular | ✅ |
| Editar a resposta do RSVP | ✅ |
| Adicionar à agenda (.ics) | ✅ |
| Presentes — Pix copia e cola e QR | ✅ |
| Presentes — "Já fiz o Pix" | ✅ (UX-007 retratado) |
| Mural de recados | ⚠️ UX-012 |
| QR do site publicado | ❌ UX-005 |
| Publicar / pagar | ➖ parei na porta do checkout |
| Álbum pós-festa | ➖ placeholder conhecido |
| Erros no console do site | ✅ nenhum |

---

## 5. Tabela de severidade

| Severidade | Quantidade |
|---|---|
| 🔴 Crítico | 4 |
| 🟠 Alto | 5 |
| 🟡 Médio | 7 |
| 🟢 Baixo | 4 |
| **Total** | **20** + 1 retratado (UX-007) |

| Tipo | Quantidade |
|---|---|
| Funcional | 9 |
| Usabilidade | 5 |
| Conteúdo / Texto | 4 |
| Visual | 2 |
| Acessibilidade | 1 |

---

## 6. Problemas críticos

### UX-001 — O site não nasce ao enviar o questionário, e o painel devolve HTTP 500
- **Severidade:** 🔴 Crítico
- **Tipo:** Funcional
- **Onde:** `/conta/pedido/novo` (etapa 11) → `/conta/pedidos/<id>` → `/api/pedido/provisionar`
- **Viewport:** Ambos · **Ambiente:** produção (não reproduz em localhost)
- **Ação realizada:**
  1. Responder o questionário até a etapa 11 e clicar em "Criar nosso site".
  2. Observar o cabeçalho do painel: "PEDIDO RECEBIDO".
  3. Abrir a aba Fotos: "O site de vocês ainda está sendo montado."
  4. Clicar em "Início".
- **Resultado esperado:** o pedido vira "PRÉVIA PRONTA", o site existe e o painel abre —
  é o que a própria etapa 11 promete: *"Ao enviar, o site é criado na hora e vocês já
  sobem as fotos."*
- **Resultado atual:** o site **não é criado**. A tela Início redireciona para
  `/api/pedido/provisionar?pedido=<id>`, que responde **HTTP 500** com corpo vazio. O
  casal vê a tela de erro do navegador ("Esta página não está funcionando"). Recarregar
  não resolve. **Reproduzido em dois pedidos criados do zero.**
- **Impacto:** é o fim da linha. O casal pagou nada ainda, mas respondeu 11 etapas e
  recebeu um erro de servidor. Não há como seguir, não há explicação e não há para onde
  voltar. Abandono garantido — e, para o dono, venda perdida sem aviso nenhum.
- **Evidência:** `docs/auditoria/evidencias/UX-001.png`
- **Causa provável no código:** `lib/baseUrl.ts`. `getBaseUrl()` lê
  `NEXT_PUBLIC_SITE_URL`; se ela não existir, deriva do Host **e só aceita hosts da
  allowlist** (`localhost:3000`, `casamentoweb.vercel.app`, `enlace.com.br`,
  `www.enlace.com.br`). O host de produção é **`casamentoweb-ten.vercel.app`**, que não
  está lá — então a função **lança**: *"Host não confiável e NEXT_PUBLIC_SITE_URL não
  definida"*. `submitOrderAction` (via `provisionSiteForOrder`) e
  `app/api/pedido/provisionar/route.ts:57` chamam essa função. Prova por eliminação: o
  mesmo pedido, aberto no `localhost:3100` (que tem a variável no `.env.local`) contra o
  **mesmo banco**, provisiona na hora e devolve 307.
- **Sugestão:** duas frentes, e vale fazer as duas.
  1. **Ambiente (dono):** definir `NEXT_PUBLIC_SITE_URL=https://casamentoweb-ten.vercel.app`
     no projeto da Vercel. Resolve hoje, sem mudança de código — mas exige um novo build
     (Redeploy): variável `NEXT_PUBLIC_*` é embutida na compilação. *(Correção de
     14/09/2026: a versão original dizia "sem deploy". Feito e verificado nessa data.)*
  2. **Código:** acrescentar o domínio à `ALLOWED_HOSTS` e, principalmente, **parar de
     derrubar a página inteira** por causa de um link: quem chama `getBaseUrl()` para
     montar um endereço deve conseguir seguir sem ele, e o erro tem que aparecer como
     aviso ao casal, não como 500.
- **Status:** ✅ **Resolvido** — feature `001-ux-provisionamento-e-ambiente`, verificado em produção em 11/09/2026 (ver `RELATORIO-CORRECOES.md`)

### UX-002 — "Criar convite" derruba a página com um erro em inglês
- **Severidade:** 🔴 Crítico
- **Tipo:** Funcional
- **Onde:** `/conta/pedidos/<id>/convites` → botão "Criar convite"
- **Viewport:** Ambos · **Ambiente:** produção (não reproduz em localhost)
- **Ação realizada:** abrir a aba Convites e clicar em "Criar convite".
- **Resultado esperado:** abrir o editor de convite (que existe e é bom: camadas,
  formatos, seis modelos, salvamento automático — verificado em localhost).
- **Resultado atual:** a tela inteira é substituída por
  **"This page couldn't load — A server error occurred. Reload to try again. ERROR
  4188337955"**. Em inglês, com um número de erro, sem volta.
- **Impacto:** o convite digital é o produto do pacote de R$ 9,90 e a porta de entrada
  do RSVP nos outros dois. Sem ele não há o que mandar no WhatsApp. E o casal encontra
  uma tela de erro em inglês num produto todo escrito em português.
- **Evidência:** `docs/auditoria/evidencias/UX-002.png`
- **Causa provável no código:** mesma raiz da UX-001 — `app/actions/invite-actions.ts:59`
  e `app/conta/convites/[conviteId]/page.tsx:62` chamam `getBaseUrl()`.
- **Sugestão:** a correção da UX-001 resolve. Independentemente dela, esta tela precisa
  de um `error.tsx` em português que diga o que houve e ofereça um caminho.
- **Status:** ✅ **Resolvido** — feature `001-ux-provisionamento-e-ambiente`, verificado em produção em 11/09/2026 (ver `RELATORIO-CORRECOES.md`)

### UX-003 — O pedido resgatado pela rede de segurança nasce sem o conteúdo do questionário, e com a história trocada
- **Severidade:** 🔴 Crítico
- **Tipo:** Funcional
- **Onde:** `/api/pedido/provisionar` → `/conta/pedidos/<id>/conteudo`
- **Viewport:** Ambos · **Ambiente:** os dois (é código, não ambiente)
- **Ação realizada:**
  1. Preencher no questionário: local e endereço da cerimônia, horário (16:30), local e
     endereço da festa, horário da festa (19:00), traje ("Esporte fino") e a história de
     vocês (três parágrafos).
  2. Conferir na etapa 11: **tudo aparece certo**.
  3. Enviar o pedido, ter o envio falhado (UX-001), e o site ser criado depois pela rota
     de reprovisionamento.
  4. Abrir a aba Conteúdo.
- **Resultado esperado:** o site nasce com o que o casal respondeu, **por qualquer um dos
  dois caminhos**. É a promessa central: *"o casal não trabalha"*.
- **Resultado atual:** oito campos chegam **vazios** — horário da cerimônia, local da
  cerimônia, endereço da cerimônia, link do mapa, local da festa, endereço da festa,
  horário da festa e traje. E o campo "A HISTÓRIA DE VOCÊS" vem preenchido com a resposta
  de *"Mais alguma coisa que a gente precisa saber?"* — no teste, o site do casal
  apresentava **"A avó Antônia faz o bolo — se der, um cantinho contando isso seria
  lindo."** como a história de amor deles. A história verdadeira sumiu.
  O próprio painel denuncia: em "O que falta", "Onde é a cerimônia → Preencher".
- **Impacto:** o casal responde 11 etapas e precisa **digitar tudo de novo**, sem que
  ninguém avise. Quem não reparar publica um site com uma anotação de bastidor no lugar da
  própria história. Como a UX-001 empurra **todo** pedido de produção para esse caminho de
  resgate, hoje isto atinge 100% dos pedidos enviados.
- **Evidência:** `docs/auditoria/evidencias/UX-003.png`
- **Causa provável no código — corrigida em 11/09/2026, depois de um teste controlado:**
  a primeira leitura desta auditoria dizia que o conteúdo *nunca* era copiado. **Está
  errado, e o registro fica.** `submitOrderAction` (`app/actions/account-actions.ts:337`)
  copia sim, via `parseContentForm` + `saveSiteContent`, no mesmo request do envio.
  Verificado com dois pedidos criados do zero num ambiente sadio: local, endereço e
  horário da cerimônia, local e endereço da festa, traje e a história **chegaram todos**.
  O defeito real é outro, e é mais estreito:
  1. Essa cópia mora **dentro do mesmo `try` que começa com `await getBaseUrl()`**. Com a
     UX-001 no ar, a exceção acontece na primeira linha e nada depois dela roda — nem o
     provisionamento, nem o conteúdo.
  2. A rede de segurança (`app/api/pedido/provisionar`) provisiona **sem** o conteúdo do
     questionário, porque `lib/site/provision.ts` grava só três colunas — `coupleNames`,
     `weddingDate` e `story` — e ainda põe `order.notes` em `story`, no lugar de
     `order.story`.
  Resultado: todo pedido que passa pelo resgate perde o que o casal digitou.
- **Sugestão:** (a) tirar `getBaseUrl()` de dentro do bloco que provisiona e salva o
  conteúdo, para que uma falha de endereço não leve o conteúdo junto; (b) fazer o
  provisionamento copiar todos os campos do pedido (`weddingTime`, `ceremonyVenue`,
  `ceremonyAddress`, `receptionVenue`, `receptionAddress`, `receptionTime`, `dressCode`) e
  usar `order.story` para a história, de modo que os dois caminhos entreguem a mesma
  coisa. Migração não é necessária: as colunas já existem em `site_content`.
- **Status:** ✅ **Resolvido** — feature `001-ux-provisionamento-e-ambiente`, verificado em produção em 11/09/2026 (ver `RELATORIO-CORRECOES.md`)

### UX-004 — Um erro na chave Pix apaga os onze campos que o casal acabou de preencher
- **Severidade:** 🔴 Crítico
- **Tipo:** Funcional / Usabilidade
- **Onde:** `/conta/pedidos/<id>/conteudo` → "Salvar e atualizar o site"
- **Viewport:** Ambos · **Ambiente:** os dois
- **Ação realizada:**
  1. Preencher os 11 campos do Conteúdo (nomes, horários, locais, endereços, traje,
     história inteira, recado dos presentes).
  2. Digitar `abc` na chave Pix.
  3. Salvar.
- **Resultado esperado:** a mensagem sobre o Pix — que existe e é excelente: *"Não
  reconhecemos essa chave. Use CPF, CNPJ, e-mail, celular com DDD ou a chave aleatória do
  banco."* — e **tudo o mais intacto** para corrigir só o Pix.
- **Resultado atual:** a mensagem aparece, e **os onze campos voltam ao estado anterior**.
  A história inteira, os endereços, os horários, o traje: perdidos. O campo história volta
  a mostrar o texto antigo. Conferido lendo os `value` de todos os campos depois do erro.
- **Impacto:** perda de dado direta, causada pelo erro mais provável do formulário (a
  chave Pix é o único campo com formato exigente). O casal escreve a própria história,
  erra um dígito do Pix e recomeça do zero — se perceber, porque a mensagem de erro fica
  **abaixo dos botões**, fora da tela em quem rolou até o fim.
- **Evidência:** `docs/auditoria/evidencias/UX-004.png`
- **Causa provável no código:** a ação do formulário rejeita o salvamento inteiro e a
  tela é re-renderizada a partir do estado do servidor, sem devolver o que foi digitado.
- **Sugestão:** validar sem descartar — devolver os valores digitados junto do erro (ou
  validar a chave Pix no cliente, antes do envio), marcar o campo com problema e levar o
  foco até ele.
- **Status:** ✅ **Resolvido** — feature `002-ux-nao-perder-o-que-foi-digitado`, verificado em produção em 11/09/2026

---

## 7. Problemas de usabilidade

### UX-006 — Os seis modelos entregam a paleta trocada, e a tela acusa contraste ruim na chegada
- **Severidade:** 🟠 Alto
- **Tipo:** Visual / Acessibilidade
- **Onde:** questionário etapa 8 ("As cores de vocês") e painel → Visual
- **Viewport:** Ambos · **Ambiente:** os dois
- **Ação realizada:** escolher qualquer modelo na etapa 7 e avançar para a etapa 8.
- **Resultado esperado:** a paleta do modelo aplicada com sentido — a cor escura como
  tinta do texto, a cor clara como acento — e nenhum aviso, já que é a paleta que o
  próprio produto desenhou.
- **Resultado atual:** o campo rotulado **"Cor do texto — a tinta, títulos e parágrafos"**
  recebe sempre o **acento claro**, e **"Cor principal — o acento"** recebe a **tinta
  escura**. Com isso, o cartão de amostra mostra "Ana & Pedro" em dourado sobre creme e a
  própria tela avisa: *"O texto vai ficar difícil de ler sobre esse fundo, principalmente
  no celular e para quem enxerga pouco."* Medido nos seis modelos, sempre igual:

  | Modelo | "Cor principal" (acento) | "Cor do texto" (tinta) | Fundo |
  |---|---|---|---|
  | Clássico | `#3d4a36` escuro | `#b8985f` dourado | `#f2efe7` |
  | Moderno | `#1c1c1c` escuro | `#bd5b32` laranja | `#fafafa` |
  | Romântico | `#7c4a55` escuro | `#d9a3ae` rosa claro | `#fdf2f4` |
  | Toscana | `#33351f` escuro | `#9c8654` dourado | `#f3eddd` |
  | Film | `#3c3227` escuro | `#a5603a` terracota | `#f3ebda` |
  | Editorial | `#141414` escuro | `#7c7c78` cinza | `#f5f3ef` |

- **Impacto:** todo casal que escolhe um modelo é recebido por um aviso de que o próprio
  modelo está ilegível. Ou ele ignora o aviso e publica um site difícil de ler no celular
  — que é onde o convidado abre —, ou passa a desconfiar do produto logo na terceira
  tela. O aviso, que é um acerto de acessibilidade, vira ruído por disparar sempre.
- **Evidência:** `docs/auditoria/evidencias/UX-006.png`
- **Causa no código — corrigida em 11/09/2026, depois de ler o código:** a primeira
  leitura culpou o mapeamento entre `primaryColor`/`secondaryColor` e os papéis
  `tinta`/`acento`. **Não era isso.** Esse alinhamento já tinha sido feito de propósito —
  há comentário em `OrderWizard.tsx` explicando que os rótulos foram escritos para seguir
  o que `resolveTheme` faz, justamente para não repintar site já provisionado.
  O que estava trocado era o **preenchimento ao escolher o modelo**: `swatches` é
  `[papel, tinta, acento]`, e `escolherModelo` punha a tinta na cor 1 (que vira o acento)
  e o acento na cor 2 (que vira a tinta). Duas variáveis cruzadas.
- **Sugestão aplicada:** a conversão saiu para `lib/theme/coresDoModelo.ts`, com teste que
  tranca a invariante nos seis modelos. **A decisão que eu havia pedido não era
  necessária:** o tema é resolvido e gravado uma vez, no provisionamento, e nada recalcula
  o que está no banco — a correção muda só o ponto de partida de um pedido novo, e nenhum
  site publicado muda de aparência.
- **O que fica em aberto (menor):** os sites provisionados **antes** desta correção
  nasceram com a tinta e o acento trocados e continuam assim. Recuperá-los significa
  repintar site de gente que já mandou o link — é decisão do dono, e não é urgente.
- **Status:** ✅ **Resolvido** — feature `004-ux-cores-e-privacidade`, verificado em produção em 11/09/2026

### UX-008 — O rótulo da família, que o painel promete ser privado, aparece para o convidado
- **Severidade:** 🟠 Alto
- **Tipo:** Conteúdo / Usabilidade (privacidade)
- **Onde:** `/conta/pedidos/<id>/convidados` → `/s/<slug>/meu-convite` e `/rsvp/<slug>`
- **Viewport:** Ambos · **Ambiente:** os dois
- **Ação realizada:**
  1. Cadastrar uma família. O campo "Nome da família" diz, embaixo: *"Do jeito que vocês
     chamam eles. **Só vocês veem este nome.**"*
  2. Escrever "Família Souza — tios da noiva".
  3. Abrir o convite como convidado.
- **Resultado esperado:** o convidado vê algo neutro, ou o próprio nome — nunca o apelido
  interno.
- **Resultado atual:** o convite abre com **"Olá, Família Souza — tios da noiva"** e a
  tela de RSVP pergunta **"Família Souza — tios da noiva, vocês vêm?"**.
- **Impacto:** a interface pede explicitamente um nome informal e garante sigilo. Um casal
  que confie nessa frase pode escrever qualquer coisa — "os chatos do trabalho", "tios que
  ninguém aguenta" — e mandar no WhatsApp da família. É constrangimento real, causado por
  uma promessa do próprio produto.
- **Evidência:** `docs/auditoria/evidencias/UX-008.png`
- **Causa provável no código:** o `label` do grupo é usado como saudação nas telas
  públicas (`/s/[slug]/meu-convite` e `/rsvp/[slug]`).
- **Sugestão aplicada:** o rótulo parou de ir para as telas públicas — é a leitura que
  respeita o que já foi prometido a quem preencheu confiando na frase. A prop `grupo` foi
  **removida** de `ConfirmacaoDePresenca`, não tornada opcional, e um teste estrutural
  (`lib/site/rotulo-do-grupo-e-privado.test.ts`) tranca a fronteira.
- **O que ficou de fora:** saudar pelos **nomes dos convidados** seria mais caloroso que
  o "Vocês vêm?" neutro, mas exige uma coluna a mais na consulta de `/rsvp/<slug>` — rota
  crítica e cacheada. Fica como melhoria possível.
- **Status:** ✅ **Resolvido** — feature `004-ux-cores-e-privacidade`, verificado em produção em 11/09/2026

### UX-011 — "Salvar e sair" salva, mas não sai e não confirma
- **Severidade:** 🟡 Médio
- **Tipo:** Usabilidade
- **Onde:** questionário, botão no topo direito
- **Viewport:** Ambos
- **Ação realizada:** na etapa 10, com tudo preenchido, clicar em "Salvar e sair".
- **Resultado esperado:** uma confirmação ("rascunho guardado") e a saída para o painel.
- **Resultado atual:** a URL muda para `/conta/pedido/<id>`, o cabeçalho vira "RASCUNHO ·
  Continuar o pedido de vocês" — e o casal continua **na mesma etapa 10**, olhando o mesmo
  formulário. Nenhuma mensagem diz que salvou. (O salvamento em si funciona: conferido
  campo a campo, nada se perdeu — e isso é uma melhora real em relação ao histórico.)
- **Impacto:** quem clica em "sair" espera sair. Sem confirmação e sem mudança de lugar,
  a dúvida é "salvou?", e o reflexo é clicar de novo.
- **Evidência:** sem captura — comportamento observado e descrito acima.
- **Sugestão:** ou o botão leva mesmo para `/conta/pedidos` com um aviso de rascunho
  guardado, ou ele passa a se chamar "Salvar rascunho" e mostra um "salvo ✓" ali mesmo.
- **Status:** ✅ **Resolvido** — feature `003-ux-fricao-celular-e-polimento`

### UX-013 — ~~Trocar o modelo rola a página~~ · **RETRATADO em 11/09/2026**
- **Severidade:** ~~🟡 Médio~~ → **não é defeito**
- **Status:** **Retratado — era o meu automatizador, não o produto**

**O que eu registrei:** que escolher outro modelo na etapa 7 rolava a página de
scrollY ≈ 1105 para ≈ 433, tirando a prévia da tela.

**Por que estava errado:** eu cliquei o cartão pelo chrome-devtools MCP, e **ele rola o
elemento para dentro da viewport antes de clicar**. A prévia estava na tela porque eu
tinha rolado até ela; o cartão, não. O scroll que medi foi o do meu próprio instrumento
entrando em quadro.

**Medido de novo**, clicando por script (`card.click()`), sem rolar nada:

```
scrollY antes ....... 990
scrollY depois ...... 990
modelo selecionado .. film
```

A página não se move. A prévia continua onde estava e troca à vista, que é o
comportamento que a etapa promete.

**A lição fica:** instrumento de automação tem efeito colateral, e medir "antes e depois"
sem saber disso produz achado que não existe. A verificação honesta foi feita pelo
caminho que o usuário usa — o clique —, não pelo que o robô usa.

### UX-015 — Alvos de toque de 12px na navegação do site do convidado
- **Severidade:** 🟡 Médio
- **Tipo:** Acessibilidade
- **Onde:** site do convidado, barra de seções (História · O dia · Presentes · Galeria ·
  Recados · Álbum)
- **Viewport:** Celular (390×844)
- **Ação realizada:** medir a área clicável de cada link da barra.
- **Resultado esperado:** pelo menos ~44px de altura, que é a recomendação para toque.
- **Resultado atual:** 12px de altura (larguras de 25 a 44px). "Abrir o painel" tem 19px.
- **Impacto:** o convidado é majoritariamente de celular e a barra é a navegação principal
  do site. Alvo de 12px erra muito — e erra mais na mão de convidado mais velho.
- **Evidência:** `docs/auditoria/evidencias/contexto-site-mobile.png` (medição no texto).
- **Sugestão:** aumentar a área tocável com padding vertical, sem mexer no tamanho da
  fonte nem no desenho.
- **Status:** ✅ **Resolvido** — feature `003-ux-fricao-celular-e-polimento`

### UX-016 — Em produção, o casal não consegue pegar o link da família
- **Severidade:** 🟠 Alto
- **Tipo:** Funcional / Usabilidade
- **Onde:** `/conta/pedidos/<id>/convidados`, coluna "ENDEREÇO"
- **Viewport:** Ambos · **Ambiente:** produção
- **Ação realizada:** cadastrar uma família e procurar o endereço que ela deve receber.
- **Resultado esperado:** o endereço da família, visível e copiável.
- **Resultado atual:** a célula mostra apenas **"—"**. Não há botão, não há endereço, não
  há como mandar o link para a família. (No servidor local, onde o endereço base existe, a
  célula mostra um botão "Copiar link" — e ainda assim **nunca** mostra o endereço em si.)
- **Impacto:** a confirmação de presença é o que separa o pacote de R$ 9,90 do de R$ 29,90.
  Sem o link, ela não chega a ninguém: o casal cadastra as famílias e não tem o que enviar.
- **Evidência:** conteúdo das células lido em produção — `["…","2","2 de 2 vêm","…","…","—"]`.
- **Causa provável no código:** `app/conta/pedidos/[id]/convidados/page.tsx:202` —
  `{base && <CopiarLink …/>}`. O `base` vem de `getBaseUrl()` num `try/catch` que devolve
  `null` em produção (UX-001). A tela, corretamente, não quebra — mas a função some sem
  dizer nada. Mesmo com o `base` presente, o endereço continua invisível: só o botão
  aparece.
- **Sugestão:** corrigir a UX-001 traz o botão de volta; além disso, **mostrar o endereço
  como texto** ao lado do botão, para o casal poder conferir e digitar se precisar.
- **Status:** ✅ **Resolvido** — feature `001-ux-provisionamento-e-ambiente`, verificado em produção em 11/09/2026 (ver `RELATORIO-CORRECOES.md`)

### UX-017 — O WhatsApp do cadastro não tem máscara e some depois
- **Severidade:** 🟢 Baixo
- **Tipo:** Usabilidade
- **Onde:** `/conta/criar` e `/conta` (Dados da conta)
- **Resultado atual:** o campo sugere "(11) 98888-7777", aceita `11999998888` sem formatar
  — e o número não aparece em "Dados da conta" depois, nem há onde conferir ou corrigir.
- **Impacto:** é o canal pelo qual a Enlace avisa quando algo trava. Um dígito errado
  passa despercebido para sempre.
- **Sugestão:** formatar enquanto digita e mostrar o número (editável) nos dados da conta.
- **Status:** ✅ **Resolvido** — feature `003-ux-fricao-celular-e-polimento`

### UX-018 — A amostra de cores mostra outro casal
- **Severidade:** 🟢 Baixo
- **Tipo:** Conteúdo
- **Onde:** painel → Visual, cartão "Save the Date"
- **Resultado atual:** a amostra que reage às cores escolhidas mostra **"Ana & Pedro · 16
  de outubro de 2026 · Fortaleza"** — o casal fictício da vitrine — mesmo com o casal já
  cadastrado. O questionário faz melhor: as 34 fontes aparecem com o nome real.
- **Impacto:** a amostra perde força e o casal fica sem ver como a escolha fica com o
  próprio nome.
- **Sugestão:** usar os dados do site, como a etapa da tipografia já faz.
- **Status:** ✅ **Resolvido** — feature `003-ux-fricao-celular-e-polimento`

### UX-020 — Ações importantes terminam em silêncio
- **Severidade:** 🟢 Baixo
- **Tipo:** Usabilidade
- **Onde:** "Sair da conta" e "Cancelar pedido"
- **Resultado atual:** ambas funcionam e levam para o lugar certo (home e lista de
  pedidos), mas nenhuma diz o que aconteceu — nem "vocês saíram", nem "pedido cancelado".
  O diálogo de confirmação do cancelamento, esse, é exemplar.
- **Sugestão:** uma linha de confirmação no destino.
- **Status:** ✅ **Resolvido** — feature `005-ux-o-que-faltava`
- **Como foi resolvido:** a confirmação viaja no **fragmento** do endereço
  (`/conta/pedidos#cancelado`, `/#saiu`), que nunca chega ao servidor — então as duas rotas
  continuam cacheadas, que era exatamente o custo que tinha feito eu adiar. Um componente
  no cliente lê o fragmento, escreve o recado e limpa o endereço, para recarregar não
  repetir a confirmação de algo que aconteceu uma vez.

### UX-021 — O cartão do link no WhatsApp aponta para `localhost` (encontrado na Fase 3)
- **Severidade:** 🟠 Alto
- **Tipo:** Funcional
- **Onde:** `/s/<slug>` (metadados de compartilhamento) e painel → Início (endereço mostrado ao casal)
- **Viewport:** Ambos · **Ambiente:** produção
- **Ação realizada:** baixar o HTML de dois sites **publicados** em produção e ler as
  etiquetas de compartilhamento.
- **Resultado esperado:** o endereço público real do site.
- **Resultado atual:** para o casamento real que já está no ar:
  ```
  og:url   = http://localhost:3000/s/isabelle-e-nycolas
  og:image = http://localhost:3000/s/isabelle-e-nycolas/opengraph-image?v=3bab1550
  ```
  O mesmo acontece com o site de demonstração. E, no painel, o casal lê
  *"O endereço localhost:3000/s/… só entra no ar depois do pagamento."*
- **Impacto:** quando o casal manda o link no grupo da família, o WhatsApp tenta buscar a
  imagem em `localhost` e não acha: o convite chega como um endereço seco, sem foto e sem
  nome. O produto promete *"é só mandar no grupo da família"* e **"a página é a
  proposta"* — e é exatamente essa página que aparece quebrada na conversa. Atinge o
  casamento real que já está no ar.
- **Evidência:** resposta HTTP registrada acima, obtida em produção em 11/09/2026.
- **Causa provável no código:** `lib/baseUrl.ts` → `baseUrlEstatica()`. Diferente de
  `getBaseUrl()`, ela **não lança**: cai silenciosamente em `http://localhost:3000` quando
  `NEXT_PUBLIC_SITE_URL` não existe. É a mesma variável ausente da UX-001, com o sintoma
  invertido — lá derruba a página, aqui mente baixinho. Usada em `app/layout.tsx`
  (`metadataBase`), `app/s/[slug]/opengraph-image.tsx`, `app/c/[slug]/page.tsx`,
  `app/conta/pedidos/[id]/page.tsx`, `lib/email.ts` (links dos e-mails) e nos dois crons.
- **Sugestão:** dar a `baseUrlEstatica()` a mesma descoberta automática de endereço da
  UX-001 (endereço configurado → endereço da plataforma → localhost só em
  desenvolvimento).
- **Status:** ✅ **Resolvido** — feature `001-ux-provisionamento-e-ambiente`, verificado em produção em 11/09/2026 (ver `RELATORIO-CORRECOES.md`)

### UX-005 — O QR do site publicado devolve 500 em produção (inclusive o do casamento real)
- **Severidade:** 🟠 Alto
- **Tipo:** Funcional
- **Onde:** `/api/qr/<slug>` · **Ambiente:** produção
- **Ação realizada:** requisitar o QR de dois sites publicados.
- **Resultado esperado:** o SVG do QR (a rota existe para o casal mandar para a gráfica).
- **Resultado atual:** `GET /api/qr/ana-e-pedro → 500` e
  `GET /api/qr/isabelle-e-nycolas → 500`. O segundo é **o casamento real que está no ar**.
- **Impacto:** o casal que tentar imprimir o QR do convite não consegue, sem entender por
  quê. É o único achado desta auditoria que atinge um cliente que já pagou.
- **Evidência:** `docs/auditoria/evidencias/UX-005-log.md`
- **Causa provável no código:** mesma raiz da UX-001. A rota devolve 404 para slug
  inexistente ou não publicado **antes** de chamar `getBaseUrl()`
  (`app/api/qr/[slug]/route.ts:31`); logo, um 500 significa que passou dali e a falha veio
  da função.
- **Sugestão:** corrigir a UX-001.
- **Status:** ✅ **Resolvido** — feature `001-ux-provisionamento-e-ambiente`, verificado em produção em 11/09/2026 (ver `RELATORIO-CORRECOES.md`)

### UX-007 — ~~"Já fiz o Pix" falha sempre~~ · **RETRATADO em 11/09/2026**
- **Severidade:** ~~🟠 Alto~~ → **não é defeito**
- **Status:** **Retratado — não reproduz em produção**

**O que eu registrei:** que o convidado clicava em "Já fiz o Pix", nada acontecia, e o
painel do casal seguia em "0 cotas escolhidas". Causa apontada:
`registerContributionAction` resolvendo o site com `getLegacySiteId()`.

**Por que estava errado:** aquele teste rodou no **servidor local**, e o meu checkout
estava **sete commits atrás** do que a Vercel publica. O commit `b84cffd` ("Presentes: o
aviso do convidado chega ao casal"), já no ar, mudou exatamente essa ação para receber o
`siteId` do site que o convidado está vendo.

**O que produção faz hoje**, verificado na interface: o modal responde *"Muito obrigado!
Tia Antônia, seu carinho já está guardado com a gente."*, e a aba Presentes do casal passa
a mostrar **"ESCOLHIDAS · 1 cota escolhida · R$ 320"** e **"QUEM JÁ PRESENTEOU · Tia
Antônia · Jogo de panelas"**. O laço fecha.

**Fica como registro** de que a verificação foi feita — e do erro de método que a produziu,
corrigido na seção 2.

### UX-009 — Data de casamento no passado é aceita sem aviso
- **Severidade:** 🟡 Médio
- **Tipo:** Funcional
- **Onde:** questionário, etapa 2
- **Ação realizada:** digitar 01/01/2020 e clicar em "Continuar".
- **Resultado esperado:** um aviso — "essa data já passou, confiram" — antes de seguir.
- **Resultado atual:** avança para a etapa 3 sem nenhuma observação. O valor fica gravado.
- **Impacto:** um ano errado (2026 em vez de 2027) passa batido e alimenta a contagem
  regressiva, a capa e o álbum pós-festa. O casal só descobre olhando o site.
- **Evidência:** `docs/auditoria/evidencias/UX-009.png`
- **Sugestão:** avisar (sem bloquear) quando a data for anterior a hoje, e confirmar.
  O `min` do `<input type="date">` resolve metade; a outra metade é a mensagem.
- **Status:** ✅ **Resolvido** — feature `003-ux-fricao-celular-e-polimento`

### UX-010 — Erro de upload aparece em inglês
- **Severidade:** 🟡 Médio
- **Tipo:** Conteúdo / Texto
- **Onde:** painel → Fotos
- **Ação realizada:** escolher um arquivo `.svg` (a tela avisa "JPG, PNG ou WebP").
- **Resultado esperado:** "Esse arquivo não é uma foto. Use JPG, PNG ou WebP."
- **Resultado atual:** **"The source image could not be decoded."**
- **Impacto:** o casal recebe uma mensagem técnica, em inglês, num produto todo em
  português — e ela não diz o que fazer.
- **Evidência:** `docs/auditoria/evidencias/UX-010.png`
- **Causa provável no código:** a mensagem crua da API do navegador (`createImageBitmap`)
  chega à tela sem tradução.
- **Sugestão:** conferir o tipo do arquivo antes de tentar decodificar e escrever a
  mensagem na voz do produto.
- **Status:** ✅ **Resolvido** — feature `003-ux-fricao-celular-e-polimento`

### UX-012 — O mural da prévia diz "Não achamos esse casamento" e apaga o recado
- **Severidade:** 🟡 Médio
- **Tipo:** Conteúdo / Usabilidade
- **Onde:** site do convidado (prévia) → Mural de recados
- **Ação realizada:** escrever nome e recado na prévia e enviar.
- **Resultado esperado:** "o mural começa a valer quando o site estiver no ar" — que é a
  regra real, e é correta.
- **Resultado atual:** aparece **"Não achamos esse casamento."** e os dois campos são
  esvaziados.
- **Impacto:** a mensagem diz uma coisa falsa (o casamento existe; o casal está olhando
  para ele) e some com o texto escrito. Quem vai testar o próprio mural conclui que o
  site está quebrado.
- **Evidência:** sem captura — texto do formulário lido após o envio.
- **Causa provável no código:** `app/actions/guestbook-actions.ts:41` usa a mesma
  mensagem para "site não existe" e para "site ainda não publicado".
- **Sugestão:** separar os dois casos, escrever o segundo na voz do produto e preservar o
  que foi digitado.
- **Status:** ✅ **Resolvido** — feature `002-ux-nao-perder-o-que-foi-digitado`, verificado em produção em 11/09/2026

### UX-014 — A linha de lugar da capa começa pelo número da casa
- **Severidade:** 🟡 Médio
- **Tipo:** Visual / Conteúdo
- **Onde:** capa do site do convidado (todos os moldes)
- **Ação realizada:** informar "Praça da Sé, 100 — Sé, São Paulo/SP" como endereço da
  cerimônia.
- **Resultado esperado:** "SÃO PAULO — SP", ou a cidade sozinha.
- **Resultado atual:** **"100 — SÉ, SÃO PAULO/SP"**. A linha da capa começa com o número
  do imóvel.
- **Impacto:** é a primeira linha do site, em caixa alta e entreletra larga. Começar por
  "100 —" faz o convite parecer quebrado.
- **Evidência:** `docs/auditoria/evidencias/contexto-site-previa-desktop.png`
- **Causa provável no código:** `lib/site/lugar.ts` pega os **dois últimos trechos**
  separados por vírgula. No formato brasileiro mais comum ("Rua X, 123 — Bairro,
  Cidade/UF"), esses dois últimos são "123 — Bairro" e "Cidade/UF".
- **Sugestão:** preferir o último trecho quando o penúltimo começar por número, ou pedir
  cidade/estado num campo próprio.
- **Status:** ✅ **Resolvido** — feature `003-ux-fricao-celular-e-polimento`

### UX-019 — História colada acima de 5.000 caracteres é cortada em silêncio
- **Severidade:** 🟢 Baixo
- **Tipo:** Funcional
- **Onde:** questionário, etapa 6
- **Resultado atual:** o campo tem `maxlength=5000` e um contador. Colar um texto maior
  faz o navegador cortar no limite, sem aviso — o contador simplesmente marca 5000/5000.
- **Impacto:** quem escreveu a história no WhatsApp e colou pode perder o final sem notar.
- **Sugestão:** avisar quando o texto colado for maior que o limite.
- **Status:** ✅ **Resolvido** — feature `003-ux-fricao-celular-e-polimento`

---

## 9. Pontos positivos

1. **Nenhum erro de console** no site do convidado, em desktop e celular.
2. **O RSVP funciona em produção**, ponta a ponta: busca por nome, confirmação, número de
   lugares, nomes de quem vai, recado, `.ics` da agenda, edição da resposta depois. No
   celular passa limpo — **zero** alvos de toque abaixo de 40px e nenhuma rolagem lateral.
3. **O questionário não perde nada** ao voltar, ao recarregar, ao sair e voltar. Conferido
   campo a campo. Era o defeito mais grave do histórico do produto, e está resolvido.
4. **Nenhum pacote vem pré-selecionado** e "Continuar" fica desabilitado até a escolha.
5. **Acentos, emoji e parágrafos** sobrevivem inteiros do questionário ao site, e do
   recado do convidado ao painel do casal.
6. **A escrita é humana e específica**: "Um site pronto antes do café esfriar",
   "Guardando os dados de vocês com segurança", "Em branco = a lista aparece sem forma de
   pagamento", "Até 25 letras, sem acento — é limite do padrão do Pix, não nosso".
7. **O diálogo de cancelamento é honesto** sobre a consequência, inclusive sobre o que
   **não** acontece: "Se o site já esteve no ar, ele continua no ar".
8. **O erro de chave Pix é modelo de mensagem**: diz o que não deu e lista o que serve.
9. **Site não publicado tem página própria** — "Esta lista está fora do ar por enquanto…
   o link está certo" — em vez de um 404 seco.
10. **Atalhos que economizam digitação**: "É no mesmo lugar da cerimônia" (copia local e
    endereço) e os quatro botões de traje.
11. **As 34 fontes são renderizadas com o nome real do casal.**
12. **O aviso de contraste existe** e explica o risco no celular — a intenção é ótima,
    mesmo disparando indevidamente (UX-006).
13. **O painel diz o que falta** ("3 DE 6", com botão em cada pendência).
14. **Validação nativa em PT-BR** no cadastro, e-mail preservado e senha limpa quando o
    login falha.

---

## 10. Sugestões de melhoria (além das correções)

1. **Uma tela de erro em português para todo o produto.** Hoje uma falha de servidor cai
   no `global-error` do Next, em inglês, com um número. Um `error.tsx` na voz da Enlace
   transformaria a UX-002 de abandono em contratempo.
2. **Monitorar 500 em produção.** As quatro falhas críticas desta auditoria estão no ar
   há tempo indeterminado e nada avisou ninguém. Um alerta simples (Vercel + e-mail)
   pagaria por si na primeira vez.
3. **Um teste de fumaça do fluxo de compra.** Um teste automatizado que crie conta,
   responda o questionário e verifique que o site nasceu teria pego a UX-001 e a UX-003
   antes do deploy.
4. **Verificar o ambiente no boot.** `NEXT_PUBLIC_SITE_URL` é essencial e sua ausência só
   aparece como 500 numa rota específica. Falhar cedo e alto, no build, seria mais barato.
5. **Mostrar a prévia ao lado do questionário desde a etapa 2**, não só na 7 — o casal
   veria o próprio conteúdo nascendo, e o abandono no meio cairia.
6. **Pedir cidade/estado num campo próprio**, resolvendo a UX-014 na origem e melhorando
   o mapa.
7. **Confirmar a data por extenso** na etapa 2 ("sábado, 15 de agosto de 2027") — resolve
   a UX-009 com uma frase, sem bloquear ninguém.

---

## 11. Prioridade de correção

**Ordem proposta, agrupada por área:**

| # | Área | Itens | Por quê primeiro |
|---|---|---|---|
| 1 | **Ambiente, provisionamento e conteúdo** | UX-001, UX-002, UX-003, UX-005, UX-016, UX-021 | Uma só causa para três deles, e sem ela nenhum casal novo termina. A UX-003 entra junto porque mora na mesma rota de resgate. Atinge também o cliente que já pagou (UX-005). |
| 2 | **Não perder o que foi digitado** | UX-004, UX-012 | Perda de dado causada pelo erro mais provável do formulário. |
| 3 | **Convidado e privacidade** | UX-008 | Atingem quem o casal convidou — e um deles expõe texto que o produto prometeu esconder. |
| 4 | **Cores e legibilidade** | UX-006 | Afeta todo site novo, mas mexe em tokens que sites vivos usam → decisão do dono antes. |
| 5 | **Fricção do questionário e do painel** | UX-009, UX-010, UX-011, UX-013 | Melhoram muito por pouco código. |
| 6 | **Celular e capa** | UX-014, UX-015 | O convidado é de celular. |
| 7 | **Polimento** | UX-017, UX-018, UX-019, UX-020 | Depois do resto. |

---

## 12. Avaliação final de UX

| Critério | Nota | Por quê |
|---|---:|---|
| Cadastro | 8,5 | Curto, validado, com login automático e boa escrita. Falta a máscara do WhatsApp. |
| Criação do casamento | 7,5 | O questionário em si é muito bom; perde pela data no passado e pela prévia que foge. |
| Navegação | 7,0 | Painel de 10 abas legível e com "o que falta"; a aba Início devolve 500. |
| Textos | 8,0 | Excelentes em português; furados por duas telas de erro em inglês. |
| Organização | 8,0 | Etapas, abas e agrupamentos fazem sentido de primeira. |
| Feedback | 5,5 | "Salvo ✓" é exemplar; "Já fiz o Pix" e "Salvar e sair" não dizem nada. |
| Prevenção de erros | 4,0 | Aceita data no passado; deixa salvar paleta ilegível; não avisa do corte de texto. |
| Recuperação de erros | 2,0 | O 500 não tem saída; o erro de Pix apaga onze campos; o mural apaga o recado. |
| Consistência | 6,5 | O questionário usa o nome do casal, o painel usa "Ana & Pedro"; rótulo privado que não é privado. |
| Quantidade de etapas | 8,0 | 11 etapas, quase todas puláveis, com progresso visível. |
| Pontos de abandono | 1,5 | O abandono está no clique mais importante do funil: "Criar nosso site". |

### **Nota geral: 4,2 / 10**

**A justificativa.** Se a nota medisse artesanato, seria 8,5: escrita, desenho,
microcópia, estados de carregamento, tratamento de site fora do ar, RSVP no celular — há
cuidado real em quase tudo que se vê. Mas a nota mede **o que o usuário consegue fazer**,
e hoje, em produção, um casal que responde o questionário inteiro recebe um HTTP 500 e
para ali. Não existe nota alta com o funil interrompido no clique que fecha a venda.

O que segura a nota em 4,2, e não abaixo, é que **nada disso é estrutural**. A UX-001, a
UX-002 e a UX-005 são uma variável de ambiente e um host fora de uma lista. A UX-003 são
sete colunas que ninguém copiou. A UX-007 é uma função monotenant que sobrou numa ação
pública. O produto não está mal construído — está mal ligado.

---

## 13. Índice de rastreabilidade

| UX-ID | Severidade | Área | Status | Feature SDD | Tasks |
|---|---|---|---|---|---|
| UX-001 | 🔴 Crítico | Provisionamento / ambiente | ✅ Resolvido | 001-ux-provisionamento-e-ambiente | T001–T019 |
| UX-002 | 🔴 Crítico | Convites / ambiente | ✅ Resolvido | 001-ux-provisionamento-e-ambiente | T001–T019 |
| UX-003 | 🔴 Crítico | Provisionamento (rede de segurança) | ✅ Resolvido | 001-ux-provisionamento-e-ambiente | T001–T019 |
| UX-004 | 🔴 Crítico | Painel · Conteúdo | ✅ Resolvido | 002-ux-nao-perder-o-que-foi-digitado | T001–T014 |
| UX-005 | 🟠 Alto | QR / ambiente | ✅ Resolvido | 001-ux-provisionamento-e-ambiente | T001–T019 |
| UX-021 | 🟠 Alto | Compartilhamento / ambiente | ✅ Resolvido | 001-ux-provisionamento-e-ambiente | T001–T019 |
| UX-006 | 🟠 Alto | Cores e tema | ✅ Resolvido | 004-ux-cores-e-privacidade | ver tasks.md |
| UX-007 | ~~🟠~~ | Presentes (convidado) | **Retratado** — não reproduz em produção | — | — |
| UX-008 | 🟠 Alto | Convidados / privacidade | ✅ Resolvido | 004-ux-cores-e-privacidade | ver tasks.md |
| UX-009 | 🟡 Médio | Questionário | ✅ Resolvido | 003-ux-fricao-celular-e-polimento | ver tasks.md |
| UX-010 | 🟡 Médio | Painel · Fotos | ✅ Resolvido | 003-ux-fricao-celular-e-polimento | ver tasks.md |
| UX-011 | 🟡 Médio | Questionário | ✅ Resolvido | 003-ux-fricao-celular-e-polimento | ver tasks.md |
| UX-012 | 🟡 Médio | Mural (convidado) | ✅ Resolvido | 002-ux-nao-perder-o-que-foi-digitado | T001–T014 |
| UX-013 | ~~🟡~~ | Questionário | **Retratado** — era o automatizador de teste | — | — |
| UX-014 | 🟡 Médio | Site do convidado · capa | ✅ Resolvido | 003-ux-fricao-celular-e-polimento | ver tasks.md |
| UX-015 | 🟡 Médio | Site do convidado · celular | ✅ Resolvido | 003-ux-fricao-celular-e-polimento | ver tasks.md |
| UX-016 | 🟠 Alto | Painel · Convidados | ✅ Resolvido | 001-ux-provisionamento-e-ambiente | T001–T019 |
| UX-017 | 🟢 Baixo | Cadastro / conta | ✅ Resolvido | 003-ux-fricao-celular-e-polimento | ver tasks.md |
| UX-018 | 🟢 Baixo | Painel · Visual | ✅ Resolvido | 003-ux-fricao-celular-e-polimento | ver tasks.md |
| UX-019 | 🟢 Baixo | Questionário | ✅ Resolvido | 003-ux-fricao-celular-e-polimento | ver tasks.md |
| UX-020 | 🟢 Baixo | Conta / pedidos | ✅ Resolvido | 005-ux-o-que-faltava | T005–T007 |

---

## Anexo — o que é decisão do dono

- **`[DECISÃO NECESSÁRIA]` · UX-006, alcance da correção.** Alinhar rótulo e papel das
  cores muda o tema resolvido. Aplicar só a pedidos novos, ou a todos os sites — inclusive
  o casamento real no ar?
- **`[DECISÃO NECESSÁRIA]` · UX-008, qual promessa vale.** O rótulo da família é interno
  (e a tela pública passa a saudar pelos nomes) ou é público (e o texto de ajuda muda)?
- **`[DECISÃO NECESSÁRIA]` · WhatsApp na etapa 11.** A revisão do pedido termina com
  *"Prefere combinar por mensagem? Chame no WhatsApp."* — o `AGENTS.md` lista como
  promessa do produto **"a página é a proposta (sem funil por WhatsApp)"**. Ou o texto
  sai, ou a promessa é revista. Não é bug; é escolha de produto.
- **Fora de escopo, registrado.** `guests.rsvp_status` × `groups.seats_confirmed`
  continuam como duas verdades (AGENTS.md §2). Nada nesta auditoria depende de unificar,
  e unificar segue sendo decisão do dono.
- **Limpeza de produção.** Esta auditoria deixou no banco real: a conta
  `auditoria.e2e.11set@example.com`, o pedido `45b47b89…` com o site
  `ana-auditoria-e-bruno-teste` (em prévia, 2 fotos, 1 família, 1 confirmação, chave Pix
  fictícia) e um site órfão do pedido `34ccaf41…`, que foi cancelado. Nada disso é
  visível para o público — sites em prévia não aparecem —, mas está lá para ser apagado
  quando o dono quiser.

### UX-022 — "Quantos dos 1 lugar vão?" (encontrado no reteste de 14/09/2026)

- **Severidade:** 🟢 Baixa
- **Onde:** `/rsvp/<slug>` de grupo com 1 lugar, depois de "Sim, vamos!"
- **O que acontece:** a pergunta do contador flexiona "lugar/lugares", mas não o
  "dos": sai "Quantos dos 1 lugar vão?". O título logo acima já trata o singular
  certo ("Dona Ivete, você vem?").
- **Evidência:** `evidencias/RETESTE-14SET.md`
- **Sugestão:** no singular, perguntar só "Quantas pessoas vão?" — o contador
  abaixo já diz "de 1 reservado".
- **Status:** ✅ **Resolvido** — feature `005-ux-o-que-faltava` (T017–T019), commit `8ea7271`, verificado em produção em 14/09/2026: grupo de 1 lugar mostra "Quantas pessoas vão?"

### UX-023 — Fontes que a tela não usa são baixadas em toda página (encontrado no 2º reteste de 14/09/2026)

- **Severidade:** 🟡 Média — atinge o convidado no celular, na rota que não pode falhar
- **Onde:** todas as rotas; pior em `/s/<slug>` e no questionário
- **O que acontece:** o manifesto de fontes do build manda pré-carregar fontes dos
  seis moldes e das 34 prévias de tipografia em rotas que não as usam. Medido no
  build de produção e no navegador:
  - `/rsvp/<slug>`: **17 arquivos, 421 KB baixados; 3 famílias em uso**
  - `/conta` e telas do painel: 17 arquivos (~416 KB)
  - `/s/<slug>` (site do casal): 44 arquivos (~1 MB), das 27 famílias dos seis moldes
  - `/conta/pedido/novo`: 45 arquivos (~985 KB)
- **Evidência:** `evidencias/RETESTE-2-14SET.md`; `.next/server/next-font-manifest.json`;
  console do Chrome ("preloaded using link preload but not used")
- **Sugestão:** `preload: false` nas fontes dos moldes (`lib/templates/*/fonts.ts`) e
  nas prévias (`components/account/wizard/fontPreview.ts`). A fonte continua
  carregando quando o CSS a usa; o que some é o download antecipado.
- **Status:** ✅ **Resolvido** — feature `005-ux-o-que-faltava` (T020–T023), commit `e674047`, verificado em produção em 14/09/2026: RSVP baixa 6 arquivos (105 KB, era 17 / 421 KB), casamento real 6 (era 44), painel sem aviso de fonte; prévia Toscana e as 34 prévias da tipografia carregando

---

## Teste exploratório em produção — 15/09/2026 (método SARGENTO)

Além dos 23 achados: rotas inválidas, APIs sem login, cabeçalhos de segurança, links
internos, login/cadastro/"esqueci a senha" com dados errados, Lighthouse, e os caminhos
alternativos do RSVP ("Não posso", confirmação parcial, editar a resposta). Evidência em
`evidencias/SARGENTO-15SET.md`.

### UX-024 — Editar a resposta do RSVP grava, mas não confirma

- **Severidade:** 🟠 Alta — na rota que não pode falhar
- **Onde:** `/rsvp/<slug>` → "Editar resposta" → nova escolha → enviar
- **O que acontece:** a resposta é gravada (o painel mostra a mudança), mas a tela volta
  ao formulário, sem "Resposta enviada". O convidado não tem como saber que deu certo.
- **Causa:** `components/site/ConfirmacaoDePresenca.tsx` escondia o sucesso com um
  booleano `reabrir` que ficava verdadeiro para sempre depois de "Editar resposta".
- **Status:** ✅ **Resolvido** — commit `6feb97b`, verificado em produção em 15/09/2026: editar a resposta e reenviar mostra "Resposta enviada"

### UX-025 — "vocês vêm?" com minúscula para família sem nomes

- **Severidade:** 🟡 Média — o convidado lê
- **Onde:** `/rsvp/<slug>` de grupo cadastrado só com o número de lugares
- **Causa:** o título era saudação + pronome; sem nomes, sobrava o pronome minúsculo.
- **Status:** ✅ **Resolvido** — commit `6feb97b`, verificado em produção: `/rsvp/cj8DgByQ` mostra "Vocês vêm?"

### UX-026 — Cadastro aceita WhatsApp incompleto

- **Severidade:** 🟡 Média — é o canal de socorro do casal
- **Onde:** `/conta/criar`
- **O que acontece:** "(81) 9" é aceito e gravado.
- **Causa:** o `pattern` do campo (`[\s()+\-0-9]{10,20}`) é inválido na flag `v` que o
  navegador usa, então é ignorado; e `signupAction` não conferia o número.
- **Status:** ✅ **Resolvido** — commit `6feb97b`, verificado em produção: o navegador barra e o servidor responde "Confira o WhatsApp — com DDD, são 10 ou 11 números."

### UX-027 — Erro de formulário não é anunciado ao leitor de tela

- **Severidade:** 🟢 Baixa
- **Onde:** todo campo que usa `components/ui/prensa/Campo.tsx` (ex.: "E-mail ou senha incorretos.")
- **Causa:** a mensagem tinha `aria-describedby`, mas não `role="alert"`.
- **Status:** ✅ **Resolvido** — commit `6feb97b`, verificado em produção em 15/09/2026: a mensagem tem `role="alert"` e o campo a referencia por `aria-describedby`

### UX-028 — Itens "não incluído" dos pacotes com contraste abaixo do mínimo

- **Severidade:** 🟡 Média — é a página que vende
- **Onde:** home (`components/landing/Pacotes.tsx`) e `/pacotes` (`app/pacotes/page.tsx`)
- **O que acontece:** o que **não** vem no pacote aparece em cinza claro demais. Medido:
  `#9c9fa3` sobre branco = **2,66:1** na home (a tinta secundária a 60% de opacidade) e
  `#8b9099` = **3,21:1** em `/pacotes`. O mínimo da WCAG AA para texto é 4,5:1.
- **Evidência:** Lighthouse da home (acessibilidade 90, `color-contrast` reprovado) em
  `evidencias/SARGENTO-15SET.md`
- **Correção:** tinta secundária cheia (`--c-ink-2`, `#5a5f66`) nos dois — **6,43:1** no
  tema claro e 6,75:1 no escuro. O incluído segue em 16,9:1, então a hierarquia fica de pé.
  Os símbolos `—` e `✕` continuam terciários: são decorativos e saem do leitor de tela.
- **Status:** ✅ **Resolvido** — commit `7cf04ee`, verificado em produção em 15/09/2026: home e `/pacotes` medidos em 6,43:1 (eram 2,66 e 3,21); Lighthouse da home subiu de 90 para 94

### UX-029 — O painel de avisos abre cortado

- **Severidade:** 🟠 Alta — o sino é o único lugar onde o casal vê o que aconteceu
- **Onde:** qualquer tela do painel, botão do sino (`components/account/manage/Avisos.tsx`)
- **O que acontece:** o painel abre, mas só a primeira faixa ("AVISOS · ÚLTIMOS 30 DIAS")
  aparece; o resto é cortado na borda da casca. Relatado pelo dono com captura de tela em
  15/09/2026.
- **Causa:** `components/account/manage/CascaDoPainel.tsx` tinha `overflow-hidden` na casca
  para arredondar a base. O painel do sino é `absolute` e nasce dentro dessa casca, então
  era recortado junto.
- **Correção:** o recorte sai da casca e vai para a faixa de abas, que é quem precisa dele
  (`rounded-b-[3px] overflow-hidden` na própria faixa). O painel deixa de ser cortado e os
  cantos continuam arredondados.
- **Status:** Em correção — feature `005-ux-o-que-faltava` (T033)

### UX-030 — Não dava para editar nem tirar uma família da lista

- **Severidade:** 🟠 Alta — pedido do dono em 15/09/2026
- **Onde:** `/conta/pedidos/<id>/convidados`
- **O que acontecia:** o casal cadastrava a família e pronto. Nome errado, lugares a mais
  ou família duplicada ficavam na lista para sempre. `apagarFamiliaAction` existia no
  servidor sem botão nenhum; editar não existia.
- **Decisão do dono (consultado o agente `regras-de-negocio`):** remover **não apaga**. A
  resposta do convidado é dado de terceiro e o backup automático não a guarda
  (`groups_backup` tem id, slug, label e created_at, e nada de `seats_confirmed`,
  `attending_names` ou `message`). Então a família sai da lista, a resposta fica gravada, e
  `/rsvp/<slug>` continua respondendo com um aviso em vez de 404.
- **Correção:** migração aditiva 0026 (`groups.removed_at`), `removerFamiliaDaLista` e
  `atualizarFamilia` no repositório, `editarFamiliaAction` com a guarda de pacote que
  faltava, e os botões Editar/Remover na lista (tabela e cartões). O slug nunca muda;
  renomear pessoa é `update` na linha dela, para não zerar `guests.rsvp_status`.
- **Status:** Em correção — feature `005-ux-o-que-faltava` (T034–T037)

### UX-031 — "Vocês saíram da conta." não sai da tela

- **Severidade:** 🟡 Média
- **Onde:** `/` depois de sair da conta, e `/conta/pedidos` depois de cancelar um pedido
- **O que acontece:** o aviso aparece e fica plantado enquanto a pessoa navega. Relatado
  pelo dono com captura de tela em 15/09/2026.
- **Causa:** `components/ui/prensa/AvisoPorHash.tsx` mostrava o recado e nunca o escondia —
  ele só sumia ao trocar de página.
- **Correção:** o recado some sozinho em sete segundos. O leitor de tela já o anunciou
  quando entrou; o `role="status"` não depende de ele continuar visível.
- **Status:** Em correção — feature `005-ux-o-que-faltava` (T038)

### UX-032 — Pagamento não iniciava para quem não tinha WhatsApp na conta

- **Severidade:** 🔴 Crítica — impede a venda
- **Onde:** `/conta/pedidos/<id>` → "Pagar e publicar"
- **O que acontecia:** o casal clicava e lia "Não conseguimos iniciar o pagamento agora.
  Tente de novo em instantes ou fale no WhatsApp." Relatado pelo dono em 15/09/2026.
- **Causa, medida contra a API do AbacatePay:** o provedor exige `customer` com nome,
  e-mail, **telefone** e CPF. Cobrança sem `customer.cellphone` devolve **422**
  (`Expected property 'customer.cellphone' to be string but found: undefined`) e sem
  `customer` nenhum devolve **400** (`Customer not found`). O WhatsApp é opcional no
  cadastro — quem não preencheu não conseguia pagar. O `catch` da ação engolia o motivo,
  então o log não dizia nada.
- **O que eu supus errado antes de medir:** que a máscara `(81) 98765-4321` fosse o
  problema. O gateway aceita os dois formatos; o que ele não aceita é a ausência.
- **Correção:** o formulário de pagamento passa a pedir o WhatsApp junto do CPF, já
  preenchido com o número da conta quando existe; a ação valida antes de falar com o
  gateway; o motivo real de qualquer falha vai para o log do servidor.
- **Status:** Em correção — feature `005-ux-o-que-faltava` (T040–T041)

### UX-033 — Pedidos do dono na vitrine (15/09/2026)

- **Severidade:** — (mudança pedida, não defeito)
- **O quê:** tirar a tela de comparação dos seis estilos (`/pacotes/estilos`) e a linha
  "Sem mensalidade · Pix sem taxa · Feito no Brasil" com o botão de animações do rodapé.
- **O que fica:** as prévias de cada estilo (`/pacotes/estilos/<id>`), que alimentam os
  cartões da home, os exemplos dos pacotes e a prévia do questionário. O link "Estilos"
  dentro das prévias passa a voltar para os seis cartões da home.
- **Status:** Em correção — feature `005-ux-o-que-faltava` (T042)

### UX-034 — O botão do convite levava ao site, não a quem confirma

- **Severidade:** 🟠 Alta — o convite é o que chega no WhatsApp
- **Onde:** convite criado pelo casal (`/c/<slug>`), botão "Confirmar presença"
- **O que acontecia:** o botão levava a `/s/<slug>#confirmacao`, a seção do site que diz
  "cada família recebeu um link pessoal, procure a mensagem" — inútil para quem acabou de
  não achar a mensagem. Relatado pelo dono em 15/09/2026.
- **Correção:** o destino `rsvp` do convite passa a resolver para `/s/<slug>/meu-convite`,
  a tela onde a pessoa escreve o nome e recebe o link da família. Como o convite guarda a
  intenção e não o endereço, os convites já criados se corrigem sozinhos.
- **Status:** Em correção — feature `005-ux-o-que-faltava` (T044)

### UX-035 — Não dava para perceber que a foto do site abre ampliada

- **Severidade:** 🟢 Baixa
- **Onde:** qualquer foto do site do casal
- **O que acontecia:** o sinal existia (cursor de lupa, zoom de 3% e um selo pequeno), mas
  passava despercebido — o dono não notou que dava para clicar.
- **Correção:** zoom de 5%, um véu na cor da tinta do tema e o selo com a palavra
  "Ampliar". Três sinais juntos, só no ponteiro: em tela de toque o gesto já é o toque.
- **Status:** Em correção — feature `005-ux-o-que-faltava` (T045)

### UX-036 — Salvar a edição da família não confirmava nada

- **Severidade:** 🟡 Média — defeito meu, visto no teste da UX-030
- **Onde:** `/conta/pedidos/<id>/convidados`, botão Editar
- **O que acontecia:** depois de salvar, o formulário continuava aberto e mudo. A linha
  atualizava atrás, mas quem salvou não tinha como saber.
- **Correção:** ao salvar, o formulário fecha e a linha mostra "Família atualizada ✓".
- **Status:** Em correção — feature `005-ux-o-que-faltava` (T046)

