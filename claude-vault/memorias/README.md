# Memórias

Preferências de trabalho do Nycolas que **não se derivam do código nem do
histórico do git** — por isso ficam escritas, com o porquê junto.

Cada uma nasceu de uma correção real numa sessão. O "Why" é a parte que
importa: sem ele, a regra vira ritual e alguém a descarta na primeira vez que
parecer custosa.

| Memória | Regra |
|---|---|
| [disciplina-dados-de-cliente](disciplina-dados-de-cliente.md) | Backup e rollback antes de tocar o banco; nada de cliente é apagado |
| [fluxo-preview-antes-de-merge](fluxo-preview-antes-de-merge.md) | Branch própria, validação em build de produção, `main` só quando estável |

Estes arquivos espelham a memória de sessão do Claude Code
(`~/.claude/projects/.../memory/`), que não é versionada. Ao mudar uma regra,
mude nos dois lugares — ou o assistente seguirá a versão antiga.
