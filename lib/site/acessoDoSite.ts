import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

/**
 * O crachá de quem já digitou a senha do site (prancha H4).
 *
 * ── Por que um cookie assinado, e não uma sessão ───────────────────────────
 *
 * O convidado **não tem conta** — é a regra §2.5 do produto. Criar sessão para
 * ele significaria criar linha no banco por pessoa que abre um convite, e
 * guardar dado de terceiro que ninguém pediu para guardar. O cookie assinado
 * resolve o mesmo problema sem tabela e sem dado: ele não CARREGA informação,
 * só prova que a senha certa foi digitada.
 *
 * ── A chave da assinatura é o próprio hash da senha ────────────────────────
 *
 * Nenhuma variável de ambiente nova, e uma propriedade que vale de graça:
 * **trocar a senha invalida todos os crachás**. O casal que descobre que a
 * senha vazou troca a senha e, no mesmo gesto, expulsa quem já tinha entrado —
 * que é exatamente o que ele espera que aconteça, e que uma sessão em tabela
 * só entregaria com uma varredura.
 *
 * O hash nunca sai do servidor (ver `getSiteViewBySlug`), então ele serve de
 * segredo. O que vai no cookie é o HMAC, não o hash.
 *
 * ── O que este cookie não é ────────────────────────────────────────────────
 *
 * Não é autenticação de pessoa: qualquer um com a senha entra, e é assim que
 * o casal quer — a senha veio escrita no convite de papel. É uma tranca de
 * porta, não um controle de acesso.
 */

/** Um cookie por site: entrar num casamento não abre o do vizinho. */
export function nomeDoCracha(siteId: string): string {
  return `enlace-acesso-${siteId}`;
}

function assinar(siteId: string, chave: string): string {
  return createHmac("sha256", chave).update(siteId).digest("hex");
}

/** Compara em tempo constante — comparação com `===` vazaria por timing. */
function iguais(a: string, b: string): boolean {
  const x = Buffer.from(a, "utf8");
  const y = Buffer.from(b, "utf8");
  if (x.length !== y.length) return false;
  return timingSafeEqual(x, y);
}

export async function temCracha(
  siteId: string,
  passwordHash: string | null
): Promise<boolean> {
  if (!passwordHash) return false;
  const jar = await cookies();
  const valor = jar.get(nomeDoCracha(siteId))?.value;
  if (!valor) return false;
  return iguais(valor, assinar(siteId, passwordHash));
}

export async function darCracha(
  siteId: string,
  passwordHash: string
): Promise<void> {
  const jar = await cookies();
  jar.set(nomeDoCracha(siteId), assinar(siteId, passwordHash), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // Trinta dias: o convidado abre o site do casamento várias vezes até o
    // dia, e pedir a senha de novo a cada visita faria ele desistir de olhar.
    maxAge: 60 * 60 * 24 * 30,
  });
}
