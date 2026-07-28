import crypto from "crypto";
import { db } from "@/lib/db/client";
import { sites } from "@/lib/db/schema";

/**
 * Cria um site descartável para os testes. Cada chamada devolve um tenant
 * novo — é assim que os testes de isolamento conseguem provar que a consulta
 * de um casal não enxerga o dado do outro.
 *
 * Só para teste: nunca importar em código de produção.
 */
export async function createTestSite(slug?: string) {
  const unique = crypto.randomBytes(6).toString("hex");
  const [site] = await db
    .insert(sites)
    .values({
      slug: slug ?? `test-${unique}`,
      tier: "para-sempre",
      status: "published",
      previewToken: crypto.randomBytes(16).toString("base64url"),
    })
    .returning();
  return site;
}
