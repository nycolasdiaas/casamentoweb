# Próximo passo — o painel de montagem do casal

Anotado em 28/07/2026, a partir de um pedido do Anderson com três referências:
[iCasei](https://www.icasei.com.br/site-de-casamento), um
[site real de casal no iCasei](https://sites.icasei.com.br/nycolaseisa/pages/38284216)
e o template [Bleecker do Squarespace](https://pt.squarespace.com/templates/bleecker-fluid-demo-pt).

---

## A distinção que organiza tudo

São **dois produtos diferentes**, e confundi-los leva a estimar errado:

| | Painel do casal | Site do casamento |
|---|---|---|
| Rotas | `/conta/*` | `/s/<slug>`, `/preview/<token>` |
| Quem usa | o casal, autenticado | o convidado, pelo link do WhatsApp |
| Para quê | montar, editar, escolher, **ver como vai ficar** | ser o convite |
| Largura | tela de trabalho, desktop | hoje `max-w-[480px]` (§4.4 do SDD) |

**O pedido é sobre o PAINEL.** O site do convidado continua o mesmo produto,
com os mesmos pacotes, os mesmos preços e os mesmos recursos. O que muda é o
quanto o casal enxerga e controla enquanto monta.

> **Os pacotes não mudam.** Convite, Site do Casamento e Para Sempre seguem
> como estão. Nada aqui é recurso novo de venda.

---

## O que foi pedido

Nos dois momentos — **montando o pedido** e **depois que a prévia fica pronta**:

1. **Ver a prévia enquanto escolhe.** Trocar molde, cor, fonte e ver o
   resultado na hora, sem sair da tela. Hoje o `ThemeEditor` já faz isso para
   cor e fonte, mas com uma amostra pequena, não com o site.
2. **Alternar PC / celular.** Os dois ícones do canto do Squarespace. O
   convidado abre no celular, mas o casal monta no computador — e precisa
   conferir os dois.
3. **Mexer no layout** e ver o efeito.
4. **Vídeo nos carrosséis**, além de foto.

---

## Tamanho de cada um

| # | Item | Tamanho | Depende de |
|---|---|---|---|
| 1 | Alternador PC/celular na prévia | pequeno | nada |
| 2 | Prévia ao vivo ao trocar molde/cor/fonte | médio | 1 |
| 3 | Vídeo nos carrosséis | médio | schema + player |
| 4 | Controle de layout | médio | 2 |

**Comece pelo 1.** Entrega valor sozinho, não depende de nada e vira a base
do 2: um `<iframe>` da rota de prévia dentro do painel, com a largura
alternando entre desktop e 390px. A rota `/preview/<token>` já existe e já
renderiza o site de verdade — não precisa de motor de preview novo.

Cuidado no 1: `next.config.ts` manda `X-Frame-Options: DENY` e
`frame-ancestors 'none'`. Embutir a prévia no painel exige liberar a própria
origem (`frame-ancestors 'self'`) — e **só** isso, nunca `*`.

---

## Sobre vídeo (item 3)

Cabe no que já existe: `site_photos` viraria `site_media` com uma coluna de
tipo, e a rota `/f/<id>` já repassa bytes de um bucket privado (§8.1 do SDD).

Dois cuidados que mudam a decisão:

- **Peso.** Vídeo de celular tem 50–200 MB. O limite de foto é 10 MB e a
  compressão por canvas não vale para vídeo. Provavelmente o caminho é
  **link do YouTube/Vimeo** em vez de upload, pelo menos no começo.
- **Autoplay.** No carrossel, vídeo só pode tocar mudo e sem som por padrão —
  o convidado abre o link no meio de uma reunião.

---

## O que NÃO foi pedido (e eu quase fiz)

Numa primeira leitura propus **reescrever os 6 moldes para widescreen**, o
que seria refazer a Fase 2 inteira (5–8 dias) e mexer num trabalho que tem
invariantes próprias no [AGENTS.md](../AGENTS.md).

Não é isso. O site do convidado é mobile-first de propósito: ele abre o link
no WhatsApp, no celular. Se um dia widescreen entrar lá, é decisão de rumo do
produto, separada deste pedido, e passa pelo Nycolas — que escreveu os moldes.
