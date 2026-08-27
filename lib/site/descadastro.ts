import crypto from "crypto";

/**
 * O link de "parar de receber", assinado.
 *
 * ── Por que assinado, e não uma rota que pede login ────────────────────────
 *
 * Ninguém faz login para cancelar um e-mail. Quem quer parar de receber está
 * no cliente de e-mail, irritado, e um link que pede senha é um link que não
 * funciona — e um descadastro que não funciona vira denúncia de spam, que
 * custa o domínio inteiro.
 *
 * ── Por que não só o id do usuário na URL ──────────────────────────────────
 *
 * Porque aí qualquer um que descobrisse o formato poderia descadastrar
 * qualquer casal, iterando uuid. A assinatura prende o link a um usuário: sem
 * o segredo, não dá para forjar.
 *
 * ── Por que não expira ─────────────────────────────────────────────────────
 *
 * De propósito. Um "parar de receber" que expira é um "parar de receber" que
 * falha justamente para quem achou o e-mail velho na caixa — e a pessoa que
 * clica ali já decidiu. O risco de um link permanente é alguém descadastrar o
 * casal por engano ao reencaminhar o e-mail, e o custo disso é um resumo
 * semanal a menos, reversível pelo próprio painel.
 */

const DOMINIO = "descadastro-resumo";

function segredo(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) throw new Error("ADMIN_SESSION_SECRET is not set");
  return s;
}

function assinar(userId: string): string {
  return crypto
    .createHmac("sha256", segredo())
    .update(`${DOMINIO}|${userId}`)
    .digest("hex");
}

export function linkDeDescadastro(base: string, userId: string): string {
  const t = assinar(userId);
  return `${base.replace(/\/+$/, "")}/avisos/parar?u=${userId}&t=${t}`;
}

/** O token confere? Comparação em tempo constante. */
export function tokenConfere(userId: string, token: string): boolean {
  const esperado = assinar(userId);
  const a = Buffer.from(token, "utf8");
  const b = Buffer.from(esperado, "utf8");
  // `timingSafeEqual` exige o mesmo tamanho — token de tamanho errado já é não.
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
