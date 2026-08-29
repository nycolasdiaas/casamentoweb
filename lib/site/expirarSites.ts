import { and, eq, isNotNull, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { siteContent, sites, users } from "@/lib/db/schema";
import {
  avisoDeHoje,
  dataPorExtenso,
  diasAteExpirar,
  type AvisoDeExpiracao,
} from "./expiracao";

/**
 * Quem sai do ar hoje, e quem precisa ser avisado — spec `site-publico/008`.
 *
 * ── A consulta traz pouco de propósito ─────────────────────────────────────
 *
 * Só sites com `expires_at` **preenchido**. `null` é "nunca expira", e é o
 * estado de todos os 18 sites que existiam quando a coluna nasceu — inclusive
 * o casamento real de 16/10/2026. Um `where` frouxo aqui é a única coisa neste
 * arquivo capaz de tirar do ar um casamento com convidados confirmados, e por
 * isso ele é o primeiro filtro e não o último.
 */

export type SiteParaExpirar = {
  siteId: string;
  slug: string;
  tier: string;
  expiresAt: Date;
  /** Do dono — é para ele que o aviso vai. `null` em site sem dono (legado). */
  userId: string | null;
  email: string | null;
  nomes: string;
  optOut: Date | null;
};

/**
 * Todo site publicado que TEM data de expiração.
 *
 * A decisão de arquivar ou avisar é tomada em memória, por
 * `avisoDeHoje` — a mesma função pura que o painel e os testes usam. Fazer a
 * conta de datas no SQL criaria uma segunda regra, em outra linguagem, que
 * discordaria da primeira no fuso ou no arredondamento.
 */
export async function sitesComPrazo(): Promise<SiteParaExpirar[]> {
  const linhas = await db
    .select({
      siteId: sites.id,
      slug: sites.slug,
      tier: sites.tier,
      expiresAt: sites.expiresAt,
      userId: users.id,
      email: users.email,
      nomeDaConta: users.name,
      coupleNames: siteContent.coupleNames,
      optOut: users.weeklyDigestOptOut,
    })
    .from(sites)
    .leftJoin(users, eq(sites.userId, users.id))
    .leftJoin(siteContent, eq(siteContent.siteId, sites.id))
    .where(and(eq(sites.status, "published"), isNotNull(sites.expiresAt)));

  return linhas.map((l) => ({
    siteId: l.siteId,
    slug: l.slug,
    tier: l.tier,
    expiresAt: l.expiresAt!,
    userId: l.userId,
    email: l.email,
    nomes: l.coupleNames?.trim() || l.nomeDaConta || "vocês",
    optOut: l.optOut,
  }));
}

export type TarefaDeExpiracao = {
  site: SiteParaExpirar;
  aviso: AvisoDeExpiracao;
  /** Só o aviso de saída arquiva. Os outros dois são só e-mail. */
  arquivar: boolean;
  diasQueFaltam: number;
  dataPorExtenso: string;
};

/** O que fazer hoje, para cada site com prazo. */
export function tarefasDeHoje(
  lista: SiteParaExpirar[],
  agora = new Date()
): TarefaDeExpiracao[] {
  const tarefas: TarefaDeExpiracao[] = [];

  for (const site of lista) {
    const aviso = avisoDeHoje(site.expiresAt, agora);
    if (!aviso) continue;

    tarefas.push({
      site,
      aviso,
      arquivar: aviso === "saiu-do-ar",
      diasQueFaltam: diasAteExpirar(site.expiresAt, agora) ?? 0,
      dataPorExtenso: dataPorExtenso(site.expiresAt),
    });
  }

  return tarefas;
}

/**
 * Tira do ar. `archived`, e **nada mais**.
 *
 * Nenhum `delete` mora aqui e nenhum vai morar: conteúdo, fotos, presentes,
 * grupos e confirmações continuam no banco. É a regra 6 da §14 do SDD e a
 * mesma razão pela qual apagar a conta do casal não apaga o site do casamento
 * — o casamento aconteceu, e o registro dele não some porque um prazo
 * comercial venceu.
 *
 * O `where` repete `status = 'published'` e `expires_at <= now()` de
 * propósito: se algo tiver mudado entre a leitura e a escrita (um admin
 * estendeu o prazo, o casal arquivou à mão), o update não acontece.
 */
export async function arquivarPorExpiracao(siteId: string): Promise<boolean> {
  const r = await db
    .update(sites)
    .set({ status: "archived", updatedAt: new Date() })
    .where(
      and(
        eq(sites.id, siteId),
        eq(sites.status, "published"),
        isNotNull(sites.expiresAt),
        lte(sites.expiresAt, sql`now()`)
      )
    )
    .returning({ id: sites.id });

  return r.length > 0;
}

/**
 * Quem recebe aviso: quem tem e-mail. E só.
 *
 * ── O descadastro do resumo semanal NÃO vale aqui ─────────────────────────
 *
 * A primeira versão desta função filtrava `weekly_digest_opt_out`, e o agente
 * `regras-de-negocio` reprovou com o caso concreto: quem se descadastrou do
 * resumo semanal descobriria que o site saiu do ar **por um convidado dizendo
 * que o link quebrou**. Um aviso que o silêncio do casal pode suprimir não é
 * aviso.
 *
 * A diferença é de natureza. O resumo semanal sai porque é segunda-feira — é
 * cortesia, e cortesia se recusa. Estes três saem porque **o serviço que o
 * casal pagou está mudando de estado**, como o recibo e o "está no ar", que a
 * prancha de e-mails classifica como transacionais, sem descadastro.
 *
 * `optOut` continua no tipo de propósito: é o que deixa este comentário ser
 * uma decisão visível em vez de um campo que alguém esqueceu de usar.
 */
export function podeAvisar(site: SiteParaExpirar): boolean {
  return Boolean(site.email);
}
