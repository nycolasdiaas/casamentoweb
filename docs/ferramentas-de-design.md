# Ferramentas de design — como ligar e o que esperar

Escrito em 02/08/2026, quando o Anderson mandou cinco links de skills e MCP.

## O que precisa de reinício (e por quê)

`.mcp.json` na raiz declara três servidores MCP. **Eles só carregam quando o
Claude Code inicia** — configurar no meio de uma sessão não os torna
utilizáveis nela. Feche e abra o Claude Code depois de ler isto.

| Servidor | Para quê | Precisa de |
|---|---|---|
| `chrome-devtools` | dirigir o Chrome de verdade: medir contraste, performance, layout, rodar Lighthouse | nada |
| `shadcn-ui` | consultar componentes shadcn/ui prontos | token do GitHub para não bater no limite de requisições |
| `magic` | gerar componente a partir de descrição (21st.dev) | **chave de API** — preencher `API_KEY` em `.mcp.json` |

O `magic` **não funciona sem a chave**. Pegue em 21st.dev/magic/console.

## Sobre o `chrome-devtools-mcp` especificamente

Esse é o que mais muda o trabalho aqui. Nesta base já foram escritos cinco
scripts de verificação à mão (`verificar-animacao`, `verificar-transicao`,
`verificar-scroll`, `verificar-painel`, `medir-overflow`) exatamente porque
não havia como perguntar ao navegador. Todos falam CDP na unha, e dois deles
travaram em `Page.navigate` sem resposta.

Com o MCP do DevTools, essa camada some. Vale revisitar os scripts depois —
provavelmente dá para aposentar a maioria.

## O que o skill de design da Anthropic diz (resumo do que foi lido)

Vale porque nomeia exatamente a crítica que o Nycolas fez ("parece que o
Claude sempre segue o mesmo padrão"):

- **Decisões vêm do assunto, não de padrão genérico.** Materiais, artefatos e
  vocabulário do mundo do cliente é que geram escolha distintiva.
- **Tipografia é personalidade.** Parear display e corpo de propósito, não as
  mesmas famílias de sempre.
- **Estrutura carrega significado**, não é decoração.
- **Reconhecer os agrupamentos-padrão de IA** e fugir deles: fundo creme com
  serifada, fundo escuro com acento ácido, layout de jornal. **Este projeto
  está no primeiro** — papel creme (#f2efe7) com serifada — que é
  literalmente o primeiro exemplo do que o documento manda evitar.
- **Gaste a ousadia num lugar só.** Contenção no resto.
- **Não arriscar também é risco.**
- Processo em duas passadas: montar um sistema compacto de tokens (cor,
  tipografia, layout, assinatura) e só então revisar contra o briefing antes
  de construir.

Fonte:
https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md
e https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines

## Por que isso não vira código nesta sessão

Refazer o visual pedia: ler os dois skills por inteiro, montar o sistema de
tokens, revisar contra o briefing e só então mexer nas telas. É a passada de
design que o próprio Nycolas pediu ("vamos escolher referências e trabalhar
em cima antes de pedir pra ele fazer algo") — e ela não cabe no fim de uma
sessão.

O caminho para a próxima está aqui: reinicie, confirme que os três MCP
apareceram, preencha a `API_KEY` do magic, e comece pela passada de tokens.
