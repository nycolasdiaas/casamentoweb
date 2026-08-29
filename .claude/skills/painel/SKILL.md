---
name: painel
description: Telas do casal — questionário de 11 etapas (OrderWizard) e gerenciamento do pedido (/conta/pedidos/<id>/...). Use ao mexer em components/account/, lib/wizard/etapas.ts, lib/site/manageData.ts, ao acrescentar etapa ou aba, ou ao mexer em contagem regressiva e tela de espera.
---

# Painel do casal

Duas telas que eram uma parede só cada, refeitas pelo mesmo motivo.

## Questionário — `components/account/wizard/`

7 etapas. **Todo o estado vive no `OrderWizard`**; o `<form>` só carrega campos
ocultos. É o que permite trocar de etapa sem perder resposta, animar a troca, e
fazer o modelo pronto **preencher as três cores** — com estado local em cada
campo isso não acontecia.

A lista de etapas é **dado**, em `lib/wizard/etapas.ts`. O desenho é código.

Só mexendo no arquivo de etapas dá para: trocar a ordem (o contador "passo 3 de
7" e a animação acompanham sozinhos), mudar título/subtítulo, tirar uma etapa
(o que ela preenchia continua indo para a action como campo oculto com o valor
padrão), tornar obrigatória (`exige`).

**Etapa NOVA precisa de desenho novo.** Acrescente o `id` em `EtapaId` e o
TypeScript aponta o único lugar que falta: o mapa `conteudos` no `OrderWizard`.
É de propósito que reprove — etapa sem desenho renderiza vazio e o casal fica
olhando tela em branco.

**O que não pode mudar:** o que o formulário GRAVA. Os campos ocultos e o
contrato com `submitOrderAction` continuam idênticos, e a data segue passando
por `parseContentForm` — que é o que impede a cerimônia das 16h virar 19h e
ganhar mais três horas a cada salvamento.

**Só os nomes são obrigatórios.** Uma única regra de validação, e isso é
decisão de produto, não esquecimento: pular é estado válido em todo o resto, e
cada seção do molde degrada sozinha quando falta dado.

## Gerenciamento — 6 rotas

`/conta/pedidos/<id>/{,paginas,conteudo,visual,fotos,presentes}`

O menu mora no `layout.tsx` **de propósito**: não remonta ao navegar, então a
barra fica parada e só o conteúdo troca.

**`carregarGerenciamento` é a porta única** (`lib/site/manageData.ts`): sessão,
existência e posse do pedido em um lugar só. Repetir isso em seis arquivos é
como se esquece a verificação de dono em um deles.

## Duas armadilhas

- **Contagem regressiva é calculada no CLIENTE.** No servidor seria
  `Date.now()` durante o render: impuro, e com Cache Components a contagem
  congelaria dentro do cache ("faltam 102 dias" por dias a fio). O lint
  `react-hooks/purity` pega.
- **`useDelayedFlag` segura a tela de espera ~700 ms, não atrasa o aparecer.**
  A versão anterior fazia o contrário e, como o servidor responde rápido, a
  tela nunca era vista — "criei o pedido e não aconteceu nada".

## Ao acrescentar coluna

Atualize `scripts/setup-test-schema.mjs`. O schema `test` não recebe migração.
Custou duas rodadas: 0010 e 0011. Ver skill `banco`.

Texto que o casal lê? Skill `texto-do-casal`. Regra de produto? Agente
`regras-de-negocio`.
