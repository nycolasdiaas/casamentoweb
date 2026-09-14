# Segundo reteste completo no site no ar — 14/09/2026 (tarde)

Pedido do dono: "faça o teste dnv". Código `a7bb3ff` = `vercel-origin/main`, build
`AYMIZxqF4FfoMf8MqcL-2`. Conta nova `reteste3.14set@example.com` (Mia Terceira &
Tom Terceiro), pedido `6cf161b4-592a-40fa-8290-65d5d1def5e7`, Para Sempre, Toscana.
Convidado em sessões separadas, sem login.

**Resultado: os 22 achados continuam como estavam — 20 resolvidos, 2 retratados.
Nenhum voltou.**

```
Cadastro
  WhatsApp "81987654321" → "(81) 98765-4321"; aparece em Dados da conta   UX-017 ✅
Questionário (1440×900)
  botão do topo "Salvar rascunho"                                           UX-011 ✅
  01/01/2020: min=2026-09-14, Continuar desabilitado, "Essa data já passou…" UX-009 ✅
  5.000 caracteres: "Chegou no limite de 5.000 caracteres…"                 UX-019 ✅
  Toscana → #9c8654 / #33351f / #f3eddd, nenhum aviso, amostra do casal     UX-006 ✅
  "Criar nosso site" → PRÉVIA PRONTA                                        UX-001 ✅
Painel
  .svg → "Esse arquivo não é uma foto que a gente consiga usar…"            UX-010 ✅
  .jpg → "1 de 40"
  Conteúdo: os 10 campos do questionário no lugar                           UX-003 ✅
  Pix inválido → erro, partnerA/giftMessage/story preservados               UX-004 ✅
  Pix válido → "Salvo ✓ — o site já está com o conteúdo novo."
  Visual: "Mia Terceira & Tom Terceiro · 16 de setembro de 2028 ·
          Boa Vista, Recife/PE", sem Ana & Pedro                            UX-018 ✅
  Criar convite → editor, sem erro, domínio real, 0 localhost               UX-002 ✅
  Convidados: /rsvp/XuEVUEkR uma vez + 1 Copiar link visível                UX-016 ✅
  Início: 0 localhost                                                       UX-021 ✅
Prévia do convidado
  390×844: capa "BOA VISTA, RECIFE/PE"; âncoras 40px, CTA 44px;
           sem rolagem lateral; console limpo                               UX-014 UX-015 ✅
  mural na prévia: aviso + nome e recado continuam no campo                 UX-012 ✅
  Presentear: chave DO CASAL + BR Code; "Já fiz o Pix" → "Muito obrigado!"  UX-007 ✅
  1440×900: capa certa, conteúdo do casal, 0 localhost, sem rolagem lateral
RSVP sem login (grupo "Família Souza — tios da noiva", "Dona Ivete Souza", 1 lugar)
  "Dona Ivete, você vem?"; "tios da noiva" e "Família Souza" no HTML: 0     UX-008 ✅
  "Quantas pessoas vão?" + "de 1 reservado"                                 UX-022 ✅
  enviar → "Presença confirmada! Que alegria. Anotamos 1 lugar."
Ações
  Cancelar pedido → diálogo → /conta/pedidos com "Pedido cancelado.",
                    #cancelado some do endereço                             UX-020 ✅
  Sair da conta   → / com "Vocês saíram da conta."                          UX-020 ✅
Casamento real
  /, /rsvp/__Tzwfka, /s/isabelle-e-nycolas, /conta/entrar, /conta/criar,
  /pacotes → 200; QR 200, image/svg+xml, 2.932 bytes; og:url e og:image no
  domínio real; 0 localhost                                                 UX-005 UX-021 ✅
```

UX-013 (retratado) não se aplica.

## Observação nova — virou UX-023 (o dono mandou investigar e corrigir)

- 🟢 **O painel do casal pré-carrega ~29 arquivos de fonte que a tela não usa.** Em
  `/conta` e `/conta/pedidos/<id>/convidados`, com a aba visível, o console avisa
  "preloaded using link preload but not used within a few seconds" para 28–29 `.woff2`
  (e 1 CSS). ~~As páginas públicas pré-carregam 0 fontes.~~ **Errado — corrigido na
  investigação:** a busca procurou `<link as="font">` e as dicas vêm no cabeçalho
  `Link`. Recontado: `/rsvp/__Tzwfka` 17 arquivos (421 KB baixados, 3 famílias em uso),
  `/conta/entrar` 17, `/s/isabelle-e-nycolas` 44. Registrado como **UX-023**.
- **Causa, confirmada no manifesto do build:** as fontes dos seis moldes
  (`lib/templates/*/fonts.ts`) e as 34 prévias (`fontPreview.ts`) eram declaradas com
  `preload` padrão (`true`), e o manifesto espalhava esse pré-carregamento por rotas que
  não as usam — inclusive o RSVP.
- **Correção:** `preload: false` nessas 83 declarações. Build local, arquivos de fonte
  pré-carregados por rota:

  | Rota | Antes | Depois |
  |---|---|---|
  | `/rsvp/[slug]` | 17 | 6 |
  | `/conta` e telas do painel | 17 | 6 |
  | `/s/[slug]` e `/preview/[token]` | 44 | 6 |
  | `/conta/pedido/novo` | 45 | 6 |

  Sobram Italiana e Petit Formal Script (raiz, usadas em 33 arquivos) e as três da
  plataforma, ~103 KB.
- **Efeito:** o casal é o público no celular; baixar ~29 fontes em toda tela do painel
  gasta dados e atrasa a abertura. Não quebra nada e ninguém vê erro.
- **Verificado local (`next start` do build novo) contra produção (build antigo):**

  | Página | Produção antiga | Build novo | Fontes em uso |
  |---|---|---|---|
  | `/isabelle-e-nycolas` (casamento real) | 44 `.woff2` | 6 | Italiana nos dois — igual |
  | `/s/isabelle-e-nycolas` | 44 | 6 | — (tela "sendo preparado" nos dois) |
  | prévia Toscana (`/preview/<token>`) | — | 10 | Marcellus (título), Crimson Text, Allura — carregadas |
  | vitrines dos 6 modelos | — | 7–13 | a fonte do título carregada em todas |

  Sem o preload, as fontes do molde continuam chegando quando a página as usa.
- Mexe em carregamento de fonte, onde o projeto já teve "fontes falhando em lote"
  (Skill `cache-e-build`). Por isso foi primeiro registrado, e só corrigido depois do
  "investigar e corrigir" do dono.

## Deixado em produção por este reteste
Conta `reteste3.14set@example.com`, site `mia-terceira-e-tom-terceiro` em prévia
(pedido cancelado), 1 foto, 1 convite, 1 grupo com 1 confirmação, 7 presentes,
1 aviso de Pix. Sai com `scripts/limpar-dados-de-teste.mjs`, com backup antes.
