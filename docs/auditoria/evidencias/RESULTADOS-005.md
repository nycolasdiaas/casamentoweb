# Feature 005 — verificado em produção, 12–13/09/2026

Deploy `75b575e`.

## O convidado é chamado pelo nome
```
grupo de 2 pessoas (Antônia Souza, José Souza), 2 lugares:
  <h1>Antônia e José, vocês vêm?</h1>

grupo de 1 pessoa (Dona Ivete), 1 lugar:
  <h1>Dona Ivete, você vem?</h1>

antes da 005 ....... "Vocês vêm?" (neutro, depois de tirar o rótulo privado)
antes da 008 ....... "Família Souza — tios da noiva, vocês vêm?" (rótulo privado)
```

O rótulo do grupo continua fora: `grep "tios da noiva"` no HTML → **0**.

## Um defeito pego NA verificação

A primeira versão respondia **"Dona, você vem?"** — a saudação pegava o primeiro
pedaço do nome, e "Dona Ivete" começa por um tratamento. O teste não pegou porque os
nomes que eu escolhi para ele não tinham tratamento. Corrigido em `75b575e`, com os
casos no teste.

## Confirmação das ações
```
cancelar pedido .... /conta/pedidos#cancelado → "Pedido cancelado."
sair da conta ...... /#saiu               → "Vocês saíram da conta."

o fragmento nunca chega ao servidor: as duas rotas continuam cacheadas,
e o recado some do endereço depois de lido
```

## Rotas críticas, todas 200
```
/  ·  /conta/entrar  ·  /s/isabelle-e-nycolas  ·  /api/qr/isabelle-e-nycolas
/rsvp/yVUkmV59  ·  /rsvp/p79UrPRG   (os dois eram de sites de teste, apagados em 13/09)
```
