import { describe, it, expect, afterAll, beforeEach } from "vitest";
import { db } from "@/lib/db/client";
import { sites, groups, guests } from "@/lib/db/schema";
import { findGroupByGuestName } from "./findGroupByGuestName";
import { limparSchemaDeTeste } from "@/lib/db/testCleanup";
import { sql } from "drizzle-orm";

/**
 * A busca do convidado que perdeu o link.
 *
 * O caso que mais importa aqui é o NEGATIVO: busca parcial não pode devolver
 * nada. Se devolvesse, esta página viraria a lista de convidados do casamento
 * para qualquer um com o endereço do site.
 */
describe("findGroupByGuestName", () => {
  let siteA = "";
  let siteB = "";

  beforeEach(async () => {
    // `limparSchemaDeTeste` NÃO apaga groups/guests — são as tabelas de RSVP,
    // que ele deixa em paz de propósito. Como este teste cria as duas, ele
    // limpa as duas, antes do resto (a FK de groups aponta para sites).
    await db.execute(sql`delete from guests`);
    await db.execute(sql`delete from groups`);
    await limparSchemaDeTeste();

    const [a] = await db
      .insert(sites)
      .values({ slug: "casal-a", tier: "para-sempre", status: "published", previewToken: "ta" })
      .returning({ id: sites.id });
    const [b] = await db
      .insert(sites)
      .values({ slug: "casal-b", tier: "para-sempre", status: "published", previewToken: "tb" })
      .returning({ id: sites.id });
    siteA = a.id;
    siteB = b.id;

    const [ga] = await db
      .insert(groups)
      .values({ slug: "grupoA", siteId: siteA, label: "Família Souza" })
      .returning({ id: groups.id });
    const [gb] = await db
      .insert(groups)
      .values({ slug: "grupoB", siteId: siteB, label: "Outra família" })
      .returning({ id: groups.id });

    await db.insert(guests).values([
      { groupId: ga.id, name: "Maria Souza" },
      { groupId: ga.id, name: "João Souza" },
      { groupId: gb.id, name: "Maria Souza" },
    ]);
  });

  // Limpa DEPOIS também: `limparSchemaDeTeste` não toca em groups/guests, e
  // uma linha de grupo esquecida aqui derruba a limpeza de TODA suíte que
  // rodar em seguida — a FK de groups impede o delete de sites. Foi o que
  // aconteceu: 59 falhas em quatro arquivos que não têm nada com este.
  afterAll(async () => {
    await db.execute(sql`delete from guests`);
    await db.execute(sql`delete from groups`);
  });

  it("acha pelo nome completo", async () => {
    expect(await findGroupByGuestName(siteA, "Maria Souza")).toEqual({
      slug: "grupoA",
    });
  });

  it("ignora caixa e espaço sobrando", async () => {
    expect(await findGroupByGuestName(siteA, "  maria   souza ")).toEqual({
      slug: "grupoA",
    });
  });

  it("NÃO acha por pedaço do nome — isso vazaria a lista", async () => {
    expect(await findGroupByGuestName(siteA, "Maria")).toBeNull();
    expect(await findGroupByGuestName(siteA, "Souza")).toBeNull();
  });

  it("recusa busca curta demais", async () => {
    expect(await findGroupByGuestName(siteA, "Ma")).toBeNull();
  });

  it("não atravessa sites: a Maria de um casal não acha o convite da outra", async () => {
    expect(await findGroupByGuestName(siteB, "Maria Souza")).toEqual({
      slug: "grupoB",
    });
    expect(await findGroupByGuestName(siteB, "João Souza")).toBeNull();
  });
});
