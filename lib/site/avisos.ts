import { and, desc, eq, gte, inArray, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  gifts,
  giftContributions,
  groups,
  orderAuditLog,
} from "@/lib/db/schema";
import { AVISOS_EM_DIAS, dataPorExtenso, diasAteExpirar } from "./expiracao";
import { recadosNaoLidos } from "@/lib/repositories/adminNotices";

/**
 * Faixa J · os avisos do casal, DERIVADOS.
 *
 * A decisão que define este arquivo: **não existe tabela de notificações.**
 *
 * O desenho J1 lista cinco tipos de aviso, e todos os cinco já estão gravados
 * em algum lugar do banco — `guests.responded_at`, `gift_contributions`,
 * `site_content.rsvp_deadline`, `order_audit_log`. Criar uma tabela para
 * copiar esses fatos significaria duas fontes para a mesma verdade e um jeito
 * novo de elas discordarem (o convidado desconfirma, a linha de aviso fica).
 * Aqui o aviso é uma LEITURA do fato, então ele não pode divergir dele.
 *
 * O que se perde: estado de lido por casal, que exigiria coluna. O sino conta
 * o que aconteceu na janela recente em vez de o que ainda não foi visto — ver
 * `JANELA_DIAS`. É menos do que o desenho promete e está anotado no relatório;
 * o resto do desenho (preferências e resumo semanal) precisa de migração e de
 * cron, e não entra escondido dentro de uma passada visual.
 *
 * ── Regras de agrupamento (do próprio desenho J3) ──────────────────────────
 *
 * - **Dinheiro e prazo avisam um a um.** São os dois que não voltam.
 * - **Confirmação se acumula por dia.** Um casamento gera centenas delas; uma
 *   notificação por convidado é o que faz a pessoa desligar tudo.
 * - **Todo aviso acionável carrega o link da ação.** Aviso sem próximo passo
 *   vira ansiedade.
 */

/** Janela do sino. Além disso não é aviso, é histórico. */
const JANELA_DIAS = 30;

export type Aviso = {
  id: string;
  tipo: "presente" | "confirmacoes" | "prazo" | "no-ar" | "sai-do-ar" | "recado";
  /** A frase. As partes em negrito vêm separadas para o texto não virar HTML. */
  principal: { antes?: string; forte: string; depois?: string };
  detalhe: string;
  /** Cru, para o cliente formatar — ver a nota sobre `Date.now()` abaixo. */
  em: Date;
  acao?: { rotulo: string; href: string };
  tom: "neutro" | "ok" | "warn";
};

function real(centavos: number): string {
  return centavos.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: centavos % 100 === 0 ? 0 : 2,
  });
}

/** Chave YYYY-MM-DD no fuso de São Paulo, para agrupar por DIA do casal. */
function diaLocal(data: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(data);
}

/**
 * NÃO leva `"use cache"`.
 *
 * Não é esquecimento: o painel do casal já é dinâmico (tudo ali depende de
 * sessão), e um aviso é por definição uma leitura do agora. Com Cache
 * Components ligado, `use cache` congelaria "12 confirmações novas" por horas
 * — o mesmo defeito que fez a contagem regressiva ser calculada no cliente,
 * documentado em `ManageSidebar`.
 *
 * Pela mesma razão nada aqui formata tempo relativo. As datas saem cruas e
 * quem escreve "há 12 min" é o componente de cliente.
 */
export async function montarAvisos({
  siteId,
  orderId,
  base,
  rsvpDeadline,
  semResposta,
  expiresAt = null,
}: {
  siteId: string;
  orderId: string;
  /** Prefixo das rotas do painel: `/conta/pedidos/<id>`. */
  base: string;
  rsvpDeadline: string | null;
  /** Convidados ainda sem resposta — entra no aviso de prazo. */
  semResposta: number;
  /** Quando o site sai do ar. `null` = nunca — spec `site-publico/008`. */
  expiresAt?: Date | null;
}): Promise<{ avisos: Aviso[]; recentes: number }> {
  /* TODA leitura de relógio do recurso mora nesta função, e não em quem
     chama. O `react-hooks/purity` reprova `Date.now()` dentro de um
     componente — inclusive de servidor — e ele está certo: com Cache
     Components ligado, relógio lido no render é relógio que congela. Aqui
     dentro é uma função comum, chamada a cada requisição, e a conta é feita
     uma vez só para os dois usos (a janela e o contador). */
  const agora = new Date();
  const desde = new Date(agora.getTime() - JANELA_DIAS * 86_400_000);

  const [presentes, confirmacoes, publicacao, recados] = await Promise.all([
    presentesRecebidos(siteId, desde, base),
    confirmacoesPorDia(siteId, desde, base),
    entrouNoAr(orderId, desde, base),
    recadosDoTime(orderId, base),
  ]);

  const prazo = avisoDePrazo({ rsvpDeadline, semResposta, base, agora });
  const saida = avisoDeSaidaDoAr({ expiresAt, base, agora });

  const avisos = [
    ...(saida ? [saida] : []),
    ...(prazo ? [prazo] : []),
    ...recados,
    ...presentes,
    ...confirmacoes,
    ...publicacao,
  ].sort((a, b) => b.em.getTime() - a.em.getTime());

  /* O contador conta AVISOS, não eventos (regra J3): as doze respostas de um
     dia já chegaram aqui como um aviso só. A janela de sete dias faz o número
     decair sozinho — sem ela, um presente de três semanas atrás manteria o
     badge aceso para sempre. */
  const seteDias = agora.getTime() - 7 * 86_400_000;
  const recentes = avisos.filter((a) => a.em.getTime() >= seteDias).length;

  return { avisos, recentes };
}

/**
 * Um aviso por contribuição. É dinheiro de terceiro entrando na conta do
 * casal: agrupar "3 presentes recebidos" esconderia de quem veio cada um, que
 * é justamente o que o casal precisa saber para agradecer.
 */
async function presentesRecebidos(
  siteId: string,
  desde: Date,
  base: string
): Promise<Aviso[]> {
  /* `gift_contributions` não tem `site_id` (o presente pode ter sido apagado
     e o `gift_id` virar null), então o escopo vem da lista do site — mesma
     estratégia de `listContributions`. O join traz o valor, que mora em
     `gifts.price_cents` e não na contribuição. */
  const doSite = await db
    .select({ id: gifts.id })
    .from(gifts)
    .where(eq(gifts.siteId, siteId));
  if (doSite.length === 0) return [];

  const linhas = await db
    .select({
      id: giftContributions.id,
      giftName: giftContributions.giftName,
      guestName: giftContributions.guestName,
      createdAt: giftContributions.createdAt,
      priceCents: gifts.priceCents,
    })
    .from(giftContributions)
    .leftJoin(gifts, eq(giftContributions.giftId, gifts.id))
    .where(
      and(
        inArray(
          giftContributions.giftId,
          doSite.map((g) => g.id)
        ),
        gte(giftContributions.createdAt, desde)
      )
    )
    .orderBy(desc(giftContributions.createdAt));

  return linhas.map((linha) => {
    const quem = linha.guestName?.trim();
    const valor = linha.priceCents ? real(linha.priceCents) : null;

    return {
      id: `presente:${linha.id}`,
      tipo: "presente" as const,
      // Sem nome do convidado o aviso continua verdadeiro, só mais discreto:
      // "presente livre" não pede o nome de quem paga.
      principal: quem
        ? {
            forte: quem,
            depois: valor
              ? ` presenteou vocês com ${valor}`
              : " presenteou vocês",
          }
        : { antes: "Vocês receberam ", forte: valor ?? "um presente" },
      detalhe: linha.giftName,
      em: linha.createdAt,
      acao: { rotulo: "Ver os presentes", href: `${base}/presentes` },
      tom: "ok" as const,
    };
  });
}

/** Confirmações acumuladas por dia — a regra de agrupamento do desenho. */
async function confirmacoesPorDia(
  siteId: string,
  desde: Date,
  base: string
): Promise<Aviso[]> {
  /* Desde a 0016 quem responde é o GRUPO, e é `groups.responded_at` que marca
     quando. Ler de `guests` aqui congelaria o sino no dia da migração: as
     respostas antigas continuariam aparecendo e nenhuma resposta nova
     apareceria — o pior dos dois mundos, porque o casal veria um sino que
     parece funcionar e está mudo. */
  const linhas = await db
    .select({ respondedAt: groups.respondedAt })
    .from(groups)
    .where(
      and(
        eq(groups.siteId, siteId),
        isNotNull(groups.respondedAt),
        gte(groups.respondedAt, desde)
      )
    );

  const porDia = new Map<string, { total: number; ultima: Date }>();
  for (const linha of linhas) {
    if (!linha.respondedAt) continue;
    const dia = diaLocal(linha.respondedAt);
    const atual = porDia.get(dia);
    if (!atual) {
      porDia.set(dia, { total: 1, ultima: linha.respondedAt });
    } else {
      atual.total += 1;
      if (linha.respondedAt > atual.ultima) atual.ultima = linha.respondedAt;
    }
  }

  return [...porDia.entries()].map(([dia, { total, ultima }]) => ({
    id: `confirmacoes:${dia}`,
    tipo: "confirmacoes" as const,
    principal: {
      forte: total === 1 ? "1 resposta" : `${total} respostas`,
      depois: " de convidados",
    },
    // "resposta" e não "confirmação": quem respondeu "não posso" também está
    // aqui, e chamar isso de confirmação seria dar um número errado ao casal.
    detalhe: "Quem vem e quem não vem está na aba Convidados",
    em: ultima,
    acao: { rotulo: "Ver quem respondeu", href: `${base}/convidados` },
    tom: "neutro" as const,
  }));
}

/**
 * "O site está no ar", datado pelo log de auditoria.
 *
 * Só aparece quando existe a linha de transição para `published`. O caminho
 * automático de publicação nem sempre escreve no log, e uma data errada num
 * aviso é pior que aviso nenhum — então na ausência dela o aviso simplesmente
 * não existe.
 */
async function entrouNoAr(
  orderId: string,
  desde: Date,
  base: string
): Promise<Aviso[]> {
  const [linha] = await db
    .select({ createdAt: orderAuditLog.createdAt })
    .from(orderAuditLog)
    .where(
      and(
        eq(orderAuditLog.orderId, orderId),
        eq(orderAuditLog.field, "status"),
        eq(orderAuditLog.newValue, "published"),
        gte(orderAuditLog.createdAt, desde)
      )
    )
    .orderBy(desc(orderAuditLog.createdAt))
    .limit(1);

  if (!linha) return [];

  return [
    {
      id: `no-ar:${orderId}`,
      tipo: "no-ar" as const,
      principal: { antes: "O site de vocês ", forte: "está no ar" },
      detalhe: "Hora de mandar o link no grupo da família",
      em: linha.createdAt,
      acao: { rotulo: "Copiar o link", href: base },
      tom: "ok" as const,
    },
  ];
}

/**
 * O aviso de prazo. Não vem de um evento gravado: é uma conta sobre a data
 * limite e o número de quem ainda não respondeu. Recebe o "hoje" de quem
 * chama para o relógio ser lido uma vez só por requisição.
 */
function avisoDePrazo({
  rsvpDeadline,
  semResposta,
  base,
  agora,
}: {
  rsvpDeadline: string | null;
  semResposta: number;
  base: string;
  agora: Date;
}): Aviso | null {
  if (!rsvpDeadline || semResposta === 0) return null;

  // Meio-dia pelo mesmo motivo do resto do projeto: fuso não empurra o dia.
  const limite = new Date(`${rsvpDeadline}T12:00:00`);
  if (Number.isNaN(limite.getTime())) return null;

  const dias = Math.ceil((limite.getTime() - agora.getTime()) / 86_400_000);

  // Avisa a 7 e a 1 dia — os dois marcos do desenho. Fora disso, silêncio:
  // lembrete diário sobre a mesma coisa é o que treina a pessoa a ignorar.
  if (dias !== 7 && dias !== 1) return null;

  return {
    id: `prazo:${rsvpDeadline}:${dias}`,
    tipo: "prazo",
    principal: {
      antes: "Falta ",
      forte: dias === 1 ? "1 dia" : `${dias} dias`,
      depois: " para o prazo de confirmação",
    },
    detalhe:
      semResposta === 1
        ? "1 convidado ainda não respondeu"
        : `${semResposta} convidados ainda não responderam`,
    em: agora,
    /* Vai para CONVIDADOS, e não para a aba de convites: o aviso fala de
       quem não respondeu, e é ali que estão as linhas, os nomes e o link
       de cada família para cobrar. A aba de convites está desligada desde
       16/09/2026 (`CONVITES_LIGADOS`), e mesmo ligada mostrava três
       números somados e nenhuma linha. */
    acao: { rotulo: "Ver os convidados", href: `${base}/convidados` },
    tom: "warn",
  };
}

/**
 * O site sai do ar em breve — spec `site-publico/008`, FR-009.
 *
 * ── Por que aqui, e não num bloco novo na tela ────────────────────────────
 *
 * A spec dizia para pôr a data em `SiteNoAr`. Ao abrir o componente, ele diz
 * de si mesmo: *"é comemoração de um momento, não estado da tela"* — ele
 * aparece uma vez, no primeiro carregamento depois de publicar, e some. Um
 * prazo escrito ali seria visto por quem acabou de publicar e por mais
 * ninguém.
 *
 * O sino já é o lugar onde o painel conta o que muda com o tempo, e já tem um
 * aviso de prazo com a mesma forma. Reaproveitar custa uma função e nenhum
 * componente.
 *
 * ── E por que nos MESMOS dias do e-mail ───────────────────────────────────
 *
 * 30 e 7. Se a tela avisasse todo dia e o e-mail só em dois, o casal veria
 * dois produtos discordando sobre a urgência da mesma coisa. Fora desses
 * marcos, silêncio: lembrete diário sobre o que ainda não aconteceu é o que
 * treina a pessoa a ignorar o sino.
 */
function avisoDeSaidaDoAr({
  expiresAt,
  base,
  agora,
}: {
  expiresAt: Date | null;
  base: string;
  agora: Date;
}): Aviso | null {
  const dias = diasAteExpirar(expiresAt, agora);
  if (dias === null) return null;
  if (!AVISOS_EM_DIAS.includes(dias as (typeof AVISOS_EM_DIAS)[number])) {
    return null;
  }

  return {
    id: `sai-do-ar:${expiresAt!.toISOString()}:${dias}`,
    tipo: "sai-do-ar",
    principal: {
      antes: "O site sai do ar em ",
      forte: dias === 1 ? "1 dia" : `${dias} dias`,
      depois: "",
    },
    // "Sai do ar", nunca "expira" — expirar é palavra de sistema.
    detalhe: `Termina em ${dataPorExtenso(expiresAt!)}. Nada é apagado.`,
    em: agora,
    acao: { rotulo: "Ver o pedido", href: base },
    tom: "warn",
  };
}

/**
 * Recados que o time mandou — migração 0022.
 *
 * ── Por que estes NÃO respeitam a janela de 30 dias ────────────────────────
 *
 * Todos os outros avisos são derivados de eventos: um presente que chegou,
 * uma resposta que entrou, o site que subiu. Eles envelhecem porque o evento
 * envelhece — um presente de dois meses atrás não é notícia.
 *
 * Um recado do time não é evento, é MENSAGEM: alguém escreveu para este casal
 * e ainda não foi lido. Ele não deixa de ser verdade porque o tempo passou, e
 * sumir sozinho seria perder a única coisa que o produto tem de conversa. Por
 * isso a consulta é por `read_at is null`, não por data.
 *
 * O que dá o fim dele é o casal ler — `marcarRecadosComoLidos`, quando o sino
 * abre.
 */
async function recadosDoTime(orderId: string, base: string): Promise<Aviso[]> {
  const recados = await recadosNaoLidos(orderId);

  return recados.map((r) => ({
    id: `recado:${r.id}`,
    tipo: "recado" as const,
    principal: { forte: r.title },
    /* O corpo inteiro no sino viraria parágrafo dentro de um item de lista.
       As duas primeiras linhas dizem do que se trata; o resto está no painel,
       que é para onde a ação leva. */
    detalhe: r.body.length > 120 ? `${r.body.slice(0, 117).trimEnd()}…` : r.body,
    em: r.createdAt,
    acao: { rotulo: "Ler no painel", href: base },
    tom: "neutro" as const,
  }));
}
