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

213 testes. `main` com tudo isso mergeado.

---

## Bloqueio: duas coisas nunca foram exercitadas de verdade

Nenhuma das duas dá para verificar sem uma pessoa na frente da tela. Ambas
estão no caminho crítico de um cliente pagante — valem mais que qualquer
item da lista abaixo.

### 1. Subir uma foto por um navegador de verdade

O que está verificado: o caminho do Storage inteiro (assinar, enviar, ler,
apagar), a rota `/f/<id>`, o `next/image` otimizando e a revogação ao apagar.

O que **não** está: a compressão por canvas e a orientação EXIF de foto de
celular. `createImageBitmap` recebe `imageOrientation: "from-image"`, mas
foto tirada na vertical em iPhone é o caso clássico de chegar deitada.

**Como testar:** entrar numa conta com pedido enviado, abrir
`/conta/pedidos/<id>`, subir uma foto de celular na vertical e conferir se
aparece de pé na prévia.

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
