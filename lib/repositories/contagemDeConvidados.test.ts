/**
 * Os dois números de gente da aba Convites — spec `painel-casal/001`, FR-002.
 *
 * ── Por que este teste existe ──────────────────────────────────────────────
 *
 * A resposta do RSVP vive em DOIS lugares desde a migração 0016, e os dois são
 * verdade: `guests.rsvp_status` (um convidado por linha, onde as 23
 * confirmações do casamento de 16/10/2026 nasceram) e `groups.seats_confirmed`
 * (quantos lugares do grupo vão, que é o que `/rsvp/<slug>` grava hoje).
 *
 * O painel e as métricas leem o segundo. Uma tela nova que lesse o primeiro
 * criaria um TERCEIRO número — e três números para a mesma pergunta é pior que
 * qualquer um dos três. Este teste prende a contagem à fonte certa: mexer em
 * `rsvp_status` sem mexer em `seats_confirmed` não pode mudar nada aqui.
 */

import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { groups, guests, sites } from "@/lib/db/schema";
import { createTestSite } from "./testSite";
import { createGroup } from "./groups";
import { contagemDeConvidados } from "./siteMetrics";

let siteId: string;

const limpar = async () => {
  await db.delete(guests);
  await db.delete(groups);
  await db.delete(sites);
};

beforeEach(async () => {
  await limpar();
  siteId = (await createTestSite()).id;
});

afterAll(limpar);

describe("contagemDeConvidados", () => {
  it("site sem grupo nenhum devolve zero, não nulo", async () => {
    // `sum` de conjunto vazio é null no Postgres. Um `null` chegando à tela
    // viraria "NaN convidados".
    expect(await contagemDeConvidados(siteId)).toEqual({
      convidados: 0,
      confirmados: 0,
    });
  });

  it("SC-001: soma os lugares de todos os grupos do site", async () => {
    await createGroup({ siteId, guestNames: ["Ana", "Bruno"] });
    await createGroup({ siteId, guestNames: ["Carla"] });

    const { convidados, confirmados } = await contagemDeConvidados(siteId);
    expect(convidados).toBe(3);
    // Ninguém respondeu ainda: `seats_confirmed` é null, e null não soma nem
    // subtrai — grupo sem resposta não conta como "não vai".
    expect(confirmados).toBe(0);
  });

  it("SC-001: confirmados sai de `seats_confirmed`, somando lugares", async () => {
    const g1 = await createGroup({ siteId, guestNames: ["Ana", "Bruno"] });
    const g2 = await createGroup({ siteId, guestNames: ["Carla", "Davi"] });

    await db
      .update(groups)
      .set({ seatsConfirmed: 2 })
      .where(eq(groups.id, g1.id));
    await db
      .update(groups)
      .set({ seatsConfirmed: 1 })
      .where(eq(groups.id, g2.id));

    expect(await contagemDeConvidados(siteId)).toEqual({
      convidados: 4,
      confirmados: 3,
    });
  });

  it("SC-002: mexer em `guests.rsvp_status` NÃO muda o número", async () => {
    const g = await createGroup({ siteId, guestNames: ["Ana", "Bruno"] });
    await db.update(groups).set({ seatsConfirmed: 1 }).where(eq(groups.id, g.id));

    const antes = await contagemDeConvidados(siteId);

    // A outra fonte de verdade, mexida sozinha. Isto é exatamente o que
    // aconteceria se alguém confirmasse pelo modelo antigo.
    await db
      .update(guests)
      .set({ rsvpStatus: "confirmed" })
      .where(eq(guests.groupId, g.id));

    expect(await contagemDeConvidados(siteId)).toEqual(antes);
    expect(antes.confirmados).toBe(1);
  });

  it("conta só o site pedido — multi-tenant", async () => {
    await createGroup({ siteId, guestNames: ["Ana"] });
    const outro = (await createTestSite()).id;
    await createGroup({ siteId: outro, guestNames: ["Zé", "Bia", "Rui"] });

    expect((await contagemDeConvidados(siteId)).convidados).toBe(1);
    expect((await contagemDeConvidados(outro)).convidados).toBe(3);
  });
});
