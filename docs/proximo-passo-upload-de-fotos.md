# Próximo passo: upload de fotos (Fase 3, 2/2)

Ponto de partida para a próxima sessão. O contexto completo está no
[SDD](sdd-geracao-automatica.md) §8; aqui fica só o que é preciso para
começar sem redescobrir nada.

## Por que isto é bloqueante

Hoje `PhotoSlot` sorteia imagens de casamentos do Unsplash em `public/demo/`.
Um casal que peça o site agora recebe **fotos de estranhos** — não é
entregável. O provisionamento automático já funciona (Fase 3, 1/2); falta a
foto para o site ser de verdade.

## O que já existe e ajuda

- **`order_photos` já existe no banco** (vazio, e agora rastreado pelo
  Drizzle como `orderPhotos` em `lib/db/schema.ts`): `order_id`,
  `storage_path`, `original_name`, `content_type`, `size_bytes`, `position`.
  Veio de um push antigo, nunca foi usada por código.
- **Supabase Storage está disponível** — o schema `storage` existe na
  instância. É o caminho mais barato: já estamos no Supabase.
- `orders.photosLink` é o campo atual: uma URL de pasta compartilhada que
  **um humano abre e baixa**. É exatamente o que o upload substitui.

## Decisão pendente antes de codar

`order_photos` é escopada por **pedido**; o renderer precisa das fotos por
**site**. E um site pode existir sem pedido (o casamento legado tem
`order_id` nulo).

Duas saídas:

1. **`site_photos` nova, escopada por site.** Coerente com o renderer e com
   sites sem pedido. `order_photos` fica como está, sem uso.
2. **Adicionar `site_id` a `order_photos`.** Menos tabela, mas a tabela passa
   a ter dois donos possíveis e o nome fica mentindo.

Recomendação: **opção 1**. O upload acontece no briefing, mas a foto pertence
ao site; e o casal vai poder trocar fotos depois de publicado, quando o
pedido já não é o objeto relevante.

## Esboço de implementação

1. Migração aditiva `site_photos` (`site_id`, `slot`, `storage_path`,
   `width`, `height`, `blur_data_url`, `alt`, `position`). Seguir o ritual:
   backup, ensaio em transação com ROLLBACK, `down` à mão.
2. Bucket no Supabase Storage + upload assinado direto do browser (o arquivo
   não passa pelo servidor Next).
3. Comprimir/redimensionar **no cliente** antes de enviar (alvo ≤ 500 KB) e
   guardar `width`/`height` para evitar layout shift.
4. `images.remotePatterns` no `next.config.ts` apontando para o domínio do
   Storage; trocar `PhotoSlot` por `next/image` quando houver foto, mantendo
   o placeholder como fallback.
5. Limites por pacote: convite 5 · site 15 · para-sempre 40.
6. `updateTag('site-view:<slug>')` ao trocar foto, senão o cache serve a
   versão antiga.

## Cuidados

- **Foto de casamento é dado pessoal de terceiros** (convidados aparecem
  nelas). Bucket **não** público por padrão; servir por URL assinada ou
  caminho não adivinhável.
- Validar `content_type` no servidor, não confiar no que o browser diz.
- O beacon de métricas e o renderer já estão em cache — lembrar de invalidar.

## Depois disto

Ligar **publicação ao pagamento**: o webhook do AbacatePay confirma, mas
nada move o site de `preview` para `published`. É pequeno e fecha o funil
comercial inteiro.
