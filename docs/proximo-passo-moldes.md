# Próximo passo: portar os 5 moldes restantes (Fase 2)

Ponto de partida para a próxima sessão. O contexto completo está no
[SDD](sdd-geracao-automatica.md) §4 e §10; aqui fica só o que é preciso para
começar sem redescobrir nada.

A publicação ao pagamento está feita — ver §7.2 do SDD. O funil comercial
fecha sozinho: pedido → site → prévia → pagamento → no ar.

## Por que isto é o próximo

**Vendemos 6 estilos e entregamos 1.** Só o Clássico está portado para o
motor. Um casal que escolha Editorial, Film, Moderno, Romântico ou Toscana
recebe um site que diz "estamos preparando" — com o pedido pago e o funil
inteiro funcionando até ali.

É a maior distância entre o que a landing promete e o que o casal recebe.

## O que já existe e ajuda

- **O contrato está provado**: `TemplateModule` (`lib/templates/contract.ts`)
  com `order`, `sections`, `defaultTheme` e `fonts`. O Clássico é a
  referência viva de como preencher.
- **As prévias já existem como código pronto**: `app/pacotes/estilos/<id>/`
  tem cada estilo desenhado com casal fictício e hex fixo. Portar é trocar
  hex por `var(--ink)`/`var(--accent)` e o texto fixo por `content`.
- **Presets de tema já existem para os 6** (`lib/theme/presets.ts`) — o
  provisionamento grava tema válido mesmo para molde não portado.
- **Fotos e presentes já são agnósticos de molde**: `SitePhoto`, `GiftGrid` e
  `Countdown` falam só tokens, então servem qualquer estilo.
- `SiteFromView` já degrada com elegância: molde não portado mostra um estado
  honesto, não 404.

## Cuidados

- **Cada molde declara as PRÓPRIAS fontes** em `lib/templates/<id>/fonts.ts`.
  Não centralize: 34 fontes num módulo só custaram 83,6 KB de CSS com 61%
  desperdiçado (medido, §4.3 do SDD). Cada fonte num `const` no escopo do
  módulo — dentro de objeto literal o `next/font` falha no build.
- **Seção que busca dado próprio é async server component** e recebe
  `siteId` (é assim que `Gifts` e `Cover` funcionam). Não faça o
  `SiteRenderer` saber o que cada seção consome.
- **Rode `npm run build`**, não só o `dev`: erro de rota e de fonte só
  aparece no build estrito.
- Vale conferir se cada molde honra `sectionsForTier` — o pacote decide quais
  seções existem, o molde decide como elas ficam.

## Candidatos menores, se preferir fatias curtas

- **Mural de recados** (`guestbook`): única seção do contrato sem
  implementação. Escrita pública e anônima — precisa de rate limit e
  moderação, como as outras escritas públicas (§9.3 do SDD).
- **E-mail "sua prévia está pronta"**: `lib/email.ts` só tem redefinição de
  senha. O §7 do SDD previa avisar o casal em `after()`; hoje ele só descobre
  a prévia se voltar à tela sozinho.
- **Upload do álbum pós-festa**: o slot `album` existe no molde, mas não tem
  upload — as fotos da festa só fazem sentido depois do casamento.
