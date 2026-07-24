import { redirect } from "next/navigation";

// Rota antiga: leva para o formulário de novo pedido.
export default function OrderRedirectPage() {
  redirect("/conta/pedido/novo");
}
