# Teste exploratório no site no ar — 15/09/2026 (método SARGENTO)

Pedido do dono: "teste no site que está no ar", com o protocolo SARGENTO (intake →
compreensão → navegação → correção → consolidação). O intake já estava respondido pela
sessão; o foco foi o que os três retestes da auditoria **não** cobriam.

Código `5b8aec6` = `vercel-origin/main`. Conta de teste `sargento.14set@example.com`,
pedido `7361cf6b-b2c1-4466-8a7d-85ac90707237`, grupos `/rsvp/PHUBoPsb` (Carla e Davi,
2 lugares) e `/rsvp/cj8DgByQ` (sem nomes, 3 lugares).

## O que foi varrido

```
links internos (27 URLs a partir de /, /pacotes, estilos, conta, casal real) ... nenhum quebrado
rotas inválidas: /rsvp, /s, /preview, /f, /c, página inexistente, /api/qr ........ 404
/conta/pedidos/<id> e /conta/convites/<id> sem login ............................ 307 → /conta/entrar
/admin sem login ................................................................ 307 → /admin/login
/api/pedido/provisionar e /api/pagamento/confirmar sem login ...................... 307 → /conta/entrar
/api/track: GET 405, POST 204
cabeçalhos: HSTS (2 anos, preload), CSP frame-ancestors 'self', X-Frame-Options SAMEORIGIN,
            X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy ..... presentes
login com conta inexistente .................... "E-mail ou senha incorretos."
login com e-mail sem @ ......................... validação do navegador
cadastro com senha curta ....................... "A senha precisa de pelo menos 8 caracteres."
"esqueci a senha" com e-mail inexistente ....... resposta genérica (não revela se a conta existe)
Lighthouse home (desktop) ...................... acessibilidade 90, boas práticas 100, SEO 100
Lighthouse /rsvp/__Tzwfka (celular) ............ acessibilidade 100, boas práticas 100, SEO 60
                                                 (o 60 é o `noindex, nofollow` — correto para link privado)
RSVP "Não posso" com nomes ..................... "Resposta enviada. Avisamos o casal."
RSVP confirmação parcial (2 de 3) .............. "Presença confirmada! … Anotamos 2 lugares."
painel depois das respostas .................... reservados 5, vão 0, sem resposta 0 — bate
```

## Achados

| ID | Sev. | O quê | Causa |
|---|---|---|---|
| UX-024 | 🟠 | Editar a resposta do RSVP grava, mas a tela volta ao formulário sem confirmar | `reabrir` booleano em `ConfirmacaoDePresenca.tsx` ficava verdadeiro para sempre |
| UX-025 | 🟡 | Família sem nomes lê "vocês vêm?" com minúscula | título = saudação + pronome; sem saudação sobrava o pronome |
| UX-026 | 🟡 | Cadastro grava WhatsApp "(81) 9" | `pattern` inválido na flag `v` (o navegador ignora) e `signupAction` sem checagem |
| UX-027 | 🟢 | "E-mail ou senha incorretos." não é anunciado ao leitor de tela | `Campo.tsx` sem `role="alert"` |

Provas:
- UX-024: depois de editar para "Não posso", a tela mostrou o formulário; recarregada, "Não
  posso" estava marcado e o painel dizia "Não vão" — gravou, só não confirmou.
- UX-026: `new RegExp('^(?:[\\s()+\\-0-9]{10,20})$', 'v')` → "Invalid character in character
  class"; com `[0-9 \(\)+\-]{10,20}` o campo recusa "(81) 9". "Dados da conta" mostrou
  "WhatsApp (81) 9".

## Registrado, sem mudança de código

- **`CRON_SECRET` vazio em produção.** `/api/cron/expirar-sites` e `/api/cron/resumo-semanal`
  respondem 503 antes de checar autorização — só acontece sem o segredo. O `vercel.json`
  agenda as duas, e nenhuma roda. Expirar sites hoje não tem efeito (nenhum site tem prazo);
  o **resumo semanal nunca é enviado**. Decisão e configuração do dono.
- **`ABACATEPAY_WEBHOOK_SECRET` está configurado** (a rota responde 401, que só vem depois da
  checagem do segredo). O AGENTS.md ainda diz "webhook DESLIGADO" — documentação velha.
- **Home, acessibilidade 90:** itens "não incluído" dos pacotes em `#9c9fa3` sobre branco
  (contraste 2,65:1, pede 4,5:1); dois `span` com `aria-label` (proibido nesse elemento);
  a página não tem `<main>`. Mexe em desenho — não alterado.

## Incidente nos portões (não é defeito do código)

A primeira rodada da suíte correu **junto com o `next build`**. O build também vai ao
banco (`generateStaticParams` de `/c/[slug]` chama `listPublishedInviteSlugs`) e falhou
com "Failed to collect page data for /c/[slug]"; refeito sozinho, passou.

A suíte daquela rodada deixou 18 falhas em `provision.test.ts` e `publish.test.ts` —
arquivos que esta correção não toca (`lib/site/provision.ts` não importa nenhum dos
arquivos alterados). Rodado sozinho depois, `provision` falhou com 13, depois 7 casos,
sempre no limite de 20 s, e com `duplicate key … sites_slug_key (marina-e-rafael)`.

Leitura: quando um caso estoura o tempo, o vitest segue para o próximo, mas as consultas
do caso abandonado continuam no banco — inserem o mesmo casal enquanto o caso seguinte
limpa e insere, e a disputa gera travas, mais timeouts e a chave duplicada. Latência
medida em seguida, só com operações do schema `test`: `test:setup` em 11 s (~60 comandos),
`rsvp-actions.test.ts` 13/13 em 60 s.

## Correções no ar — build `dERh1NZhkbV3YcBPStvlH` (commits `6feb97b` e `7cf04ee`)

Portões: lint, `tsc` e `next build` limpos; **844 testes em 74 arquivos** verdes, com a
suíte rodando sozinha.

```
/rsvp/cj8DgByQ (3 lugares, sem nomes)
  título ................. "Vocês vêm?"                                    UX-025 ✅
  responder → enviar ..... "Presença confirmada! Anotamos 3 lugares."
  Editar resposta → Não posso → enviar
                         ... "Resposta enviada. Avisamos o casal."          UX-024 ✅
/conta/criar com "(81) 9"
  navegador .............. barra: "É preciso que o formato corresponda ao exigido."
  envio forçado .......... "Confira o WhatsApp — com DDD, são 10 ou 11 números."  UX-026 ✅
/conta/entrar com senha errada
  mensagem ............... role="alert", id campo-password-erro, e o campo com
                           aria-describedby apontando para ela              UX-027 ✅
contraste dos itens ausentes
  home ................... rgb(90,95,102) sobre branco = 6,43:1 (era 2,66)  UX-028 ✅
  /pacotes ............... 14 itens, todos em 6,43:1 (era 3,21)             UX-028 ✅
  Lighthouse da home ..... acessibilidade 90 → 94
casal real ............... /isabelle-e-nycolas, /rsvp/__Tzwfka, QR, /, /pacotes,
                           /conta/criar — todos 200
```

Seguem sem mudança, por decisão: `aria-label` em `span` e a falta de `<main>` na home
(as 2 reprovações restantes do Lighthouse), e o `CRON_SECRET`, que é configuração do dono.

## Dois erros meus no caminho

1. O commit `7119c69` subiu com a auditoria pela metade: o script que atualizava os status
   parou num trecho que não existia (supus um separador entre a UX-027 e a UX-028), e o
   `git commit` rodou assim mesmo porque eu não encadeei os comandos.
2. A primeira tentativa de consertar falhou no shell: o texto continha uma linha igual ao
   marcador de fim do bloco, e o comando foi cortado no meio. Nada chegou a ser gravado.

Daí a regra que fica: script em arquivo, e `script && git commit` — nunca um depois do
outro sem encadear.


## Dados de teste — apagados
Autorizado pelo dono. Backup antes: `backups/full-backup-2026-09-15T23-31-26-065Z.json`.
`scripts/limpar-dados-de-teste.mjs --apagar`: 1 conta (`sargento.14set@example.com`),
1 pedido, 1 site em prévia, 2 grupos (`PHUBoPsb` e `cj8DgByQ`), 2 convidados, 7 presentes.
Nenhum site publicado na lista. Em seguida, casal real e rotas críticas: todas 200.
