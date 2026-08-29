import type { PackageTier } from "@/lib/packages";

/**
 * Quando o site sai do ar — spec `site-publico/008`.
 *
 * ── O que "expirar" quer dizer aqui ────────────────────────────────────────
 *
 * **Arquivar, nunca apagar.** O site vira `archived`, o endereço passa a
 * responder 404 para o convidado, e conteúdo, fotos, presentes, grupos e
 * confirmações continuam no banco, intactos.
 *
 * É a mesma razão pela qual apagar a conta do casal não apaga o site do
 * casamento: o casamento aconteceu, e o registro dele não some porque um prazo
 * comercial venceu. Se o casal voltar em dois anos e pagar o Para Sempre,
 * tudo tem que estar lá.
 *
 * ── Por que este arquivo não fala com o banco ──────────────────────────────
 *
 * Tudo aqui é função pura sobre datas. A regra que decide se o site de alguém
 * sai do ar precisa poder ser lida, testada e conferida sem subir nada — e a
 * pergunta "faltam quantos dias?" aparece em quatro lugares (o cron, os três
 * e-mails, o painel do casal e o admin), que não podem discordar entre si.
 */

/** Meses de vida depois da data do casamento, para Convite e Site. */
export const MESES_APOS_O_CASAMENTO = 12;

/**
 * A DATA EM QUE A VITRINE PASSOU A DIZER O PRAZO. `null` = ainda não disse.
 *
 * ── Por que esta constante existe, e por que hoje ela é `null` ─────────────
 *
 * `lib/packages.ts` não promete prazo nenhum para Convite e Site. Quem comprou
 * até aqui comprou um site **sem prazo**, e a proposta é a página: o que foi
 * vendido é o que a tela dizia no momento da compra. Tirar do ar um site
 * vendido sem prazo é mudar o contrato depois de assinado.
 *
 * A FR-001 protege quem já publicou (sem backfill, `null` = nunca sai). Mas
 * sobrava uma porta dos fundos que ninguém tinha visto: **a publicação
 * tardia**. Um pedido pago hoje, com a vitrine calada, que só fosse publicado
 * depois desta spec subir, receberia prazo sem nunca ter sido avisado — porque
 * a FR-002 calcula na publicação, não na compra.
 *
 * Esta constante fecha a porta. Enquanto for `null`, **ninguém expira**: nem
 * quem já tem site, nem quem comprar amanhã. Toda a maquinaria fica montada,
 * testada e inerte.
 *
 * Quando a vitrine ganhar a linha do prazo (FR-011, em spec própria), esta
 * constante recebe a data do deploy — e só os pedidos feitos **a partir dali**
 * passam a expirar. É a ordem "construir, depois prometer" com a garantia de
 * que ninguém fica no meio.
 */
export const PRAZO_ANUNCIADO_EM: Date | null = null;

/**
 * O prazo vale para quem comprou DEPOIS de a vitrine anunciá-lo?
 *
 * A conta é sobre a data do PEDIDO e não a do site: o que importa é quando o
 * casal leu a proposta e pagou, não quando alguém apertou publicar.
 */
export function prazoValePara(
  compradoEm: Date | null | undefined,
  /* Injetável só para o teste poder exercitar o dia seguinte ao anúncio sem
     depender de uma constante que hoje é `null`. Em produção ninguém passa. */
  anunciadoEm: Date | null = PRAZO_ANUNCIADO_EM
): boolean {
  if (!anunciadoEm) return false;
  if (!compradoEm) return false;
  return compradoEm.getTime() >= anunciadoEm.getTime();
}

/**
 * Os pacotes que expiram.
 *
 * O `para-sempre` não está aqui, e é o ponto inteiro: ele cobra dez vezes o
 * Convite e uma de suas seis promessas é a permanência. Se todos ficassem no
 * ar para sempre — que é o que acontece hoje — a promessa seria falsa por
 * omissão.
 */
const TIERS_QUE_EXPIRAM: ReadonlySet<string> = new Set(["convite", "site"]);

export function tierExpira(tier: PackageTier | string): boolean {
  return TIERS_QUE_EXPIRAM.has(tier);
}

/**
 * A data em que o site sai do ar, ou `null` para "nunca".
 *
 * `null` e não uma data no ano 9999: o Para Sempre **não tem** data de
 * expiração, e escrever uma seria guardar uma mentira que algum relatório
 * futuro leria como verdade.
 *
 * **Sem data de casamento, também `null`.** É a única escolha segura: contar
 * da publicação tiraria do ar o site de um casal cuja festa ainda não
 * aconteceu.
 */
export function calcularExpiracao(
  tier: PackageTier | string,
  dataDoCasamento: Date | null | undefined,
  /** Quando o casal comprou. Sem isso, o prazo não vale — ver `prazoValePara`. */
  compradoEm?: Date | null,
  anunciadoEm: Date | null = PRAZO_ANUNCIADO_EM
): Date | null {
  if (!prazoValePara(compradoEm, anunciadoEm)) return null;
  if (!tierExpira(tier)) return null;
  if (!dataDoCasamento) return null;

  const d = new Date(dataDoCasamento);
  /* `setMonth` com estouro de ano é resolvido pelo próprio Date, e 31/01 + 12
     meses continua 31/01 porque o mês tem o mesmo tamanho um ano depois. O
     único caso que muda de dia é 29/02, que vira 01/03 — e um dia de
     diferença num prazo de doze meses não é decisão de ninguém. */
  d.setMonth(d.getMonth() + MESES_APOS_O_CASAMENTO);
  return d;
}

/** Já venceu? `null` nunca vence. */
export function estaExpirado(
  expiresAt: Date | null | undefined,
  agora = new Date()
): boolean {
  if (!expiresAt) return false;
  return expiresAt.getTime() <= agora.getTime();
}

/**
 * Dias inteiros até a expiração, contados em DIAS DE CALENDÁRIO.
 *
 * Não em blocos de 24 horas: o aviso de "30 dias" precisa sair no dia em que
 * o calendário diz 30, independentemente da hora em que o cron rodou. Medindo
 * por diferença bruta, um cron às 23h e outro às 01h dariam números
 * diferentes para o mesmo dia, e o aviso sairia duas vezes ou nenhuma.
 *
 * `null` quando não expira.
 */
export function diasAteExpirar(
  expiresAt: Date | null | undefined,
  agora = new Date()
): number | null {
  if (!expiresAt) return null;

  const meiaNoite = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  return Math.round((meiaNoite(expiresAt) - meiaNoite(agora)) / 86_400_000);
}

/**
 * Em quantos dias antes o casal é avisado.
 *
 * Dois avisos e não um: trinta dias é tempo de resolver, sete é o empurrão de
 * quem leu o primeiro e deixou para depois.
 */
export const AVISOS_EM_DIAS = [30, 7] as const;

export type AvisoDeExpiracao = "30-dias" | "7-dias" | "saiu-do-ar";

/**
 * Qual aviso cabe HOJE, se algum.
 *
 * ── Por que não existe coluna de "aviso já enviado" ────────────────────────
 *
 * O cron roda todo dia. Sem memória, o aviso de 30 dias sairia 23 vezes até o
 * site vencer. A saída óbvia seria uma coluna por aviso — três colunas para
 * uma pergunta só, e três oportunidades de ficarem inconsistentes.
 *
 * Aqui a memória é a própria data: o aviso de 30 dias só existe no dia em que
 * faltam **exatamente** 30. O dia 31 e o 29 não produzem nada.
 *
 * **O custo assumido:** um dia em que o cron não roda é um aviso perdido, sem
 * recuperação. Aceitável porque os três avisos são redundantes entre si e o
 * que importa — o de saída — é o único que não depende de acertar um dia
 * específico: ele vale para tudo que já venceu.
 */
export function avisoDeHoje(
  expiresAt: Date | null | undefined,
  agora = new Date()
): AvisoDeExpiracao | null {
  const dias = diasAteExpirar(expiresAt, agora);
  if (dias === null) return null;

  // Tudo que já venceu recebe o aviso de saída, inclusive o que venceu num dia
  // em que o cron não rodou — este é o aviso que não pode se perder.
  if (dias <= 0) return "saiu-do-ar";
  if (dias === 30) return "30-dias";
  if (dias === 7) return "7-dias";
  return null;
}

/** `16 de outubro de 2027` — para o e-mail e para o painel. */
export function dataPorExtenso(d: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(d);
}
