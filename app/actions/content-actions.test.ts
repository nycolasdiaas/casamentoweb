import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";

/**
 * O que a tela de conteúdo devolve quando recusa um salvamento.
 *
 * ── O defeito que isto tranca ──────────────────────────────────────────────
 *
 * Em 11/09/2026 a auditoria E2E preencheu os onze campos do Conteúdo — locais,
 * endereços, horários, traje e a história inteira —, digitou `abc` na chave
 * Pix e salvou. A mensagem sobre a chave apareceu certa. E o formulário voltou
 * ao último estado salvo: a história de amor sumiu, os endereços sumiram, o
 * traje sumiu (UX-004).
 *
 * A causa não estava na validação, que está correta e deve continuar recusando
 * chave Pix inteira em vez de gravar "quase certo". Estava no que a action
 * devolvia: só a mensagem. Sem os valores, o React reinicia um formulário
 * não-controlado com o `defaultValue` — isto é, com o que estava salvo antes.
 *
 * Estes testes são sobre o CONTRATO da action: recusar devolve o que foi
 * enviado. Se alguém voltar a devolver só `{ error }`, a tela volta a apagar
 * o trabalho do casal, e nenhum teste de componente pegaria isso.
 */

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
}));

const sessao = { userId: null as string | null };
vi.mock("@/lib/auth/userSession", () => ({
  getSessionUserId: vi.fn(async () => sessao.userId),
}));

import crypto from "crypto";
import { db } from "@/lib/db/client";
import { siteContent, sites, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { limparSchemaDeTeste } from "@/lib/db/testCleanup";
import { saveSiteContentAction } from "./content-actions";

beforeEach(limparSchemaDeTeste);
afterAll(limparSchemaDeTeste);

let contador = 0;

/** Um site que PERTENCE a um casal — a action confere a posse a cada chamada. */
async function siteDoCasal() {
  const [user] = await db
    .insert(users)
    .values({
      name: "Casal de Teste",
      email: `casal-conteudo${contador++}@exemplo.invalido`,
      passwordHash: "x:y",
    })
    .returning();

  const [site] = await db
    .insert(sites)
    .values({
      userId: user.id,
      slug: `conteudo-${crypto.randomBytes(5).toString("hex")}`,
      tier: "para-sempre",
      status: "preview",
      previewToken: crypto.randomBytes(16).toString("base64url"),
    })
    .returning();

  return { site, userId: user.id };
}

/** Os campos que o casal preencheu antes de errar a chave Pix. */
function formularioCheio(siteId: string, pixKey: string): FormData {
  const fd = new FormData();
  fd.set("siteId", siteId);
  fd.set("coupleNames", "Ana & Pedro");
  fd.set("weddingDate", "2027-09-19");
  fd.set("weddingTime", "16:30");
  fd.set("ceremonyVenue", "Igreja São Sebastião");
  fd.set("ceremonyAddress", "Praça da Sé, 100 — Sé, São Paulo/SP");
  fd.set("receptionVenue", "Espaço Villa Olívia");
  fd.set("receptionAddress", "Rua das Palmeiras, 1.250 — Barueri/SP");
  fd.set("receptionTime", "19:00");
  fd.set("dressCode", "Esporte fino");
  fd.set("story", "A gente se conheceu numa fila de padaria.");
  fd.set("giftMessage", "A presença de vocês já é o maior presente.");
  fd.set("pixKey", pixKey);
  return fd;
}

describe("saveSiteContentAction — recusar não pode custar o que foi digitado", () => {
  it("devolve os onze campos quando a chave Pix é inválida", async () => {
    const { site, userId } = await siteDoCasal();
    sessao.userId = userId;

    const r = await saveSiteContentAction(
      undefined,
      formularioCheio(site.id, "abc")
    );

    expect(r && "error" in r).toBe(true);
    if (!r || !("error" in r)) return;

    expect(r.error).toMatch(/chave/i);
    expect(r.valores.story).toBe("A gente se conheceu numa fila de padaria.");
    expect(r.valores.ceremonyVenue).toBe("Igreja São Sebastião");
    expect(r.valores.ceremonyAddress).toBe("Praça da Sé, 100 — Sé, São Paulo/SP");
    expect(r.valores.receptionVenue).toBe("Espaço Villa Olívia");
    expect(r.valores.receptionTime).toBe("19:00");
    expect(r.valores.dressCode).toBe("Esporte fino");
    expect(r.valores.giftMessage).toBe("A presença de vocês já é o maior presente.");
    // O que o casal digitou de errado volta também: é o campo que ele precisa
    // corrigir, e some-lo obrigaria a adivinhar o que estava lá.
    expect(r.valores.pixKey).toBe("abc");
  });

  it("a recusa continua inteira — nada é gravado com a chave inválida", async () => {
    const { site, userId } = await siteDoCasal();
    sessao.userId = userId;

    await saveSiteContentAction(undefined, formularioCheio(site.id, "abc"));

    const [conteudo] = await db
      .select()
      .from(siteContent)
      .where(eq(siteContent.siteId, site.id));

    expect(conteudo?.story ?? null).toBeNull();
    expect(conteudo?.pixKey ?? null).toBeNull();
  });

  it("com a chave corrigida, salva tudo que estava na tela", async () => {
    const { site, userId } = await siteDoCasal();
    sessao.userId = userId;

    const r = await saveSiteContentAction(
      undefined,
      formularioCheio(site.id, "3f9a1c2e-5b6d-4e7f-8a9b-0c1d2e3f4a5b")
    );

    expect(r).toEqual({ saved: true });

    const [conteudo] = await db
      .select()
      .from(siteContent)
      .where(eq(siteContent.siteId, site.id));

    expect(conteudo.story).toBe("A gente se conheceu numa fila de padaria.");
    expect(conteudo.ceremonyVenue).toBe("Igreja São Sebastião");
    expect(conteudo.dressCode).toBe("Esporte fino");
  });

  it("um campo esvaziado de propósito volta vazio, e não ressuscita", async () => {
    const { site, userId } = await siteDoCasal();
    sessao.userId = userId;

    const fd = formularioCheio(site.id, "3f9a1c2e-5b6d-4e7f-8a9b-0c1d2e3f4a5b");
    await saveSiteContentAction(undefined, fd);

    const apagando = formularioCheio(site.id, "abc");
    apagando.set("story", "");
    const r = await saveSiteContentAction(undefined, apagando);

    expect(r && "error" in r && r.valores.story).toBe("");
  });
});
