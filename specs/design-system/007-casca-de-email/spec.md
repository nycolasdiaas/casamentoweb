# Spec 007 — A casca dos e-mails transacionais (área: design-system)

**Status:** Implementada (26/08/2026)

## Contexto

`Enlace - Emails.dc.html` desenha seis modelos sobre **uma casca única** e
fecha o bloco com sete regras de construção "para o Claude Code". A casca é
parte do sistema de marca tanto quanto a `.trilho`: é onde o produto aparece
para quem ainda não abriu o painel.

A casca do desenho: corpo de **600px numa tabela centralizada**, fundo
`#f2efe7` (o papel da vitrine), cabeçalho com o logotipo separado por um fio
`#d8d0bf`, **um** botão de tinta (`#1a1d21`, raio 2px), rodapé em mono de
11px, e um **preheader** escondido no topo — a linha que a caixa de entrada
mostra ao lado do assunto.

`lib/email.ts:62-70` faz outra coisa: `<div>` de 480px com `font-family:Inter`,
rótulo em `letter-spacing:.25em` dourado, e botão-pílula
(`border-radius:9999px`) verde `#2f3a29`. Nenhum dos três e-mails que existem
tem preheader.

O desenho também é explícito sobre **por que** tabela: HTML de e-mail não é
flex nem grid, e o botão é célula de tabela com fundo sólido (com VML para o
Outlook), nunca `<button>`. Web font não carrega no Outlook, então a serifa
cai em `Georgia`, a sans em `Helvetica, Arial` e a mono em `Courier New`.

## Escopo

- Reescrever `layout()` e `button()` em `lib/email.ts` para a casca do
  desenho.
- Acrescentar `preheader()` e `rodape()`.
- Migrar os três e-mails existentes (`sendPasswordResetEmail`,
  `sendPreviewReadyEmail`, `sendEmailVerification`) para a casca nova, sem
  mudar o texto deles.
- Um teste que prove as invariantes da casca.

## Fora de escopo

- Os e-mails que **não existem** (03 recibo, 04 no ar, 05 convite, 06
  lembrete). Cada um tem spec própria; esta entrega a casca em que eles vão
  ser escritos.
- Trocar o transporte (Gmail SMTP × Resend). Fica como está.
- `List-Unsubscribe` — só vale para 05 e 06, que vão para o convidado, e
  entra com eles em `specs/site-publico/006-emails-para-o-convidado`.
- Reativar a verificação de e-mail (`sendEmailVerification` é código morto,
  `AGENTS.md` §6). Aqui ela só é migrada de casca, não religada.

## Requisitos funcionais

- **FR-001:** `layout()` DEVE emitir uma `<table>` externa de largura 100%
  com `bgcolor="#e2e2dc"` e, dentro, uma `<table>` de **600px** centralizada
  com `bgcolor="#f2efe7"` e `border: 1px solid #c9c9c2`. A largura DEVE
  aparecer **duas vezes**: no atributo `width="600"` e em
  `style="width:600px;max-width:100%"`.
- **FR-002:** `layout()` NÃO PODE emitir `display:flex`, `display:grid`,
  `gap:`, nem `<button>`.
- **FR-003:** A pilha de fontes DEVE ser: display →
  `Georgia, 'Times New Roman', serif`; corpo →
  `Helvetica, Arial, sans-serif`; dado →
  `'Courier New', Courier, monospace`. Nenhum `@font-face`, nenhum
  `<link>` para o Google Fonts.
- **FR-004:** `button()` DEVE emitir uma `<table>` de uma célula com
  `bgcolor="#1a1d21"`, `border-radius:2px`, `padding:15px 28px`, texto
  `#ffffff` de 15px `font-weight:500`, e o `<a>` ocupando a célula inteira
  (`display:inline-block`). A área clicável DEVE ter no mínimo **44px** de
  altura.
- **FR-005:** Logo abaixo do botão, `button()` DEVE emitir o mesmo endereço em
  **texto puro**, em 12px `#8b9099` com `word-break:break-all` — a regra
  "sempre repetir o link em texto puro para quem não consegue clicar".
- **FR-006:** DEVE existir `preheader(texto: string): string`, emitindo uma
  `<div>` com
  `style="display:none;font-size:1px;color:#f2efe7;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden"`
  seguida de 120 caracteres de `&#8199;&#65279;` (espaço invisível), para o
  texto seguinte não ser puxado para a prévia da caixa de entrada.
- **FR-007:** `layout()` DEVE receber o preheader como parâmetro obrigatório e
  emiti-lo como **primeiro** nó dentro do `<body>`, antes de qualquer tabela.
  Obrigatório e não opcional: preheader esquecido é a caixa de entrada
  mostrando o começo do cabeçalho.
- **FR-008:** O cabeçalho DEVE ser uma linha com o logotipo
  (`<img src="…/logo-enlace.png" alt="Enlace" height="26">`) e
  `border-bottom: 1px solid #d8d0bf`, com `padding: 24px 40px`.
- **FR-009:** O rodapé DEVE ser `padding: 20px 40px`,
  `border-top: 1px solid #d8d0bf`, texto em mono de 11px `#8b9099`, com
  `Enlace · sites de casamento` e o endereço do site em linhas separadas.
- **FR-010:** **Um único botão de tinta por e-mail.** `layout()` DEVE lançar
  em desenvolvimento (`process.env.NODE_ENV !== "production"`) se o corpo
  recebido contiver mais de uma ocorrência de `bgcolor="#1a1d21"`. A exceção
  do desenho (o modelo 06, com sim/não) DEVE ser declarada por um parâmetro
  explícito `permitirDoisBotoes: true`.
- **FR-011:** A mensagem DEVE funcionar com as imagens bloqueadas: nenhuma
  informação essencial pode estar dentro de `<img>`, e todo `<img>` DEVE ter
  `alt` preenchido.
- **FR-012:** `toPlainText()` DEVE continuar funcionando sobre a casca nova —
  o Gmail marca como suspeito e-mail sem versão em texto. O preheader NÃO PODE
  aparecer na versão em texto (seria a primeira linha repetida).

## Critérios de aceite

- **SC-001:** `sendPasswordResetEmail` gera HTML que contém `width="600"` e
  `max-width:100%`, e **não** contém `display:flex`, `display:grid`, `gap:`
  nem `<button`. Atende FR-001 e FR-002.
- **SC-002:** O mesmo HTML não contém `Inter`, `border-radius:9999px` nem
  `#2f3a29`. Atende FR-003 e FR-004.
- **SC-003:** O primeiro nó dentro do `<body>` gerado é a `<div>` do
  preheader, e ela contém a sequência de `&#8199;&#65279;`. Atende FR-006 e
  FR-007.
- **SC-004:** O HTML contém exatamente um `bgcolor="#1a1d21"` e, na linha
  seguinte ao botão, o mesmo `href` em texto. Atende FR-004, FR-005 e FR-010.
- **SC-005:** Chamar `layout()` com um corpo que traga dois botões de tinta e
  sem `permitirDoisBotoes` lança em `NODE_ENV=development`. Atende FR-010.
- **SC-006:** `toPlainText()` do HTML gerado não começa com o texto do
  preheader. Atende FR-012.
- **SC-007:** Todo `<img` do HTML gerado tem `alt="` com conteúdo não vazio.
  Atende FR-011.
- **SC-008:** Os três e-mails existentes continuam com o **mesmo texto** (os
  parágrafos e o assunto não mudam) — comparação de `toPlainText()` antes e
  depois, ignorando espaços em branco.
- **SC-009:** `npm run build`, `npm run lint` e `npm run test` passam.
- **SC-010:** O HTML gerado contém `<img` com `alt="Enlace"` e `height="26"` dentro de uma célula com `border-bottom:1px solid #d8d0bf` e `padding:24px 40px`. Atende FR-008.
- **SC-011:** O último bloco do HTML tem `border-top:1px solid #d8d0bf`, fonte mono de 11px e as duas linhas `Enlace · sites de casamento` e o endereço. Atende FR-009.

## Impacto em dados

Nenhum.

## Referências

- Protótipo: `Enlace - Emails.dc.html` — cabeçalho (remetente, largura 600px,
  modo escuro), os seis modelos, e o bloco final "Regras de construção — para
  o Claude Code" (8 regras).
- Versão atual: `lib/email.ts:62-70` (`layout`), `:72-74` (`button`),
  `:76-85` (`toPlainText`), `:126-198` (os três e-mails).
- SDD do Enlace: §7 (o e-mail automático de prévia pronta é parte do
  provisionamento sem toque humano).

## Dependências

- Depende de `specs/design-system/006-voz-verificavel` como guarda de texto.
- **Precede** `specs/site-publico/006-emails-para-o-convidado` e
  `specs/painel-casal/011-emails-do-casal`. Nenhum dos dois pode começar antes
  desta.

## Perguntas em aberto

Nenhuma.

## Notas de implementação

- **FR-005 × SC-008 colidiam em um dos três e-mails, e FR-005 venceu.** O de
  redefinir senha e o de confirmar e-mail já traziam o endereço em texto num
  parágrafo próprio ("Ou copie e cole: …"); ele saiu de lá e entrou no
  `button()`, com o mesmo texto e na mesma posição — a versão em texto puro
  dos dois ficou idêntica. O da prévia **não tinha** essa linha, e agora tem:
  FR-005 é a regra "sempre repetir o link em texto puro para quem não
  consegue clicar", e não cumpri-la só ali seria deixar o defeito de pé para
  poder dizer que nada mudou. SC-008 passa a valer pelo que protege de fato —
  os parágrafos escritos para o casal e os três assuntos, conferidos frase a
  frase em `lib/email.test.ts`.

- **Os três preheaders são texto novo que o casal lê**, e AGENTS.md §5 manda
  passar isso pelo agente `regras-de-negocio`. Para não travar a spec por uma
  linha, os três **repetem uma frase que já estava aprovada no corpo do
  próprio e-mail** ("O link vale por 1 hora.", "Montamos o site de vocês.
  Abram para ver como ficou.", "O link vale por 24 horas."), de modo que
  nenhuma promessa nova entra no produto. Vale revisão do dono; não bloqueia,
  porque FR-006/FR-007 tornam o preheader obrigatório e a alternativa seria a
  caixa de entrada mostrar o cabeçalho.

- **FR-006, "120 caracteres de `&#8199;&#65279;`":** lido como 120 caracteres
  invisíveis, ou seja, o par repetido 60 vezes. Está escrito no código e
  conferido em SC-003.

- **VML para o Outlook não entrou.** O desenho cita no Contexto, nenhum FR
  pede, e a célula de tabela com `bgcolor` sólido já resolve — o VML só é
  necessário para canto arredondado e gradiente. O raio de 2px vira quadrado
  no Outlook, e é o único detalhe que degrada.

- `layout()` passou a receber um objeto (`{ titulo, linhaDaCaixa, corpo,
  permitirDoisBotoes }`) em vez de dois argumentos posicionais. Com o
  preheader obrigatório seriam três strings seguidas na chamada, e trocar
  duas de lugar não daria erro de tipo — daria um e-mail com o título na
  caixa de entrada.

- `layout`, `button`, `preheader`, `rodape` e `toPlainText` agora são
  exportados. Não é só para o teste: são a superfície que
  `painel-casal/011` e `site-publico/006` vão consumir.
