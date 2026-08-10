# Prompt — refatoração visual do Enlace

Copie o bloco inteiro numa sessão **nova** do Claude Code, depois de reiniciar.

---

```
Você vai fazer a refatoração visual do Enlace, uma plataforma de sites de
casamento. Este é o pedido que já foi recusado quatro vezes por "continuar
com cara de IA" — leia até o fim antes de escrever uma linha.

═══════════════════════════════════════════════════════
PRIMEIRO: confirme suas ferramentas
═══════════════════════════════════════════════════════

Três MCP devem estar disponíveis. Confirme antes de começar:

• chrome-devtools — dirige o Chrome de verdade. É COM ELE que você julga o
  resultado, nunca por suposição. Esta base tem cinco scripts CDP escritos à
  mão porque isso não existia; se o MCP funcionar, prefira-o e considere
  aposentá-los.
• shadcn-ui — consulta componentes prontos.
• magic (21st.dev) — gera componente a partir de descrição.

Se algum não aparecer, diga qual e pare. Trabalhar sem o chrome-devtools é
o que produziu as quatro rodadas anteriores de "achei que estava bom".

Leia também, nesta ordem:
  1. AGENTS.md — armadilhas técnicas e a regra do banco com dados reais
  2. docs/ferramentas-de-design.md — o resumo do skill de design
  3. docs/plano-analise-concorrencia.md — o histórico das críticas

═══════════════════════════════════════════════════════
O DIAGNÓSTICO QUE VOCÊ ESTÁ HERDANDO
═══════════════════════════════════════════════════════

O skill de frontend-design da Anthropic lista três agrupamentos visuais que
denunciam trabalho gerado por IA. O PRIMEIRO é "fundo creme com serifada".

O Enlace é exatamente isso: papel #f2efe7, tinta oliva #3d4a36, dourado
#b8985f, serifada em tudo. Não é opinião — é o padrão catalogado, e é por
isso que o sócio olha e diz "parece o mesmo de sempre".

As críticas literais que voltaram:
• "muito cara de IA, tela centralizada demais, encurtada e desalinhada"
• "falta espaçamento, parece muito vazio, cru e sem vida"
• "a combinação de cores precisa ser revisada"
• "parece que o Claude sempre segue o mesmo padrão"

NÃO comece propondo. Foi isso que falhou quatro vezes.

═══════════════════════════════════════════════════════
O PROCESSO — duas passadas, nesta ordem
═══════════════════════════════════════════════════════

PASSADA 1 — sistema de tokens, SEM tocar em tela nenhuma.

Entregue num documento (docs/sistema-visual.md), para aprovação:

a) COR. Saia do creme-com-serifada. A âncora não é "o que combina com
   casamento" — é o mundo do assunto: papelaria, tecido, tinta, luz de fim
   de tarde, o material de um convite impresso. Proponha DUAS direções
   opostas, com hex, e diga o que cada uma comunica.

b) TIPOGRAFIA. Pareie display e corpo de propósito. Hoje é serifada em
   tudo, que é o caminho previsível. Diga por que cada par existe.

c) DENSIDADE E RITMO. "Vazio e sem vida" é problema de escala de
   espaçamento e de hierarquia, não de falta de enfeite. Proponha a escala.

d) ASSINATURA. Uma coisa só que ninguém mais faz. O skill diz: gaste a
   ousadia num lugar só, e não arriscar também é risco.

PARE aqui e espere aprovação. Só depois:

PASSADA 2 — aplicar, uma tela por vez, mostrando antes/depois.

Ordem: /conta (início) → /conta/pedidos → /conta/pedidos/<id> → landing.
Depois de CADA uma, capture com o chrome-devtools em 1440px e 390px e
mostre. Não avance sem retorno.

═══════════════════════════════════════════════════════
O QUE NÃO MUDA — quebrar qualquer um destes é regressão
═══════════════════════════════════════════════════════

1. O SITE DO CONVIDADO (/s/<slug>) NÃO ENTRA nesta refatoração. Ele é
   temático por casal: cor e fonte vêm do tema, e `npm run verify:template`
   reprova hex escrito na seção. Confundir painel com site do convidado já
   custou retrabalho aqui. Você mexe no PAINEL (/conta/*) e na landing.

2. As animações estão PRONTAS e verificadas — rolagem revelando 115
   elementos, transição de tela de 520ms com escala e desfoque, celebração,
   esqueleto, lightbox, tudo respeitando prefers-reduced-motion. NÃO
   refaça. Se um token de cor mudar, elas acompanham sozinhas.

3. NÃO rode `npx shadcn init`. Ele reescreve app/globals.css com as
   variáveis dele e apagaria a paleta e os tokens de movimento do projeto.
   Use o MCP do shadcn para CONSULTAR componentes e copiar o que servir.

4. O celular não pode piorar. 390px é mobile-first por decisão.

5. NUNCA rode `drizzle-kit push`. O banco tem um casamento real no ar com
   22 confirmações e links já no WhatsApp dos convidados.

6. `main` DEPLOYA PARA PRODUÇÃO. Trabalhe em branch própria.

7. Depois de todo `npm run build`, REINICIE o servidor antes de testar —
   rebuild com servidor de pé invalida o que ele serve e o CSS responde 500.
   No Windows, `pkill -f "next start"` não funciona; mate pela porta:
   Get-NetTCPConnection -LocalPort 3000 | Stop-Process -Force

═══════════════════════════════════════════════════════
COMO SABER QUE FICOU PRONTO
═══════════════════════════════════════════════════════

• Contraste medido com o chrome-devtools, NAS TELAS LOGADAS: nada abaixo de
  4.5:1. A conta de teste é casal.teste@enlace.com / enlace-teste-2026.
  (Uma auditoria anterior falhou porque o script caiu de volta na tela de
  login e auditou ela mesma — confirme a URL antes de confiar no número.)
• `npm run build`, `npx tsc --noEmit`, `npx eslint` limpos.
• `npm run test` em 293/293. Rode UMA suíte por vez: duas em paralelo
  apagam as tabelas uma da outra e geram falhas que não existem.
• `npm run verify:template` nos 6 moldes continua passando — prova de que
  você não vazou para o site do convidado.
• Capturas em 1440px e 390px de cada tela alterada.

Se algum pedido meu conflitar com uma restrição acima, aponte o conflito em
vez de escolher sozinho.
```

---

## Depois da refatoração visual

Fila, na ordem:

1. **Opção A** — requisito completo em `docs/plano-analise-concorrencia.md`
   (o questionário passa a coletar o conteúdo, para o site não nascer vazio).
2. **Categorias do álbum** — 11 categorias em ordem definida pelo Anderson:
   pré-wedding, noivado, entrada dos noivos, entrada das madrinhas e
   padrinhos, familiares & amigos, entrega das alianças, os votos, saída dos
   recém-casados, decoração e detalhes, making-of da noiva. Precisa de
   coluna nova em `site_photos` e upload por categoria.
3. **Curtir e comentar nas fotos** — escrita pública e anônima: exige
   moderação e limite por IP antes de qualquer pixel.
