import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { limparSchemaDeTeste } from "@/lib/db/testCleanup";
import {
  sites,
  siteContent,
  siteSections,
  gifts,
  orders,
  users,
} from "@/lib/db/schema";
import { provisionSiteForOrder, type OrderForProvision } from "./provision";

const limpar = limparSchemaDeTeste;

beforeEach(limpar);
afterAll(limpar);

let contador = 0;
async function criarPedido(
  overrides: Partial<OrderForProvision> = {}
): Promise<OrderForProvision> {
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
      packageTier: overrides.packageTier ?? "site",
      templateStyle:
        "templateStyle" in overrides ? overrides.templateStyle : "classico",
      primaryColor: overrides.primaryColor ?? null,
      secondaryColor: overrides.secondaryColor ?? null,
      fontStyle: overrides.fontStyle ?? null,
      coupleNames:
        "coupleNames" in overrides ? overrides.coupleNames : "Marina & Rafael",
      weddingDate: overrides.weddingDate ?? "2027-05-22",
      notes: overrides.notes ?? null,
      status: "submitted",
    })
    .returning();

  return order as OrderForProvision;
}

describe("provisionSiteForOrder", () => {
  it("turns a submitted order into a site with no human in the loop", async () => {
    const order = await criarPedido();

    const r = await provisionSiteForOrder(order, "Conta do Casal");

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.created).toBe(true);
    expect(r.slug).toBe("marina-e-rafael");

    const [site] = await db.select().from(sites).where(eq(sites.id, r.siteId));
    expect(site.orderId).toBe(order.id);
    expect(site.templateId).toBe("classico");
    expect(site.tier).toBe("site");
    // Nasce como prévia: o casal vê antes de publicar.
    expect(site.status).toBe("preview");
    expect(site.previewToken.length).toBeGreaterThan(20);
  });

  it("copies the briefing into the site content", async () => {
    const order = await criarPedido({
      coupleNames: "Ana & Pedro",
      weddingDate: "2027-09-19",
      notes: "Nos conhecemos numa fila de padaria.",
    });

    const r = await provisionSiteForOrder(order, "Conta");
    if (!r.ok) throw new Error("provisionamento falhou");

    const [content] = await db
      .select()
      .from(siteContent)
      .where(eq(siteContent.siteId, r.siteId));

    expect(content.coupleNames).toBe("Ana & Pedro");
    expect(content.story).toBe("Nos conhecemos numa fila de padaria.");
    expect(content.weddingDate?.getUTCFullYear()).toBe(2027);
  });

  it("applies the couple's colour and font over the template preset", async () => {
    const order = await criarPedido({
      templateStyle: "classico",
      primaryColor: "#c65a2e",
      fontStyle: "playfair",
    });

    const r = await provisionSiteForOrder(order, "Conta");
    if (!r.ok) throw new Error("provisionamento falhou");

    const [site] = await db.select().from(sites).where(eq(sites.id, r.siteId));
    const theme = site.theme as {
      palette: { accent: string; paper: string };
      fonts: { display: string };
    };

    expect(theme.palette.accent).toBe("#c65a2e"); // escolha do casal
    expect(theme.fonts.display).toBe("playfair");
    expect(theme.palette.paper).toBe("#f2efe7"); // preset do Clássico segue
  });

  it("seeds sections according to the package tier", async () => {
    const convite = await criarPedido({ packageTier: "convite" });
    const r1 = await provisionSiteForOrder(convite, "Conta");
    if (!r1.ok) throw new Error("falhou");

    const secoesConvite = await db
      .select()
      .from(siteSections)
      .where(eq(siteSections.siteId, r1.siteId));
    const chaves = secoesConvite.map((s) => s.sectionKey);

    expect(chaves).toContain("cover");
    // Pacote convite não tem RSVP nem presentes.
    expect(chaves).not.toContain("rsvp");
    expect(chaves).not.toContain("gifts");
  });

  it("seeds a starter gift list only for the para-sempre tier", async () => {
    const completo = await criarPedido({ packageTier: "para-sempre" });
    const r = await provisionSiteForOrder(completo, "Conta");
    if (!r.ok) throw new Error("falhou");

    const lista = await db
      .select()
      .from(gifts)
      .where(eq(gifts.siteId, r.siteId));
    expect(lista.length).toBeGreaterThan(0);

    const semLista = await criarPedido({ packageTier: "site" });
    const r2 = await provisionSiteForOrder(semLista, "Conta");
    if (!r2.ok) throw new Error("falhou");

    const vazia = await db
      .select()
      .from(gifts)
      .where(eq(gifts.siteId, r2.siteId));
    expect(vazia).toHaveLength(0);
  });

  // Reenviar o pedido não pode gerar um segundo site.
  it("is idempotent — provisioning twice returns the same site", async () => {
    const order = await criarPedido();

    const primeira = await provisionSiteForOrder(order, "Conta");
    const segunda = await provisionSiteForOrder(order, "Conta");

    if (!primeira.ok || !segunda.ok) throw new Error("falhou");
    expect(segunda.siteId).toBe(primeira.siteId);
    expect(segunda.created).toBe(false);

    const todos = await db.select().from(sites);
    expect(todos).toHaveLength(1);
  });

  it("gives each couple a distinct address, even with the same names", async () => {
    const a = await criarPedido({ coupleNames: "João & Maria" });
    const b = await criarPedido({ coupleNames: "João & Maria" });

    const r1 = await provisionSiteForOrder(a, "Conta");
    const r2 = await provisionSiteForOrder(b, "Conta");
    if (!r1.ok || !r2.ok) throw new Error("falhou");

    expect(r1.slug).toBe("joao-e-maria");
    expect(r2.slug).toBe("joao-e-maria-2");
  });

  it("falls back to the account name when the briefing has no couple names", async () => {
    const order = await criarPedido({ coupleNames: null });
    const r = await provisionSiteForOrder(order, "Beatriz e Caio");
    if (!r.ok) throw new Error("falhou");
    expect(r.slug).toBe("beatriz-e-caio");
  });

  // Data de teste ("1111-11-11") não pode virar contagem regressiva.
  it("ignores an absurd wedding date instead of storing it", async () => {
    const order = await criarPedido({ weddingDate: "1111-11-11" });
    const r = await provisionSiteForOrder(order, "Conta");
    if (!r.ok) throw new Error("falhou");

    const [content] = await db
      .select()
      .from(siteContent)
      .where(eq(siteContent.siteId, r.siteId));
    expect(content.weddingDate).toBeNull();
  });

  it("still provisions when the couple picked no template", async () => {
    const order = await criarPedido({ templateStyle: null });
    const r = await provisionSiteForOrder(order, "Conta");

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const [site] = await db.select().from(sites).where(eq(sites.id, r.siteId));
    expect(site.templateId).toBeNull();
    // Sem molde escolhido, o tema cai no preset do Clássico.
    expect((site.theme as { palette: { paper: string } }).palette.paper).toBe(
      "#f2efe7"
    );
  });
});

describe("provisionSiteForOrder — data de casamento", () => {
  /**
   * REGRESSÃO REAL, achada no log de produção.
   *
   * O <input type="date"> aceita ano de até 6 dígitos. Um dedo escorregado
   * ("13131") passava pelo navegador, passava pelo JS e só estourava no
   * Postgres — DENTRO da transação do provisionamento. A transação inteira
   * caía, o site nunca nascia, o pedido travava em "recebido" e a rota de
   * reprovisionar devolvia 500 a cada tentativa.
   *
   * Um caractere a mais num campo de data derrubava o pedido inteiro.
   */
  it("não deixa um ano absurdo derrubar o provisionamento", async () => {
    const order = await criarPedido({ weddingDate: "13131-03-11" });

    const r = await provisionSiteForOrder(order, "Conta do Casal");

    // O site NASCE — a data ruim é descartada, o pedido não é perdido.
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    const [conteudo] = await db
      .select()
      .from(siteContent)
      .where(eq(siteContent.siteId, r.siteId));
    expect(conteudo.weddingDate).toBeNull();
  });

  it("aceita uma data de casamento de verdade", async () => {
    const order = await criarPedido({ weddingDate: "2027-05-22" });

    const r = await provisionSiteForOrder(order, "Conta do Casal");
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    const [conteudo] = await db
      .select()
      .from(siteContent)
      .where(eq(siteContent.siteId, r.siteId));
    expect(conteudo.weddingDate).not.toBeNull();
  });
});

describe("provisionSiteForOrder — ciclo do pedido", () => {
  // Sem isto o site existiria mas ninguém veria: a tela de acompanhamento só
  // mostra o botão da prévia quando o pedido está em preview_ready.
  it("moves the order to preview_ready with a working preview link", async () => {
    const order = await criarPedido();

    const r = await provisionSiteForOrder(order, "Conta", "https://enlace.com.br");
    if (!r.ok) throw new Error("falhou");

    const [atualizado] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, order.id));

    expect(atualizado.status).toBe("preview_ready");
    expect(atualizado.previewUrl).toMatch(
      /^https:\/\/enlace\.com\.br\/preview\/.+/
    );

    // O link tem que apontar para o token do site que acabou de nascer.
    const [site] = await db.select().from(sites).where(eq(sites.id, r.siteId));
    expect(atualizado.previewUrl).toContain(site.previewToken);
  });

  it("does not move the order again when provisioning is a no-op", async () => {
    const order = await criarPedido();
    await provisionSiteForOrder(order, "Conta", "https://enlace.com.br");

    // Admin avançou o pedido manualmente; reprovisionar não pode regredir.
    await db
      .update(orders)
      .set({ status: "paid" })
      .where(eq(orders.id, order.id));

    await provisionSiteForOrder(order, "Conta", "https://enlace.com.br");

    const [depois] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, order.id));
    expect(depois.status).toBe("paid");
  });
});
