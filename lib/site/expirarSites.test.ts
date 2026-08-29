/**
 * O que sai do ar, e principalmente o que NÃO sai — spec `site-publico/008`.
 *
 * Este arquivo existe para um caso só, e os outros são consequência dele: **o
 * site de um casal com convidados confirmados não pode sair do ar por
 * acidente**. Todos os 18 sites que existiam quando a coluna nasceu têm
 * `expires_at` nulo, inclusive o casamento real de 16/10/2026 — e `null`
 * significa "nunca expira".
 *
 * Um erro aqui não aparece em tela nenhuma: ele aparece como um link de
 * casamento que parou de abrir.
 */

import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { limparSchemaDeTeste } from "@/lib/db/testCleanup";
import {
  groups,
  guestbookMessages,
  guests,
  siteContent,
  sites,
  users,
} from "@/lib/db/schema";
import { createGroup } from "@/lib/repositories/groups";
import {
  arquivarPorExpiracao,
  podeAvisar,
  sitesComPrazo,
  tarefasDeHoje,
} from "./expirarSites";
import { unarchiveSite } from "./visibility";
import { pararResumoSemanal } from "@/lib/repositories/users";

async function limpar() {
  await db.delete(guestbookMessages);
  await db.delete(guests);
  await db.delete(groups);
  await limparSchemaDeTeste();
}
beforeEach(limpar);
afterAll(limpar);

let n = 0;

async function siteComPrazo(opcoes: {
  expiresAt?: Date | null;
  tier?: "convite" | "site" | "para-sempre";
  status?: "published" | "archived";
} = {}) {
  const [user] = await db
    .insert(users)
    .values({
      name: `Casal ${n}`,
      email: `casal${n++}@teste.invalid`,
      passwordHash: "x:y",
    })
    .returning();

  const [site] = await db
    .insert(sites)
    .values({
      userId: user.id,
      slug: `site-${n}-${Date.now()}`,
      tier: opcoes.tier ?? "convite",
      previewToken: `tok${n}${Date.now()}`,
      status: opcoes.status ?? "published",
      publishedAt: new Date(2026, 0, 1),
      expiresAt: opcoes.expiresAt ?? null,
    })
    .returning();

  await db
    .insert(siteContent)
    .values({ siteId: site.id, coupleNames: "Ana & Pedro" });

  return { user, site };
}

const diasAtras = (n: number) => new Date(Date.now() - n * 86_400_000);
const daquiA = (n: number) => new Date(Date.now() + n * 86_400_000);

const lerSite = async (id: string) =>
  (await db.select().from(sites).where(eq(sites.id, id)))[0] ?? null;

describe("SC-005: a consulta só enxerga quem TEM prazo", () => {
  it("site com expires_at nulo nunca aparece — é o caso do casamento real", async () => {
    /* O CASO QUE MAIS IMPORTA. Depois da migração, todo site existente ficou
       com `null`. Se `null` entrasse aqui, a primeira rodada do cron tiraria
       do ar um casamento com 23 lugares confirmados. */
    await siteComPrazo({ expiresAt: null, tier: "para-sempre" });
    expect(await sitesComPrazo()).toHaveLength(0);
  });

  it("site em prévia ou arquivado não aparece", async () => {
    await siteComPrazo({ expiresAt: diasAtras(10), status: "archived" });
    expect(await sitesComPrazo()).toHaveLength(0);
  });

  it("site publicado com prazo aparece", async () => {
    await siteComPrazo({ expiresAt: daquiA(30) });
    expect(await sitesComPrazo()).toHaveLength(1);
  });
});

describe("SC-005: só vence quem venceu", () => {
  it("prazo no futuro não gera tarefa nenhuma", async () => {
    await siteComPrazo({ expiresAt: daquiA(100) });
    expect(tarefasDeHoje(await sitesComPrazo())).toHaveLength(0);
  });

  it("prazo vencido gera a tarefa de arquivar", async () => {
    await siteComPrazo({ expiresAt: diasAtras(1) });
    const [t] = tarefasDeHoje(await sitesComPrazo());
    expect(t.aviso).toBe("saiu-do-ar");
    expect(t.arquivar).toBe(true);
  });

  it("faltando 30 dias, avisa mas NÃO arquiva", async () => {
    await siteComPrazo({ expiresAt: daquiA(30) });
    const [t] = tarefasDeHoje(await sitesComPrazo());
    expect(t.aviso).toBe("30-dias");
    expect(t.arquivar).toBe(false);
  });
});

describe("SC-006: arquivar tira do ar e NÃO apaga nada", () => {
  it("o site vira archived e tudo continua no banco", async () => {
    const { site } = await siteComPrazo({ expiresAt: diasAtras(1) });
    /* Um grupo com convidado: é o dado que mais dói perder, porque carrega o
       slug de `/rsvp/<slug>` que já circulou no WhatsApp. */
    await createGroup({ siteId: site.id, guestNames: ["Ana", "Bruno"] });
    await db.insert(guestbookMessages).values({
      siteId: site.id,
      guestName: "Bia",
      message: "Que festa linda!",
    });

    expect(await arquivarPorExpiracao(site.id)).toBe(true);

    const depois = await lerSite(site.id);
    expect(depois!.status).toBe("archived");
    // Nada apagado — a regra 6 da §14 do SDD.
    expect(await db.select().from(groups).where(eq(groups.siteId, site.id))).toHaveLength(1);
    expect(await db.select().from(guests)).toHaveLength(2);
    expect(await db.select().from(guestbookMessages)).toHaveLength(1);
    expect(await db.select().from(siteContent).where(eq(siteContent.siteId, site.id))).toHaveLength(1);
  });

  it("não arquiva site cujo prazo ainda não venceu, nem sem prazo", async () => {
    /* A guarda é repetida no `where` do UPDATE, e não só na leitura: entre
       decidir e escrever, um admin pode ter estendido o prazo. */
    const a = await siteComPrazo({ expiresAt: daquiA(5) });
    const b = await siteComPrazo({ expiresAt: null });

    expect(await arquivarPorExpiracao(a.site.id)).toBe(false);
    expect(await arquivarPorExpiracao(b.site.id)).toBe(false);
    expect((await lerSite(a.site.id))!.status).toBe("published");
    expect((await lerSite(b.site.id))!.status).toBe("published");
  });

  it("arquivar duas vezes não é operação", async () => {
    const { site } = await siteComPrazo({ expiresAt: diasAtras(1) });
    expect(await arquivarPorExpiracao(site.id)).toBe(true);
    expect(await arquivarPorExpiracao(site.id)).toBe(false);
  });
});

describe("SC-007: a volta do arquivado depende de QUEM arquivou", () => {
  it("o casal desarquiva o que ele mesmo tirou do ar", async () => {
    const { site } = await siteComPrazo({ expiresAt: null, status: "archived" });
    const r = await unarchiveSite({
      id: site.id,
      status: "archived",
      publishedAt: site.publishedAt,
      expiresAt: null,
    });
    expect(r.ok).toBe(true);
  });

  it("mas NÃO desarquiva o que a expiração tirou", async () => {
    /* O requisito que impede a expiração de virar decoração: sem isto, o casal
       clica "colocar de volta no ar" e o produto devolve de graça exatamente o
       que acabou de expirar. */
    const venceuEm = diasAtras(2);
    const { site } = await siteComPrazo({ expiresAt: venceuEm, status: "archived" });

    const r = await unarchiveSite({
      id: site.id,
      status: "archived",
      publishedAt: site.publishedAt,
      expiresAt: venceuEm,
    });

    expect(r.ok).toBe(false);
    if (r.ok) throw new Error("inalcançável");
    // A primeira coisa que o casal quer saber.
    expect(r.error).toContain("Nada foi apagado");
    expect((await lerSite(site.id))!.status).toBe("archived");
  });

  it("site com prazo ainda válido volta normalmente", async () => {
    const { site } = await siteComPrazo({ expiresAt: daquiA(60), status: "archived" });
    const r = await unarchiveSite({
      id: site.id,
      status: "archived",
      publishedAt: site.publishedAt,
      expiresAt: daquiA(60),
    });
    expect(r.ok).toBe(true);
  });
});

describe("SC-009: o descadastro do resumo NÃO cala estes avisos", () => {
  /* A spec nasceu dizendo o contrário, e o agente `regras-de-negocio` reprovou
     com o caso concreto: quem se descadastrou do resumo semanal descobriria
     que o site saiu do ar por um convidado dizendo que o link quebrou.

     Estes três e-mails não são cortesia semanal — são o serviço que o casal
     pagou mudando de estado, da mesma família do recibo e do "está no ar". */

  it("quem pediu para parar o resumo semanal continua sendo avisado", async () => {
    const { user } = await siteComPrazo({ expiresAt: daquiA(30) });
    await pararResumoSemanal(user.id);

    const [site] = await sitesComPrazo();
    expect(site.optOut).not.toBeNull();
    expect(podeAvisar(site)).toBe(true);
  });

  it("sem e-mail cadastrado, não há como avisar", async () => {
    const [user] = await db
      .insert(users)
      .values({ name: "Sem dono", email: `x${n++}@teste.invalid`, passwordHash: "x:y" })
      .returning();
    const [site] = await db
      .insert(sites)
      .values({
        userId: null,
        slug: `orfao-${n}-${Date.now()}`,
        tier: "convite",
        previewToken: `tok${n}${Date.now()}`,
        status: "published",
        expiresAt: daquiA(30),
      })
      .returning();
    void user;

    const lista = await sitesComPrazo();
    const alvo = lista.find((l) => l.siteId === site.id)!;
    expect(podeAvisar(alvo)).toBe(false);
  });

  it("e o site é arquivado mesmo sem ninguém para avisar", async () => {
    /* Se o filtro de aviso e o de arquivamento fossem o mesmo `where`, um site
       sem dono ficaria no ar para sempre. */
    const [site] = await db
      .insert(sites)
      .values({
        userId: null,
        slug: `orfao2-${n++}-${Date.now()}`,
        tier: "convite",
        previewToken: `tok2${n}${Date.now()}`,
        status: "published",
        expiresAt: diasAtras(1),
      })
      .returning();

    const lista = await sitesComPrazo();
    expect(tarefasDeHoje(lista).find((t) => t.site.siteId === site.id)!.arquivar).toBe(true);
    expect(await arquivarPorExpiracao(site.id)).toBe(true);
  });
});
