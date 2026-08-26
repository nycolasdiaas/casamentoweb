---
name: fotos
description: Fotos do site — upload assinado, bucket privado no Supabase Storage, entrega por /f/<id>, next/image, EXIF/orientação, apagar foto. Use ao mexer em site_photos, PhotoManager, lib/storage/, rota /f/, ou ao ver foto quebrada, deitada, ou `"url" parameter is valid but internal response is invalid`.
---

# Fotos

`site_photos` é escopada por **site**, não por pedido. Bucket **privado** no
Supabase Storage, upload assinado direto do browser.

O casal sobe pela tela de acompanhamento. O molde cai no placeholder enquanto
o slot estiver vazio. Ver §8 do SDD.

## Entrega

**A foto sai por `/f/<id>`, nunca por URL do Storage no HTML.** O site fica em
`cacheLife("days")`; URL assinada embutida expiraria dentro do cache e o
convidado veria foto quebrada.

**Essa rota REPASSA os bytes. Não redirecione.** O otimizador do `next/image`
segue redirect só para imagem **remota**. `/f/<id>` é caminho local: a busca é
interna, não segue o 307, e devolve

```
"url" parameter is valid but internal response is invalid
```

Com redirect, **nenhuma** foto renderiza. Custou uma volta; medido no §8.1 do
SDD.

**`images.remotePatterns` continua vazio de propósito** — a URL é da nossa
própria origem. Adicionar o domínio do Storage abriria superfície à toa.

## Upload

- **Sem `SUPABASE_SERVICE_ROLE_KEY`, o upload fica desligado.** O painel some
  da tela do casal e o site mostra as imagens de exemplo. Nada quebra, mas
  também nada avisa: se o upload "sumiu", é a chave.
- **`createImageBitmap` precisa de `imageOrientation: "from-image"`.** Sem
  isso, foto tirada na vertical no celular chega deitada — o canvas ignora o
  EXIF.
- **O `content-type` que o browser declara não vale como prova.** Quem envia
  está com URL assinada na mão. A confirmação lê os primeiros bytes do objeto
  e confere a assinatura do arquivo.

`npm run setup:storage` cria o bucket privado. Uma vez por ambiente.

## Apagar

Linha sai primeiro, objeto depois. Se o objeto não sair, sobra lixo invisível
no bucket — melhor que o inverso, que deixaria foto quebrada no site.

## Pendência

Álbum pós-festa (slot `album`) ainda é placeholder: sem upload, porque as
fotos da festa só existem depois do casamento.
