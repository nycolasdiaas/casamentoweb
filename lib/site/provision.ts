import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { sites, siteContent, siteSections, gifts, orders } from "@/lib/db/schema";
import { generateSiteSlug } from "@/lib/siteSlug";
import { themePresetFor } from "@/lib/theme/presets";
import { resolveTheme } from "@/lib/theme/spec";
import { sectionsForTier } from "@/lib/templates/contract";
import type { PackageTier } from "@/lib/packages";

// Provisionamento automático: pedido enviado vira site, sem humano no meio.
//
// É o passo que fecha a promessa da plataforma. Antes disto, o casal enviava
// o briefing e esperava alguém montar o site à mão a partir de um prompt.
//
// Roda inteiro numa transação e é idempotente: um pedido tem no máximo um
// site (sites.order_id é unique), então reenviar não duplica.
//
// Ver docs/sdd-geracao-automatica.md §7.

/** Presentes sugeridos por categoria — ponto de partida editável pelo casal. */
const PRESENTES_PADRAO: [string, string, number | null][] = [
  ["Lua de Mel", "Um jantar especial a dois", 18000],
  ["Lua de Mel", "Um passeio inesquecível", 15000],
  ["Lua de Mel", "Uma noite a mais na viagem", 25000],
  ["Montando o Ninho", "Jogo de panelas", 32000],
  ["Montando o Ninho", "Taças para os brindes", 16000],
  ["Montando o Ninho", "Jogo de cama", 22000],
  ["Do Seu Jeito", "Presente livre", null],
];

export type OrderForProvision = {
  id: string;
  userId: string;
  packageTier: PackageTier;
  templateStyle: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  fontStyle: string | null;
  coupleNames: string | null;
  weddingDate: string | null;
  notes: string | null;
};

export type ProvisionResult =
  | { ok: true; siteId: string; slug: string; created: boolean }
  | { ok: false; reason: string };

/**
 * Converte a data do pedido (texto do formulário) num timestamp.
 * Aceita "2026-10-16" e datetime-local; devolve null se não der para ler —
 * data ruim não pode derrubar o provisionamento inteiro.
 */
function parseWeddingDate(raw: string | null): Date | null {
  if (!raw) return null;
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T00:00:00-03:00` : raw;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  // Ano fora de [2000, 2100] é digitação, não casamento — e o TETO importa
  // tanto quanto o piso.
  //
  // O <input type="date"> do HTML aceita ano de até 6 dígitos. Um dedo
  // escorregado ("13131") passa pelo navegador, passa pelo JS (que representa
  // o ano 13131 sem reclamar) e só estoura no Postgres, DENTRO da transação
  // do provisionamento. Resultado medido em produção: o insert em
  // site_content falhava, a transação inteira caía, o site nunca nascia, o
  // pedido travava em "recebido" e a rota de reprovisionar devolvia 500 a
  // cada tentativa. Um caractere a mais num campo de data derrubava o pedido.
  const ano = d.getFullYear();
  if (ano < 2000 || ano > 2100) return null;
  return d;
}

export async function provisionSiteForOrder(
  order: OrderForProvision,
  coupleAccountName: string,
  /**
   * Base absoluta para montar o link da prévia que vai para a tela do casal.
   * Opcional para os testes; em produção vem de getBaseUrl().
   */
  baseUrl?: string
): Promise<ProvisionResult> {
  // Já provisionado? Devolve o que existe — reenviar não cria segundo site.
  const [existente] = await db
    .select({ id: sites.id, slug: sites.slug })
    .from(sites)
    .where(eq(sites.orderId, order.id));

  if (existente) {
    return { ok: true, siteId: existente.id, slug: existente.slug, created: false };
  }

  const nomes = order.coupleNames?.trim() || coupleAccountName.trim();
  if (!nomes) {
    return { ok: false, reason: "Sem nome do casal para gerar o endereço." };
  }

  const slug = await generateSiteSlug(nomes, async (candidato) => {
    const [existe] = await db
      .select({ id: sites.id })
      .from(sites)
      .where(eq(sites.slug, candidato));
    return Boolean(existe);
  });

  // preset do molde ← escolhas do casal
  const tema = resolveTheme(themePresetFor(order.templateStyle), {
    primaryColor: order.primaryColor,
    secondaryColor: order.secondaryColor,
    fontStyle: order.fontStyle,
  });

  const previewToken = crypto.randomBytes(24).toString("base64url");

  const siteId = await db.transaction(async (tx) => {
    const [site] = await tx
      .insert(sites)
      .values({
        orderId: order.id,
        userId: order.userId,
        slug,
        templateId: order.templateStyle,
        theme: tema,
        tier: order.packageTier,
        // Nasce como prévia: o casal vê antes de pagar; publicar é outro passo.
        status: "preview",
        previewToken,
      })
      .returning({ id: sites.id });

    await tx.insert(siteContent).values({
      siteId: site.id,
      coupleNames: nomes,
      weddingDate: parseWeddingDate(order.weddingDate),
      // As anotações do briefing viram o primeiro rascunho da história —
      // o casal edita depois. Melhor do que abrir o site vazio.
      story: order.notes?.trim() || null,
    });

    await tx.insert(siteSections).values(
      sectionsForTier(order.packageTier).map((key, i) => ({
        siteId: site.id,
        sectionKey: key,
        position: i,
        enabled: true,
      }))
    );

    // Lista de presentes só existe no pacote mais completo.
    if (order.packageTier === "para-sempre") {
      await tx.insert(gifts).values(
        PRESENTES_PADRAO.map(([category, name, priceCents], i) => ({
          siteId: site.id,
          category,
          name,
          priceCents,
          position: i,
        }))
      );
    }

    // Fecha o ciclo para o casal: o pedido pula direto para "prévia pronta",
    // com o link. Sem isto o site existiria mas ninguém veria — a tela de
    // acompanhamento só mostra o botão da prévia nesse status.
    //
    // É a diferença que o produto promete: de "aguarde alguns dias" para
    // "sua prévia está pronta", em segundos.
    await tx
      .update(orders)
      .set({
        status: "preview_ready",
        previewUrl: `${baseUrl ?? ""}/preview/${previewToken}`,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));

    return site.id;
  });

  return { ok: true, siteId, slug, created: true };
}
