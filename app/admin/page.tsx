import { redirect } from "next/navigation";

/**
 * `/admin` é a porta, não uma tela.
 *
 * Ela mostrava os convidados do casamento legado — o único que existia quando
 * o painel nasceu. Com a multi-tenancy, a primeira tela do admin passou a ser
 * a operação inteira, e o casamento ganhou endereço próprio em
 * `/admin/casamento`.
 *
 * 307 e não 308: temporário de propósito. Quando G2 (grupos e permissões)
 * existir, `/admin` pode voltar a ter conteúdo — e um 308 já teria ensinado o
 * navegador a nunca mais pedir.
 */
export default function AdminRaiz() {
  redirect("/admin/dashboard");
}
