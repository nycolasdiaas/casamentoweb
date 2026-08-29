/**
 * O resumo da semana — spec `painel-casal/010`.
 *
 * A spec tinha só dois requisitos escritos, porque o resto dependia da decisão
 * do agendador. Os dois são exatamente o que pode dar errado de um jeito que
 * ninguém percebe:
 *
 * - **FR-002:** semana parada não gera e-mail. Um resumo que chega dizendo
 *   "nada aconteceu" ensina o casal a não abrir o próximo.
 * - **FR-001:** nunca somar reais a partir de cotas de valor livre. O Pix vai
 *   direto para o casal e a Enlace não vê centavo nenhum; somar só as de preço
 *   fixo daria um total MENOR que o real — pior que não mostrar nada.
 */

import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { limparSchemaDeTeste } from "@/lib/db/testCleanup";
import {
  gifts,
  giftContributions,
  groups,
  guestbookMessages,
  guests,
  siteContent,
  sites,
  users,
} from "@/lib/db/schema";
import { resumosDaSemana, temMovimento } from "./resumoSemanal";
import { pararResumoSemanal } from "@/lib/repositories/users";
import { linkDeDescadastro, tokenConfere } from "./descadastro";

async function limpar() {
  await db.delete(guestbookMessages);
  await db.delete(guests);
  await db.delete(groups);
  await limparSchemaDeTeste();
}
beforeEach(limpar);
afterAll(limpar);

let n = 0;

/** Um site publicado, com dono — o único estado que recebe resumo. */
async function sitePublicado() {
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
      slug: `site-${n}`,
      tier: "para-sempre",
      previewToken: `tok${n}${Date.now()}`,
      status: "published",
    })
    .returning();

  await db
    .insert(siteContent)
    .values({ siteId: site.id, coupleNames: "Ana & Pedro" });

  return { user, site };
}

const ontem = () => new Date(Date.now() - 86_400_000);

async function confirmou(siteId: string, lugares: number) {
  await db.insert(groups).values({
    siteId,
    slug: `g${n++}${Date.now()}`,
    seats: lugares,
    seatsConfirmed: lugares,
    respondedAt: ontem(),
  });
}

async function presenteou(siteId: string, precoCents: number | null) {
  const [g] = await db
    .insert(gifts)
    .values({
      siteId,
      category: "lua de mel",
      name: `Presente ${n++}`,
      priceCents: precoCents,
    })
    .returning();
  await db.insert(giftContributions).values({
    giftId: g.id,
    giftName: g.name,
    guestName: "Ana",
    createdAt: ontem(),
  });
}

describe("FR-002 / SC-001: semana parada não gera e-mail", () => {
  it("site sem movimento nenhum fica de fora", async () => {
    await sitePublicado();
    const r = await resumosDaSemana();
    expect(r).toHaveLength(1);
    expect(temMovimento(r[0])).toBe(false);
  });

  it("uma confirmação já é movimento", async () => {
    const { site } = await sitePublicado();
    await confirmou(site.id, 2);
    const [r] = await resumosDaSemana();
    expect(r.confirmacoes).toBe(2);
    expect(temMovimento(r)).toBe(true);
  });

  it("um recado sozinho também", async () => {
    const { site } = await sitePublicado();
    await db.insert(guestbookMessages).values({
      siteId: site.id,
      guestName: "Bia",
      message: "Que felicidade!",
      createdAt: ontem(),
    });
    const [r] = await resumosDaSemana();
    expect(r.recados).toBe(1);
    expect(temMovimento(r)).toBe(true);
  });

  it("movimento VELHO não conta", async () => {
    // Dez dias atrás está fora da janela de sete. Um resumo que conta o mês
    // inteiro repete a mesma notícia toda segunda.
    const { site } = await sitePublicado();
    await db.insert(groups).values({
      siteId: site.id,
      slug: `velho${Date.now()}`,
      seats: 3,
      seatsConfirmed: 3,
      respondedAt: new Date(Date.now() - 10 * 86_400_000),
    });
    const [r] = await resumosDaSemana();
    expect(r.confirmacoes).toBe(0);
    expect(temMovimento(r)).toBe(false);
  });
});

describe("FR-001 / SC-002: o valor em reais que a Enlace não tem", () => {
  it("cota de valor livre zera o total em reais", async () => {
    const { site } = await sitePublicado();
    await presenteou(site.id, 25000);
    await presenteou(site.id, null); // valor livre

    const [r] = await resumosDaSemana();
    expect(r.presentes).toBe(2);
    /* Somar só a de preço fixo daria R$ 250 e apresentaria como total — um
       número MENOR que o real, com cara de exato. */
    expect(r.presentesEmReais).toBeNull();
  });

  it("com todas de preço fixo, o total sai", async () => {
    const { site } = await sitePublicado();
    await presenteou(site.id, 25000);
    await presenteou(site.id, 18000);

    const [r] = await resumosDaSemana();
    expect(r.presentes).toBe(2);
    expect(r.presentesEmReais).toBe(43000);
  });

  it("sem presente nenhum, não há total", async () => {
    await sitePublicado();
    const [r] = await resumosDaSemana();
    expect(r.presentes).toBe(0);
    expect(r.presentesEmReais).toBeNull();
  });
});

describe("quem entra na lista", () => {
  it("site em prévia não recebe", async () => {
    /* Ele não tem convidado nenhum para confirmar presença — falar de um
       movimento que não podia existir. */
    const { site } = await sitePublicado();
    await db
      .update(sites)
      .set({ status: "preview" })
      .where(eq(sites.id, site.id));
    expect(await resumosDaSemana()).toHaveLength(0);
  });

  it("quem pediu para parar de receber sai da lista", async () => {
    const { user, site } = await sitePublicado();
    await confirmou(site.id, 2);
    expect(await resumosDaSemana()).toHaveLength(1);

    await pararResumoSemanal(user.id);
    expect(await resumosDaSemana()).toHaveLength(0);
  });

  it("parar duas vezes não quebra, e guarda a PRIMEIRA data", async () => {
    const { user } = await sitePublicado();
    await pararResumoSemanal(user.id);
    const [antes] = await db.select().from(users).where(eq(users.id, user.id));

    await pararResumoSemanal(user.id);
    const [depois] = await db.select().from(users).where(eq(users.id, user.id));

    // É ela que responde "desde quando?" quando alguém reclama de ter recebido.
    expect(depois.weeklyDigestOptOut?.getTime()).toBe(
      antes.weeklyDigestOptOut?.getTime()
    );
  });
});

describe("o que merece atenção", () => {
  it("conta os lugares SEM resposta, acumulado", async () => {
    const { site } = await sitePublicado();
    await confirmou(site.id, 2);
    await db.insert(groups).values({
      siteId: site.id,
      slug: `pend${Date.now()}`,
      seats: 5,
      seatsConfirmed: null,
    });

    const [r] = await resumosDaSemana();
    expect(r.confirmacoes).toBe(2);
    // `null` é "ainda não respondeu"; `0` seria "respondeu que não vai".
    expect(r.semResposta).toBe(5);
  });
});

describe("o link de descadastro", () => {
  it("confere só com o token certo", () => {
    const url = linkDeDescadastro("https://enlace.test", "u-1");
    const t = new URL(url).searchParams.get("t")!;

    expect(tokenConfere("u-1", t)).toBe(true);
    /* Prende o link a UM usuário: sem isso, dava para descadastrar qualquer
       casal iterando uuid. */
    expect(tokenConfere("u-2", t)).toBe(false);
    expect(tokenConfere("u-1", "falsificado")).toBe(false);
    expect(tokenConfere("u-1", "")).toBe(false);
  });

  it("aponta para a rota que existe", () => {
    const url = linkDeDescadastro("https://enlace.test/", "u-1");
    expect(url).toContain("/avisos/parar?u=u-1&t=");
    expect(url).not.toContain("//avisos");
  });
});
