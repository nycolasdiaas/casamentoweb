# Evidências verificadas em produção — 11/09/2026, depois do deploy c85f436

## UX-001 · o site nasce ao fim do questionário
```
Conta nova: revalidacao.e2e.11set@example.com (Clara Revalida & Davi Revalida)
Pedido 96913612-0ed4-4d5f-a08f-a593b202f933 · pacote Para Sempre · modelo Romântico

Depois de "Criar nosso site":
  cabeçalho .......... PRÉVIA PRONTA + "Ver o site"
  aba Fotos .......... liberada (antes: "o site ainda está sendo montado")
  tela Início ........ abre (antes: HTTP 500)
  celular 390x844 .... abre, sem rolagem lateral
```

## UX-005 · QR do site publicado
```
GET /api/qr/isabelle-e-nycolas  -> 200 image/svg+xml   (antes: 500)
GET /api/qr/ana-e-pedro         -> 200 image/svg+xml   (antes: 500)
GET /api/qr/<site em prévia>    -> 404                 (continua certo)
```

## UX-021 · cartão do link no WhatsApp
```
og:url   = https://casamentoweb-ten.vercel.app/s/isabelle-e-nycolas
og:image = https://casamentoweb-ten.vercel.app/s/isabelle-e-nycolas/opengraph-image?v=3bab1550

antes:
og:url   = http://localhost:3000/s/isabelle-e-nycolas
og:image = http://localhost:3000/s/isabelle-e-nycolas/opengraph-image?v=3bab1550
```

## UX-016 · endereço da família
```
célula ENDEREÇO: casamentoweb-ten.vercel.app/rsvp/qNIOukpz + [Copiar link]
antes: —  (só um traço; o casal não tinha o que mandar para a família)
```
