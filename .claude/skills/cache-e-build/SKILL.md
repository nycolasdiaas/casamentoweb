---
name: cache-e-build
description: Cache Components, PPR, `use cache`, cacheTag/cacheLife/updateTag, generateStaticParams, searchParams em Suspense, e armadilhas do Turbopack em dev (CSS velho, fontes do Google falhando, porta 3000 no Windows). Use ao criar/alterar rota, ao ver "Uncached data was accessed outside of `<Suspense>`", 404 virando 200, CSS que não atualiza, ou erro de build.
---

# Cache e build

`cacheComponents: true` está ligado. PPR é o padrão.

**`next dev` é permissivo, `next build` é estrito.** Erro de rota só aparece
no build. Sempre `npm run build` antes de confiar.

## Rotas

- **`notFound()` dentro de `<Suspense>` devolve 200, não 404.** O shell já
  foi enviado (`x-nextjs-postponed: 1`) e o status não muda mais. Para 404 real
  em rota dinâmica: declare `generateStaticParams` e faça o lookup no corpo da
  página.
- **`generateStaticParams` precisa devolver ao menos um param.** Quando o valor
  é segredo (token de prévia), use placeholder que cai no `notFound()`.
- **Rota com `generateStaticParams` lê dado por função cacheada. Ponto.**

## `searchParams` fora de Suspense reprova o build

Dado não cacheado lido fora de `<Suspense>` trava a rota inteira. O build diz:

```
Uncached data was accessed outside of `<Suspense>`
```

E aponta o `<body>`, nunca a linha culpada. O `next dev` não reclama.

**Saída:** mova o trecho que usa `searchParams` para componente próprio,
embrulhe em `<Suspense>`, passe a promise adiante **sem `await`**. A casca fica
estática, só o pedaço da busca espera. Modelo em
`app/s/[slug]/meu-convite/page.tsx`.

Há lint para isso: `enlace/searchparams-em-suspense`, em `eslint-rules/`. Só
acusa quando há `generateStaticParams` — é ele que faz o build prerenderizar.
Três páginas do painel leem `searchParams` no corpo e passam justamente por
não serem prerenderizadas hoje.

**A regra vale para QUALQUER leitura não cacheada.** A mesma mensagem apareceu
em `/c/[slug]`, que não tem `searchParams` nenhum: era consulta ao banco sem
`"use cache"`. O lint não pega esse caso.

## Invalidar cache

- **`updateTag`** nas ações do casal: read-your-own-writes, ele vê a própria
  mudança em vez de versão stale.
- `updateTag` só vale em Server Action. `revalidateTag` em Server Action ou
  Route Handler. **Nenhum dos dois durante o render de uma página.**

### Publicar

Publicar exige derrubar cache, e isso não pode acontecer no render. Por isso a
publicação mora em `/api/pagamento/confirmar`, e a tela de acompanhamento
apenas **redireciona** para lá quando detecta pagamento confirmado com site
ainda em prévia (`?publicacao=erro` corta o laço).

Publicar sem invalidar deixaria `/s/<slug>` em 404 por dias — `site-view` vive
com `cacheLife("days")` — enquanto o pedido diz "no ar".

Use `{ expire: 0 }`, não `"max"`: stale-while-revalidate serviria justamente o
404 anterior para o casal que acabou de pagar.

Não esqueça a tag `published-site-slugs` — é ela que alimenta o
`generateStaticParams` de `/s/[slug]`. `publishedSiteTags()` devolve as três.

Ao salvar conteúdo com chave Pix: `updateTag(sitePixTag(siteId))`. Esquecer
deixa chave antiga no ar por dias, com o painel dizendo que já trocou.

### Nos testes

`cacheTag`/`cacheLife` só existem no runtime do Next — são mockados em
`vitest.setup.ts`. Teste com `vi.mock("next/cache")` local precisa incluir os
dois, senão sobrescreve o mock global.

## Turbopack em dev

### CSS de `app/globals.css` fica velho

Editar `app/globals.css` com `next dev` de pé serve o chunk de CSS
**anterior**. Sobrevive a reload sem cache, a reiniciar o servidor e a
`rm -rf .next/cache`. Só `rm -rf .next` inteiro resolve.

Sintoma traiçoeiro: a regra aparece no arquivo em disco, o `curl` no `.css`
servido mostra a versão ANTIGA. A conclusão fácil ("o utilitário não está
sendo gerado") é falsa. Confirme buscando o `<link rel=stylesheet>` e
comparando com o disco antes de diagnosticar.

Prática: escreva todo o CSS de uma tacada e nucleie uma vez só, ou verifique
direto no `npm run build`, que compila do zero.

### Apagar `.next` quebra as fontes do Google por um tempo

O download das ~34 fontes é feito pelo Turbopack (Rust), não pelo Node —
`--dns-result-order=ipv4first` não muda nada, e o `curl` funcionar não prova
nada. Sem cache do `.next`, os pedidos em paralelo falham em lote:

```
Error while requesting resource
There was an issue establishing a connection while requesting
https://fonts.googleapis.com/css2?family=...
```

Rotas que importam `lib/templates/registry.ts` (inclusive `/` e `/s/<slug>`)
respondem **500**. Não é defeito de código.

Intermitente e não converge: rodadas medidas deram 5, 7, 31, 134, 171 e 180
erros em sequência. **Saída: repetir.** `npm run build` num laço de 3 a 4
tentativas passa. Não troque para `--webpack` (estoura 10 min) nem mexa em
config.

### Servidor velho na porta 3000 (Windows)

`pkill -f "next start"` não mata o servidor no Windows — o processo é `node`.
Um servidor velho continua na 3000 servindo o build anterior, e os hashes
novos do CSS respondem **500**. Mate pela porta:

```powershell
Get-NetTCPConnection -LocalPort 3000 | Stop-Process
```

## Next 16 não é o Next que você conhece

Leia `node_modules/next/dist/docs/` antes de assumir qualquer API. O Next 16
empacota a documentação completa lá. `middleware.ts` virou `proxy.ts`,
`cacheComponents` substituiu `experimental.ppr`/`dynamicIO`.
