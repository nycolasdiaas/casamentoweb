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
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { sites } from "@/lib/db/schema";
import {
  listarRecados,
  listarRecadosParaOCasal,
} from "@/lib/repositories/guestbook";
import { limparSchemaDeTeste } from "@/lib/db/testCleanup";
import { enviarRecadoAction } from "./guestbook-actions";

beforeEach(limparSchemaDeTeste);
afterAll(limparSchemaDeTeste);

async function criarSite(
  status: "preview" | "published",
  tier: "convite" | "site" | "para-sempre" = "para-sempre"
) {
  const slug = `mural-${crypto.randomBytes(5).toString("hex")}`;
  const [criado] = await db
    .insert(sites)
    .values({
      slug,
      tier,
      status,
      previewToken: crypto.randomBytes(16).toString("base64url"),
    })
    .returning();
  return { slug, id: criado.id };
}

function recado(nome = "Tia Antônia", texto = "Que Deus abençoe vocês dois!") {
  const fd = new FormData();
  fd.set("guestName", nome);
  fd.set("message", texto);
  return fd;
}

describe("enviarRecadoAction", () => {
  it("no site em prévia, explica que o mural vale quando o site estiver no ar", async () => {
    const { slug } = await criarSite("preview");

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
    const { slug } = await criarSite("preview");

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
    const { slug } = await criarSite("published");

    const r = await enviarRecadoAction(slug, recado());

    expect(r).toEqual({ ok: true, privado: false });
  });
});

/**
 * Para onde o recado vai — e por que a resposta não pode vir do formulário.
 *
 * O dono decidiu em 15/09/2026 que o botão "Recado para os noivos" existe nos
 * dois pacotes com confirmação de presença, mas o mural continua sendo do Para
 * Sempre: no Site do Casamento o recado é privado e o casal o lê no painel.
 *
 * O que estes testes seguram é a PROMESSA feita ao convidado. A tela do Site
 * do Casamento diz "ninguém mais vê"; se um recado escrito sob essa frase
 * aparecesse no mural, seria promessa quebrada com um terceiro que não tem
 * conta, não tem senha e não tem como apagar o que escreveu.
 */
describe("enviarRecadoAction · o pacote decide o destino", () => {
  it("no Para Sempre, o recado nasce público e vai para o mural", async () => {
    const { slug, id } = await criarSite("published", "para-sempre");

    const r = await enviarRecadoAction(slug, recado());

    expect(r).toEqual({ ok: true, privado: false });
    expect(await listarRecados(id)).toHaveLength(1);
  });

  it("no Site do Casamento, o recado nasce privado e o mural não o mostra", async () => {
    const { slug, id } = await criarSite("published", "site");

    const r = await enviarRecadoAction(slug, recado());

    expect(r).toEqual({ ok: true, privado: true });
    // O mural é o que o convidado veria no site. Vazio.
    expect(await listarRecados(id)).toHaveLength(0);
    // O painel do casal é onde ele existe.
    const doCasal = await listarRecadosParaOCasal(id);
    expect(doCasal).toHaveLength(1);
    expect(doCasal[0].privado).toBe(true);
  });

  it("o privado continua fora do mural mesmo num site que tem mural", async () => {
    /* O caso que parece impossível e não é: um site do Site do Casamento que
       vira Para Sempre. O recado antigo foi escrito sob a promessa de que só
       o casal leria, e mudar de pacote não pode publicá-lo do dia para a
       noite. Por isso o filtro do mural olha a marca da LINHA, não o tier. */
    const { slug, id } = await criarSite("published", "site");
    await enviarRecadoAction(slug, recado());

    await db
      .update(sites)
      .set({ tier: "para-sempre" })
      .where(eq(sites.id, id));

    expect(await listarRecados(id)).toHaveLength(0);
    expect(await listarRecadosParaOCasal(id)).toHaveLength(1);
  });
});
