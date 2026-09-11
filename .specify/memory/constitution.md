<!--
Sync Impact Report
- Versão: (inexistente, template em branco) → 1.0.0
- Ratificação inicial da constitution do Enlace (CasamentoWeb), escrita em modo brownfield:
  princípios extraídos do projeto existente (AGENTS.md, docs/regras-de-negocio.md,
  docs/sdd-geracao-automatica.md, specs/INDEX.md) + os sete princípios obrigatórios
  pedidos pelo dono para o ciclo de auditoria E2E de usabilidade.
- Princípios adicionados: I. Usuário primeiro · II. Rastreabilidade total ·
  III. Não quebrar o que funciona · IV. Feedback explícito · V. Sem perda de dados ·
  VI. Mobile é o cenário principal · VII. Português claro, sem jargão
- Seções adicionadas: "Restrições da plataforma" (stack, banco vivo, Pix, build) e
  "Fluxo de trabalho e portões de qualidade" (ciclo Spec-Kit, branches, commits, gates)
- Removidas: nenhuma (o arquivo anterior era o scaffold sem valores)
- TODOs deferidos: nenhum
-->

# Enlace (CasamentoWeb) Constitution

O Enlace vende site de casamento pronto. Três promessas sustentam o produto e, por
consequência, esta constitution: **o casal não trabalha**, **o dono não encosta no
código**, **a página é a proposta**. Todo princípio abaixo existe para proteger uma
delas.

## Core Principles

### I. Usuário primeiro

Toda mudança de código MUST ser rastreável a um problema observado em uso real da
interface — um `UX-XXX` registrado na auditoria E2E. Não se corrige o que ninguém viu
quebrar, e não se refatora "de passagem" o que a auditoria não apontou. Problema novo
descoberto durante a implementação MUST virar um `UX-XXX` novo na auditoria (marcado
"encontrado na Fase 3") antes de ser corrigido, nunca uma correção silenciosa.

**Racional:** o repositório já acumulou trabalho que ninguém pediu (a branch órfã
`feedback-001`, 57 arquivos que nunca entraram). Exigir origem observável é o que
impede a próxima.

### II. Rastreabilidade total

A cadeia `UX-XXX` (auditoria) → `FR-XXX` (spec) → `TXXX` (task) → commit MUST estar
completa e navegável nos dois sentidos:

- Todo `FR-XXX` cita explicitamente quais `UX-XXX` resolve.
- Toda task cita o `UX-XXX` que atende e tem uma task de verificação E2E correspondente.
- Toda mensagem de commit carrega os IDs: `fix(ux): <o que mudou> [UX-007][T012]`.
- `/speckit-analyze` MUST acusar zero `UX-XXX` sem `FR` e sem task antes de
  `/speckit-implement` rodar.
- Nenhum `UX-XXX` fica sem destino: **Resolvido**, **Parcial**, **Adiado** (com
  justificativa) ou **Bloqueado** (por decisão do dono).

### III. Não quebrar o que funciona

A stack é dada e não está em discussão: **Next 16 (App Router, `cacheComponents`,
`proxy.ts`), React 19, Drizzle + Postgres/Supabase, Tailwind 4, GSAP no site do
convidado, Motion no painel**. Trocar biblioteca, reescrever tela inteira ou mudar
arquitetura MUST ter necessidade comprovada por um `UX-XXX` 🔴/🟠 que não tenha solução
menor — e MUST ser decisão do dono, não do implementador.

O motor de templates (molde + tokens + conteúdo do banco) MUST continuar sendo a única
fonte do desenho: corrigir um molde corrige todos os sites. Desenho chumbado em
componente é violação.

### IV. Feedback explícito

Toda ação do usuário — salvar, enviar, excluir, falhar — MUST produzir retorno visível
na tela em que ele está. Botão que dispara ação MUST mostrar estado de carregamento e
MUST ficar desabilitado enquanto processa. Erro MUST dizer o que aconteceu e o que
fazer, em vez de sumir ou repetir o formulário vazio. Ação destrutiva MUST ser honesta
sobre a consequência antes de acontecer.

**Proibido:** sucesso silencioso, tela que muda sem explicar por quê, e qualquer
promessa de tempo de espera ("em instantes", "em até 2 minutos") que o sistema não
possa cumprir.

### V. Sem perda de dados

Nenhum fluxo MUST descartar informação que o usuário digitou. Especificamente:

- Salvamento parcial MUST preservar **tudo** que estava preenchido, não um subconjunto.
- Recarregar a página, voltar uma etapa ou sair e entrar de novo MUST manter o
  progresso.
- Migração de banco MUST ser aditiva — nada apagado, nada reescrito — com
  `npm run backup:full` antes e rollback escrito antes. **`drizzle-kit push` é
  proibido**; o caminho é `db:generate` + `db:rehearse` + `db:migrate`.
- `/rsvp/[slug]` MUST continuar funcionando a cada entrega: há convidado real com o
  link no WhatsApp. Slug de grupo existente é imutável.

### VI. Mobile é o cenário principal

O convidado abre o site do casamento pelo celular. Todo critério de aceite de tela
pública MUST ser verificado em **390×844** antes de 1440×900, e a entrega só passa se
passar nos dois. Nenhuma rolagem horizontal, nenhum alvo de toque menor que ~44px,
nenhuma informação essencial que só apareça no desktop.

### VII. Português claro, sem jargão

Todo texto que o casal ou o convidado lê MUST estar em PT-BR, na voz do produto, sem
vocabulário técnico ("payload", "slug", "template", "upload falhou", "erro 500"). O
texto MUST dizer o que aconteceu na vida do usuário, não no sistema. Regra de produto
escrita em texto visível (preço, o que o pacote inclui, promessa de prazo) MUST ser
confirmada com o agente `regras-de-negocio` antes de entrar — **nunca inferida do
código**, porque o código já esteve errado.

## Restrições da plataforma

- **O banco tem cliente real.** Casamento no ar em 16/10/2026, com grupos e convidados
  reais e links já distribuídos. Ambiente de produção não é laboratório: nenhuma ação
  apaga, reescreve ou renomeia dado existente.
- **A resposta do RSVP vive em dois lugares** (`guests.rsvp_status` e
  `groups.seats_confirmed`) e os dois são verdade. Unificar é decisão do dono.
- **Pix é do casal, nunca do código.** Sem chave própria do casal, não existe forma de
  pagamento: `getSitePix` devolve `null`. Chave de fallback, de exemplo ou herdada é
  proibida — o teste `lib/pix/sem-chave-global.test.ts` reprova o retorno da constante.
- **`next build` é a verdade.** `cacheComponents: true` está ligado e PPR é o padrão; o
  `next dev` é permissivo e o build é estrito. Erro de rota só aparece no build.
- **Métricas sem IP.** `visitor_hash` é HMAC com sal que gira a cada 24h (LGPD). Gravar
  IP é proibido.
- **Uma suíte de teste por vez** — elas limpam as mesmas tabelas.

## Fluxo de trabalho e portões de qualidade

**Ciclo obrigatório por feature:** `/speckit-specify` → `/speckit-clarify` →
`/speckit-plan` → `/speckit-tasks` → `/speckit-analyze` → `/speckit-implement`.
Ambiguidade marcada `[DECISÃO NECESSÁRIA]` MUST ser perguntada ao dono em
`/speckit-clarify` — nunca decidida pelo implementador.

**Ordem de correção:** todos os 🔴 e 🟠 entram antes de qualquer 🟡 ou 🟢.

**Branch e commit:** uma branch por feature. Push direto na `main` e deploy em produção
MUST ter autorização explícita do dono, pedida no momento. Commits pequenos, um assunto
por commit, mensagem com os IDs.

**Portões, ao final de cada feature (todos obrigatórios):**

1. `npm run lint` limpo.
2. Type-check limpo.
3. `npm run build` passando — build quebrado bloqueia a feature seguinte.
4. `npm run test` verde para o que a feature tocou.
5. Cada critério de aceite verificado **no navegador**, em desktop e mobile, com
   evidência salva em `docs/auditoria/evidencias/`.

Análise de código NUNCA substitui o teste na interface: ela só explica a causa depois
que o teste mostrou o sintoma.

## Governance

Esta constitution prevalece sobre preferência pessoal, hábito e conveniência de prazo.
Quando ela conflitar com `docs/regras-de-negocio.md`, **o produto vence** e a
constitution é emendada para registrar o porquê.

**Emenda:** proposta escrita com motivo e impacto, aprovação do dono, e atualização dos
artefatos afetados na mesma entrega. Emenda que remove ou redefine princípio é MAJOR;
princípio ou seção nova é MINOR; correção de redação é PATCH.

**Conformidade:** todo `/speckit-plan` MUST declarar como respeita cada princípio, e
todo `/speckit-analyze` MUST reprovar a feature que violar um deles sem justificativa
escrita. Complexidade extra MUST ser justificada — na dúvida, a solução menor ganha.

**Guia de execução no dia a dia:** `AGENTS.md` (carregado em toda sessão) e as Skills do
projeto (`banco`, `cache-e-build`, `molde`, `testes`, `fotos`, `movimento`, `painel`,
`texto-do-casal`).

**Version**: 1.0.0 | **Ratified**: 2026-09-11 | **Last Amended**: 2026-09-11
