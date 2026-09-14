# Reteste completo no site no ar — 14/09/2026

Pedido do dono: refazer todos os testes da auditoria em produção e ver se algum
erro voltou. Build `NXkA_9e7GBQkUD026neUJ` (Redeploy com `NEXT_PUBLIC_SITE_URL`),
código em `7c003a0`, checkout local igual a `vercel-origin/main`.

Conta nova `reteste.14set@example.com` (Lia Reteste & Rui Reteste), pedido
`daee0e5b-86a1-44f3-9df5-ceb96cfd1813`, pacote Para Sempre, modelo Toscana.
Convidado testado em sessões separadas, sem login.

**Resultado: nenhum dos 19 erros resolvidos voltou. Os 2 retratados seguem sem
reproduzir.**

## Cadastro e conta
```
WhatsApp "81987654321" ... vira "(81) 98765-4321" ao digitar           UX-017 ✅
/conta ................... "WhatsApp (81) 98765-4321" em Dados da conta UX-017 ✅
```

## Questionário (1440×900)
```
botão do topo ............ "Salvar rascunho"                           UX-011 ✅
data 01/01/2020 .......... min=2026-09-14, Continuar desabilitado,
                           "Essa data já passou. Confiram o dia…"      UX-009 ✅
história com 5.000 ....... "5000/5000 — Chegou no limite de 5.000
                           caracteres…"                                UX-019 ✅
modelo Toscana → cores ... #9c8654 / #33351f / #f3eddd = preset,
                           nenhum aviso de contraste, amostra com
                           "Lia Reteste & Rui Reteste"                 UX-006 ✅
"Criar nosso site" ....... PRÉVIA PRONTA na hora, prévia no domínio real UX-001 ✅
```

## Painel
```
Fotos: .svg .............. "Esse arquivo não é uma foto que a gente
                           consiga usar. Vale JPG, PNG ou WebP."        UX-010 ✅
Fotos: .jpg .............. "1 de 40", sem erro
Conteúdo ................. os 10 campos do questionário no lugar
                           (nomes, data, hora, cerimônia, endereço,
                           festa, endereço, hora da festa, traje, história) UX-003 ✅
Pix "pix-invalido" ....... "Não reconhecemos essa chave…", e partnerA,
                           giftMessage e story continuam preenchidos    UX-004 ✅
Pix válido ............... "Salvo ✓ — o site já está com o conteúdo novo.",
                           persiste após recarregar, "FALTA O PIX" some
Visual ................... "Lia Reteste & Rui Reteste · 16 de setembro de
                           2028 · Boa Vista, Recife/PE", sem Ana & Pedro UX-018 ✅
Convites → Criar convite . editor abre, sem erro, rodapé com
                           casamentoweb-ten.vercel.app/s/<slug>          UX-002 ✅
Convidados ............... casamentoweb-ten.vercel.app/rsvp/jOSRbQN9
                           escrito UMA vez + 1 [Copiar link] visível    UX-016 ✅
Início ................... 0 ocorrências de localhost no HTML          UX-021 ✅
console .................. nenhum erro, nenhum aviso (Convidados, Convites)
```

## Site do convidado — prévia
```
390×844
  linha da capa .......... "BOA VISTA, RECIFE/PE" (endereço tem "300")   UX-014 ✅
  âncoras da barra ....... 40px; "Confirmar presença" 44px              UX-015 ✅
  rolagem lateral ........ nenhuma (scrollWidth 390 = clientWidth 390)
  mural .................. "O mural começa a valer quando o site estiver
                           no ar…", nome e recado continuam no campo    UX-012 ✅
  Presentear ............. Pix copia e cola com a chave DO CASAL
  "Já fiz o Pix" ......... "Muito obrigado! Seu carinho já está guardado"  UX-007 (retratado) ✅
  console ................ nenhum erro, nenhum aviso
1440×900
  capa ................... "BOA VISTA, RECIFE/PE", conteúdo do casal,
                           0 localhost, sem rolagem lateral, console limpo
```

## RSVP — sessão sem login
```
grupo "Família Souza — tios da noiva", pessoa "Dona Ivete Souza", 1 lugar
  <h1> ................... "Dona Ivete, você vem?"
  "tios da noiva" no HTML  0 · "Família Souza" no HTML 0              UX-008 ✅
  Sim, vamos → Enviar .... "Presença confirmada! Que alegria. Anotamos
                           1 lugar."
```

## Ações que terminavam em silêncio
```
Cancelar pedido .......... diálogo "Cancelar este pedido?" → /conta/pedidos
                           com "Pedido cancelado.", e o #cancelado some
                           do endereço                                  UX-020 ✅
Sair da conta ............ / com "Vocês saíram da conta."              UX-020 ✅
```

## Casamento real e rotas críticas
```
/s/isabelle-e-nycolas .... 200, og:url e og:image em
                           https://casamentoweb-ten.vercel.app, 0 localhost UX-021 ✅
/api/qr/isabelle-e-nycolas 200, image/svg+xml, 2.932 bytes             UX-005 ✅
/rsvp/__Tzwfka ........... 200
/ · /pacotes · /conta/entrar · /conta/criar  200
```

`/rsvp/yVUkmV59` responde **404, e está certo**: era de `ana-auditoria-e-bruno-teste`,
site de teste apagado na limpeza de 13/09. A `REVALIDACAO-FINAL.md` o chamava de
"casamento real" — erro de rótulo meu, corrigido lá.

UX-013 (retratado) não se aplica: era efeito do automatizador, não do produto.

## Achado novo — UX-022, corrigido no mesmo dia

- 🟢 **"Quantos dos 1 lugar vão?"** — no RSVP de grupo com um lugar só, depois de
  "Sim, vamos!". `components/site/ConfirmacaoDePresenca.tsx:173` flexiona
  "lugar/lugares", mas não o "dos". O título logo acima já trata o singular
  certo ("Dona Ivete, você vem?").

Conferido e **não** é defeito: o carimbo "Prova pronta" no Início convive com
"Prévia pronta" no cabeçalho de propósito — é vocabulário de gráfica,
documentado em `components/account/ProofStamp.tsx`.

## Dados de teste — apagados no mesmo dia
Autorizado pelo dono. Backup antes: `backups/full-backup-2026-09-14T12-08-34-647Z.json`.
`scripts/limpar-dados-de-teste.mjs --apagar`, depois da verificação da UX-022:
1 conta (`reteste.14set@example.com`), 1 pedido cancelado, 1 site em prévia,
1 grupo, 1 convidado, 1 foto, 7 presentes, 1 aviso de Pix. Nenhum site publicado
na lista. Casamento real conferido em seguida: todas as rotas 200.

## Depois da correção (commit `8ea7271`)

Portões: lint limpo, `tsc --noEmit` limpo, `next build` passando, **837 testes em
74 arquivos** verdes.

```
/rsvp/jOSRbQN9 (1 lugar), sessão nova sem cache, build mO3ytDjvbQsrnJ0VLvhLt
  <h1> ................... "Dona Ivete, você vem?"
  pergunta do contador ... "Quantas pessoas vão?"  (era "Quantos dos 1 lugar vão?")  UX-022 ✅
  embaixo ................ "de 1 reservado"
casamento real ........... /, /rsvp/__Tzwfka, /s/isabelle-e-nycolas, QR,
                           /conta/entrar, /pacotes — todos 200; og:url no domínio real
```

Uma leitura enganosa no caminho: a primeira checagem depois do push pegou um build
intermediário (`38fzSsnFFhlVxXPuRJDBX`) e ainda mostrou o texto antigo. A aba
seguinte, já no build final, mostrou o novo. Antes de concluir que uma correção
"não subiu", conferir o identificador do build **na própria página testada**.

