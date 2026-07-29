# Planning

Atualizado em 28/07/2026, ao fim da sessão que fechou as Fases 2 e 3.

## Onde estamos

O ciclo comercial inteiro roda sem humano no meio:

```
pedido → site provisionado → prévia → fotos do casal → pagamento → site no ar
```

| Fase | Entrega | Estado |
|---|---|---|
| 0 | Fundação multi-tenant + métricas | ✅ |
| 1 | Cache Components, ThemeSpec, motor de templates | ✅ |
| 2 | Os 6 moldes portados | ✅ |
| 3 | Provisionamento, upload de fotos, publicação ao pagamento | ✅ |
| 4 | Autonomia do casal | 🟡 editor de conteúdo entregue |

`main` com as Fases 0–3 mergeadas.

### Fase 4, o que já entrou

O casal edita o próprio conteúdo em `/conta/pedidos/<id>`: nomes, data e hora,
locais e endereços de cerimônia e festa, link do mapa, traje, história e
recado dos presentes. Salvar chama `updateTag` nas três tags do site, então a
mudança aparece na hora — read-your-own-writes, não stale.

Peças: `lib/repositories/siteContent.ts` (escrita, upsert por causa do site
legado), `lib/site/contentInput.ts` (validação à mão, sem Zod — o projeto não
tem a dependência), `lib/site/contentFields.ts` (o caminho de volta para o
formulário) e `components/account/ContentEditor.tsx`.

O cuidado que custou os testes: **hora é gravada em UTC e exibida no fuso do
site**. Formatar de volta com `toISOString()` devolveria 19:00 para uma
cerimônia às 16:00 em Fortaleza, e cada salvamento empurraria mais três horas.
`contentInput.test.ts` tem um caso que salva três vezes seguidas e confirma
que o instante não escorrega.

Também entrou o **controle do site**: ligar/desligar seção e tirar do ar /
colocar de volta. `site_sections.enabled` já era respeitado pelo renderer
(`SiteRenderer`), só não tinha quem escrevesse.

Duas regras que os testes protegem:

- **`cover` e `footer` não desligam** — sem elas o site não é um site, então
  nem aparecem como opção.
- **A primeira publicação continua sendo do pagamento.** O casal desarquiva
  só o que já esteve no ar (`publishedAt` preenchido); senão arquivar e
  desarquivar seria um jeito de publicar sem pagar.

Arquivar não apaga nada: conteúdo, fotos e confirmações ficam, e
`publishedAt` guarda a primeira ida ao ar.

### Fase 4, o que falta

- **RSVP e presentes na tela do casal.** As tabelas já têm `site_id`, mas o
  casal não tem onde gerenciar grupos, convidados nem lista de presentes —
  isso segue só no admin, e só para o casamento legado. É o maior pedaço
  aberto, e é promessa dos pacotes "Site" e "Para Sempre".
- **Reordenar seções.** `site_sections.position` existe; o casal liga e
  desliga, mas não move.

---

## Bloqueio: o que nunca foi exercitado de verdade

Está no caminho crítico de um cliente pagante — vale mais que qualquer item
da lista abaixo. O item 1 caiu em 28/07; sobra o pagamento.

### 1. ~~Subir uma foto por um navegador de verdade~~ — EXIF e compressão OK

O que já estava verificado: o caminho do Storage inteiro (assinar, enviar,
ler, apagar), a rota `/f/<id>`, o `next/image` otimizando e a revogação ao
apagar.

**Resolvido em 28/07/2026.** `prepararFoto()` foi exercitada num Chrome de
verdade (142, via CDP) com JPEGs sintéticos carregando `Orientation=6` — o
raster deitado que o iPhone grava para foto tirada na vertical. As bordas do
raster são coloridas para a orientação ser lida por pixel, não a olho:

| Entrada | Bitmap após EXIF | Gravado | Blob | Topo / base |
|---|---|---|---|---|
| 1600x1200, 76 KB | 1200x1600 | 1200x1600 | 41 KB | vermelho / azul ✅ |
| 4032x3024, 2041 KB | 3024x4032 | 1200x1600 | 475 KB | vermelho / azul ✅ |

A borda **esquerda** do raster vira o **topo**, que é o que `Orientation=6`
manda. Chega de pé. O laço de qualidade também funciona: 2041 KB caíram para
475 KB, abaixo do alvo de 500.

Dois detalhes que valem saber:

- **`imageOrientation: "from-image"` já é o padrão do Chrome atual** — sem a
  opção o resultado é idêntico (`3024x4032`). Manter é certo mesmo assim: o
  padrão antigo era `"none"`, e é o que roda em WebView velha.
- **475 KB é raspando no alvo.** A imagem do teste é ruído sintético, o pior
  caso para JPEG; foto real comprime bem melhor. Mas se o alvo apertar, é a
  medida de referência.

**O que ainda não foi exercitado pela interface:** o clique real no
`<input type="file">` da tela `/conta/pedidos/<id>`. O que estava em aberto
era a preparação da imagem, e essa parte agora está medida.

### 2. Um pagamento real

A publicação foi testada com `payment_status` já em `PAID`. O trecho que
consulta o AbacatePay (`getChargeStatus`) nunca rodou contra uma cobrança de
verdade.

**Como testar:** uma cobrança com chave de teste (`abc_dev_...`) percorre
`startPaymentAction → checkout → /api/pagamento/confirmar → site no ar`.

---

## Próximos passos, em ordem de valor

### 1. Mural de recados (`guestbook`)

**Única seção do contrato sem implementação.** As prévias já a mostram para
quem está decidindo comprar o "para sempre" — quem comprar hoje vê na vitrine
algo que o site entregue não tem.

Detalhes e cuidados em
[docs/proximo-passo-mural.md](../docs/proximo-passo-mural.md). O ponto que
não pode ser tratado como melhoria: **é escrita pública e anônima**, então
rate limit e moderação são requisito. Sem isso, o site do casamento de
alguém vira mural aberto na internet.

### 2. E-mail "sua prévia está pronta"

`lib/email.ts` só tem redefinição de senha. Hoje o casal só descobre a prévia
se voltar à tela sozinho. Pequeno, e é o que transforma "enviei o pedido" em
"recebi meu site".

### 3. Fechar o webhook do AbacatePay

`ABACATEPAY_WEBHOOK_SECRET` está vazio, então o webhook responde 503 e **não
processa nada**. Não é falta de verificação (ele compara o segredo em tempo
constante e reconfirma com a API antes de liberar) — é que está desligado.
Preencher torna a confirmação instantânea em vez de depender do casal voltar
do checkout.

### 4. Upload do álbum pós-festa

O slot `album` existe nos 6 moldes, mas não tem upload. Só faz sentido depois
do casamento — o primeiro cliente a precisar disso define o prazo.

### 5. Cancelar pedido órfã o site

`deleteOrder` apaga o pedido e `sites.order_id` é `set null`, deixando o site
provisionado sem dono. Invisível (segue em `preview`), mas acumula.

Apagar a conta do casal faz o mesmo, e aí **de propósito**: o site do
casamento não deve sumir porque a conta sumiu. Ao mexer, preservar essa
diferença.

### 6. Dívidas de infraestrutura

- **`DATABASE_URL_TEST` aponta para a mesma instância de produção.** Isolado
  por schema, mas um erro de config alcança dados reais. Os testes apagam
  tabelas inteiras entre casos.
- **Sem observabilidade.** Sentry + log estruturado: hoje, se o
  provisionamento falhar para um casal, ninguém fica sabendo (§9.3 do SDD).
- **Domínio próprio** é promessa do pacote "para sempre" e ainda é manual.

---

## O que resistir a fazer

Do §9.3 do SDD, e continua valendo: fila de mensagens, microserviços,
réplicas, multi-região, event sourcing. O perfil de carga é leitura pesada em
rajadas previsíveis (~300–900 acessos numa hora quando o link cai no grupo do
WhatsApp). Cache resolve; o banco não é gargalo. Cada peça dessas adiciona
modo de falha novo sem resolver problema que exista.
