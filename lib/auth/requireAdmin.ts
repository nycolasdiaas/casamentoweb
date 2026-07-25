import { redirect } from "next/navigation";
import { getSessionAdminId } from "@/lib/auth/session";

/**
 * Guard server-side para páginas /admin. Defesa em profundidade: as páginas
 * NÃO devem confiar só no middleware (proxy.ts) para o controle de acesso —
 * se o middleware for contornado, a página ainda recusa. Chame no topo de
 * cada page.tsx do admin (menos /admin/login).
 */
export async function requireAdmin(): Promise<string> {
  const adminId = await getSessionAdminId();
  if (!adminId) redirect("/admin/login");
  return adminId;
}
