/**
 * As listas de `Enlace - Voz e Microcopy.dc.html` V5, como dado verificável.
 *
 * ── Por que isto existe ────────────────────────────────────────────────────
 *
 * As três listas da prancha eram cumpridas à mão, e o produto já teve a
 * regressão que elas existem para impedir: os textos de `STATUS_META`
 * prometiam "nossa equipe vai começar a montar em breve" depois de o
 * provisionamento virar automático — copy da época em que um humano montava o
 * site. O comentário em `lib/orderStatus.ts` registra isso como erro a nunca
 * repetir, e um comentário não reprova build nenhum.
 *
 * Um valor de sistema cumprido à mão é a mesma classe de defeito que a
 * `.trilho` corrigiu para a largura. A diferença é que aqui não é estilo, é
 * promessa.
 *
 * Ver `specs/design-system/006-voz-verificavel/spec.md`.
 */

/** As 12 palavras do cartão "NÃO ESCREVEMOS" da prancha V5. */
export const PALAVRAS_PROIBIDAS = [
  "Ops!",
  "Sucesso!",
  "Inválido",
  "Algo deu errado",
  "Tem certeza?",
  "Clique aqui",
  "jornada",
  "experiência",
  "incrível",
  "mágico",
  "simplesmente",
  "apenas alguns cliques",
] as const;

/**
 * A tabela de tradução obrigatória de `docs/regras-de-negocio.md` §6 — o que
 * nunca aparece para o casal.
 */
export const TERMOS_TECNICOS = [
  "template",
  "molde",
  "deploy",
  "build",
  "slug",
  "rota",
  "preview",
  "upload",
  "tenant",
  "cache",
  "render",
] as const;

/**
 * As 7 palavras banidas do acompanhamento do pedido
 * (`docs/regras-de-negocio.md` §2.2).
 *
 * Valem SÓ nos dois arquivos de `ARQUIVOS_DE_ESPERA`. Aplicá-las ao produto
 * inteiro reprovaria "logo" e "em breve" em texto legítimo do site do
 * convidado — "logo depois da cerimônia" é português, não promessa de prazo.
 */
export const PALAVRAS_DE_ESPERA = [
  "em breve",
  "logo",
  "nossa equipe vai",
  "aguarde",
  "assim que possível",
  "prazo de entrega",
  "em fila",
] as const;

/** Onde a regra §2.2 mora. */
export const ARQUIVOS_DE_ESPERA = [
  "lib/orderStatus.ts",
  "components/account/OrderStatusTracker.tsx",
] as const;

/**
 * O que pode existir na rota e no admin, mas nunca no texto do convidado.
 *
 * A comparação desta lista **diferencia maiúscula**, e é isso que a torna
 * utilizável: `RSVP` escrito na tela é violação; `rsvp` como chave de
 * `SectionKey`, como âncora (`ANCORA_DA_SECAO`) e como nome de rota
 * (`/rsvp/<slug>`) é o identificador, e o identificador não muda — a rota tem
 * 23 confirmações reais e links já distribuídos (regras §2.5).
 *
 * A prancha V5 é literal: *"'RSVP' pode aparecer na rota e no admin; para o
 * convidado é sempre confirmar presença."*
 */
export const SO_PARA_O_CONVIDADO = ["RSVP"] as const;

/** O que escrever no lugar. Entra na mensagem de falha (FR-008). */
export const TRADUCAO: Record<string, string> = {
  "Ops!": "diga o que houve",
  "Sucesso!": "diga o que ficou pronto",
  "Inválido": "diga o que falta e como resolver",
  "Algo deu errado": "diga o que houve e o próximo passo",
  "Tem certeza?": "pergunta + consequência + reversibilidade",
  "Clique aqui": "o verbo da ação",
  jornada: "corte a palavra",
  experiência: "corte a palavra",
  incrível: "corte a palavra",
  mágico: "corte a palavra",
  simplesmente: "corte a palavra",
  "apenas alguns cliques": "diga quantos passos são",
  template: "escreva 'modelo' ou 'estilo'",
  molde: "escreva 'modelo' ou 'estilo'",
  deploy: "escreva 'colocar no ar'",
  build: "escreva 'colocar no ar'",
  slug: "escreva 'endereço do site' ou 'link'",
  rota: "escreva 'endereço do site' ou 'link'",
  preview: "escreva 'prévia'",
  upload: "escreva 'enviar foto'",
  tenant: "não aparece para o casal",
  cache: "não aparece para o casal",
  render: "não aparece para o casal",
  "em breve": "nunca prometa espera (§2.2)",
  logo: "nunca prometa espera (§2.2)",
  "nossa equipe vai": "nunca prometa espera (§2.2)",
  aguarde: "nunca prometa espera (§2.2)",
  "assim que possível": "nunca prometa espera (§2.2)",
  "prazo de entrega": "nunca prometa espera (§2.2)",
  "em fila": "nunca prometa espera (§2.2)",
  RSVP: "escreva 'confirmar presença'",
};

/**
 * Sem acento e em caixa baixa — para comparar sem depender de escrita.
 *
 * `NFD` separa a letra do acento, e a faixa U+0300–U+036F é a dos sinais
 * combinantes. Assim "Inválido", "invalido" e "INVÁLIDO" viram a mesma coisa.
 *
 * NÃO é usada em `SO_PARA_O_CONVIDADO`: lá a caixa é justamente o que separa
 * a violação (`RSVP`) do identificador (`rsvp`).
 */
export function achatar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Casa o termo como PALAVRA INTEIRA.
 *
 * O limite `\b` sozinho não serve: "Ops!" e "Tem certeza?" terminam em
 * pontuação, e `\b` depois de `!` é o oposto do que se quer. A borda só é
 * exigida no lado em que o termo começa (ou termina) com letra — é o que faz
 * "logo" não reprovar "logotipo" nem "/logo-enlace.png", e ao mesmo tempo
 * deixa "Ops!" casar.
 */
export function regexDoTermo(termo: string, sensivel = false): RegExp {
  const escapado = termo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const inicio = /[\p{L}\p{N}]/u.test(termo[0]) ? "(?<![\\p{L}\\p{N}])" : "";
  const fim = /[\p{L}\p{N}]/u.test(termo[termo.length - 1])
    ? "(?![\\p{L}\\p{N}])"
    : "";
  return new RegExp(inicio + escapado + fim, sensivel ? "u" : "iu");
}
