import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
}));

import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  groups,
  guests,
  loginAttempts,
  siteContent,
  sites,
} from "@/lib/db/schema";
import { createGroup, getRsvpViewBySlug } from "@/lib/repositories/groups";
import { createTestSite } from "@/lib/repositories/testSite";
import { responderRsvpAction, submitRsvpAction } from "./rsvp-actions";

let siteId: string;

/* `site_content` entra na limpeza porque os testes de prazo escrevem nela, e
   `sites` não pode ser apagado antes (a FK é `on delete cascade`, mas a ordem
   explícita deixa o teste legível e independente da configuração da FK). */
beforeEach(async () => {
  await db.delete(guests);
  await db.delete(groups);
  await db.delete(loginAttempts);
  await db.delete(siteContent);
  await db.delete(sites);
  siteId = (await createTestSite()).id;
});

afterAll(async () => {
  await db.delete(guests);
  await db.delete(groups);
  await db.delete(loginAttempts);
  await db.delete(siteContent);
  await db.delete(sites);
});

describe("submitRsvpAction", () => {
  it("updates the guest's rsvp status", async () => {
    const group = await createGroup({ siteId, guestNames: ["Ana"] });
    const [ana] = group.guests;

    const result = await submitRsvpAction(group.slug, ana.id, "confirmed");

    expect(result.rsvpStatus).toBe("confirmed");
  });

  it("throws for an unknown guest id", async () => {
    const group = await createGroup({ siteId, guestNames: ["Ana"] });

    await expect(
      submitRsvpAction(
        group.slug,
        "00000000-0000-0000-0000-000000000000",
        "declined"
      )
    ).rejects.toThrow();
  });

  it("throws when the guest belongs to a different group's slug", async () => {
    const groupA = await createGroup({ siteId, guestNames: ["Ana"] });
    const groupB = await createGroup({ siteId, guestNames: ["Bruno"] });

    await expect(
      submitRsvpAction(groupA.slug, groupB.guests[0].id, "confirmed")
    ).rejects.toThrow();
  });
});

/* ==========================================================================
   responderRsvpAction — a resposta do GRUPO (prancha F4, migração 0016)
   ==========================================================================

   Esta action é a que `/rsvp/<slug>` usa desde a 0016. Os testes acima
   continuam cobrindo `submitRsvpAction`, que segue existindo para o modelo por
   convidado — os dois convivem, e é isso que faz as 23 confirmações reais
   sobreviverem à troca.

   A regra que quase todo teste aqui protege: **esta action nunca lança para o
   convidado.** Falha vira `{ erro }` e a tela continua de pé. Um `throw` numa
   rota sem conta, sem suporte e sem volta é uma confirmação perdida. */

async function comPrazo(siteId: string, deadline: string | null) {
  await db
    .insert(siteContent)
    .values({ siteId, coupleNames: "Ana & João", rsvpDeadline: deadline })
    .onConflictDoUpdate({
      target: siteContent.siteId,
      set: { rsvpDeadline: deadline },
    });
}

function form(campos: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(campos)) fd.append(k, v);
  return fd;
}

describe("responderRsvpAction", () => {
  it("grava quantos vão, os nomes e o recado", async () => {
    const grupo = await createGroup({
      siteId,
      label: "Família Costa",
      guestNames: ["Roberto", "Helena"],
    });

    const resultado = await responderRsvpAction(grupo.slug, undefined, form({
      vai: "sim",
      lugares: "2",
      nomes: "Roberto Costa, Helena Costa",
      recado: "Que alegria!",
    }));

    expect(resultado).toEqual({ ok: true, lugares: 2 });

    const salvo = await getRsvpViewBySlug(grupo.slug);
    expect(salvo?.seatsConfirmed).toBe(2);
    expect(salvo?.attendingNames).toBe("Roberto Costa, Helena Costa");
    expect(salvo?.message).toBe("Que alegria!");
    expect(salvo?.respondedAt).not.toBeNull();
  });

  it("grava 0 lugares quando a resposta é não — e 0 é diferente de sem resposta", async () => {
    const grupo = await createGroup({ siteId, guestNames: ["Ana", "Bruno"] });

    const antes = await getRsvpViewBySlug(grupo.slug);
    expect(antes?.seatsConfirmed).toBeNull();

    await responderRsvpAction(grupo.slug, undefined, form({
      vai: "nao",
      // Manda lugares de propósito: o formulário pode ter o campo preenchido
      // quando a pessoa troca de ideia. "Não vou" não pode virar "vamos em 2".
      lugares: "2",
      nomes: "Ana, Bruno",
    }));

    const depois = await getRsvpViewBySlug(grupo.slug);
    expect(depois?.seatsConfirmed).toBe(0);
    expect(depois?.attendingNames).toBeNull();
  });

  it("recusa mais lugares do que os reservados, sem gravar nada", async () => {
    const grupo = await createGroup({ siteId, guestNames: ["Ana"] });

    const resultado = await responderRsvpAction(grupo.slug, undefined, form({
      vai: "sim",
      lugares: "5",
    }));

    expect(resultado).toHaveProperty("erro");
    const salvo = await getRsvpViewBySlug(grupo.slug);
    expect(salvo?.seatsConfirmed).toBeNull();
  });

  it("recusa zero lugares quando a resposta é sim", async () => {
    const grupo = await createGroup({ siteId, guestNames: ["Ana", "Bruno"] });

    const resultado = await responderRsvpAction(grupo.slug, undefined, form({
      vai: "sim",
      lugares: "0",
    }));

    expect(resultado).toHaveProperty("erro");
  });

  it("recusa depois do prazo, mesmo com POST direto", async () => {
    await comPrazo(siteId, "2020-01-01");
    const grupo = await createGroup({ siteId, guestNames: ["Ana"] });

    const resultado = await responderRsvpAction(grupo.slug, undefined, form({
      vai: "sim",
      lugares: "1",
    }));

    expect(resultado).toHaveProperty("erro");
    const salvo = await getRsvpViewBySlug(grupo.slug);
    expect(salvo?.seatsConfirmed).toBeNull();
  });

  it("aceita NO DIA do prazo — o prazo vale o dia inteiro", async () => {
    const hoje = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Fortaleza",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    await comPrazo(siteId, hoje);
    const grupo = await createGroup({ siteId, guestNames: ["Ana"] });

    const resultado = await responderRsvpAction(grupo.slug, undefined, form({
      vai: "sim",
      lugares: "1",
    }));

    expect(resultado).toEqual({ ok: true, lugares: 1 });
  });

  it("devolve erro em vez de lançar quando o slug não existe", async () => {
    const resultado = await responderRsvpAction("nao-existe", undefined, form({
      vai: "sim",
      lugares: "1",
    }));

    expect(resultado).toHaveProperty("erro");
  });

  it("deixa responder de novo — o 'Editar resposta' do desenho", async () => {
    const grupo = await createGroup({ siteId, guestNames: ["Ana", "Bruno"] });

    await responderRsvpAction(grupo.slug, undefined, form({
      vai: "sim", lugares: "2", nomes: "Ana, Bruno",
    }));
    await responderRsvpAction(grupo.slug, undefined, form({
      vai: "sim", lugares: "1", nomes: "Só a Ana",
    }));

    const salvo = await getRsvpViewBySlug(grupo.slug);
    expect(salvo?.seatsConfirmed).toBe(1);
    expect(salvo?.attendingNames).toBe("Só a Ana");
  });

  it("NÃO toca em `guests` — o modelo antigo sobrevive à resposta nova", async () => {
    const grupo = await createGroup({ siteId, guestNames: ["Ana", "Bruno"] });

    await responderRsvpAction(grupo.slug, undefined, form({
      vai: "sim", lugares: "2",
    }));

    const doGrupo = await db
      .select()
      .from(guests)
      .where(eq(guests.groupId, grupo.id));
    expect(doGrupo).toHaveLength(2);
    expect(doGrupo.every((g) => g.rsvpStatus === "pending")).toBe(true);
  });
});

describe("createGroup", () => {
  it("nasce com os lugares iguais à quantidade de nomes", async () => {
    const grupo = await createGroup({ siteId, guestNames: ["Ana", "Bruno", "Caio"] });
    const view = await getRsvpViewBySlug(grupo.slug);
    expect(view?.seats).toBe(3);
  });
});
