# Enlace — Regras de negócio

> **Este é o documento de PRODUTO.** O `AGENTS.md` diz como o código funciona;
> aqui está o que o produto promete e o que ele nunca pode fazer. Quando os
> dois se contradizem, este vence — o código se ajusta à promessa, não o
> contrário.
>
> Guardado pelo agente [`regras-de-negocio`](../.claude/agents/regras-de-negocio.md).

---

## 1. O que o Enlace é

**O Enlace é o site de casamento que já está pronto quando o casal termina de
pedir.**

Sem orçamento, sem conversa no WhatsApp, sem esperar um designer. O casal
escolhe o pacote, responde sete perguntas e o site **existe** — com link para
mandar no grupo da família. Se quiser mudar alguma coisa, muda ali mesmo e vê
na hora.

O concorrente entrega em minutos e diz isso na página. O Enlace entrega antes
de o casal terminar de ler a frase — e também diz isso.

### As três promessas que sustentam tudo

| Para quem | Promessa | Como se quebra |
|---|---|---|
| **O casal** | *"Vocês não vão trabalhar."* | Toda tela que acrescenta decisão em vez de tirar. Todo campo obrigatório que não precisava ser. |
| **O dono (Anderson)** | *"Eu não encosto no código."* | Toda venda que exige um commit, um deploy, um SQL à mão ou uma resposta no WhatsApp. |
| **A proposta** | *"A página é a proposta."* | Todo caminho que empurra o casal para uma conversa antes de comprar: "solicite um orçamento", "fale com um especialista", "consulte valores". |

---

## 2. Os cinco princípios inegociáveis

### 2.1 Zero toque humano por venda

Pedido enviado → site provisionado no **mesmo request** → prévia pronta.
Pagamento confirmado → site no ar **sozinho**, por três caminhos independentes
(retorno do checkout, webhook, ação do admin).

**O teste:** se uma funcionalidade nova só funciona quando alguém abre o
`/admin` e clica em algo, ela não está pronta. O caminho manual pode existir
como *rede de segurança*, nunca como *o caminho*.

*Onde vive:* `lib/site/provision.ts`, `lib/site/publish.ts`,
`app/api/pagamento/confirmar/`.

### 2.2 Nunca prometer uma espera que não existe

Este erro já foi cometido e está documentado dentro do código: os textos de
status diziam *"nossa equipe vai começar a montar em breve"* — copy da época em
que um humano montava o site à mão. Com o provisionamento automático, a prévia
já está pronta quando o casal lê a frase.

**Palavras banidas do acompanhamento do pedido:** "em breve", "logo",
"nossa equipe vai", "aguarde", "assim que possível", "prazo de entrega".

> Exceção honesta: `PACKAGES[].deliveryTime` ("Entrega em até 3 dias") é o
> **teto** comercial na vitrine, não a expectativa. Se um dia soar como espera
> real, troque por "pronto na hora" — a entrega já é essa.

*Onde vive:* `lib/orderStatus.ts` (`STATUS_META`).

### 2.3 Menor trabalho possível para o casal

- **Só uma coisa é obrigatória: os nomes.** Todo o resto é pulável, de
  propósito. Cada seção do molde degrada sozinha quando falta dado.
- **Um site sem história é um site legítimo.** A lista "o que falta" é guia,
  nunca trava — por isso ela diz *"falta"*, nunca *"pendência"* ou *"erro"*.
- **A lista de tarefas respeita o pacote.** Cobrar chave Pix de quem comprou o
  Convite é cobrar por um recurso que ele não tem: tarefa impossível trava o
  progresso para sempre.
- **Curadoria em vez de opção.** Cada molde oferece só as fontes que combinam
  com ele. Não oferecer é o que protege o casal de estragar o próprio site.
- **Não existe editor de arrastar e soltar.** Escolha guiada + edição de
  conteúdo. Isso é decisão tomada, não falta de tempo (§2 do SDD).

*Onde vive:* `lib/wizard/etapas.ts`, `lib/site/oQueFalta.ts`,
`clampThemeFonts` em `lib/theme/`.

### 2.5 Retenção de site fora do ar — EM ABERTO

**Nenhum texto ao casal promete prazo de guarda.** Nem "para sempre", nem "por
N meses".

Quando um site sai do ar — por decisão do casal ou pelo fim do prazo do pacote
(spec `site-publico/008`) — nada é apagado: ele vira `archived`, e conteúdo,
fotos, presentes, grupos e confirmações continuam no banco.

Os avisos por e-mail dizem **"nada foi apagado"**, no passado, descrevendo o
que aconteceu. Isso é fato. **"Vamos guardar" seria promessa futura**, e um
prazo escrito criaria a obrigação de apagar dado de casamento — que colide com
a FR-004 da mesma spec e com a regra 6 da §14 do SDD.

Consultado em 28/08/2026, o dono respondeu *"não sei ainda"*. Enquanto a
política não existir, o silêncio é o estado seguro: não promete nada e não
apaga nada.

### 2.4 O dinheiro do presente é do casal, sempre

- **100% do presente vai para o casal. O Enlace nunca fica no meio.**
- **Não existe chave Pix de fallback.** Sem Pix do casal, a seção de presentes
  não oferece forma de pagamento e manda falar com os noivos. Não há valor
  padrão seguro para "para onde vai o dinheiro" — já houve uma chave pessoal
  chumbada no código, e todo casal exibia o QR de outra pessoa.
- **O QR é gerado, nunca uma imagem enviada pelo casal** — o valor da cota
  entra no BR Code na hora.
- O que o Enlace cobra é o **pacote**, uma vez, pelo preço que está na tela.

*Onde vive:* `lib/pix/`, `lib/pix/sem-chave-global.test.ts`.

### 2.5 O convidado é terceiro, e o link dele é sagrado

- **`/rsvp/<slug>` nunca pode deixar de funcionar.** Os links já estão no
  WhatsApp de gente real; quebrar é perder confirmação de casamento que
  acontece.
- **Slug publicado é imutável.**
- **IP de convidado nunca é gravado** — `visitor_hash` é HMAC com sal que gira
  a cada 24h (LGPD).
- O convidado nunca cria conta, nunca instala nada, nunca escolhe nada além de
  confirmar presença e presentear.

---

## 3. Os três papéis

| Papel | O que faz | O que NUNCA precisa fazer |
|---|---|---|
| **O casal** | Cria conta, responde o questionário, edita conteúdo, sobe fotos, paga, compartilha o link. | Falar com alguém. Esperar aprovação. Entender uma palavra técnica. |
| **O convidado** | Abre o link, confirma presença, presenteia via Pix, deixa recado. | Criar conta. Instalar app. Pagar taxa. |
| **O dono (Anderson)** | Define preço, pacotes e estilos. Olha métricas. Socorre um caso raro pelo `/admin`. | Montar site. Escrever código por venda. Negociar por WhatsApp. Hospedar nada à mão. |

O `/admin` existe para **exceção**, não para operação. Se ele virar rotina, o
princípio 2.1 já foi quebrado.

---

## 4. Os pacotes

Fonte única: `lib/packages.ts`. Gating de seções: `lib/templates/contract.ts`.

| | Convite — R$ 9,90 | Site do Casamento — R$ 29,90 | Para Sempre — R$ 99,90 |
|---|---|---|---|
| Capa / Save the Date | ✅ | ✅ | ✅ |
| Contagem regressiva | ✅ | ✅ | ✅ |
| História do casal | ✅ | ✅ | ✅ |
| Local, mapa, traje | ✅ | ✅ | ✅ |
| Galeria de fotos | ✅ | ✅ | ✅ |
| Confirmação de presença | — | ✅ | ✅ |
| Recado para os noivos | — | ✅ (privado) | ✅ (no mural, com presente) |
| Lista de presentes com Pix | — | — | ✅ |
| Mural de recados | — | — | ✅ |
| Álbum pós-festa | — | — | ✅ |
| Endereço personalizado | — | — | ✅ |

Regras:

- **O preço está na tela e é o preço.** Não existe negociação, orçamento,
  desconto por conversa nem "a partir de".
- **Um recurso pertence a um pacote e só a ele.** Vazar recurso pago para
  pacote menor esvazia a escada inteira; cobrar do menor por algo que ele não
  tem é mentir.
- **Mudar preço ou criar pacote é decisão do dono**, nunca inferência de
  agente.
- **Pacote novo mexe em três lugares ao mesmo tempo:** `PACKAGES`,
  `TIER_SECTIONS` e a vitrine. Um só = produto inconsistente.
- **Recado não é mural** (decisão do dono, 15/09/2026). O botão "Recado para
  os noivos" sai da seção de confirmação de presença, então existe nos dois
  pacotes que a têm. O que muda é o destino: no Para Sempre o recado vai para
  o mural do site e a tela oferece mandar um presente junto; no Site do
  Casamento ele nasce privado, não aparece em lugar nenhum do site e o casal o
  lê na aba Recados do painel. **Pix junto do recado é só do Para Sempre.**
  Quem decide é o servidor, pelo `tier`, e o mural filtra pela marca da linha
  (`guestbook_messages.privado`) — trocar de pacote não publica o que chegou
  sob promessa de ser privado.

---

## 5. A jornada do pedido

```
draft → submitted → [in_production] → preview_ready → paid → published
```

- **`draft`** — rascunho, o casal ainda não enviou.
- **`submitted`** — dura milissegundos: o site é criado no mesmo request.
- **`in_production`** — só aparece quando há ajuste manual. É a exceção.
- **`preview_ready`** — a prévia está no ar, editável, esperando pagamento.
- **`paid`** — publicação em andamento (automática).
- **`published`** — site no ar.

**Cancelar:** a linha é o **pagamento**, não a produção. Dá para cancelar até
`preview_ready`; depois de pago vira conversa de estorno.

**Regra de ouro do acompanhamento:** o casal sempre sabe (a) em que ponto está,
(b) o que dá para fazer agora, (c) que nada está travado esperando outra
pessoa.

*Onde vive:* `lib/orderStatus.ts`.

---

## 6. Como o Enlace fala

Público: casal brasileiro se organizando para casar, no celular, muitas vezes
no meio de outra coisa. Não é público técnico. Tom: **claro, caloroso, curto,
sem infantilizar**.

### Tradução obrigatória

| Nunca escreva | Escreva |
|---|---|
| template, molde | modelo, estilo |
| deploy, build, publicar release | colocar no ar |
| slug, rota, URL canônica | endereço do site, link |
| preview | prévia |
| upload | enviar foto |
| RSVP (sozinho) | confirmação de presença (`RSVP` só entre parênteses) |
| tenant, multi-tenant, cache, render | *(não aparece para o casal, em lugar nenhum)* |
| erro 500, falha na requisição | "não conseguimos salvar agora — tente de novo" |
| "nossa equipe vai montar" | "o site de vocês já está criado" |
| "solicite um orçamento" | o preço, escrito |

### Três regras de escrita

1. **Diga o que aconteceu, não o que o sistema fez.** "Suas fotos estão no
   site", não "upload concluído com sucesso".
2. **Todo erro tem uma saída.** Mensagem sem próximo passo é beco sem saída.
3. **Nunca invente dado do casal.** As prévias em `app/pacotes/estilos/` têm
   cronograma e frases de um casal fictício escritos no código. Portar é
   **omitir o que não existe** — senão o site de um casal real anuncia um
   coquetel que não vai ter. O mesmo vale para depoimentos: `TESTIMONIALS`
   vazio esconde a seção; depoimento inventado, nunca.

---

## 7. Decisões tomadas — não reabrir

| Descartado | Por quê |
|---|---|
| Editor arrasta-e-solta tipo Wix | Aumenta trabalho do casal. Escolha guiada é o produto. |
| LLM gerando código por casal | Era o gargalo antigo: artesanal, não editável, sem correção retroativa. |
| Deploy/site por casal | Um código, N casais. Corrigir o molde corrige todos. |
| Funil por WhatsApp antes da compra | A página é a proposta. O WhatsApp é suporte, não venda. |
| Taxa sobre presente | O dinheiro é do casal. |
| Chave Pix de fallback | Não existe padrão seguro para destino de dinheiro. |

O WhatsApp em `lib/site.ts` é **suporte pós-dúvida**, não etapa do funil. Ele
nunca pode virar pré-requisito para comprar.

---

## 8. O que exige decisão do dono (nunca decida sozinho)

1. Preço, novo pacote, o que cada pacote inclui.
2. Qualquer promessa nova na vitrine (prazo, garantia, recurso).
3. Qualquer coisa que reintroduza trabalho manual por venda.
4. Cobrar por algo que hoje é grátis, ou dar de graça algo que hoje é pago.
5. Mudar o que o convidado precisa fazer para confirmar presença.
6. Domínio próprio, marca, contato público.

---

## 9. Pendências que o produto conhece

- **Álbum pós-festa é placeholder** — as fotos só existem depois do casamento.
- ~~**Mural de recados** é a única seção do contrato sem implementação.~~
  **Implementado** (migração 0015). O convidado escreve no site com nome e
  recado, sem conta; o recado aparece na hora. O casal **esconde**, nunca
  apaga — a aba *Recados* do painel só existe no Para Sempre. Sites Para
  Sempre criados ANTES da 0015 mostram o mural (a lista de seções é
  denylist), mas não têm a linha em `site_sections` para desligá-lo pela aba
  Páginas.
- **Webhook do AbacatePay desligado** (`ABACATEPAY_WEBHOOK_SECRET` vazio): a
  confirmação depende do casal voltar do checkout. Funciona, só não é
  instantâneo — e isso é uma promessa em risco (§2.1).
- **Verificação de e-mail** não existe na `main` (só na branch órfã).
- **Cancelar pedido órfã o site** — invisível, mas acumula.

---

## 10. Mapa: onde cada regra mora no código

| Regra | Arquivo |
|---|---|
| Pacotes, preços, benefícios | `lib/packages.ts` |
| Seções por pacote | `lib/templates/contract.ts` |
| Estados do pedido e textos do casal | `lib/orderStatus.ts` |
| Questionário de 7 etapas | `lib/wizard/etapas.ts` |
| "O que falta" | `lib/site/oQueFalta.ts` |
| Provisionamento automático | `lib/site/provision.ts` |
| Publicação automática | `lib/site/publish.ts`, `app/api/pagamento/confirmar/` |
| Pix do casal | `lib/pix/`, `lib/pix/sem-chave-global.test.ts` |
| Marca, contato, depoimentos | `lib/site.ts` |
| Moldes | `lib/templates/<id>/`, `lib/templates/registry.ts` |
| Decisões de arquitetura | `docs/sdd-geracao-automatica.md` |
