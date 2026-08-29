import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth/userSession";

/**
 * A porta de entrada da compra, para quem não tem servidor por perto.
 *
 * ── Por que ela existe ─────────────────────────────────────────────────────
 *
 * `CtaPacote` resolve o destino pela sessão — `/conta/pedido/novo` para quem
 * já tem conta, `/conta/criar` para quem não tem — e conserta um defeito real:
 * quem estava logado clicava em comprar e caía na tela de CRIAR CONTA, a que
 * ele menos precisa ver.
 *
 * Mas `CtaPacote` é server component, e as seis prévias de
 * `/pacotes/estilos/<id>` são client components de ponta a ponta. Não há
 * fronteira de servidor onde encaixá-lo: a faixa EXEMPLO nasce dentro do
 * `TemplateChrome`, que é cliente.
 *
 * `/conta` não serve de atalho: ela manda quem não tem sessão para
 * `/conta/entrar`, e um visitante da vitrine que nunca comprou precisa de
 * `/conta/criar`. Mandá-lo para o login é o mesmo defeito, espelhado.
 *
 * Então a decisão vira uma rota. Um salto a mais, correto nos dois casos, e
 * qualquer componente de cliente pode apontar para cá com um `<a href>`.
 */
export async function GET() {
  const logado = Boolean(await getSessionUserId());
  redirect(logado ? "/conta/pedido/novo" : "/conta/criar");
}
