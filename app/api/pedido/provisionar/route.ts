import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSessionUserId } from "@/lib/auth/userSession";
import { getOrderById } from "@/lib/repositories/orders";
import { getUserById } from "@/lib/repositories/users";
import { getSiteByOrderId } from "@/lib/repositories/sites";
import { provisionSiteForOrder } from "@/lib/site/provision";
import { baseUrlOuNulo } from "@/lib/baseUrl";

/**
 * Cria o site que faltou — a rede de segurança do provisionamento.
 *
 * O QUE ISTO CONSERTA: `submitOrderAction` provisiona no mesmo request do
 * envio, e o pedido nasce em `preview_ready`. Quando essa transação falha (o
 * banco é remoto, uma ida custa ~171 ms, e qualquer soluço derruba), o pedido
 * fica em `submitted` PARA SEMPRE: sem site, sem prévia, e sem nada que tente
 * de novo. O casal via o acompanhamento dizendo "a prévia já está pronta" ao
 * lado de um aviso de que ela não existe.
 *
 * Por que uma ROTA e não a própria tela: provisionar é escrita, e escrita não
 * pode acontecer durante o render de uma página. É o mesmo motivo — e o mesmo
 * desenho — de `/api/pagamento/confirmar`, que publica o site: a tela detecta
 * o estado inconsistente e REDIRECIONA para quem sabe consertar.
 *
 * `?provisionamento=erro` na volta corta o laço. Sem isso, uma falha
 * persistente faria a tela redirecionar para cá indefinidamente.
 *
 * Reprovisionar é seguro: `provisionSiteForOrder` procura um site existente
 * antes de criar e devolve o que achou. Duas abas abertas não geram dois
 * sites.
 */
export async function GET(request: Request) {
  const orderId = new URL(request.url).searchParams.get("pedido") ?? "";
  const destino = `/conta/pedidos/${orderId}`;

  const userId = await getSessionUserId();
  if (!userId) redirect("/conta/entrar");

  const order = await getOrderById(orderId);
  // Mesma resposta para "não existe" e "não é seu" — quem sonda id alheio não
  // aprende nada com o redirecionamento.
  if (!order || order.userId !== userId) redirect("/conta/pedidos");

  // Rascunho ainda está no questionário; não há o que provisionar.
  if (order.status === "draft") redirect(`/conta/pedido/${order.id}`);

  // Já existe? Então outra aba (ou o próprio envio) resolveu enquanto isso.
  const jaTem = await getSiteByOrderId(order.id);
  if (jaTem) {
    revalidatePath(destino);
    redirect(destino);
  }

  const user = await getUserById(userId);
  if (!user) redirect("/conta/entrar");

  /* Sem endereço público descoberto o site nasce igual, só sem o link da
     prévia — a tela do casal monta esse link pelo slug.

     Até 11/09/2026 esta linha era `await getBaseUrl()`, que LANÇA. Como a
     rota inteira caía, o casal que chegava aqui (isto é: todo casal cujo
     envio falhou) via uma tela de erro do navegador com HTTP 500, e o site
     nunca era criado. Ver UX-001. */
  const baseUrl = await baseUrlOuNulo();
  const resultado = await provisionSiteForOrder(
    order,
    user.name,
    baseUrl ?? undefined
  );

  if (!resultado.ok) {
    console.error(
      `[provisionar] pedido ${order.id} não provisionado: ${resultado.reason}`
    );
    redirect(`${destino}?provisionamento=erro`);
  }

  revalidatePath(destino);
  revalidatePath("/conta");
  redirect(destino);
}
