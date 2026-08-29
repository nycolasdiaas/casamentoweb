import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { limparSchemaDeTeste } from "@/lib/db/testCleanup";
import { sites, orders, users } from "@/lib/db/schema";
import { provisionSiteForOrder } from "./provision";
import { publishSiteForOrder, publishedSiteTags } from "./publish";

// O que este arquivo protege: o fim do funil. Um site que não vai ao ar
// depois do pagamento é um casal que pagou e não recebeu — e um site que vai
// ao ar SEM pagamento é receita perdida.

const limpar = limparSchemaDeTeste;

beforeEach(limpar);
afterAll(limpar);

let contador = 0;

/** Pedido enviado + site provisionado, que é o estado de onde se publica. */
async function pedidoComSite(overrides: { paid?: boolean } = {}) {
  const [user] = await db
    .insert(users)
    .values({
      name: "Conta do Casal",
      email: `casal${contador++}@exemplo.invalido`,
      passwordHash: "x:y",
    })
    .returning();

  const [order] = await db
    .insert(orders)
    .values({
      userId: user.id,
      packageTier: "site",
      templateStyle: "classico",
      coupleNames: `Marina & Rafael ${contador}`,
      weddingDate: "2027-05-22",
      status: "submitted",
      ...(overrides.paid ? { paymentStatus: "PAID" } : {}),
    })
    .returning();

  const provisionado = await provisionSiteForOrder(
    {
      id: order.id,
      userId: user.id,
      packageTier: "site",
      templateStyle: "classico",
      primaryColor: null,
      secondaryColor: null,
      fontStyle: null,
      coupleNames: order.coupleNames,
      weddingDate: order.weddingDate,
      notes: null,
    },
    user.name,
    "https://exemplo.invalido"
  );
  if (!provisionado.ok) throw new Error(provisionado.reason);

  return { order, siteId: provisionado.siteId, slug: provisionado.slug };
}

const BASE = "https://exemplo.invalido";

describe("publishSiteForOrder", () => {
  it("coloca o site no ar e registra quando foi", async () => {
    const { order, siteId } = await pedidoComSite({ paid: true });

    const resultado = await publishSiteForOrder(order.id, { baseUrl: BASE });

    expect(resultado.ok).toBe(true);
    const [site] = await db.select().from(sites).where(eq(sites.id, siteId));
    expect(site.status).toBe("published");
    expect(site.publishedAt).not.toBeNull();
  });

  // Sem isto o casal vê "site no ar" e não tem link para abrir: o botão do
  // acompanhamento só aparece quando siteUrl existe.
  it("preenche o link do site no pedido e avança o status", async () => {
    const { order, slug } = await pedidoComSite({ paid: true });

    const resultado = await publishSiteForOrder(order.id, { baseUrl: BASE });

    expect(resultado).toMatchObject({ ok: true, siteUrl: `${BASE}/s/${slug}` });
    const [atualizado] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, order.id));
    expect(atualizado.status).toBe("published");
    expect(atualizado.siteUrl).toBe(`${BASE}/s/${slug}`);
  });

  // A promessa do pacote "para sempre" é endereço próprio. Publicar não pode
  // trocar o domínio do casal pelo /s/<slug>.
  it("NÃO sobrescreve um siteUrl já definido à mão", async () => {
    const { order } = await pedidoComSite({ paid: true });
    await db
      .update(orders)
      .set({ siteUrl: "https://marinaerafael.com.br" })
      .where(eq(orders.id, order.id));

    const resultado = await publishSiteForOrder(order.id, { baseUrl: BASE });

    expect(resultado).toMatchObject({
      ok: true,
      siteUrl: "https://marinaerafael.com.br",
    });
  });

  it("recusa publicar sem pagamento confirmado", async () => {
    const { order, siteId } = await pedidoComSite({ paid: false });

    const resultado = await publishSiteForOrder(order.id, { baseUrl: BASE });

    expect(resultado).toEqual({
      ok: false,
      reason: "Pagamento não confirmado.",
    });
    const [site] = await db.select().from(sites).where(eq(sites.id, siteId));
    expect(site.status).toBe("preview");
  });

  // O admin publica à mão em cortesia ou acerto por fora — aí quem decide é
  // ele, não o gateway.
  it("publica sem pagamento quando quem pede é o admin", async () => {
    const { order, siteId } = await pedidoComSite({ paid: false });

    const resultado = await publishSiteForOrder(order.id, {
      baseUrl: BASE,
      requirePaid: false,
    });

    expect(resultado.ok).toBe(true);
    const [site] = await db.select().from(sites).where(eq(sites.id, siteId));
    expect(site.status).toBe("published");
  });

  // Webhook reenviado e casal recarregando a tela chamam isto várias vezes.
  it("é idempotente e não mexe na data da primeira publicação", async () => {
    const { order, siteId } = await pedidoComSite({ paid: true });

    const primeira = await publishSiteForOrder(order.id, { baseUrl: BASE });
    const [depoisDaPrimeira] = await db
      .select()
      .from(sites)
      .where(eq(sites.id, siteId));

    const segunda = await publishSiteForOrder(order.id, { baseUrl: BASE });
    const [depoisDaSegunda] = await db
      .select()
      .from(sites)
      .where(eq(sites.id, siteId));

    expect(primeira).toMatchObject({ ok: true, alreadyPublished: false });
    expect(segunda).toMatchObject({ ok: true, alreadyPublished: true });
    expect(depoisDaSegunda.publishedAt).toEqual(depoisDaPrimeira.publishedAt);
  });

  // Arquivar é decisão manual de tirar do ar. Um webhook atrasado não pode
  // desfazer isso sem ninguém pedir.
  it("recusa republicar site arquivado", async () => {
    const { order, siteId } = await pedidoComSite({ paid: true });
    await db
      .update(sites)
      .set({ status: "archived" })
      .where(eq(sites.id, siteId));

    const resultado = await publishSiteForOrder(order.id, { baseUrl: BASE });

    expect(resultado.ok).toBe(false);
    const [site] = await db.select().from(sites).where(eq(sites.id, siteId));
    expect(site.status).toBe("archived");
  });

  it("avisa quando o pedido não tem site provisionado", async () => {
    const [user] = await db
      .insert(users)
      .values({
        name: "Sem site",
        email: `semsite${contador++}@exemplo.invalido`,
        passwordHash: "x:y",
      })
      .returning();
    const [order] = await db
      .insert(orders)
      .values({
        userId: user.id,
        packageTier: "convite",
        status: "submitted",
        paymentStatus: "PAID",
      })
      .returning();

    const resultado = await publishSiteForOrder(order.id, { baseUrl: BASE });

    expect(resultado).toEqual({
      ok: false,
      reason: "Este pedido não tem site provisionado.",
    });
  });

  it("avisa quando o pedido não existe", async () => {
    const resultado = await publishSiteForOrder(
      "00000000-0000-0000-0000-000000000000",
      { baseUrl: BASE }
    );
    expect(resultado).toEqual({ ok: false, reason: "Pedido não encontrado." });
  });

  it("publica mesmo sem base para o link, sem apagar o que já existia", async () => {
    const { order, siteId } = await pedidoComSite({ paid: true });

    const resultado = await publishSiteForOrder(order.id, { baseUrl: null });

    expect(resultado.ok).toBe(true);
    const [site] = await db.select().from(sites).where(eq(sites.id, siteId));
    expect(site.status).toBe("published");
  });
});

describe("publishedSiteTags", () => {
  // published-site-slugs é a mais fácil de esquecer: alimenta o
  // generateStaticParams de /s/[slug]. Sem ela, o site novo fica fora da
  // lista de rotas conhecidas.
  it("cobre a view, o site e a lista de slugs publicados", () => {
    expect(publishedSiteTags("marina-e-rafael")).toEqual([
      "site:marina-e-rafael",
      "site-view:marina-e-rafael",
      "published-site-slugs",
    ]);
  });
});

describe("SC-002 a SC-004 · a data de saída do ar (spec `site-publico/008`)", () => {
  /* A trava desta spec: enquanto `PRAZO_ANUNCIADO_EM` for `null` — ou seja,
     enquanto `lib/packages.ts` não disser prazo nenhum — publicar NUNCA grava
     data de saída, para nenhum pacote e para nenhum casal.

     É o requisito que impede a porta dos fundos que o agente
     `regras-de-negocio` encontrou: um pedido pago hoje, lendo uma vitrine
     calada, publicado depois desta spec subir, ganharia um prazo que ninguém
     mostrou a ele. */

  it("publicar não grava expires_at enquanto a vitrine estiver calada", async () => {
    const { order, siteId } = await pedidoComSite({ paid: true });

    const r = await publishSiteForOrder(order.id, {
      baseUrl: "https://enlace.test",
    });
    expect(r.ok).toBe(true);

    const [depois] = await db.select().from(sites).where(eq(sites.id, siteId));
    expect(depois.status).toBe("published");
    // `null` = nunca sai do ar. É o estado correto hoje.
    expect(depois.expiresAt).toBeNull();
  });

  it("nem para o pacote que um dia vai expirar", async () => {
    /* O pedido acima já é `packageTier: "site"`, que é um dos dois que a
       spec marca como expiráveis. Mesmo assim: `null`. O tier não decide
       sozinho — o anúncio da vitrine decide antes. */
    const { order, siteId } = await pedidoComSite({ paid: true });
    await publishSiteForOrder(order.id, { baseUrl: "https://enlace.test" });

    const [depois] = await db.select().from(sites).where(eq(sites.id, siteId));
    expect(depois.tier).toBe("site");
    expect(depois.expiresAt).toBeNull();
  });

  it("republicar não apaga uma data posta à mão", async () => {
    /* Quando a expiração estiver ligada, um admin poderá estender o prazo de
       um casal cujo casamento adiou. Publicar de novo (webhook reenviado,
       tela recarregada) não pode desfazer isso — por isso o `set` só escreve
       `expiresAt` quando há data a escrever. */
    const { order, siteId } = await pedidoComSite({ paid: true });
    await publishSiteForOrder(order.id, { baseUrl: "https://enlace.test" });

    const posto = new Date(2030, 0, 1);
    await db.update(sites).set({ expiresAt: posto }).where(eq(sites.id, siteId));

    await publishSiteForOrder(order.id, { baseUrl: "https://enlace.test" });

    const [depois] = await db.select().from(sites).where(eq(sites.id, siteId));
    expect(depois.expiresAt?.getTime()).toBe(posto.getTime());
  });
});
