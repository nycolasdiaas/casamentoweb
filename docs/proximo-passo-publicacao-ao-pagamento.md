# Próximo passo: publicação ao pagamento

Ponto de partida para a próxima sessão. O contexto completo está no
[SDD](sdd-geracao-automatica.md); aqui fica só o que é preciso para começar
sem redescobrir nada.

O upload de fotos (Fase 3, 2/2) está feito — ver §8 do SDD.

## Por que isto é o próximo

O funil comercial tem um buraco no fim: o casal paga e **nada acontece**. O
webhook do AbacatePay confirma o pagamento e marca o pedido como `paid`, mas
nenhum código move o `site` de `preview` para `published`. Hoje isso depende
de alguém fazer à mão.

É pequeno e fecha o ciclo inteiro: pedido → site → prévia → pagamento → no ar.

## O que já existe e ajuda

- `sites.status` já tem `published`, e `sites.publishedAt` está lá, sem uso.
- `/s/<slug>` **só serve site publicado** — o `notFound()` já depende do
  status, então publicar é literalmente mudar a coluna.
- `listPublishedSiteSlugs()` alimenta o `generateStaticParams` da rota
  pública; publicar precisa invalidar a tag `published-site-slugs`.
- `markOrderPaid` já existe em `lib/repositories/orders.ts`, e a tela de
  acompanhamento já consulta o status real da cobrança ao voltar do checkout
  (não depende só do webhook).

## Cuidados

- **`ABACATEPAY_WEBHOOK_SECRET` continua vazio**: o webhook não verifica
  assinatura nem tem idempotência. Publicar a partir de um webhook não
  verificado é publicar a partir de um POST que qualquer um pode mandar.
  Ou resolve isso junto, ou publica a partir da confirmação verificada que a
  tela já faz (`getChargeStatus`).
- Publicar precisa invalidar `site:<slug>`, `site-view:<slug>` e
  `published-site-slugs` — senão a rota continua 404 pelo cache.
- `orders.siteUrl` precisa ser preenchido, senão o botão "Ver nosso site no
  ar" não aparece no acompanhamento.

## Depois disto

- Mural de recados é a única seção do contrato sem implementação.
- Portar os 5 moldes restantes (Fase 2) — hoje só o Clássico está no motor.
