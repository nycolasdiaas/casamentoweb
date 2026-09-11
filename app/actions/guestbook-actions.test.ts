import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";

/**
 * As duas recusas do mural — e por que elas não podem dividir a mesma frase.
 *
 * A regra de produto não muda e está certa: recado só entra em site NO AR.
 * Numa prévia o mural existe para o casal ver o desenho, e um recado gravado
 * ali apareceria do nada no dia da publicação.
 *
 * O que a auditoria de 11/09/2026 encontrou (UX-012) foi o texto: as duas
 * situações — "esse endereço não existe" e "este site ainda não está no ar" —
 * respondiam **"Não achamos esse casamento"**. O casal que abria a própria
 * prévia para testar o mural lia que o casamento dele não existe, olhando
 * para ele na tela. E o recado digitado sumia junto.
 */

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true })),
  getClientIp: vi.fn(async () => "127.0.0.1"),
  RATE_LIMIT_MESSAGE: "muitas tentativas",
}));

import crypto from "crypto";
import { db } from "@/lib/db/client";
import { sites } from "@/lib/db/schema";
import { limparSchemaDeTeste } from "@/lib/db/testCleanup";
import { enviarRecadoAction } from "./guestbook-actions";

beforeEach(limparSchemaDeTeste);
afterAll(limparSchemaDeTeste);

async function criarSite(status: "preview" | "published") {
  const slug = `mural-${crypto.randomBytes(5).toString("hex")}`;
  await db.insert(sites).values({
    slug,
    tier: "para-sempre",
    status,
    previewToken: crypto.randomBytes(16).toString("base64url"),
  });
  return slug;
}

function recado(nome = "Tia Antônia", texto = "Que Deus abençoe vocês dois!") {
  const fd = new FormData();
  fd.set("guestName", nome);
  fd.set("message", texto);
  return fd;
}

describe("enviarRecadoAction", () => {
  it("no site em prévia, explica que o mural vale quando o site estiver no ar", async () => {
    const slug = await criarSite("preview");

    const r = await enviarRecadoAction(slug, recado());

    expect("error" in r).toBe(true);
    if (!("error" in r)) return;
    expect(r.error).toMatch(/no ar/i);
    expect(r.error).not.toMatch(/não achamos/i);
  });

  it("no endereço que não existe, continua dizendo que não achou o casamento", async () => {
    const r = await enviarRecadoAction("casamento-que-nao-existe", recado());

    expect("error" in r).toBe(true);
    if (!("error" in r)) return;
    expect(r.error).toMatch(/não achamos/i);
  });

  it("devolve o que o convidado digitou quando recusa", async () => {
    const slug = await criarSite("preview");

    const r = await enviarRecadoAction(
      slug,
      recado("Tia Antônia", "Levamos o bolo 🎂")
    );

    expect("error" in r).toBe(true);
    if (!("error" in r)) return;
    expect(r.valores?.guestName).toBe("Tia Antônia");
    expect(r.valores?.message).toBe("Levamos o bolo 🎂");
  });

  it("no site no ar, grava o recado", async () => {
    const slug = await criarSite("published");

    const r = await enviarRecadoAction(slug, recado());

    expect(r).toEqual({ ok: true });
  });
});
