# Próximo passo: mural de recados

Ponto de partida para a próxima sessão. Os 6 moldes estão portados (§4.4.1 do
[SDD](sdd-geracao-automatica.md)) e o funil fecha sozinho (§7.2).

## Por que isto é o que sobrou

`guestbook` é a **única seção do contrato sem implementação**. Está em
`SECTION_KEYS` e é liberada pelo pacote "para sempre", mas nenhum molde a
declara em `order` — o `registry.test.ts` até abre exceção explícita para ela.

As prévias já mostram o mural aos casais que estão decidindo a compra: quem
comprar o "para sempre" hoje vê na vitrine algo que o site entregue não tem.

## O que já existe e ajuda

- O contrato de seções não precisa mudar: é só implementar `guestbook` em
  cada molde e incluir na `order`.
- **`giftContributions` é o modelo mais próximo**: escrita pública e anônima,
  já com rate limit por IP em `registerContributionAction`.
- `GiftGrid` mostra o padrão de componente compartilhado estilizado só com
  tokens — o mural pode seguir o mesmo caminho e servir os 6 moldes com um
  componente só.

## Cuidados

- **É escrita pública e anônima.** Rate limit (`lib/rateLimit.ts`) e um
  caminho de moderação são requisito, não melhoria — §9.3 do SDD já lista
  isso como necessário agora. Sem moderação, o site do casamento de alguém
  vira mural aberto na internet.
- **Migração aditiva, com o ritual**: `npm run backup:full` →
  `npm run db:rehearse` → `npm run db:migrate`, com o `down` escrito à mão.
  Tabela nova pode nascer com `NOT NULL` (a regra aditiva protege tabelas que
  já têm linha de cliente).
- **Atualize `scripts/setup-test-schema.mjs`** — o schema `test` é mantido à
  mão e não recebe migrações.
- Invalide `site-photos`-style: a leitura do mural entra em cache com tag
  própria, e a action que publica precisa derrubá-la.
- Escrita pública num site em `preview` não deveria valer — o site ainda não
  é do público.

## Candidatos menores, se preferir uma fatia curta

- **E-mail "sua prévia está pronta"**: `lib/email.ts` só tem redefinição de
  senha. O §7 do SDD previa avisar o casal em `after()`; hoje ele só descobre
  a prévia se voltar à tela sozinho.
- **Upload do álbum pós-festa**: o slot `album` existe nos moldes, mas não
  tem upload — as fotos da festa só fazem sentido depois do casamento.
- **Cancelar pedido órfã o site** (ver "Pendências" no AGENTS.md): pequeno,
  mas acumula.
