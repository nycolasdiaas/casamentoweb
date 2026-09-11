# Evidência UX-005 — o QR do site publicado devolve 500 em produção

Data: 11/09/2026. Requisições feitas do navegador, na origem https://casamentoweb-ten.vercel.app.

```
GET /api/qr/ana-e-pedro          → 500
GET /api/qr/isabelle-e-nycolas   → 500   (casamento real, no ar)
```

A rota devolve 404 para slug inexistente ou não publicado ANTES de chamar getBaseUrl()
(app/api/qr/[slug]/route.ts:31). Portanto um 500 significa que o site foi encontrado,
estava publicado, e a falha veio de getBaseUrl().
