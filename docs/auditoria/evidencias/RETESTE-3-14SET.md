# Terceiro reteste completo no site no ar — 14/09/2026

Pedido do dono: "veja a auditoria e faça os testes todos denovo e veja se ainda tem
erro". Código `5920ccb` = `vercel-origin/main`, build `kPFqxUBNeGmcuDzlkQBE4`. Conta
nova `reteste4.14set@example.com` (Ana Quarta & Beto Quarto), pedido
`186e4501-7cad-4aa2-b1e2-c0f7c6023da6`, Para Sempre, Toscana. Convidado em sessões
separadas, sem login.

**Resultado: nenhum erro. Os 23 achados seguem como estão — 21 resolvidos, 2
retratados. Nada novo apareceu.**

```
Cadastro
  WhatsApp "81987654321" → "(81) 98765-4321"; aparece em Dados da conta   UX-017 ✅
Questionário (1440×900)
  botão do topo "Salvar rascunho"                                           UX-011 ✅
  01/01/2020: min=2026-09-14, Continuar desabilitado, "Essa data já passou…" UX-009 ✅
  5.000 caracteres: "Chegou no limite de 5.000 caracteres…"                 UX-019 ✅
  Toscana → #9c8654 / #33351f / #f3eddd, nenhum aviso, amostra do casal     UX-006 ✅
  tipografia: 34 amostras, 34 famílias carregadas                           UX-023 ✅
  "Criar nosso site" → PRÉVIA PRONTA                                        UX-001 ✅
Painel
  /conta: 6 arquivos de fonte (105 KB); console sem aviso de fonte          UX-023 ✅
  .svg → "Esse arquivo não é uma foto que a gente consiga usar…"            UX-010 ✅
  .jpg → "1 de 40"
  Conteúdo: os 10 campos do questionário no lugar                           UX-003 ✅
  Pix inválido → erro, partnerA/giftMessage/story preservados               UX-004 ✅
  Pix válido → "Salvo ✓ — o site já está com o conteúdo novo."
  Visual: "Ana Quarta & Beto Quarto · 16 de setembro de 2028 ·
          Boa Vista, Recife/PE", sem Ana & Pedro                            UX-018 ✅
  Criar convite → editor, sem erro, domínio real, 0 localhost               UX-002 ✅
  Convidados: /rsvp/AHFiBEjb uma vez + 1 Copiar link visível                UX-016 ✅
  Início: 0 localhost                                                       UX-021 ✅
Prévia do convidado
  390×844: capa "BOA VISTA, RECIFE/PE"; âncoras 40px, CTA 44px;
           sem rolagem lateral; console limpo                               UX-014 UX-015 ✅
  mural na prévia: aviso + nome e recado continuam no campo                 UX-012 ✅
  Presentear: chave DO CASAL + BR Code; "Já fiz o Pix" → "Muito obrigado!"  UX-007 ✅
  1440×900: capa certa, conteúdo do casal, 0 localhost, sem rolagem lateral,
            título em Marcellus carregado, console limpo                   UX-023 ✅
RSVP sem login (grupo "Família Souza — tios da noiva", "Dona Ivete Souza", 1 lugar)
  "Dona Ivete, você vem?"; "tios da noiva" e "Família Souza" no HTML: 0     UX-008 ✅
  "Quantas pessoas vão?" + "de 1 reservado"                                 UX-022 ✅
  enviar → "Presença confirmada! Que alegria. Anotamos 1 lugar."
Ações
  Cancelar pedido → diálogo → /conta/pedidos com "Pedido cancelado.",
                    #cancelado some do endereço                             UX-020 ✅
  Sair da conta   → / com "Vocês saíram da conta."                          UX-020 ✅
Casal real (rotas certas: /isabelle-e-nycolas e /rsvp/<slug>)
  /isabelle-e-nycolas → 200; 6 arquivos de fonte, 105 KB; Italiana em uso   UX-023 ✅
  /rsvp/__Tzwfka, /api/qr/isabelle-e-nycolas (2.932 bytes), /, /conta/entrar,
  /conta/criar, /pacotes → 200; 0 localhost; 12 dicas de fonte no Link      UX-005 UX-021 ✅
```

UX-013 (retratado) não se aplica.

## Uma leitura que parecia erro e não era

O primeiro "Já fiz o Pix" falhou: o botão não existia. A aba da prévia tinha sido aberta
**antes** de salvar a chave Pix válida, e mostrava corretamente "Os noivos ainda não
cadastraram a chave Pix deles" — sem chave, sem forma de pagamento (§3 do AGENTS.md).
Recarregada depois de salvar, o fluxo passou inteiro. Não é defeito; é ordem do teste.

## Continua fora do escopo, sem mudança
- `/s/isabelle-e-nycolas` mostra "O site de vocês está sendo preparado" (anterior à
  auditoria; os convidados usam `/isabelle-e-nycolas`).
- 1 aviso de preload de CSS no painel, que não é de fonte.
