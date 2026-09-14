# Revalidação E2E completa no site no ar — 11/09/2026

Conta nova `revalidacao.final.11set@example.com` (Bia Final & Caio Final), pedido
`45a4d244-37e7-48ad-ade9-fd684b08788e`, pacote Para Sempre, modelo Toscana.
Deploy verificado: `5920247`.

## Questionário
```
botão do topo ............ "Salvar rascunho"          UX-011 ✅
data 01/01/2020 .......... min=2026-09-11, Continuar desabilitado,
                           "Essa data já passou…", etapa NÃO avança   UX-009 ✅
história com 5.000 ....... "Chegou no limite de 5.000 caracteres…"   UX-019 ✅
revisão .................. pacote, nomes, data, cerimônia, endereço,
                           horário, festa, endereço, traje, história
"Criar nosso site" ....... PRÉVIA PRONTA na hora                     UX-001 ✅
```

## Painel — as 10 abas respondem 200
```
Início 200 · Páginas 200 · Conteúdo 200 · Visual 200 · Fotos 200
Convites 200 · Convidados 200 · Presentes 200 · Compartilhar 200 · Recados 200
```

```
Conteúdo ................. os 8 campos do questionário no lugar        UX-003 ✅
Pix "pix-invalido" ....... erro sobre a chave, e partnerA, giftMessage
                           e story continuam preenchidos             UX-004 ✅
Pix corrigido ............ "Salvo ✓ — o site já está com o conteúdo novo."
Visual ................... amostra com "Bia & Caio · 16 de setembro de
                           2028 · Recife/PE" (sem Ana & Pedro)        UX-018 ✅
Convidados ............... casamentoweb-ten.vercel.app/rsvp/p79UrPRG
                           escrito + [Copiar link]                   UX-016 ✅
Convites ................. editor abre, rodapé com o domínio real     UX-002 ✅
Fotos: arquivo .svg ...... "Esse arquivo não é uma foto que a gente
                           consiga usar. Vale JPG, PNG ou WebP."      UX-010 ✅
Fotos: .jpeg ............. 1 de 40, sem erro
```

## Site do convidado (390×844)
```
linha da capa ............ "RECIFE/PE" (era "300 — BOA VISTA, …")     UX-014 ✅
âncoras da barra ......... 40px de altura (eram 12px)                 UX-015 ✅
confirmar presença ....... 44px (era 30px)                            UX-015 ✅
nomes do casal ........... 40px
rolagem lateral .......... nenhuma (scrollWidth 390 = clientWidth 390)
mural na prévia .......... "O mural começa a valer quando o site
                           estiver no ar." e o recado continua no campo UX-012 ✅
console .................. nenhum erro, nenhum aviso
```

## RSVP — a rota que não pode quebrar
```
novo convidado ........... "Presença confirmada! Que alegria, Família do
                           Caio. Anotamos 1 lugar."
grupo de teste ........... /rsvp/yVUkmV59 → 200
                           (rótulo corrigido em 14/09: este link era do site
                           de teste ana-auditoria-e-bruno-teste, NÃO do
                           casamento real — apagado na limpeza de 13/09)
QR do casamento real ..... 200
og:url / og:image ........ domínio real, sem localhost
```

## Rotas críticas, todas 200
```
/  ·  /rsvp/<slug> (dois)  ·  /s/isabelle-e-nycolas  ·  /api/qr/<slug>
/conta/entrar  ·  /pacotes
```
