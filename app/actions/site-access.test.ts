import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";

/**
 * H4 · a tranca do site do casal.
 *
 * Isto é controle de acesso, então os testes cobrem o que dá errado, não o
 * caminho feliz: senha errada, senha vazia, site sem tranca, crachá de outro
 * casamento e crachá assinado com a senha antiga.
 *
 * ── O que está mockado, e por quê ──────────────────────────────────────────
 *
 * `next/headers` não existe fora do runtime do Next. O pote de cookies aqui é
 * um `Map`, e é ele que permite provar a propriedade que interessa: o valor
 * gravado é o HMAC, e ele deixa de valer quando a senha muda.
 */

const pote = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (nome: string) =>
      pote.has(nome) ? { name: nome, value: pote.get(nome)! } : undefined,
    set: (nome: string, valor: string) => {
      pote.set(nome, valor);
    },
  }),
  headers: async () => new Map(),
}));

import { db } from "@/lib/db/client";
import { loginAttempts, sites } from "@/lib/db/schema";
import { createTestSite } from "@/lib/repositories/testSite";
import { getSiteAccess, setSiteAccess } from "@/lib/repositories/sites";
import { hashPassword } from "@/lib/auth/password";
import { temCracha } from "@/lib/site/acessoDoSite";
import { entrarNoSiteAction } from "./site-actions";

let siteId: string;
let slug: string;

beforeEach(async () => {
  pote.clear();
  await db.delete(loginAttempts);
  await db.delete(sites);
  const site = await createTestSite();
  siteId = site.id;
  slug = site.slug;
});

afterAll(async () => {
  await db.delete(loginAttempts);
  await db.delete(sites);
});

async function protegerCom(senha: string) {
  await setSiteAccess(siteId, "password", await hashPassword(senha));
}

describe("entrarNoSiteAction", () => {
  it("com a senha certa, dá o crachá", async () => {
    await protegerCom("1610");

    const erro = await entrarNoSiteAction(slug, undefined, senha("1610"));

    expect(erro).toBeUndefined();
    const acesso = await getSiteAccess(slug);
    expect(await temCracha(siteId, acesso!.accessPasswordHash)).toBe(true);
  });

  it("com a senha errada, não dá crachá nenhum", async () => {
    await protegerCom("1610");

    const resultado = await entrarNoSiteAction(slug, undefined, senha("0000"));

    expect(resultado).toHaveProperty("erro");
    const acesso = await getSiteAccess(slug);
    expect(await temCracha(siteId, acesso!.accessPasswordHash)).toBe(false);
  });

  it("com senha vazia, não entra", async () => {
    await protegerCom("1610");

    const resultado = await entrarNoSiteAction(slug, undefined, senha(""));

    expect(resultado).toHaveProperty("erro");
  });

  it("num site SEM tranca, não dá crachá — e a mensagem é a mesma da senha errada", async () => {
    // Site público: `access_mode` continua "public". Uma mensagem diferente
    // aqui diria a quem sonda quais endereços têm proteção ligada.
    const resultado = await entrarNoSiteAction(slug, undefined, senha("1610"));

    expect(resultado).toEqual({
      erro: "Essa senha não confere. Confira o convite e tente de novo.",
    });
  });

  it("trocar a senha invalida o crachá de quem já tinha entrado", async () => {
    await protegerCom("1610");
    await entrarNoSiteAction(slug, undefined, senha("1610"));

    const antes = await getSiteAccess(slug);
    expect(await temCracha(siteId, antes!.accessPasswordHash)).toBe(true);

    // O casal descobre que a senha vazou e troca.
    await protegerCom("2211");

    const depois = await getSiteAccess(slug);
    expect(await temCracha(siteId, depois!.accessPasswordHash)).toBe(false);
  });

  it("o crachá de um casamento não abre o de outro", async () => {
    await protegerCom("1610");
    await entrarNoSiteAction(slug, undefined, senha("1610"));

    const outro = await createTestSite();
    await setSiteAccess(outro.id, "password", await hashPassword("1610"));
    const acessoDoOutro = await getSiteAccess(outro.slug);

    // Mesma senha, sites diferentes: o cookie é por site.
    expect(
      await temCracha(outro.id, acessoDoOutro!.accessPasswordHash)
    ).toBe(false);
  });
});

describe("setSiteAccess", () => {
  it("voltar para público APAGA o hash — segredo que ninguém usa não fica guardado", async () => {
    await protegerCom("1610");
    expect((await getSiteAccess(slug))!.accessPasswordHash).not.toBeNull();

    await setSiteAccess(siteId, "public");

    const acesso = await getSiteAccess(slug);
    expect(acesso!.accessMode).toBe("public");
    expect(acesso!.accessPasswordHash).toBeNull();
  });

  it("religar a proteção sem senha nova mantém a senha que já existia", async () => {
    await protegerCom("1610");
    const original = (await getSiteAccess(slug))!.accessPasswordHash;

    await setSiteAccess(siteId, "password");

    expect((await getSiteAccess(slug))!.accessPasswordHash).toBe(original);
  });
});

function senha(valor: string): FormData {
  const fd = new FormData();
  fd.append("senha", valor);
  return fd;
}
